/** 整页拖入 / 粘贴:捕获阶段接管,深度计数防闪烁,Esc 取消,合成 dragend 复位官方 overlay。 */

import { classifyPasteFiles, decidePasteAction } from './lib.ts';

export interface InterceptHandlers {
  onFiles: (files: File[]) => void;
  /** 粘贴混贴时图走视觉桥/官方;纯图粘贴不调用(事件已让出)。 */
  onImages?: (files: File[]) => void;
  canAccept: () => boolean;
  onDepth?: (depth: number) => void;
}

interface State {
  depth: number;
  aborted: boolean;
}

function looksLikeFileDrag(transfer: DataTransfer | null): boolean {
  if (transfer === null) return false;
  const types = Array.from(transfer.types);
  return types.length === 0 || types.includes('Files');
}

export function installFileIntercept(handlers: InterceptHandlers): () => void {
  const state: State = { depth: 0, aborted: false };

  const reset = (): void => {
    state.depth = 0;
    state.aborted = false;
  };

  const onDragEnter = (event: DragEvent): void => {
    if (!looksLikeFileDrag(event.dataTransfer) || !handlers.canAccept()) return;
    event.preventDefault();
    event.stopPropagation();
    state.aborted = false;
    state.depth += 1;
    handlers.onDepth?.(state.depth);
  };

  const onDragOver = (event: DragEvent): void => {
    if (!looksLikeFileDrag(event.dataTransfer) || !handlers.canAccept()) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  };

  const onDragLeave = (event: DragEvent): void => {
    if (!looksLikeFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    event.stopPropagation();
    state.depth = Math.max(0, state.depth - 1);
    const leavingViewport = event.clientX <= 0 || event.clientY <= 0
      || event.clientX >= window.innerWidth || event.clientY >= window.innerHeight;
    if (state.depth === 0 || leavingViewport) {
      reset();
      handlers.onDepth?.(0);
      return;
    }
    handlers.onDepth?.(state.depth);
  };

  const onDrop = (event: DragEvent): void => {
    if (!looksLikeFileDrag(event.dataTransfer) && (event.dataTransfer?.files.length ?? 0) === 0) return;
    event.preventDefault();
    event.stopPropagation();
    const aborted = state.aborted;
    const files = Array.from(event.dataTransfer?.files ?? []);
    reset();
    handlers.onDepth?.(0);
    try {
      window.dispatchEvent(new DragEvent('dragend'));
    } catch {
      // 旧引擎不支持 DragEvent 构造
    }
    if (aborted || !handlers.canAccept() || files.length === 0) return;
    handlers.onFiles(files);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || state.depth === 0) return;
    event.preventDefault();
    event.stopPropagation();
    state.aborted = true;
    reset();
    handlers.onDepth?.(0);
  };

  const onPaste = (event: ClipboardEvent): void => {
    if (!handlers.canAccept()) return;
    const fromList = Array.from(event.clipboardData?.files ?? []);
    const fromItems = Array.from(event.clipboardData?.items ?? [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    const files = fromList.length > 0 ? fromList : fromItems;
    if (files.length === 0) return;
    const { images, others } = classifyPasteFiles(files);
    const action = decidePasteAction(images.length, others.length);
    // 只有图:不 preventDefault,让 ModLens / toolkit / 官方自己处理。
    if (action === 'yield') return;
    event.preventDefault();
    event.stopPropagation();
    if (others.length > 0) handlers.onFiles(others);
    if (action === 'split' && images.length > 0) handlers.onImages?.(images);
  };

  document.addEventListener('dragenter', onDragEnter, true);
  document.addEventListener('dragover', onDragOver, true);
  document.addEventListener('dragleave', onDragLeave, true);
  document.addEventListener('drop', onDrop, true);
  document.addEventListener('paste', onPaste, true);
  window.addEventListener('keydown', onKeyDown, true);

  return () => {
    document.removeEventListener('dragenter', onDragEnter, true);
    document.removeEventListener('dragover', onDragOver, true);
    document.removeEventListener('dragleave', onDragLeave, true);
    document.removeEventListener('drop', onDrop, true);
    document.removeEventListener('paste', onPaste, true);
    window.removeEventListener('keydown', onKeyDown, true);
  };
}
