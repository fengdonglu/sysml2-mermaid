import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';
import { layout } from '../src/layout/index.js';
import { sceneToSvg } from '../src/render/sceneToSvg.js';

const svg = (s: string, v: 'statemachine' | 'activity') => {
  const m = parseSysml('sysml\n' + s);
  validate(m);
  return sceneToSvg(layout(selectView(m, v)));
};

describe('state/activity render', () => {
  it('draws an initial pseudo-state circle', () => {
    const s = svg('package P { state s { state a; first start then a; } }', 'statemachine');
    expect(s).toContain('s2m-initial');
  });
  it('draws swimlane group rectangles', () => {
    const s = svg('package P { part def W; action a; action b; part p : W { perform a; } first a then b; }', 'activity');
    expect(s).toContain('s2m-group');
  });
});
