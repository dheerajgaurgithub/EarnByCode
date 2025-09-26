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
  const tx = getTransporter();

  const info = await tx.sendMail({ from, to, subject, text, html });
  return info;
}

export default { sendEmail };
