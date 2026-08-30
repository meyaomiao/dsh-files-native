/** 待发文件用全局列表:不按 sessionId 分桶,避免拦截写入 A、附件栏读 B 导致卡片空白。 */

import type { RailFile } from './lib.ts';

export interface RailItem extends RailFile {
  id: string;
  sessionId: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

const items: RailItem[] = [];
const sentBySession = new Map<string, RailFile[]>();
const sentByTurn = new Map<string, RailFile[]>();
const listeners = new Set<() => void>();
let generation = 0;

function emit(): void {
  generation += 1;
  for (const fn of [...listeners]) fn();
}

export function version(): number {
  return generation;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function pending(): readonly RailItem[] {
  return items.slice();
}

/** @deprecated 兼容旧调用,现在忽略 sessionId,返回全部待发。 */
export function list(_sessionId?: string): readonly RailItem[] {
  return items.slice();
}

export function add(sessionId: string, item: Omit<RailItem, 'sessionId'> & { sessionId?: string }): void {
  items.push({ ...item, sessionId: item.sessionId || sessionId });
  emit();
}

export function patch(sessionId: string, id: string, update: Partial<RailItem>): void {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return;
  const cur = items[index]!;
  items[index] = { ...cur, ...update, sessionId: update.sessionId ?? cur.sessionId ?? sessionId };
  emit();
}

export function remove(_sessionId: string, id: string): RailItem | undefined {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return undefined;
  const [found] = items.splice(index, 1);
  emit();
  return found;
}

export function doneFiles(sessionId: string): RailFile[] {
  const mine = sessionId === '' ? items : items.filter((item) => !item.sessionId || item.sessionId === sessionId);
  return mine.filter((item) => item.status === 'done');
}

export function archiveSent(sessionId: string): RailFile[] {
  const files = doneFiles(sessionId);
  if (files.length > 0) sentBySession.set(sessionId, files);
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i]!;
    if (item.status !== 'done') continue;
    if (sessionId !== '' && item.sessionId && item.sessionId !== sessionId) continue;
    items.splice(i, 1);
  }
  if (files.length > 0) emit();
  return files;
}

/** 对话区出现本批附件卡时清轨:路径对不上则不动,避免翻历史把新待发清掉。 */
export function archiveIfNoticeMatches(sessionId: string, notice: readonly RailFile[]): RailFile[] {
  if (notice.length === 0) return [];
  const pendingDone = doneFiles(sessionId);
  if (pendingDone.length === 0) return [];
  const paths = new Set(notice.map((file) => file.relPath));
  if (!pendingDone.some((file) => paths.has(file.relPath))) return [];
  return archiveSent(sessionId);
}

export function lastSent(sessionId: string): readonly RailFile[] {
  return sentBySession.get(sessionId) ?? [];
}

export function pinTurn(sessionId: string, turn: number, files: readonly RailFile[]): void {
  sentByTurn.set(`${sessionId}:${turn}`, [...files]);
}

export function filesForTurn(sessionId: string, turn: number): readonly RailFile[] {
  return sentByTurn.get(`${sessionId}:${turn}`) ?? lastSent(sessionId);
}

export function clear(sessionId: string): void {
  archiveSent(sessionId);
}
