export default [
  {
    id: 'parts-composition',
    title: '块、组合与泛化',
    sample: 'zh/01-parts-composition.sysml',
    explanation: 'part def 是块。嵌套的 part usage 是复合关联（实心菱形）；ref part 是普通关联；":>" 是泛化（空心三角）；"dependency" 是弱依赖。',
  },
  {
    id: 'requirements',
    title: '需求与满足',
    sample: 'zh/02-requirements.sysml',
    explanation: '需求带有 id（短名）、正文（doc）、主体（subject）与 require/assume 约束。"satisfy R by X" 画出从 X 指向需求的箭头；嵌套需求是包含关系。',
  },
  {
    id: 'ibd-connectors',
    title: '内部块图：端口与连接器',
    sample: 'zh/03-ibd-connectors.sysml',
    explanation: '部件把端口画在边框上；"connect a.p to b.q" 把它们连起来。定义在 part def 上的端口会被它的每个 usage 继承。',
  },
  {
    id: 'state-machine',
    title: '状态机',
    sample: 'zh/04-state-machine.sysml',
    explanation: '状态、嵌套状态、entry 动作，以及带触发（accept）、守卫（if）、效果（do）的转移。初始伪状态来自空的 entry 动作 / "first initial then ..." 转移。',
  },
  {
    id: 'activity',
    title: '活动图：控制流与对象流',
    sample: 'zh/05-activity.sysml',
    explanation: '带 in/out 参数的动作、接续（"first A then B"），以及承载载荷的对象流。"first start then X" 会加上一个初始节点。',
  },
  {
    id: 'swimlane',
    title: '由 perform 派生的泳道',
    sample: 'zh/06-swimlane.sysml',
    explanation: 'SysML v2 没有 swimlane 关键字：某个 part 执行某动作，就把该动作归入这个 part 的泳道。这里 chef 执行 boil，sink 执行 drain。',
  },
  {
    id: 'view-selection',
    title: '视图、元数据与过滤',
    sample: 'zh/07-view-selection.sysml',
    explanation: 'view 决定一张图显示哪些元素。这里 view def 特化 GeneralView（于是是一张 BDD），并过滤出带 #Safety 标注的元素；abstract 块以斜体渲染。',
  },
  {
    id: 'constructs',
    title: '项、别名、分配、连接',
    sample: 'zh/08-constructs.sysml',
    explanation: '更多 SysML v2 构造巡览：item def/usage、alias（Car 的 engine 由别名 eng 类型化）、allocate 边（虚线），以及带 end 特征的 connection/interface 定义。',
  },
  {
    id: 'control-flow',
    title: '活动控制流',
    sample: 'zh/09-control-flow.sysml',
    explanation: '控制节点与带标签的接续：声明的 merge 节点，以及 "if … then …;" / "else …;" 分支（画成从前一节点出发的边）。',
  },
  {
    id: 'requirement-roles',
    title: '需求角色与满足',
    sample: 'zh/10-requirement-roles.sysml',
    explanation: '带有主体、stakeholder、actor 与约束的需求；"satisfy R by X" 把箭头从满足方画向需求，"verify" 则从验证画回需求。',
  },
];
