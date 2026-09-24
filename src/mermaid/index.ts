import type { ExternalDiagramDefinition } from 'mermaid';
import { sysmlDetector } from './detector.js';

type DiagramLoader = ExternalDiagramDefinition['loader'];

const id = 'sysml';

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const sysml: ExternalDiagramDefinition = { id, detector: sysmlDetector, loader };

export async function registerSysml(): Promise<void> {
  const mermaid = (await import('mermaid')).default;
  await mermaid.registerExternalDiagrams([sysml], { lazyLoad: false });
}
