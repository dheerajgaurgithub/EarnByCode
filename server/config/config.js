import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both .env and .env.local
const envPath = path.resolve(process.cwd(), '.env');
const localEnvPath = path.resolve(process.cwd(), '.env.local');

dotenv.config({ path: localEnvPath });
dotenv.config({ path: envPath, override: true });

// Configuration with environment variables fallback to hardcoded values for development
const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  // Prefer explicit API_URL, else platform-provided public URL (e.g., Render), else localhost
  API_URL: process.env.API_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://coder9265_db_user:girlfriend160106@dataset.ohcvuvo.mongodb.net/?retryWrites=true&w=majority&appName=DataSet',
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'algobucks@dheerajgaur',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev_session_secret_change_in_production',
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '852480113401-42vt52rmcs5u4e6uiego6pqm7flkva2j.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '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',
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // SMTP
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 465,
  SMTP_EMAIL: process.env.SMTP_EMAIL || 'replyearnbycode@gmail.com',
  SMTP_USER: process.env.SMTP_USER || 'replyearnbycode@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || 'pfljbpujfoelrrxj',
  SMTP_SECURE: process.env.SMTP_SECURE || 'true',
  
  // Email
  EMAIL_FROM: process.env.EMAIL_FROM || 'replyearnbycode@gmail.com',
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'smtp', // Use SMTP by default
  USE_GMAIL_API: process.env.USE_GMAIL_API === 'true' || false, // Disable Gmail API by default
  USE_GMAIL: process.env.USE_GMAIL === 'true' || true, // Enable Gmail SMTP
  ENABLE_EMAIL_SENDING: process.env.ENABLE_EMAIL_SENDING !== 'false', // Enable email sending
};

// Only validate required environment variables in production
if (config.NODE_ENV === 'production') {
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'JWT_SECRET',
    'SESSION_SECRET'
  ];

  // Add Gmail API credentials only if using Gmail API
  if (config.EMAIL_PROVIDER === 'gmailapi' || config.USE_GMAIL_API) {
    requiredEnvVars.push('GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN');
  }

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    console.error('\n📧 Gmail API Setup Instructions:');
    console.error('1. Go to Google Cloud Console: https://console.cloud.google.com/');
    console.error('2. Enable Gmail API for your project');
    console.error('3. Create OAuth 2.0 credentials');
    console.error('4. Set up OAuth consent screen');
    console.error('5. Add these environment variables:');
    console.error('   - GMAIL_CLIENT_ID: Your OAuth client ID');
    console.error('   - GMAIL_CLIENT_SECRET: Your OAuth client secret');
    console.error('   - GMAIL_REFRESH_TOKEN: Generate via OAuth playground');
    process.exit(1);
  }
}

console.log('Environment variables loaded successfully');

// Debug: Log important environment variables
console.log('\n=== Environment Variables ===');
console.log('- NODE_ENV:', config.NODE_ENV);
console.log('- JWT_SECRET:', config.JWT_SECRET ? '*** set ***' : 'NOT SET');
console.log('- MONGODB_URI:', config.MONGODB_URI);
console.log('- SMTP_EMAIL:', config.SMTP_EMAIL);
console.log('- SMTP_USER:', config.SMTP_USER);
console.log('- SMTP_PASSWORD:', config.SMTP_PASS ? '*** set ***' : 'NOT SET');
console.log('- EMAIL_FROM:', config.EMAIL_FROM);
console.log('- EMAIL_PROVIDER:', config.EMAIL_PROVIDER);
console.log('- USE_GMAIL_API:', config.USE_GMAIL_API ? '✅ Enabled' : '❌ Disabled');
console.log('- USE_GMAIL (SMTP):', config.USE_GMAIL ? '✅ Enabled' : '❌ Disabled');
console.log('===========================\n');

export default config;
