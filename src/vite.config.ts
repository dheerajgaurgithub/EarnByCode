import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  // Set base URL to empty string for relative paths
  const base = '';
  
  return {
    root: __dirname,
    base: base,
    publicDir: path.resolve(__dirname, 'public'),
    build: {
      outDir: path.resolve(__dirname, '../dist'),
      emptyOutDir: true,
      // Ensure proper MIME types for JavaScript modules
      assetsInlineLimit: 0, // Disable inlining of assets
      // Set proper module type
      target: 'esnext',
      // Disable module preload polyfill
      modulePreload: { polyfill: false },
      // Generate manifest for better caching
      manifest: true,
      chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        output: {
          manualChunks: {
            // Split vendor libraries into separate chunks
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // Create a separate chunk for large dependencies
            ui: ['@headlessui/react', '@heroicons/react'],
            // Split code by route with dynamic imports
            // This requires your routes to use React.lazy()
          },
          format: 'esm',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        },
        external: [
          // Server-side dependencies that should not be bundled
          'bcrypt',
          'bcryptjs',
          'mongoose',
          'jsonwebtoken',
          'passport',
          'passport-google-oauth20',
          'stripe',
          'express',
          'express-session',
          'cors',
          'helmet',
          'hpp',
          'xss-clean',
          'express-validator',
          'multer',
          'node-cron',
          'nodemailer',
          'axios',
          'cheerio',
          'cloudinary',
          'connect-mongo',
          'dotenv',
          'express-mongo-sanitize',
          'express-rate-limit'
        ],
      }
    },
    plugins: [react()],
    esbuild: {
      loader: 'tsx',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@components': path.resolve(__dirname, 'components'),
        '@services': path.resolve(__dirname, 'services'),
        '@lib': path.resolve(__dirname, 'lib'),
      },
    },
    server: {
      port: 3000,
      // Set proper MIME types
      mimeTypes: {
        'application/javascript': ['js', 'mjs'],
        'text/javascript': ['js', 'mjs']
      },
      // Enable CORS
      cors: true,
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      fs: {
        strict: true,
      },
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/api/, '')
        }
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
          '.ts': 'tsx',
        },
      },
    },
  };
});
