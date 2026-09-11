/**
 * 浏览器半:shadow 官方附件栏为混排轨,整窗拖入/粘贴,回形针多选。
 * 拖入拦截在 apply 时即安装。会话 id 只读 InputZone 快照,绝不调用 useSession/useInput。
 */

import { createElement as h, useEffect, useLayoutEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { intakeFiles } from './rail.tsx';
import { PaperclipButton } from './picker.tsx';

import { MessageCards } from './context.tsx';
import * as store from './store.ts';
import { ensureStyles } from './styles.ts';
import { installFileIntercept } from './intercept.ts';
import { clearLiveOwner, currentSessionId, rememberSessionId, resolveSessionId, setDragDepth, setLiveOwner } from './live.ts';
import { deliverImages, pasteAccompanyingText } from './vision.ts';
import type { AttachmentsOwner, ClientCtx } from './types.ts';

const name = 'file-native';
/** 插槽注入必须声明 slots,否则客户端抛 cannot get property without inject。host 半的 webServer/sessions 见 src/index.ts。 */
const inject = ['slots', 'betterSidebar'];

function RailSlot(props: AttachmentsOwner & { sessionId?: string }): ReactElement | null {
  ensureStyles();
  const sessionId = resolveSessionId(props);
  rememberSessionId(sessionId);
  const tokenRef = useRef(0);
  // 每帧把最新 onAddImages 写进槽;卸载只清自己挂上的 generation,避免切会话把新槽抹成空函数。
  useLayoutEffect(() => {
    tokenRef.current = setLiveOwner({
      attachments: props.attachments,
      canAcceptDrop: props.canAcceptDrop,
      onAddImages: props.onAddImages,
      onRemoveImage: props.onRemoveImage,
      sessionId,
      dropLimits: props.dropLimits,
    });
  });
  useLayoutEffect(() => () => clearLiveOwner(tokenRef.current), []);
  return null;
}

/** 对话区文件卡的打开器:优先 better-sidebar 侧栏预览,否则浏览器新页签打开。 */
let chatCardOpener: ((sessionId: string, relPath: string, name: string) => void) | undefined;

/** 会话 store 投影里本插件关心的字段(官方 QueueDock 同款 useSession 选择器)。 */
interface SessionProjection {
  readonly running?: boolean;
}
type UseSession = ((select: (state: SessionProjection) => unknown) => unknown) | undefined;

/** 标准 kit 的 inputActions:官方输入机动作面(setDraft/submit)。 */
interface InputActions {
  readonly setDraft?: (text: string) => void;
  readonly submit?: () => void;
}

function PickerSlot(props: {
  sessionId?: string;
  session?: { id?: string };
  /** 会话标准套件下发的 selector hook;读 running 判断「立即发送还是排队」。 */
  useSession?: UseSession;
  /** 会话标准套件下发的输入机动作。 */
  inputActions?: InputActions;
}): ReactElement {
  const sessionId = resolveSessionId(props);
  rememberSessionId(sessionId);
  const running = Boolean(props.useSession?.((state) => state.running));
  const inputActions = props.inputActions;
  const submitAction = inputActions?.submit;
  const kitSig = `inputActions=${props.inputActions ? 'y' : 'n'} useSession=${props.useSession ? 'y' : 'n'}`;
  useEffect(() => {
    console.info(`[file-native] kit: ${kitSig}`);
  }, [kitSig]);

  // 产品规则(2026-09-06 定稿):附件只跟随「立即发送」的消息;忙时回车 = 纯文字
  // 排队,文件留在轨上等下次空闲发送。消息文本保持干净——提交瞬间先武装 host
  // (下一条消息的 pre-step 注入当前 pending 文件),再触发官方提交,时序严格 1:1。
  const submitWithFiles = (ev: { preventDefault: () => void; stopPropagation: () => void }, sid: string): void => {
    const submitFn = inputActions?.submit;
    // 轨卡使命完成:附件即将随本消息注入,先清轨(pending 在 host 侧,不受影响)。
    store.archiveSent(sid);
    if (submitFn === undefined) {
      // 拿不到提交动作:放行官方流程,武装异步竞争兜底(绝大多数先到)。
      void fetch(`/plugins/file-native/arm?sessionId=${encodeURIComponent(sid)}`, { method: 'POST' }).catch(() => {});
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    void fetch(`/plugins/file-native/arm?sessionId=${encodeURIComponent(sid)}`, { method: 'POST' })
      .catch(() => {})
      .then(() => submitFn());
  };

  // 入口一:回车(捕获先于官方编辑器处理)。忙时回车 → 纯文字排队,文件留轨。
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent): void => {
      if (ev.key !== 'Enter' || ev.shiftKey || ev.isComposing || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      if (running) return;
      const sid = sessionId || currentSessionId();
      if (sid === '' || store.doneFiles(sid).length === 0) return;
      submitWithFiles(ev, sid);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [running, inputActions, sessionId]);

  // 入口二:发送按钮。主按钮 class 含 'primary';运行中它变成「停止」,running 守卫排除。
  useEffect(() => {
    const onClick = (ev: MouseEvent): void => {
      if (running) return;
      const button = (ev.target instanceof Element ? ev.target.closest('button') : null);
      if (button === null) return;
      if (!/[a-zA-Z0-9_-]*primary/.test(button.className)) return;
      const sid = sessionId || currentSessionId();
      if (sid === '' || store.doneFiles(sid).length === 0) return;
      submitWithFiles(ev, sid);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [running, inputActions, sessionId]);

  return h('span', null,
    h(PaperclipButton, { sessionId }),
    h(MessageCards, { sessionId, onOpen: (file) => chatCardOpener?.(sessionId || currentSessionId(), file.relPath, file.name) }),
  );
}

function installLiveIntercept(): () => void {
  return installFileIntercept({
    canAccept: () => true,
    onDepth: (depth) => setDragDepth(depth),
    onFiles: (files) => {
      const sessionId = currentSessionId();
      intakeFiles(sessionId, files, (images) => { void deliverImages(sessionId, images); });
    },
    onImages: (files) => {
      const sessionId = currentSessionId();
      void deliverImages(sessionId, files);
    },
    onText: (text) => pasteAccompanyingText(text),
  });
}

/** 每个模块实例的唯一序号:同名模块被加载两次时 >1,可直接在 Console 读 window 验证。 */
const INSTANCE = (() => {
  const w = globalThis as { __fileNativeInstances?: number };
  w.__fileNativeInstances = (w.__fileNativeInstances ?? 0) + 1;
  const n = w.__fileNativeInstances;
  console.warn(`[file-native] apply #${n}`);
  return n;
})();

export function apply(ctx: ClientCtx): void {
  ctx.effect(() => installLiveIntercept(), 'file-native: document intercept');

  const sidebar = ctx.betterSidebar;
  if (sidebar !== undefined && sidebar.features.includes('openFile')) {
    chatCardOpener = (sid, relPath, name) => sidebar.openFile({ sessionId: sid }, relPath, name);
  } else {
    chatCardOpener = (sid, relPath) => {
      window.open(`/plugins/file-native/file?sessionId=${encodeURIComponent(sid)}&path=${encodeURIComponent(relPath)}`, '_blank');
    };
  }

  // 浏览器端 core 原样保存显式 priority,冲突=同 cell 同值;选举 lowest renders。
  // 每实例用唯一负值:双实例(HMR)时新实例(序号更大、值更小)赢,旧实例被 shadow,
  // 不会同值相撞;也不会干扰其它插件(官方多为 0/-1)。
  const base = -(1000 + INSTANCE * 10);

  // 碰撞自愈:任何注册失败只跳过自己,不炸 apply 其余部分。
  const safeInject = (slot: string, registerFn: () => () => void): void => {
    ctx.slots.inject(slot, () => {
      try {
        return registerFn();
      } catch (error) {
        console.warn(`[file-native] skip ${slot} registration:`, error);
        return () => {};
      }
    });
  };

  safeInject('conversation.input.attachments', () => ctx.slots.register({
    name: 'conversation.input.attachments',
    priority: base,
  }, RailSlot));

  safeInject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'file-native-picker',
    order: 0,
    priority: base,
  }, PickerSlot));

  console.info(`[file-native] client loaded (instance #${INSTANCE})`);
}

export { inject, name };
