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
  
  return {
    root: __dirname,
    base: '/',
    publicDir: path.resolve(__dirname, 'public'),
    build: {
      outDir: path.resolve(__dirname, '../dist'),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        output: {
          format: 'esm',
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        }
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
