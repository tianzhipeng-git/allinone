# UI Pitfalls（前端踩坑索引）

与界面、WebView、原生菜单相关的「踩坑」说明集中在本目录，避免分散在各设计文档里。模式与接入方式仍以 [UI Patterns](./ui-patterns.md)、[Menus](./menus.md)、[GTD Module](./gtd-module.md) 等为主；这里只保留易回归的问题与对策。

## 目录

| 主题 | 文档 |
| --- | --- |
| 自定义应用菜单后 WebView 内复制、粘贴、全选异常 | [native-menu-webview-text-editing.md](./ui-pitfalls/native-menu-webview-text-editing.md) |
| 对话框 / 面板中长路径等导致布局、输入框被挤出 | [dialog-panel-overflow.md](./ui-pitfalls/dialog-panel-overflow.md) |
| GTD 侧栏树遇到的拖拽/展开折叠问题（react-arborist + Tauri DnD、点击与选中） | [gtd-sidebar-tree-arborist.md](./ui-pitfalls/gtd-sidebar-tree-arborist.md) |

## 维护约定

新增同类问题时：在本目录新增 Markdown（或扩展现有专题），并在此表中加入一行链接；**不要**在长文设计文档里再新开大段「踩坑」章节。
