import nodemailer from 'nodemailer';

let transporter = null;
let smtpFailureCount = 0;
let smtpDisabled = false;
let lastSmtpFailureAt = 0;

const SMTP_BREAKER_RESET_MS = 2 * 60 * 1000; // 2 minutes
const SMTP_FAILURE_THRESHOLD = parseInt(process.env.SMTP_FAILURE_THRESHOLD || '3', 10);

// Local SMTP config (to avoid mutating process.env)
const defaultSmtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: String(process.env.SMTP_SECURE || (process.env.SMTP_PORT === '465')).toLowerCase() === 'true',
  user: process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.EMAIL_USER,
  pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD,
};

function getTransporter(smtpConfig = defaultSmtpConfig) {
  if (smtpDisabled) {
    if (Date.now() - lastSmtpFailureAt > SMTP_BREAKER_RESET_MS) {
      console.warn('[mailer] SMTP circuit breaker cooldown elapsed. Trying again...');
      smtpFailureCount = 0;
      smtpDisabled = false;
    } else {
      throw new Error('SMTP disabled by circuit breaker');
    }
  }

  if (transporter) return transporter;

  const { host, port, secure, user, pass } = smtpConfig;

  transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    keepAlive: true,
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: {
      rejectUnauthorized: false,
      servername: host,
      minVersion: 'TLSv1.2',
    },
  });

  transporter.verify()
    .then(() => console.info('[mailer] SMTP verified'))
    .catch(err => console.warn('[mailer] SMTP verify failed:', err?.message || err));
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER || 'replyearnbycode@gmail.com';
  // Resend removed by request
  const RESEND_API_KEY = '';
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
  const SMTP_PREFERRED = String(process.env.SMTP_PREFERRED || '').toLowerCase() === 'true';
  const GMAIL_API_ENABLED = String(process.env.GMAIL_API_ENABLED || '').toLowerCase() === 'true';
  const GMAIL_USER = process.env.GMAIL_USER || from;
  const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
  const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
  const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';

  const recipients = Array.isArray(to) ? to : [to];

  // Helper: Gmail API sender (OAuth2)
  async function gmailApiSend() {
    // Preconditions
    if (!GMAIL_API_ENABLED) return { ok: false, error: 'gmail_api_disabled' };
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_USER) {
      return { ok: false, error: 'gmail_api_missing_env' };
    }

    // 1) Exchange refresh token for access token
    let accessToken = '';
    try {
      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GMAIL_CLIENT_ID,
          client_secret: GMAIL_CLIENT_SECRET,
          refresh_token: GMAIL_REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }),
      });
      if (!tokenResp.ok) {
        const errText = await tokenResp.text().catch(() => '');
        console.warn('[mailer] Gmail token refresh failed:', tokenResp.status, errText?.slice?.(0, 200) || '');
        return { ok: false, error: 'gmail_token_refresh_failed' };
      }
      const tokenData = await tokenResp.json();
      accessToken = tokenData.access_token;
      if (!accessToken) return { ok: false, error: 'gmail_no_access_token' };
    } catch (e) {
      console.warn('[mailer] Gmail token refresh exception:', e?.message || e);
      return { ok: false, error: 'gmail_token_exception' };
    }

    // 2) Build MIME message
    const recipients = Array.isArray(to) ? to.join(', ') : String(to);
    const boundary = 'mix-' + Math.random().toString(36).slice(2);
    const dateStr = new Date().toUTCString();
    const headers = [
      `From: ${from}`,
      `To: ${recipients}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Date: ${dateStr}`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`
    ].join('\r\n');

    const plain = text || (html ? html.replace(/<[^>]+>/g, ' ') : '');
    const body = [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      plain,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html || `<p>${plain}</p>`,
      `--${boundary}--`
    ].join('\r\n');

    const rfc822 = `${headers}\r\n\r\n${body}`;
    const base64url = Buffer.from(rfc822).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

    // 3) Call Gmail API
    try {
      const sendResp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64url })
      });
      if (sendResp.ok) {
        const data = await sendResp.json().catch(() => ({}));
        console.info('[mailer] Sent via Gmail API');
        return { ok: true, provider: 'gmail_api', raw: data };
      }
      const errText = await sendResp.text().catch(() => '');
      console.warn('[mailer] Gmail send failed:', sendResp.status, errText?.slice?.(0, 200) || '');
      return { ok: false, error: 'gmail_send_failed' };
    } catch (e) {
      console.warn('[mailer] Gmail send exception:', e?.message || e);
      return { ok: false, error: 'gmail_send_exception' };
    }
  }

  if (!SMTP_PREFERRED) {
    const g = await gmailApiSend();
    if (g?.ok) return g;
  }

  // 2) If SMTP is not preferred, try API providers next (SendGrid only)
  if (!SMTP_PREFERRED) {
    if (SENDGRID_API_KEY) {
      try {
        const sgResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: recipients.map(r => ({ email: r })) }],
            from: { email: from },
            subject,
            content: [
              ...(text ? [{ type: 'text/plain', value: text }] : []),
              ...(html ? [{ type: 'text/html', value: html }] : [])
            ],
          }),
        });
        if (sgResp.ok) {
          console.info('[mailer] Sent via SendGrid API');
          return { ok: true, provider: 'sendgrid', raw: { status: 'accepted' } };
        }
      } catch {}
    }
  }

  // 3) If SMTP was preferred and still failed, try API providers last (SendGrid only)
  if (SMTP_PREFERRED) {
    if (SENDGRID_API_KEY) {
      try {
        const sgResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: recipients.map(r => ({ email: r })) }],
            from: { email: from },
            subject,
            content: [
              ...(text ? [{ type: 'text/plain', value: text }] : []),
              ...(html ? [{ type: 'text/html', value: html }] : [])
            ],
          }),
        });
        if (sgResp.ok) {
          console.info('[mailer] Sent via SendGrid API after SMTP failure');
          return { ok: true, provider: 'sendgrid', raw: { status: 'accepted' } };
        }
      } catch {}
    }
  }

  throw lastErr;
}

