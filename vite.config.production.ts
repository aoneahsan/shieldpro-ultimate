import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';
import manifest from './manifest.config';

// PRODUCTION-ONLY CONFIG TO PREVENT jsxDEV ERRORS
export default defineConfig(() => {
	const env = loadEnv('production', process.cwd(), '');

	return {
		mode: 'production',
		base: './',
		
		// CRITICAL: Force production environment
		define: {
			'process.env.NODE_ENV': JSON.stringify('production'),
			'__DEV__': 'false',
			'__PROD__': 'true',
			'process.env': JSON.stringify({
				NODE_ENV: 'production',
				REACT_APP_FIREBASE_API_KEY: env.REACT_APP_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY,
				REACT_APP_FIREBASE_AUTH_DOMAIN: env.REACT_APP_FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN,
				REACT_APP_FIREBASE_PROJECT_ID: env.REACT_APP_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID,
				REACT_APP_FIREBASE_STORAGE_BUCKET: env.REACT_APP_FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGE_BUCKET,
				REACT_APP_FIREBASE_MESSAGING_SENDER_ID: env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGING_SENDER_ID,
				REACT_APP_FIREBASE_APP_ID: env.REACT_APP_FIREBASE_APP_ID || env.VITE_FIREBASE_APP_ID,
				REACT_APP_FIREBASE_MEASUREMENT_ID: env.REACT_APP_FIREBASE_MEASUREMENT_ID || env.VITE_FIREBASE_MEASUREMENT_ID,
				USE_FIREBASE_EMULATOR: env.USE_FIREBASE_EMULATOR || env.VITE_USE_FIREBASE_EMULATOR || 'false',
			}),
			'import.meta.env.MODE': JSON.stringify('production'),
			'import.meta.env.PROD': 'true',
			'import.meta.env.DEV': 'false',
			'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || env.REACT_APP_FIREBASE_API_KEY),
			'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || env.REACT_APP_FIREBASE_AUTH_DOMAIN),
			'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || env.REACT_APP_FIREBASE_PROJECT_ID),
			'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || env.REACT_APP_FIREBASE_STORAGE_BUCKET),
			'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID),
			'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || env.REACT_APP_FIREBASE_APP_ID),
			'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID || env.REACT_APP_FIREBASE_MEASUREMENT_ID),
			'import.meta.env.VITE_USE_FIREBASE_EMULATOR': JSON.stringify(env.VITE_USE_FIREBASE_EMULATOR || env.USE_FIREBASE_EMULATOR || 'false'),
		},
		
		plugins: [
			// React plugin with production settings - NO development runtime
			react({
				jsxRuntime: 'automatic',
				jsxImportSource: 'react',
				fastRefresh: false, // DISABLED for production
				tsDecorators: true,
				// Force production babel transforms
				babel: {
					plugins: [
						['@babel/plugin-transform-react-jsx', { 
							runtime: 'automatic',
							development: false,
							importSource: 'react'
						}]
					],
					presets: [
						['@babel/preset-react', {
							runtime: 'automatic',
							development: false
						}]
					]
				}
			}),
			
			tsconfigPaths(),
			
			crx({
				manifest,
				contentScripts: {
					injectCss: true,
				},
			}),
		],
		
		// ESBuild settings for production - NO DEV FUNCTIONS
		esbuild: {
			jsx: 'automatic',
			jsxDev: false, // CRITICAL: Disable jsxDev
			jsxFactory: 'React.createElement',
			jsxFragment: 'React.Fragment',
			jsxImportSource: 'react',
			minify: true,
			minifyIdentifiers: true,
			minifySyntax: true,
			minifyWhitespace: true,
			drop: ['console', 'debugger'],
			pure: ['console.log', 'console.debug', 'console.info'],
			legalComments: 'none',
			treeShaking: true,
		},
		
		build: {
			minify: 'terser',
			sourcemap: false,
			outDir: 'dist',
			emptyOutDir: true,
			
			terserOptions: {
				compress: {
					drop_console: true,
					drop_debugger: true,
					pure_funcs: ['console.log', 'console.info', 'console.debug'],
					passes: 2,
					unsafe: true,
					unsafe_comps: true,
					unsafe_math: true,
					unsafe_proto: true,
				},
				mangle: {
					properties: {
						regex: /^_/,
					},
				},
				format: {
					comments: false,
				},
			},
			
			rollupOptions: {
				input: {
					popup: resolve(process.cwd(), 'src/popup/index.html'),
					options: resolve(process.cwd(), 'src/options/index.html'),
					'service-worker': resolve(process.cwd(), 'src/background/service-worker.ts'),
				},
				output: {
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
					
					// Ensure consistent naming
					entryFileNames: '[name].js',
					chunkFileNames: 'chunks/[name]-[hash].js',
					assetFileNames: 'assets/[name].[ext]',
					
					// Inject production mode at the top of every bundle (except service workers)
					intro: (chunkInfo) => {
						// Don't inject window references in service worker chunks
						if (chunkInfo.name?.includes('service-worker')) {
							return `
								if (typeof process === 'undefined') {
									globalThis.process = { env: { NODE_ENV: 'production' } };
								} else {
									process.env.NODE_ENV = 'production';
								}
							`;
						}
						// For other chunks, use window in browser context
						return `
							if (typeof process === 'undefined') {
								if (typeof window !== 'undefined') {
									window.process = { env: { NODE_ENV: 'production' } };
								} else {
									globalThis.process = { env: { NODE_ENV: 'production' } };
								}
							} else {
								process.env.NODE_ENV = 'production';
							}
						`;
					},
				},
				// Maximum tree shaking
				treeshake: {
					preset: 'recommended',
					moduleSideEffects: false,
					propertyReadSideEffects: false,
					tryCatchDeoptimization: false,
				},
			},
			
			// Ensure React is in production mode
			commonjsOptions: {
				transformMixedEsModules: true,
				defaultIsModuleExports: 'auto',
			},
			
			target: 'chrome90',
			chunkSizeWarningLimit: 1000,
			cssCodeSplit: true,
			reportCompressedSize: true,
			assetsInlineLimit: 4096,
		},
		
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
				'@background': fileURLToPath(new URL('./src/background', import.meta.url)),
				'@content': fileURLToPath(new URL('./src/content', import.meta.url)),
				'@popup': fileURLToPath(new URL('./src/popup', import.meta.url)),
				'@options': fileURLToPath(new URL('./src/options', import.meta.url)),
				'@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
				'@components': fileURLToPath(new URL('./src/components', import.meta.url)),
				'@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
				'@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
				'@services': fileURLToPath(new URL('./src/services', import.meta.url)),
				'@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
				'@types': fileURLToPath(new URL('./src/types', import.meta.url)),
			},
		},
		
		css: {
			modules: {
				localsConvention: 'camelCase',
			},
		},
		
		optimizeDeps: {
			include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'zustand'],
			exclude: ['@crxjs/vite-plugin'],
			force: true,
		},
		
		// Prevent any development mode features
		server: {
			hmr: false,
		},
		
		worker: {
			format: 'es',
		},
	};
});