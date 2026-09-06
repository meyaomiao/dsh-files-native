/**
 * 气泡附件卡:不依赖槽位选举,插件自带巡检。
 * 官方注入行折叠时只渲染摘要「📎 附件 N 个文件」(完整清单不在 DOM 里),所以:
 * 1) 按摘要文本识别本插件的通知行(最新一行);
 * 2) 文件清单从 host /plugins/file-native/last 拉取(注入时已记录);
 * 3) 文件卡挂进该行相邻用户消息的气泡栈,插为栈的第一个子元素——即显示在文字
 *    气泡上方、与图片同列右对齐;找不到气泡栈时退回渲染在注入行内部。
 * 禁用 MutationObserver(流式回复卡死),用 300ms 短轮询。
 */

import { createElement as h, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { extOf, formatSize, type RailFile } from './lib.ts';
import { ensureStyles } from './styles.ts';

function isFileNoticeRow(el: Element): boolean {
  const text = el.textContent ?? '';
  return text.includes('📎 附件') && text.includes('个文件');
}

function FileCard({ file, onOpen }: { file: RailFile; onOpen?: (file: RailFile) => void }): ReactElement {
  return h('button', {
    type: 'button',
    className: 'fr-msg-card',
    title: file.relPath,
    onClick: () => onOpen?.(file),
  },
    h('span', { className: 'fr-ext' }, extOf(file.name)),
    h('span', { className: 'fr-copy' },
      h('span', { className: 'fr-name' }, file.name),
      file.size > 0 ? h('span', { className: 'fr-meta' }, formatSize(file.size)) : null,
    ),
  );
}

/** 当前官方用户消息结构:userRow > userStack(栈内先图片槽后文字气泡,右对齐)。 */
function userStackOf(el: Element | null): HTMLElement | null {
  if (!(el instanceof HTMLElement)) return null;
  const kind = el.getAttribute('data-chat-flow-kind');
  if (kind !== 'user' && kind !== 'steering') return null;
  return el.querySelector('[class*="userStack"]') as HTMLElement | null;
}

function findUserStack(notice: Element): HTMLElement | null {
  let next: Element | null = notice.nextElementSibling;
  let prev: Element | null = notice.previousElementSibling;
  for (let hop = 0; hop < 16; hop += 1) {
    const stack = userStackOf(next) ?? userStackOf(prev);
    if (stack !== null) return stack;
    next = next?.nextElementSibling ?? null;
    prev = prev?.previousElementSibling ?? null;
  }
  return null;
}

/** 气泡栈:插为第一个子元素(栈是 align-items:flex-end 的纵向 flex → 卡片在文字上方右对齐)。 */
function placeHostInStack(stack: HTMLElement): HTMLElement {
  let el = stack.querySelector(':scope > [data-file-native-msg]') as HTMLElement | null;
  if (el === null) {
    el = document.createElement('div');
    el.dataset.fileNativeMsg = '';
    el.className = 'fr-msg-row';
    stack.insertBefore(el, stack.firstChild);
  }
  return el;
}

/** 兜底:找不到气泡栈时,渲染在注入行内部。 */
function placeHostInRow(notice: Element): HTMLElement {
  let el = notice.querySelector(':scope > [data-file-native-msg]') as HTMLElement | null;
  if (el === null) {
    el = document.createElement('div');
    el.dataset.fileNativeMsg = '';
    el.style.cssText = 'flex:0 0 100%;display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;padding:2px 44px 8px 22px;width:100%;box-sizing:border-box';
    notice.appendChild(el);
  }
  return el;
}

interface Hosted {
  host: HTMLElement;
  files: RailFile[];
}

export function MessageCards(props: { sessionId?: string; onOpen?: (file: RailFile) => void }): ReactElement | null {
  ensureStyles();
  const [hosted, setHosted] = useState<Hosted[]>([]);
  const sessionKey = useRef('');
  const lastCount = useRef(-1);
  const cachedFiles = useRef<RailFile[] | null>(null);

  useEffect(() => {
    if (sessionKey.current !== (props.sessionId ?? '')) {
      sessionKey.current = props.sessionId ?? '';
      lastCount.current = -1;
      cachedFiles.current = null;
    }
    let cancelled = false;
    const tick = (): void => {
      if (cancelled) return;
      const run = async (): Promise<void> => {
        const rows = [...document.querySelectorAll('[data-chat-flow-kind="context"]')]
          .filter((el) => isFileNoticeRow(el));
        if (rows.length === 0) {
          if (lastCount.current !== 0) {
            lastCount.current = 0;
            setHosted([]);
          }
          return;
        }
        if (rows.length !== lastCount.current) {
          // 出现了新的通知行:拉取最近一次发送的文件清单(host 在注入时记录)
          const sid = props.sessionId ?? '';
          if (sid !== '') {
            try {
              const res = await fetch(`/plugins/file-native/last?sessionId=${encodeURIComponent(sid)}`);
              const body = await res.json() as { files?: RailFile[] };
              cachedFiles.current = Array.isArray(body.files) ? body.files : [];
            } catch {
              cachedFiles.current = cachedFiles.current ?? [];
            }
          }
          lastCount.current = rows.length;
        }
        const files = cachedFiles.current ?? [];
        if (files.length === 0) return;
        const latest = rows[rows.length - 1]!;
        const stack = findUserStack(latest);
        const host = stack !== null ? placeHostInStack(stack) : placeHostInRow(latest);
        if (stack !== null) {
          // 卡片已取代注入行的信息职能,把该行藏掉(锚点触发 :has CSS)。
          if (latest.querySelector('[data-file-native-anchor]') === null) {
            const anchor = document.createElement('span');
            anchor.dataset.fileNativeAnchor = '';
            anchor.setAttribute('aria-hidden', 'true');
            latest.appendChild(anchor);
          }
        }
        setHosted((prev) => {
          if (prev.length === 1 && prev[0]!.host === host) return prev;
          return [{ host, files }];
        });
      };
      void run().catch(() => {}).then(() => {
        if (!cancelled) window.setTimeout(tick, 300);
      });
    };
    tick();
    return () => { cancelled = true; };
  }, [props.sessionId]);

  if (hosted.length === 0) return null;
  return h('span', { 'aria-hidden': true },
    ...hosted.map((item, i) => createPortal(
      h('div', { className: 'fr-msg-row-inner' },
        ...item.files.map((file) => h(FileCard, { key: file.relPath, file, onOpen: props.onOpen })),
      ),
      item.host,
      `file-native-cards-${i}`,
    )),
  );
}
