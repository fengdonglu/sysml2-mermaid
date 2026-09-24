# 为 sysml2-mermaid 贡献

[English](CONTRIBUTING.md) | 中文

感谢你有兴趣改进 `sysml2-mermaid`。本项目把 SysML v2 文本记法渲染为图表，形态为 Mermaid 外部图插件，并提供 `sysml2svg` CLI、语言服务器与 VS Code 扩展。

请先阅读 [`AGENTS.md`](AGENTS.md)：它是本仓库布局、编码约定以及智能体与人类协作方式的权威指南。

## 开发环境

要求：Node.js 20 或更新。

```bash
npm ci        # 安装精确依赖（同时链接 packages/* 工作区）
npm run build # 类型检查 + 打包（dist/）
npm run dev   # 在 http://localhost:3000 提供演示
```

演示页面加载 `dist/sysml2-mermaid.mjs`，因此打开 `demo/index.html` 前请先构建（或直接用 `npm run dev`）。

## 先写测试（TDD）

本项目采用测试先行。先写一个描述目标行为的失败测试，确认它以预期原因失败，再写最小实现使其通过。没有失败测试就不要添加生产代码。

```bash
npm test                                  # 根测试套件
npm run typecheck                         # tsc --noEmit
npm run build                             # 类型检查 + 打包
npm --prefix packages/lsp test            # 语言服务器
npm --prefix packages/vscode-sysml test   # VS Code 扩展
```

提交 PR 前请运行相关套件。解析器不得抛异常：问题通过带行/列信息的诊断上报。

## 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` 新功能
- `fix:` 缺陷修复
- `docs:` 仅文档
- `test:` 仅测试
- `refactor:` 既非修复也非新增的代码改动
- `chore:` 构建或工具链改动

每次提交保持聚焦，主题用祈使句。

## 文档

英文为权威。中文翻译以 `*.zh.md` 兄弟文件形式放在英文文件旁。所有代码注释与文档用英文书写；只有 `*.zh.md` 可以包含中文。若两者冲突，以英文为准。

## 拉取请求清单

- [ ] 改动有测试覆盖，且新测试在修复前是失败的。
- [ ] 本地 `npm run typecheck`、`npm test`、`npm run build` 全部通过。
- [ ] 注释与文档为英文，相关处提供 `*.zh.md` 副本。
- [ ] 提交信息遵循 Conventional Commits。
- [ ] 面向用户的改动已反映到 `README.md` 与 `docs/`。
