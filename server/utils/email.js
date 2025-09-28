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

// SMTP configuration removed (email sending disabled)

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const from = process.env.EMAIL_FROM || 'not-set';
console.log(`[Email] Provider: disabled | Env: ${isProd ? 'production' : 'development'}`);
console.log(`[Email] From (ignored): ${from}`);

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

// No SMTP verification; email sending is disabled

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
  // Email sending disabled: log and return success without sending
  const payload = { to, subject, text, html, attachmentsCount: attachments?.length || 0 };
  try {
    console.log('📪 Email sending disabled. Logging only:', payload);
    logEmail('DISABLED_SEND', payload);
  } catch {}
  return { success: true, message: 'Email disabled; no-op' };
};
