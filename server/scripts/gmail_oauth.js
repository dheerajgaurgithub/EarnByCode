#!/usr/bin/env node
/*
  Gmail OAuth helper to obtain a refresh token for Gmail API sending.
  Usage:
    1) Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in server/.env (or environment)
    2) Optionally set GMAIL_SENDER to the Gmail address you plan to send from
    3) Run: node scripts/gmail_oauth.js
    4) Open the printed URL, grant access, and wait for the terminal to print tokens.
*/

import 'dotenv/config';
import express from 'express';
import open from 'open';
import { google } from 'googleapis';

const PORT = 3000;
const CALLBACK_PATH = '/oauth2callback';
const REDIRECT_URI = `http://localhost:${PORT}${CALLBACK_PATH}`;

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const SENDER = process.env.GMAIL_SENDER || process.env.EMAIL_FROM || '';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET in environment.');
  process.exit(1);
}

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function main() {
  const app = express();
  const server = app.listen(PORT, () => {
    console.log(`OAuth helper listening on ${REDIRECT_URI}`);
  });

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('\nAuthorize this app by visiting:\n', authUrl, '\n');
  try {
    await open(authUrl);
  } catch (e) {
    // headless environment; ignore
  }

  app.get(CALLBACK_PATH, async (req, res) => {
    const code = req.query.code;
    if (!code) {
      res.status(400).send('Missing code query parameter');
      return;
    }
    try {
      const { tokens } = await oauth2Client.getToken(String(code));
      console.log('\nReceived tokens from Google OAuth:\n');
      console.log(JSON.stringify(tokens, null, 2));
      if (tokens.refresh_token) {
        console.log('\nAdd these to server/.env and hosting env:');
        console.log('EMAIL_PROVIDER=gmailapi');
        if (SENDER) console.log(`GMAIL_SENDER=${SENDER}`);
        console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
        console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
      } else {
        console.warn('\nNo refresh_token returned. Ensure prompt=consent and access_type=offline, and try again.');
      }
      res.send('Success! You can close this tab and return to the terminal.');
    } catch (err) {
      console.error('Error exchanging code for tokens:', err?.message || err);
      res.status(500).send('Failed to exchange code for tokens');
    } finally {
      setTimeout(() => server.close(() => process.exit(0)), 500);
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
