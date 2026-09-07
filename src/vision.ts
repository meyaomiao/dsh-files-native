/**
 * 可选视觉桥探测:不 inject 对方服务。
 * GET /modlens/paste?model= 的 takeover 为 true 时,图走 POST 插路径,不进官方 imageIds。
 */

import { addImages } from './live.ts';

function currentModelLabel(): string {
  const buttons = document.querySelectorAll('button[aria-label]');
  for (const button of buttons) {
    const label = button.getAttribute('aria-label') ?? '';
    if (/选择模型|select model|current model/i.test(label)) return label;
  }
  return '';
}

function insertComposerText(text: string): void {
  const active = document.activeElement;
  const el = active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement
    ? active
    : document.querySelector('[data-composer-card] textarea');
  if (!(el instanceof HTMLTextAreaElement) && !(el instanceof HTMLInputElement)) return;
  el.focus();
  let inserted = false;
  try {
    inserted = document.execCommand('insertText', false, text);
  } catch {
    inserted = false;
  }
  if (inserted) return;
  const proto = el instanceof HTMLTextAreaElement
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, `${el.value}${text}`);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export async function probeModlensTakeover(): Promise<boolean> {
  const label = currentModelLabel();
  try {
    const res = await fetch(`/modlens/paste?model=${encodeURIComponent(label)}`);
    if (res.status === 404 || !res.ok) return false;
    const body = await res.json() as { takeover?: boolean };
    return body.takeover === true;
  } catch {
    return false;
  }
}

async function uploadModlensPaste(file: File): Promise<string | undefined> {
  const res = await fetch('/modlens/paste', { method: 'POST', body: await file.arrayBuffer() });
  if (!res.ok) return undefined;
  const body = await res.json() as { path?: string };
  return typeof body.path === 'string' && body.path !== '' ? body.path : undefined;
}

/** 官方图:ModLens takeover 则插路径;否则走 onAddImages。 */
export async function deliverImages(sessionId: string, files: readonly File[]): Promise<void> {
  if (files.length === 0) return;
  const takeover = await probeModlensTakeover();
  if (!takeover) {
    addImages(sessionId, files);
    return;
  }
  const paths: string[] = [];
  for (const file of files) {
    try {
      const path = await uploadModlensPaste(file);
      if (path !== undefined) paths.push(path);
    } catch {
      // 单张失败不阻断其余
    }
  }
  if (paths.length === 0) {
    addImages(sessionId, files);
    return;
  }
  insertComposerText(`${paths.join(' ')} `);
}
