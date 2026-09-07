window.__ModuleLoader__.load({ id: "dsh-files-native", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var import_react8 = require("react");

// src/rail.tsx
var import_react2 = require("react");

// src/lib.ts
var NATIVE_IMAGE_TYPES = /* @__PURE__ */ new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
]);
var NATIVE_IMAGE_EXT = /* @__PURE__ */ new Set(["png", "jpg", "jpeg", "webp", "gif"]);
var MAX_FILE_BYTES = 50 * 1024 * 1024;
var MAX_FILES_PER_BATCH = 20;
function isNativeImage(file) {
  const type = (file.type ?? "").toLowerCase();
  if (NATIVE_IMAGE_TYPES.has(type)) return true;
  if (type !== "" && type !== "application/octet-stream") return false;
  const ext = extOf(file.name ?? "");
  return NATIVE_IMAGE_EXT.has(ext.toLowerCase());
}
function extOf(name2) {
  const base = name2.replace(/^.*[/\\]/, "");
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return "FILE";
  return base.slice(dot + 1).slice(0, 4).toUpperCase();
}
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function splitIntake(files) {
  const images = [];
  const others = [];
  for (const file of files) {
    if (isNativeImage(file)) images.push(file);
    else others.push(file);
  }
  return { images, others };
}
function planPaste(files) {
  const nativeImages = [];
  const cards = [];
  for (const file of files) {
    if (isNativeImage(file)) nativeImages.push(file);
    else cards.push(file);
  }
  if (cards.length === 0 && nativeImages.length > 0) return { action: "yield" };
  return { action: "take", cards, nativeImages };
}

// src/store.ts
var items = [];
var sentBySession = /* @__PURE__ */ new Map();
var sentByTurn = /* @__PURE__ */ new Map();
var listeners = /* @__PURE__ */ new Set();
var generation = 0;
function emit() {
  generation += 1;
  for (const fn of [...listeners]) fn();
}
function version() {
  return generation;
}
function subscribe(fn) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function pendingFor(sessionId) {
  return items.filter((item) => item.sessionId === sessionId);
}
function add(sessionId, item) {
  items.push({ ...item, sessionId: item.sessionId || sessionId });
  emit();
}
function patch(sessionId, id, update) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return;
  const cur = items[index];
  items[index] = { ...cur, ...update, sessionId: update.sessionId ?? cur.sessionId ?? sessionId };
  emit();
}
function remove(_sessionId, id) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return void 0;
  const [found] = items.splice(index, 1);
  emit();
  return found;
}
function doneFiles(sessionId) {
  const mine = sessionId === "" ? items : items.filter((item) => !item.sessionId || item.sessionId === sessionId);
  return mine.filter((item) => item.status === "done");
}
function archiveSent(sessionId) {
  const files = doneFiles(sessionId);
  if (files.length > 0) sentBySession.set(sessionId, files);
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    if (item.status !== "done") continue;
    if (sessionId !== "" && item.sessionId && item.sessionId !== sessionId) continue;
    items.splice(i, 1);
  }
  if (files.length > 0) emit();
  return files;
}
function lastSent(sessionId) {
  return sentBySession.get(sessionId) ?? [];
}
function filesForTurn(sessionId, turn) {
  return sentByTurn.get(`${sessionId}:${turn}`) ?? lastSent(sessionId);
}

// src/styles.ts
var FR_CSS = `
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
`;
var injected = false;
function ensureStyles() {
  if (typeof document === "undefined") return;
  let el = document.getElementById("file-native-styles");
  if (el === null) {
    el = document.createElement("style");
    el.id = "file-native-styles";
    document.head.appendChild(el);
  }
  if (el.textContent !== FR_CSS) el.textContent = FR_CSS;
  injected = true;
}

