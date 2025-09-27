import nodemailer from 'nodemailer';

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
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!from) throw new Error('EMAIL_FROM or SMTP_USER must be set');

  // Helper: send via Resend HTTP API
  const tryResend = async () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY not set');
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html: html || undefined,
        text: text || undefined
      })
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Resend API error: ${resp.status} ${body}`);
    }
    const data = await resp.json();
    return { ok: true, provider: 'resend', messageId: data?.id || 'resend' };
  };

  // If explicitly configured to use Resend, use it first
  if ((process.env.EMAIL_PROVIDER || '').toLowerCase() === 'resend') {
    return await tryResend();
  }

  const t = createTransporter();
  try {
    const info = await t.sendMail({ from, to, subject, text, html });
    return { ok: true, provider: 'smtp', messageId: info.messageId };
  } catch (err) {
    const currentPort = t.options.port;
    const isTimeout = err?.code === 'ETIMEDOUT' || /timed?out/i.test(err?.message || '');
    // If we timed out on 465, retry once with 587 STARTTLS
    if (isTimeout && currentPort === 465) {
      try {
        const fallback = nodemailer.createTransport({
          host: t.options.host,
          port: 587,
          secure: false,
          auth: t.options.auth,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
          tls: {
            servername: t.options.host,
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2',
          },
          pool: true,
          maxConnections: 2,
          maxMessages: 50,
        });
        const info = await fallback.sendMail({ from, to, subject, text, html });
        // Cache fallback for future sends
        transporter = fallback;
        return { ok: true, provider: 'smtp', messageId: info.messageId };
      } catch (e2) {
        debugEmail('SMTP fallback (587) failed:', e2?.message || e2);
        throw err;
      }
    }
    // If we timed out on 587, try 465 SSL once
    if (isTimeout && currentPort === 587) {
      try {
        const fallback = nodemailer.createTransport({
          host: t.options.host,
          port: 465,
          secure: true,
          auth: t.options.auth,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
          tls: {
            servername: t.options.host,
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2',
          },
          pool: true,
          maxConnections: 2,
          maxMessages: 50,
        });
        const info = await fallback.sendMail({ from, to, subject, text, html });
        transporter = fallback;
        return { ok: true, provider: 'smtp', messageId: info.messageId };
      } catch (e2) {
        debugEmail('SMTP fallback (465) failed:', e2?.message || e2);
        // last resort: Resend, if available
        if (process.env.RESEND_API_KEY) {
          try {
            return await tryResend();
          } catch (e3) {
            debugEmail('Resend fallback failed:', e3?.message || e3);
          }
        }
        throw err;
      }
    }
    // If SMTP failed due to timeout and Resend is configured, try Resend
    if (isTimeout && process.env.RESEND_API_KEY) {
      try {
        return await tryResend();
      } catch (e3) {
        debugEmail('Resend fallback failed:', e3?.message || e3);
      }
    }
    throw err;
  }
}

