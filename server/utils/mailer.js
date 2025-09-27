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
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
  const SMTP_PREFERRED = String(process.env.SMTP_PREFERRED || '').toLowerCase() === 'true';

  const recipients = Array.isArray(to) ? to : [to];

  // 1) If SMTP is not preferred, try API providers first (Resend -> SendGrid)
  if (!SMTP_PREFERRED) {
    if (RESEND_API_KEY) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 10000);
        const forceFallback = String(process.env.RESEND_FORCE_FALLBACK || '').toLowerCase() === 'true';
        const resendFrom = forceFallback ? 'onboarding@resend.dev' : (process.env.RESEND_FROM || from);
        const body = { from: resendFrom, to: recipients, subject, text, html };
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(t);
        if (resp.ok) {
          const data = await resp.json();
          console.info('[mailer] Sent via Resend API');
          return { ok: true, provider: 'resend', raw: data };
        }
        const errText = await resp.text().catch(() => '');
        console.warn('[mailer] Resend primary send failed:', resp.status, errText?.slice?.(0, 200) || '');
        if (resp.status === 403) {
          // retry with onboarding sender once
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
          if (resp2.ok) {
            const data2 = await resp2.json();
            console.info('[mailer] Sent via Resend API (fallback sender)');
            return { ok: true, provider: 'resend', raw: data2 };
          }
        }
      } catch (e) {
        console.warn('[mailer] Resend send failed:', e?.message || e);
      }
    }

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
      } catch (e) {
        console.warn('[mailer] SendGrid send failed:', e?.message || e);
      }
    }
  }

  // 2) Try SMTP (preferred or fallback)
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
        if (attempt === 1 && defaultSmtpConfig.secure) {
          console.warn('[mailer] Switching SMTP to STARTTLS fallback (port=587, secure=false)');
          transporter = null;
          continue;
        }
        const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      break;
    }
  }

  // 3) If SMTP was preferred and still failed, try API providers last
  if (SMTP_PREFERRED) {
    if (RESEND_API_KEY) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 10000);
        const forceFallback = String(process.env.RESEND_FORCE_FALLBACK || '').toLowerCase() === 'true';
        const resendFrom = forceFallback ? 'onboarding@resend.dev' : (process.env.RESEND_FROM || from);
        const body = { from: resendFrom, to: recipients, subject, text, html };
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(t);
        if (resp.ok) {
          const data = await resp.json();
          console.info('[mailer] Sent via Resend API after SMTP failure');
          return { ok: true, provider: 'resend', raw: data };
        }
      } catch {}
    }
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

