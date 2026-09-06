/** 混排附件轨:官方 64px 图缩略图 + 可读横条文件卡。 */

import { createElement as h, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { extOf, formatSize, MAX_FILE_BYTES, MAX_FILES_PER_BATCH, splitIntake } from './lib.ts';
import * as store from './store.ts';
import type { RailItem } from './store.ts';
import { ensureStyles } from './styles.ts';
import { IconChevronLeft, IconChevronRight, IconClose } from './icons.tsx';
import type { AttachmentsOwner, DraftImage } from './types.ts';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function uploadFile(sessionId: string, file: File): Promise<store.RailItem> {
  const id = uid();
  const pending: RailItem = {
    id,
    sessionId,
    name: file.name,
    relPath: '',
    size: file.size,
    mediaType: file.type || 'application/octet-stream',
    status: 'uploading',
  };
  store.add(sessionId, pending);
  const url = `/plugins/file-native/upload?sessionId=${encodeURIComponent(sessionId)}&name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`;
  try {
    const res = await fetch(url, { method: 'POST', body: file });
    const body = await res.json() as { ok?: boolean; file?: { name: string; relPath: string; size: number; mediaType: string }; error?: string };
    if (!res.ok || !body.ok || body.file === undefined) {
      store.patch(sessionId, id, { status: 'error', error: body.error ?? '上传失败' });
      return { ...pending, status: 'error', error: body.error ?? '上传失败' };
    }
    store.patch(sessionId, id, {
      status: 'done',
      name: body.file.name,
      relPath: body.file.relPath,
      size: body.file.size,
      mediaType: body.file.mediaType,
    });
    return { ...pending, ...body.file, status: 'done' };
  } catch {
    store.patch(sessionId, id, { status: 'error', error: '网络错误' });
    return { ...pending, status: 'error', error: '网络错误' };
  }
}

function intake(sessionId: string, files: readonly File[], onAddImages: (files: readonly File[]) => void): void {
  if (files.length === 0) return;
  if (files.length > MAX_FILES_PER_BATCH) {
    store.add(sessionId, {
      id: uid(),
      sessionId,
      name: '批次过大',
      relPath: '',
      size: 0,
      mediaType: '',
      status: 'error',
      error: `一次最多 ${MAX_FILES_PER_BATCH} 个文件`,
    });
    return;
  }
  const oversize = files.find((file) => file.size > MAX_FILE_BYTES);
  if (oversize) {
    store.add(sessionId, {
      id: uid(),
      sessionId,
      name: oversize.name,
      relPath: '',
      size: oversize.size,
      mediaType: oversize.type,
      status: 'error',
      error: '超过 50 MB',
    });
    return;
  }
  const { images, others } = splitIntake(files);
  if (images.length > 0) onAddImages(images);
  for (const file of others) void uploadFile(sessionId, file);
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }): ReactElement {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return h('div', { className: 'fr-lightbox', role: 'dialog', 'aria-label': alt, onClick: onClose },
    h('img', { src, alt, onClick: (event: { stopPropagation: () => void }) => event.stopPropagation() }),
  );
}

function ImageTile({ item, onRemove, onOpen }: { item: DraftImage; onRemove: () => void; onOpen: () => void }): ReactElement {
  return h('div', { className: 'fr-item fr-item-image' },
    h('button', { type: 'button', className: 'fr-thumb', title: item.file.name, onClick: onOpen },
      h('img', { src: item.previewUrl, alt: item.file.name }),
    ),
    h('button', { type: 'button', className: 'fr-remove', 'aria-label': `移除 ${item.file.name}`, onClick: onRemove }, h(IconClose)),
  );
}

