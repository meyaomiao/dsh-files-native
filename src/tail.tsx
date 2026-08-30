/** 回合尾巴:shadow 官方产物行,同一处画「附件 + 产物」,chip 点开走 openFile。 */

import { createElement as h, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { ensureStyles } from './styles.ts';
import type { RailFile } from './lib.ts';
import * as store from './store.ts';

export interface TailMatch {
  uploaded: readonly RailFile[];
  produced: readonly string[];
}

interface TailProps {
  sessionId?: string;
  openFile?: (path: string) => void;
  matched?: TailMatch | null;
  turn?: number;
}

function basename(path: string): string {
  const at = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return at === -1 ? path : path.slice(at + 1);
}

function ChipRow({ label, items, open }: { label: string; items: readonly { name: string; path: string }[]; open: (path: string) => void }): ReactElement | null {
  if (items.length === 0) return null;
  const shown = items.slice(0, 6);
  const hidden = items.length - shown.length;
  return h('div', { className: 'fr-tail' },
    h('span', { className: 'fr-tail-label' }, label),
    h('div', { className: 'fr-tail-row' },
      ...shown.map((item) => h('button', {
        key: item.path,
        type: 'button',
        className: 'fr-chip',
        title: item.path,
        onClick: () => open(item.path),
      }, item.name)),
      hidden > 0 ? h('span', { className: 'fr-more' }, `+ ${hidden} 个文件`) : null,
    ),
  );
}

export function UploadedTail(props: TailProps): ReactElement | null {
  ensureStyles();
  const sessionId = String(props.sessionId ?? '');
  const [uploaded, setUploaded] = useState<readonly RailFile[]>(
    props.matched?.uploaded ?? (props.turn !== undefined ? store.filesForTurn(sessionId, props.turn) : store.lastSent(sessionId)),
  );

  useEffect(() => {
    if (props.matched?.uploaded) {
      setUploaded(props.matched.uploaded);
      return;
    }
    let cancelled = false;
    void fetch(`/plugins/file-native/last?sessionId=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((body: { files?: RailFile[] }) => {
        if (!cancelled && Array.isArray(body.files) && body.files.length > 0) setUploaded(body.files);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sessionId, props.matched, props.turn]);

  const produced = props.matched?.produced ?? [];
  if (uploaded.length === 0 && produced.length === 0) return null;
  const open = props.openFile ?? ((path: string) => { window.open(path, '_blank'); });

  return h('div', { 'data-file-native-tail': true },
    h(ChipRow, {
      label: '附件',
      items: uploaded.map((file) => ({ name: file.name, path: file.relPath })),
      open,
    }),
    h(ChipRow, {
      label: '产物',
      items: produced.map((path) => ({ name: basename(path), path })),
      open,
    }),
  );
}

export function producedPathsOf(owner: {
  turn?: { data?: { get?: (key: string) => { produced?: readonly { path: string; seq: number }[] } | undefined } };
  seq?: number;
}): string[] {
  const data = owner.turn?.data?.get?.('deliverables');
  const seq = owner.seq ?? Number.POSITIVE_INFINITY;
  if (!data?.produced) return [];
  const paths: string[] = [];
  const seen = new Set<string>();
  for (const item of data.produced) {
    if (item.seq > seq || seen.has(item.path)) continue;
    seen.add(item.path);
    paths.push(item.path);
  }
  return paths;
}
