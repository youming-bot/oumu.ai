const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.max(12, size * 0.2)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SL', size / 2, size / 2);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/${filename}`, buffer);
  console.log(`Created ${filename}`);
}

// Create all required icons
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
iconSizes.forEach(size => {
  createIcon(size, `icon-${size}.png`);
});

// Create favicon
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#3b82f6';
ctx.fillRect(0, 0, 32, 32);
ctx.fillStyle = 'white';
ctx.font = 'bold 10px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('SL', 16, 16);
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/favicon.ico', buffer);
console.log('Created favicon.ico');

// Create placeholder screenshots
function createScreenshot(width, height, filename, label) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // App preview content
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.6);

  // Title
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Shadowing Learning', width / 2, height * 0.15);

  // Content
  ctx.font = '16px Arial';
  ctx.fillText('Audio Player with Transcripts', width / 2, height * 0.3);
  ctx.fillText('Terminology Glossary', width / 2, height * 0.4);
  ctx.fillText('Language Learning Tools', width / 2, height * 0.5);

  // Label
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.fillText(label, width / 2, height - 20);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/${filename}`, buffer);
  console.log(`Created ${filename}`);
}

// Create placeholder screenshots
createScreenshot(1280, 720, 'screenshot-1.png', 'Desktop View');
createScreenshot(750, 1334, 'screenshot-2.png', 'Mobile View');