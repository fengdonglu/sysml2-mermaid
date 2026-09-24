import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';

const kinds = (src: string) => {
  const m = parseSysml('sysml\n' + src);
  return [...m.elements.values()].map((e) => `${e.kind}:${e.qualifiedName}`);
};

describe('parseSysml declarations', () => {
  it('ignores the leading marker', () => {
    expect([...parseSysml('sysml\npackage P;').elements.values()].map((e) => e.name)).toEqual(['P']);
  });
  it('nests members and computes qualified names', () => {
    expect(kinds('package P { part def A { attribute x : Real; } }'))
      .toEqual(['package:P', 'part-def:P::A', 'attribute:P::A::x']);
  });
  it('parses definitions and usages of every kind', () => {
    expect(kinds('package P { attribute def M; port def Q; enum def E { a; b; } part def B; }'))
      .toEqual(['package:P', 'attribute-def:P::M', 'port-def:P::Q', 'enum-def:P::E', 'enum-literal:P::E::a', 'enum-literal:P::E::b', 'part-def:P::B']);
  });
  it('records imports with their target', () => {
    const m = parseSysml('sysml\npackage P { private import ScalarValues::*; private import P::A; }');
    const imports = [...m.elements.values()].filter((e) => e.kind === 'import');
    expect(imports.map((e) => e.typeRef)).toEqual(['ScalarValues::*', 'P::A']);
  });
  it('records a composite part usage with type and multiplicity', () => {
    const m = parseSysml('sysml\npackage P { part def A { part eng : Engine[2]; ref part op : Person; } }');
    const eng = m.elements.get('P::A::eng')!;
    expect(eng.isReference).toBeFalsy();
    expect(eng.typeRef).toBe('Engine');
    expect(eng.multiplicity).toEqual({ lower: '2', upper: '2' });
    expect(m.elements.get('P::A::op')!.isReference).toBe(true);
  });
  it('attaches doc and comment to the enclosing element', () => {
    const m = parseSysml('sysml\npackage P { part def A { doc /* docs */ attribute x : Real; comment /* note */ } }');
    expect(m.elements.get('P::A')!.doc).toBe('docs');
    expect(m.elements.get('P::A')!.comment).toBe('note');
  });
  it('reports an error without throwing on unexpected input', () => {
    const m = parseSysml('sysml\npackage P { ??? }');
    expect(m.diagnostics.some((d) => d.severity === 'error')).toBe(true);
  });
});
