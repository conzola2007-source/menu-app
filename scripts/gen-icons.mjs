// Run with: node scripts/gen-icons.mjs
// Generates simple placeholder PWA icons (solid zinc-900 with white M)
// In production, replace with proper PNG icons from a designer

import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, size, size);

  // Rounded corners clip (approximate)
  // Letter M
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(size * 0.55)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icon-192.png', generateIcon(192));
writeFileSync('public/icon-512.png', generateIcon(512));
console.log('Icons generated: public/icon-192.png, public/icon-512.png');
