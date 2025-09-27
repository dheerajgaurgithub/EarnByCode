import nodemailer from 'nodemailer';

// Create a singleton transporter using environment variables
let transporter = null;
let smtpFailureCount = 0;
let smtpDisabled = false;
let lastSmtpFailureAt = 0;
const SMTP_BREAKER_RESET_MS = 2 * 60 * 1000; // 2 minutes
const SMTP_FAILURE_THRESHOLD = parseInt(process.env.SMTP_FAILURE_THRESHOLD || '3', 10);

function getTransporter() {
  if (smtpDisabled) {
    // Auto-reset circuit if cooldown elapsed
    if (Date.now() - lastSmtpFailureAt > SMTP_BREAKER_RESET_MS) {
      console.warn('[mailer] SMTP circuit breaker cooldown elapsed. Trying again...');
      smtpFailureCount = 0;
    } else {
      throw new Error('SMTP disabled by circuit breaker');
    }
  }
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = String(process.env.SMTP_SECURE || (port === 465)).toLowerCase() === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;

  if (!host) {
    throw new Error('SMTP host not configured');
  }

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

  // Verify in background (non-blocking)
  transporter.verify().then(() => {
    console.info('[mailer] SMTP verified');
  }).catch(err => {
    console.warn('[mailer] SMTP verify failed:', err?.message || err);
  });

  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'replyearnbycode@gmail.com';
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';

  // Try Resend HTTP API first if configured
  if (RESEND_API_KEY) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10000); // 10s timeout
      const body = {
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || undefined,
        text: text || undefined,
      };
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`Resend API error: ${resp.status} ${errText}`);
      }
      const data = await resp.json();
      console.info('[mailer] Sent via Resend');
      return { ok: true, provider: 'resend', raw: data };
    } catch (re) {
      console.warn('[mailer] Resend send failed, trying SendGrid or SMTP:', re?.message || re);
    }
  }

  // Try SendGrid HTTP API before SMTP if configured
  if (SENDGRID_API_KEY) {
    try {
      const sgResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: Array.isArray(to) ? to[0] : to }] }],
          from: { email: from },
          subject,
          content: [
            ...(text ? [{ type: 'text/plain', value: text }] : []),
            ...(html ? [{ type: 'text/html', value: html }] : [])
          ]
        })
      });
      if (!sgResp.ok) {
        const errText = await sgResp.text().catch(() => '');
        throw new Error(`SendGrid API error: ${sgResp.status} ${errText}`);
      }
      console.info('[mailer] Sent via SendGrid API');
      return { ok: true, provider: 'sendgrid', raw: { status: 'accepted' } };
    } catch (se) {
      console.warn('[mailer] SendGrid send failed, falling back to SMTP:', se?.message || se);
    }
  }

  // Fallback: SMTP with retry/backoff
  const transientRe = /timed?out|conn|ECONN|ENET|EHOST|ETIMEDOUT|ECONNREFUSED|ECONNRESET/i;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const tx = getTransporter();
      const info = await tx.sendMail({ from, to, subject, text, html });
      smtpFailureCount = 0; // reset on success
      return { ok: true, provider: 'smtp', raw: info };
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || e);
      const code = (e && (e.code || e.errno)) || '';
      console.error(`[mailer] SMTP send failed (attempt ${attempt}/3):`, code, msg);

      if (transientRe.test(code + ' ' + msg)) {
        // On first transient failure, try STARTTLS fallback
        try {
          const curPort = Number(process.env.SMTP_PORT || 0);
          const curSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
          if (attempt === 1 && (curSecure || curPort === 465)) {
            console.warn('[mailer] Switching SMTP to STARTTLS fallback (port=587, secure=false) for retry');
            process.env.SMTP_PORT = '587';
            process.env.SMTP_SECURE = 'false';
            transporter = null; // force recreate with new settings
          }
        } catch {}
        smtpFailureCount += 1;
        lastSmtpFailureAt = Date.now();
        console.warn(`[mailer] SMTP failures: ${smtpFailureCount}/${SMTP_FAILURE_THRESHOLD}`);
        if (smtpFailureCount >= SMTP_FAILURE_THRESHOLD) {
          smtpDisabled = true;
          console.error('[mailer] SMTP circuit breaker OPENED. Skipping further SMTP attempts until cooldown.');
          break;
        }
        const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      break; // non-transient, don’t retry
    }
  }
  throw lastErr;
}

export default { sendEmail };
