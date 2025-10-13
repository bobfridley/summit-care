export const summitCareMarkColor = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-summitcare" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D5016"/>
      <stop offset="50%" stop-color="#4A7C59"/>
      <stop offset="100%" stop-color="#4A6FA5"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="transparent"/>
  <!-- Back mountain -->
  <path d="M 96 392 L 208 192 L 320 392 Z" fill="url(#grad-summitcare)" opacity="0.6"/>
  <!-- Front mountain -->
  <path d="M 160 392 L 296 128 L 432 392 Z" fill="url(#grad-summitcare)"/>
  <!-- Snow cap -->
  <path d="M 296 128 L 332 200 L 314 196 L 296 232 L 278 196 L 260 200 Z" fill="#FFFFFF" opacity="0.9"/>
  <!-- Ground -->
  <rect x="80" y="392" width="352" height="16" rx="8" fill="url(#grad-summitcare)" opacity="0.85"/>
</svg>`;

export const summitCareMarkMonoDark = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="transparent"/>
  <path d="M 96 392 L 208 192 L 320 392 Z" fill="#1A1A1A" opacity="0.6"/>
  <path d="M 160 392 L 296 128 L 432 392 Z" fill="#1A1A1A"/>
  <path d="M 296 128 L 332 200 L 314 196 L 296 232 L 278 196 L 260 200 Z" fill="#FFFFFF" opacity="0.9"/>
  <rect x="80" y="392" width="352" height="16" rx="8" fill="#1A1A1A" opacity="0.85"/>
</svg>`;

export const summitCareHorizontalColor = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="300" viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-summitcare" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D5016"/>
      <stop offset="50%" stop-color="#4A7C59"/>
      <stop offset="100%" stop-color="#4A6FA5"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="300" fill="transparent"/>
  <!-- Mark -->
  <g transform="translate(40,40) scale(0.9)">
    <path d="M 96 252 L 208 52 L 320 252 Z" fill="url(#grad-summitcare)" opacity="0.6"/>
    <path d="M 160 252 L 296 -12 L 432 252 Z" fill="url(#grad-summitcare)"/>
    <path d="M 296 -12 L 332 60 L 314 56 L 296 92 L 278 56 L 260 60 Z" fill="#FFFFFF" opacity="0.9"/>
    <rect x="80" y="252" width="352" height="16" rx="8" fill="url(#grad-summitcare)" opacity="0.85"/>
  </g>
  <!-- Wordmark -->
  <g transform="translate(520, 175)">
    <text x="0" y="0" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="110" font-weight="800" fill="#1A1A1A" letter-spacing="-1.5">
      Summit<tspan fill="#4A6FA5">Care</tspan>
    </text>
    <text x="4" y="36" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="22" font-weight="600" fill="#4A4A4A" opacity="0.9">
      Altitude Medication Tracker
    </text>
  </g>
</svg>`;