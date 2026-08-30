/**
 * 浏览器半:shadow 官方附件栏为混排轨,整窗拖入/粘贴,回形针多选。
 * 拖入拦截在 apply 时即安装。会话 id 只读 InputZone 快照,绝不调用 useSession/useInput。
 */

import { createElement as h, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { intakeFiles } from './rail.tsx';
import { PaperclipButton } from './picker.tsx';
import { UploadedTail, producedPathsOf, type TailMatch } from './tail.tsx';
import { ContextNodeView } from './context.tsx';
import * as store from './store.ts';
import { ensureStyles } from './styles.ts';
import { installFileIntercept } from './intercept.ts';
import { currentSessionId, getLiveOwner, rememberSessionId, resolveSessionId, setDragDepth, setLiveOwner } from './live.ts';
import type { AttachmentsOwner, ClientCtx } from './types.ts';

const name = 'file-native';
/** 插槽注入必须声明 slots,否则客户端抛 cannot get property without inject。host 半的 webServer/sessions 见 src/index.ts。 */
const inject = ['slots'];

function RailSlot(props: AttachmentsOwner & { sessionId?: string }): ReactElement | null {
  ensureStyles();
  const sessionId = resolveSessionId(props);
  setLiveOwner({
    attachments: props.attachments,
    canAcceptDrop: props.canAcceptDrop,
    onAddImages: props.onAddImages,
    onRemoveImage: props.onRemoveImage,
    sessionId,
    dropLimits: props.dropLimits,
  });
  useEffect(() => () => setLiveOwner(null), []);
  return null;
}

function PickerSlot(props: {
  sessionId?: string;
  session?: { id?: string };
  input?: { phase?: string; draft?: string; imageIds?: readonly unknown[] };
}): ReactElement {
  const sessionId = resolveSessionId(props);
  rememberSessionId(sessionId);
  const phase = String(props.input?.phase ?? '');
  const draft = String(props.input?.draft ?? '');
  const imageCount = props.input?.imageIds?.length ?? 0;
  const prev = useRef({ phase, draft, imageCount });
  useEffect(() => {
    const sid = sessionId || currentSessionId();
    const was = prev.current;
    const entering = phase === 'submitting' || phase === 'claimed';
    const leaving = (was.phase === 'submitting' || was.phase === 'claimed') && phase === 'plain';
    const sentPlain = was.phase !== 'plain' && phase === 'plain' && draft.trim() === '' && imageCount === 0;
    if (sid && (entering || leaving || sentPlain)) store.archiveSent(sid);
    prev.current = { phase, draft, imageCount };
  }, [phase, draft, imageCount, sessionId]);
  return h(PaperclipButton, { sessionId });
}

function TailSlot(props: {
  sessionId?: string;
  openFile?: (path: string) => void;
  matched?: TailMatch | null;
  turn?: { turn?: number };
}): ReactElement | null {
  return h(UploadedTail, {
    sessionId: props.sessionId,
    openFile: props.openFile,
    matched: props.matched ?? null,
    turn: props.turn?.turn,
  });
}

function selectTail(owner: {
  sessionId?: string;
  seq?: number;
  turn?: { turn?: number; data?: { get?: (key: string) => { produced?: readonly { path: string; seq: number }[] } } };
  openFile?: (path: string) => void;
}): TailMatch | null {
  const produced = producedPathsOf(owner);
  if (produced.length === 0) return null;
  return { uploaded: [], produced };
}

function installLiveIntercept(): () => void {
  return installFileIntercept({
    canAccept: () => true,
    onDepth: (depth) => setDragDepth(depth),
    onFiles: (files) => {
      const live = getLiveOwner();
      const sessionId = live?.sessionId || currentSessionId();
      const addImages = live?.onAddImages ?? (() => {});
      intakeFiles(sessionId, files, addImages);
    },
  });
}

export function apply(ctx: ClientCtx): void {
  ctx.effect(() => installLiveIntercept(), 'file-native: document intercept');

  ctx.slots.inject('conversation.input.attachments', () => ctx.slots.register({
    name: 'conversation.input.attachments',
    priority: -1,
  }, RailSlot));

  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'file-native-picker',
    order: 0,
  }, PickerSlot));

  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'context',
    priority: -1,
  }, ContextNodeView));

  ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
    name: 'conversation.chat.turnTail',
    priority: -1,
    select: selectTail,
  }, TailSlot));

  ctx.logger?.info?.('[file-native] client loaded');
}

export { inject, name };
