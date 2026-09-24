const KEYWORDS = [
  'sysml', 'bdd', 'requirement', 'ibd', 'statemachine', 'activity',
  'package', 'import', 'private', 'public', 'part', 'attribute', 'port', 'enum',
  'def', 'ref', 'requirement', 'subject', 'stakeholder', 'actor', 'require',
  'assume', 'invariant', 'satisfy', 'verify', 'state', 'action', 'transition',
  'first', 'then', 'entry', 'do', 'exit', 'accept', 'send', 'assign', 'terminate',
  'connect', 'interface', 'binding', 'bind', 'flow', 'perform', 'dependency',
  'specializes', 'subsets', 'redefines', 'view', 'viewpoint', 'frame', 'concern',
  'filter', 'expose', 'render', 'abstract', 'variation', 'individual', 'merge',
  'decide', 'fork', 'join', 'while', 'loop', 'for', 'else', 'if', 'allocate',
  'allocation', 'alias', 'metadata', 'class', 'assoc', 'struct', 'datatype',
  'calc', 'function', 'predicate', 'expr', 'item', 'connection', 'end', 'parallel',
  'doc', 'comment', 'about', 'default', 'and', 'or', 'not', 'of', 'by', 'to',
  'from', 'in', 'out',
];

const escape = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const TOKEN = new RegExp(
  [
    '(\\/\\/[^\\n]*)',                                   // 1 line comment
    '(\\/\\*[\\s\\S]*?\\*\\/)',                          // 2 block comment
    "('(?:[^'\\\\]|\\\\.)*')",                           // 3 quoted name
    '(\\b\\d+(?:\\.\\d+)?\\b)',                          // 4 number
    `(\\b(?:${KEYWORDS.join('|')})\\b)`,                 // 5 keyword
    '(:>>|:>|::>|::|=>)',                                // 6 operator
  ].join('|'),
  'g',
);

const CLASSES = ['tok-comment', 'tok-comment', 'tok-string', 'tok-number', 'tok-keyword', 'tok-op'];

export function highlightSysml(source) {
  let out = '';
  let last = 0;
  for (const match of source.matchAll(TOKEN)) {
    out += escape(source.slice(last, match.index));
    let cls = 'tok-op';
    for (let g = 1; g <= 6; g++) {
      if (match[g] !== undefined) { cls = CLASSES[g - 1]; break; }
    }
    out += `<span class="${cls}">${escape(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  out += escape(source.slice(last));
  return out;
}
