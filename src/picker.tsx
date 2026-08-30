/** 输入框工具行回形针:官方线标,任意类型、可多选。 */

import { createElement as h, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { ensureStyles } from './styles.ts';
import { intakeFiles } from './rail.tsx';
import { IconPaperclip } from './icons.tsx';
import { DropMask } from './overlay.tsx';
import { ComposerRail } from './rail-portal.tsx';
import { currentSessionId, getDragDepth, getLiveOwner, rememberSessionId, subscribeLive } from './live.ts';

export function PaperclipButton(props: { sessionId?: string }): ReactElement {
  ensureStyles();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(() => getDragDepth() > 0);
  const sessionId = String(props.sessionId || currentSessionId());
  rememberSessionId(sessionId);
  useEffect(() => subscribeLive(() => setDrag(getDragDepth() > 0)), []);

  const onChange = (event: { currentTarget: HTMLInputElement }): void => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    const live = getLiveOwner();
    const sid = String(props.sessionId || live?.sessionId || currentSessionId());
    if (files.length === 0) return;
    intakeFiles(sid, files, live?.onAddImages ?? (() => {}));
  };

  return h('span', null,
    h(ComposerRail, { sessionId }),
    drag ? h(DropMask) : null,
    h('button', {
      type: 'button',
      className: 'fr-pick',
      title: '上传文件',
      'aria-label': '上传文件',
      onClick: () => inputRef.current?.click(),
    }, h(IconPaperclip, { size: 16 })),
    h('input', {
      ref: inputRef,
      className: 'fr-hidden',
      type: 'file',
      multiple: true,
      onChange,
    }),
  );
}
