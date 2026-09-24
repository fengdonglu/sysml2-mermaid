import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('package conventions', () => {
  it('is an ESM package named sysml2-mermaid', () => {
    expect(pkg.type).toBe('module');
    expect(pkg.name).toBe('sysml2-mermaid');
  });
  it('exposes the sysml2svg binary and library entry', () => {
    expect(pkg.bin['sysml2svg']).toBe('./dist/cli/cli.js');
    expect(pkg.exports['.']).toBeTruthy();
  });
  it('declares dagre and mermaid', () => {
    expect(pkg.dependencies['@dagrejs/dagre']).toBeTruthy();
    expect(pkg.peerDependencies.mermaid).toBeTruthy();
  });
});
