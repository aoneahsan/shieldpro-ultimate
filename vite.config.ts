import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import manifest from './manifest.config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const isProd = mode === 'production';

  return {
    plugins: [
      // React with SWC for faster builds
      react(),
      
      // TypeScript path resolution
      tsconfigPaths(),
      
      // Chrome Extension plugin
      crx({
        manifest,
        contentScripts: {
          injectCss: true,
          // Enable HMR in content scripts
          hmr: isDev
        }
      })
    ],

    // Build optimizations
    build: {
      // Use Rollup for production builds
      minify: isProd ? 'terser' : false,
      
      // Better tree-shaking
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/index.html'),
          options: resolve(__dirname, 'src/options/index.html'),
          'early-adopter': resolve(__dirname, 'src/pages/early-adopter-info.html')
        },
        output: {
          // Code splitting
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
            'utils': ['zustand', 'clsx', 'tailwind-merge']
          },
          // Better chunk names
          chunkFileNames: isDev 
            ? 'assets/[name].js'
            : 'assets/[name].[hash].js',
          entryFileNames: '[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      },
      
      // Output directory
      outDir: 'dist',
      
      // Empty output directory before build
      emptyOutDir: true,
      
      // Source maps for debugging
      sourcemap: isDev,
      
      // Target modern browsers
      target: 'chrome90',
      
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Better compression
      reportCompressedSize: isProd,
      
      // Asset handling
      assetsInlineLimit: 4096
    },

    // Development server
    server: {
      port: 3000,
      strictPort: true,
      hmr: {
        port: 3001
      },
      // Open browser automatically
      open: '/popup.html'
    },

    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@background': resolve(__dirname, './src/background'),
        '@content': resolve(__dirname, './src/content'),
        '@popup': resolve(__dirname, './src/popup'),
        '@options': resolve(__dirname, './src/options'),
        '@shared': resolve(__dirname, './src/shared'),
        '@components': resolve(__dirname, './src/components'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@utils': resolve(__dirname, './src/utils'),
        '@services': resolve(__dirname, './src/services'),
        '@assets': resolve(__dirname, './src/assets'),
        '@types': resolve(__dirname, './src/types')
      }
    },

    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    },

    // Optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'zustand'
      ],
      exclude: ['@crxjs/vite-plugin']
    },

    // Environment variables
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID)
    },

    // Performance optimizations
    esbuild: {
      // Use esbuild for faster transforms
      target: 'es2020',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      // Remove console.log in production
      drop: isProd ? ['console', 'debugger'] : []
    },

    // Worker configuration
    worker: {
      format: 'es'
    }
  };
});