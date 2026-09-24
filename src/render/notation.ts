import type { SceneEdge } from '../layout/types.js';
import { markerEnd, markerStart } from './markers.js';
import type { Theme } from './theme.js';

const escapeXml = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function midpoint(points: { x: number; y: number }[]): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  return points[Math.floor(points.length / 2)]!;
}

export function edgeSvg(edge: SceneEdge, theme: Theme): string {
  if (edge.points.length < 2) return '';
  const d = edge.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const dashed =
    edge.kind === 'subset' || edge.kind === 'redefine' || edge.kind === 'dependency' ||
    edge.kind === 'interface' || edge.kind === 'satisfy' || edge.kind === 'verify' ||
    edge.kind === 'contain' || edge.kind === 'flow' || edge.kind === 'allocate';
  const dotted = edge.kind === 'bind';
  const dash = dotted ? ' stroke-dasharray="1 4"' : dashed ? ' stroke-dasharray="6 4"' : '';
  const parts = [
    `<path d="${d}" fill="none" stroke="${theme.lineColor}" stroke-width="1.5"${dash} ${markerStart(edge.kind)} ${markerEnd(edge.kind)}/>`,
  ];
  if (edge.label) {
    const m = midpoint(edge.points);
    parts.push(
      `<text x="${m.x}" y="${m.y - 4}" text-anchor="middle" font-size="${theme.fontSize - 2}" font-family="${theme.fontFamily}" fill="${theme.textColor}">${escapeXml(edge.label)}</text>`,
    );
  }
  return parts.join('');
}
