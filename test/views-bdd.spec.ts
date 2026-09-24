import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';

const view = (src: string) => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return selectView(m, 'bdd');
};

describe('bdd view', () => {
  const src = `package P {
    enum def Color { red; green; }
    attribute def Mass;
    part def PowerSource;
    part def Engine :> PowerSource { attribute mass : Mass; port fuel : FuelPort; }
    part def Vehicle { part engine : Engine[2]; ref part op : Person; }
    part def Car :> Vehicle { part engine : Engine :>> engine; }
    dependency from Car to Engine;
  }`;

  it('creates a node per definition with a stereotype', () => {
    const v = view(src);
    const byId = new Map(v.nodes.map((n) => [n.id, n]));
    expect(byId.get('P::Engine')!.stereotype).toBe('block');
    expect(byId.get('P::Color')!.stereotype).toBe('enumeration');
    expect(byId.get('P::Mass')!.stereotype).toBe('valueType');
    expect(byId.get('P::Engine')!.ports).toEqual(['fuel']);
  });

  it('puts attribute, part and literal children into rows', () => {
    const v = view(src);
    const engine = v.nodes.find((n) => n.id === 'P::Engine')!;
    expect(engine.rows).toContain('mass : Mass');
    const color = v.nodes.find((n) => n.id === 'P::Color')!;
    expect(color.rows).toEqual(['red', 'green']);
  });

  it('emits specialization, composition, reference and dependency edges', () => {
    const v = view(src);
    const kinds = (s: string, t: string) => v.edges.filter((e) => e.source === s && e.target === t).map((e) => e.kind);
    expect(kinds('P::Engine', 'P::PowerSource')).toContain('specialization');
    expect(kinds('P::Vehicle', 'P::Engine')).toContain('composition');
    expect(kinds('P::Vehicle', 'unresolved:Person')).toContain('reference');
    expect(kinds('P::Car', 'P::Engine')).toContain('dependency');
  });

  it('adds labels for multiplicity and subset/redefine', () => {
    const v = view(src);
    const comp = v.edges.find((e) => e.source === 'P::Vehicle' && e.target === 'P::Engine')!;
    expect(comp.label).toBe('[2]');
    const redefine = v.edges.find((e) => e.kind === 'redefine')!;
    expect(redefine.source).toBe('P::Car');
    expect(redefine.target).toBe('P::Vehicle');
    expect(redefine.label).toBe('redefines engine');
  });

  it('adds an unresolved placeholder node when referenced', () => {
    const v = view(src);
    expect(v.nodes.find((n) => n.id === 'unresolved:Person')!.stereotype).toBe('unresolved');
  });

  it('turns package-level part usages into nodes', () => {
    const v = view('package P { part def A; part shared : A; }');
    expect(v.nodes.some((n) => n.id === 'P::shared')).toBe(true);
    expect(v.edges).toContainEqual(expect.objectContaining({ source: 'P::shared', target: 'P::A', kind: 'reference' }));
  });
});
