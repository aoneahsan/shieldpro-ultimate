const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'inline-source-map' : false,
  
  entry: {
    // Extension pages
    popup: './src/popup/index.tsx',
    options: './src/options/index.tsx',
    'tiers-info': './src/tiers-info/index.tsx',
    
    // Background script
    background: './src/background/service-worker.ts',
    
    // Content script
    content: './src/content/content.ts',
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
    // Ensure no hashes in any output files
    chunkFilename: '[name].js',
    assetModuleFilename: 'assets/[name][ext]',
  },
  
  module: {
    rules: [
      // TypeScript and TSX files
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                jsx: 'react-jsx',
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
      
      // CSS files
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      
      // Images and fonts
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  
  plugins: [
    // Clean dist folder before build
    new CleanWebpackPlugin(),
    
    // Extract CSS into separate files (without hash for extension)
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].css',
      ignoreOrder: true,
    }),
    
    // Define environment variables including Firebase config
    // Define __ENV__ as a complete object for browser context
    new webpack.DefinePlugin({
      __ENV__: JSON.stringify({
        NODE_ENV: isDev ? 'development' : 'production',
        VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
        VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
        VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
        VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID || '',
        VITE_USE_FIREBASE_EMULATOR: process.env.VITE_USE_FIREBASE_EMULATOR || 'false',
        VITE_FIREBASE_CLIENT_ID: process.env.VITE_FIREBASE_CLIENT_ID || '526899927330-q60p30m9tjt8nb9av2bgq7tii388kfgf.apps.googleusercontent.com',
      }),
    }),
    
    // Generate popup.html
    new HtmlWebpackPlugin({
      template: './src/popup/index.html',
      filename: 'popup.html',
      chunks: ['popup'],
      inject: 'body',
      minify: !isDev,
      scriptLoading: 'module',
      meta: {
        viewport: 'width=device-width, initial-scale=1.0',
      },
      // Custom template parameters
      templateParameters: {
        isDev,
      },
      // Don't inject CSS with hash, we'll use clean names
      hash: false,
    }),
    
    // Generate options.html
    new HtmlWebpackPlugin({
      template: './src/options/index.html',
      filename: 'options.html',
      chunks: ['options'],
      inject: 'body',
      minify: !isDev,
      scriptLoading: 'module',
      meta: {
        viewport: 'width=device-width, initial-scale=1.0',
      },
      templateParameters: {
        isDev,
      },
      // Don't inject CSS with hash, we'll use clean names
      hash: false,
    }),
    
    // Generate tiers-info.html
    new HtmlWebpackPlugin({
      template: './src/tiers-info/index.html',
      filename: 'tiers-info.html',
      chunks: ['tiers-info'],
      inject: 'body',
      minify: !isDev,
      scriptLoading: 'module',
      meta: {
        viewport: 'width=device-width, initial-scale=1.0',
      },
      templateParameters: {
        isDev,
      },
      // Don't inject CSS with hash, we'll use clean names
      hash: false,
    }),
    
    // Copy static files
    new CopyWebpackPlugin({
      patterns: [
        // Copy manifest.json
        {
          from: 'public/manifest.json',
          to: 'manifest.json',
        },
        
        // Copy icons
        {
          from: 'public/icons',
          to: 'icons',
        },
        
        // Copy rules
        {
          from: 'public/rules',
          to: 'rules',
        },
        
        // Copy locales
        {
          from: 'public/_locales',
          to: '_locales',
        },
        
        // Copy theme-loader.js
        {
          from: 'public/theme-loader.js',
          to: 'theme-loader.js',
        },
        
        // Copy content.css
        {
          from: 'public/content.css',
          to: 'content.css',
        },
        
        // Copy other HTML files (excluding those that will be generated)
        {
          from: 'public/tiers-info.html',
          to: 'tiers-info.html',
        },
        {
          from: 'public/blocked.html',
          to: 'blocked.html',
        },
        {
          from: 'public/early-adopter.html',
          to: 'early-adopter.html',
        },
        {
          from: 'public/free-vs-paid.html',
          to: 'free-vs-paid.html',
        },
      ],
    }),
  ],
  
  optimization: {
    minimize: !isDev,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: !isDev,
            drop_debugger: !isDev,
          },
          mangle: true,
        },
      }),
    ],
    
    splitChunks: {
      chunks: 'async',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          priority: 10,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
        styles: {
          name: (module, chunks, cacheGroupKey) => {
            const allChunksNames = chunks.map((chunk) => chunk.name).join('-');
            return allChunksNames;
          },
          type: 'css/mini-extract',
          chunks: 'all',
          enforce: true,
        },
      },
    },
    // Disable content hashing completely
    moduleIds: 'named',
    chunkIds: 'named',
    realContentHash: false,
  },
  
  // Chrome extension specific settings
  target: 'web',
  
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  
  // Development server config (for testing)
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    hot: false,
    liveReload: false,
    devMiddleware: {
      writeToDisk: true,
    },
  },
  
  // Watch options
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 1000,
  },
};