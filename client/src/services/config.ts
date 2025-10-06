// Shared API base
const DEFAULT_PROD_API = 'https://earnbycode-mfs3.onrender.com/api';
const DEFAULT_DEV_API = 'http://localhost:5000/api';

export function getApiBase(): string {
  const env = (import.meta as any).env || {};
  const base = (env.VITE_API_URL && String(env.VITE_API_URL).trim()) || (env.PROD ? DEFAULT_PROD_API : DEFAULT_DEV_API);
  return String(base).replace(/\/+$/, '');
}
