import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';

const view = (src: string) => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return selectView(m, 'requirement');
};

describe('requirement view', () => {
  const src = `package P {
    requirement def <'1'> MassLimit { doc /* shall be light */ subject v : Vehicle; require constraint { m <= limit } }
    requirement <'UR2'> Load : MassLimit { requirement Passengers; }
    requirement def V { verify Load; }
    part def Vehicle;
    part def Design;
    satisfy MassLimit by Design;
  }`;

  it('creates requirement nodes with id, subject and constraints', () => {
    const v = view(src);
    const mass = v.nodes.find((n) => n.id === 'P::MassLimit')!;
    expect(mass.stereotype).toBe('requirement');
    expect(mass.note).toBe('shall be light');
    expect(mass.rows.some((r) => r.includes('1'))).toBe(true);
    expect(mass.rows.some((r) => r.includes('subject'))).toBe(true);
    expect(mass.rows.some((r) => r.includes('require'))).toBe(true);
  });

  it('includes the satisfying part as a node', () => {
    const v = view(src);
    expect(v.nodes.find((n) => n.id === 'P::Design')).toBeTruthy();
  });

  it('derives containment edges from ownership', () => {
    const v = view(src);
    expect(v.edges).toContainEqual(expect.objectContaining({ kind: 'contain', source: 'P::Load', target: 'P::Load::Passengers' }));
  });

  it('point satisfy arrows at the requirement and verify at the requirement', () => {
    const v = view(src);
    expect(v.edges).toContainEqual(expect.objectContaining({ kind: 'satisfy', source: 'P::Design', target: 'P::MassLimit' }));
    expect(v.edges).toContainEqual(expect.objectContaining({ kind: 'verify', source: 'P::V', target: 'P::Load' }));
  });
});
