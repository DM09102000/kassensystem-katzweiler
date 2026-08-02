/**
 * SVG Image generator for Kantine FLB Products (4:3 aspect ratio = 400x300)
 */

function createSvgDataUrl(bg1, bg2, emoji, title, subtitle, accentColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.5"/>
      </filter>
    </defs>
    <rect width="400" height="300" rx="0" fill="url(#bg)"/>
    <circle cx="200" cy="130" r="110" fill="url(#glow)"/>
    <circle cx="200" cy="130" r="70" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
    <text x="200" y="152" font-size="76" text-anchor="middle" filter="url(#shadow)" dominant-baseline="middle">${emoji}</text>
    <rect x="20" y="225" width="360" height="58" rx="10" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="200" y="248" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="200" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="${accentColor}" text-anchor="middle">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const defaultProductImages = {
  'Franziskaner Weizenbier': createSvgDataUrl('#2c1802', '#5c330a', '🍺', 'Franziskaner', 'Hefe-Weizenbier 0,5L', '#f59e0b'),
  'Weizenbier, alkoholfrei': createSvgDataUrl('#0f2b48', '#1d4ed8', '🌾', 'Weizenbier Alkoholfrei', 'Isotonisch & Erfrischend 0,5L', '#60a5fa'),
  'Bier und Biermischgetränke': createSvgDataUrl('#362003', '#78350f', '🍺', 'Pils / Export / Radler', 'Kühles Flaschenbier 0,33L', '#fbbf24'),
  'Gründels, alkoholfrei': createSvgDataUrl('#064e3b', '#047857', '🍻', 'Gründels Alkoholfrei', 'Feinherbes Alkoholfreies 0,33L', '#34d399'),
  'Parkbräu Export': createSvgDataUrl('#451a03', '#92400e', '🍺', 'Parkbräu Export', 'Pfälzer Braukunst 0,5L', '#fef08a'),
  'Sprudel, sauer': createSvgDataUrl('#0c4a6e', '#0284c7', '💧', 'Sprudel Sauer', 'Spritziges Mineralwasser 0,7L', '#38bdf8'),
  'Limo, silber': createSvgDataUrl('#701a75', '#c026d3', '🥤', 'Limo Silber', 'Zitronen- & Orangenlimonade 0,7L', '#f0abfc'),
  'Riesling halbtrocken': createSvgDataUrl('#14532d', '#15803d', '🍷', 'Riesling Halbtrocken', 'Qualitätswein aus der Pfalz', '#86efac'),
  'Portugiesischer Weißherbst': createSvgDataUrl('#831843', '#be185d', '🍷', 'Pfälzer Weißherbst', 'Fruchtiger Roséwein', '#f472b6'),
  'Weinschorle': createSvgDataUrl('#1e293b', '#334155', '🥂', 'Pfälzer Weinschorle', 'Erfrischend & Spritzig', '#cbd5e1'),
  'Sekt': createSvgDataUrl('#713f12', '#ca8a04', '🍾', 'Pfälzer Sekt', 'Feinperlig & Elegent 0,7L', '#fef08a'),
  'Softgetränke': createSvgDataUrl('#450a0a', '#991b1b', '🥤', 'Softdrinks', 'Cola, Fanta, Sprite 0,33L', '#fca5a5'),
  'Bellaris Sprudel, sauer': createSvgDataUrl('#164e63', '#0891b2', '🧊', 'Bellaris Sprudel', 'Mineralwasser 0,33L', '#67e8f9'),
  'Kaffee': createSvgDataUrl('#291e17', '#54392b', '☕', 'Frischer Kaffee', 'Aromatischer Bohnenkaffee', '#d97706'),
  'Ramazotti': createSvgDownUrl('#431407', '#9a3412', '🥃', 'Ramazotti', 'Kräuterlikör auf Eis 0,02L', '#fb923c'),
  'Williamschrist & sonstiges': createSvgDataUrl('#3f6212', '#65a30d', '🍸', 'Williams Christ', 'Edelbrand & Schnaps 0,02L', '#bef264'),
  'Wurst mit Brötchen': createSvgDataUrl('#451a03', '#b45309', '🌭', 'Bratwurst im Brötchen', 'Knusprig gegrillt mit Senf', '#fde047'),
  'Käsebrötchen': createSvgDataUrl('#713f12', '#a16207', '🧀', 'Käsebrötchen', 'Belegtes Brötchen mit Käse', '#fef08a'),
  'Brezel, gebacken': createSvgDataUrl('#451a03', '#92400e', '🥨', 'Ofenfrische Brezel', 'Bayerische Laugenbrezel', '#fef08a'),
  'Brezel, trocken': createSvgDataUrl('#3f2305', '#78350f', '🥨', 'Laugenbrezel', 'Klassische Brezel', '#fef08a'),
  'Erdnüsse': createSvgDataUrl('#78350f', '#d97706', '🥜', 'Knabber-Erdnüsse', 'Geröstet & Gesalzen', '#fef08a'),
  'Chio-Chips': createSvgDataUrl('#7f1d1d', '#dc2626', '🥔', 'Chio Chips', 'Knusprige Kartoffelchips', '#fca5a5'),
};

function createSvgDownUrl(bg1, bg2, emoji, title, subtitle, accentColor) {
  return createSvgDataUrl(bg1, bg2, emoji, title, subtitle, accentColor);
}

export async function populateDefaultProductImages(queryFn) {
  try {
    const res = await queryFn('SELECT id, name FROM products WHERE image_url IS NULL OR image_url = \'\'');
    if (res.rows.length === 0) {
      console.log('All products already have images assigned.');
      return;
    }

    let updatedCount = 0;
    for (const prod of res.rows) {
      // Find matching default image by product name key
      let imgData = null;
      for (const [key, dataUrl] of Object.entries(defaultProductImages)) {
        if (prod.name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(prod.name.toLowerCase())) {
          imgData = dataUrl;
          break;
        }
      }

      if (!imgData) {
        // Fallback default image by category / generic
        imgData = createSvgDataUrl('#1f2937', '#374151', '📦', prod.name, 'Kantine FLB', '#9ca3af');
      }

      await queryFn('UPDATE products SET image_url = $1 WHERE id = $2', [imgData, prod.id]);
      updatedCount++;
    }
    console.log(`Successfully populated ${updatedCount} product images with default 4:3 graphics.`);
  } catch (err) {
    console.error('Error populating default product images:', err.message);
  }
}
