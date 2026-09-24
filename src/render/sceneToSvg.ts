import type { Scene } from '../layout/types.js';
import { edgeSvg } from './notation.js';
import { markerDefs } from './markers.js';
import { nodeSvg } from './shapes.js';
import { defaultTheme, type Theme } from './theme.js';

const escapeXml = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function sceneToSvg(scene: Scene, theme: Theme = defaultTheme): string {
  const body: string[] = [markerDefs(theme)];
  for (const grp of scene.groups ?? []) {
    body.push(`<g class="s2m-group"><rect x="${grp.x}" y="${grp.y}" width="${grp.width}" height="${grp.height}" rx="8" fill="${theme.headerFill}" fill-opacity="0.35" stroke="${theme.lineColor}" stroke-dasharray="4 4"/><text x="${grp.x + 8}" y="${grp.y + 16}" font-size="${theme.fontSize}" font-family="${theme.fontFamily}" fill="${theme.textColor}">${escapeXml(grp.label)}</text></g>`);
  }
  for (const edge of scene.edges) body.push(edgeSvg(edge, theme));
  for (const node of scene.nodes) body.push(nodeSvg(node, theme));
  const w = Math.ceil(scene.width);
  const h = Math.ceil(scene.height);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${body.join('')}</svg>`;
}
