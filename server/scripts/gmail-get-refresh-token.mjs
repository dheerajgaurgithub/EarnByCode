#!/usr/bin/env node
// Helper script to obtain a Gmail OAuth2 refresh token for Gmail API sending.
// Usage: node ./scripts/gmail-get-refresh-token.mjs
// It will read client credentials from environment variables, open an auth URL,
// and prompt you to paste the authorization code.

import readline from 'node:readline';
import open from 'open';
import crypto from 'node:crypto';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('[gmail-get-refresh-token] Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your environment.');
  process.exit(1);
}

// We request only gmail.send scope for least privilege
const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.send');

// Use an OOB-like flow by directing users to an external page where they can copy the code.
// We default to using the OAuth Playground redirect URI.
const state = crypto.randomBytes(8).toString('hex');
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

console.log('\n1) Open the following URL in your browser and complete the consent (use the sender Gmail account):\n');
console.log(authUrl + '\n');

try {
  await open(authUrl);
} catch {}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));
}

try {
  const code = (await ask('2) Paste the authorization code here: ')).trim();
  if (!code) throw new Error('Authorization code is required');

  const params = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error('\nToken exchange failed:', data);
    process.exit(2);
  }

  console.log('\nSuccess! Save the following in your Render environment variables:');
  console.log('GMAIL_API_ENABLED=true');
  console.log('GMAIL_USER=<your_sender_gmail>@gmail.com');
  console.log('EMAIL_FROM=<your_sender_gmail>@gmail.com');
  console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
  console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
  console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}`);
  console.log('SMTP_PREFERRED=false');

  if (!data.refresh_token) {
    console.warn('\nNote: Google sometimes does not return a refresh_token if one already exists for this client/user. Try using the OAuth Playground redirect URI, adding prompt=consent, or remove existing grants in your Google Account permissions and retry.');
  }
} catch (e) {
  console.error('\nError:', e?.message || e);
  process.exit(3);
} finally {
  rl.close();
}
