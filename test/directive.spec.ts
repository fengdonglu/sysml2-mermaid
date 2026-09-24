import { describe, it, expect } from 'vitest';
import { viewFromSource } from '../src/directive.js';
import { parseSysml } from '../src/core/sysml/parse.js';
import { renderSvg } from '../src/index.js';

describe('view directive', () => {
  it('reads the view from the marker line', () => {
    expect(viewFromSource('sysml activity\npackage P { }')).toBe('activity');
    expect(viewFromSource('sysml\npackage P { }')).toBeUndefined();
    expect(viewFromSource('sysml nope\n')).toBeUndefined();
  });
  it('tolerates the view token in the parser', () => {
    const m = parseSysml('sysml statemachine\npackage P { state s { state a; } }');
    expect(m.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
    expect(m.elements.has('P::s')).toBe(true);
  });
  it('renderSvg honours the directive', () => {
    const svg = renderSvg('sysml activity\npackage P { action a; first start then a; }');
    expect(svg).toContain('s2m-initial');
  });
});
