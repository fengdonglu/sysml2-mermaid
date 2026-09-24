import { tokenize, type Token } from './tokenize.js';
import { diagnostic } from './diagnostics.js';
import {
  addElement, emptyModel,
  type Element, type ElementKind, type Multiplicity, type RelationshipKind, type SysmlModel,
} from '../model/types.js';

const PREFIX = new Set(['variation', 'individual', 'ordered', 'nonunique', 'snapshot', 'timeslice', 'derived']);
const GENERIC = new Set([
  'metadata', 'concern', 'allocation', 'calc', 'function', 'predicate',
  'class', 'assoc', 'connector', 'struct', 'datatype', 'rendering', 'expr',
]);
const EXHIBIT_KINDS = new Set(['state', 'action', 'part', 'attribute', 'port', 'item']);
const CONTROL = new Set(['merge', 'decide', 'fork', 'join']);

class Parser {
  private tokens: Token[];
  private pos = 0;
  private model: SysmlModel = emptyModel();
  private relCounter = 0;
  private importCounter = 0;
  private prevRef: string | undefined = undefined;
  private pendingAbstract = false;
  private pendingMetadata: string[] = [];
  private pendingModifiers: string[] = [];

  constructor(source: string) {
    this.tokens = tokenize(source);
  }

  parse(): SysmlModel {
    const marker = this.peek();
    if (marker.type === 'ident' && marker.value === 'sysml') {
      this.next();
      // Optional view directive on the marker line, e.g. `sysml statemachine`.
      if (this.peek().type === 'ident' && this.peek().line === marker.line) this.next();
    }
    this.parseMembers(undefined, '');
    if (this.peek().type !== 'eof') this.error('unexpected-token', `unexpected '${this.peek().value || 'end of input'}'`);
    return this.model;
  }

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)]!;
  }
  private next(): Token {
    const t = this.peek();
    if (t.type !== 'eof') this.pos++;
    return t;
  }
  private at(value: string): boolean {
    const t = this.peek();
    return (t.type === 'ident' || t.type === 'punct') && t.value === value;
  }
  private eat(value: string): boolean {
    if (this.at(value)) { this.next(); return true; }
    return false;
  }
  private error(code: string, message: string, t: Token = this.peek()): void {
    this.model.diagnostics.push(diagnostic('error', code, message, { line: t.line, column: t.column }));
  }
  private expect(value: string): boolean {
    if (this.eat(value)) return true;
    this.error('expected-token', `expected '${value}' but found '${this.peek().value || 'end of input'}'`);
    return false;
  }
  private skipToStatementEnd(): void {
    while (this.peek().type !== 'eof' && !this.at(';') && !this.at('}')) this.next();
    this.eat(';');
  }

  private parseMembers(ownerId: string | undefined, ownerQName: string): void {
    this.prevRef = undefined;
    this.pendingAbstract = false;
    this.pendingMetadata = [];
    this.pendingModifiers = [];
    while (this.peek().type !== 'eof' && !this.at('}')) this.parseMember(ownerId, ownerQName);
    this.eat('}');
  }

  private parseMember(ownerId: string | undefined, ownerQName: string): void {
    const t = this.peek();
    if (t.type === 'blockcomment') { this.next(); this.addNote(ownerId, t.value, 'comment'); return; }
    if (t.type === 'punct' && t.value === '#') {
      this.next();
      if (this.peek().type !== 'ident') { this.error('expected-name', 'expected metadata name after #'); return; }
      this.pendingMetadata.push(this.next().value);
      this.parseMember(ownerId, ownerQName);
      return;
    }
    if (t.type === 'punct' && t.value === '@') {
      this.next();
      if (this.peek().type !== 'ident') { this.error('expected-name', 'expected metadata name after @'); return; }
      const name = this.next().value;
      this.expect(';');
      const owner = ownerId ? this.model.elements.get(ownerId) : undefined;
      if (owner) owner.metadata = [...(owner.metadata ?? []), name];
      return;
    }
    if (t.type !== 'ident') { this.error('unexpected-token', `unexpected '${t.value || 'end of input'}'`); this.next(); return; }
    if (PREFIX.has(t.value)) { this.next(); this.pendingModifiers.push(t.value); this.parseMember(ownerId, ownerQName); return; }

    switch (t.value) {
      case 'package': this.parsePackage(ownerId, ownerQName); return;
      case 'import': this.parseImport(ownerId, ownerQName); return;
      case 'private': case 'public':
        this.next();
        if (this.at('import')) this.parseImport(ownerId, ownerQName);
        else this.error('unsupported-construct', `visibility before '${this.peek().value}' is not supported`);
        return;
      case 'part':
        if (this.peek(1).value === 'def') this.parseDefinition('part-def', ownerId, ownerQName);
        else this.parseUsage('part', ownerId, ownerQName, false);
        return;
      case 'attribute':
        if (this.peek(1).value === 'def') this.parseDefinition('attribute-def', ownerId, ownerQName);
        else this.parseUsage('attribute', ownerId, ownerQName, false);
        return;
      case 'port':
        if (this.peek(1).value === 'def') this.parseDefinition('port-def', ownerId, ownerQName);
        else this.parseUsage('port', ownerId, ownerQName, false);
        return;
      case 'enum': this.parseEnumDef(ownerId, ownerQName); return;
      case 'ref':
        this.next();
        if (this.at('part')) this.parseUsage('part', ownerId, ownerQName, true);
        else if (this.at('item')) this.parseUsage('item', ownerId, ownerQName, true);
        else if (this.at('port')) this.parseUsage('port', ownerId, ownerQName, true);
        else if (this.at('attribute')) this.parseUsage('attribute', ownerId, ownerQName, true);
        else this.error('unsupported-construct', "'ref' is only supported before part/item/port/attribute");
        return;
      case 'item':
        if (this.peek(1).value === 'def') this.parseDefinition('item-def', ownerId, ownerQName);
        else this.parseUsage('item', ownerId, ownerQName, false);
        return;
      case 'alias': this.parseAlias(ownerId, ownerQName); return;
      case 'allocate': this.parseAllocate(); return;
      case 'allocation':
        if (this.peek(1).value === 'def') this.parseGeneric('allocation', ownerId, ownerQName);
        else this.parseAllocation();
        return;
      case 'connection':
        if (this.peek(1).value === 'def') this.parseDefinition('connection-def', ownerId, ownerQName);
        else this.parseConnectionUsage();
        return;
      case 'end': this.parseEnd(ownerId, ownerQName); return;
      case 'doc': this.parseDoc(ownerId); return;
      case 'comment': this.parseComment(ownerId); return;
      case 'dependency': this.parseDependency(ownerQName); return;
      case 'requirement':
        if (this.peek(1).value === 'def') this.parseRequirement('requirement-def', ownerId, ownerQName);
        else this.parseRequirement('requirement', ownerId, ownerQName);
        return;
      case 'subject': this.parseSubject(ownerId, ownerQName); return;
      case 'require': this.parseConstraint('require', ownerId, ownerQName); return;
      case 'assume': this.parseConstraint('assume', ownerId, ownerQName); return;
      case 'verify': this.parseVerify(ownerId); return;
      case 'satisfy': this.parseSatisfy(false, ownerId); return;
      case 'assert': {
        this.next();
        const negated = this.eat('not');
        if (this.at('constraint')) {
          this.next();
          const name = this.peek().type === 'ident' && this.peek(1).value === '{' ? this.next().value : 'assert';
          const raw = this.captureBraceBlock();
          this.eat(';');
          this.makeChild('constraint', ownerId, ownerQName, name, raw);
          return;
        }
        if (!this.at('satisfy')) { this.error('unsupported-construct', "'assert' is only supported before 'satisfy' or 'constraint'"); return; }
        this.parseSatisfy(negated, ownerId);
        return;
      }
      case 'connect': this.parseConnect(); return;
      case 'interface':
        if (this.peek(1).value === 'def') this.parseDefinition('interface-def', ownerId, ownerQName);
        else this.parseInterface();
        return;
      case 'bind': this.parseBind(); return;
      case 'binding': this.parseBinding(); return;
      case 'stakeholder': case 'actor': this.parseRole(t.value as ElementKind, ownerId, ownerQName); return;
      case 'invariant': this.parseConstraint('invariant', ownerId, ownerQName); return;
      case 'frame': this.parseFrame(ownerId); return;
      case 'exhibit': this.parseExhibit(ownerId, ownerQName); return;
      case 'state':
        if (this.peek(1).value === 'def') this.parseDefinition('state-def', ownerId, ownerQName);
        else this.parseUsage('state', ownerId, ownerQName, false);
        return;
      case 'action':
        if (this.peek(1).value === 'def') this.parseDefinition('action-def', ownerId, ownerQName);
        else this.parseUsage('action', ownerId, ownerQName, false);
        return;
      case 'transition': this.parseTransition(); return;
      case 'first': case 'then': this.parseFirstThen(ownerId); return;
      case 'flow': this.parseFlow(); return;
      case 'succession':
        this.next();
        if (this.at('flow')) { this.next(); this.parseFlowBody(); }
        else this.error('unsupported-construct', "expected 'flow' after 'succession'");
        return;
      case 'if': this.parseIf(ownerId, ownerQName); return;
      case 'else': this.parseElse(); return;
      case 'while': case 'loop': case 'for':
        this.next();
        this.makeChild('statement', ownerId, ownerQName, t.value, this.captureBalanced());
        return;
      case 'perform': this.parsePerform(ownerId); return;
      case 'entry': case 'do': case 'exit': this.parseStateAction(t.value, ownerId, ownerQName); return;
      case 'accept': case 'send': case 'assign': case 'terminate': this.parseRawStatement(t.value, ownerId, ownerQName); return;
      case 'in': case 'out': case 'inout': this.parseParam(t.value, ownerId, ownerQName); return;
      case 'abstract':
        this.next();
        if (this.peek().type === 'ident') { this.pendingAbstract = true; this.parseMember(ownerId, ownerQName); }
        else this.error('unexpected-token', "expected a declaration after 'abstract'");
        return;
      case 'view':
        if (this.peek(1).value === 'def') this.parseViewLike('view-def', ownerId, ownerQName);
        else this.parseViewLike('view', ownerId, ownerQName);
        return;
      case 'viewpoint':
        if (this.peek(1).value === 'def') this.parseViewLike('viewpoint-def', ownerId, ownerQName);
        else this.parseViewLike('viewpoint', ownerId, ownerQName);
        return;
      case 'expose': this.parseExpose(ownerId); return;
      case 'filter': this.parseFilter(ownerId); return;
      case 'render': this.parseRender(ownerId); return;
      default:
        if (GENERIC.has(t.value)) { this.parseGeneric(t.value, ownerId, ownerQName); return; }
        if (CONTROL.has(t.value) && this.peek(1).value === ';') {
          this.next();
          const el = this.makeChild('control', ownerId, ownerQName, t.value);
          this.expect(';');
          this.prevRef = el.qualifiedName;
          return;
        }
        if (t.type === 'ident' && this.peek(1).value === 'then') {
          const sourceRef = this.parseReference();
          this.expect('then');
          const targetRef = this.parseReference();
          this.expect(';');
          const kind = this.isStateOwner(ownerId) ? 'transition' : 'succession';
          this.addRelationship(kind, sourceRef, targetRef, t);
          this.prevRef = targetRef;
          return;
        }
        this.error('unexpected-token', `unexpected '${t.value}'`);
        this.skipToStatementEnd();
    }
  }

  private makeElement(kind: ElementKind, nameTok: Token, ownerId: string | undefined, ownerQName: string): Element {
    const qName = ownerQName ? `${ownerQName}::${nameTok.value}` : nameTok.value;
    if (this.model.elements.has(qName)) this.error('duplicate-definition', `duplicate definition '${qName}'`, nameTok);
    const el: Element = {
      id: qName, kind, name: nameTok.value, qualifiedName: qName, ownerId, childIds: [],
      position: { line: nameTok.line, column: nameTok.column },
    };
    if (this.pendingAbstract) { el.isAbstract = true; this.pendingAbstract = false; }
    if (this.pendingMetadata.length) { el.metadata = [...this.pendingMetadata]; this.pendingMetadata = []; }
    if (this.pendingModifiers.length) { el.modifiers = [...this.pendingModifiers]; this.pendingModifiers = []; }
    addElement(this.model, el);
    return el;
  }

  private parsePackage(ownerId: string | undefined, ownerQName: string): void {
    this.next();
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected package name'); return; }
    const el = this.makeElement('package', this.next(), ownerId, ownerQName);
    if (this.eat(';')) return;
    if (!this.expect('{')) return;
    this.parseMembers(el.id, el.qualifiedName);
  }

  private parseDefinition(kind: ElementKind, ownerId: string | undefined, ownerQName: string): void {
    this.next();
    this.next();
    if (this.peek().type !== 'ident') { this.error('expected-name', `expected ${kind} name`); return; }
    const el = this.makeElement(kind, this.next(), ownerId, ownerQName);
    this.parseFeatureRelationships(el, false);
    if (this.eat(';')) return;
    if (!this.expect('{')) return;
    this.parseMembers(el.id, el.qualifiedName);
    if (kind === 'state-def' || kind === 'action-def') this.prevRef = el.qualifiedName;
  }

  private parseUsage(kind: ElementKind, ownerId: string | undefined, ownerQName: string, isReference: boolean): void {
    this.next();
    if (this.peek().type !== 'ident') { this.error('expected-name', `expected ${kind} name`); return; }
    const el = this.makeElement(kind, this.next(), ownerId, ownerQName);
    el.isReference = isReference;
    if (this.eat(':')) {
      if (this.at('~')) { this.next(); el.isConjugate = true; }
      el.typeRef = this.parseQualifiedName();
    }
    if (kind === 'state' && this.at('parallel')) { this.next(); el.isParallel = true; }
    if (this.at('[')) el.multiplicity = this.parseMultiplicity();
    this.parseFeatureRelationships(el, true);
    if (this.at('{')) { this.next(); this.parseMembers(el.id, el.qualifiedName); }
    else if (this.eat('default')) { this.expect('='); el.defaultValue = this.captureStatement(); }
    else if (this.eat('=')) { el.defaultValue = this.captureStatement(); }
    else this.expect(';');
    if (kind === 'state' || kind === 'action') this.prevRef = el.qualifiedName;
  }

  private parseEnumDef(ownerId: string | undefined, ownerQName: string): void {
    this.next();
    this.next();
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected enumeration name'); return; }
    const el = this.makeElement('enum-def', this.next(), ownerId, ownerQName);
    this.parseFeatureRelationships(el, false);
    if (this.eat(';')) return;
    if (!this.expect('{')) return;
    while (this.peek().type !== 'eof' && !this.at('}')) {
      this.eat('enum');
      if (this.peek().type === 'ident') {
        this.makeElement('enum-literal', this.next(), el.id, el.qualifiedName);
        if (this.at('=')) { this.next(); this.skipToExpressionEnd(); }
      } else {
        this.error('unexpected-token', `unexpected '${this.peek().value}' in enumeration body`);
        this.next();
        continue;
      }
      this.expect(';');
    }
    this.eat('}');
  }

  private skipToExpressionEnd(): void {
    let depth = 0;
    while (this.peek().type !== 'eof') {
      if (this.at('(') || this.at('[')) depth++;
      if (this.at(')') || this.at(']')) depth--;
      if (depth <= 0 && (this.at(';') || this.at('}'))) return;
      this.next();
    }
  }

  private parseImport(ownerId: string | undefined, ownerQName: string): void {
    const kw = this.next();
    this.eat('all');
    const parts: string[] = [];
    let suffix = '';
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected import target'); return; }
    parts.push(this.next().value);
    while (this.at('::')) {
      this.next();
      if (this.at('*')) {
        this.next();
        suffix = this.at('*') ? (this.next(), '::**') : '::*';
        if (this.at('::')) {
          this.next();
          if (this.at('*')) {
            this.next();
            suffix += this.at('*') ? (this.next(), '::**') : '::*';
          }
        }
        break;
      }
      if (this.at('[')) { suffix = `::${this.captureBracket()}`; break; }
      if (this.peek().type === 'ident') { parts.push(this.next().value); continue; }
      this.error('expected-name', 'expected a name, * or [ after ::');
      break;
    }
    this.expect(';');
    const targetRef = parts.join('::') + suffix;
    const id = `import:${targetRef}#${this.importCounter++}`;
    addElement(this.model, {
      id, kind: 'import', name: parts[parts.length - 1]!, qualifiedName: id,
      ownerId, childIds: [], position: { line: kw.line, column: kw.column }, typeRef: targetRef,
    });
  }

  private parseDoc(ownerId: string | undefined): void {
    this.next();
    if (this.peek().type !== 'blockcomment') { this.error('expected-doc-body', 'expected /* ... */ after doc'); return; }
    this.addNote(ownerId, this.next().value, 'doc');
  }

  private parseComment(ownerId: string | undefined): void {
    this.next();
    if (this.peek().type === 'ident' && this.peek().value !== 'about' && this.peek(1).type === 'blockcomment') this.next();
    let targets: string[] = [];
    if (this.eat('about')) targets = this.parseNameList();
    if (this.peek().type !== 'blockcomment') { this.error('expected-comment-body', 'expected /* ... */ after comment'); return; }
    const body = this.next();
    if (targets.length === 0) this.addNote(ownerId, body.value, 'comment');
    else for (const ref of targets) {
      const id = this.lookup(ref);
      if (id) this.addNote(id, body.value, 'comment');
      else this.error('unresolved-reference', `comment about unknown element '${ref}'`, body);
    }
  }

  private parseDependency(_ownerQName: string): void {
    const kw = this.next();
    if (this.peek().type === 'ident' && !this.at('from') && this.peek(1).value === 'from') this.next();
    if (!this.expect('from')) return;
    const clients = this.parseNameList();
    if (!this.expect('to')) return;
    const suppliers = this.parseNameList();
    this.expect(';');
    for (const c of clients) for (const s of suppliers) this.addRelationship('dependency', c, s, kw);
  }

  private makeChild(kind: ElementKind, ownerId: string | undefined, ownerQName: string, name: string, typeRef?: string): Element {
    const base = ownerQName ? `${ownerQName}::${name}` : name;
    let id = base;
    let n = 0;
    while (this.model.elements.has(id)) id = `${base}#${++n}`;
    const el: Element = {
      id, kind, name, qualifiedName: id, ownerId, childIds: [],
      position: { line: this.peek().line, column: this.peek().column }, typeRef,
    };
    addElement(this.model, el);
    return el;
  }

  private parseShortName(): string | undefined {
    if (!this.at('<')) return undefined;
    const lt = this.next();
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected short name after <', lt); return undefined; }
    const name = this.next().value;
    this.expect('>');
    return name;
  }

  private parseRequirement(kind: ElementKind, ownerId: string | undefined, ownerQName: string): void {
    this.next();
    if (kind === 'requirement-def') this.next();
    const shortName = this.parseShortName();
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected requirement name'); return; }
    const el = this.makeElement(kind, this.next(), ownerId, ownerQName);
    el.shortName = shortName;
    if (this.eat(':')) el.typeRef = this.parseQualifiedName();
    this.parseFeatureRelationships(el, false);
    if (this.eat(';')) return;
    if (this.at('{')) { this.next(); this.parseMembers(el.id, el.qualifiedName); return; }
    this.error('expected-token', "expected ';' or '{'");
  }

  private parseSubject(ownerId: string | undefined, ownerQName: string): void {
    this.next();
    if (this.at('=')) {
      this.next();
      const chain = this.parseReference();
      this.makeChild('subject', ownerId, ownerQName, 'subject', chain);
      this.expect(';');
      return;
    }
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected subject name'); return; }
    const el = this.makeElement('subject', this.next(), ownerId, ownerQName);
    if (this.eat(':')) el.typeRef = this.parseQualifiedName();
    if (this.at('=')) { this.next(); el.typeRef = this.parseReference(); }
    this.expect(';');
  }

  private parseConstraint(keyword: string, ownerId: string | undefined, ownerQName: string): void {
    this.next();
    let name: string = keyword;
    let typeRef = '';
    if (this.at('constraint')) {
      this.next();
      if (this.peek().type === 'ident' && this.peek(1).value === '{') name = this.next().value;
      typeRef = this.captureBraceBlock();
      this.eat(';');
    } else {
      typeRef = this.parseReference();
      this.expect(';');
    }
    this.makeChild('constraint', ownerId, ownerQName, name, typeRef);
  }

  private captureBraceBlock(): string {
    if (!this.at('{')) return '';
    const parts: string[] = [];
    let depth = 0;
    let prev: Token | null = null;
    const isWord = (t: Token): boolean => t.type === 'ident' || t.type === 'number' || t.type === 'blockcomment';
    while (this.peek().type !== 'eof') {
      const t = this.next();
      if (t.value === '{') { depth++; parts.push('{'); prev = t; if (depth === 1) continue; continue; }
      if (t.value === '}') { depth--; parts.push('}'); prev = t; if (depth === 0) break; continue; }
      if (prev && isWord(prev) && isWord(t)) parts.push(' ');
      parts.push(t.type === 'blockcomment' ? `/* ${t.value} */` : t.value);
      prev = t;
    }
    return parts.join('');
  }

  private parseSatisfy(negated: boolean, ownerId?: string): void {
    const kw = this.next();
    let sourceRef: string;
    if (this.at('requirement')) {
      this.next();
      const shortName = this.parseShortName();
      if (this.peek().type !== 'ident') { this.error('expected-name', 'expected requirement name'); return; }
      const el = this.makeElement('requirement', this.next(), undefined, '');
      el.shortName = shortName;
      if (this.eat(':')) el.typeRef = this.parseQualifiedName();
      sourceRef = el.qualifiedName;
    } else {
      sourceRef = this.parseReference();
    }
    if (this.eat('by')) {
      const targetRef = this.parseReference();
      this.expect(';');
      this.addRelationship('satisfy', sourceRef, targetRef, kw, { negated });
      return;
    }
    // `satisfy <viewpoint>;` inside a view: the owner satisfies the reference.
    this.expect(';');
    if (ownerId) this.addRelationship('satisfy', ownerId, sourceRef, kw, { negated });
  }

  private parseVerify(ownerId: string | undefined): void {
    const kw = this.next();
    const targetRef = this.parseReference();
    this.expect(';');
    if (ownerId) this.addRelationship('verify', ownerId, targetRef, kw);
  }

  private parseConnect(): void {
    const kw = this.next();
    if (this.at('(')) {
      const ends = this.parseConnectorList();
      this.expect(';');
      for (let i = 1; i < ends.length; i++) this.addRelationship('connect', ends[0]!, ends[i]!, kw, { connector: 'connect' });
      return;
    }
    const sourceRef = this.parseReference();
    if (!this.expect('to')) return;
    const targetRef = this.parseReference();
    this.expect(';');
    this.addRelationship('connect', sourceRef, targetRef, kw, { connector: 'connect' });
  }

  private parseConnectorList(): string[] {
    const ends: string[] = [];
    this.expect('(');
    if (!this.at(')')) {
      do {
        const ref = this.parseReference();
        if (ref) ends.push(ref);
      } while (this.eat(','));
    }
    this.expect(')');
    return ends;
  }

  private parseInterface(): void {
    const kw = this.next();
    if (this.peek().type === 'ident' && this.peek(1).value === ':') this.next();
    if (this.eat(':')) this.parseQualifiedName();
    this.eat('connect');
    if (this.at('(')) {
      const ends = this.parseConnectorList();
      this.expect(';');
      for (let i = 1; i < ends.length; i++) this.addRelationship('connect', ends[0]!, ends[i]!, kw, { connector: 'interface' });
      return;
    }
    const sourceRef = this.parseReference();
    if (!this.expect('to')) return;
    const targetRef = this.parseReference();
    this.expect(';');
    this.addRelationship('connect', sourceRef, targetRef, kw, { connector: 'interface' });
  }

  private parseBind(): void {
    const kw = this.next();
    const sourceRef = this.parseReference();
    if (!this.expect('=')) return;
    const targetRef = this.parseReference();
    this.expect(';');
    this.addRelationship('bind', sourceRef, targetRef, kw, { connector: 'bind' });
  }

  private isStateOwner(ownerId: string | undefined): boolean {
    const k = ownerId ? this.model.elements.get(ownerId)?.kind : undefined;
    return k === 'state' || k === 'state-def';
  }

  private parseFirstThen(ownerId: string | undefined): void {
    const t = this.next();
    const isState = this.isStateOwner(ownerId);

    if (t.value === 'then') {
      // `then X;` — succession/transition from the previous node to X.
      const targetRef = this.parseReference();
      this.expect(';');
      const sourceRef = this.prevRef ?? 'start';
      this.addRelationship(isState ? 'transition' : 'succession', sourceRef, targetRef, t);
      this.prevRef = targetRef;
      return;
    }

    // `first <src> [<mods>] then <dst>;` or `first <src>;`
    const sourceRef = this.parseReference();
    const mods: string[] = [];
    while (this.peek().type !== 'eof' && !this.at('then') && !this.at(';') && !this.at('}')) mods.push(this.next().value);
    if (this.eat('then')) {
      const targetRef = this.parseReference();
      this.expect(';');
      this.addRelationship(isState ? 'transition' : 'succession', sourceRef, targetRef, t, mods.length ? { label: mods.join(' ') } : {});
      this.prevRef = targetRef;
    } else {
      this.expect(';');
      if (sourceRef !== 'start') this.addRelationship('succession', 'start', sourceRef, t);
      this.prevRef = sourceRef;
    }
  }

  private parseTransition(): void {
    const kw = this.next();
    if (this.peek().type === 'ident' && this.peek().value !== 'first') this.next();
    if (!this.at('first')) { this.error('expected-token', "expected 'first' in transition"); return; }
    this.next();
    const sourceRef = this.parseReference();
    const mods: string[] = [];
    while (this.peek().type !== 'eof' && !this.at('then') && !this.at(';') && !this.at('}')) mods.push(this.next().value);
    if (!this.eat('then')) { this.error('expected-token', "expected 'then' in transition"); return; }
    const targetRef = this.parseReference();
    this.expect(';');
    this.addRelationship('transition', sourceRef, targetRef, kw, mods.length ? { label: mods.join(' ') } : {});
    this.prevRef = targetRef;
  }

  private parseStateAction(keyword: string, ownerId: string | undefined, ownerQName: string): void {
    this.next();
    const raw = this.captureStatement();
    this.makeChild('statement', ownerId, ownerQName, keyword, raw);
  }

  private parseFlow(): void {
    this.next();
    this.parseFlowBody();
  }

  private parseFlowBody(): void {
    const t = this.peek();
    let payload = '';
    if (this.eat('of')) payload = this.parseReference();
    if (!this.expect('from')) return;
    const sourceRef = this.parseReference();
    if (!this.expect('to')) return;
    const targetRef = this.parseReference();
    this.expect(';');
    this.addRelationship('flow', sourceRef, targetRef, t, payload ? { label: payload } : {});
  }

  private parseIf(ownerId: string | undefined, ownerQName: string): void {
    const kw = this.next();
    const condition = this.captureUntil('then');
    if (this.eat('then')) {
      const ref = this.parseReference();
      this.expect(';');
      this.addRelationship('succession', this.prevRef ?? 'start', ref, kw, { label: condition ? `if ${condition}` : 'if' });
      this.prevRef = ref;
      return;
    }
    this.expect(';');
    this.makeChild('statement', ownerId, ownerQName, 'if', condition);
  }

  private parseElse(): void {
    const kw = this.next();
    const ref = this.parseReference();
    this.expect(';');
    this.addRelationship('succession', this.prevRef ?? 'start', ref, kw, { label: 'else' });
    this.prevRef = ref;
  }

  private captureUntil(stop: string): string {
    const parts: string[] = [];
    let prev: Token | null = null;
    const isWord = (t: Token): boolean => t.type === 'ident' || t.type === 'number' || t.type === 'blockcomment';
    while (this.peek().type !== 'eof' && !this.at(stop) && !this.at(';') && !this.at('}')) {
      const t = this.next();
      if (prev && isWord(prev) && isWord(t)) parts.push(' ');
      parts.push(t.type === 'blockcomment' ? `/* ${t.value} */` : t.value);
      prev = t;
    }
    return parts.join('');
  }

  private captureBalanced(): string {
    const parts: string[] = [];
    let depth = 0;
    let prev: Token | null = null;
    const isWord = (t: Token): boolean => t.type === 'ident' || t.type === 'number' || t.type === 'blockcomment';
    while (this.peek().type !== 'eof') {
      const t = this.next();
      if (t.value === '{') { depth++; parts.push('{'); prev = t; continue; }
      if (t.value === '}') { depth--; parts.push('}'); prev = t; continue; }
      if (t.value === ';' && depth <= 0) break;
      if (prev && isWord(prev) && isWord(t)) parts.push(' ');
      parts.push(t.type === 'blockcomment' ? `/* ${t.value} */` : t.value);
      prev = t;
    }
    return parts.join('');
  }

  private captureBracket(): string {
    if (!this.at('[')) return '';
    const parts: string[] = [];
    let depth = 0;
    let prev: Token | null = null;
    const isWord = (t: Token): boolean => t.type === 'ident' || t.type === 'number';
    while (this.peek().type !== 'eof') {
      const t = this.next();
      if (t.value === '[') { depth++; parts.push('['); prev = t; continue; }
      if (t.value === ']') { depth--; parts.push(']'); if (depth === 0) break; prev = t; continue; }
      if (prev && isWord(prev) && isWord(t)) parts.push(' ');
      parts.push(t.value);
      prev = t;
    }
    return parts.join('');
  }

  private parsePerform(ownerId: string | undefined): void {
    const kw = this.next();
    this.eat('action');
    const targetRef = this.parseReference();
    this.expect(';');
    if (ownerId) this.addRelationship('perform', ownerId, targetRef, kw);
  }

  private parseParam(dir: string, ownerId: string | undefined, ownerQName: string): void {
    this.next();
    let kind: ElementKind = 'attribute';
    if (this.peek().type === 'ident' && ['port', 'item', 'part', 'attribute'].includes(this.peek().value)) {
      const word = this.next().value;
      kind = word === 'port' ? 'port' : word === 'item' ? 'item' : word === 'part' ? 'part' : 'attribute';
    }
    const isRef = this.eat('ref');
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected parameter name'); return; }
    const el = this.makeElement(kind, this.next(), ownerId, ownerQName);
    el.direction = dir as Element['direction'];
    if (isRef) el.isReference = true;
    if (this.eat(':')) el.typeRef = this.parseQualifiedName();
    el.name = `${dir} ${el.name}`;
    if (this.eat('default')) { this.expect('='); el.defaultValue = this.captureStatement(); }
    else if (this.eat('=')) { el.defaultValue = this.captureStatement(); }
    else this.expect(';');
  }

  private parseAlias(ownerId: string | undefined, ownerQName: string): void {
    this.next();
    const short = this.parseShortName();
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected an alias name'); return; }
    const nameTok = this.next();
    if (!this.expect('for')) return;
    const ref = this.parseQualifiedName();
    this.expect(';');
    const el = this.makeElement('alias', nameTok, ownerId, ownerQName);
    el.shortName = short;
    el.typeRef = ref;
  }

  private parseAllocate(): void {
    const kw = this.next();
    const a = this.parseReference();
    if (!this.expect('to')) return;
    const b = this.parseReference();
    this.expect(';');
    this.addRelationship('allocate', a, b, kw);
  }

  private parseAllocation(): void {
    const kw = this.next();
    if (this.at('def')) { this.error('unsupported-construct', "'allocation def' is not supported"); this.skipToStatementEnd(); return; }
    if (this.peek().type === 'ident' && this.peek(1).value !== 'allocate') {
      this.next();
      if (this.eat(':')) this.parseQualifiedName();
    }
    if (!this.at('allocate')) { this.error('expected-token', "expected 'allocate'"); return; }
    this.next();
    const a = this.parseReference();
    if (!this.expect('to')) return;
    const b = this.parseReference();
    this.expect(';');
    this.addRelationship('allocate', a, b, kw);
  }

  private parseConnectionUsage(): void {
    const kw = this.next();
    if (this.peek().type === 'ident' && this.peek(1).value !== 'connect' && this.peek(1).value !== ':') this.next();
    if (this.eat(':')) this.parseQualifiedName();
    this.eat('connect');
    if (this.at('(')) {
      const ends = this.parseConnectorList();
      this.expect(';');
      for (let i = 1; i < ends.length; i++) this.addRelationship('connect', ends[0]!, ends[i]!, kw, { connector: 'connect' });
      return;
    }
    const a = this.parseReference();
    if (!this.expect('to')) return;
    const b = this.parseReference();
    this.expect(';');
    this.addRelationship('connect', a, b, kw, { connector: 'connect' });
  }

  private parseEnd(ownerId: string | undefined, ownerQName: string): void {
    this.next();
    if (this.at('[')) this.parseMultiplicity();
    if (this.peek().type === 'ident' && ['part', 'item', 'port'].includes(this.peek().value)) this.next();
    this.eat('ref');
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected an end name'); return; }
    const el = this.makeElement('end', this.next(), ownerId, ownerQName);
    if (this.eat(':')) el.typeRef = this.parseQualifiedName();
    if (this.at('::>')) { this.next(); this.parseQualifiedName(); }
    this.expect(';');
  }

  private parseRawStatement(keyword: string, ownerId: string | undefined, ownerQName: string): void {
    this.next();
    const raw = this.captureStatement();
    const el = this.makeChild('statement', ownerId, ownerQName, keyword, raw);
    this.prevRef = el.qualifiedName;
  }

  private captureStatement(): string {
    const parts: string[] = [];
    let prev: Token | null = null;
    const isWord = (t: Token): boolean => t.type === 'ident' || t.type === 'number' || t.type === 'blockcomment';
    while (this.peek().type !== 'eof' && !this.at(';') && !this.at('}')) {
      const t = this.next();
      if (prev && isWord(prev) && isWord(t)) parts.push(' ');
      parts.push(t.type === 'blockcomment' ? `/* ${t.value} */` : t.value);
      prev = t;
    }
    this.eat(';');
    return parts.join('');
  }

  private parseViewLike(kind: ElementKind, ownerId: string | undefined, ownerQName: string): void {
    this.next();
    if (kind === 'view-def' || kind === 'viewpoint-def') this.next();
    if (this.peek().type !== 'ident') { this.error('expected-name', `expected ${kind} name`); return; }
    const el = this.makeElement(kind, this.next(), ownerId, ownerQName);
    if (this.eat(':')) el.typeRef = this.parseQualifiedName();
    this.parseFeatureRelationships(el, false);
    if (this.eat(';')) return;
    if (this.at('{')) { this.next(); this.parseMembers(el.id, el.qualifiedName); return; }
    this.error('expected-token', "expected ';' or '{'");
  }

  private parseExpose(ownerId: string | undefined): void {
    this.next();
    let ref = '';
    if (this.peek().type === 'ident') ref = this.next().value;
    else { this.error('expected-name', 'expected an expose target'); return; }
    let namespace = false;
    let recursive = false;
    while (this.at('::')) {
      this.next();
      if (this.at('*')) {
        this.next();
        if (this.at('*')) { this.next(); recursive = true; }
        else namespace = true;
        continue;
      }
      if (this.peek().type === 'ident') { ref += `::${this.next().value}`; continue; }
      this.error('expected-name', 'expected a name or * after ::');
      break;
    }
    this.expect(';');
    const owner = ownerId ? this.model.elements.get(ownerId) : undefined;
    if (owner) owner.exposes = [...(owner.exposes ?? []), { ref, namespace, recursive }];
  }

  private parseFilter(ownerId: string | undefined): void {
    this.next();
    const names: string[] = [];
    for (;;) {
      this.expect('@');
      if (this.peek().type === 'ident') names.push(this.next().value);
      else { this.error('expected-name', 'expected a metadata name after @'); break; }
      if (this.eat('and')) continue;
      break;
    }
    this.expect(';');
    const owner = ownerId ? this.model.elements.get(ownerId) : undefined;
    if (owner) owner.filters = [...(owner.filters ?? []), ...names];
  }

  private parseRender(ownerId: string | undefined): void {
    this.next();
    const name = this.peek().type === 'ident' ? this.next().value : '';
    if (!name) this.error('expected-name', 'expected a rendering name');
    this.expect(';');
    const owner = ownerId ? this.model.elements.get(ownerId) : undefined;
    if (owner && name) owner.render = name;
  }

  private parseBinding(): void {
    const kw = this.next();
    if (this.peek().type === 'ident' && this.peek().value !== 'bind') this.next();
    if (this.eat(':')) this.parseQualifiedName();
    if (!this.eat('bind')) { this.error('expected-token', "expected 'bind'"); return; }
    const a = this.parseReference();
    if (!this.expect('=')) return;
    const b = this.parseReference();
    this.expect(';');
    this.addRelationship('bind', a, b, kw, { connector: 'bind' });
  }

  private parseRole(kind: ElementKind, ownerId: string | undefined, ownerQName: string): void {
    this.next();
    if (this.peek().type !== 'ident') { this.error('expected-name', `expected ${kind} name`); return; }
    const el = this.makeElement(kind, this.next(), ownerId, ownerQName);
    if (this.eat(':')) el.typeRef = this.parseQualifiedName();
    this.expect(';');
  }

  private parseFrame(ownerId: string | undefined): void {
    this.next();
    const ref = this.parseQualifiedName();
    this.expect(';');
    const owner = ownerId ? this.model.elements.get(ownerId) : undefined;
    if (owner && ref) owner.frames = [...(owner.frames ?? []), ref];
  }

  private parseExhibit(ownerId: string | undefined, ownerQName: string): void {
    const kw = this.next();
    if (this.peek().type === 'ident' && EXHIBIT_KINDS.has(this.peek().value) && this.peek(1).type === 'ident') {
      const kind = this.next().value as ElementKind;
      const el = this.makeElement(kind, this.next(), ownerId, ownerQName);
      if (this.eat(':')) el.typeRef = this.parseQualifiedName();
      this.expect(';');
      return;
    }
    const ref = this.parseReference();
    this.expect(';');
    if (ownerId) this.addRelationship('exhibit', ownerId, ref, kw);
  }

  private parseGeneric(keyword: string, ownerId: string | undefined, ownerQName: string): void {
    this.next();
    if (this.at('def')) this.next();
    if (this.peek().type !== 'ident') { this.error('expected-name', `expected ${keyword} name`); return; }
    const el = this.makeElement('other', this.next(), ownerId, ownerQName);
    el.keyword = keyword;
    if (this.eat(':')) el.typeRef = this.parseQualifiedName();
    this.parseFeatureRelationships(el, false);
    if (this.eat(';')) return;
    if (this.at('{')) { this.next(); this.parseMembers(el.id, el.qualifiedName); return; }
    this.error('expected-token', "expected ';' or '{'");
  }

  private parseReference(): string {
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected reference'); return ''; }
    let ref = this.next().value;
    while (this.at('::') || this.at('.')) {
      const sep = this.next().value;
      if (this.peek().type === 'ident') ref += sep + this.next().value;
      else { this.error('expected-name', `expected name after ${sep}`); break; }
    }
    return ref;
  }

  private parseFeatureRelationships(el: Element, isFeature: boolean): void {
    for (;;) {
      const t = this.peek();
      let op: string | undefined;
      if (t.type === 'punct' && (t.value === ':>' || t.value === ':>>')) op = t.value;
      else if (t.type === 'ident' && (t.value === 'specializes' || t.value === 'subsets' || t.value === 'redefines')) op = t.value;
      if (!op) return;
      this.next();
      const kind: RelationshipKind = (op === ':>>' || op === 'redefines') ? 'redefine' : (isFeature ? 'subset' : 'specialization');
      do {
        const ref = this.parseQualifiedName();
        if (ref) this.addRelationship(kind, el.qualifiedName, ref, t);
      } while (this.eat(','));
    }
  }

  private parseQualifiedName(): string {
    if (this.peek().type !== 'ident') { this.error('expected-name', 'expected name'); return ''; }
    const parts = [this.next().value];
    while (this.at('::')) {
      this.next();
      if (this.peek().type === 'ident') parts.push(this.next().value);
      else { this.error('expected-name', 'expected name after ::'); break; }
    }
    return parts.join('::');
  }

  private parseNameList(): string[] {
    const names: string[] = [];
    do {
      const ref = this.parseQualifiedName();
      if (ref) names.push(ref);
    } while (this.eat(','));
    return names;
  }

  private parseMultiplicity(): Multiplicity {
    this.expect('[');
    const readBound = (): string | undefined => {
      if (this.eat('*')) return '*';
      if (this.peek().type === 'number') return this.next().value;
      this.error('expected-bound', 'expected a multiplicity bound');
      return undefined;
    };
    const first = readBound();
    let lower = first;
    let upper = first;
    if (this.at('..')) { this.next(); lower = first; upper = readBound(); }
    this.expect(']');
    if (lower === undefined) return {};
    return { lower, upper };
  }

  private addRelationship(
    kind: RelationshipKind,
    sourceRef: string,
    targetRef: string,
    t: Token,
    opts: { connector?: 'connect' | 'interface' | 'bind'; negated?: boolean; label?: string } = {},
  ): void {
    this.model.relationships.push({
      id: `rel:${this.relCounter++}`, kind, sourceRef, targetRef,
      position: { line: t.line, column: t.column },
      ...(opts.connector ? { connector: opts.connector } : {}),
      ...(opts.negated ? { negated: true } : {}),
      ...(opts.label ? { label: opts.label } : {}),
    });
  }

  private addNote(targetId: string | undefined, text: string, field: 'doc' | 'comment'): void {
    if (!targetId) return;
    const el = this.model.elements.get(targetId);
    if (!el) return;
    const existing = el[field];
    el[field] = existing ? `${existing}\n${text}` : text;
  }

  private lookup(ref: string): string | undefined {
    if (this.model.elements.has(ref)) return ref;
    const simple = ref.split('::').pop();
    for (const el of this.model.elements.values()) if (el.name === simple) return el.id;
    return undefined;
  }
}

export function parseSysml(source: string): SysmlModel {
  return new Parser(source).parse();
}
