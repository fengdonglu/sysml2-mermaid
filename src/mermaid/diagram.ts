import type { ExternalDiagramDefinition } from 'mermaid';
import { sysmlRenderer } from './renderer.js';
import getStyles from './styles.js';
import { SysmlDb } from './db.js';
import { themeFromMermaid } from '../render/theme.js';

const db = new SysmlDb();

type DiagramDefinition = Awaited<ReturnType<ExternalDiagramDefinition['loader']>>['diagram'];

export const diagram: DiagramDefinition = {
  parser: {
    parse: (text: string) => {
      db.setSource(text);
    },
  },
  db,
  init: (config) => {
    db.setTheme(themeFromMermaid(config.themeVariables as Record<string, string> | undefined));
  },
  renderer: sysmlRenderer,
  styles: getStyles,
};
