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
  const from = process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'replyearnbycode@gmail.com';
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';

  const recipients = Array.isArray(to) ? to : [to];

  // --- Resend API ---
  if (RESEND_API_KEY) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10000);
      // Allow overriding From just for Resend (useful for onboarding@resend.dev during testing)
      const resendFrom = process.env.RESEND_FROM || from;
      const body = { from: resendFrom, to: recipients, subject, text, html };
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        // If domain not verified, retry once with onboarding sender
        if (resp.status === 403 && /domain is not verified/i.test(errText)) {
          console.warn('[mailer] Resend: domain not verified. Retrying with onboarding@resend.dev');
          const controller2 = new AbortController();
          const t2 = setTimeout(() => controller2.abort(), 10000);
          const fallbackBody = { from: 'onboarding@resend.dev', to: recipients, subject, text, html };
          const resp2 = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackBody),
            signal: controller2.signal,
          });
          clearTimeout(t2);
          if (!resp2.ok) {
            const errText2 = await resp2.text().catch(() => '');
            throw new Error(`Resend API error (fallback): ${resp2.status} ${errText2}`);
          }
          const data2 = await resp2.json();
          console.info('[mailer] Sent via Resend API (fallback sender)');
          return { ok: true, provider: 'resend', raw: data2 };
        }
        throw new Error(`Resend API error: ${resp.status} ${errText}`);
      }
      const data = await resp.json();
      console.info('[mailer] Sent via Resend API');
      return { ok: true, provider: 'resend', raw: data };
    } catch (re) {
      console.warn('[mailer] Resend send failed, trying SendGrid or SMTP:', re?.message || re);
    }
  }

  // --- SendGrid API ---
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
      if (!sgResp.ok) {
        const errText = await sgResp.text().catch(() => '');
        // If key invalid/expired, do not keep trying; proceed to SMTP
        if (sgResp.status === 401) {
          console.warn('[mailer] SendGrid API unauthorized (401). Skipping to SMTP fallback.');
        } else {
          throw new Error(`SendGrid API error: ${sgResp.status} ${errText}`);
        }
      }
      if (sgResp.ok) {
        console.info('[mailer] Sent via SendGrid API');
        return { ok: true, provider: 'sendgrid', raw: { status: 'accepted' } };
      }
    } catch (se) {
      console.warn('[mailer] SendGrid send failed, falling back to SMTP:', se?.message || se);
    }
  }

  // --- SMTP Fallback ---
  const transientRe = /timed?out|conn|ECONN|ENET|EHOST|ETIMEDOUT|ECONNREFUSED|ECONNRESET/i;
  let lastErr;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const tx = getTransporter();
      const info = await tx.sendMail({ from, to: recipients, subject, text, html });
      smtpFailureCount = 0;
      return { ok: true, provider: 'smtp', raw: info };
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || e);
      const code = (e && (e.code || e.errno)) || '';
      console.error(`[mailer] SMTP send failed (attempt ${attempt}/3):`, code, msg);

      if (transientRe.test(code + ' ' + msg)) {
        smtpFailureCount += 1;
        lastSmtpFailureAt = Date.now();
        console.warn(`[mailer] SMTP failures: ${smtpFailureCount}/${SMTP_FAILURE_THRESHOLD}`);
        if (smtpFailureCount >= SMTP_FAILURE_THRESHOLD) {
          smtpDisabled = true;
          console.error('[mailer] SMTP circuit breaker OPENED.');
          break;
        }

        // Retry with STARTTLS fallback on first attempt
        if (attempt === 1 && defaultSmtpConfig.secure) {
          console.warn('[mailer] Switching SMTP to STARTTLS fallback (port=587, secure=false)');
          transporter = null; // recreate with fallback
          continue;
        }

        const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      break;
    }
  }

  throw lastErr;
}

export default sendEmail;
