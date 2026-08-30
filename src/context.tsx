/**
 * shadow 官方 context 节点。
 * file-native:把卡片一次性挂进相邻用户气泡栈(与图片同一列),本行藏掉。
 * 禁止 MutationObserver:insertBefore 自己就会触发观察器,流式回复时会把页面卡死。
 * 其它注入:仍走披露行。
 */

import { createElement as h, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { contentText, extOf, formatSize, parseNoticeFiles, type RailFile } from './lib.ts';
import { currentSessionId } from './live.ts';
import * as store from './store.ts';
import { ensureStyles } from './styles.ts';

interface ContextNode {
  data?: {
    content?: unknown;
    source?: { kind?: string; plugin?: string; summary?: string };
    provenance?: { role?: string; label?: string | null };
    form?: string;
  };
}

function FileCard({ file, onOpen }: { file: RailFile; onOpen?: (path: string) => void }): ReactElement {
  return h('button', {
    type: 'button',
    className: 'fr-msg-card',
    title: file.relPath,
    onClick: () => onOpen?.(file.relPath),
  },
    h('span', { className: 'fr-ext' }, extOf(file.name)),
    h('span', { className: 'fr-copy' },
      h('span', { className: 'fr-name' }, file.name),
      h('span', { className: 'fr-meta' }, formatSize(file.size)),
    ),
  );
}

function userStackOf(el: Element | null): HTMLElement | null {
  if (!(el instanceof HTMLElement)) return null;
  const kind = el.getAttribute('data-chat-flow-kind');
  if (kind !== 'user' && kind !== 'steering') return null;
  const row = el.querySelector('[data-time-hover-root]');
  const stack = row?.firstElementChild;
  return stack instanceof HTMLElement ? stack : null;
}

function findUserStack(anchor: HTMLElement | null): HTMLElement | null {
  const flow = anchor?.closest('[data-chat-flow-kind="context"]') as HTMLElement | null;
  if (flow === null) return null;
  let next: Element | null = flow.nextElementSibling;
  let prev: Element | null = flow.previousElementSibling;
  for (let hop = 0; hop < 16; hop += 1) {
    const stack = userStackOf(next) ?? userStackOf(prev);
    if (stack !== null) return stack;
    next = next?.nextElementSibling ?? null;
    prev = prev?.previousElementSibling ?? null;
  }
  return null;
}

function alreadyPlaced(el: HTMLElement, stack: HTMLElement, before: ChildNode | null): boolean {
  if (el.parentElement !== stack) return false;
  if (before === el) return true;
  return el.nextSibling === before;
}

function placeHost(stack: HTMLElement): HTMLElement {
  let el = stack.querySelector('[data-file-native-msg]') as HTMLElement | null;
  if (el === null) {
    el = document.createElement('div');
    el.dataset.fileNativeMsg = '';
    el.className = 'fr-msg-row';
  }
  const gallery = stack.querySelector('[data-align]');
  const after = gallery instanceof HTMLElement
    ? (gallery.closest('[data-slot="conversation.message.images"]') ?? gallery)
    : null;
  const before = (after?.nextSibling ?? stack.firstChild) as ChildNode | null;
  if (!alreadyPlaced(el, stack, before)) {
    stack.insertBefore(el, before);
  }
  return el;
}

function AttachToUserBubble(props: {
  files: readonly RailFile[];
  openFile?: (path: string) => void;
}): ReactElement {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  const noticeKey = props.files.map((file) => file.relPath).join('\n');
  useEffect(() => {
    const sid = currentSessionId();
    if (sid) store.archiveIfNoticeMatches(sid, props.files);
  }, [noticeKey]);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const tick = (): void => {
      if (cancelled) return;
      const stack = findUserStack(anchorRef.current);
      if (stack !== null) {
        const el = placeHost(stack);
        setHost((prev) => (prev === el ? prev : el));
        return;
      }
      tries += 1;
      if (tries < 30) window.setTimeout(tick, 50);
    };
    tick();
    return () => { cancelled = true; };
  }, []);

  const gallery = h('div', { className: 'fr-msg-row-inner' },
    ...props.files.map((file) => h(FileCard, { key: file.relPath, file, onOpen: props.openFile })),
  );

  return h('span', {
    ref: anchorRef,
    'data-file-native-anchor': true,
    'aria-hidden': true,
  }, host !== null && host.isConnected ? createPortal(gallery, host) : null);
}

function OtherContext({ node }: { node: ContextNode }): ReactElement {
  const [open, setOpen] = useState(false);
  const data = node.data ?? {};
  const text = contentText(data.content);
  const summary = data.source?.summary || data.provenance?.label || '上下文注入';
  const source = data.source?.plugin || data.provenance?.label || '';
  return h('div', { className: 'fr-ctx', 'data-open': open || undefined },
    h('button', {
      type: 'button',
      className: 'fr-ctx-head',
      onClick: () => setOpen((value) => !value),
    },
      h('span', { className: 'fr-ctx-title' }, '上下文注入'),
      source ? h('span', { className: 'fr-ctx-src' }, source) : null,
      h('span', { className: 'fr-ctx-sum' }, summary),
    ),
    open ? h('pre', { className: 'fr-ctx-body' }, text) : null,
  );
}

export function ContextNodeView(props: {
  node?: ContextNode;
  openFile?: (path: string) => void;
}): ReactElement | null {
  ensureStyles();
  const node = props.node ?? {};
  const source = node.data?.source;
  if (source?.kind === 'plugin' && source.plugin === 'file-native') {
    const files = parseNoticeFiles(contentText(node.data?.content));
    if (files.length === 0) return null;
    return h(AttachToUserBubble, { files, openFile: props.openFile });
  }
  return h(OtherContext, { node });
}
