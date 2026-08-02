/**
 * Dynamic Vector SVG Image generator for Kantine FLB Products (4:3 aspect ratio = 400x300)
 * Uses base64 encoding to ensure 100% browser rendering compatibility.
 * Visually scales glasses, Dubbegläser, bottles, and shot glasses according to volume (0,02L, 0,25L, 0,33L, 0,5L, 0,7L, 1,0L).
 */

export function generateProductSvg(name, size_info, category) {
  const n = (name || '').toLowerCase();
  const s = (size_info || '').toLowerCase();
  const c = (category || '').toLowerCase();

  let bg1 = '#1e293b';
  let bg2 = '#0f172a';
  let accent = '#38bdf8';
  let graphic = '';

  // Determine volume type
  const is002 = s.includes('0,02') || n.includes('0,02');
  const is025 = s.includes('0,25') || n.includes('0,25');
  const is033 = s.includes('0,33') || n.includes('0,33');
  const is05 = s.includes('0,5') || n.includes('0,5');
  const is07 = s.includes('0,7') || n.includes('0,7');
  const is10 = s.includes('1,0') || s.includes('1l') || n.includes('1,0');

  // --- CATEGORY 1: WEINSCHORLE & WEIN (Pfälzer Dubbeglas & Flasche) ---
  if (n.includes('schorle') || n.includes('riesling') || n.includes('weißherbst') || n.includes('weinherbst') || n.includes('sekt')) {
    const isRose = n.includes('weißherbst') || n.includes('rosé');
    const isSekt = n.includes('sekt');

    bg1 = isRose ? '#831843' : isSekt ? '#713f12' : '#14532d';
    bg2 = isRose ? '#500724' : isSekt ? '#451a03' : '#052e16';
    accent = isRose ? '#f472b6' : isSekt ? '#fef08a' : '#86efac';

    const fillLiquid = isRose ? 'url(#gradRose)' : isSekt ? 'url(#gradSekt)' : 'url(#gradSchorle)';

    if (is10) {
      // 1.0L Wine Bottle + Glass
      graphic = `
        <!-- 1.0L Bottle -->
        <g transform="translate(145, 55)">
          <path d="M25 0 L35 0 L35 25 L52 55 L52 170 L8 170 L8 55 L25 25 Z" fill="${accent}" opacity="0.15" stroke="${accent}" stroke-width="2.5"/>
          <path d="M12 60 L48 60 L48 166 L12 166 Z" fill="${fillLiquid}" opacity="0.85"/>
          <rect x="15" y="85" width="30" height="40" rx="3" fill="#ffffff" opacity="0.9"/>
          <text x="30" y="108" font-family="sans-serif" font-size="11" font-weight="900" fill="#000" text-anchor="middle">1,0L</text>
        </g>
        <!-- Dubbeglas accanto -->
        <g transform="translate(215, 105)">
          <path d="M10 0 L40 0 L33 110 L17 110 Z" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M12 25 L38 25 L32 108 L18 108 Z" fill="${fillLiquid}" opacity="0.8"/>
          ${drawDubbeDots(35, 110)}
        </g>`;
    } else if (is05) {
      // 0.5L GROSSES PFÄLZER DUBBEGLAS (Tall & Wide)
      graphic = `
        <g transform="translate(160, 50)">
          <!-- Glass Outline -->
          <path d="M0 0 L80 0 L66 180 L14 180 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round"/>
          <!-- Liquid Level 0.5L -->
          <path d="M4 22 L76 22 L64 176 L16 176 Z" fill="${fillLiquid}"/>
          <!-- Foam / Carbonation bubbles -->
          <ellipse cx="40" cy="22" rx="36" ry="6" fill="#ffffff" opacity="0.4"/>
          <!-- Iconic Dubbe Dots (5 rows) -->
          ${drawDubbeDots(80, 180)}
        </g>`;
    } else {
      // 0.25L KLEINES DUBBEGLAS (Compact)
      graphic = `
        <g transform="translate(172, 95)">
          <!-- Glass Outline (Small 0.25L) -->
          <path d="M0 0 L56 0 L46 130 L10 130 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
          <!-- Liquid Level 0.25L -->
          <path d="M3 18 L53 18 L44 127 L12 127 Z" fill="${fillLiquid}"/>
          <ellipse cx="28" cy="18" rx="25" ry="4" fill="#ffffff" opacity="0.4"/>
          <!-- Dubbe Dots (3 rows) -->
          ${drawDubbeDots(56, 130)}
        </g>`;
    }
  }

  // --- CATEGORY 2: BEER / WEIZEN / EXPORT ---
  else if (n.includes('weizen') || n.includes('bier') || n.includes('export') || n.includes('pils') || n.includes('gründel')) {
    const isAlkoholFrei = n.includes('alkoholfrei') || n.includes('gründel');
    const isWeizen = n.includes('weizen');

    bg1 = isAlkoholFrei ? '#0f2b48' : isWeizen ? '#2c1802' : '#451a03';
    bg2 = isAlkoholFrei ? '#1d4ed8' : isWeizen ? '#5c330a' : '#92400e';
    accent = isAlkoholFrei ? '#60a5fa' : isWeizen ? '#f59e0b' : '#fef08a';

    const fillBeer = 'url(#gradBeer)';

    if (is05 && isWeizen) {
      // 0.5L TALL WEIZENGLAS
      graphic = `
        <g transform="translate(170, 45)">
          <!-- Weizen Glass Contour -->
          <path d="M10 0 C25 20, 15 120, 5 160 L5 185 L55 185 L55 160 C45 120, 35 20, 50 0 Z" fill="rgba(255,255,255,0.08)" stroke="#ffffff" stroke-width="3"/>
          <path d="M11 25 C24 40, 16 120, 7 160 L7 182 L53 182 L53 160 C44 120, 36 40, 49 25 Z" fill="${fillBeer}"/>
          <!-- Creamy Weizen Foam Head -->
          <path d="M5 -10 C-5 -25, 20 -35, 30 -20 C40 -35, 65 -25, 55 -10 Z" fill="#ffffff"/>
        </g>`;
    } else if (is05) {
      // 0.5L BIERKRUG (Mug)
      graphic = `
        <g transform="translate(160, 60)">
          <!-- Handle -->
          <path d="M60 30 C90 30, 90 120, 60 120" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
          <!-- Krug Body -->
          <rect x="0" y="0" width="60" height="150" rx="6" fill="rgba(255,255,255,0.08)" stroke="#ffffff" stroke-width="3.5"/>
          <rect x="4" y="25" width="52" height="121" rx="4" fill="${fillBeer}"/>
          <!-- Foam -->
          <rect x="-4" y="-12" width="68" height="38" rx="14" fill="#ffffff"/>
        </g>`;
    } else {
      // 0.33L STUBBY BOTTLE / SMALL GLASS
      graphic = `
        <g transform="translate(175, 75)">
          <!-- 0.33L Bottle Contour -->
          <path d="M15 0 L35 0 L35 25 L45 55 L45 150 L5 150 L5 55 L15 25 Z" fill="rgba(255,255,255,0.08)" stroke="#ffffff" stroke-width="3"/>
          <path d="M8 58 L42 58 L42 146 L8 146 Z" fill="${fillBeer}"/>
          <rect x="10" y="70" width="30" height="35" rx="3" fill="${accent}"/>
          <text x="25" y="92" font-family="sans-serif" font-size="10" font-weight="900" fill="#000" text-anchor="middle">0,33L</text>
        </g>`;
    }
  }

  // --- CATEGORY 3: WATER & SOFT DRINKS ---
  else if (n.includes('sprudel') || n.includes('wasser') || n.includes('limo') || n.includes('soft') || n.includes('cola')) {
    const isWater = n.includes('sprudel') || n.includes('wasser') || n.includes('bellaris');
    bg1 = isWater ? '#0c4a6e' : '#701a75';
    bg2 = isWater ? '#0284c7' : '#c026d3';
    accent = isWater ? '#38bdf8' : '#f0abfc';

    const fillLiquid = isWater ? 'url(#gradWater)' : 'url(#gradSoda)';

    if (is07 || is10) {
      // 0.7L / 1.0L BOTTLE
      graphic = `
        <g transform="translate(170, 50)">
          <path d="M20 0 L40 0 L40 30 L55 70 L55 180 L5 180 L5 70 L20 30 Z" fill="rgba(255,255,255,0.08)" stroke="#ffffff" stroke-width="3"/>
          <path d="M8 72 L52 72 L52 176 L8 176 Z" fill="${fillLiquid}"/>
          <!-- Cap -->
          <rect x="17" y="-8" width="26" height="12" rx="2" fill="${accent}"/>
        </g>`;
    } else {
      // 0.33L GLASS WITH STRAW
      graphic = `
        <g transform="translate(172, 80)">
          <path d="M0 0 L56 0 L46 140 L10 140 Z" fill="rgba(255,255,255,0.08)" stroke="#ffffff" stroke-width="3"/>
          <path d="M3 20 L53 20 L44 137 L12 137 Z" fill="${fillLiquid}"/>
          <!-- Straw -->
          <line x1="38" y1="-25" x2="20" y2="100" stroke="#f43f5e" stroke-width="5" stroke-linecap="round"/>
        </g>`;
    }
  }

  // --- CATEGORY 4: SCHNAPS & LIQUEUR (0.02L Shot / Stamperle) ---
  else if (is002 || n.includes('ramazotti') || n.includes('williams') || n.includes('schnaps') || n.includes('likör')) {
    bg1 = '#431407';
    bg2 = '#9a3412';
    accent = '#fb923c';

    // 0.02L STAMPERLE (Shot Glass - Thick Bottom, Small Scale)
    graphic = `
      <g transform="translate(175, 110)">
        <!-- Thick Bottom Base -->
        <rect x="10" y="85" width="30" height="35" fill="rgba(255,255,255,0.25)" stroke="#ffffff" stroke-width="2"/>
        <!-- Small Shot Glass Body -->
        <path d="M0 0 L50 0 L40 120 L10 120 Z" fill="rgba(255,255,255,0.08)" stroke="#ffffff" stroke-width="3"/>
        <path d="M4 18 L46 18 L40 85 L10 85 Z" fill="url(#gradShot)"/>
        <!-- Ice / Slice -->
        <circle cx="25" cy="18" r="8" fill="#f97316" opacity="0.8"/>
      </g>`;
  }

  // --- CATEGORY 5: KAFFEE (Tasse) ---
  else if (n.includes('kaffee') || n.includes('espresso') || s.includes('tasse')) {
    bg1 = '#291e17';
    bg2 = '#54392b';
    accent = '#d97706';

    graphic = `
      <g transform="translate(150, 90)">
        <!-- Saucer -->
        <ellipse cx="50" cy="120" rx="75" ry="18" fill="rgba(255,255,255,0.15)" stroke="#ffffff" stroke-width="3"/>
        <!-- Cup Handle -->
        <path d="M90 25 C120 25, 120 85, 90 85" fill="none" stroke="#ffffff" stroke-width="7"/>
        <!-- Cup -->
        <path d="M10 0 L90 0 C90 70, 75 105, 50 105 C25 105, 10 70, 10 0 Z" fill="#ffffff"/>
        <ellipse cx="50" cy="5" rx="38" ry="12" fill="#451a03"/>
        <!-- Steam lines -->
        <path d="M35 -20 Q40 -35 35 -50" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6" stroke-linecap="round"/>
        <path d="M50 -25 Q55 -40 50 -55" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6" stroke-linecap="round"/>
        <path d="M65 -20 Q70 -35 65 -50" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6" stroke-linecap="round"/>
      </g>`;
  }

  // --- CATEGORY 6: SPEISEN (Bratwurst, Brezel, Käsebrötchen, Snacks) ---
  else {
    bg1 = '#451a03';
    bg2 = '#78350f';
    accent = '#fde047';

    if (n.includes('wurst') || n.includes('bratwurst')) {
      graphic = `
        <g transform="translate(130, 95)">
          <!-- Bun -->
          <ellipse cx="70" cy="65" rx="80" ry="32" fill="#d97706" stroke="#ffffff" stroke-width="3"/>
          <!-- Sausage -->
          <path d="M-10 50 C20 20, 120 20, 150 50 C160 65, 130 80, 110 65 C80 40, 40 40, -10 50 Z" fill="#78350f" stroke="#ffffff" stroke-width="2.5"/>
          <!-- Mustard Zigzag -->
          <path d="M10 42 Q30 30, 50 42 T90 42 T130 42" fill="none" stroke="#facc15" stroke-width="5" stroke-linecap="round"/>
        </g>`;
    } else if (n.includes('brezel')) {
      graphic = `
        <g transform="translate(135, 75)">
          <path d="M65 10 C110 10, 125 65, 95 95 C75 115, 55 90, 65 65 C75 40, 15 40, 25 65 C35 90, 15 115, -5 95 C-35 65, -20 10, 25 10 Z" transform="translate(30,20)" fill="#92400e" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
          <!-- Salt Crystals -->
          <circle cx="60" cy="40" r="3" fill="#ffffff"/>
          <circle cx="100" cy="50" r="3" fill="#ffffff"/>
          <circle cx="130" cy="80" r="3" fill="#ffffff"/>
          <circle cx="70" cy="110" r="3" fill="#ffffff"/>
        </g>`;
    } else if (n.includes('käse')) {
      graphic = `
        <g transform="translate(135, 90)">
          <!-- Bottom Bun -->
          <ellipse cx="65" cy="70" rx="70" ry="25" fill="#d97706" stroke="#ffffff" stroke-width="3"/>
          <!-- Cheese Slice -->
          <polygon points="10,65 120,50 110,75 5,85" fill="#facc15" stroke="#ffffff" stroke-width="2"/>
          <!-- Top Bun -->
          <ellipse cx="65" cy="45" rx="68" ry="28" fill="#f59e0b" stroke="#ffffff" stroke-width="3"/>
        </g>`;
    } else {
      // Snack Bowl (Chips / Erdnüsse)
      graphic = `
        <g transform="translate(140, 90)">
          <!-- Bowl -->
          <path d="M10 30 L110 30 C110 90, 85 115, 60 115 C35 115, 10 90, 10 30 Z" fill="#dc2626" stroke="#ffffff" stroke-width="3.5"/>
          <!-- Snack Content -->
          <ellipse cx="60" cy="30" rx="48" ry="16" fill="#fef08a"/>
          <circle cx="45" cy="24" r="9" fill="#f59e0b"/>
          <circle cx="65" cy="20" r="10" fill="#d97706"/>
          <circle cx="75" cy="28" r="8" fill="#f59e0b"/>
        </g>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
      
      <!-- Liquid Gradients -->
      <linearGradient id="gradSchorle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#ca8a04" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient id="gradRose" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f472b6" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#9d174d" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient id="gradSekt" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef9c3" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#eab308" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient id="gradBeer" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#b45309" stop-opacity="0.95" />
      </linearGradient>
      <linearGradient id="gradWater" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#bae6fd" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0.85" />
      </linearGradient>
      <linearGradient id="gradSoda" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f472b6" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#7e22ce" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient id="gradShot" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ea580c" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#7c2d12" stop-opacity="0.9" />
      </linearGradient>

      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.3" />
        <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Background -->
    <rect width="400" height="300" fill="url(#bg)"/>
    <circle cx="200" cy="150" r="140" fill="url(#glow)"/>

    <!-- Vector Graphic -->
    ${graphic}
  </svg>`;

  // Encode as Base64 to ensure 100% reliable rendering in HTML/React img tags
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Helper to draw characteristic Dubbe dots on Pfälzer Dubbeglas
function drawDubbeDots(width, height) {
  let dots = '';
  const rows = height > 140 ? 5 : 3;
  const dotsPerRow = width > 70 ? 4 : 3;

  for (let r = 0; r < rows; r++) {
    const y = 30 + r * (height / (rows + 1));
    const count = (r % 2 === 0) ? dotsPerRow : dotsPerRow - 1;
    const startX = (r % 2 === 0) ? 12 : 22;
    const stepX = (width - 24) / (dotsPerRow - 1 || 1);

    for (let c = 0; c < count; c++) {
      const x = startX + c * stepX;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="#ffffff" opacity="0.6"/>`;
    }
  }
  return dots;
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
    console.log(`Successfully generated dynamic 4:3 product images (with size scaling & base64) for ${updatedCount} products.`);
  } catch (err) {
    console.error('Error populating default product images:', err.message);
  }
}
