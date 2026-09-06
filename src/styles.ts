/** 令牌驱动样式,类名 fr-* 隔离。 */

export const FR_CSS = `
.fr-rail,.fr-rail *{box-sizing:border-box}
[data-file-native-host]{flex:none;min-width:0;overflow:visible;padding:0}
[data-file-native-host]:empty,[data-file-native-host]:not(:has(.fr-rail)){display:none!important}
.fr-rail{min-width:0;position:relative;padding:4px 12px 0;overflow:visible;flex:none}
.fr-row{scrollbar-width:none;--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);gap:10px;display:flex;overflow-x:auto;overflow-y:hidden;padding:0;align-items:center;min-height:64px}
.fr-row::-webkit-scrollbar{display:none}
.fr-item{flex:none;height:64px;position:relative}
.fr-item-image{flex:0 0 64px;width:64px}
.fr-thumb{border:1px solid var(--dsw-alias-border-l2-darkmode-thin, var(--dsw-alias-border-l4));
  background:var(--dsw-alias-interactive-bg-hover);cursor:zoom-in;border-radius:16px;width:64px;height:64px;
  padding:0;overflow:hidden}
.fr-thumb img{object-fit:cover;width:100%;height:100%;display:block}
.fr-card{border:1px solid var(--dsw-alias-border-l2-darkmode-thin, var(--dsw-alias-border-l4));
  background:var(--dsw-alias-interactive-bg-hover);border-radius:16px;height:64px;min-width:168px;max-width:240px;
  padding:8px 28px 8px 10px;display:flex;align-items:center;gap:10px;cursor:default}
.fr-card[data-status="error"]{border-color:var(--dsw-alias-state-danger-primary, #d94c4c)}
.fr-ext{font:var(--dsw-font-xxxs-11, 11px/14px ui-sans-serif,system-ui);font-weight:700;letter-spacing:.3px;
  color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2, var(--dsw-alias-border-l4));
  border-radius:8px;padding:6px 7px;line-height:1;flex:none;min-width:36px;text-align:center}
.fr-copy{min-width:0;display:flex;flex-direction:column;gap:2px}
.fr-name{font:var(--dsw-font-xs-13, 13px/18px ui-sans-serif,system-ui);color:var(--dsw-alias-label-primary);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px}
.fr-meta{font:var(--dsw-font-xxxs-11, 11px/14px ui-sans-serif,system-ui);color:var(--dsw-alias-label-caption)}
.fr-remove{z-index:1;background:var(--dsw-alias-button-contrast-fill);width:18px;height:18px;
  color:var(--dsw-alias-label-primary-inverted);cursor:pointer;opacity:0;border:none;border-radius:50%;
  place-items:center;padding:0;transition:opacity .2s ease-in-out;display:grid;position:absolute;top:4px;right:4px}
.fr-item:hover .fr-remove,.fr-remove:focus-visible{opacity:1}
@media (pointer:coarse){.fr-remove{opacity:1}}
@media (prefers-reduced-motion:reduce){.fr-remove{transition:none}}
.fr-arrow{z-index:2;border:1px solid var(--dsw-alias-border-l2-darkmode-thin, var(--dsw-alias-border-l4));
  background:var(--dsw-specific-input-major, var(--dsw-alias-bg-layer-1));width:24px;height:24px;
  color:var(--dsw-alias-label-secondary);box-shadow:var(--dsw-shadow-lv2, 0 8px 24px rgba(16,24,40,.08));
  cursor:pointer;border-radius:999px;place-items:center;padding:0;display:grid;position:absolute;top:50%;transform:translateY(-50%)}
.fr-arrow:hover{background:var(--dsw-alias-interactive-bg-hover-solid, var(--dsw-alias-interactive-bg-hover))}
.fr-arrow-left{left:4px}
.fr-arrow-right{right:4px}
.fr-mask{z-index:1000;pointer-events:none;background-color:var(--dsw-alias-bg-mask-drop, rgba(0,0,0,.45));
  backdrop-filter:blur(10px);justify-content:center;align-items:center;animation:.16s ease-out fr-fade-in;
  display:flex;position:fixed;inset:0}
@keyframes fr-fade-in{0%{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.fr-mask{animation:none}}
.fr-wrap{color:var(--dsw-alias-label-primary);text-align:center;flex-direction:column;align-items:center;
  margin-top:-3%;padding:0 40px;display:flex}
.fr-title{font:var(--dsw-font-l-20, 600 20px/28px system-ui);margin-top:16px}
.fr-desc{font:var(--dsw-font-s-14, 14px/20px system-ui);color:var(--dsw-alias-label-tertiary);white-space:pre-wrap;margin-top:16px}
.fr-illust{width:115px;height:84px}
.fr-pick{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:transparent;
  border:none;border-radius:999px;flex:none;place-items:center;display:grid;padding:0}
.fr-pick:hover{background:var(--dsw-alias-interactive-bg-hover)}
.fr-hidden{display:none}
.fr-lightbox{z-index:1100;position:fixed;inset:0;background:rgba(0,0,0,.72);display:grid;place-items:center;cursor:zoom-out}
.fr-lightbox img{max-width:min(92vw,1200px);max-height:88vh;border-radius:12px;box-shadow:var(--dsw-shadow-lv2)}
.fr-tail{display:grid;grid-template-columns:max-content minmax(0,1fr);align-items:center;gap:4px 8px;margin-top:16px;
  font-size:13px;line-height:22px}
.fr-tail-label{color:var(--dsw-alias-label-tertiary);grid-column:1}
.fr-tail-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0;grid-column:2}
.fr-chip{text-overflow:ellipsis;white-space:nowrap;background:var(--dsw-alias-interactive-bg-hover);max-width:320px;
  color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border:none;border-radius:6px;flex:none;
  margin:0;padding:0 8px;overflow:hidden}
.fr-chip:hover{color:var(--dsw-alias-label-primary);text-decoration:underline}
.fr-more{white-space:nowrap;color:var(--dsw-alias-label-tertiary);flex:none}
.fr-msg{display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:0}
.fr-msg-row,.fr-msg-row-inner{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;width:100%}
[data-file-native-msg]{flex:none;min-width:0;width:100%}
[data-file-native-anchor]{display:none!important}
[data-chat-flow-kind="context"]:has([data-file-native-anchor]){display:none!important;height:0;margin:0;padding:0;overflow:hidden}
.fr-msg-card{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2-darkmode-thin, var(--dsw-alias-border-l4));
  background:var(--dsw-alias-interactive-bg-hover);border-radius:16px;height:64px;min-width:168px;max-width:240px;
  padding:8px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;text-align:left;color:inherit;font:inherit}
.fr-msg-card:hover{background:var(--dsw-alias-interactive-bg-hover-solid, var(--dsw-alias-interactive-bg-hover))}
.fr-ctx{min-width:0}
.fr-ctx-head{width:100%;min-width:0;height:24px;color:inherit;font:inherit;text-align:left;background:0 0;border:none;
  border-radius:6px;align-items:center;padding:0;display:flex;cursor:pointer;gap:8px}
.fr-ctx-head:hover{background:var(--dsw-alias-interactive-bg-hover)}
.fr-ctx-title{color:var(--dsw-alias-label-primary-dimmed, var(--dsw-alias-label-secondary));flex:none;font-size:14px;line-height:24px}
.fr-ctx-src,.fr-ctx-sum{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;
  font-size:14px;line-height:24px;overflow:hidden}
.fr-ctx-src{flex:none;max-width:180px}
.fr-ctx-sum{flex:auto}
.fr-ctx-body{box-sizing:border-box;background:var(--dsw-alias-markdown-code-block);width:calc(100% - 22px);max-height:141px;
  color:var(--dsw-alias-label-tertiary);font:400 11px/16px var(--ds-font-family-code, ui-monospace,monospace);
  border:none;border-radius:8px;margin:4px 0 0 22px;padding:10px 16px 12px 12px;overflow:auto;white-space:pre-wrap}
[data-file-native-queue]{flex:none;display:inline-flex;align-items:center;gap:2px;height:20px;padding:0 7px;
  border-radius:999px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-interactive-bg-hover);
  font:500 11px/20px Inter, var(--dsw-font-family, system-ui);white-space:nowrap;pointer-events:none}
`

let injected = false;

export function ensureStyles(): void {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('file-native-styles');
  if (el === null) {
    el = document.createElement('style');
    el.id = 'file-native-styles';
    document.head.appendChild(el);
  }
  if (el.textContent !== FR_CSS) el.textContent = FR_CSS;
  injected = true;
}
