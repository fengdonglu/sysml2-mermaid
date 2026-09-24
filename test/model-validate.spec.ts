import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';

const resolve = (src: string) => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return m;
};

describe('validate', () => {
  it('resolves a type reference to its definition', () => {
    const m = resolve('package P { part def Engine; part def Car { part e : Engine; } }');
    expect(m.elements.get('P::Car::e')!.typeId).toBe('P::Engine');
    expect(m.diagnostics).toEqual([]);
  });
  it('creates a placeholder and a warning for an unresolved type', () => {
    const m = resolve('package P { part def Car { part e : Engine; } }');
    expect(m.elements.get('P::Car::e')!.typeId).toBe('unresolved:Engine');
    expect(m.elements.get('unresolved:Engine')!.kind).toBe('unresolved');
    expect(m.diagnostics.some((d) => d.code === 'unresolved-reference' && d.severity === 'warning')).toBe(true);
  });
  it('resolves relationship endpoints', () => {
    const m = resolve('package P { part def A :> B; part def B; }');
    const rel = m.relationships[0]!;
    expect(rel.sourceId).toBe('P::A');
    expect(rel.targetId).toBe('P::B');
  });
  it('resolves a redefinition target to the inherited feature', () => {
    const m = resolve('package P { part def A { part e : E; } part def B :> A { part e : E :>> e; } }');
    const rel = m.relationships.find((r) => r.kind === 'redefine')!;
    expect(rel.sourceId).toBe('P::B::e');
    expect(rel.targetId).toBe('P::A::e');
  });
  it('prefers a definition over a same-named package', () => {
    const m = resolve('package V { part def V; part def C :> V; }');
    expect(m.relationships[0]!.targetId).toBe('V::V');
  });
  it('resolves a redefinition target through a same-named package', () => {
    const m = resolve('package V { part def V { part e : E; } part def C :> V { part e : E :>> e; } }');
    const rel = m.relationships.find((r) => r.kind === 'redefine')!;
    expect(rel.targetId).toBe('V::V::e');
  });
  it('reports duplicate definitions', () => {
    const m = resolve('package P { part def A; part def A; }');
    expect(m.diagnostics.some((d) => d.code === 'duplicate-definition' && d.severity === 'error')).toBe(true);
  });
  it('returns no errors for a fully resolvable model', () => {
    const m = resolve('package P { part def A; part def B :> A; part def C { part a : A; } }');
    expect(m.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
  });
});

describe('v0.2 relationship resolution', () => {
  it('resolves satisfy endpoints', () => {
    const m = resolve('package P { part def X; satisfy R by X; }');
    const rel = m.relationships.find((r) => r.kind === 'satisfy')!;
    expect(rel.sourceId).toBe('unresolved:R');
    expect(rel.targetId).toBe('P::X');
  });
  it('leaves connect endpoints unresolved without warnings', () => {
    const m = resolve('package P { part def C { part a : A; part b : B; connect a.p to b.q; } }');
    const rel = m.relationships.find((r) => r.kind === 'connect')!;
    expect(rel.sourceId).toBeUndefined();
    expect(m.diagnostics.some((d) => d.message.includes('a.p'))).toBe(false);
  });
  it('does not treat an inline constraint expression as a reference', () => {
    const m = resolve('package P { requirement def R { require constraint { a <= b } } }');
    expect(m.diagnostics.filter((d) => d.severity === 'warning')).toEqual([]);
  });
});

describe('v0.3 relationship resolution', () => {
  it('resolves transition endpoints but not pseudo-states', () => {
    const m = resolve('package P { state s { state a; state b; transition t first a then b; first start then a; } }');
    const ts = m.relationships.filter((r) => r.kind === 'transition');
    const real = ts.find((r) => r.sourceRef === 'a')!;
    expect(real.targetId).toBe('P::s::b');
    const initial = ts.find((r) => r.sourceRef === 'start')!;
    expect(initial.sourceId).toBeUndefined();
    expect(m.diagnostics.some((d) => d.message.includes('start'))).toBe(false);
  });
});
