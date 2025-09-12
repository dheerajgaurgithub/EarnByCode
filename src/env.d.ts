/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: 'https://algobucks.onrender.com';
  // add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
