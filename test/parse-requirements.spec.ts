import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';

const parse = (src: string) => parseSysml('sysml\n' + src);

describe('parseSysml requirements', () => {
  it('parses a requirement definition with a short name and doc', () => {
    const m = parse("package P { requirement def <'1'> MassLimit :> Base { doc /* shall be light */ subject v : Vehicle; } }");
    const r = m.elements.get('P::MassLimit')!;
    expect(r.kind).toBe('requirement-def');
    expect(r.shortName).toBe('1');
    expect(r.doc).toBe('shall be light');
    expect([...m.elements.values()].some((e) => e.kind === 'subject' && e.ownerId === 'P::MassLimit')).toBe(true);
    expect(m.relationships[0]).toMatchObject({ kind: 'specialization', sourceRef: 'P::MassLimit', targetRef: 'Base' });
  });

  it('parses requirement usages and nesting', () => {
    const m = parse("package P { requirement <'UR1'> Load : Functional { requirement Passengers; } }");
    expect(m.elements.get('P::Load')!.kind).toBe('requirement');
    expect(m.elements.get('P::Load')!.shortName).toBe('UR1');
    expect(m.elements.get('P::Load')!.typeRef).toBe('Functional');
    expect(m.elements.get('P::Load::Passengers')!.kind).toBe('requirement');
    expect(m.elements.get('P::Load::Passengers')!.ownerId).toBe('P::Load');
  });

  it('parses require and assume statements as constraint children', () => {
    const m = parse('package P { requirement def R { require constraint { mass <= limit } assume constraint { limit > 0 } } }');
    const constraints = [...m.elements.values()].filter((e) => e.kind === 'constraint');
    expect(constraints.length).toBe(2);
    expect(constraints[0]!.typeRef).toContain('mass');
    expect(constraints[1]!.typeRef).toContain('limit');
  });

  it('parses satisfy with and without assert, and with not', () => {
    const a = parse('package P { part def X; satisfy R by X; }');
    expect(a.relationships.find((r) => r.kind === 'satisfy')).toMatchObject({ sourceRef: 'R', targetRef: 'X' });
    const b = parse('package P { part def X; assert satisfy R by X; }');
    expect(b.relationships.find((r) => r.kind === 'satisfy')).toMatchObject({ sourceRef: 'R', targetRef: 'X' });
    const c = parse('package P { part def X; assert not satisfy R by X; }');
    expect(c.relationships.find((r) => r.kind === 'satisfy')!.negated).toBe(true);
  });

  it('parses verify against the enclosing element', () => {
    const m = parse('package P { requirement def R { verify OtherReq; } }');
    expect(m.relationships.find((r) => r.kind === 'verify')).toMatchObject({ sourceRef: 'P::R', targetRef: 'OtherReq' });
  });
});
