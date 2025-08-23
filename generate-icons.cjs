const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconSizes = [16, 32, 48, 128];

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.2"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="128" height="128" rx="24" fill="url(#bgGradient)"/>
  
  <!-- Shield Shape -->
  <path d="M64 20 L88 32 L88 60 C88 80 76 96 64 100 C52 96 40 80 40 60 L40 32 Z" 
        fill="white" 
        opacity="0.95"
        filter="url(#shadow)"/>
  
  <!-- Shield Icon -->
  <path d="M64 40 L76 46 L76 60 C76 70 70 78 64 80 C58 78 52 70 52 60 L52 46 Z" 
        fill="url(#bgGradient)"/>
  
  <!-- Checkmark -->
  <path d="M58 58 L62 62 L70 54" 
        stroke="white" 
        stroke-width="3" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        fill="none"/>
</svg>`;

async function generateIcons() {
  console.log('🎨 Generating icon files...\n');
  
  // Create directories if they don't exist
  const publicIconsDir = path.join(__dirname, 'public', 'icons');
  const distIconsDir = path.join(__dirname, 'dist', 'icons');
  
  if (!fs.existsSync(publicIconsDir)) {
    fs.mkdirSync(publicIconsDir, { recursive: true });
  }
  
  if (!fs.existsSync(distIconsDir)) {
    fs.mkdirSync(distIconsDir, { recursive: true });
  }

  for (const size of iconSizes) {
    const svgBuffer = Buffer.from(svgContent);
    
    try {
      // Generate PNG from SVG
      const pngBuffer = await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer();
      
      // Save to both public and dist directories
      const publicPngPath = path.join(publicIconsDir, `icon-${size}.png`);
      const distPngPath = path.join(distIconsDir, `icon-${size}.png`);
      
      fs.writeFileSync(publicPngPath, pngBuffer);
      fs.writeFileSync(distPngPath, pngBuffer);
      
      console.log(`✅ Generated icon-${size}.png (${pngBuffer.length} bytes)`);
      
      // Also save SVG files with proper content
      const svgPath = path.join(publicIconsDir, `icon-${size}.svg`);
      const distSvgPath = path.join(distIconsDir, `icon-${size}.svg`);
      
      fs.writeFileSync(svgPath, svgContent);
      fs.writeFileSync(distSvgPath, svgContent);
      
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}.png:`, error.message);
    }
  }
  
  console.log('\n🎉 Icon generation complete!');
}

generateIcons().catch(console.error);