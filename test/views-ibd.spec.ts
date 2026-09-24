import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';

const view = (src: string) => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return selectView(m, 'ibd');
};

describe('ibd view', () => {
  const src = `package P {
    port def FuelPort;
    part def Tank { port out_port : FuelPort; }
    part def Engine { port in_port : FuelPort; }
    part def Vehicle {
      part tank : Tank;
      part eng : Engine;
      connect tank.out_port to eng.in_port;
    }
  }`;

  it('creates a node per part usage with its ports', () => {
    const v = view(src);
    const tank = v.nodes.find((n) => n.id === 'P::Vehicle::tank')!;
    expect(tank.stereotype).toBe('part');
    expect(tank.ports).toEqual(['out_port']);
  });

  it('resolves connector endpoints to owning parts and ports', () => {
    const v = view(src);
    const edge = v.edges.find((e) => e.kind === 'connect')!;
    expect(edge.source).toBe('P::Vehicle::tank');
    expect(edge.target).toBe('P::Vehicle::eng');
    expect(edge.sourcePort).toBe('out_port');
    expect(edge.targetPort).toBe('in_port');
  });

  it('gives interface and bind edges distinct kinds', () => {
    const v = view('package P { port def X; part def A; part def B; part def C { part a : A; part b : B; interface a.p to b.q; bind a.r = b.s; } }');
    expect(v.edges.some((e) => e.kind === 'interface')).toBe(true);
    expect(v.edges.some((e) => e.kind === 'bind')).toBe(true);
  });
});
