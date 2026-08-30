# dsh-files-native

接近原生质感的 DSH 附件上传：任意文件拖进 / 粘贴进 / 点回形针选进当前会话，视觉跟官方图片栏同一条轨。

- **图片**（PNG / JPEG / WebP / GIF）走官方草稿图栏（64px 缩略图，点击灯箱），发送后进模型视觉上下文。
- **其它文件**落到会话工作区 `.dsh-uploads/`，同一条轨上用 64px 高可读横条卡（扩展名角标 + 文件名 + 大小）。
- 发送时 `agent/pre-step` 把相对路径交给模型（插件 notice，模型可读）；对话区把 file-native 注入画成用户气泡栈里的右对齐文件卡（与官方图同一列），本行藏掉，避免作业回复插在提问和文件中间。
- 发送成功即清输入框待发轨（进入 `submitting`/`claimed` 立刻归档；对话区出现路径对得上的附件卡再兜底清一次）。
- 回复结尾只画「产物」chip；附件已跟用户气泡走。

运行时插件 id 仍是 `file-native`（上传路由 `/plugins/file-native/*`）。npm / GitHub 仓库名是 `dsh-files-native`。

## 入口

| 操作 | 行为 |
|---|---|
| 拖进窗口任意位置 | 全屏「松开以添加文件」遮罩；松手即分流，不必对准卡片 |
| Ctrl+V 粘贴文件 | 同上分流；纯文本粘贴不受影响 |
| 输入框回形针 | `multiple` 文件选择，不限格式 |
| Esc | 取消本次拖入 |

## 安装

```bash
git clone https://github.com/meyaomiao/dsh-files-native.git
cd dsh-files-native
pnpm install && pnpm build
dsh plugin --profile web add .
```

改完先 `pnpm build`（或 `node scripts/build.mjs`），再彻底重启 `dsh web`。宿主入口的 `inject` 必须含 `webServer` 与 `sessions`（漏了 DSH 会起不来，见 [插件开发门禁](docs/plugin-dev-gate.md)）。不要和 `dsh-file-fix` / `dsh-file-upload` / `dsh-paste-to-path` 叠装——都会抢拖拽和附件栏。

## 当前实现（架构）

| 半区 | 入口 | Cordis `inject` | 职责 |
|---|---|---|---|
| host | `src/index.ts` | `webServer`, `sessions` | loopback 上传/删除；文件落到会话 cwd `.dsh-uploads/`；`agent/pre-step` 注入路径清单 |
| client | `src/client.ts` | `slots` | 整窗拖入/粘贴拦截；回形针；输入框混排轨；对话区文件卡 |

关键约束：

- **禁止**在渲染路径调用 `useSession` / `useInput`（条件调用会把 `conversation.input.left` 打成 `data-slot-error`，回形针和轨一起没）。会话 id 只读 `InputZone` 快照 `session.id`。
- **禁止**对聊天时间线挂 `MutationObserver`（`insertBefore` 自己会触发观察器，流式回复时页面卡死）。卡片一次性 portal 进相邻用户气泡栈。
- 空输入框时 `[data-file-native-host]:empty` 隐藏，避免 composer `gap: 12px` 多出一截上边距。有文件时轨 padding 对齐官方图栏 `4px 12px 0`。
- 不要和 `dsh-file-fix` / `dsh-file-upload` / `dsh-paste-to-path` 叠装。

## 限制

- 单文件 50 MB，单批 20 个。
- 上传路由仅 loopback。
- 刷新会丢掉「已上传未发送」的文件卡（磁盘文件仍在 `.dsh-uploads/`）。
