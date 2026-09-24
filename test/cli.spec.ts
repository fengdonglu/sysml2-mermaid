import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from '../src/cli/cli.js';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 's2m-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

const write = (name: string, text: string) => {
  const p = join(dir, name);
  writeFileSync(p, text, 'utf8');
  return p;
};

describe('runCli', () => {
  it('writes an svg next to the input by default', async () => {
    const input = write('model.sysml', 'sysml\npackage P { part def A; }');
    const code = await runCli([input]);
    expect(code).toBe(0);
    expect(readFileSync(join(dir, 'model.svg'), 'utf8')).toContain('<svg');
  });
  it('honours -o and --json', async () => {
    const input = write('model.sysml', 'sysml\npackage P { part def A; }');
    const out = join(dir, 'out.svg');
    const json = join(dir, 'out.json');
    const code = await runCli([input, '-o', out, '--json', json]);
    expect(code).toBe(0);
    expect(existsSync(out)).toBe(true);
    expect(JSON.parse(readFileSync(json, 'utf8')).elements.length).toBeGreaterThan(0);
  });
  it('returns 1 when the input cannot be read', async () => {
    expect(await runCli([join(dir, 'missing.sysml')])).toBe(1);
  });
  it('accepts the requirement and ibd views', async () => {
    const req = write('req.sysml', 'sysml\npackage P { requirement def R; part def X; satisfy R by X; }');
    expect(await runCli([req, '--view', 'requirement'])).toBe(0);
    const ibd = write('ibd.sysml', 'sysml\npackage P { part def A; part def C { part a : A; connect a.p to a.q; } }');
    expect(await runCli([ibd, '--view', 'ibd'])).toBe(0);
  });
  it('rejects an unknown view', async () => {
    const input = write('model.sysml', 'sysml\npackage P { part def A; }');
    expect(await runCli([input, '--view', 'nope'])).toBe(1);
  });
  it('selects and scopes by --view-name', async () => {
    const input = write('v.sysml', 'sysml bdd\npackage P { part def A; part def B; view def V :> GeneralView; view v : V { expose P::A; } }');
    const out = join(dir, 'v.svg');
    expect(await runCli([input, '-o', out, '--view-name', 'v'])).toBe(0);
    const svg = readFileSync(out, 'utf8');
    expect(svg).toContain('A');
    expect(svg).not.toMatch(/block» B/);
  });
  it('accepts --layout elk', async () => {
    const input = write('v.sysml', 'sysml ibd\npackage P { port def FP; part def A { port p : FP; } part def B { port q : FP; } part def C { part a : A; part b : B; connect a.p to b.q; } }');
    const out = join(dir, 'v.svg');
    expect(await runCli([input, '-o', out, '--layout', 'elk'])).toBe(0);
    expect(readFileSync(out, 'utf8')).toContain('<svg');
  });
  it('accepts the statemachine and activity views', async () => {
    const sm = write('sm.sysml', 'sysml\npackage P { state s { state a; first start then a; } }');
    expect(await runCli([sm, '--view', 'statemachine'])).toBe(0);
    const act = write('act.sysml', 'sysml\npackage P { action a; action b; first a then b; }');
    expect(await runCli([act, '--view', 'activity'])).toBe(0);
  });
});
