import type { Position } from '../model/types.js';

export type Severity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  severity: Severity;
  code: string;
  message: string;
  line: number;
  column: number;
}

export function diagnostic(severity: Severity, code: string, message: string, position: Position): Diagnostic {
  return { severity, code, message, line: position.line, column: position.column };
}
