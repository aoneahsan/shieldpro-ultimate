import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import manifest from './manifest.config';

// PRODUCTION-ONLY CONFIG TO PREVENT jsxDEV ERRORS
export default defineConfig({
	mode: 'production',
	base: './',
	
	// CRITICAL: Force production environment
	define: {
		'process.env.NODE_ENV': JSON.stringify('production'),
		'process.env': JSON.stringify({ NODE_ENV: 'production' }),
	},
	
	plugins: [
		// React plugin with production settings
		react({
			jsxRuntime: 'automatic',
			jsxImportSource: 'react',
			fastRefresh: false, // DISABLED for production
			tsDecorators: true,
		}),
		
		tsconfigPaths(),
		
		crx({
			manifest,
			contentScripts: {
				injectCss: true,
			},
		}),
	],
	
	// ESBuild settings for production
	esbuild: {
		jsx: 'automatic',
		jsxDev: false, // CRITICAL: Disable jsxDev
		jsxFactory: 'React.createElement',
		jsxFragment: 'React.Fragment',
		minify: true,
		minifyIdentifiers: true,
		minifySyntax: true,
		minifyWhitespace: true,
		drop: ['console', 'debugger'],
		pure: ['console.log'],
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
				pure_funcs: ['console.log', 'console.info'],
			},
			mangle: true,
			format: {
				comments: false,
			},
		},
		
		rollupOptions: {
			input: {
				popup: resolve(process.cwd(), 'src/popup/index.html'),
				options: resolve(process.cwd(), 'src/options/index.html'),
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
			},
		},
		
		// Ensure React is in production mode
		commonjsOptions: {
			transformMixedEsModules: true,
			defaultIsModuleExports: 'auto',
		},
	},
	
	resolve: {
		alias: {
			'@': resolve(process.cwd(), './src'),
		},
	},
	
	optimizeDeps: {
		include: ['react', 'react-dom'],
		exclude: ['@crxjs/vite-plugin'],
	},
});