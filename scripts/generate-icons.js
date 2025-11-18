const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 384];
const sourceIcon = path.join(__dirname, '../public/icons/manifest-icon-512.maskable.png');

async function generateIcons() {
  try {
    // Read the source icon
    const sourceBuffer = fs.readFileSync(sourceIcon);
    
    for (const size of sizes) {
      const outputPath = path.join(__dirname, `../public/icons/icon-${size}x${size}.png`);
      
      await sharp(sourceBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated icon-${size}x${size}.png`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
