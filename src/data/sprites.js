// SVG sprite system — inline SVGs rendered to cached Image objects
// Each sprite is a simple geometric icon at 32x32, cached on first use

const cache = new Map();

function svgToImage(svg, size = 32) {
  const key = svg;
  if (cache.has(key)) return cache.get(key);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  cache.set(key, img);
  return img;
}

// === DEFENSE TOWERS ===

export const TOWER_SPRITES = {
  turret: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="#1a2e1e" stroke="#4ade80" stroke-width="2"/>
    <rect x="14" y="4" width="4" height="14" rx="1" fill="#4ade80"/>
    <circle cx="16" cy="16" r="4" fill="#4ade8088"/>
  </svg>`),

  mvg: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect x="6" y="10" width="20" height="12" rx="3" fill="#0c2a2a" stroke="#22d3ee" stroke-width="1.5"/>
    <rect x="12" y="6" width="8" height="8" rx="1" fill="#22d3ee" opacity="0.8"/>
    <rect x="15" y="2" width="2" height="6" rx="0.5" fill="#22d3ee"/>
    <circle cx="10" cy="24" r="3" fill="#22d3ee" opacity="0.6"/>
    <circle cx="22" cy="24" r="3" fill="#22d3ee" opacity="0.6"/>
    <circle cx="10" cy="24" r="1.5" fill="#0c2a2a"/>
    <circle cx="22" cy="24" r="1.5" fill="#0c2a2a"/>
  </svg>`),

  crew: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="#0c2435" stroke="#38bdf8" stroke-width="2"/>
    <rect x="10" y="12" width="12" height="8" rx="2" fill="#38bdf8"/>
    <rect x="13" y="8" width="6" height="6" rx="1" fill="#38bdf888"/>
    <circle cx="12" cy="10" r="2" fill="#38bdf8"/>
    <circle cx="20" cy="10" r="2" fill="#38bdf8"/>
  </svg>`),

  airfield: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="#2a1e0a" stroke="#f59e0b" stroke-width="2"/>
    <path d="M16 8 L22 18 L16 16 L10 18 Z" fill="#f59e0b"/>
    <rect x="14" y="18" width="4" height="6" rx="1" fill="#f59e0b88"/>
  </svg>`),

  hawk: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="#1a2a0a" stroke="#a3e635" stroke-width="2"/>
    <path d="M8 18 L16 6 L24 18 L20 16 L16 20 L12 16 Z" fill="#a3e635"/>
    <rect x="14" y="20" width="4" height="5" rx="1" fill="#a3e63588"/>
  </svg>`),

  gepard: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="#2a1a0a" stroke="#fb923c" stroke-width="2"/>
    <rect x="10" y="6" width="3" height="14" rx="1" fill="#fb923c"/>
    <rect x="19" y="6" width="3" height="14" rx="1" fill="#fb923c"/>
    <rect x="8" y="18" width="16" height="6" rx="2" fill="#fb923c88"/>
  </svg>`),

  irist: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="#1a0a2a" stroke="#e879f9" stroke-width="2"/>
    <polygon points="16,4 20,12 28,14 22,20 24,28 16,24 8,28 10,20 4,14 12,12" fill="#e879f9" opacity="0.8"/>
    <circle cx="16" cy="16" r="3" fill="#fff"/>
  </svg>`),

  decoy: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="#1a1a1a" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 3"/>
    <text x="16" y="20" text-anchor="middle" font-size="14" fill="#94a3b8">?</text>
  </svg>`),
};

// === ENEMIES ===

export const ENEMY_SPRITES = {
  shahed: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <path d="M28 16 L8 10 L12 16 L8 22 Z" fill="#94a3b8"/>
    <path d="M10 12 L4 8 L6 14 Z" fill="#94a3b888"/>
    <path d="M10 20 L4 24 L6 18 Z" fill="#94a3b888"/>
  </svg>`),

  shahed238: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <path d="M28 16 L10 10 L14 16 L10 22 Z" fill="#fbbf24"/>
    <path d="M12 12 L4 8 L8 14 Z" fill="#fbbf2488"/>
    <path d="M12 20 L4 24 L8 18 Z" fill="#fbbf2488"/>
    <circle cx="6" cy="16" r="3" fill="#ff8800" opacity="0.7"/>
  </svg>`),

  geran: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <path d="M26 16 L10 11 L13 16 L10 21 Z" fill="#cbd5e1"/>
    <path d="M11 13 L6 10 L8 15 Z" fill="#cbd5e188"/>
    <path d="M11 19 L6 22 L8 17 Z" fill="#cbd5e188"/>
  </svg>`),

  lancet: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <path d="M28 16 L14 12 L16 16 L14 20 Z" fill="#f87171"/>
    <path d="M14 13 L6 10 L10 15 Z" fill="#f8717188"/>
    <path d="M14 19 L6 22 L10 17 Z" fill="#f8717188"/>
    <circle cx="26" cy="16" r="2" fill="#ff0000"/>
  </svg>`),

  guided: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <path d="M28 16 L8 8 L12 16 L8 24 Z" fill="#ff6b6b"/>
    <path d="M10 10 L2 6 L6 14 Z" fill="#ff6b6b88"/>
    <path d="M10 22 L2 26 L6 18 Z" fill="#ff6b6b88"/>
    <circle cx="22" cy="16" r="3" fill="#ff0000"/>
    <circle cx="22" cy="16" r="1.5" fill="#fff"/>
  </svg>`),

  orlan: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <path d="M26 16 L12 12 L14 16 L12 20 Z" fill="#6ee7b7"/>
    <path d="M13 13 L8 10 L10 15 Z" fill="#6ee7b788"/>
    <path d="M13 19 L8 22 L10 17 Z" fill="#6ee7b788"/>
    <circle cx="20" cy="16" r="4" fill="none" stroke="#6ee7b7" stroke-width="1" stroke-dasharray="2 2"/>
  </svg>`),

  kalibr: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect x="6" y="13" width="22" height="6" rx="3" fill="#38bdf8"/>
    <path d="M6 13 L2 10 L2 22 L6 19 Z" fill="#38bdf888"/>
    <circle cx="4" cy="16" r="3" fill="#0088ff" opacity="0.6"/>
  </svg>`),

  kh101: svgToImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect x="6" y="13" width="20" height="6" rx="3" fill="#c084fc"/>
    <path d="M6 13 L2 10 L2 22 L6 19 Z" fill="#c084fc88"/>
    <path d="M16 13 L20 8 L22 13 Z" fill="#c084fc88"/>
    <path d="M16 19 L20 24 L22 19 Z" fill="#c084fc88"/>
  </svg>`),
};

// Draw a sprite centered at (x, y) with rotation
export function drawSprite(ctx, sprite, x, y, angle, scale = 1) {
  if (!sprite || !sprite.complete) return;
  const s = 32 * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
  ctx.restore();
}
