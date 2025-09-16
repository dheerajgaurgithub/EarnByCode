import { PluginOption } from 'vite';
import fs from 'fs';
import path from 'path';

export default function redirectsPlugin(): PluginOption {
  return {
    name: 'vite-plugin-redirects',
    apply: 'build',
    closeBundle: async () => {
      const redirects = [
        '/api/*  https://algobucks.onrender.com/api/:splat  200',
        '/*     /index.html   200'
      ].join('\n');
      
      const outDir = path.resolve(__dirname, 'dist');
      const redirectsPath = path.join(outDir, '_redirects');
      
      try {
        await fs.promises.mkdir(outDir, { recursive: true });
        await fs.promises.writeFile(redirectsPath, redirects, 'utf-8');
        console.log('_redirects file created successfully');
      } catch (error) {
        console.error('Error creating _redirects file:', error);
      }
    },
  };
}
