import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';
import fs from 'fs';
import path from 'path';

// Custom plugin to fix HTML output
function fixExtensionHtml() {
  return {
    name: 'fix-extension-html',
    enforce: 'post',
    generateBundle(options, bundle) {
      // Process each HTML file in the bundle
      for (const fileName in bundle) {
        if (fileName.endsWith('.html')) {
          const htmlAsset = bundle[fileName];
          if (htmlAsset.type === 'asset' && typeof htmlAsset.source === 'string') {
            let html = htmlAsset.source;
            
            // Determine if this is popup or options
            const isPopup = fileName.includes('popup');
            const isOptions = fileName.includes('options');
            
            if (isPopup || isOptions) {
              // Remove the nested src folder structure from output
              const newFileName = isPopup ? 'popup.html' : 'options.html';
              
              // Fix theme-loader path
              html = html.replace(/src=".*?theme-loader\.js"/g, 'src="theme-loader.js"');
              html = html.replace(/<script src="[^"]*theme-loader\.js"[^>]*><\/script>/g, '<script src="theme-loader.js"></script>');
              
              // Ensure opacity is 1
              html = html.replace(/opacity:\s*0/g, 'opacity: 1');
              
              // Fix asset paths - remove any nested paths
              html = html.replace(/href="\.\.\/\.\.\/assets\//g, 'href="assets/');
              html = html.replace(/src="\.\.\/\.\.\/assets\//g, 'src="assets/');
              html = html.replace(/href="\.\.\/assets\//g, 'href="assets/');
              html = html.replace(/src="\.\.\/assets\//g, 'src="assets/');
              
              // Fix the main script path
              if (isPopup) {
                html = html.replace(/<script[^>]*src="[^"]*popup[^"]*"[^>]*><\/script>/g, 
                  '<script type="module" crossorigin src="popup.js"></script>');
              } else if (isOptions) {
                html = html.replace(/<script[^>]*src="[^"]*options[^"]*"[^>]*><\/script>/g, 
                  '<script type="module" crossorigin src="options.js"></script>');
              }
              
              // Update the bundle with fixed HTML
              htmlAsset.source = html;
              
              // Create a new entry at root level
              bundle[newFileName] = {
                ...htmlAsset,
                fileName: newFileName,
                source: html
              };
              
              // Keep the original in src folder for reference but don't delete it yet
              // as it might be referenced elsewhere
            }
          }
        }
      }
    },
    writeBundle(options, bundle) {
      // Copy theme-loader.js to dist
      const themeLoaderSrc = resolve(__dirname, 'public/theme-loader.js');
      const themeLoaderDest = resolve(options.dir, 'theme-loader.js');
      if (fs.existsSync(themeLoaderSrc)) {
        fs.copyFileSync(themeLoaderSrc, themeLoaderDest);
      }
      
      // Copy content.css to dist
      const contentCssSrc = resolve(__dirname, 'public/content.css');
      const contentCssDest = resolve(options.dir, 'content.css');
      if (fs.existsSync(contentCssSrc)) {
        fs.copyFileSync(contentCssSrc, contentCssDest);
      }
      
      // Copy manifest.json to dist
      const manifestSrc = resolve(__dirname, 'public/manifest.json');
      const manifestDest = resolve(options.dir, 'manifest.json');
      if (fs.existsSync(manifestSrc)) {
        fs.copyFileSync(manifestSrc, manifestDest);
      }
      
      // Copy icons folder
      const iconsSrc = resolve(__dirname, 'public/icons');
      const iconsDest = resolve(options.dir, 'icons');
      if (fs.existsSync(iconsSrc) && !fs.existsSync(iconsDest)) {
        fs.mkdirSync(iconsDest, { recursive: true });
      }
      if (fs.existsSync(iconsSrc)) {
        const files = fs.readdirSync(iconsSrc);
        files.forEach(file => {
          fs.copyFileSync(
            path.join(iconsSrc, file),
            path.join(iconsDest, file)
          );
        });
      }
      
      // Copy rules folder
      const rulesSrc = resolve(__dirname, 'public/rules');
      const rulesDest = resolve(options.dir, 'rules');
      if (fs.existsSync(rulesSrc) && !fs.existsSync(rulesDest)) {
        fs.mkdirSync(rulesDest, { recursive: true });
      }
      if (fs.existsSync(rulesSrc)) {
        const files = fs.readdirSync(rulesSrc);
        files.forEach(file => {
          fs.copyFileSync(
            path.join(rulesSrc, file),
            path.join(rulesDest, file)
          );
        });
      }
      
      // Copy _locales folder
      const localesSrc = resolve(__dirname, 'public/_locales');
      const localesDest = resolve(options.dir, '_locales');
      if (fs.existsSync(localesSrc)) {
        copyFolderRecursive(localesSrc, localesDest);
      }
    }
  };
}

// Helper function to copy folder recursively
function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(file => {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursive(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    });
  }
}

export default defineConfig({
  mode: 'production',
  base: './',
  
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env.DEV': JSON.stringify(false),
    'import.meta.env.PROD': JSON.stringify(true),
  },
  
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      jsxDev: false,
      fastRefresh: false,
    }),
    fixExtensionHtml(),
  ],
  
  esbuild: {
    jsx: 'automatic',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    minify: true,
    drop: ['console', 'debugger'],
  },
  
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
        content: resolve(__dirname, 'src/content/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep HTML files at root
          if (assetInfo.name?.endsWith('.html')) {
            return '[name][extname]';
          }
          // Everything else goes to assets
          return 'assets/[name].[ext]';
        },
      },
    },
    target: 'chrome90',
  },
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});