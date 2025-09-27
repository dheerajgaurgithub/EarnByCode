import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('[cleanup] Missing MONGO_URI (or DATABASE_URL/MONGODB_URI) in environment');
  process.exit(1);
}

async function run() {
  try {
    console.log('[cleanup] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { 
      // useNewUrlParser and useUnifiedTopology are default in mongoose >= 6
    });
    console.log('[cleanup] Connected.');

    const User = (await import('../models/User.js')).default;

    const unsetSpec = {
      'bankDetails.bankOtp': '',
      'bankDetails.bankOtpExpires': '',
      'pendingEmailChange': '',
      'emailChangeOtp': '',
      'emailChangeOtpExpires': ''
    };

    console.log('[cleanup] Unsetting legacy OTP fields on all users...');
    const res = await User.updateMany({}, { $unset: unsetSpec });
    console.log(`[cleanup] Matched: ${res.matchedCount ?? res.n}, Modified: ${res.modifiedCount ?? res.nModified}`);

    console.log('[cleanup] Done.');
  } catch (e) {
    console.error('[cleanup] Error:', e?.message || e);
    process.exitCode = 1;
  } finally {
    try { await mongoose.disconnect(); } catch {}
  }
}

run();
