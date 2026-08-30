import { createElement as h } from 'react';
import type { ReactElement } from 'react';

export function IconPaperclip({ size = 16 }: { size?: number }): ReactElement {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
    'aria-hidden': true,
  },
    h('path', {
      d: 'M9.2 4.4 4.55 9.05a2.4 2.4 0 1 0 3.4 3.4l5.15-5.15a3.6 3.6 0 0 0-5.1-5.1L3.15 7.05',
      stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round',
    }),
  );
}

export function IconChevronLeft({ size = 14 }: { size?: number }): ReactElement {
  return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
    h('path', { d: 'M10 3.5 5.5 8 10 12.5', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' }),
  );
}

export function IconChevronRight({ size = 14 }: { size?: number }): ReactElement {
  return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
    h('path', { d: 'M6 3.5 10.5 8 6 12.5', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' }),
  );
}

export function IconClose({ size = 12 }: { size?: number }): ReactElement {
  return h('svg', { width: size, height: size, viewBox: '0 0 12 12', fill: 'none', 'aria-hidden': true },
    h('path', { d: 'M3 3l6 6M9 3 3 9', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round' }),
  );
}

/** 官方 DropOverlay 倾斜照片/便签卡（DeepSeek Chat 同款路径）。 */
export function UploadIllustration(): ReactElement {
  return h('svg', { width: '115', height: '84', viewBox: '0 0 115 84', fill: 'none', 'aria-hidden': true },
    h('g', { clipPath: 'url(#frDropClip)' },
      h('rect', { y: '17.0742', width: '44.1832', height: '43.6431', rx: '12', transform: 'rotate(-22.7338 0 17.0742)', fill: '#9CE5ED' }),
      h('rect', { x: '73.4043', y: '8.54297', width: '43.7267', height: '50.5284', rx: '8', transform: 'rotate(17.403 73.4043 8.54297)', fill: '#679EFE' }),
      h('path', { d: 'M30.4917 28.1369L40.8865 33.4564L37.2232 34.9524L29.5302 31.0159L26.7919 39.2122L23.1285 40.7082L26.8287 29.6338L16.8967 24.5516L20.5601 23.0556L27.7902 26.7549L30.3639 19.052L34.0273 17.556L30.4917 28.1369Z', fill: 'white' }),
      h('path', { d: 'M77.5088 26.3047L101.057 33.7966', stroke: 'white', strokeWidth: '3' }),
      h('path', { d: 'M72.2646 42.7871L86.3938 47.2823', stroke: 'white', strokeWidth: '3' }),
      h('path', { d: 'M74.8867 34.5469L98.4353 42.0388', stroke: 'white', strokeWidth: '3' }),
      h('rect', { x: '31.583', y: '38.6641', width: '44.9157', height: '44.3666', rx: '12', transform: 'rotate(-0.134233 31.583 38.6641)', fill: '#3964FE' }),
      h('path', { d: 'M38.9521 73.0337C39.6129 71.7086 41.7113 66.0937 43.5113 61.1663C44.1607 59.3885 46.7484 59.3923 47.4591 61.1465C48.9728 64.8828 50.7969 68.6922 51.9988 69.1925C54.2946 70.1482 57.9854 59.3573 68.0064 70.1801', stroke: 'white', strokeWidth: '3' }),
      h('circle', { cx: '60.6157', cy: '52.247', r: '4.38794', transform: 'rotate(22.5996 60.6157 52.247)', fill: 'white' }),
    ),
    h('defs', null, h('clipPath', { id: 'frDropClip' }, h('rect', { width: '115', height: '84', fill: 'white' }))),
  );
}
