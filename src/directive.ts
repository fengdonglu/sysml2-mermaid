import { VIEW_NAMES, type ViewName } from './views/types.js';

const KNOWN = new Set<string>(VIEW_NAMES);

export function viewFromSource(source: string): ViewName | undefined {
  const firstLine = source.split(/\r?\n/, 1)[0] ?? '';
  const match = /^\s*sysml\s+([A-Za-z]+)/.exec(firstLine);
  const name = match?.[1];
  return name && KNOWN.has(name) ? (name as ViewName) : undefined;
}
