/** 插件启动后常驻的附件 owner / 拖入深度,不依赖 FileRail 是否画出卡片。 */

import type { AttachmentsOwner } from './types.ts';

export interface LiveOwner extends AttachmentsOwner {
  sessionId: string;
}

let owner: LiveOwner | null = null;
let lastSessionId = '';
let dragDepth = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of [...listeners]) fn();
}

export function subscribeLive(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function setLiveOwner(next: LiveOwner | null): void {
  owner = next;
  if (next?.sessionId) lastSessionId = next.sessionId;
  emit();
}

export function getLiveOwner(): LiveOwner | null {
  return owner;
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
