import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';
import { elkLayout } from '../src/layout/elkAdapter.js';
import { renderSvgAsync } from '../src/index.js';

const scene = async (src: string) => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return elkLayout(selectView(m, 'ibd'));
};

const SRC = 'package P { port def FP; part def Tank { port outPort : FP; } part def Engine { port inPort : FP; } part def V { part tank : Tank; part eng : Engine; connect tank.outPort to eng.inPort; } }';

describe('elk layout', () => {
  it('positions nodes and resolves port anchors', async () => {
    const s = await scene(SRC);
    expect(s.nodes.length).toBe(2);
    const tank = s.nodes.find((n) => n.id === 'P::V::tank')!;
    expect(tank.portAnchors!.length).toBe(1);
    expect(Number.isFinite(tank.x)).toBe(true);
  });
  it('routes the connector with points', async () => {
    const s = await scene(SRC);
    const edge = s.edges.find((e) => e.kind === 'connect')!;
    expect(edge.points.length).toBeGreaterThanOrEqual(2);
  });
  it('renders through the async API', async () => {
    const svg = await renderSvgAsync('sysml ibd\n' + SRC, { layout: 'elk' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('tank');
  });
});
