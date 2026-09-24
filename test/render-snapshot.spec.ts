import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';
import { layout } from '../src/layout/index.js';
import { sceneToSvg } from '../src/render/sceneToSvg.js';
import { defaultTheme } from '../src/render/theme.js';

const svgOf = (src: string) => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return sceneToSvg(layout(selectView(m, 'bdd')), defaultTheme);
};

describe('sceneToSvg', () => {
  const src = 'package P { part def Engine; part def Car :> Engine { part e : Engine; } }';

  it('produces a standalone svg string', () => {
    const svg = svgOf(src);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('viewBox=');
  });
  it('renders block names and the stereotype', () => {
    const svg = svgOf(src);
    expect(svg).toContain('Car');
    expect(svg).toContain('Engine');
    expect(svg).toContain('block');
  });
  it('renders edge markers', () => {
    const svg = svgOf(src);
    expect(svg).toContain('s2m-triangle');
    expect(svg).toContain('s2m-diamond');
  });
  it('does not touch the DOM', () => {
    expect(typeof (globalThis as unknown as { document?: unknown }).document).toBe('undefined');
    expect(() => svgOf(src)).not.toThrow();
  });
  it('matches the snapshot', () => {
    expect(svgOf('package P { part def A; }')).toMatchSnapshot();
  });
});
