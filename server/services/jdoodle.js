import axios from 'axios';
import https from 'https';

// Axios instance configured for JDoodle via RapidAPI
// Force IPv4 to avoid wsasend IPv6 issues on some Windows networks
const axiosJD = axios.create({
  baseURL: 'https://jdoodle-compiler.p.rapidapi.com',
  timeout: 15000,
  headers: {
    'content-type': 'application/json',
    'X-RapidAPI-Key': process.env.JDOODLE_RAPIDAPI_KEY || '',
    'X-RapidAPI-Host': 'jdoodle-compiler.p.rapidapi.com',
  },
  httpsAgent: new https.Agent({ family: 4, keepAlive: true }),
});

// Map common languages to JDoodle codes and versionIndex
export const JD_LANGUAGE_MAP = {
  cpp: { language: 'cpp17', versionIndex: '5' },
  cplusplus: { language: 'cpp17', versionIndex: '5' },
  'c++': { language: 'cpp17', versionIndex: '5' },
  java: { language: 'java', versionIndex: '4' },
  python: { language: 'python3', versionIndex: '3' },
  python3: { language: 'python3', versionIndex: '3' },
  py: { language: 'python3', versionIndex: '3' },
  node: { language: 'nodejs', versionIndex: '3' },
  javascript: { language: 'nodejs', versionIndex: '3' },
  js: { language: 'nodejs', versionIndex: '3' },
  go: { language: 'go', versionIndex: '3' },
  csharp: { language: 'csharp', versionIndex: '3' },
  'c#': { language: 'csharp', versionIndex: '3' },
  php: { language: 'php', versionIndex: '3' },
};

export async function jdoodleExecute({ code, language, stdin = '', versionIndex }) {
  if (!process.env.JDOODLE_RAPIDAPI_KEY) {
    const e = new Error('JDoodle RapidAPI key missing. Set JDOODLE_RAPIDAPI_KEY in server/.env');
    e.status = 500;
    throw e;
  }

  const key = String(language || '').toLowerCase().trim();
  const mapped = JD_LANGUAGE_MAP[key] || null;
  if (!mapped) {
    const e = new Error(`Unsupported language: ${language}`);
    e.status = 400;
    throw e;
  }

  // Allow explicit versionIndex override
  const lang = mapped.language;
  const ver = versionIndex ?? mapped.versionIndex;

  const payload = {
    script: code,
    language: lang,
    versionIndex: String(ver),
    stdin: String(stdin || ''),
  };

  // Simple retry policy for transient network errors
  const MAX_RETRIES = 3;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data } = await axiosJD.post('/v1/execute', payload);
      const statusCode = Number(data?.statusCode);
      return {
        stdout: String(data?.output || ''),
        stderr: String(data?.error || ''),
        exitCode: statusCode === 200 ? 0 : 1,
        runtimeMs: data?.cpuTime ? Math.round(parseFloat(String(data.cpuTime)) * 1000) : undefined,
        memoryKb: data?.memory ? parseInt(String(data.memory), 10) : undefined,
        raw: data,
      };
    } catch (err) {
      lastErr = err;
      const isLast = attempt === MAX_RETRIES;
      const msg = String(err?.message || err);
      // Known transient network/remote close cases
      const transient = /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENETUNREACH|socket hang up|forcibly closed/i.test(msg);
      if (!transient || isLast) break;
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }

  // Normalize error
  const err = lastErr || new Error('JDoodle execution failed');
  if (err.response) {
    const status = err.response.status || 502;
    const message = err.response.data?.message || err.response.statusText || 'JDoodle API error';
    const e = new Error(message);
    e.status = status;
    throw e;
  }
  if (err.request) {
    const e = new Error('JDoodle API unreachable');
    e.status = 502;
    throw e;
  }
  err.status = err.status || 500;
  throw err;
}

export async function jdoodleLanguages() {
  if (!process.env.JDOODLE_RAPIDAPI_KEY) {
    const e = new Error('JDoodle RapidAPI key missing. Set JDOODLE_RAPIDAPI_KEY in server/.env');
    e.status = 500;
    throw e;
  }
  const { data } = await axiosJD.get('/v1/languages');
  return data;
}
