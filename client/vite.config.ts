import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import redirectsPlugin from './vite-redirects-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  return {
    base: isProduction ? '/' : '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Disable sourcemaps in production for smaller bundles
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        format: {
          comments: false
        }
      } : undefined,
      rollupOptions: {
        output: {
          manualChunks: {
            // React ecosystem
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI libraries - group all Radix UI components
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-slot',
              '@radix-ui/react-avatar',
              '@radix-ui/react-label',
              '@radix-ui/react-toast'
            ],
            // Form libraries
            'form-vendor': ['react-hook-form', 'zod'],
            // HTTP client
            'http-vendor': ['axios'],
            // Animation libraries
            'animation-vendor': ['framer-motion'],
            // Date utilities
            'date-vendor': ['date-fns'],
            // Icons
            'icon-vendor': ['lucide-react'],
            // Charts and visualization
            'chart-vendor': ['recharts'],
            // Monaco Editor (large dependency)
            'editor-vendor': ['@monaco-editor/react', 'monaco-editor'],
            // Socket.IO client
            'socket-vendor': ['socket.io-client'],
            // Other large dependencies
            'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority']
          },
          // Optimize chunk file names for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ?
              chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name!.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          }
        },
      },
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Target modern browsers for better performance
      target: 'esnext',
      // Enable tree shaking
      modulePreload: {
        polyfill: false
      }
    },
    plugins: [
      react(),
      redirectsPlugin()
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@services': resolve(__dirname, './src/services'),
        '@lib': resolve(__dirname, './src/lib'),
        '@assets': resolve(__dirname, './src/assets'),
        '@pages': resolve(__dirname, './src/pages'),
        '@context': resolve(__dirname, './src/context'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@utils': resolve(__dirname, './src/utils'),
        '@types': resolve(__dirname, './src/types'),
      },
    },
    server: !isProduction ? {
      port: 5173,
      open: true,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/uploads': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      }
    } : undefined,
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'framer-motion',
        'socket.io-client'
      ]
    },
    // Enable CSS optimization
    css: {
      devSourcemap: !isProduction,
      postcss: './postcss.config.js'
    },
    // Performance optimizations
    esbuild: {
      // Drop console and debugger in production
      drop: isProduction ? ['console', 'debugger'] : []
    }
  };
});
