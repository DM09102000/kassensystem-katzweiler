/**
 * Dynamic SVG Image generator for Kantine FLB Products (4:3 aspect ratio = 400x300)
 * Restores original rich aesthetic (dark gradients, radial glow, vibrant icons).
 * Visual volume scaling via icon proportions (0,02L small, 0,25L/0,33L medium, 0,5L large, 0,7L/1,0L bottle+glass combo).
 * Encoded in Base64 for 100% cross-browser rendering reliability.
 */

export function generateProductSvg(name, size_info, category) {
  const n = (name || '').toLowerCase();
  const s = (size_info || '').toLowerCase();
  const c = (category || '').toLowerCase();

  let bg1 = '#1e293b';
  let bg2 = '#0f172a';
  let accent = '#38bdf8';
  let emoji = '📦';
  let fontSize = 76;
  let circleRadius = 70;

  // Determine volume type
  const is002 = s.includes('0,02') || n.includes('0,02');
  const is025 = s.includes('0,25') || n.includes('0,25');
  const is033 = s.includes('0,33') || n.includes('0,33');
  const is05 = s.includes('0,5') || n.includes('0,5');
  const is07 = s.includes('0,7') || n.includes('0,7');
  const is10 = s.includes('1,0') || s.includes('1l') || n.includes('1,0');

  // --- CATEGORY THEMES & ICONS ---

  // 1. Weinschorle & Wein (Pfälzer Weinkultur)
  if (n.includes('schorle') || n.includes('riesling') || n.includes('weißherbst') || n.includes('weinherbst') || n.includes('sekt')) {
    const isRose = n.includes('weißherbst') || n.includes('rosé');
    const isSekt = n.includes('sekt');

    bg1 = isRose ? '#831843' : isSekt ? '#713f12' : '#14532d';
    bg2 = isRose ? '#500724' : isSekt ? '#451a03' : '#052e16';
    accent = isRose ? '#f472b6' : isSekt ? '#fef08a' : '#86efac';

    if (is10) {
      emoji = isRose ? '🍾🍷' : '🍾🥂';
      fontSize = 72;
      circleRadius = 85;
    } else if (isSekt || is07) {
      emoji = '🍾';
      fontSize = 86;
      circleRadius = 80;
    } else if (is05) {
      // 0.5L Große Weinschorle / Dubbeglas-Äquivalent
      emoji = isRose ? '🍷' : '🥂';
      fontSize = 96;
      circleRadius = 88;
    } else {
      // 0.25L Kleine Schorle / Wein
      emoji = '🍷';
      fontSize = 62;
      circleRadius = 55;
    }
  }

  // 2. Bier & Weizen
  else if (n.includes('weizen') || n.includes('bier') || n.includes('export') || n.includes('pils') || n.includes('gründel')) {
    const isAlkoholFrei = n.includes('alkoholfrei') || n.includes('gründel');
    const isWeizen = n.includes('weizen');

    bg1 = isAlkoholFrei ? '#0f2b48' : isWeizen ? '#2c1802' : '#451a03';
    bg2 = isAlkoholFrei ? '#1d4ed8' : isWeizen ? '#5c330a' : '#92400e';
    accent = isAlkoholFrei ? '#60a5fa' : isWeizen ? '#f59e0b' : '#fbbf24';

    if (is05) {
      // 0.5L Großer Bierkrug / Weizenglas
      emoji = isWeizen ? '🍺' : '🍺';
      fontSize = 98;
      circleRadius = 90;
    } else {
      // 0.33L Kleine Flasche / Pils
      emoji = isAlkoholFrei ? '🌾' : '🍻';
      fontSize = 64;
      circleRadius = 58;
    }
  }

  // 3. Wasser & Softdrinks
  else if (n.includes('sprudel') || n.includes('wasser') || n.includes('limo') || n.includes('soft') || n.includes('cola') || n.includes('fanta') || n.includes('sprite') || n.includes('bellaris')) {
    const isWater = n.includes('sprudel') || n.includes('wasser') || n.includes('bellaris');
    bg1 = isWater ? '#0c4a6e' : '#701a75';
    bg2 = isWater ? '#0284c7' : '#c026d3';
    accent = isWater ? '#38bdf8' : '#f0abfc';

    if (is07 || is10) {
      emoji = isWater ? '💧' : '🥤';
      fontSize = 92;
      circleRadius = 85;
    } else {
      emoji = isWater ? '🧊' : '🥤';
      fontSize = 64;
      circleRadius = 58;
    }
  }

  // 4. Schnaps & Likör (0,02L Shot / Ramazotti / Williams)
  else if (is002 || n.includes('ramazotti') || n.includes('williams') || n.includes('schnaps') || n.includes('likör')) {
    bg1 = '#431407';
    bg2 = '#9a3412';
    accent = '#fb923c';
    emoji = '🥃';
    fontSize = 54; // Klein für 0,02L Stamperle/Shot
    circleRadius = 48;
  }

  // 5. Kaffee
  else if (n.includes('kaffee') || n.includes('espresso') || s.includes('tasse')) {
    bg1 = '#291e17';
    bg2 = '#54392b';
    accent = '#d97706';
    emoji = '☕';
    fontSize = 76;
    circleRadius = 70;
  }

  // 6. Speisen (Bratwurst, Brezel, Käsebrötchen, Snacks)
  else {
    bg1 = '#451a03';
    bg2 = '#78350f';
    accent = '#fde047';

    if (n.includes('wurst') || n.includes('bratwurst')) {
      emoji = '🌭';
    } else if (n.includes('brezel')) {
      emoji = '🥨';
    } else if (n.includes('käse')) {
      emoji = '🧀';
    } else if (n.includes('erdnüss') || n.includes('nüsse')) {
      emoji = '🥜';
    } else if (n.includes('chip')) {
      emoji = '🥔';
    } else {
      emoji = c.includes('getränk') ? '🍹' : '🍔';
    }
    fontSize = 82;
    circleRadius = 75;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.38" />
        <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.65"/>
      </filter>
    </defs>

    <!-- Rich Gradient Background -->
    <rect width="400" height="300" fill="url(#bg)"/>

    <!-- Glowing Radial Circle -->
    <circle cx="200" cy="150" r="${circleRadius + 40}" fill="url(#glow)"/>
    <circle cx="200" cy="150" r="${circleRadius}" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>

    <!-- Centered Vibrant Icon (Visually scaled by volume) -->
    <text x="200" y="150" font-size="${fontSize}" text-anchor="middle" filter="url(#shadow)" dominant-baseline="central">${emoji}</text>
  </svg>`;

  // Base64 encoding guarantees 100% rendering success in all browsers & tags
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
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
    console.log(`Successfully generated dynamic 4:3 product images with original aesthetic & base64 encoding for ${updatedCount} products.`);
  } catch (err) {
    console.error('Error populating default product images:', err.message);
  }
}
