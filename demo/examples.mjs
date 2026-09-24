export default [
  {
    id: 'parts-composition',
    title: 'Blocks, composition, and generalization',
    sample: '01-parts-composition.sysml',
    explanation: 'A part def is a block. Nested part usages are composite associations (filled diamond); a ref part is a plain association; ":>" is generalization (hollow triangle); "dependency" is a weak link.',
  },
  {
    id: 'requirements',
    title: 'Requirements and satisfaction',
    sample: '02-requirements.sysml',
    explanation: 'Requirements carry an id (short name), text (doc), a subject, and require/assume constraints. "satisfy R by X" draws an arrow from X to the requirement; nested requirements are containment.',
  },
  {
    id: 'ibd-connectors',
    title: 'Internal Block Diagram: ports and connectors',
    sample: '03-ibd-connectors.sysml',
    explanation: 'Parts show their ports on the border; "connect a.p to b.q" wires them. A port declared on a part def is inherited by every usage of it.',
  },
  {
    id: 'state-machine',
    title: 'State machine',
    sample: '04-state-machine.sysml',
    explanation: 'States, nested states, entry actions, and transitions with a trigger (accept), guard (if) and effect (do). The initial pseudo-state comes from an empty entry action / a "first initial then ..." transition.',
  },
  {
    id: 'activity',
    title: 'Activity: control flow and object flow',
    sample: '05-activity.sysml',
    explanation: 'Actions with in/out parameters, successions ("first A then B"), and an object flow carrying a payload. "first start then X" adds an initial node.',
  },
  {
    id: 'swimlane',
    title: 'Swimlanes from perform',
    sample: '06-swimlane.sysml',
    explanation: 'SysML v2 has no swimlane keyword: a part performing an action groups that action into the part\u2019s lane. Here chef performs boil and sink performs drain.',
  },
  {
    id: 'view-selection',
    title: 'Views, metadata and filtering',
    sample: '07-view-selection.sysml',
    explanation: 'A view selects which elements a diagram shows. Here a view def specializes GeneralView (making it a BDD) and filters to elements annotated with #Safety; abstract blocks are drawn in italics.',
  },
  {
    id: 'constructs',
    title: 'Items, aliases, allocations, connections',
    sample: '08-constructs.sysml',
    explanation: 'A tour of more SysML v2 constructs: item def/usage, alias (Car\u2019s engine is typed by the alias `eng`), an allocate edge (dashed), and connection/interface definitions with end features.',
  },
  {
    id: 'control-flow',
    title: 'Activity control flow',
    sample: '09-control-flow.sysml',
    explanation: 'Control nodes and labelled successions: a declared merge node, and `if … then …;` / `else …;` branches drawn as edges from the previous node.',
  },
  {
    id: 'requirement-roles',
    title: 'Requirement roles and satisfaction',
    sample: '10-requirement-roles.sysml',
    explanation: 'A requirement with a subject, stakeholder, actor and constraint; `satisfy R by X` draws the arrow from the satisfying part to the requirement, and `verify` points from the verification back to the requirement.',
  },
];
