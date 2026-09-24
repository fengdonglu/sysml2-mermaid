# 参考资料

[English](references.md) | 中文

`sysml2-mermaid` 所用记号与 `.sysml` 子集背后的来源。

## 标准

- **OMG SysML v2** —— *Systems Modeling Language (SysML) Version 2.0*，对象管理组织（OMG）。定义该语言及其抽象语法、文本与图形记法的标准：https://www.omg.org/spec/SysML/2.0/。
- **OMG KerML** —— *Kernel Modeling Language (KerML) Version 1.0*，对象管理组织（OMG）。SysML v2 所依托的语义内核与表达式语言：https://www.omg.org/spec/KerML/1.0/。

## 参考实现与语法

- **SysML-v2-Release** —— 由 OMG Systems Modeling 社区维护的官方 SysML v2 / KerML 试点实现仓库：https://github.com/Systems-Modeling/SysML-v2-Release。它是该语言权威的机器可读来源。尤其是：
  - `bnf/` —— KerML 与 SysML v2 的语法（BNF）文件，用于让解析器与官方文本语法保持一致；
  - `sysml/src/` —— 用 `.sysml` 自身表达的标准库。

## 工具

- **Mermaid** —— `sysml2-mermaid` 通过 Mermaid 的**外部图表（external diagram）** API 所集成的图表语言：https://mermaid.js.org。
- **mermaid-opm** —— 用同一套架构（Mermaid 插件、CLI、LSP、VS Code 扩展）渲染 OPM/OPL（ISO 19450）的姊妹项目，也是本仓库各项约定的工作参考：https://github.com/fengdonglu/mermaid-opm。

## 本地参考资料

仓库在本地保留了一个 `reference/` 目录，存放设计本项目时所用的材料。它**未纳入版本控制**：`.gitignore` 将其排除，因为它是本地工作材料，构建或测试本项目并不需要它。其中包含设计期间查阅过的讨论记录——一份 OPM/OPL 会话导出，以及一份 SysML v2 讨论的记录。如需查阅某条引用，请使用上方的官方规范或仓库链接。
