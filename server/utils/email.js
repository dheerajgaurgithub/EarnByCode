import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SMTP Configuration - Using Gmail SMTP
const SMTP_CONFIG = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'coder9265@gmail.com',
    pass: 'wytkgrkixzsmpmga'
  },
  logger: true,
  debug: true
};

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport(SMTP_CONFIG);

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

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
    logEmail('CONFIG_ERROR', { error: error.message });
  } else {
    console.log('✅ Email server is ready to take our messages');
  }
});

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
  const mailOptions = {
    from: `"CodeArena" <coder9265@gmail.com>`,
    to,
    subject,
    text,
    html,
    attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
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
    
    return { 
      success: false, 
      message: 'Failed to send email',
      error: error.message 
    };
  }
};
