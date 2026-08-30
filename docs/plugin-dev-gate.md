# 插件开发门禁

后续开发、编辑、优化本仓库插件时,**先过本页再改代码 / 再重启 DSH**。
本页由一次真实事故固化:`file-native` 刚装上,重启后整个 DSH 打不开。

## 1. 事故(必读)

**现象**:插件装好 → 重启 DSH → Web GUI 起不来。

**根因**:宿主入口 `apply` 里写了 `ctx.get('webServer')`,但模块级

```ts
const inject = ['sessions'];
```

没声明 `webServer`。Cordis 的 `inject` 是**访问授权**,不是可有可无的提示。未声明就读,当前 DSH 直接抛:

```text
cannot get property "webServer" without inject
```

异常若在插件装载期未捕获,**整个进程退出**,不是「这个插件没生效」。

同类事故:

| 案例 | 访问 | inject 漏了 | 后果 |
|---|---|---|---|
| `file-native`(本仓库) | `ctx.get('webServer')` | `webServer` | **DSH 起不来** |
| `dsh-reef` 1.5.2 | `ctx.get('webServer')` | 只写了 `tools` | 旧行为下服务是 `undefined`,路由没注册,面板显示「模块未启用」(静默残废) |
| `dsh-better-sidebar` / github-workbench | `ctx.betterSidebar` | 未声明 | `cannot get property "betterSidebar" without inject`,客户端崩 |

两种失败都来自同一条规则,只是严重程度不同:**硬崩**打死宿主;**漏声明 + 防守性 return** 则插件装上了但功能是假的。

## 2. 硬规则

### 2.1 `inject` 是授权列表

每个 **host 入口**(`src/index.ts`)和 **client 入口**(`src/client.ts`)各自一份 `inject`,互不相通。

```ts
const inject = ['webServer', 'sessions'];

export function apply(ctx: HostCtx): void {
  const webServer = ctx.get('webServer'); // 必须已在 inject 里
  ctx.sessions.get(id);                   // 必须已在 inject 里
}

export { inject, name };
```

- `ctx.get('X')` 而 `'X'` 不在**本入口**的 `inject` 里 → **禁止**(必炸)。
- 未加 try/catch 的 `ctx.X`(X 是 Cordis 服务)而 `'X'` 不在 `inject` 里 → **禁止**(必炸)。
- 改了 `apply` 里用的服务,必须同步改同一文件顶部的 `inject`,再重新构建。

### 2.2 常用服务(按半区)

**宿主(host / `src/index.ts`)**

| 服务 | 典型用途 | 漏了会怎样 |
|---|---|---|
| `webServer` | `register` / `registerUpgrade` 路由 | 硬崩,或路由从未注册 |
| `sessions` | 用 sessionId 解析 cwd / 鉴权 | 硬崩,或把请求打到错误目录 |
| `tools` | `ctx.tools.register` | 工具不出现 |
| `systemPrompt` | `ctx.systemPrompt.section` | 提示词区段不出现 |

**客户端(client / `src/client.ts`)**

| 服务 | 典型用途 | 漏了会怎样 |
|---|---|---|
| `slots` | `ctx.slots.inject` / `register` | 附件栏、回形针等 UI 不挂 |
| `sessions` | 会话列表 / 当前会话 | 面板空态或崩 |
| `connection` | RPC(`subagents.list` 等) | 子代理详情不可用 |
| `betterSidebar` | `registerTab` / `registerFileViewer` | 见 §2.3,可选 peer |

**Context 自身方法,不必写进 inject**

`logger` / `effect` / `on` / `provide` / `plugin` / `get`(方法本身) / `emit`。

### 2.3 可选 peer:只能三选一

`betterSidebar`、`sidePanel` 这类「没装也能活」的服务,选一种策略并写进注释,**禁止**第四种(`ctx.get` 又不声明):

