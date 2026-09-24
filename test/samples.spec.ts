import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { renderModel, renderSvg } from '../src/index.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fixtures = readdirSync(fixturesDir).filter((f) => f.endsWith('.sysml'));

const FIXTURES: Record<string, { view: 'bdd' | 'requirement' | 'ibd' | 'statemachine' | 'activity'; names: string[] }> = {
  'vehicle.sysml': { view: 'bdd', names: ['Vehicle', 'Engine', 'PowerSource', 'Car'] },
  'requirements.sysml': { view: 'requirement', names: ['MassLimitation', 'Load', 'VehicleDesign'] },
  'ibd.sysml': { view: 'ibd', names: ['tank', 'eng', 'tankPort', 'enginePort'] },
  'statemachine.sysml': { view: 'statemachine', names: ['closed', 'opened'] },
  'activity.sysml': { view: 'activity', names: ['boil', 'drain', 'serve'] },
  'views.sysml': { view: 'bdd', names: ['Engine'] },
  'constructs.sysml': { view: 'bdd', names: ['Fuel', 'Tank', 'Engine', 'Car'] },
};

describe('end-to-end fixtures', () => {
  it('has at least one fixture', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const file of fixtures) {
    it(`${file} parses with no error diagnostics`, () => {
      const source = readFileSync(join(fixturesDir, file), 'utf8');
      const model = renderModel(source);
      expect(model.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
    });

    it(`${file} renders under its view`, () => {
      const spec = FIXTURES[file];
      expect(spec, `no view configured for ${file}`).toBeTruthy();
      const source = readFileSync(join(fixturesDir, file), 'utf8');
      const svg = renderSvg(source, { view: spec!.view });
      expect(svg.startsWith('<svg')).toBe(true);
      for (const name of spec!.names) expect(svg).toContain(name);
    });
  }
});
