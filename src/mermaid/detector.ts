import type { ExternalDiagramDefinition } from 'mermaid';

type DiagramDetector = ExternalDiagramDefinition['detector'];

export const sysmlDetector: DiagramDetector = (txt: string) => /^\s*sysml(?:\s|$)/.test(txt);
