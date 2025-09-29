import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
try {
  dotenv.config({ path: path.join(__dirname, '../.env.local') });
  dotenv.config({ path: path.join(__dirname, '../.env'), override: false });
} catch (e) {
  console.warn('Error loading env files:', e.message);
}

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create logs directory:', e.message);
  }
}

const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@algobucks.app',
  useGmail: process.env.USE_GMAIL === 'true',
  useGmailOAuth: process.env.USE_GMAIL_OAUTH === 'true',
  useSendGrid: process.env.USE_SENDGRID === 'true' || !!process.env.SENDGRID_API_KEY,
  enableEmailSending: process.env.ENABLE_EMAIL_SENDING === 'true' || isProd,
  
  // Gmail SMTP Configuration
  gmail: {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASSWORD, // App-specific password
  },
  // Gmail OAuth2 Configuration
  gmailOAuth: {
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
    clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
    redirectUri: process.env.GMAIL_OAUTH_REDIRECT_URI || 'https://developers.google.com/oauthplayground',
  },
  
  // General SMTP Configuration
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
  },
  
  // SendGrid Configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM,
    fromName: process.env.SENDGRID_FROM_NAME || 'AlgoBucks',
  }
};

// Initialize SendGrid if configured
if (EMAIL_CONFIG.useSendGrid && EMAIL_CONFIG.sendgrid.apiKey) {
  try {
    sgMail.setApiKey(EMAIL_CONFIG.sendgrid.apiKey);
    console.log('✅ SendGrid initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize SendGrid:', error.message);
    EMAIL_CONFIG.useSendGrid = false;
  }
}

// Create transporter based on configuration
const createTransporter = () => {
  try {
    // Priority 0: Gmail OAuth2
    if (
      EMAIL_CONFIG.useGmailOAuth &&
      EMAIL_CONFIG.gmailOAuth.user &&
      EMAIL_CONFIG.gmailOAuth.clientId &&
      EMAIL_CONFIG.gmailOAuth.clientSecret &&
      EMAIL_CONFIG.gmailOAuth.refreshToken
    ) {
      console.log('📧 Using Gmail OAuth2 configuration');
      const oAuth2Client = new google.auth.OAuth2(
        EMAIL_CONFIG.gmailOAuth.clientId,
        EMAIL_CONFIG.gmailOAuth.clientSecret,
        EMAIL_CONFIG.gmailOAuth.redirectUri
      );
      oAuth2Client.setCredentials({ refresh_token: EMAIL_CONFIG.gmailOAuth.refreshToken });

      // Nodemailer can generate access tokens automatically if refreshToken is provided
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: EMAIL_CONFIG.gmailOAuth.user,
          clientId: EMAIL_CONFIG.gmailOAuth.clientId,
          clientSecret: EMAIL_CONFIG.gmailOAuth.clientSecret,
          refreshToken: EMAIL_CONFIG.gmailOAuth.refreshToken,
        },
      });
    }

    // Priority 1: Gmail SMTP
    if (EMAIL_CONFIG.useGmail && EMAIL_CONFIG.gmail.user && EMAIL_CONFIG.gmail.password) {
      console.log('📧 Using Gmail SMTP configuration');
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: EMAIL_CONFIG.gmail.user,
          pass: EMAIL_CONFIG.gmail.password,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }
    
    // Priority 2: General SMTP
    if (EMAIL_CONFIG.smtp.host && EMAIL_CONFIG.smtp.user && EMAIL_CONFIG.smtp.password) {
      console.log('📧 Using general SMTP configuration');
      return nodemailer.createTransport({
        host: EMAIL_CONFIG.smtp.host,
        port: EMAIL_CONFIG.smtp.port,
        secure: EMAIL_CONFIG.smtp.secure,
        auth: {
          user: EMAIL_CONFIG.smtp.user,
          pass: EMAIL_CONFIG.smtp.password,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }
    
    console.warn('⚠️ No SMTP configuration found');
    return null;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

// Initialize transporter
const transporter = createTransporter();

// Verify transporter connection
const verifyTransporter = async () => {
  if (!transporter) return false;
  
  try {
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    return false;
  }
};

// Log email attempts
const logEmail = (type, data, result = null) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      data: {
        to: data.to,
        subject: data.subject,
        hasHtml: !!data.html,
        hasText: !!data.text,
        attachmentsCount: data.attachments?.length || 0,
      },
      result,
      environment: isProd ? 'production' : 'development'
    };
    
    const logFile = path.join(LOGS_DIR, 'email-detailed.log');
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logFile, logLine);
  } catch (error) {
    console.error('Error writing to email log:', error.message);
  }
};

