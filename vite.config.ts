import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';
import manifest from './manifest.config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const isDev = mode === 'development';
	const isProd = mode === 'production';

	// Load environment variables
	const env = loadEnv(mode, process.cwd(), '');

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
				},
			}),
		],

		// Build optimizations
		build: {
			// Use Rollup for production builds
			minify: isProd ? 'terser' : false,

			// Better tree-shaking
			rollupOptions: {
				input: {
					popup: resolve(process.cwd(), 'src/popup/index.html'),
					options: resolve(process.cwd(), 'src/options/index.html'),
					'early-adopter': resolve(
						process.cwd(),
						'src/pages/early-adopter-info.html'
					),
				},
				output: {
					// Code splitting
					manualChunks: {
						'react-vendor': ['react', 'react-dom'],
						'firebase-vendor': [
							'firebase/app',
							'firebase/auth',
							'firebase/firestore',
						],
						'ui-vendor': [
							'@radix-ui/react-dialog',
							'@radix-ui/react-dropdown-menu',
							'@radix-ui/react-tabs',
						],
						utils: ['zustand', 'clsx', 'tailwind-merge'],
					},
					// Better chunk names
					chunkFileNames: isDev
						? 'assets/[name].js'
						: 'assets/[name].[hash].js',
					entryFileNames: '[name].js',
					assetFileNames: 'assets/[name].[ext]',
				},
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
			assetsInlineLimit: 4096,
		},

		// Development server
		server: {
			port: 3000,
			strictPort: true,
			hmr: {
				port: 3001,
			},
			// Open browser automatically
			open: '/popup.html',
		},

		// Path resolution
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
				'@background': fileURLToPath(
					new URL('./src/background', import.meta.url)
				),
				'@content': fileURLToPath(new URL('./src/content', import.meta.url)),
				'@popup': fileURLToPath(new URL('./src/popup', import.meta.url)),
				'@options': fileURLToPath(new URL('./src/options', import.meta.url)),
				'@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
				'@components': fileURLToPath(
					new URL('./src/components', import.meta.url)
				),
				'@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
				'@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
				'@services': fileURLToPath(new URL('./src/services', import.meta.url)),
				'@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
				'@types': fileURLToPath(new URL('./src/types', import.meta.url)),
			},
		},

		// CSS configuration
		css: {
			modules: {
				localsConvention: 'camelCase',
			},
		},

		// Optimizations
		optimizeDeps: {
			include: [
				'react',
				'react-dom',
				'firebase/app',
				'firebase/auth',
				'firebase/firestore',
				'zustand',
			],
			exclude: ['@crxjs/vite-plugin'],
		},

		// Environment variables
		define: {
			'process.env.NODE_ENV': JSON.stringify(mode),
			'process.env': JSON.stringify({
				REACT_APP_FIREBASE_API_KEY: env.REACT_APP_FIREBASE_API_KEY,
				REACT_APP_FIREBASE_AUTH_DOMAIN: env.REACT_APP_FIREBASE_AUTH_DOMAIN,
				REACT_APP_FIREBASE_PROJECT_ID: env.REACT_APP_FIREBASE_PROJECT_ID,
				REACT_APP_FIREBASE_STORAGE_BUCKET:
					env.REACT_APP_FIREBASE_STORAGE_BUCKET,
				REACT_APP_FIREBASE_MESSAGING_SENDER_ID:
					env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
				REACT_APP_FIREBASE_APP_ID: env.REACT_APP_FIREBASE_APP_ID,
				REACT_APP_FIREBASE_MEASUREMENT_ID:
					env.REACT_APP_FIREBASE_MEASUREMENT_ID,
				USE_FIREBASE_EMULATOR: env.USE_FIREBASE_EMULATOR,
			}),
		},

		// Performance optimizations
		esbuild: {
			// Use esbuild for faster transforms
			target: 'es2020',
			jsxFactory: 'React.createElement',
			jsxFragment: 'React.Fragment',
			// Remove console.log in production
			drop: isProd ? ['console', 'debugger'] : [],
		},

		// Worker configuration
		worker: {
			format: 'es',
		},
	};
});
