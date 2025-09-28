import nodemailer from 'nodemailer';
import { google } from 'googleapis';

let transporter;
const debugEmail = (msg, ...args) => {
  if (String(process.env.DEBUG_EMAIL || '0') === '1') {
    // Use console.log to avoid alarming error logs in production
    console.log(msg, ...args);
  }
};

function createTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const envPort = parseInt(process.env.SMTP_PORT || '0', 10);
  // Prefer STARTTLS 587 by default for PaaS reliability; fallback to 465 if needed
  const defaultPort = envPort || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const buildTransport = (port, secure) => nodemailer.createTransport({
    host,
    port,
    secure, // true for 465, false for 587 (STARTTLS)
    auth: user && pass ? { user, pass } : undefined,
    // Connection hardening and reasonable timeouts for PaaS
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    // TLS options
    tls: {
      // Ensure SNI
      servername: host,
      // Keep strict by default; change only if your SMTP requires it
      rejectUnauthorized: true,
      // Modern ciphers
      ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256',
      minVersion: 'TLSv1.2',
    },
    // Use pooled connections to improve reliability
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
  });

  // First attempt: configured/default (587 STARTTLS by default)
  const secure = defaultPort === 465;
  transporter = buildTransport(defaultPort, secure);
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || process.env.GMAIL_SENDER;
  if (!from) throw new Error('EMAIL_FROM or GMAIL_SENDER must be set');

  // Send via Gmail API (OAuth2) ONLY
  const sendViaGmailApi = async () => {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    const sender = process.env.GMAIL_SENDER || from;
    if (!clientId || !clientSecret || !refreshToken || !sender) {
      throw new Error('Gmail API env missing: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER');
    }
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Build RFC 822 message
    const boundary = 'mixed-' + Date.now();
    const headers = [
      `From: ${sender}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      html
        ? `Content-Type: multipart/alternative; boundary="${boundary}"`
        : `Content-Type: text/plain; charset="UTF-8"`,
      '',
    ];
    let body = '';
    if (html) {
      body = [
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        text || '',
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        html,
        '',
        `--${boundary}--`,
        '',
      ].join('\r\n');
    } else {
      body = text || '';
    }
    const raw = Buffer.from([...headers, body].join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
    if (res.status !== 200) {
      throw new Error(`Gmail API error: ${res.status} ${res.statusText}`);
    }
    return { ok: true, provider: 'gmailapi', messageId: res.data.id };
  };

  // Always send using Gmail API only
  return await sendViaGmailApi();
}

