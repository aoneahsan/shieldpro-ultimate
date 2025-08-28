import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath, URL } from 'node:url';
import manifest from './manifest.config';

// PRODUCTION-ONLY CONFIG
export default defineConfig(() => {
	const env = loadEnv('production', process.cwd(), '');

	return {
		mode: 'production',
		base: './',
		
		define: {
			'process.env.NODE_ENV': JSON.stringify('production'),
			'import.meta.env.MODE': JSON.stringify('production'),
			'import.meta.env.DEV': 'false',
			'import.meta.env.PROD': 'true',
			__DEV__: 'false',
			'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
			'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
			'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
			'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
			'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
			'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
			'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
			'import.meta.env.VITE_USE_FIREBASE_EMULATOR': JSON.stringify(env.VITE_USE_FIREBASE_EMULATOR || 'false'),
		},
		
		plugins: [
			react({
				jsxRuntime: 'automatic',
				jsxImportSource: 'react',
				jsxDev: false, // Force production JSX
				fastRefresh: false,
				tsDecorators: true,
				babel: {
					plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic', development: false }]]
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
		
		esbuild: {
			jsx: 'automatic',
			jsxImportSource: 'react',
			minify: true,
			drop: ['console', 'debugger'],
			treeShaking: true,
		},
		
		build: {
			minify: 'esbuild',
			sourcemap: false,
			target: 'es2015',
			outDir: 'dist',
			emptyOutDir: true,
			assetsInlineLimit: 4096,
			chunkSizeWarningLimit: 2000,
			cssCodeSplit: false,
		},
		
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
				'@components': fileURLToPath(new URL('./src/components', import.meta.url)),
				'@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
				'@services': fileURLToPath(new URL('./src/services', import.meta.url)),
				'@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
			},
		},
		
		optimizeDeps: {
			include: ['react', 'react-dom'],
			exclude: ['@crxjs/vite-plugin'],
		},
		
		server: {
			port: 5173,
			host: true,
		},
	};
});