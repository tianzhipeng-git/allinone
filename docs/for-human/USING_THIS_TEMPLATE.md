# 使用此模板

本文档仅适用于此模板，在您熟悉新项目后应将其删除。

## 前提条件

在开始之前，请安装：

- **Node.js** (v18+) - [nodejs.org](https://nodejs.org/)
- **Rust** (最新稳定版) - [rustup.rs](https://rustup.rs/)
- **平台依赖项**：
  - **macOS**: `xcode-select --install`
  - **Windows**: [Microsoft C++ 生成工具](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - **Linux**: 参见 [Tauri 前提条件](https://tauri.app/start/prerequisites/)

然后克隆此模板并安装依赖：

```bash
git clone <your-repo-url>
cd <your-project>
pnpm install
```

## 快速设置 (Claude Code)

如果您使用的是 Claude Code，请运行 `/init` 命令：

```
/init
```

这将提示您输入应用名称和描述，然后自动更新所有配置文件。完成后，验证一切是否正常运行：

```bash
pnpm run tauri:dev
```

## 手动设置

如果您不使用 Claude Code，请手动更新这些文件：

### 配置检查清单

| 文件                            | 需要更新的字段                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `package.json`                  | `name`, `description`                                                          |
| `index.html`                    | `<title>` 标签                                                                 |
| `src-tauri/tauri.conf.json`     | `productName`, `identifier`, `windows[0].title`, 捆绑信息, 更新程序端点        |
| `src-tauri/Cargo.toml`          | `name`, `description`, `authors`                                               |
| `.github/workflows/release.yml` | 工作流名称, 发布名称                                                           |
| `AGENTS.md`                     | 包含应用名称/描述的概述部分                                                    |
| `README.md`                     | 将模板引用替换为您的应用                                                       |
| `docs/SECURITY.md`              | 设置安全联系人                                                                 |
| `docs/CONTRIBUTING.md`          | 设置 GitHub 仓库路径                                                           |

### 标识符格式

使用反向域名表示法：`com.yourusername.your-app-name`

您可以通过以下方式获取您的 GitHub 用户名：

```bash
gh api user --jq .login
```

### 验证设置

```bash
pnpm run check:all
pnpm run tauri:dev
```

## 示例 AI 工作流

此模板包含专为 AI 辅助开发设计的工作流功能。以下是一个示例工作流：

### 1. 使用任务文档进行规划

在 `docs/tasks-todo/` 中创建一个任务文档，描述您想要构建的内容。让 AI 阅读相关文档并协助规划实施方案。任务文档有助于在不同会话之间保持上下文。

### 2. 迭代实现

构建功能，并定期运行质量检查：

```bash
pnpm run check:all
```

这将通过一个命令运行 TypeScript、ESLint、Prettier、Rust 检查和测试。

### 3. 完成前的检查

在 Claude Code 中，在结束会话前运行 `/check`。这将验证您的工作是否符合 `docs/developer/` 中的架构模式，并清理任何残留的调试代码。

### 4. 更新文档

让 AI 更新 `docs/developer/` 中的相关开发者文档和 `docs/userguide/` 中的用户指南，以反映新的模式或功能。

### 5. 完成任务

移动任务文档以将其标记为已完成：

```bash
pnpm run task:complete <task-name>
```

## 设置 GitHub Releases

要通过 GitHub Actions 启用自动构建和自动更新：

### 1. 生成签名密钥

```bash
pnpm add -g @tauri-apps/cli
tauri signer generate -w ~/.tauri/myapp.key
```

保存显示的公钥以供下一步使用。

### 2. 添加 GitHub Secrets

在您的仓库中：Settings → Secrets and variables → Actions

- `TAURI_PRIVATE_KEY`: `~/.tauri/myapp.key` 的内容
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: 您的密钥密码（如果已设置）

### 3. 更新公钥

将您的公钥添加到 `src-tauri/tauri.conf.json` 中：

```json
{
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

请参阅 [docs/developer/releases.md](developer/releases.md) 了解完整的发布流程和自动更新系统。

## 后续步骤

1. **尝试应用**：`pnpm run tauri:dev`
2. **探索功能**：打开命令面板 (Cmd+K)，查看偏好设置 (Cmd+,)
3. **阅读文档**：从 [docs/developer/architecture-guide.md](developer/architecture-guide.md) 开始
4. **设置发布**：如果使用 CI/CD，请遵循上面的 GitHub Releases 部分
5. **删除此文件**：一旦您熟悉了项目，请删除 `docs/USING_THIS_TEMPLATE.md`
