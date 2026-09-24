// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import mermaid from 'mermaid';
import { sysml } from '../src/mermaid/index.js';

beforeAll(async () => {
  mermaid.initialize({ startOnLoad: false });
  await mermaid.registerExternalDiagrams([sysml], { lazyLoad: false });
});

describe('mermaid integration', () => {
  it('detects a sysml diagram', () => {
    expect(sysml.detector('sysml\npackage P { }')).toBe(true);
    expect(sysml.detector('graph TD;')).toBe(false);
  });

  it('renders block names into the svg element', async () => {
    await mermaid.parse('sysml\npackage P { part def Engine; part def Car :> Engine; }');
    const { svg } = await mermaid.render('s2m-test', 'sysml\npackage P { part def Engine; part def Car :> Engine; }');
    expect(svg).toContain('Car');
    expect(svg).toContain('Engine');
  });
});
