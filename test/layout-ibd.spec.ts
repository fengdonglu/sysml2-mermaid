import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';
import { layout } from '../src/layout/index.js';

const scene = (src: string) => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return layout(selectView(m, 'ibd'));
};

describe('ibd layout', () => {
  const src = `package P {
    port def FuelPort;
    part def Tank { port out_port : FuelPort; }
    part def Engine { port in_port : FuelPort; }
    part def Vehicle { part tank : Tank; part eng : Engine; connect tank.out_port to eng.in_port; }
  }`;

  it('places port anchors on node borders', () => {
    const s = scene(src);
    const tank = s.nodes.find((n) => n.id === 'P::Vehicle::tank')!;
    expect(tank.portAnchors!.length).toBe(1);
    const a = tank.portAnchors![0]!;
    expect(a.x === tank.x || a.x === tank.x + tank.width).toBe(true);
  });

  it('snaps connector endpoints onto the port anchors', () => {
    const s = scene(src);
    const edge = s.edges.find((e) => e.kind === 'connect')!;
    const tank = s.nodes.find((n) => n.id === 'P::Vehicle::tank')!;
    const anchor = tank.portAnchors![0]!;
    expect(edge.points[0]).toMatchObject({ x: anchor.x, y: anchor.y });
  });
});
