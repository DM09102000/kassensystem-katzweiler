import fs from 'fs';
import path from 'path';

// Create SVG representation of app icon
function createIconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#0f172a"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.4}" fill="#d4af37" opacity="0.2"/>
    <text x="50%" y="54%" font-family="sans-serif" font-size="${size * 0.45}" text-anchor="middle" dominant-baseline="middle">🍔</text>
  </svg>`;
}

const publicDir = path.resolve('frontend/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createIconSvg(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createIconSvg(512));

console.log('PWA icons created successfully!');
