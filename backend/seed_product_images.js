/**
 * Custom SVG Vector Icon Generator for Kantine FLB Products (4:3 aspect ratio = 400x300)
 * NO emojis used! Pure, custom-drawn SVG paths, gradients, and shapes.
 * Visual volume scaling (0,02L small shot, 0,25L/0,33L medium glass/bottle, 0,5L large Dubbeglas/Weizen/Krug, 0,7L/1,0L bottle).
 * Base64 encoded for 100% cross-browser rendering reliability.
 */

export function generateProductSvg(name, size_info, category) {
  const n = (name || '').toLowerCase();
  const s = (size_info || '').toLowerCase();
  const c = (category || '').toLowerCase();

  let bg1 = '#1e293b';
  let bg2 = '#0f172a';
  let accent = '#38bdf8';
  let iconSvg = '';

  // Determine volume type
  const is002 = s.includes('0,02') || n.includes('0,02');
  const is025 = s.includes('0,25') || n.includes('0,25');
  const is033 = s.includes('0,33') || n.includes('0,33');
  const is05 = s.includes('0,5') || n.includes('0,5');
  const is07 = s.includes('0,7') || n.includes('0,7');
  const is10 = s.includes('1,0') || s.includes('1l') || n.includes('1,0');

  // --- 1. WEINSCHORLE, WEIN & SEKT (PFÄLZER DUBBEGLAS & FLASCHE) ---
  if (n.includes('schorle') || n.includes('riesling') || n.includes('weißherbst') || n.includes('weinherbst') || n.includes('sekt')) {
    const isRose = n.includes('weißherbst') || n.includes('rosé');
    const isSekt = n.includes('sekt');

    bg1 = isRose ? '#831843' : isSekt ? '#713f12' : '#14532d';
    bg2 = isRose ? '#4c0519' : isSekt ? '#451a03' : '#052e16';
    accent = isRose ? '#f472b6' : isSekt ? '#fef08a' : '#86efac';

    const fillLiquid = isRose ? 'url(#gradRose)' : isSekt ? 'url(#gradSekt)' : 'url(#gradWine)';

    if (is10) {
      // 1.0L Wein-Flasche + Dubbeglas
      iconSvg = `
        <g transform="translate(130, 45)">
          <!-- 1L Bottle -->
          <path d="M30 0 L42 0 L42 30 L60 65 L60 190 L12 190 L12 65 L30 30 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M16 70 L56 70 L56 186 L16 186 Z" fill="${fillLiquid}" opacity="0.9"/>
          <rect x="20" y="95" width="32" height="45" rx="3" fill="#ffffff" opacity="0.95"/>
          <text x="36" y="122" font-family="sans-serif" font-size="12" font-weight="900" fill="#000" text-anchor="middle">1,0L</text>
        </g>
        <g transform="translate(215, 95)">
          <!-- Dubbeglas accanto -->
          <path d="M0 0 L44 0 L36 125 L8 125 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
          <path d="M3 20 L41 20 L34 122 L10 122 Z" fill="${fillLiquid}" opacity="0.85"/>
          ${drawDubbeDots(44, 125)}
        </g>`;
    } else if (is05) {
      // 0,5L GROSSES PFÄLZER DUBBEGLAS (Tall & Wide)
      iconSvg = `
        <g transform="translate(155, 45)">
          <path d="M0 0 L90 0 L74 195 L16 195 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
          <path d="M4 24 L86 24 L71 191 L19 191 Z" fill="${fillLiquid}"/>
          <ellipse cx="45" cy="24" rx="41" ry="6" fill="#ffffff" opacity="0.45"/>
          ${drawDubbeDots(90, 195)}
        </g>`;
    } else if (isSekt || is07) {
      // Sektflasche / Champagner
      iconSvg = `
        <g transform="translate(170, 45)">
          <path d="M20 0 L40 0 L40 35 L56 80 L56 195 L4 195 L4 80 L20 35 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3.5"/>
          <path d="M8 85 L52 85 L52 191 L8 191 Z" fill="${fillLiquid}"/>
          <rect x="18" y="-10" width="24" height="14" rx="3" fill="#fef08a"/>
          <!-- Agraffe Foil -->
          <rect x="14" y="4" width="32" height="12" rx="2" fill="#ca8a04"/>
        </g>`;
    } else {
      // 0,25L KLEINES PFÄLZER DUBBEGLAS (Compact)
      iconSvg = `
        <g transform="translate(170, 95)">
          <path d="M0 0 L60 0 L50 135 L10 135 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M3 18 L57 18 L47 132 L13 132 Z" fill="${fillLiquid}"/>
          <ellipse cx="30" cy="18" rx="27" ry="5" fill="#ffffff" opacity="0.45"/>
          ${drawDubbeDots(60, 135)}
        </g>`;
    }
  }

  // --- 2. BIER, WEIZEN & EXPORT ---
  else if (n.includes('weizen') || n.includes('bier') || n.includes('export') || n.includes('pils') || n.includes('gründel')) {
    const isAlkoholFrei = n.includes('alkoholfrei') || n.includes('gründel');
    const isWeizen = n.includes('weizen');

    bg1 = isAlkoholFrei ? '#0f2b48' : isWeizen ? '#2c1802' : '#451a03';
    bg2 = isAlkoholFrei ? '#1d4ed8' : isWeizen ? '#5c330a' : '#92400e';
    accent = isAlkoholFrei ? '#60a5fa' : isWeizen ? '#f59e0b' : '#fbbf24';

    const fillBeer = 'url(#gradBeer)';

    if (is05 && isWeizen) {
      // 0,5L TALL WEIZENBIER GLAS WITH CREAMY FOAM HEAD
      iconSvg = `
        <g transform="translate(165, 40)">
          <!-- Glass Outline -->
          <path d="M12 20 C30 40, 20 140, 6 185 L6 210 L64 210 L64 185 C50 140, 40 40, 58 20 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3.5"/>
          <path d="M14 40 C28 55, 21 140, 8 185 L8 206 L62 206 L62 185 C49 140, 42 55, 56 40 Z" fill="${fillBeer}"/>
          <!-- Creamy Foam Head -->
          <path d="M6 22 C-6 5, 22 -15, 35 5 C48 -15, 76 5, 64 22 Z" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
        </g>`;
    } else if (is05) {
      // 0,5L HEAVY GERMAN BEER MUG (BIERKRUG)
      iconSvg = `
        <g transform="translate(150, 55)">
          <!-- Handle -->
          <path d="M70 30 C105 30, 105 130, 70 130" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>
          <!-- Mug Body -->
          <rect x="0" y="0" width="70" height="170" rx="8" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="4"/>
          <rect x="5" y="28" width="60" height="137" rx="4" fill="${fillBeer}"/>
          <!-- Dimple Lines on Glass -->
          <line x1="20" y1="45" x2="20" y2="155" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
          <line x1="35" y1="45" x2="35" y2="155" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
          <line x1="50" y1="45" x2="50" y2="155" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
          <!-- Thick Foam -->
          <rect x="-5" y="-12" width="80" height="42" rx="16" fill="#ffffff"/>
        </g>`;
    } else {
      // 0,33L STUBBY FLASCHE / PILS
      iconSvg = `
        <g transform="translate(170, 75)">
          <path d="M18 0 L42 0 L42 30 L54 65 L54 165 L6 165 L6 65 L18 30 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3.5"/>
          <path d="M10 68 L50 68 L50 161 L10 161 Z" fill="${fillBeer}"/>
          <rect x="12" y="82" width="36" height="45" rx="3" fill="${accent}"/>
          <text x="30" y="109" font-family="sans-serif" font-size="11" font-weight="900" fill="#000" text-anchor="middle">0,33L</text>
          <!-- Cap -->
          <rect x="16" y="-8" width="28" height="10" rx="2" fill="#ca8a04"/>
        </g>`;
    }
  }

  // --- 3. WASSER & SOFTDRINKS ---
  else if (n.includes('sprudel') || n.includes('wasser') || n.includes('limo') || n.includes('soft') || n.includes('cola') || n.includes('fanta') || n.includes('sprite') || n.includes('bellaris')) {
    const isWater = n.includes('sprudel') || n.includes('wasser') || n.includes('bellaris');
    bg1 = isWater ? '#0c4a6e' : '#701a75';
    bg2 = isWater ? '#0284c7' : '#c026d3';
    accent = isWater ? '#38bdf8' : '#f0abfc';

    const fillLiquid = isWater ? 'url(#gradWater)' : 'url(#gradSoda)';

    if (is07 || is10) {
      // 0,7L / 1,0L FLASCHE
      iconSvg = `
        <g transform="translate(165, 45)">
          <path d="M22 0 L46 0 L46 35 L62 75 L62 195 L6 195 L6 75 L22 35 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3.5"/>
          <path d="M10 78 L58 78 L58 191 L10 191 Z" fill="${fillLiquid}"/>
          <rect x="20" y="-10" width="28" height="12" rx="2" fill="${accent}"/>
          <!-- Bubbles -->
          <circle cx="25" cy="110" r="4" fill="#ffffff" opacity="0.6"/>
          <circle cx="42" cy="140" r="5" fill="#ffffff" opacity="0.6"/>
          <circle cx="30" cy="165" r="3" fill="#ffffff" opacity="0.6"/>
        </g>`;
    } else {
      // 0,33L GLAS MIT EIS & STROHHALM
      iconSvg = `
        <g transform="translate(165, 80)">
          <path d="M0 0 L66 0 L54 150 L12 150 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3.5"/>
          <path d="M4 22 L62 22 L51 146 L15 146 Z" fill="${fillLiquid}"/>
          <!-- Ice Cubes -->
          <rect x="18" y="30" width="18" height="18" rx="3" fill="#ffffff" opacity="0.5"/>
          <rect x="34" y="55" width="18" height="18" rx="3" fill="#ffffff" opacity="0.5"/>
          <!-- Straw -->
          <line x1="45" y1="-30" x2="25" y2="110" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
        </g>`;
    }
  }

  // --- 4. SCHNAPS & LIKÖR (0,02L STAMPERLE / SHOT GLAS) ---
  else if (is002 || n.includes('ramazotti') || n.includes('williams') || n.includes('schnaps') || n.includes('likör')) {
    bg1 = '#431407';
    bg2 = '#9a3412';
    accent = '#fb923c';

    // 0,02L Heavy-Bottomed Shot Glass (Stamperle) - Drawn Small
    iconSvg = `
      <g transform="translate(170, 110)">
        <!-- Heavy Glass Base -->
        <rect x="10" y="85" width="40" height="35" fill="rgba(255,255,255,0.3)" stroke="#ffffff" stroke-width="2.5"/>
        <!-- Glass Body -->
        <path d="M0 0 L60 0 L50 120 L10 120 Z" fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="3.5"/>
        <path d="M4 20 L56 20 L48 85 L12 85 Z" fill="url(#gradShot)"/>
        <!-- Orange/Lemon Slice Decor -->
        <circle cx="30" cy="20" r="10" fill="#f97316" opacity="0.95" stroke="#ffffff" stroke-width="1.5"/>
      </g>`;
  }

  // --- 5. KAFFEE (PORZELLAN-TASSE) ---
  else if (n.includes('kaffee') || n.includes('espresso') || s.includes('tasse')) {
    bg1 = '#291e17';
    bg2 = '#54392b';
    accent = '#d97706';

    iconSvg = `
      <g transform="translate(140, 95)">
        <!-- Saucer -->
        <ellipse cx="60" cy="120" rx="85" ry="20" fill="rgba(255,255,255,0.2)" stroke="#ffffff" stroke-width="3.5"/>
        <!-- Cup Handle -->
        <path d="M105 25 C140 25, 140 90, 105 90" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
        <!-- Cup Body -->
        <path d="M15 0 L105 0 C105 75, 85 110, 60 110 C35 110, 15 75, 15 0 Z" fill="#ffffff" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
        <!-- Coffee Crema -->
        <ellipse cx="60" cy="5" rx="42" ry="14" fill="#451a03"/>
        <ellipse cx="60" cy="5" rx="34" ry="10" fill="#78350f" opacity="0.8"/>
        <!-- Steam rising -->
        <path d="M40 -25 Q46 -45 40 -65" fill="none" stroke="#ffffff" stroke-width="3.5" opacity="0.7" stroke-linecap="round"/>
        <path d="M60 -30 Q66 -50 60 -70" fill="none" stroke="#ffffff" stroke-width="3.5" opacity="0.7" stroke-linecap="round"/>
        <path d="M80 -25 Q86 -45 80 -65" fill="none" stroke="#ffffff" stroke-width="3.5" opacity="0.7" stroke-linecap="round"/>
      </g>`;
  }

  // --- 6. SPEISEN (BRATWURST, BREZEL, KÄSEBRÖTCHEN, SNACKS) ---
  else {
    bg1 = '#451a03';
    bg2 = '#78350f';
    accent = '#fde047';

    if (n.includes('wurst') || n.includes('bratwurst')) {
      iconSvg = `
        <g transform="translate(120, 100)">
          <!-- Bun -->
          <ellipse cx="80" cy="65" rx="90" ry="35" fill="#d97706" stroke="#ffffff" stroke-width="3.5"/>
          <!-- Sausage -->
          <path d="M-15 50 C20 15, 140 15, 175 50 C185 68, 150 85, 125 68 C90 38, 45 38, -15 50 Z" fill="#78350f" stroke="#ffffff" stroke-width="3"/>
          <!-- Mustard Line -->
          <path d="M10 42 Q35 28, 60 42 T110 42 T150 42" fill="none" stroke="#facc15" stroke-width="6" stroke-linecap="round"/>
        </g>`;
    } else if (n.includes('brezel')) {
      iconSvg = `
        <g transform="translate(125, 70)">
          <path d="M75 12 C125 12, 140 75, 105 110 C85 130, 65 100, 75 75 C85 45, 15 45, 25 75 C35 100, 15 130, -5 110 C-40 75, -25 12, 25 12 Z" transform="translate(25,15)" fill="#92400e" stroke="#ffffff" stroke-width="4.5" stroke-linejoin="round"/>
          <!-- Salt Crystals -->
          <circle cx="65" cy="40" r="3.5" fill="#ffffff"/>
          <circle cx="110" cy="50" r="3.5" fill="#ffffff"/>
          <circle cx="140" cy="85" r="3.5" fill="#ffffff"/>
          <circle cx="75" cy="120" r="3.5" fill="#ffffff"/>
        </g>`;
    } else if (n.includes('käse')) {
      iconSvg = `
        <g transform="translate(130, 95)">
          <ellipse cx="70" cy="75" rx="78" ry="28" fill="#d97706" stroke="#ffffff" stroke-width="3.5"/>
          <polygon points="10,70 135,52 125,82 5,92" fill="#facc15" stroke="#ffffff" stroke-width="2.5"/>
          <ellipse cx="70" cy="48" rx="75" ry="32" fill="#f59e0b" stroke="#ffffff" stroke-width="3.5"/>
        </g>`;
    } else {
      // Snack Bowl (Chips / Erdnüsse)
      iconSvg = `
        <g transform="translate(135, 95)">
          <path d="M10 30 L120 30 C120 95, 95 125, 65 125 C35 125, 10 95, 10 30 Z" fill="#dc2626" stroke="#ffffff" stroke-width="4"/>
          <ellipse cx="65" cy="30" rx="54" ry="18" fill="#fef08a"/>
          <circle cx="48" cy="23" r="10" fill="#f59e0b"/>
          <circle cx="70" cy="18" r="11" fill="#d97706"/>
          <circle cx="82" cy="27" r="9" fill="#f59e0b"/>
        </g>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <defs>
      <!-- Background Linear Gradient -->
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
      
      <!-- Liquid Gradients -->
      <linearGradient id="gradWine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#ca8a04" stop-opacity="0.95" />
      </linearGradient>
      <linearGradient id="gradRose" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f472b6" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#9d174d" stop-opacity="0.95" />
      </linearGradient>
      <linearGradient id="gradSekt" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef9c3" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#eab308" stop-opacity="0.95" />
      </linearGradient>
      <linearGradient id="gradBeer" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#b45309" stop-opacity="0.95" />
      </linearGradient>
      <linearGradient id="gradWater" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#bae6fd" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient id="gradSoda" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f472b6" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#7e22ce" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient id="gradShot" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ea580c" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#7c2d12" stop-opacity="0.95" />
      </linearGradient>

      <!-- Center Radial Glow -->
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Canvas Background -->
    <rect width="400" height="300" fill="url(#bg)"/>

    <!-- Glowing Backdrop Circle -->
    <circle cx="200" cy="150" r="130" fill="url(#glow)"/>

    <!-- Custom Drawn Vector Graphic -->
    ${iconSvg}
  </svg>`;

  // Base64 encoding guarantees 100% cross-browser rendering success
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Helper to draw characteristic Dubbe dots on Pfälzer Dubbeglas
 */
function drawDubbeDots(width, height) {
  let dots = '';
  const rows = height > 150 ? 5 : 3;
  const dotsPerRow = width > 70 ? 4 : 3;

  for (let r = 0; r < rows; r++) {
    const y = 30 + r * (height / (rows + 1));
    const count = (r % 2 === 0) ? dotsPerRow : dotsPerRow - 1;
    const startX = (r % 2 === 0) ? 12 : 22;
    const stepX = (width - 24) / (dotsPerRow - 1 || 1);

    for (let c = 0; c < count; c++) {
      const x = startX + c * stepX;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="#ffffff" opacity="0.65"/>`;
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
    console.log(`Successfully generated custom vector SVG product images (with Dubbeglas & volume scaling) for ${updatedCount} products.`);
  } catch (err) {
    console.error('Error populating default product images:', err.message);
  }
}
