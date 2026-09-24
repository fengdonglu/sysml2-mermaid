import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
const parse = (s: string) => parseSysml('sysml\n' + s);

describe('parseSysml views', () => {
  it('parses view def and view usage with expose/filter/render', () => {
    const m = parse('package P { view def V :> GeneralView { filter @Safety; render asTreeDiagram; } view v : V { expose P::*; } }');
    expect(m.elements.get('P::V')!.kind).toBe('view-def');
    expect(m.elements.get('P::V')!.filters).toEqual(['Safety']);
    expect(m.elements.get('P::V')!.render).toBe('asTreeDiagram');
    const v = m.elements.get('P::v')!;
    expect(v.kind).toBe('view');
    expect(v.exposes![0]).toMatchObject({ ref: 'P', namespace: true });
  });
  it('parses recursive expose and filter conjunctions', () => {
    const m = parse('package P { view v { expose P::A::**; filter @A and @B; } }');
    const v = m.elements.get('P::v')!;
    expect(v.exposes![0]).toMatchObject({ ref: 'P::A', recursive: true });
    expect(v.filters).toEqual(['A', 'B']);
  });
  it('parses abstract and metadata annotations', () => {
    const m = parse('package P { abstract part def A; #Safety part def B; part def C { part s {@Safety;} } }');
    expect(m.elements.get('P::A')!.isAbstract).toBe(true);
    expect(m.elements.get('P::B')!.metadata).toEqual(['Safety']);
    expect(m.elements.get('P::C::s')!.metadata).toEqual(['Safety']);
  });
  it('parses viewpoint definitions and usages', () => {
    const m = parse('package P { viewpoint def VP; viewpoint vp : VP; }');
    expect(m.elements.get('P::VP')!.kind).toBe('viewpoint-def');
    expect(m.elements.get('P::vp')!.kind).toBe('viewpoint');
  });
});
