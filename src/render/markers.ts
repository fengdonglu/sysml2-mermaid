import type { SceneEdge } from '../layout/types.js';
import type { Theme } from './theme.js';

export function markerDefs(theme: Theme): string {
  return [
    '<defs>',
    `<marker id="s2m-triangle" markerWidth="14" markerHeight="14" refX="13" refY="7" orient="auto"><path d="M0,0 L14,7 L0,14 z" fill="${theme.hollowFill}" stroke="${theme.lineColor}" stroke-width="1.5"/></marker>`,
    `<marker id="s2m-diamond" markerWidth="16" markerHeight="14" refX="0" refY="7" orient="auto"><path d="M0,7 L7,0 L16,7 L7,14 z" fill="${theme.lineColor}" stroke="${theme.lineColor}"/></marker>`,
    `<marker id="s2m-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10" fill="none" stroke="${theme.lineColor}" stroke-width="1.5"/></marker>`,
    '</defs>',
  ].join('');
}

export function markerStart(kind: SceneEdge['kind']): string {
  return kind === 'composition' ? 'marker-start="url(#s2m-diamond)"' : '';
}

export function markerEnd(kind: SceneEdge['kind']): string {
  switch (kind) {
    case 'specialization': return 'marker-end="url(#s2m-triangle)"';
    case 'composition': return '';
    case 'bind': return '';
    default: return 'marker-end="url(#s2m-arrow)"';
  }
}
