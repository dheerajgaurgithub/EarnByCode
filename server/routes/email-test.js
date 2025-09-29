import express from 'express';
import { sendEmail, sendOTPEmail, testEmailConfig } from '../utils/email.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Test email configuration
router.get('/test-config', async (req, res) => {
  try {
    const results = await testEmailConfig();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send test email (protected route)
router.post('/send-test', authenticate, async (req, res) => {
  try {
    const { to, subject = 'Test Email from AlgoBucks', type = 'test' } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }
    
    const testContent = {
      text: 'This is a test email from AlgoBucks to verify email configuration is working properly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Test Email from AlgoBucks</h2>
          <p>This is a test email to verify that your email configuration is working properly.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Configuration Details:</strong></p>
            <ul style="margin: 10px 0;">
              <li>Timestamp: ${new Date().toISOString()}</li>
              <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
              <li>Sent by: ${req.user?.email || 'System'}</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            If you received this email, your email configuration is working correctly!
          </p>
        </div>
      `
    };
    
    const result = await sendEmail({
      to,
      subject,
      ...testContent
    });
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send test OTP email (protected route)
router.post('/send-test-otp', authenticate, async (req, res) => {
  try {
    const { to, type = 'password-reset' } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }
    
    // Generate test OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const result = await sendOTPEmail(to, otp, type);
    
    res.json({ 
      success: true, 
      result,
      testOtp: otp // Include OTP in response for testing
    });
  } catch (error) {
    console.error('Test OTP email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;