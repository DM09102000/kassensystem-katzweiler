/**
 * Dynamic SVG Image generator for Kantine FLB Products (4:3 aspect ratio = 400x300)
 * Includes product name, category, and size/unit (size_info)
 */

export function generateProductSvg(name, size_info, category) {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  let bg1 = '#1f2937';
  let bg2 = '#111827';
  let emoji = '📦';
  let accentColor = '#3b82f6';

  if (n.includes('weizen') && n.includes('alkoholfrei')) {
    bg1 = '#0f2b48'; bg2 = '#1d4ed8'; emoji = '🌾'; accentColor = '#60a5fa';
  } else if (n.includes('weizen')) {
    bg1 = '#2c1802'; bg2 = '#5c330a'; emoji = '🍺'; accentColor = '#f59e0b';
  } else if (n.includes('parkbräu') || n.includes('export')) {
    bg1 = '#451a03'; bg2 = '#92400e'; emoji = '🍺'; accentColor = '#fef08a';
  } else if (n.includes('bier') || n.includes('pils') || n.includes('radler')) {
    bg1 = '#362003'; bg2 = '#78350f'; emoji = '🍺'; accentColor = '#fbbf24';
  } else if (n.includes('gründel')) {
    bg1 = '#064e3b'; bg2 = '#047857'; emoji = '🍻'; accentColor = '#34d399';
  } else if (n.includes('riesling')) {
    bg1 = '#14532d'; bg2 = '#15803d'; emoji = '🍷'; accentColor = '#86efac';
  } else if (n.includes('weißherbst') || n.includes('rosé')) {
    bg1 = '#831843'; bg2 = '#be185d'; emoji = '🍷'; accentColor = '#f472b6';
  } else if (n.includes('schorle')) {
    bg1 = '#1e293b'; bg2 = '#334155'; emoji = '🥂'; accentColor = '#cbd5e1';
  } else if (n.includes('sekt')) {
    bg1 = '#713f12'; bg2 = '#ca8a04'; emoji = '🍾'; accentColor = '#fef08a';
  } else if (n.includes('bellaris') || n.includes('sprudel') || n.includes('wasser')) {
    bg1 = '#0c4a6e'; bg2 = '#0284c7'; emoji = '💧'; accentColor = '#38bdf8';
  } else if (n.includes('limo') || n.includes('soft') || n.includes('cola') || n.includes('fanta') || n.includes('sprite')) {
    bg1 = '#701a75'; bg2 = '#c026d3'; emoji = '🥤'; accentColor = '#f0abfc';
  } else if (n.includes('kaffee') || n.includes('espresso')) {
    bg1 = '#291e17'; bg2 = '#54392b'; emoji = '☕'; accentColor = '#d97706';
  } else if (n.includes('ramazotti') || n.includes('williams') || n.includes('schnaps') || n.includes('likör')) {
    bg1 = '#431407'; bg2 = '#9a3412'; emoji = '🥃'; accentColor = '#fb923c';
  } else if (n.includes('wurst') || n.includes('bratwurst')) {
    bg1 = '#451a03'; bg2 = '#b45309'; emoji = '🌭'; accentColor = '#fde047';
  } else if (n.includes('käse')) {
    bg1 = '#713f12'; bg2 = '#a16207'; emoji = '🧀'; accentColor = '#fef08a';
  } else if (n.includes('brezel')) {
    bg1 = '#451a03'; bg2 = '#92400e'; emoji = '🥨'; accentColor = '#fef08a';
  } else if (n.includes('erdnüss') || n.includes('nüsse')) {
    bg1 = '#78350f'; bg2 = '#d97706'; emoji = '🥜'; accentColor = '#fef08a';
  } else if (n.includes('chip')) {
    bg1 = '#7f1d1d'; bg2 = '#dc2626'; emoji = '🥔'; accentColor = '#fca5a5';
  } else if (c.includes('getränk')) {
    bg1 = '#1e1b4b'; bg2 = '#3730a3'; emoji = '🍹'; accentColor = '#818cf8';
  } else if (c.includes('speise') || c.includes('essen')) {
    bg1 = '#451a03'; bg2 = '#78350f'; emoji = '🍔'; accentColor = '#fde047';
  }

  const sizeText = size_info ? String(size_info).trim() : '';

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
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.6"/>
      </filter>
    </defs>
    <rect width="400" height="300" rx="0" fill="url(#bg)"/>
    <circle cx="200" cy="120" r="110" fill="url(#glow)"/>
    <circle cx="200" cy="120" r="65" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
    
    <!-- Big Emoji Icon -->
    <text x="200" y="138" font-size="70" text-anchor="middle" filter="url(#shadow)" dominant-baseline="middle">${emoji}</text>
    
    <!-- Top Right Unit / Size Pill Badge -->
    ${sizeText ? `
      <g transform="translate(380, 24)" text-anchor="end">
        <rect x="-110" y="-14" width="110" height="28" rx="14" fill="${accentColor}" fill-opacity="0.25" stroke="${accentColor}" stroke-width="1.5" />
        <text x="-55" y="4" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle">${sizeText}</text>
      </g>
    ` : ''}

    <!-- Bottom Info Overlay Card -->
    <rect x="16" y="215" width="368" height="68" rx="12" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <text x="200" y="243" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="800" fill="#ffffff" text-anchor="middle">${escapeXml(name)}</text>
    <text x="200" y="266" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="${accentColor}" text-anchor="middle">${sizeText ? `Größe: ${escapeXml(sizeText)} • ` : ''}${escapeXml(category || 'Kantine')}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function populateDefaultProductImages(queryFn, forceAll = false) {
  try {
    const queryStr = forceAll
      ? 'SELECT id, name, size_info, category FROM products'
      : 'SELECT id, name, size_info, category FROM products WHERE image_url IS NULL OR image_url = \'\' OR image_url LIKE \'data:image/svg+xml%\'';
    
    const res = await queryFn(queryStr);
    if (res.rows.length === 0) {
      console.log('No products need image generation.');
      return;
    }

    let updatedCount = 0;
    for (const prod of res.rows) {
      const imgData = generateProductSvg(prod.name, prod.size_info, prod.category);
      await queryFn('UPDATE products SET image_url = $1 WHERE id = $2', [imgData, prod.id]);
      updatedCount++;
    }
    console.log(`Successfully generated dynamic 4:3 product images (with size & category) for ${updatedCount} products.`);
  } catch (err) {
    console.error('Error populating default product images:', err.message);
  }
}