// Email templates for OTP
const createOTPEmailTemplate = (otp, type = 'password-reset') => {
  const templates = {
    'password-reset': {
      subject: 'Your AlgoBucks Password Reset Code',
      text: `Your password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nAlgoBucks Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Password Reset - AlgoBucks</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">AlgoBucks</h1>
              <p style="color: #6b7280; margin-top: 5px;">Competitive Programming Platform</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Code</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
              You requested a password reset for your AlgoBucks account. Use the following code to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #f3f4f6; padding: 20px 30px; border-radius: 8px; border: 2px dashed #d1d5db;">
                <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${otp}</span>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">
                ⚠️ This code expires in 15 minutes
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <div style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© 2025 AlgoBucks. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    'email-verification': {
      subject: 'Verify Your AlgoBucks Email Address',
      text: `Welcome to AlgoBucks!\n\nYour verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nBest regards,\nAlgoBucks Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Email Verification - AlgoBucks</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Welcome to AlgoBucks!</h1>
              <p style="color: #6b7280; margin-top: 5px;">Competitive Programming Platform</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
              Thanks for joining AlgoBucks! Please verify your email address using the code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #f3f4f6; padding: 20px 30px; border-radius: 8px; border: 2px dashed #d1d5db;">
                <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${otp}</span>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">
                ⚠️ This code expires in 15 minutes
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <div style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© 2025 AlgoBucks. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  };
  
  return templates[type] || templates['password-reset'];
};

/**
 * Send an email using the configured provider
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version
 * @param {string} options.html - HTML version
 * @param {Array} options.attachments - Array of attachments
 * @param {string} options.type - Email type for templates ('password-reset', 'email-verification')
 * @param {string} options.otp - OTP code for template emails
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export const sendEmail = async ({ to, subject, text, html, attachments = [], type, otp }) => {
  const startTime = Date.now();
  
  try {
    // Input validation
    if (!to || typeof to !== 'string') {
      throw new Error('Valid recipient email address is required');
    }
    
    // Use template if OTP is provided
    if (otp && type) {
      const template = createOTPEmailTemplate(otp, type);
      subject = subject || template.subject;
      text = text || template.text;
      html = html || template.html;
    }
    
    if (!subject || (!text && !html)) {
      throw new Error('Subject and content (text or html) are required');
    }
    
    const emailData = { to, subject, text, html, attachments };
    
    // Check if email sending is enabled
    if (!EMAIL_CONFIG.enableEmailSending) {
      console.log('📪 Email sending disabled. Logging email:', { to, subject, hasOtp: !!otp });
      logEmail('DISABLED_SEND', emailData, { success: false, reason: 'Email sending disabled' });
      return { 
        success: true, 
        message: 'Email sending disabled - logged only', 
        provider: 'none',
        deliveryTime: Date.now() - startTime
      };
    }
    
    let result = null;
    
    // Try SendGrid first if configured
    if (EMAIL_CONFIG.useSendGrid && sgMail) {
      try {
        console.log('📧 Attempting to send via SendGrid to:', to);
        
        const msg = {
          to,
          from: {
            email: EMAIL_CONFIG.sendgrid.fromEmail,
            name: EMAIL_CONFIG.sendgrid.fromName
          },
          subject,
          text,
          html,
          attachments: attachments?.map(att => ({
            content: att.content?.toString('base64'),
            filename: att.filename,
            type: att.contentType,
            disposition: 'attachment'
          })) || undefined
        };
        
        await sgMail.send(msg);
        result = {
          success: true,
          provider: 'sendgrid',
          messageId: 'sendgrid-sent',
          deliveryTime: Date.now() - startTime
        };
        
        console.log('✅ Email sent successfully via SendGrid');
        logEmail('SENDGRID_SUCCESS', emailData, result);
        return result;
        
      } catch (error) {
        console.error('❌ SendGrid send failed:', error.message);
        logEmail('SENDGRID_ERROR', emailData, { success: false, error: error.message });
        
        // Don't fall back if SendGrid is explicitly configured but fails
        if (EMAIL_CONFIG.useSendGrid && !transporter) {
          throw error;
        }
      }
    }
    
    // Try SMTP as fallback
    if (transporter) {
      try {
        console.log('📧 Attempting to send via SMTP to:', to);
        
        const mailOptions = {
          from: `"${EMAIL_CONFIG.sendgrid.fromName}" <${EMAIL_CONFIG.from}>`,
          to,
          subject,
          text,
          html,
          attachments
        };
        
        const info = await transporter.sendMail(mailOptions);
        result = {
          success: true,
          provider: EMAIL_CONFIG.useGmail ? 'gmail' : 'smtp',
          messageId: info.messageId,
          deliveryTime: Date.now() - startTime
        };
        
        console.log('✅ Email sent successfully via SMTP');
        logEmail('SMTP_SUCCESS', emailData, result);
        return result;
        
      } catch (error) {
        console.error('❌ SMTP send failed:', error.message);
        logEmail('SMTP_ERROR', emailData, { success: false, error: error.message });
        throw error;
      }
    }
    
    // No providers available
    throw new Error('No email providers configured');
    
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    
    // Log failed attempt
    logEmail('SEND_FAILED', { to, subject, hasOtp: !!otp }, { 
      success: false, 
      error: error.message,
      deliveryTime: Date.now() - startTime
    });
    
    // In development, don't throw errors to avoid breaking the flow
    if (!isProd) {
      console.log('🔧 Development mode: Email error logged but not thrown');
      return {
        success: false,
        error: error.message,
        provider: 'none',
        deliveryTime: Date.now() - startTime
      };
    }
    
    throw error;
  }
};

/**
 * Send OTP email with predefined template
 * @param {string} to - Recipient email
 * @param {string} otp - OTP code
 * @param {string} type - OTP type ('password-reset' or 'email-verification')
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export const sendOTPEmail = async (to, otp, type = 'password-reset') => {
  return sendEmail({ to, otp, type });
};

/**
 * Test email configuration
 * @returns {Promise<Object>} - Configuration test results
 */
export const testEmailConfig = async () => {
  const results = {
    config: EMAIL_CONFIG,
    tests: {}
  };
  
  // Test SendGrid
  if (EMAIL_CONFIG.useSendGrid) {
    try {
      // SendGrid doesn't have a test method, so we just check if it's initialized
      results.tests.sendgrid = { 
        available: true, 
        configured: !!EMAIL_CONFIG.sendgrid.apiKey 
      };
    } catch (error) {
      results.tests.sendgrid = { 
        available: false, 
        error: error.message 
      };
    }
  }
  
  // Test SMTP
  if (transporter) {
    results.tests.smtp = {
      available: true,
      verified: await verifyTransporter()
    };
  } else {
    results.tests.smtp = {
      available: false,
      error: 'No SMTP configuration found'
    };
  }
  
  return results;
};

// Initialize and verify on startup
if (EMAIL_CONFIG.enableEmailSending) {
  console.log(`📧 Email system initialized:`);
  console.log(`   • Environment: ${isProd ? 'production' : 'development'}`);
  console.log(`   • SendGrid: ${EMAIL_CONFIG.useSendGrid ? '✅' : '❌'}`);
  console.log(`   • Gmail (OAuth2): ${EMAIL_CONFIG.useGmailOAuth ? '✅' : '❌'}`);
  console.log(`   • Gmail (SMTP): ${EMAIL_CONFIG.useGmail ? '✅' : '❌'}`);
  console.log(`   • SMTP: ${!!transporter ? '✅' : '❌'}`);
  console.log(`   • From: ${EMAIL_CONFIG.from}`);
  
  // Verify transporter in background
  if (transporter) {
    verifyTransporter().catch(error => {
      console.warn('⚠️ SMTP verification failed on startup:', error.message);
    });
  }
} else {
  console.log('📪 Email sending is disabled');
}

export default { sendEmail, sendOTPEmail, testEmailConfig };