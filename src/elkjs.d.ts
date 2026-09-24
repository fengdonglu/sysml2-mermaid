declare module 'elkjs/lib/elk.bundled.js' {
  const ELK: new () => { layout(graph: unknown): Promise<any> };
  export default ELK;
}
