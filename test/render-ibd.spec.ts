import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';
import { layout } from '../src/layout/index.js';
import { sceneToSvg } from '../src/render/sceneToSvg.js';

const svg = (src: string) => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return sceneToSvg(layout(selectView(m, 'ibd')));
};

describe('ibd render', () => {
  const src = `package P {
    port def FuelPort;
    part def Tank { port out_port : FuelPort; }
    part def Engine { port in_port : FuelPort; }
    part def Vehicle { part tank : Tank; part eng : Engine; connect tank.out_port to eng.in_port; interface tank.out_port to eng.in_port; bind tank.out_port = eng.in_port; }
  }`;

  it('draws port squares and names', () => {
    const s = svg(src);
    expect(s).toContain('out_port');
    expect(s).toContain('in_port');
  });
  it('emits distinct connector line styles', () => {
    const s = svg(src);
    expect(s).toContain('stroke-dasharray="6 4"'); // interface
    expect(s).toContain('stroke-dasharray="1 4"'); // bind
  });
});
