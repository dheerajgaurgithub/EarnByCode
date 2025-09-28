import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env here so this module sees variables even if server loads dotenv later
try {
  // Prefer server/.env.local then server/.env
  dotenv.config({ path: path.join(__dirname, '../.env.local') });
  dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
} catch {}

// SMTP Configuration - Using environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || (process.env.SMTP_PORT === '465')).toLowerCase() === 'true' || String(process.env.SMTP_PORT) === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  logger: false,
  debug: false,
  connectionTimeout: 8000, // ms
  greetingTimeout: 8000,
  socketTimeout: 10000,
};

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Create transporter with SMTP only if credentials exist and provider is not sendgrid
let transporter = null;

const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const hasSmtpCreds = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
const RAW_PROVIDER = process.env.EMAIL_PROVIDER || '';
let EMAIL_PROVIDER = RAW_PROVIDER.toLowerCase();
if (!EMAIL_PROVIDER && process.env.SENDGRID_API_KEY) {
  EMAIL_PROVIDER = 'sendgrid';
}

if (EMAIL_PROVIDER !== 'sendgrid' && hasSmtpCreds) {
  transporter = nodemailer.createTransport(SMTP_CONFIG);
}

// Configure SendGrid if selected
if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
  try { sgMail.setApiKey(process.env.SENDGRID_API_KEY); } catch {}
}

console.log(`[Email] Provider: ${EMAIL_PROVIDER || (hasSmtpCreds ? 'smtp' : 'none')} | Env: ${isProd ? 'production' : 'development'}`);
if (EMAIL_PROVIDER === 'sendgrid') {
  const k = process.env.SENDGRID_API_KEY || '';
  const masked = k ? `${k.slice(0, 3)}***${k.slice(-3)}` : 'none';
  console.log(`[Email] SendGrid API key: ${k ? 'present' : 'missing'} (${masked}, len=${k.length})`);
  const from = process.env.EMAIL_FROM || 'not-set';
  console.log(`[Email] From: ${from}`);
}

// Helper function to log email attempts
const logEmail = (type, data) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${type}: ${JSON.stringify(data, null, 2)}\n`;
  const logFile = path.join(LOGS_DIR, 'email.log');
  
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Error writing to email log:', err);
    }
  });};

// Verify connection configuration (only when SMTP creds exist)
if (hasSmtpCreds && transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration error:', error);
      logEmail('CONFIG_ERROR', { error: error.message });
    } else {
      console.log('✅ Email server is ready to take our messages');
    }
  });
} else if (!isProd) {
  console.warn('⚠️ SMTP credentials not set. Emails will be logged only (dev mode).');
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version of the email
 * @param {string} options.html - HTML version of the email
 * @param {Array} [options.attachments] - Array of attachment objects
 * @param {string} options.attachments[].filename - Name of the attachment
 * @param {Buffer} options.attachments[].content - File content as Buffer
 * @param {string} options.attachments[].contentType - MIME type of the attachment
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  // Provider: SendGrid
  if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    try {
      const msg = {
        to,
        from: process.env.EMAIL_FROM || 'replyearnbycode@gmail.com',
        subject,
        text,
        html,
        attachments: attachments?.map(a => ({
          filename: a.filename,
          content: a.content?.toString('base64'),
          type: a.contentType,
          disposition: 'attachment',
        }))
      };
      const [resp] = await sgMail.send(msg);
      logEmail('SUCCESS_SENDGRID', { to, subject, statusCode: resp?.statusCode });
      return { success: true, message: 'Email sent (SendGrid)', statusCode: resp?.statusCode };
    } catch (error) {
      console.error('❌ SendGrid send error:', error?.response?.body || error?.message || error);
      if (!isProd) {
        return { success: true, message: 'SendGrid failed, but continuing in dev mode' };
      }
      return { success: false, message: 'SendGrid send failed', error: error?.message };
    }
  }

  // In development without SMTP credentials, do not attempt to send; log and return success fast
  if (!isProd && !hasSmtpCreds) {
    const mailOptions = { from: process.env.EMAIL_FROM || 'dev@localhost', to, subject, text, html };
    console.log('📧 [DEV] Email not sent (no SMTP creds). Simulating success:', mailOptions);
    logEmail('DEV_SIMULATED_SEND', mailOptions);
    return { success: true, message: 'Simulated email send (dev mode, no SMTP configured)' };
  }

  // In production, if neither provider nor SMTP creds are configured, fail fast with a clear message
  if (isProd && EMAIL_PROVIDER !== 'sendgrid' && !hasSmtpCreds) {
    const reason = 'No email provider configured (set EMAIL_PROVIDER=sendgrid with SENDGRID_API_KEY or configure SMTP_* envs)';
    console.error('❌ Email configuration error:', reason);
    logEmail('CONFIG_MISSING', { reason });
    return { success: false, message: reason };
  }

  const mailOptions = {
    from: `${process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'replyearnbycode@gmail.com'}`,
    to,
    subject,
    text,
    html,
    attachments
  };

  try {
    // Add a hard timeout to avoid long hangs
    const sendWithTimeout = (opts) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Email send timeout')), 12000);
      transporter.sendMail(opts).then((info) => {
        clearTimeout(timer);
        resolve(info);
      }).catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    if (!transporter) throw new Error('SMTP transporter not initialized');
    const info = await sendWithTimeout(mailOptions);
    logEmail('SUCCESS', { 
      to, 
      subject, 
      messageId: info.messageId,
      response: info.response 
    });
    
    return { 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId 
    };
  } catch (error) {
    console.error('❌ Email send error:', error);
    logEmail('ERROR', { 
      to, 
      subject, 
      error: error.message,
      stack: error.stack 
    });
    
    // In non-prod, don't block flows on email errors
    if (!isProd) {
      return { success: true, message: 'Email send failed, but continuing in dev mode' };
    }
    return { success: false, message: 'Failed to send email', error: error.message };
  }
};