// src/icons.tsx
var import_react = require("react");
function IconPaperclip({ size = 16 }) {
  return (0, import_react.createElement)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      "aria-hidden": true
    },
    (0, import_react.createElement)("path", {
      d: "M9.2 4.4 4.55 9.05a2.4 2.4 0 1 0 3.4 3.4l5.15-5.15a3.6 3.6 0 0 0-5.1-5.1L3.15 7.05",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    })
  );
}
function IconChevronLeft({ size = 14 }) {
  return (0, import_react.createElement)(
    "svg",
    { width: size, height: size, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true },
    (0, import_react.createElement)("path", { d: "M10 3.5 5.5 8 10 12.5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
  );
}
function IconChevronRight({ size = 14 }) {
  return (0, import_react.createElement)(
    "svg",
    { width: size, height: size, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true },
    (0, import_react.createElement)("path", { d: "M6 3.5 10.5 8 6 12.5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
  );
}
function IconClose({ size = 12 }) {
  return (0, import_react.createElement)(
    "svg",
    { width: size, height: size, viewBox: "0 0 12 12", fill: "none", "aria-hidden": true },
    (0, import_react.createElement)("path", { d: "M3 3l6 6M9 3 3 9", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })
  );
}
function UploadIllustration() {
  return (0, import_react.createElement)(
    "svg",
    { width: "115", height: "84", viewBox: "0 0 115 84", fill: "none", "aria-hidden": true },
    (0, import_react.createElement)(
      "g",
      { clipPath: "url(#frDropClip)" },
      (0, import_react.createElement)("rect", { y: "17.0742", width: "44.1832", height: "43.6431", rx: "12", transform: "rotate(-22.7338 0 17.0742)", fill: "#9CE5ED" }),
      (0, import_react.createElement)("rect", { x: "73.4043", y: "8.54297", width: "43.7267", height: "50.5284", rx: "8", transform: "rotate(17.403 73.4043 8.54297)", fill: "#679EFE" }),
      (0, import_react.createElement)("path", { d: "M30.4917 28.1369L40.8865 33.4564L37.2232 34.9524L29.5302 31.0159L26.7919 39.2122L23.1285 40.7082L26.8287 29.6338L16.8967 24.5516L20.5601 23.0556L27.7902 26.7549L30.3639 19.052L34.0273 17.556L30.4917 28.1369Z", fill: "white" }),
      (0, import_react.createElement)("path", { d: "M77.5088 26.3047L101.057 33.7966", stroke: "white", strokeWidth: "3" }),
      (0, import_react.createElement)("path", { d: "M72.2646 42.7871L86.3938 47.2823", stroke: "white", strokeWidth: "3" }),
      (0, import_react.createElement)("path", { d: "M74.8867 34.5469L98.4353 42.0388", stroke: "white", strokeWidth: "3" }),
      (0, import_react.createElement)("rect", { x: "31.583", y: "38.6641", width: "44.9157", height: "44.3666", rx: "12", transform: "rotate(-0.134233 31.583 38.6641)", fill: "#3964FE" }),
      (0, import_react.createElement)("path", { d: "M38.9521 73.0337C39.6129 71.7086 41.7113 66.0937 43.5113 61.1663C44.1607 59.3885 46.7484 59.3923 47.4591 61.1465C48.9728 64.8828 50.7969 68.6922 51.9988 69.1925C54.2946 70.1482 57.9854 59.3573 68.0064 70.1801", stroke: "white", strokeWidth: "3" }),
      (0, import_react.createElement)("circle", { cx: "60.6157", cy: "52.247", r: "4.38794", transform: "rotate(22.5996 60.6157 52.247)", fill: "white" })
    ),
    (0, import_react.createElement)("defs", null, (0, import_react.createElement)("clipPath", { id: "frDropClip" }, (0, import_react.createElement)("rect", { width: "115", height: "84", fill: "white" })))
  );
}

// src/rail.tsx
function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
async function uploadFile(sessionId, file) {
  const id = uid();
  const pending = {
    id,
    sessionId,
    name: file.name,
    relPath: "",
    size: file.size,
    mediaType: file.type || "application/octet-stream",
    status: "uploading"
  };
  add(sessionId, pending);
  const url = `/plugins/file-native/upload?sessionId=${encodeURIComponent(sessionId)}&name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`;
  try {
    const res = await fetch(url, { method: "POST", body: file });
    const body = await res.json();
    if (!res.ok || !body.ok || body.file === void 0) {
      patch(sessionId, id, { status: "error", error: body.error ?? "\u4E0A\u4F20\u5931\u8D25" });
      return { ...pending, status: "error", error: body.error ?? "\u4E0A\u4F20\u5931\u8D25" };
    }
    patch(sessionId, id, {
      status: "done",
      name: body.file.name,
      relPath: body.file.relPath,
      size: body.file.size,
      mediaType: body.file.mediaType
    });
    return { ...pending, ...body.file, status: "done" };
  } catch {
    patch(sessionId, id, { status: "error", error: "\u7F51\u7EDC\u9519\u8BEF" });
    return { ...pending, status: "error", error: "\u7F51\u7EDC\u9519\u8BEF" };
  }
}
function intake(sessionId, files, onAddImages) {
  if (files.length === 0) return;
  if (files.length > MAX_FILES_PER_BATCH) {
    add(sessionId, {
      id: uid(),
      sessionId,
      name: "\u6279\u6B21\u8FC7\u5927",
      relPath: "",
      size: 0,
      mediaType: "",
      status: "error",
      error: `\u4E00\u6B21\u6700\u591A ${MAX_FILES_PER_BATCH} \u4E2A\u6587\u4EF6`
    });
    return;
  }
  const oversize = files.find((file) => file.size > MAX_FILE_BYTES);
  if (oversize) {
    add(sessionId, {
      id: uid(),
      sessionId,
      name: oversize.name,
      relPath: "",
      size: oversize.size,
      mediaType: oversize.type,
      status: "error",
      error: "\u8D85\u8FC7 50 MB"
    });
    return;
  }
  const { images, others } = splitIntake(files);
  if (images.length > 0) onAddImages(images);
  for (const file of others) void uploadFile(sessionId, file);
}
function Lightbox({ src, alt, onClose }) {
  (0, import_react2.useEffect)(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (0, import_react2.createElement)(
    "div",
    { className: "fr-lightbox", role: "dialog", "aria-label": alt, onClick: onClose },
    (0, import_react2.createElement)("img", { src, alt, onClick: (event) => event.stopPropagation() })
  );
}
function ImageTile({ item, onRemove, onOpen }) {
  return (0, import_react2.createElement)(
    "div",
    { className: "fr-item fr-item-image" },
    (0, import_react2.createElement)(
      "button",
      { type: "button", className: "fr-thumb", title: item.file.name, onClick: onOpen },
      (0, import_react2.createElement)("img", { src: item.previewUrl, alt: item.file.name })
    ),
    (0, import_react2.createElement)("button", { type: "button", className: "fr-remove", "aria-label": `\u79FB\u9664 ${item.file.name}`, onClick: onRemove }, (0, import_react2.createElement)(IconClose))
  );
}
function FileTile({ item, sessionId }) {
  const remove2 = () => {
    const sid = item.sessionId || sessionId;
    remove(sid, item.id);
    if (item.relPath) {
      void fetch(`/plugins/file-native/remove?sessionId=${encodeURIComponent(sid)}&path=${encodeURIComponent(item.relPath)}`, { method: "POST" });
    }
  };
  const meta = item.status === "uploading" ? "\u4E0A\u4F20\u4E2D\u2026" : item.status === "error" ? item.error ?? "\u5931\u8D25" : formatSize(item.size);
  return (0, import_react2.createElement)(
    "div",
    { className: "fr-item", title: item.error ?? (item.relPath || item.name) },
    (0, import_react2.createElement)(
      "div",
      { className: "fr-card", "data-status": item.status },
      (0, import_react2.createElement)("span", { className: "fr-ext" }, extOf(item.name)),
      (0, import_react2.createElement)(
        "span",
        { className: "fr-copy" },
        (0, import_react2.createElement)("span", { className: "fr-name" }, item.name),
        (0, import_react2.createElement)("span", { className: "fr-meta" }, meta)
      )
    ),
    (0, import_react2.createElement)("button", { type: "button", className: "fr-remove", "aria-label": `\u79FB\u9664 ${item.name}`, onClick: remove2 }, (0, import_react2.createElement)(IconClose))
  );
}
function FileRail(props) {
  ensureStyles();
  const sessionId = String(props.sessionId ?? "");
  const [files, setFiles] = (0, import_react2.useState)(() => pendingFor(sessionId));
  const [, setVersion] = (0, import_react2.useState)(() => version());
  const [preview, setPreview] = (0, import_react2.useState)(null);
  const [edges, setEdges] = (0, import_react2.useState)({ left: false, right: false });
  const rowRef = (0, import_react2.useRef)(null);
  const countRef = (0, import_react2.useRef)(0);
  (0, import_react2.useEffect)(() => {
    const sync = () => {
      setFiles(pendingFor(sessionId));
      setVersion(version());
    };
    sync();
    return subscribe(sync);
  }, [sessionId]);
  const updateEdges = () => {
    const el = rowRef.current;
    if (el === null) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
    setEdges((prev) => prev.left === left && prev.right === right ? prev : { left, right });
  };
  const itemCount = props.attachments.length + files.length;
  (0, import_react2.useLayoutEffect)(() => {
    const grew = countRef.current !== 0 && itemCount > countRef.current;
    countRef.current = itemCount;
    const el = rowRef.current;
    if (el === null) return;
    if (grew) el.scrollLeft = el.scrollWidth - el.clientWidth;
    updateEdges();
  }, [itemCount]);
  (0, import_react2.useEffect)(() => {
    const el = rowRef.current;
    if (el === null) return;
    let disconnect = () => {
    };
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateEdges);
      observer.observe(el);
      disconnect = () => observer.disconnect();
    }
    const onWheel = (event) => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      el.scrollBy({ left: Math.sign(event.deltaY) * Math.min(Math.abs(event.deltaY), 60), behavior: "auto" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, [itemCount]);
  const page = (direction) => {
    const el = rowRef.current;
    if (el === null) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth - 64, 200), behavior: "smooth" });
  };
  const hasImages = props.attachments.length > 0;
  const hasFiles = files.length > 0;
  if (!hasImages && !hasFiles) return null;
  return (0, import_react2.createElement)(
    "div",
    { className: "fr-rail", "data-file-native": true },
    (0, import_react2.createElement)(
      "div",
      { style: { position: "relative" } },
      edges.left ? (0, import_react2.createElement)("button", { type: "button", className: "fr-arrow fr-arrow-left", "aria-label": "\u5411\u5DE6", onClick: () => page(-1) }, (0, import_react2.createElement)(IconChevronLeft)) : null,
      (0, import_react2.createElement)(
        "div",
        { className: "fr-row", role: "group", "aria-label": "\u9644\u4EF6", ref: rowRef, onScroll: updateEdges },
        ...props.attachments.map((item) => (0, import_react2.createElement)(ImageTile, {
          key: item.id,
          item,
          onRemove: () => props.onRemoveImage(item.id),
          onOpen: () => setPreview(item)
        })),
        ...files.map((item) => (0, import_react2.createElement)(FileTile, { key: item.id, item, sessionId }))
      ),
      edges.right ? (0, import_react2.createElement)("button", { type: "button", className: "fr-arrow fr-arrow-right", "aria-label": "\u5411\u53F3", onClick: () => page(1) }, (0, import_react2.createElement)(IconChevronRight)) : null
    ),
    preview ? (0, import_react2.createElement)(Lightbox, { src: preview.previewUrl, alt: preview.file.name, onClose: () => setPreview(null) }) : null
  );
}
function intakeFiles(sessionId, files, onAddImages) {
  intake(sessionId, files, onAddImages);
}

// src/picker.tsx
var import_react5 = require("react");

// src/overlay.tsx
var import_react3 = require("react");
var import_react_dom = require("react-dom");
function DropMask() {
  const [target, setTarget] = (0, import_react3.useState)(null);
  (0, import_react3.useEffect)(() => {
    setTarget(document.body);
  }, []);
  const node = (0, import_react3.createElement)(
    "div",
    { className: "fr-mask", role: "status" },
    (0, import_react3.createElement)(
      "div",
      { className: "fr-wrap" },
      (0, import_react3.createElement)("div", { className: "fr-illust" }, (0, import_react3.createElement)(UploadIllustration)),
      (0, import_react3.createElement)("div", { className: "fr-title" }, "\u677E\u5F00\u4EE5\u6DFB\u52A0\u6587\u4EF6"),
      (0, import_react3.createElement)("div", { className: "fr-desc" }, "\u56FE\u7247\u8FDB\u5165\u8349\u7A3F\u56FE\u680F\uFF0C\u5176\u5B83\u6587\u4EF6\u4FDD\u5B58\u5230\u5DE5\u4F5C\u533A")
    )
  );
  return target ? (0, import_react_dom.createPortal)(node, target) : node;
}

// src/rail-portal.tsx
var import_react4 = require("react");
var import_react_dom2 = require("react-dom");

// src/live.ts
var owner = null;
var lastSessionId = "";
var dragDepth = 0;
var generation2 = 0;
var listeners2 = /* @__PURE__ */ new Set();
var queuedImages = /* @__PURE__ */ new Map();
function emit2() {
  for (const fn of [...listeners2]) fn();
}
function subscribeLive(fn) {
  listeners2.add(fn);
  return () => {
    listeners2.delete(fn);
  };
}
function flushQueuedImages() {
  if (!owner?.onAddImages) return;
  const sid = owner.sessionId;
  const files = (queuedImages.get(sid) ?? []).concat(sid ? queuedImages.get("") ?? [] : []);
  queuedImages.delete(sid);
  if (sid) queuedImages.delete("");
  if (files.length === 0) return;
  owner.onAddImages(files);
}
function setLiveOwner(next) {
  generation2 += 1;
  owner = next;
  if (next?.sessionId) lastSessionId = next.sessionId;
  emit2();
  if (next) flushQueuedImages();
  return generation2;
}
function clearLiveOwner(token) {
  if (token !== generation2) return;
  owner = null;
  emit2();
}
function getLiveOwner() {
  return owner;
}
function addImages(sessionId, files) {
  if (files.length === 0) return;
  const sid = sessionId || currentSessionId();
  if (owner?.onAddImages && (!owner.sessionId || owner.sessionId === sid)) {
    owner.onAddImages(files);
    return;
  }
  const key = sid || owner?.sessionId || lastSessionId;
  const prev = queuedImages.get(key) ?? [];
  queuedImages.set(key, prev.concat(files));
}
function setDragDepth(depth) {
  const next = Math.max(0, depth);
  if (next === dragDepth) return;
  dragDepth = next;
  emit2();
}
function getDragDepth() {
  return dragDepth;
}
function rememberSessionId(id) {
  if (id) lastSessionId = id;
}
function currentSessionId() {
  return owner?.sessionId || lastSessionId;
}
function resolveSessionId(props) {
  if (props.sessionId) return String(props.sessionId);
  if (props.session?.id) return String(props.session.id);
  return currentSessionId();
}

// src/rail-portal.tsx
function placeHost(anchor) {
  const card = anchor?.closest("[data-composer-card]");
  if (card === null) return null;
  let el = card.querySelector("[data-file-native-host]");
  if (el === null) {
    el = document.createElement("div");
    el.dataset.fileNativeHost = "";
  }
  const scroll = card.querySelector("[data-input-scroll]");
  if (el.parentElement !== card || scroll !== null && el.nextElementSibling !== scroll) {
    if (scroll !== null) card.insertBefore(el, scroll);
    else if (el.parentElement !== card) card.insertBefore(el, card.firstChild);
  }
  return el;
}
function ComposerRail(props) {
  ensureStyles();
  const anchorRef = (0, import_react4.useRef)(null);
  const [host, setHost] = (0, import_react4.useState)(null);
  const [, bump] = (0, import_react4.useState)(0);
  (0, import_react4.useEffect)(() => {
    const a = subscribe(() => bump((n) => n + 1));
    const b = subscribeLive(() => bump((n) => n + 1));
    return () => {
      a();
      b();
    };
  }, []);
  (0, import_react4.useEffect)(() => {
    let cancelled = false;
    let tries = 0;
    const tick = () => {
      if (cancelled) return;
      const el = placeHost(anchorRef.current);
      if (el !== null) {
        setHost((prev) => prev === el ? prev : el);
        return;
      }
      tries += 1;
      if (tries < 30) window.setTimeout(tick, 50);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, []);
  const live = getLiveOwner();
  const rail = (0, import_react4.createElement)(FileRail, {
    attachments: live?.attachments ?? [],
    canAcceptDrop: live?.canAcceptDrop ?? true,
    onAddImages: live?.onAddImages ?? (() => {
    }),
    onRemoveImage: live?.onRemoveImage ?? (() => {
    }),
    sessionId: live?.sessionId || props.sessionId || currentSessionId(),
    dropLimits: live?.dropLimits
  });
  return (0, import_react4.createElement)("span", {
    ref: anchorRef,
    "aria-hidden": true,
    style: { position: "absolute", width: 0, height: 0, overflow: "hidden" }
  }, host !== null && host.isConnected ? (0, import_react_dom2.createPortal)(rail, host) : null);
}

// src/vision.ts
function currentModelLabel() {
  const buttons = document.querySelectorAll("button[aria-label]");
  for (const button of buttons) {
    const label = button.getAttribute("aria-label") ?? "";
    if (/选择模型|select model|current model/i.test(label)) return label;
  }
  return "";
}
function insertComposerText(text) {
  const active = document.activeElement;
  const el = active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement ? active : document.querySelector("[data-composer-card] textarea");
  if (!(el instanceof HTMLTextAreaElement) && !(el instanceof HTMLInputElement)) return;
  el.focus();
  let inserted = false;
  try {
    inserted = document.execCommand("insertText", false, text);
  } catch {
    inserted = false;
  }
  if (inserted) return;
  const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, `${el.value}${text}`);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
var modlensRouteAvailable = true;
async function probeModlensTakeover() {
  if (!modlensRouteAvailable) return false;
  const label = currentModelLabel();
  try {
    const res = await fetch(`/modlens/paste?model=${encodeURIComponent(label)}`, {
      signal: AbortSignal.timeout(2e3)
    });
    if (res.status === 404) {
      modlensRouteAvailable = false;
      return false;
    }
    if (!res.ok) return false;
    const body = await res.json();
    return body.takeover === true;
  } catch {
    return false;
  }
}
async function uploadModlensPaste(file) {
  const res = await fetch("/modlens/paste", { method: "POST", body: await file.arrayBuffer() });
  if (!res.ok) return void 0;
  const body = await res.json();
  return typeof body.path === "string" && body.path !== "" ? body.path : void 0;
}
async function deliverImages(sessionId, files) {
  if (files.length === 0) return;
  const takeover = await probeModlensTakeover();
  if (!takeover) {
    addImages(sessionId, files);
    return;
  }
  const paths = [];
  const failed = [];
  for (const file of files) {
    try {
      const path = await uploadModlensPaste(file);
      if (path !== void 0) paths.push(path);
      else failed.push(file);
    } catch {
      failed.push(file);
    }
  }
  if (paths.length === 0) {
    addImages(sessionId, files);
    return;
  }
  if (failed.length > 0) addImages(sessionId, failed);
  insertComposerText(`${paths.join(" ")} `);
}

// src/picker.tsx
function PaperclipButton(props) {
  ensureStyles();
  const inputRef = (0, import_react5.useRef)(null);
  const [drag, setDrag] = (0, import_react5.useState)(() => getDragDepth() > 0);
  const sessionId = String(props.sessionId || currentSessionId());
  rememberSessionId(sessionId);
  (0, import_react5.useEffect)(() => subscribeLive(() => setDrag(getDragDepth() > 0)), []);
  const onChange = (event) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    const sid = String(props.sessionId || currentSessionId());
    if (files.length === 0) return;
    intakeFiles(sid, files, (images) => {
      void deliverImages(sid, images);
    });
  };
  return (0, import_react5.createElement)(
    "span",
    null,
    (0, import_react5.createElement)(ComposerRail, { sessionId }),
    drag ? (0, import_react5.createElement)(DropMask) : null,
    (0, import_react5.createElement)("button", {
      type: "button",
      className: "fr-pick",
      title: "\u4E0A\u4F20\u6587\u4EF6",
      "aria-label": "\u4E0A\u4F20\u6587\u4EF6",
      onClick: () => inputRef.current?.click()
    }, (0, import_react5.createElement)(IconPaperclip, { size: 16 })),
    (0, import_react5.createElement)("input", {
      ref: inputRef,
      className: "fr-hidden",
      type: "file",
      multiple: true,
      onChange
    })
  );
}

// src/tail.tsx
var import_react6 = require("react");
function basename(path) {
  const at = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return at === -1 ? path : path.slice(at + 1);
}
function ChipRow({ label, items: items2, open }) {
  if (items2.length === 0) return null;
  const shown = items2.slice(0, 6);
  const hidden = items2.length - shown.length;
  return (0, import_react6.createElement)(
    "div",
    { className: "fr-tail" },
    (0, import_react6.createElement)("span", { className: "fr-tail-label" }, label),
    (0, import_react6.createElement)(
      "div",
      { className: "fr-tail-row" },
      ...shown.map((item) => (0, import_react6.createElement)("button", {
        key: item.path,
        type: "button",
        className: "fr-chip",
        title: item.path,
        onClick: () => open(item.path)
      }, item.name)),
      hidden > 0 ? (0, import_react6.createElement)("span", { className: "fr-more" }, `+ ${hidden} \u4E2A\u6587\u4EF6`) : null
    )
  );
}
function UploadedTail(props) {
  ensureStyles();
  const sessionId = String(props.sessionId ?? "");
  const [uploaded, setUploaded] = (0, import_react6.useState)(
    props.matched?.uploaded ?? (props.turn !== void 0 ? filesForTurn(sessionId, props.turn) : lastSent(sessionId))
  );
  (0, import_react6.useEffect)(() => {
    if (props.matched?.uploaded) {
      setUploaded(props.matched.uploaded);
      return;
    }
    let cancelled = false;
    void fetch(`/plugins/file-native/last?sessionId=${encodeURIComponent(sessionId)}`).then((res) => res.json()).then((body) => {
      if (!cancelled && Array.isArray(body.files) && body.files.length > 0) setUploaded(body.files);
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId, props.matched, props.turn]);
  const produced = props.matched?.produced ?? [];
  if (uploaded.length === 0 && produced.length === 0) return null;
  const open = props.openFile ?? ((path) => {
    window.open(path, "_blank");
  });
  return (0, import_react6.createElement)(
    "div",
    { "data-file-native-tail": true },
    (0, import_react6.createElement)(ChipRow, {
      label: "\u9644\u4EF6",
      items: uploaded.map((file) => ({ name: file.name, path: file.relPath })),
      open
    }),
    (0, import_react6.createElement)(ChipRow, {
      label: "\u4EA7\u7269",
      items: produced.map((path) => ({ name: basename(path), path })),
      open
    })
  );
}
function producedPathsOf(owner2) {
  const data = owner2.turn?.data?.get?.("deliverables");
  const seq = owner2.seq ?? Number.POSITIVE_INFINITY;
  if (!data?.produced) return [];
  const paths = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of data.produced) {
    if (item.seq > seq || seen.has(item.path)) continue;
    seen.add(item.path);
    paths.push(item.path);
  }
  return paths;
}

// src/context.tsx
var import_react7 = require("react");
var import_react_dom3 = require("react-dom");
function isFileNoticeRow(el) {
  const text = el.textContent ?? "";
  return text.includes("\u{1F4CE} \u9644\u4EF6") && text.includes("\u4E2A\u6587\u4EF6");
}
function FileCard({ file, onOpen }) {
  return (0, import_react7.createElement)(
    "button",
    {
      type: "button",
      className: "fr-msg-card",
      title: file.relPath,
      onClick: () => onOpen?.(file)
    },
    (0, import_react7.createElement)("span", { className: "fr-ext" }, extOf(file.name)),
    (0, import_react7.createElement)(
      "span",
      { className: "fr-copy" },
      (0, import_react7.createElement)("span", { className: "fr-name" }, file.name),
      file.size > 0 ? (0, import_react7.createElement)("span", { className: "fr-meta" }, formatSize(file.size)) : null
    )
  );
}
function userStackOf(el) {
  if (!(el instanceof HTMLElement)) return null;
  const kind = el.getAttribute("data-chat-flow-kind");
  if (kind !== "user" && kind !== "steering") return null;
  return el.querySelector('[class*="userStack"]');
}
function findUserStack(notice) {
  let next = notice.nextElementSibling;
  let prev = notice.previousElementSibling;
  for (let hop = 0; hop < 16; hop += 1) {
    const stack = userStackOf(next) ?? userStackOf(prev);
    if (stack !== null) return stack;
    next = next?.nextElementSibling ?? null;
    prev = prev?.previousElementSibling ?? null;
  }
  return null;
}
function placeHostInStack(stack) {
  let el = stack.querySelector(":scope > [data-file-native-msg]");
  if (el === null) {
    el = document.createElement("div");
    el.dataset.fileNativeMsg = "";
    el.className = "fr-msg-row";
    stack.insertBefore(el, stack.firstChild);
  }
  return el;
}
function placeHostInRow(notice) {
  let el = notice.querySelector(":scope > [data-file-native-msg]");
  if (el === null) {
    el = document.createElement("div");
    el.dataset.fileNativeMsg = "";
    el.style.cssText = "flex:0 0 100%;display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;padding:2px 44px 8px 22px;width:100%;box-sizing:border-box";
    notice.appendChild(el);
  }
  return el;
}
function MessageCards(props) {
  ensureStyles();
  const [hosted, setHosted] = (0, import_react7.useState)([]);
  const sessionKey = (0, import_react7.useRef)("");
  const lastCount = (0, import_react7.useRef)(-1);
  const cachedFiles = (0, import_react7.useRef)(null);
  (0, import_react7.useEffect)(() => {
    if (sessionKey.current !== (props.sessionId ?? "")) {
      sessionKey.current = props.sessionId ?? "";
      lastCount.current = -1;
      cachedFiles.current = null;
    }
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const run = async () => {
        const rows = [...document.querySelectorAll('[data-chat-flow-kind="context"]')].filter((el) => isFileNoticeRow(el));
        if (rows.length === 0) {
          if (lastCount.current !== 0) {
            lastCount.current = 0;
            setHosted([]);
          }
          return;
        }
        if (rows.length !== lastCount.current) {
          const sid = props.sessionId ?? "";
          if (sid !== "") {
            try {
              const res = await fetch(`/plugins/file-native/last?sessionId=${encodeURIComponent(sid)}`);
              const body = await res.json();
              cachedFiles.current = Array.isArray(body.files) ? body.files : [];
            } catch {
              cachedFiles.current = cachedFiles.current ?? [];
            }
          }
          lastCount.current = rows.length;
        }
        const files = cachedFiles.current ?? [];
        if (files.length === 0) return;
        const latest = rows[rows.length - 1];
        const stack = findUserStack(latest);
        const host = stack !== null ? placeHostInStack(stack) : placeHostInRow(latest);
        if (stack !== null) {
          if (latest.querySelector("[data-file-native-anchor]") === null) {
            const anchor = document.createElement("span");
            anchor.dataset.fileNativeAnchor = "";
            anchor.setAttribute("aria-hidden", "true");
            latest.appendChild(anchor);
          }
        }
        setHosted((prev) => {
          if (prev.length === 1 && prev[0].host === host) return prev;
          return [{ host, files }];
        });
      };
      void run().catch(() => {
      }).then(() => {
        if (!cancelled) window.setTimeout(tick, 300);
      });
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [props.sessionId]);
  if (hosted.length === 0) return null;
  return (0, import_react7.createElement)(
    "span",
    { "aria-hidden": true },
    ...hosted.map((item, i) => (0, import_react_dom3.createPortal)(
      (0, import_react7.createElement)(
        "div",
        { className: "fr-msg-row-inner" },
        ...item.files.map((file) => (0, import_react7.createElement)(FileCard, { key: file.relPath, file, onOpen: props.onOpen }))
      ),
      item.host,
      `file-native-cards-${i}`
    ))
  );
}

// src/intercept.ts
function looksLikeFileDrag(transfer) {
  if (transfer === null) return false;
  const types = Array.from(transfer.types);
  return types.length === 0 || types.includes("Files");
}
function installFileIntercept(handlers) {
  const state = { depth: 0, aborted: false };
  const reset = () => {
    state.depth = 0;
    state.aborted = false;
  };
  const onDragEnter = (event) => {
    if (!looksLikeFileDrag(event.dataTransfer) || !handlers.canAccept()) return;
    event.preventDefault();
    event.stopPropagation();
    state.aborted = false;
    state.depth += 1;
    handlers.onDepth?.(state.depth);
  };
  const onDragOver = (event) => {
    if (!looksLikeFileDrag(event.dataTransfer) || !handlers.canAccept()) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  };
  const onDragLeave = (event) => {
    if (!looksLikeFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    event.stopPropagation();
    state.depth = Math.max(0, state.depth - 1);
    const leavingViewport = event.clientX <= 0 || event.clientY <= 0 || event.clientX >= window.innerWidth || event.clientY >= window.innerHeight;
    if (state.depth === 0 || leavingViewport) {
      reset();
      handlers.onDepth?.(0);
      return;
    }
    handlers.onDepth?.(state.depth);
  };
  const onDrop = (event) => {
    if (!looksLikeFileDrag(event.dataTransfer) && (event.dataTransfer?.files.length ?? 0) === 0) return;
    event.preventDefault();
    event.stopPropagation();
    const aborted = state.aborted;
    const files = Array.from(event.dataTransfer?.files ?? []);
    reset();
    handlers.onDepth?.(0);
    try {
      window.dispatchEvent(new DragEvent("dragend"));
    } catch {
    }
    if (aborted || !handlers.canAccept() || files.length === 0) return;
    handlers.onFiles(files);
  };
  const onKeyDown = (event) => {
    if (event.key !== "Escape" || state.depth === 0) return;
    event.preventDefault();
    event.stopPropagation();
    state.aborted = true;
    reset();
    handlers.onDepth?.(0);
  };
  const onPaste = (event) => {
    if (!handlers.canAccept()) return;
    const fromList = Array.from(event.clipboardData?.files ?? []);
    const fromItems = Array.from(event.clipboardData?.items ?? []).filter((item) => item.kind === "file").map((item) => item.getAsFile()).filter((file) => file !== null);
    const files = fromList.length > 0 ? fromList : fromItems;
    if (files.length === 0) return;
    const plan = planPaste(files);
    if (plan.action === "yield") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (plan.cards.length > 0) handlers.onFiles(plan.cards);
    if (plan.nativeImages.length > 0) handlers.onImages?.(plan.nativeImages);
  };
  document.addEventListener("dragenter", onDragEnter, true);
  document.addEventListener("dragover", onDragOver, true);
  document.addEventListener("dragleave", onDragLeave, true);
  document.addEventListener("drop", onDrop, true);
  document.addEventListener("paste", onPaste, true);
  window.addEventListener("keydown", onKeyDown, true);
  return () => {
    document.removeEventListener("dragenter", onDragEnter, true);
    document.removeEventListener("dragover", onDragOver, true);
    document.removeEventListener("dragleave", onDragLeave, true);
    document.removeEventListener("drop", onDrop, true);
    document.removeEventListener("paste", onPaste, true);
    window.removeEventListener("keydown", onKeyDown, true);
  };
}

// src/client.ts
var name = "file-native";
var inject = ["slots", "betterSidebar"];
function RailSlot(props) {
  ensureStyles();
  const sessionId = resolveSessionId(props);
  rememberSessionId(sessionId);
  const tokenRef = (0, import_react8.useRef)(0);
  (0, import_react8.useLayoutEffect)(() => {
    tokenRef.current = setLiveOwner({
      attachments: props.attachments,
      canAcceptDrop: props.canAcceptDrop,
      onAddImages: props.onAddImages,
      onRemoveImage: props.onRemoveImage,
      sessionId,
      dropLimits: props.dropLimits
    });
  });
  (0, import_react8.useLayoutEffect)(() => () => clearLiveOwner(tokenRef.current), []);
  return null;
}
var chatCardOpener;
function PickerSlot(props) {
  const sessionId = resolveSessionId(props);
  rememberSessionId(sessionId);
  const running = Boolean(props.useSession?.((state) => state.running));
  const inputActions = props.inputActions;
  const submitAction = inputActions?.submit;
  const kitSig = `inputActions=${props.inputActions ? "y" : "n"} useSession=${props.useSession ? "y" : "n"}`;
  (0, import_react8.useEffect)(() => {
    console.info(`[file-native] kit: ${kitSig}`);
  }, [kitSig]);
  const submitWithFiles = (ev, sid) => {
    const submitFn = inputActions?.submit;
    archiveSent(sid);
    if (submitFn === void 0) {
      void fetch(`/plugins/file-native/arm?sessionId=${encodeURIComponent(sid)}`, { method: "POST" }).catch(() => {
      });
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    void fetch(`/plugins/file-native/arm?sessionId=${encodeURIComponent(sid)}`, { method: "POST" }).catch(() => {
    }).then(() => submitFn());
  };
  (0, import_react8.useEffect)(() => {
    const onKeyDown = (ev) => {
      if (ev.key !== "Enter" || ev.shiftKey || ev.isComposing || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      if (running) return;
      const sid = sessionId || currentSessionId();
      if (sid === "" || doneFiles(sid).length === 0) return;
      submitWithFiles(ev, sid);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [running, inputActions, sessionId]);
  (0, import_react8.useEffect)(() => {
    const onClick = (ev) => {
      if (running) return;
      const button = ev.target instanceof Element ? ev.target.closest("button") : null;
      if (button === null) return;
      if (!/[a-zA-Z0-9_-]*primary/.test(button.className)) return;
      const sid = sessionId || currentSessionId();
      if (sid === "" || doneFiles(sid).length === 0) return;
      submitWithFiles(ev, sid);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [running, inputActions, sessionId]);
  return (0, import_react8.createElement)(
    "span",
    null,
    (0, import_react8.createElement)(PaperclipButton, { sessionId }),
    (0, import_react8.createElement)(MessageCards, { sessionId, onOpen: (file) => chatCardOpener?.(sessionId || currentSessionId(), file.relPath, file.name) })
  );
}
function TailSlot(props) {
  return (0, import_react8.createElement)(UploadedTail, {
    sessionId: props.sessionId,
    openFile: props.openFile,
    matched: props.matched ?? null,
    turn: props.turn?.turn
  });
}
function selectTail(owner2) {
  const produced = producedPathsOf(owner2);
  if (produced.length === 0) return null;
  return { uploaded: [], produced };
}
function installLiveIntercept() {
  return installFileIntercept({
    canAccept: () => true,
    onDepth: (depth) => setDragDepth(depth),
    onFiles: (files) => {
      const sessionId = currentSessionId();
      intakeFiles(sessionId, files, (images) => {
        void deliverImages(sessionId, images);
      });
    },
    onImages: (files) => {
      const sessionId = currentSessionId();
      void deliverImages(sessionId, files);
    }
  });
}
var INSTANCE = (() => {
  const w = globalThis;
  w.__fileNativeInstances = (w.__fileNativeInstances ?? 0) + 1;
  const n = w.__fileNativeInstances;
  console.warn(`[file-native] apply #${n}`);
  return n;
})();
function apply(ctx) {
  ctx.effect(() => installLiveIntercept(), "file-native: document intercept");
  const sidebar = ctx.betterSidebar;
  if (sidebar !== void 0 && sidebar.features.includes("openFile")) {
    chatCardOpener = (sid, relPath, name2) => sidebar.openFile({ sessionId: sid }, relPath, name2);
  } else {
    chatCardOpener = (sid, relPath) => {
      window.open(`/plugins/file-native/file?sessionId=${encodeURIComponent(sid)}&path=${encodeURIComponent(relPath)}`, "_blank");
    };
  }
  const base = -(1e3 + INSTANCE * 10);
  const safeInject = (slot, registerFn) => {
    ctx.slots.inject(slot, () => {
      try {
        return registerFn();
      } catch (error) {
        console.warn(`[file-native] skip ${slot} registration:`, error);
        return () => {
        };
      }
    });
  };
  safeInject("conversation.input.attachments", () => ctx.slots.register({
    name: "conversation.input.attachments",
    priority: base
  }, RailSlot));
  safeInject("conversation.input.left", () => ctx.slots.register({
    name: "conversation.input.left",
    id: "file-native-picker",
    order: 0,
    priority: base
  }, PickerSlot));
  safeInject("conversation.chat.turnTail", () => ctx.slots.register({
    name: "conversation.chat.turnTail",
    select: selectTail,
    priority: base
  }, TailSlot));
  console.info(`[file-native] client loaded (instance #${INSTANCE})`);
}

return module.exports;
}});
