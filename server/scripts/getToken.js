// Helper script to obtain a Gmail OAuth2 Refresh Token for sending OTP emails via Gmail API.
// Usage:
//   1) Ensure you have set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET (and optionally GMAIL_REDIRECT_URI)
//   2) Run: node server/scripts/getToken.js
//   3) Open the printed URL, approve access for the sender Gmail account, paste the code back
//   4) Copy the printed Refresh Token into your env as GMAIL_REFRESH_TOKEN

import { google } from 'googleapis';
import readline from 'readline';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Generate auth URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline', // ensures refresh token
  prompt: 'consent',      // force consent to always return refresh token
  scope: SCOPES,
});

console.log('\nAuthorize this app by visiting this url:\n');
console.log(authUrl + '\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log('\nSuccess! Save the following values in your server environment:');
    console.log('GMAIL_API_ENABLED=true');
    console.log('GMAIL_USER=<your_sender_gmail>@gmail.com');
    console.log('EMAIL_FROM=<your_sender_gmail>@gmail.com');
    console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token || '<MISSING - see note below>'}`);
    console.log('\nNote: If refresh_token is missing, revoke previous app access in your Google Account, add the Gmail account as a Test user on the OAuth consent screen, and re-run with prompt=consent.');
  } catch (e) {
    console.error('Failed to exchange code for tokens:', e?.message || e);
  } finally {
    rl.close();
  }
});
