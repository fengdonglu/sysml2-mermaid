# 什么是 SysML v2？

[English](what-is-sysml.md) | 中文

**系统建模语言第 2 版（SysML v2）** 是由对象管理组织（OMG）标准化的系统建模语言。它取代了 SysML v1——许多系统工程师熟悉的那个 UML 2 剖面（profile）——带来了全新的、以形式化为基础的抽象语法、一等的文本记法，以及用于在工具间交换模型的 API（见[《参考资料》](references.zh.md)）。

SysML v2 将系统描述为一组**定义（definitions）**与**使用（usages）**：`part def` 定义某一类部件，而 `part` 是它的一次使用，正如 `attribute` 是其拥有者的一项带类型特征。需求、端口、连接、状态与动作都遵循同一模式，这正是单一语义模型能够服务于多种图的原因。

## 建立在 KerML 之上

SysML v2 并非从零定义自身的语义。它的内核是 **KerML**（*Kernel Modeling Language*），后者提供核心概念——分类器、特征、类型及其间关系——以及用于约束的表达式语言。可以说，SysML v2 是构建在 KerML 之上的系统工程层。

## 文本优先的记法

除了传统图形记法，SysML v2 还定义了一种标准**文本记法**，保存在 `.sysml` 文件中。一个小模型如下：

```sysml
package VehicleModel {
    part def Vehicle;
    part def Engine;

    part vehicle : Vehicle {
        part engine : Engine;
    }
}
```

文本与图形是同一抽象模型的两个投影，而非两份彼此独立的文档。`sysml2-mermaid` 以**文本为唯一事实来源**，按需由文本重新计算图形；布局相关的信息一概不保存。这与姊妹项目 [`mermaid-opm`](https://github.com/fengdonglu/mermaid-opm) 对 OPM/OPL 采取的立场一致，也使模型能在版本控制中 diff 与评审。完整理由见[《设计背景》](../design/BACKGROUND.zh.md)。

## 本项目实现了什么

`sysml2-mermaid` 支持文本记法中一个有文档记载的子集，以及五种视图，可将 `.sysml` 文本端到端渲染为 SVG：

- **块定义图（BDD）** —— `part def` / `part` 的定义、使用及其关系。
- **需求图** —— `requirement def` / `requirement` 及其关系。
- **内部块图（IBD）** —— 部件、`port` 与 `connection`。
- **状态机** —— `state def` / `state` 与状态转移。
- **活动/泳道图** —— `action def` / `action` 与控制流。

视图通过模型首行的指令选择（`sysml bdd`、`sysml requirement`、`sysml ibd`、`sysml statemachine`、`sysml activity`）；若没有指令，则使用 BDD 视图。完整的 SysML v2 / KerML 语法与语义一致性明确**不在范围内**：解析器只接受有文档记载的 `.sysml` 子集，其余一律通过带定位信息的诊断报告。

- [《架构》](../ARCHITECTURE.zh.md) —— 文本如何变成图。
- [《路线图》](../ROADMAP.zh.md) —— 已实现与已规划的内容。
- [《参考资料》](references.zh.md) —— 记号背后的标准与仓库。
