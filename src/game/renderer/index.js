// Main draw orchestrator
import { drawTerrain } from './terrain.js';
import { drawBuildings } from './buildings.js';
import { drawTowers, drawKukurzniki, drawFriendlyDrones, drawProjectiles } from './units.js';
import { drawEnemies } from './enemies.js';
import { drawEffects } from './effects.js';
import { drawIskanderWarning, drawHoverPreview } from './hud-canvas.js';

export function draw(ctx, g, hover, selectedType) {
  const W = g.city.width, H = g.city.height;
  ctx.clearRect(0, 0, W, H);

  drawTerrain(ctx, g);
  drawBuildings(ctx, g);
  drawHoverPreview(ctx, hover, selectedType, g.mode);
  drawTowers(ctx, g);
  drawKukurzniki(ctx, g);
  drawIskanderWarning(ctx, g);
  drawEnemies(ctx, g);
  drawFriendlyDrones(ctx, g);
  drawProjectiles(ctx, g);
  drawEffects(ctx, g);
}
