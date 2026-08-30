# AGENTS

改这个插件前先读 [docs/plugin-dev-gate.md](docs/plugin-dev-gate.md)。

1. host `src/index.ts` 的 `inject` 必须含 `webServer` 与 `sessions`。client `src/client.ts` 的 `inject` 必须含 `slots`。漏了会 `cannot get property without inject`，整个 DSH 起不来。
2. 不要在渲染路径调用 `useSession` / `useInput`。会话 id 只读 InputZone 快照。
3. 不要对聊天时间线挂 `MutationObserver`。
4. 改完 `pnpm build`（写出 `lib/index.js` + `lib/client.js`），再彻底重启 `dsh web`。
5. 不要和 `dsh-file-fix` / `dsh-file-upload` / `dsh-paste-to-path` 叠装。
