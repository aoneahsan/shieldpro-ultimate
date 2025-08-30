const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const dotenv = require('dotenv');

dotenv.config();

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const isProduction = argv.mode === 'production';

  return {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'inline-source-map' : 'source-map',

    entry: {
      popup: './src/popup/index.tsx',
      options: './src/options/index.tsx',
      background: './src/background/service-worker.ts',
      content: './src/content/content.ts',
      'youtube-blocker': './src/content/youtube-blocker.ts'
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/background': path.resolve(__dirname, 'src/background'),
        '@/content': path.resolve(__dirname, 'src/content'),
        '@/popup': path.resolve(__dirname, 'src/popup'),
        '@/options': path.resolve(__dirname, 'src/options'),
        '@/shared': path.resolve(__dirname, 'src/shared'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/hooks': path.resolve(__dirname, 'src/hooks'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/config': path.resolve(__dirname, 'src/config'),
        '@/stores': path.resolve(__dirname, 'src/stores'),
        '@/assets': path.resolve(__dirname, 'src/assets'),
        '@/locales': path.resolve(__dirname, 'src/locales')
      }
    },

    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true, // Skip type checking for now
              compilerOptions: {
                module: 'esnext'
              }
            }
          }
        },
        {
          test: /\.(css|scss)$/,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]'
          }
        }
      ]
    },

    plugins: [
      new CleanWebpackPlugin(),
      
      new webpack.DefinePlugin({
        // Don't override NODE_ENV, webpack handles this automatically
        'process.env': JSON.stringify({
          // Only include environment variables we actually need
          REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY,
          REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
          REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID,
          REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
          REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
          REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID,
          REACT_APP_FIREBASE_MEASUREMENT_ID: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
          REACT_APP_FIREBASE_DATABASE_URL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
          USE_FIREBASE_EMULATOR: process.env.USE_FIREBASE_EMULATOR,
          BUILD_TARGET: process.env.BUILD_TARGET || 'chrome',
          EXTENSION_ID: process.env.EXTENSION_ID,
          EXTENSION_PACKAGE_IDENTIFIER: process.env.EXTENSION_PACKAGE_IDENTIFIER
        })
      }),

      new MiniCssExtractPlugin({
        filename: isDevelopment ? '[name].css' : '[name].[contenthash].css'
      }),

      new HtmlWebpackPlugin({
        template: './public/popup.html',
        filename: 'popup.html',
        chunks: ['vendor', 'popup']
      }),

      new HtmlWebpackPlugin({
        template: './public/options.html',
        filename: 'options.html',
        chunks: ['vendor', 'options']
      }),

      new HtmlWebpackPlugin({
        template: './public/blocked.html',
        filename: 'blocked.html',
        chunks: [],
        minify: false // Don't minify this file
      }),

      new HtmlWebpackPlugin({
        template: './public/tiers-info.html',
        filename: 'tiers-info.html',
        chunks: [],
        minify: false // Don't minify this file as it has parsing issues
      }),

      new HtmlWebpackPlugin({
        template: './src/pages/early-adopter-info.html',
        filename: 'early-adopter.html',
        chunks: [],
        minify: false // Don't minify this file
      }),

      new CopyWebpackPlugin({
        patterns: [
          { from: 'public/manifest.json', to: 'manifest.json' },
          { from: 'public/icons', to: 'icons' },
          { from: 'public/rules', to: 'rules' },
          { from: 'public/youtube.css', to: 'youtube.css' },
          { from: 'public/theme-loader.js', to: 'theme-loader.js' },
          { from: 'src/locales', to: 'locales' },
          { from: 'src/content/content.css', to: 'content.css' }
        ]
      })
    ],

    optimization: {
      minimize: isProduction,
      minimizer: isProduction ? [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true
            }
          }
        })
      ] : [],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
            reuseExistingChunk: true,
            chunks: (chunk) => ['popup', 'options'].includes(chunk.name)
          }
        }
      }
    },

    performance: {
      hints: false, // Suppress all performance warnings
      maxEntrypointSize: 1024000, // 1MB - reasonable for extension
      maxAssetSize: 1024000 // 1MB - reasonable for extension
    }
  };
};