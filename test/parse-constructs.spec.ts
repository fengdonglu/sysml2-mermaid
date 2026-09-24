import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
const parse = (s: string) => parseSysml('sysml\n' + s);

describe('parseSysml constructs', () => {
  it('parses items', () => {
    const m = parse('package P { item def Fuel; item fuel : Fuel; ref item driver : Person; }');
    expect(m.elements.get('P::Fuel')!.kind).toBe('item-def');
    expect(m.elements.get('P::fuel')!.kind).toBe('item');
    expect(m.elements.get('P::driver')!.isReference).toBe(true);
  });
  it('parses aliases', () => {
    const m = parse('package P { part def Engine; alias eng for Engine; }');
    expect(m.elements.get('P::eng')!.kind).toBe('alias');
    expect(m.elements.get('P::eng')!.typeRef).toBe('Engine');
  });
  it('parses allocate', () => {
    const m = parse('package P { part def A; part def B; allocate A to B; }');
    expect(m.relationships.find((r) => r.kind === 'allocate')).toMatchObject({ sourceRef: 'A', targetRef: 'B' });
  });
  it('parses connection and interface definitions with ends', () => {
    const m = parse('package P { connection def C { end a : A; end [1] part b : B; } interface def I { end p : P1; end q : P2; } }');
    expect(m.elements.get('P::C')!.kind).toBe('connection-def');
    expect([...m.elements.values()].filter((e) => e.kind === 'end' && e.ownerId === 'P::C').length).toBe(2);
    expect(m.elements.get('P::I')!.kind).toBe('interface-def');
  });
  it('parses port direction', () => {
    const m = parse('package P { part def E { in port fuelIn : FuelPort; out port drive : DrivePort; } }');
    const p = m.elements.get('P::E::fuelIn')!;
    expect(p.kind).toBe('port');
    expect(p.direction).toBe('in');
  });
});
