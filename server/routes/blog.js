import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Resolve current directory (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory cache
let cache = {
  data: null,
  expiresAt: 0,
};

const TTL_MS = Number(process.env.BLOG_CACHE_TTL_MS || 5 * 60 * 1000); // default 5 minutes

async function loadFromFile() {
  // Attempt to load from client/public/blog.json in the monorepo
  const localPath = path.join(__dirname, '../../client/public/blog.json');
  const raw = await fs.readFile(localPath, 'utf8');
  return JSON.parse(raw);
}

async function loadFromUrl(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch blog json: ${res.status}`);
  return await res.json();
}

async function getBlogData() {
  const now = Date.now();
  if (cache.data && cache.expiresAt > now) {
    return cache.data;
  }

  const srcUrl = process.env.BLOG_JSON_URL; // optional external CMS/json URL
  let data = [];
  try {
    data = srcUrl ? await loadFromUrl(srcUrl) : await loadFromFile();
  } catch (e) {
    // Fallback: try the alternate path (useful if structure differs)
    try {
      const alt = path.join(__dirname, '../../public/blog.json');
      const raw = await fs.readFile(alt, 'utf8');
      data = JSON.parse(raw);
    } catch (e2) {
      // Final fallback: empty list
      data = [];
    }
  }

  // Basic sanitize/normalize
  if (!Array.isArray(data)) data = [];

  cache = {
    data,
    expiresAt: now + TTL_MS,
  };
  return data;
}

// GET /api/blog?limit=9
router.get('/', async (req, res) => {
  try {
    const all = await getBlogData();
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '0')) || all.length));
    return res.status(200).json(all.slice(0, limit));
  } catch (e) {
    console.error('GET /api/blog error:', e);
    return res.status(500).json([]);
  }
});

// Optional: force refresh cache
router.post('/refresh', async (req, res) => {
  try {
    cache.expiresAt = 0; // expire immediately
    await getBlogData();
    return res.status(200).json({ ok: true, refreshed: true, ttlMs: TTL_MS });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
});

export default router;
