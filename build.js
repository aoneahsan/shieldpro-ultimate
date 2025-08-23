#!/usr/bin/env node
import webpack from 'webpack';
import config from './webpack.config.js';

const compiler = webpack(config({}, { mode: 'production' }));

compiler.run((err, stats) => {
  if (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
  
  if (stats.hasErrors()) {
    console.error('Build errors:', stats.toString({ colors: true }));
    process.exit(1);
  }
  
  console.log('Build completed successfully!');
  console.log(stats.toString({ 
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }));
});