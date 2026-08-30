/** 从回形针锚点把轨插进 composer 卡片内部、草稿文字上方。不依赖 attachments shadow。 */

import { createElement as h, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { FileRail } from './rail.tsx';
import * as store from './store.ts';
import { currentSessionId, getLiveOwner, subscribeLive } from './live.ts';
import { ensureStyles } from './styles.ts';

function placeHost(anchor: HTMLElement | null): HTMLElement | null {
  const card = anchor?.closest('[data-composer-card]') as HTMLElement | null;
  if (card === null) return null;
  let el = card.querySelector('[data-file-native-host]') as HTMLElement | null;
  if (el === null) {
    el = document.createElement('div');
    el.dataset.fileNativeHost = '';
  }
  const scroll = card.querySelector('[data-input-scroll]');
  if (el.parentElement !== card || (scroll !== null && el.nextElementSibling !== scroll)) {
    if (scroll !== null) card.insertBefore(el, scroll);
    else if (el.parentElement !== card) card.insertBefore(el, card.firstChild);
  }
  return el;
}

export function ComposerRail(props: { sessionId?: string }): ReactElement {
  ensureStyles();
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [, bump] = useState(0);

  useEffect(() => {
    const a = store.subscribe(() => bump((n) => n + 1));
    const b = subscribeLive(() => bump((n) => n + 1));
    return () => { a(); b(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const tick = (): void => {
      if (cancelled) return;
      const el = placeHost(anchorRef.current);
      if (el !== null) {
        setHost((prev) => (prev === el ? prev : el));
        return;
      }
      tries += 1;
      if (tries < 30) window.setTimeout(tick, 50);
    };
    tick();
    return () => { cancelled = true; };
  }, []);

  const live = getLiveOwner();
  const rail = h(FileRail, {
    attachments: live?.attachments ?? [],
    canAcceptDrop: live?.canAcceptDrop ?? true,
    onAddImages: live?.onAddImages ?? (() => {}),
    onRemoveImage: live?.onRemoveImage ?? (() => {}),
    sessionId: live?.sessionId || props.sessionId || currentSessionId(),
    dropLimits: live?.dropLimits,
  });

  return h('span', {
    ref: anchorRef,
    'aria-hidden': true,
    style: { position: 'absolute', width: 0, height: 0, overflow: 'hidden' },
  }, host !== null && host.isConnected ? createPortal(rail, host) : null);
}
