/** 全屏拖入遮罩:portal 到 body,空轨时也能盖住官方「仅支持图片」。 */

import { createElement as h, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { UploadIllustration } from './icons.tsx';

export function DropMask(): ReactElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.body);
  }, []);
  const node = h('div', { className: 'fr-mask', role: 'status' },
    h('div', { className: 'fr-wrap' },
      h('div', { className: 'fr-illust' }, h(UploadIllustration)),
      h('div', { className: 'fr-title' }, '松开以添加文件'),
      h('div', { className: 'fr-desc' }, '图片进入草稿图栏，其它文件保存到工作区'),
    ),
  );
  return target ? createPortal(node, target) : node;
}
