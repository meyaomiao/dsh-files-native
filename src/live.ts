/** 插件启动后常驻的附件 owner / 拖入深度,不依赖 FileRail 是否画出卡片。 */

import type { AttachmentsOwner } from './types.ts';

export interface LiveOwner extends AttachmentsOwner {
  sessionId: string;
}

let owner: LiveOwner | null = null;
let lastSessionId = '';
let dragDepth = 0;
let generation = 0;
const listeners = new Set<() => void>();
/** 槽还没挂上时先攒着,owner 就位再交给官方 onAddImages。 */
const queuedImages = new Map<string, File[]>();

function emit(): void {
  for (const fn of [...listeners]) fn();
}

export function subscribeLive(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function flushQueuedImages(): void {
  if (!owner?.onAddImages) return;
  const sid = owner.sessionId;
  const files = (queuedImages.get(sid) ?? []).concat(sid ? queuedImages.get('') ?? [] : []);
  queuedImages.delete(sid);
  if (sid) queuedImages.delete('');
  if (files.length === 0) return;
  owner.onAddImages(files);
}

/** 挂上当前会话附件槽。返回 generation,卸载时交给 clearLiveOwner。 */
export function setLiveOwner(next: LiveOwner | null): number {
  generation += 1;
  owner = next;
  if (next?.sessionId) lastSessionId = next.sessionId;
  emit();
  if (next) flushQueuedImages();
  return generation;
}

/** 只清自己挂上的那一档,避免旧槽卸载时把新槽清掉。 */
export function clearLiveOwner(token: number): void {
  if (token !== generation) return;
  owner = null;
  emit();
}

export function getLiveOwner(): LiveOwner | null {
  return owner;
}

/** 图片走当前会话官方 onAddImages;槽未就绪则按 sessionId 排队,禁止吞成空函数。 */
export function addImages(sessionId: string, files: readonly File[]): void {
  if (files.length === 0) return;
  const sid = sessionId || currentSessionId();
  if (owner?.onAddImages && (!owner.sessionId || owner.sessionId === sid)) {
    owner.onAddImages(files);
    return;
  }
  const key = sid || owner?.sessionId || lastSessionId;
  const prev = queuedImages.get(key) ?? [];
  queuedImages.set(key, prev.concat([...files]));
}

export function setDragDepth(depth: number): void {
  const next = Math.max(0, depth);
  if (next === dragDepth) return;
  dragDepth = next;
  emit();
}

export function getDragDepth(): number {
  return dragDepth;
}

export function rememberSessionId(id: string): void {
  if (id) lastSessionId = id;
}

export function currentSessionId(): string {
  return owner?.sessionId || lastSessionId;
}

/** 只读槽位快照,禁止调用 useSession / useInput(那是 React hook,条件调用会把整颗回形针打成 slot-error)。 */
export function resolveSessionId(props: {
  sessionId?: string;
  session?: { id?: string };
}): string {
  if (props.sessionId) return String(props.sessionId);
  if (props.session?.id) return String(props.session.id);
  return currentSessionId();
}

/** @internal 单测复位。 */
export function resetLiveForTests(): void {
  owner = null;
  lastSessionId = '';
  dragDepth = 0;
  generation = 0;
  queuedImages.clear();
  listeners.clear();
}
