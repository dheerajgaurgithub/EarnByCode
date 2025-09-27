import nodemailer from 'nodemailer';

// Create a singleton transporter using environment variables
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    const missing = [];
    if (!host) missing.push('SMTP_HOST');
    if (!user) missing.push('SMTP_USER (or SMTP_EMAIL/EMAIL_USER)');
    if (!pass) missing.push('SMTP_PASS (or SMTP_PASSWORD/EMAIL_PASS)');
    throw new Error(`SMTP is not configured. Missing: ${missing.join(', ')}. Please set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS in .env`);
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: !secure,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    dnsTimeout: 8000,
    family: 4,
  });

  // Non-blocking verify to surface config issues in logs
  try {
    transporter.verify().then(() => {
      console.info('[mailer] SMTP verified');
    }).catch((e) => {
      console.warn('[mailer] SMTP verify failed:', e?.message || e);
    });
  } catch {}

  return transporter;
}

/**
 * Send an email using the configured transporter
 * @param {Object} params
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
    const tx = getTransporter();
    const info = await tx.sendMail({ from, to, subject, text, html });
    return { ok: true, provider: 'smtp', raw: info };
  } catch (e) {
    const msg = String(e?.message || e);
    const code = (e && (e.code || e.errno)) || '';
    console.error('[mailer] SMTP send failed:', code, msg);
    throw e;
  }
}

export default { sendEmail };
