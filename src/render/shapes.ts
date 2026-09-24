import type { SceneNode } from '../layout/types.js';
import type { Theme } from './theme.js';

const escapeXml = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function nodeSvg(node: SceneNode, theme: Theme): string {
  const parts: string[] = [];
  const warn = node.stereotype === 'unresolved';
  const stroke = warn ? theme.warnColor : theme.lineColor;
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const label = `<text x="${cx}" y="${node.y + node.height + theme.fontSize}" text-anchor="middle" font-size="${theme.fontSize - 2}" font-family="${theme.fontFamily}" fill="${theme.textColor}">${escapeXml(node.label)}</text>`;

  if (node.stereotype === 'initial') {
    return `<circle class="s2m-initial" cx="${cx}" cy="${cy}" r="9" fill="${theme.lineColor}"/>${label}`;
  }
  if (node.stereotype === 'final') {
    return `<circle class="s2m-final" cx="${cx}" cy="${cy}" r="11" fill="none" stroke="${theme.lineColor}" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="6" fill="${theme.lineColor}"/>${label}`;
  }
  if (node.stereotype === 'decision') {
    const h = node.height / 2;
    const w = node.width / 2;
    return `<polygon class="s2m-decision" points="${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}" fill="${theme.blockFill}" stroke="${theme.lineColor}" stroke-width="1.5"/>${label}`;
  }
  if (node.stereotype === 'fork') {
    return `<rect class="s2m-fork" x="${node.x}" y="${cy - 4}" width="${node.width}" height="8" rx="2" fill="${theme.lineColor}"/>${label}`;
  }

  parts.push(`<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="4" fill="${theme.blockFill}" stroke="${stroke}" stroke-width="1.5"/>`);
  parts.push(`<rect x="${node.x}" y="${node.y}" width="${node.width}" height="26" rx="4" fill="${theme.headerFill}" stroke="${stroke}" stroke-width="1.5"/>`);
  const italic = node.isAbstract ? ' font-style="italic"' : '';
  parts.push(`<text x="${node.x + node.width / 2}" y="${node.y + 17}" text-anchor="middle" font-size="${theme.fontSize - 1}" font-family="${theme.fontFamily}" fill="${theme.textColor}"${italic}>«${escapeXml(node.stereotype)}» ${escapeXml(node.label)}</text>`);

  let y = node.y + 42;
  for (const row of node.rows) {
    parts.push(`<text x="${node.x + 8}" y="${y}" font-size="${theme.fontSize - 2}" font-family="${theme.fontFamily}" fill="${theme.textColor}">${escapeXml(row)}</text>`);
    y += 20;
  }
  if (node.note) {
    parts.push(`<text x="${node.x + 8}" y="${y}" font-size="${theme.fontSize - 3}" font-style="italic" font-family="${theme.fontFamily}" fill="${theme.textColor}">${escapeXml(node.note.split('\n')[0]!)}</text>`);
  }

  if (node.portAnchors && node.portAnchors.length > 0) {
    for (const p of node.portAnchors) {
      parts.push(`<rect x="${p.x - 5}" y="${p.y - 5}" width="10" height="10" fill="${theme.portFill}" stroke="${theme.lineColor}" stroke-width="1.2"/>`);
      const onRight = p.x >= node.x + node.width - 0.5;
      parts.push(`<text x="${onRight ? p.x - 8 : p.x + 8}" y="${p.y + 3}" text-anchor="${onRight ? 'end' : 'start'}" font-size="${theme.fontSize - 3}" font-family="${theme.fontFamily}" fill="${theme.textColor}">${escapeXml(p.name)}</text>`);
    }
  } else {
    for (let i = 0; i < node.ports.length; i++) {
      const px = node.x + node.width - 4;
      const py = node.y + 34 + i * 14;
      parts.push(`<rect x="${px - 6}" y="${py - 5}" width="10" height="10" fill="${theme.portFill}" stroke="${theme.lineColor}" stroke-width="1.2"/>`);
      parts.push(`<text x="${px - 10}" y="${py + 3}" text-anchor="end" font-size="${theme.fontSize - 3}" font-family="${theme.fontFamily}" fill="${theme.textColor}">${escapeXml(node.ports[i]!)}</text>`);
    }
  }

  return parts.join('');
}
