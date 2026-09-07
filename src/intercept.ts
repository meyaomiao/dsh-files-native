/** 整页拖入 / 粘贴:捕获阶段接管,深度计数防闪烁,Esc 取消,合成 dragend 复位官方 overlay。 */

import { planPaste } from './lib.ts';

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
    const plan = planPaste(files);
    // 纯官方四类图:不 preventDefault,官方/ModLens 自己处理(无视觉桥时官方出缩略图)。
    if (plan.action === 'yield') return;
    event.preventDefault();
    // immediate:已经决定这些文件的归属(文件卡/异步探测),别让后注册的视觉监听双写。
    event.stopImmediatePropagation();
    if (plan.cards.length > 0) handlers.onFiles(plan.cards);
    if (plan.nativeImages.length > 0) handlers.onImages?.(plan.nativeImages);
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
