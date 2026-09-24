import { describe, it, expect } from 'vitest';
import { VERSION, renderModel, renderSvg } from '../src/index.js';

describe('public API', () => {
  it('exposes a version', () => {
    expect(VERSION).toBe('0.1.1');
  });
  it('renderModel returns a validated model', () => {
    const m = renderModel('sysml\npackage P { part def A; }');
    expect(m.elements.has('P::A')).toBe(true);
  });
  it('renderSvg returns an SVG string', () => {
    const svg = renderSvg('sysml\npackage P { part def A; }');
    expect(svg).toContain('<svg');
    expect(svg).toContain('A');
  });
});
