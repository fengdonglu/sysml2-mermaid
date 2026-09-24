import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderSvg } from '../dist/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const sample = (name) => readFileSync(`${root}demo/samples/${name}`, 'utf8');

const PANELS = [
  { title: 'Block Definition Diagram', file: '01-parts-composition.sysml', view: 'bdd' },
  { title: 'Requirement Diagram', file: '02-requirements.sysml', view: 'requirement' },
  { title: 'Internal Block Diagram', file: '03-ibd-connectors.sysml', view: 'ibd' },
  { title: 'State Machine', file: '04-state-machine.sysml', view: 'statemachine' },
  { title: 'Activity / Swimlane', file: '06-swimlane.sysml', view: 'activity' },
  { title: 'Views and filtering', file: '07-view-selection.sysml', view: 'bdd' },
];

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const panels = PANELS.map(({ title, file, view }) => {
  const svg = renderSvg(sample(file), { view });
  const w = Number(svg.match(/width="(\d+)"/)?.[1] ?? 0);
  const h = Number(svg.match(/height="(\d+)"/)?.[1] ?? 0);
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return { title, w, h, inner };
});

const COLS = 2;
const GAP = 28;
const TITLE_H = 26;
const PAD = 24;
const cols = Math.ceil(panels.length / COLS);
const colW = new Array(COLS).fill(0);
const rowH = new Array(cols).fill(0);
panels.forEach((p, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  colW[col] = Math.max(colW[col], p.w);
  rowH[row] = Math.max(rowH[row], p.h + TITLE_H);
});
const colX = colW.map((_, c) => PAD + colW.slice(0, c).reduce((a, b) => a + b + GAP, 0));
const rowY = rowH.map((_, r) => PAD + rowH.slice(0, r).reduce((a, b) => a + b + GAP, 0));
const width = PAD * 2 + colW.reduce((a, b) => a + b, 0) + GAP * (COLS - 1);
const height = PAD * 2 + rowH.reduce((a, b) => a + b, 0) + GAP * (rowH.length - 1);

const body = panels.map((p, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = colX[col];
  const y = rowY[row];
  const border = `<rect x="${x}" y="${y}" width="${p.w}" height="${p.h + TITLE_H}" rx="10" fill="#ffffff" stroke="#c9d2dd"/>`;
  const title = `<text x="${x + p.w / 2}" y="${y + 18}" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#1a1a1a">${esc(p.title)}</text>`;
  const inner = `<g transform="translate(${x},${y + TITLE_H})">${p.inner}</g>`;
  return border + title + inner;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(width)} ${Math.ceil(height)}" width="${Math.ceil(width)}" height="${Math.ceil(height)}" role="img"><rect width="100%" height="100%" fill="#f6f8fb"/>${body}</svg>`;
writeFileSync(`${root}assets/gallery.svg`, svg, 'utf8');
console.log(`wrote assets/gallery.svg (${svg.length} bytes)`);