function FileTile({ item, sessionId }: { item: RailItem; sessionId: string }): ReactElement {
  const remove = (): void => {
    const sid = item.sessionId || sessionId;
    store.remove(sid, item.id);
    if (item.relPath) {
      void fetch(`/plugins/file-native/remove?sessionId=${encodeURIComponent(sid)}&path=${encodeURIComponent(item.relPath)}`, { method: 'POST' });
    }
  };
  const meta = item.status === 'uploading' ? '上传中…' : item.status === 'error' ? (item.error ?? '失败') : formatSize(item.size);
  return h('div', { className: 'fr-item', title: item.error ?? (item.relPath || item.name) },
    h('div', { className: 'fr-card', 'data-status': item.status },
      h('span', { className: 'fr-ext' }, extOf(item.name)),
      h('span', { className: 'fr-copy' },
        h('span', { className: 'fr-name' }, item.name),
        h('span', { className: 'fr-meta' }, meta),
      ),
    ),
    h('button', { type: 'button', className: 'fr-remove', 'aria-label': `移除 ${item.name}`, onClick: remove }, h(IconClose)),
  );
}

export function FileRail(props: AttachmentsOwner & { sessionId?: string }): ReactElement | null {
  ensureStyles();
  const sessionId = String(props.sessionId ?? '');
  const [files, setFiles] = useState<readonly RailItem[]>(() => store.pendingFor(sessionId));
  const [, setVersion] = useState(() => store.version());
  const [preview, setPreview] = useState<DraftImage | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const rowRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef(0);

  useEffect(() => {
    const sync = (): void => {
      setFiles(store.pendingFor(sessionId));
      setVersion(store.version());
    };
    sync();
    return store.subscribe(sync);
  }, [sessionId]);

  const updateEdges = (): void => {
    const el = rowRef.current;
    if (el === null) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
    setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  };

  const itemCount = props.attachments.length + files.length;
  useLayoutEffect(() => {
    const grew = countRef.current !== 0 && itemCount > countRef.current;
    countRef.current = itemCount;
    const el = rowRef.current;
    if (el === null) return;
    if (grew) el.scrollLeft = el.scrollWidth - el.clientWidth;
    updateEdges();
  }, [itemCount]);

  useEffect(() => {
    const el = rowRef.current;
    if (el === null) return;
    let disconnect = (): void => {};
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateEdges);
      observer.observe(el);
      disconnect = () => observer.disconnect();
    }
    const onWheel = (event: WheelEvent): void => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      el.scrollBy({ left: Math.sign(event.deltaY) * Math.min(Math.abs(event.deltaY), 60), behavior: 'auto' });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      disconnect();
      el.removeEventListener('wheel', onWheel);
    };
  }, [itemCount]);

  const page = (direction: number): void => {
    const el = rowRef.current;
    if (el === null) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth - 64, 200), behavior: 'smooth' });
  };

  const hasImages = props.attachments.length > 0;
  const hasFiles = files.length > 0;
  if (!hasImages && !hasFiles) return null;

  return h('div', { className: 'fr-rail', 'data-file-native': true },
    h('div', { style: { position: 'relative' } },
      edges.left ? h('button', { type: 'button', className: 'fr-arrow fr-arrow-left', 'aria-label': '向左', onClick: () => page(-1) }, h(IconChevronLeft)) : null,
      h('div', { className: 'fr-row', role: 'group', 'aria-label': '附件', ref: rowRef, onScroll: updateEdges },
        ...props.attachments.map((item) => h(ImageTile, {
          key: item.id,
          item,
          onRemove: () => props.onRemoveImage(item.id),
          onOpen: () => setPreview(item),
        })),
        ...files.map((item) => h(FileTile, { key: item.id, item, sessionId })),
      ),
      edges.right ? h('button', { type: 'button', className: 'fr-arrow fr-arrow-right', 'aria-label': '向右', onClick: () => page(1) }, h(IconChevronRight)) : null,
    ),
    preview ? h(Lightbox, { src: preview.previewUrl, alt: preview.file.name, onClose: () => setPreview(null) }) : null,
  );
}

export function intakeFiles(sessionId: string, files: readonly File[], onAddImages: (files: readonly File[]) => void): void {
  intake(sessionId, files, onAddImages);
}