1. **写进模块级 `inject`**(推荐,github-workbench):Cordis 允许访问;服务不在时属性为 `undefined`,自己降级。
2. **嵌套子插件**(server-deck):外层 `inject = []`,内层 `ctx.plugin({ inject: ['betterSidebar'], apply(inner) { inner.betterSidebar... } })`。没装 better-sidebar 时内层 fiber 保持 INACTIVE,外层仍活。
3. **不声明 + `try/catch` 包住属性访问 + 短轮询**(univer-sidebar):`ctx.get` 一律不准用。属性访问会抛,必须 catch 成 `undefined`。

`webServer` / `sessions` / `tools` / `systemPrompt` / `slots` 是本插件能工作的前提,走策略 1,不要用轮询假装可选。

### 2.4 改完必须先构建,再重启 DSH

DSH 加载的是 `lib/index.js` 与 `lib/client.js`,**不是** `src/`。

```bash
# 单包
pnpm --filter @dsh-abilities/<pkg> build
# 或在插件目录
node scripts/build.mjs

# 全仓库
pnpm build
```

然后**彻底重启** `dsh web`(宿主路由在进程启动时注册)。只刷新浏览器不够。不要另开一个 server 冒充本 GUI。旧进程没退出就启动会 `EADDRINUSE`。

不要把未构建的源码目录 `dsh plugin add` 上去。

## 3. 改插件时的检查单

改 / 新增任何 `packages/*` 插件,提交或重启前勾完:

- [ ] host `inject` 覆盖该入口里所有 `ctx.get('…')` 与未守护的 `ctx.<服务>`
- [ ] client `inject` 同上,且与 host **分开**盘点(改了一边不等于另一边)
- [ ] 没有「`ctx.get('webServer')` 但 inject 只有 `sessions` / `tools`」这种组合
- [ ] 可选 peer 走 §2.3 三种之一,并在入口注释写明
- [ ] `pnpm gate` 通过(见 §4)
- [ ] `pnpm --filter @dsh-abilities/<pkg> build` 已跑,`lib/` 新于 `src/`
- [ ] 需要 UI 的包:构建日志出现 `lib/index.js + lib/client.js`
- [ ] 重启 DSH 后:`running`、最近一次退出码 `0`、PID 稳住、首页 `200`、`<pkg>/client.js` `200`
- [ ] 不与抢同一槽位的插件叠装(附件族:`file-native` / `dsh-file-fix` / `dsh-file-upload` / `dsh-paste-to-path`;侧栏族需自己协调)

## 4. 自动门禁

仓库根目录:

```bash
pnpm gate      # 静态扫描 inject ↔ ctx.get / ctx.<服务>
pnpm test      # 先跑 gate,再跑各包单测
pnpm check     # gate + typecheck + test
```

`scripts/check-inject.mjs` 会扫每个 `packages/*/src/{index,client}.ts` 及其相对导入:

1. `ctx.get('X')` 而 X 是已知服务且不在该入口 `inject` → **失败**(file-native 类)
2. 未守护的 `ctx.X` 同上 → **失败**
3. `try/catch` 包住的属性访问,或嵌套 `plugin({ inject: [...] })` 的 `inner.X` → 允许
4. 入口 `src` 明显新于对应 `lib/*.js` → **警告**(提醒先 build)

新增服务名时,把标识符加进脚本里的 `KNOWN_SERVICES`。

## 5. 最小对照(抄)

**宿主注册路由**(side-panel / server-deck / 修复后的 file-native):

```ts
const inject = ['webServer', 'sessions'];
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/…', handler }), '…');
}
export { inject, name };
```

**客户端插槽**(file-native client):

```ts
const inject = ['slots'];
export function apply(ctx: ClientCtx): void {
  ctx.slots.inject('conversation.input.attachments', () => /* … */);
}
export { inject, name };
```

**禁止**(本事故原样):

```ts
const inject = ['sessions']; // 漏了 webServer
export function apply(ctx) {
  ctx.get('webServer'); // 装载期抛错 → DSH 起不来
}
```
