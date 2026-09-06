import type { ReactNode } from 'react';
import type { RailFile } from './lib.ts';

export type { RailFile };

export interface DraftImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface AttachmentsOwner {
  attachments: readonly DraftImage[];
  canAcceptDrop: boolean;
  onAddImages: (files: readonly File[]) => void;
  onRemoveImage: (id: string) => void;
  sessionId?: string;
  dropLimits?: { readonly count: number; readonly size: string };
}

/** 可选 peer:装了 better-sidebar 时非 undefined,能力用 features 探测。 */
export interface SidebarService {
  readonly features: readonly string[];
  openFile(scope: { sessionId: string }, path: string, title?: string): void;
}

export interface ClientCtx {
  effect: (fn: () => (() => void) | void, label?: string) => void;
  slots: {
    inject: (name: string, factory: () => () => void) => void;
    register: (opts: Record<string, unknown>, component: unknown) => () => void;
  };
  logger?: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };
  betterSidebar?: SidebarService;
}

export type SlotComponent = (props: Record<string, unknown>) => ReactNode;
