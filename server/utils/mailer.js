import nodemailer from 'nodemailer';

// Create a singleton transporter using environment variables
let transporter = null;
let smtpFailureCount = 0;
const SMTP_FAILURE_THRESHOLD = parseInt(process.env.SMTP_FAILURE_THRESHOLD || '3', 10);
let smtpDisabled = false; // circuit breaker, process-lifetime

function getTransporter() {
  if (smtpDisabled) {
    throw new Error('SMTP disabled by circuit breaker');
  }
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;

  if (!host) {
    throw new Error('SMTP host not configured');
  }

  transporter = nodemailer.createTransport({
    pool: true,
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
      servername: host,
      minVersion: 'TLSv1.2',
    },
  });

  // Verify in background
  transporter.verify().then(() => {
    console.info('[mailer] SMTP verified');
  }).catch((e) => {
    console.warn('[mailer] SMTP verify failed:', e?.message || e);
  });

  return transporter;
}

/**
 * Send an email using the configured transporter
{{ ... }}
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} [params.text] - Plain text body
 * @param {string} [params.html] - HTML body
 */
export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || 'no-reply@algobucks.com';
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

  // Prefer Resend API first if available (avoids SMTP egress issues on PaaS)
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
      console.warn('[mailer] Resend send failed, falling back to SMTP:', re?.message || re);
    }
  }

  // Fallback: SMTP
  try {
    if (smtpDisabled) {
      throw new Error('SMTP disabled by circuit breaker');
    }
    const tx = getTransporter();
    const info = await tx.sendMail({ from, to, subject, text, html });
    smtpFailureCount = 0; // reset on success
    return { ok: true, provider: 'smtp', raw: info };
  } catch (e) {
    const msg = String(e?.message || e);
    const code = (e && (e.code || e.errno)) || '';
    console.error('[mailer] SMTP send failed:', code, msg);
    // increment breaker on connection/timeout errors
    if (/timed?out|conn|ECONN|ENET|EHOST/i.test(code + ' ' + msg)) {
      smtpFailureCount += 1;
      console.warn(`[mailer] SMTP failures: ${smtpFailureCount}/${SMTP_FAILURE_THRESHOLD}`);
      if (smtpFailureCount >= SMTP_FAILURE_THRESHOLD) {
        smtpDisabled = true;
        console.error('[mailer] SMTP circuit breaker OPENED. Further SMTP attempts will be skipped until restart.');
      }
    }
    throw e;
  }
}

export default { sendEmail };
