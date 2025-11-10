// Simple script to create placeholder images using canvas
const fs = require('fs');

// Create a simple 1x1 pixel PNG in base64 and decode it to create larger images
// This is a minimal valid PNG file (1x1 transparent pixel)
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// For actual placeholder images, let's create SVGs which are smaller and will work
const createSVG = (text, color) => `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${color}"/>
  <text x="50%" y="50%" font-family="Arial" font-size="48" fill="white" text-anchor="middle" dy=".3em">${text}</text>
</svg>`.trim();

// Write SVG files
fs.writeFileSync('public/pic1.svg', createSVG('Image 1', '#10b981'));
fs.writeFileSync('public/pic2.svg', createSVG('Image 2', '#3b82f6'));
fs.writeFileSync('public/pic3.svg', createSVG('Image 3', '#8b5cf6'));
fs.writeFileSync('public/logo.svg', createSVG('PujiGori', '#059669'));

console.log('SVG placeholder images created successfully!');
