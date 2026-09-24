# SysML 语法

[English](sysml-syntax.md) | 中文

本页逐条列出 `sysml2-mermaid` 当前能理解的 `.sysml` 子集。它遵循真实的 SysML v2 文本记法，但刻意保持很小；解析器从不抛异常，子集之外的写法一律以带位置的诊断报告。未列出的内容都属于[不支持项](#不支持项)。

## 标记行

首行可以是裸标记 `sysml`，并在同一行后接一个视图名：

```sysml
sysml bdd
```

合法视图名为 `bdd`、`requirement`、`ibd`、`statemachine` 与 `activity`。标记行会被解析器消费并忽略（它不属于模型）。未给出视图名时使用 **BDD** 视图。标记行对库与 CLI 是**可选**的，但 [Mermaid 插件](mermaid-plugin.zh.md)要求源以 `sysml` 开头。

## 词法规则

- **标识符**：不加引号（`[A-Za-z_][A-Za-z0-9_]*`）或用单引号包裹（`'My Package'`，允许空格）。
- **限定名**用 `::`，例如 `Parts::Engine`。
- **特征链**用 `.`，例如 `tank.tankPort`。
- **行注释**以 `//` 开头，直到行末；会被忽略。
- **块注释** `/* ... */` 供 `doc` 与 `comment` 使用（见下）。单独出现的块注释会成为所属元素上的注释。
- **语句**以 `;` 结束；主体用 `{ ... }` 包裹。除此之外空白不敏感。
- 每个词元都携带从 1 开始的行列位置，供诊断使用。

## 包与导入

```sysml
package 'My Package' {
    private import ScalarValues::*;
    public import Parts::Engine;
    import Other::Name;
}
package V;
```

- `package Name { ... }`（带主体）或 `package Name;`（空）。
- 命名空间名可以加引号。
- 导入形式为 `import Q::*;` 或 `import Q::Name;`，前面可选带 `private` 或 `public`。
- 导入只是**被解析，不会被加载**：不捆绑任何外部或内建库。名称只有在同一文件内定义时才能解析；否则退化为 `«unresolved»` 占位节点并给出警告。

## 部件、属性、端口与枚举

```sysml
enum def Color { red; green; blue; }

attribute def Mass;
port def FuelPort;

part def Engine {
    attribute power : Real;
    port fuelPort : FuelPort;
}

part engine : Engine;          // usage，由所在定义拥有
part spare : Engine[2];        // 带多重度的 usage
ref part operator : Person;    // 引用特征（非复合）
```

| 构造 | 语法 |
| --- | --- |
| 部件定义 | `part def Name;`、`part def Name :> Super { ... }` |
| 部件 usage | `part name : Type;`、`part name : Type[mult];` |
| 引用特征 | `ref part name : Type;` |
| 属性 | `attribute def Name;`、`attribute name : Type;` |
| 端口 | `port def Name;`、`port name : Type;` |
| 枚举 | `enum def Name { lit; lit; ... }` |

枚举主体以 `;` 分隔字面量；字面量前的 `enum` 关键字会被接受并忽略。定义内的 `part` usage 是复合特征（块拥有它）；`ref part` 标记非复合引用。

## 泛化、复合与关系

运算符 `:>`（以及关键字 `specializes`）是重载的：在**定义**上是子分类（泛化）；在 **usage** 上是特征子集化。`:>>`（以及 `redefines`）只用于特征重定义。

```sysml
part def PowerSource;
part def Engine :> PowerSource { }
part def Car specializes Vehicle { }

part def Vehicle {
    part engine : Engine;        // 复合关联
    ref part operator : Person;  // 普通关联
}
part def Car :> Vehicle {
    part engine : Engine :>> engine;       // 重定义继承来的特征
    part wheels : Wheel[4] subsets parts;  // 子集化继承来的特征
}

dependency from Car to Engine;              // 无名依赖
dependency Use from Car to Engine;          // 具名依赖（名字在 `from` 之前）
dependency from Car, Truck to Engine;       // 两侧都可用逗号列表
```

| 模型事实 | 边 | 记法 |
| --- | --- | --- |
| `part def A :> B` / `part def A specializes B` | `specialization` | 实线，`B` 端空心三角 |
| 在 `A` 中拥有的 `part p : T` | `composition` | 实线，`A` 端实心菱形 |
| 在 `A` 中拥有的 `ref part p : T` | `reference` | 实线，`T` 端开口箭头 |
| 特征 `part p : T :> q` / `subsets q` | `subset` | 拥有块之间的虚线，标注 `subsets q` |
| 特征 `part p : T :>> q` / `redefines q` | `redefine` | 拥有块之间的虚线，标注 `redefines q` |
| `dependency [Name] from A to B` | `dependency` | 虚线，`B` 端开口箭头 |

usage 上的多重度（如 `[2]`）会画作边标签。无法解析的类型会成为 `«unresolved»` 占位节点并给出警告。

## 需求

```sysml
requirement def <'1'> MassLimitation :> BaseRequirement {
    doc /* The total mass of a vehicle shall not exceed the limit. */
    subject vehicle : Vehicle;
    require constraint { vehicle.mass <= limit }
    assume constraint { vehicle.fuelMass > 0 }
    require fuelLimit;                 // 引用形式
    requirement Child;                 // 嵌套需求（包含）
}

requirement <'UR1.1'> Load : MassLimitation {
    requirement Passengers;
}

satisfy MassLimitation by VehicleDesign;
assert satisfy engineSpecification by VehicleDesign;
assert not satisfy req1 by q;
verify Load;
```

- **短名** `<'id'>` 可置于声明名之前；它成为需求 id，并显示为 `Id:` 行。
- `subject name : Type;` 声明需求主体。
- `require constraint { ... }`、`assume constraint { ... }`，或引用形式 `require refName;` / `assume refName;`，成为约束行。
- `doc /* ... */` 设置需求文本（显示为注释框）。
- 在另一需求内嵌套 `requirement` 即**包含**（一条 `contain` 边）。
- `[assert] [not] satisfy <req> by <usage>;` 画一条 `satisfy` 边；`not` 标记为取反（标注 `not`）。
- `verify <req>;` 从所属元素画一条 `verify` 边。
- `dependency` 与 BDD 视图中一致。

## 端口与连接器（IBD）

```sysml
package Powertrain {
    port def FuelPort;
    part def FuelTank { port tankPort : FuelPort; }
    part def Engine { port enginePort : FuelPort; }
    part def Vehicle {
        part tank : FuelTank;
        part eng : Engine;
        connect tank.tankPort to eng.enginePort;
        interface : FuelPort connect tank.tankPort to eng.enginePort;
        bind tank.tankPort = eng.enginePort;
    }
}
```

- `connect <chain> to <chain>;` —— 实线连接器。
- `interface [name] [: Type] connect <chain> to <chain>;` 与 `interface <chain> to <chain>;` —— 虚线连接器。
- `bind <chain> = <chain>;` —— 点线连接器。
- **特征链**是以 `.` 分隔的路径（`a.b.c`）。每个端点解析为所属部件加端口名；在部件类型上声明的端口会被该类型的每个 usage 继承。
- IBD 视图显示模型中的每个 `part` usage，各自带上其端口。

## 状态机

```sysml
state def DoorStates;

state door : DoorStates {
    state closed;
    state opened;
    entry action initial;
    do providePower;
    exit applyBrake;
    transition open first closed accept OpenSignal if ready do startEngine then opened;
    first start then closed;      // 初始伪状态 → closed
    closed then opened;           // 源 then 目标
}

state running parallel { state a; state b; }
```

- `state def Name;` / `state def Name { ... }` 与 `state name;` / `state name : Type { ... }`；状态可嵌套。
- `entry`、`do`、`exit` 把其原始动作文本捕获为行（`entry action selfTest;`、`do providePower;` 等）。
- 状态名（及其可选类型）后的 `parallel` 把该状态标记为并行区域。
- 转移形式为 `transition [name] first <source> [trigger] [guard] [effect] then <target>;`，`first` 与 `then` 之间的触发/卫/效果文本保留为边标签。
- `first <source> then <target>;` 与（状态内的）`<source> then <target>;` 是转移简写。允许自转移。
- 单独的 `then <target>;` 从上一个节点（体内最后命名的状态/动作）继续；若位于体内开头，则从 `start` 继续。
- 源为 `initial` / `start`、目标为 `done` / `terminate` 的名称会生成 `«initial»` 与 `«final»` 伪状态。这些是约定，不是关键字。

## 活动

```sysml
action def Boil { in water : Water; out pasta : Pasta; }
action boil : Boil;
action drain;

first start then boil;          // 初始节点 + 接续
boil then drain;                // 二元接续
flow of Pasta from boil to drain;
flow from boil to drain;

part def Cook;
part chef : Cook { perform boil; }   // 泳道归属

first start then decide;        // 控制节点，在接续中按名称引用
decide then boil;

accept signal; send new Msg() to target; assign x := 0; terminate;
```

- `action def Name { ... }` 与 `action name : Type;`；`in` / `out` / `inout` 参数成为行。
- `first start then <a>;` 从隐式 `start` 节点开始。
- `<a> then <b>;`（以及 `first <a> then <b>;`）是接续。
- `flow [of <payload>] from <a> to <b>;` 是对象流；载荷作为边标签。
- 部件内的 `perform [action] <ref>;` 表示该部件执行该动作；只要存在任何 `perform`，动作就会按执行它的部件分组进**泳道**。
- 控制节点在作为接续端点时**按名称**识别：`start`（初始）、`decide` / `merge`（判定菱形）、`fork` / `join`（粗条）。它们是普通引用，不是关键字。
- `accept`、`send`、`assign`、`terminate` 语句被捕获为原始文本，并渲染为动作节点。

## 文档与注释

```sysml
doc /* The engine provides power. */
comment /* A general note. */
comment about Engine /* Refers to a named element. */
```

- `doc /* ... */` 把文本附着到所属元素（渲染为注释框）。
- `comment /* ... */` 在未给出目标时附着到所属元素。
- `comment about Name /* ... */` 附着到指定元素；目标未知会报告 `unresolved-reference` 错误。

## 视图与视点

`view` / `viewpoint` 的一个子集用于选择**一张图显示哪些元素**。`view` **不**指定图类型；图类型来自其定义的标准基类，`expose` / `filter` 限制元素范围。

```sysml
viewpoint def SystemStructurePerspective;

view def StructureView :> GeneralView {
    filter @Structure;
    render asTreeDiagram;
}

view vehicleView : StructureView {
    expose Vehicle::*;
}
```

- `viewpoint def N { ... }` / `viewpoint n : Def;` —— 视点（体按需求文本解析；`frame` / `concern` 语义不求值）。
- `view def N [:> Base] { ... }` / `view n : Def { ... }`。
- `expose <ref>;`、`expose <ref>::*;`、`expose <ref>::**;` —— 限定到子树（`*` 为直接成员，`**` 为递归）。
- `filter @Name;` / `filter @A and @B;` —— 仅保留带相应元数据标注的元素（见下）。
- `render <name>;` —— 记录渲染用法名（不作解释）。
- **图类型映射**（沿定义的特化链）：`GeneralView` → BDD、`InterconnectionView` → IBD、`ActionFlowView` → 活动图、`StateTransitionView` → 状态机、`RequirementView`（本项目扩展）→ 需求图。直接写 `bdd` / `ibd` / `activity` / `statemachine` / `requirement` 亦可。

从库（`renderSvg(source, { viewName })`）或 CLI（`sysml2svg model.sysml --view-name vehicleView`）选择具名视图。未给 `viewName` 时，若模型中只有一个 `view` 则使用它；否则由图类型指令/`--view` 决定类型。

## 元数据与 abstract

```sysml
abstract part def PowerSource;
#Structure part def Engine;

part def Vehicle {
    part engine : Engine { @Structure; }
}
```

- 定义/用法前的 `abstract` 设置 `isAbstract`（以斜体渲染）。
- 定义/用法前的 `#Name`，或体内的 `@Name;`，为元素添加标注；`filter @Name` 使用这些标注。

## 项、别名、分配与连接

```sysml
item def Fuel;
item fuel : Fuel;
ref item driver : Person;

alias eng for Engine;              // 之后可用 `eng` 引用

allocate Tank to Engine;           // 渲染为虚线边
allocation a1 : LogicalToPhysical allocate Tank to Engine;

connection def Feed { end [1] part a : Tank; end b : Engine; }
connection ps : Feed connect t.out to e.in;

interface def FeedInterface { end supp : OutPort; end cons : InPort; }

part def Engine { in port fuelIn : FuelPort; out port drive : DrivePort; }
```

- `item def` / `item x : T;` / `ref item` —— 行为与 `part` 类似；`item def` 渲染为 `«item»`。
- `alias X for Y;` —— 以 `X` 引用会解析到 `Y`。
- `allocate A to B;` 与 `allocation n : Def allocate A to B;` —— 在 BDD / IBD 中渲染为虚线 `allocate` 边。
- `connection def N { end ...; }` / `interface def N { end ...; }` 渲染为 `«connection»` / `«interface»`，其 end 作为行；`connection` / `interface` usage 连接端点。
- `in` / `out` / `inout` 可前缀于 `port` / `item` / `part` / `attribute` 用法；方向保留在显示名中。

## 修饰前缀、默认值与其它声明

```sysml
variation part def Variant;              // 修饰前缀：variation / individual / ordered / nonunique / snapshot / timeslice / derived
attribute n = 20;                        // 默认值
attribute m default = 10;
binding ab : AB bind a = b;              // 具名 binding
port p : ~FuelPort;                      // 共轭端口类型

metadata def M;                          // 解析为 «metadata»
class def C { attribute x : Real; }      // KerML 风格，解析为 «class»
calc def F;  function def G;  predicate def H;  assoc def R;  struct def S;  datatype def D;

requirement def R { stakeholder s : S; actor a : A; invariant x; }
part def W { exhibit state s : S; }
view v { frame VP; satisfy VP; }
```

- 修饰前缀记录在 `Element.modifiers`；`~T` 设置 `isConjugate`；默认值以原始文本捕获。
- `metadata`、`concern`、`allocation` 以及 KerML 的 `class` / `assoc` / `connector` / `struct` / `datatype` / `calc` / `function` / `predicate` / `rendering` / `expr` 声明解析为 `«keyword»` 元素（其主体也会解析）。
- `stakeholder` / `actor` / `invariant` 作为需求行出现；`exhibit`、`frame` 与 `satisfy <viewpoint>` 被记录。

## 控制流与导入

```sysml
// 导入变体：`all`、递归 `::*::**`、过滤包 `::[expr]`
import all ScalarValues::*;
import Vehicle::*::**;
import Signals::[name];

action txn;
action approve;
action reject;
first txn then decide;
if amount < limit then approve;     // 从前一节点出发的带标签接续
else reject;
merge;
succession flow from txn to approve;
while pending;                      // 结构化主体被捕获为 statement
```

- `if <expr> then <ref>;` 与 `else <ref>;` 变为从前一节点出发的带标签接续。
- 单独的 `merge;` / `decide;` / `fork;` / `join;` 声明一个可被接续引用的控制节点。
- `while` / `loop` / `for` 语句被捕获为 statement 节点（无主体语义）。
- N 元连接器 `connect (a, b, c);`（`connection` / `interface` 同）从首个端点扇出。

## 多重度

| 语法 | 含义 |
| --- | --- |
| `[n]` | 恰好 `n`（下界 = 上界） |
| `[lower..upper]` | 区间，如 `[1..4]` |
| `[*]` | 无界（`lower = upper = *`） |
| `[0..*]` | 零到多 |

## 不支持项

以下均落在支持子集之外，会以诊断报告（绝不静默接受）：

- 完整的 SysML v2 / KerML 语法；标准库与多文件解析。
- `frame` / `concern` / `stakeholder` 与 `satisfy <viewpoint>` 一致性检查的求值；超出 `@Name` 合取的 `filter` 表达式；图形化编辑与布局持久化。
- `references` / `crosses`。
- 参数图及其它视图族（序列、几何、网格、浏览器）；`end` 多重度展开。
- `variation` / `individual` 语义、KerML 表达式主体、元数据取值，以及结构化控制主体（`if` / `while` / `for` / `loop` 语义）的求值。
- `derive` / `trace` / `refine` / `copy`（并非 SysML v2 关键字）；`verification def` / `objective`（仅解析裸 `verify <ref>;`）。
- 带取值表达式的特征重定义（`attribute redefines x = expr;`）。
- 需求主体表达式（`subject = path`）；请使用 `subject name : Type;`。
- 超出原始文本的状态触发代数、`exhibit`、结构化控制主体（`if` / `while` / `for` / `loop`）；它们的引用只能通过接续出现。
- ELK 布局（IBD 使用 dagre 并显式锚定端口）。
- LSP 中的跳转定义、重命名、格式化与多文件解析。

可运行 [`sysml2svg` CLI](cli.zh.md) 或调用 `renderModel()` 查看诊断（带 code 的 `error` / `warning`，如 `unresolved-reference`、`duplicate-definition`、`unexpected-token`）。
