export type TokenType = 'ident' | 'number' | 'punct' | 'blockcomment' | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const THREE = [':>>', '::>'];
const TWO = ['::', ':>', '..'];
const ONE = ['{', '}', ';', ':', ',', '[', ']', '*', '.', '=', '<', '>', '#', '@', '~'];

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;
  const n = src.length;
  const push = (type: TokenType, value: string, l = line, c = col): void => {
    tokens.push({ type, value, line: l, column: c });
  };

  while (i < n) {
    const ch = src[i]!;
    if (ch === '\n') { i++; line++; col = 1; continue; }
    if (ch === ' ' || ch === '\t' || ch === '\r') { i++; col++; continue; }

    if (ch === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') { i++; col++; }
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const sl = line, sc = col;
      i += 2; col += 2;
      let text = '';
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') { text += '\n'; i++; line++; col = 1; }
        else { text += src[i]; i++; col++; }
      }
      i += 2; col += 2;
      push('blockcomment', text.trim(), sl, sc);
      continue;
    }
    if (ch === "'") {
      const sl = line, sc = col;
      i++; col++;
      let name = '';
      while (i < n && src[i] !== "'") {
        if (src[i] === '\n') { line++; col = 1; } else col++;
        name += src[i]; i++;
      }
      i++; col++;
      push('ident', name, sl, sc);
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const sl = line, sc = col;
      let name = '';
      while (i < n && /[A-Za-z0-9_]/.test(src[i]!)) { name += src[i]; i++; col++; }
      push('ident', name, sl, sc);
      continue;
    }
    if (/[0-9]/.test(ch)) {
      const sl = line, sc = col;
      let num = '';
      while (i < n && /[0-9]/.test(src[i]!)) { num += src[i]; i++; col++; }
      push('number', num, sl, sc);
      continue;
    }

    const three = src.substr(i, 3);
    if (THREE.includes(three)) { push('punct', three); i += 3; col += 3; continue; }
    const two = src.substr(i, 2);
    if (TWO.includes(two)) { push('punct', two); i += 2; col += 2; continue; }
    if (ONE.includes(ch)) { push('punct', ch); i++; col++; continue; }

    push('punct', ch); i++; col++;
  }
  push('eof', '', line, col);
  return tokens;
}
