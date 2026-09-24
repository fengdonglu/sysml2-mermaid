import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
const parse = (s: string) => parseSysml('sysml\n' + s);

describe('parseSysml coverage', () => {
  it('parses import variants', () => {
    const m = parse('package P { import all A::*; import B::*::**; import C::[x]; }');
    const targets = [...m.elements.values()].filter((e) => e.kind === 'import').map((e) => e.typeRef);
    expect(targets).toEqual(['A::*', 'B::*::**', 'C::[x]']);
  });
  it('parses n-ary connectors', () => {
    const m = parse('package P { part def C { part a; part b; part c; connect (a, b, c); } }');
    const conns = m.relationships.filter((r) => r.kind === 'connect');
    expect(conns.length).toBe(2);
    expect(conns.map((r) => [r.sourceRef, r.targetRef])).toEqual([['a', 'b'], ['a', 'c']]);
  });
  it('parses control node declarations', () => {
    const m = parse('package P { action a; decide; a then decide; }');
    expect([...m.elements.values()].some((e) => e.kind === 'control' && e.name === 'decide')).toBe(true);
    expect(m.relationships.find((r) => r.kind === 'succession')).toMatchObject({ sourceRef: 'a', targetRef: 'decide' });
  });
  it('parses if/else as labelled successions', () => {
    const m = parse('package P { action a; action b; action c; first a then b; if x then c; else b; }');
    const labels = m.relationships.filter((r) => r.kind === 'succession').map((r) => r.label);
    expect(labels.some((l) => l && l.startsWith('if'))).toBe(true);
    expect(labels).toContain('else');
  });
  it('captures while/loop/for as statements', () => {
    const m = parse('package P { action a; while a > 0; }');
    expect([...m.elements.values()].some((e) => e.kind === 'statement' && e.name === 'while')).toBe(true);
  });
  it('parses succession flow', () => {
    const m = parse('package P { action a; action b; succession flow from a to b; }');
    expect(m.relationships.find((r) => r.kind === 'flow')).toMatchObject({ sourceRef: 'a', targetRef: 'b' });
  });
});
