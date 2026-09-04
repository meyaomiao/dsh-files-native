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
var UPLOAD_DIR = ".dsh-uploads";
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
function isSafeRelPath(relPath) {
  if (relPath === "" || relPath.startsWith("/") || relPath.startsWith("\\")) return false;
  const parts = relPath.split(/[/\\]/);
  if (parts[0] !== UPLOAD_DIR) return false;
  return parts.every((part) => part !== "" && part !== "." && part !== "..");
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
var NOTICE_LINE = /^- (.+?) — path="([^"]+)" size=(\d+)(?: type="([^"]*)")?/;
function parseNoticeFiles(text) {
  const files = [];
  for (const line of text.split("\n")) {
    const match = NOTICE_LINE.exec(line.trim());
    if (match === null) continue;
    const relPath = match[2] ?? "";
    if (!isSafeRelPath(relPath)) continue;
    files.push({
      name: match[1] ?? "file",
      relPath,
      size: Number(match[3] ?? 0),
      mediaType: match[4] || "application/octet-stream"
    });
  }
  return files;
}
function contentText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts = [];
  for (const block of content) {
    if (block && typeof block === "object" && "text" in block && typeof block.text === "string") {
      parts.push(block.text);
    }
  }
  return parts.join("\n");
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
function pending() {
  return items.slice();
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
function archiveIfNoticeMatches(sessionId, notice) {
  if (notice.length === 0) return [];
  const pendingDone = doneFiles(sessionId);
  if (pendingDone.length === 0) return [];
  const paths = new Set(notice.map((file) => file.relPath));
  if (!pendingDone.some((file) => paths.has(file.relPath))) return [];
  return archiveSent(sessionId);
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
  const pending2 = {
    id,
    sessionId,
    name: file.name,
    relPath: "",
    size: file.size,
    mediaType: file.type || "application/octet-stream",
    status: "uploading"
  };
  add(sessionId, pending2);
  const url = `/plugins/file-native/upload?sessionId=${encodeURIComponent(sessionId)}&name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`;
  try {
    const res = await fetch(url, { method: "POST", body: file });
    const body = await res.json();
    if (!res.ok || !body.ok || body.file === void 0) {
      patch(sessionId, id, { status: "error", error: body.error ?? "\u4E0A\u4F20\u5931\u8D25" });
      return { ...pending2, status: "error", error: body.error ?? "\u4E0A\u4F20\u5931\u8D25" };
    }
    patch(sessionId, id, {
      status: "done",
      name: body.file.name,
      relPath: body.file.relPath,
      size: body.file.size,
      mediaType: body.file.mediaType
    });
    return { ...pending2, ...body.file, status: "done" };
  } catch {
    patch(sessionId, id, { status: "error", error: "\u7F51\u7EDC\u9519\u8BEF" });
    return { ...pending2, status: "error", error: "\u7F51\u7EDC\u9519\u8BEF" };
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
    remove(sessionId, item.id);
    if (item.relPath) {
      void fetch(`/plugins/file-native/remove?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(item.relPath)}`, { method: "POST" });
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
  const [files, setFiles] = (0, import_react2.useState)(() => pending());
  const [, setVersion] = (0, import_react2.useState)(() => version());
  const [preview, setPreview] = (0, import_react2.useState)(null);
  const [edges, setEdges] = (0, import_react2.useState)({ left: false, right: false });
  const rowRef = (0, import_react2.useRef)(null);
  const countRef = (0, import_react2.useRef)(0);
  (0, import_react2.useEffect)(() => {
    const sync = () => {
      setFiles(pending());
      setVersion(version());
    };
    sync();
    return subscribe(sync);
  }, []);
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
var listeners2 = /* @__PURE__ */ new Set();
function emit2() {
  for (const fn of [...listeners2]) fn();
}
function subscribeLive(fn) {
  listeners2.add(fn);
  return () => {
    listeners2.delete(fn);
  };
}
function setLiveOwner(next) {
  owner = next;
  if (next?.sessionId) lastSessionId = next.sessionId;
  emit2();
}
function getLiveOwner() {
  return owner;
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
    const live = getLiveOwner();
    const sid = String(props.sessionId || live?.sessionId || currentSessionId());
    if (files.length === 0) return;
    intakeFiles(sid, files, live?.onAddImages ?? (() => {
    }));
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
function FileCard({ file, onOpen }) {
  return (0, import_react7.createElement)(
    "button",
    {
      type: "button",
      className: "fr-msg-card",
      title: file.relPath,
      onClick: () => onOpen?.(file.relPath)
    },
    (0, import_react7.createElement)("span", { className: "fr-ext" }, extOf(file.name)),
    (0, import_react7.createElement)(
      "span",
      { className: "fr-copy" },
      (0, import_react7.createElement)("span", { className: "fr-name" }, file.name),
      (0, import_react7.createElement)("span", { className: "fr-meta" }, formatSize(file.size))
    )
  );
}
function userStackOf(el) {
  if (!(el instanceof HTMLElement)) return null;
  const kind = el.getAttribute("data-chat-flow-kind");
  if (kind !== "user" && kind !== "steering") return null;
  const row = el.querySelector("[data-time-hover-root]");
  const stack = row?.firstElementChild;
  return stack instanceof HTMLElement ? stack : null;
}
function findUserStack(anchor) {
  const flow = anchor?.closest('[data-chat-flow-kind="context"]');
  if (flow === null) return null;
  let next = flow.nextElementSibling;
  let prev = flow.previousElementSibling;
  for (let hop = 0; hop < 16; hop += 1) {
    const stack = userStackOf(next) ?? userStackOf(prev);
    if (stack !== null) return stack;
    next = next?.nextElementSibling ?? null;
    prev = prev?.previousElementSibling ?? null;
  }
  return null;
}
function alreadyPlaced(el, stack, before) {
  if (el.parentElement !== stack) return false;
  if (before === el) return true;
  return el.nextSibling === before;
}
function placeHost2(stack) {
  let el = stack.querySelector("[data-file-native-msg]");
  if (el === null) {
    el = document.createElement("div");
    el.dataset.fileNativeMsg = "";
    el.className = "fr-msg-row";
  }
  const gallery = stack.querySelector("[data-align]");
  const after = gallery instanceof HTMLElement ? gallery.closest('[data-slot="conversation.message.images"]') ?? gallery : null;
  const before = after?.nextSibling ?? stack.firstChild;
  if (!alreadyPlaced(el, stack, before)) {
    stack.insertBefore(el, before);
  }
  return el;
}
function AttachToUserBubble(props) {
  const anchorRef = (0, import_react7.useRef)(null);
  const [host, setHost] = (0, import_react7.useState)(null);
  const noticeKey = props.files.map((file) => file.relPath).join("\n");
  (0, import_react7.useEffect)(() => {
    const sid = currentSessionId();
    if (sid) archiveIfNoticeMatches(sid, props.files);
  }, [noticeKey]);
  (0, import_react7.useEffect)(() => {
    let cancelled = false;
    let tries = 0;
    const tick = () => {
      if (cancelled) return;
      const stack = findUserStack(anchorRef.current);
      if (stack !== null) {
        const el = placeHost2(stack);
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
  const gallery = (0, import_react7.createElement)(
    "div",
    { className: "fr-msg-row-inner" },
    ...props.files.map((file) => (0, import_react7.createElement)(FileCard, { key: file.relPath, file, onOpen: props.openFile }))
  );
  return (0, import_react7.createElement)("span", {
    ref: anchorRef,
    "data-file-native-anchor": true,
    "aria-hidden": true
  }, host !== null && host.isConnected ? (0, import_react_dom3.createPortal)(gallery, host) : null);
}
function OtherContext({ node }) {
  const [open, setOpen] = (0, import_react7.useState)(false);
  const data = node.data ?? {};
  const text = contentText(data.content);
  const summary = data.source?.summary || data.provenance?.label || "\u4E0A\u4E0B\u6587\u6CE8\u5165";
  const source = data.source?.plugin || data.provenance?.label || "";
  return (0, import_react7.createElement)(
    "div",
    { className: "fr-ctx", "data-open": open || void 0 },
    (0, import_react7.createElement)(
      "button",
      {
        type: "button",
        className: "fr-ctx-head",
        onClick: () => setOpen((value) => !value)
      },
      (0, import_react7.createElement)("span", { className: "fr-ctx-title" }, "\u4E0A\u4E0B\u6587\u6CE8\u5165"),
      source ? (0, import_react7.createElement)("span", { className: "fr-ctx-src" }, source) : null,
      (0, import_react7.createElement)("span", { className: "fr-ctx-sum" }, summary)
    ),
    open ? (0, import_react7.createElement)("pre", { className: "fr-ctx-body" }, text) : null
  );
}
function ContextNodeView(props) {
  ensureStyles();
  const node = props.node ?? {};
  const source = node.data?.source;
  if (source?.kind === "plugin" && source.plugin === "file-native") {
    const files = parseNoticeFiles(contentText(node.data?.content));
    if (files.length === 0) return null;
    return (0, import_react7.createElement)(AttachToUserBubble, { files, openFile: props.openFile });
  }
  return (0, import_react7.createElement)(OtherContext, { node });
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
    event.preventDefault();
    event.stopPropagation();
    handlers.onFiles(files);
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
var inject = ["slots"];
function RailSlot(props) {
  ensureStyles();
  const sessionId = resolveSessionId(props);
  setLiveOwner({
    attachments: props.attachments,
    canAcceptDrop: props.canAcceptDrop,
    onAddImages: props.onAddImages,
    onRemoveImage: props.onRemoveImage,
    sessionId,
    dropLimits: props.dropLimits
  });
  (0, import_react8.useEffect)(() => () => setLiveOwner(null), []);
  return null;
}
function PickerSlot(props) {
  const sessionId = resolveSessionId(props);
  rememberSessionId(sessionId);
  const phase = String(props.input?.phase ?? "");
  const draft = String(props.input?.draft ?? "");
  const imageCount = props.input?.imageIds?.length ?? 0;
  const prev = (0, import_react8.useRef)({ phase, draft, imageCount });
  (0, import_react8.useEffect)(() => {
    const sid = sessionId || currentSessionId();
    const was = prev.current;
    const entering = phase === "submitting" || phase === "claimed";
    const leaving = (was.phase === "submitting" || was.phase === "claimed") && phase === "plain";
    const sentPlain = was.phase !== "plain" && phase === "plain" && draft.trim() === "" && imageCount === 0;
    if (sid && (entering || leaving || sentPlain)) archiveSent(sid);
    prev.current = { phase, draft, imageCount };
  }, [phase, draft, imageCount, sessionId]);
  return (0, import_react8.createElement)(PaperclipButton, { sessionId });
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
      const live = getLiveOwner();
      const sessionId = live?.sessionId || currentSessionId();
      const addImages = live?.onAddImages ?? (() => {
      });
      intakeFiles(sessionId, files, addImages);
    }
  });
}
function apply(ctx) {
  ctx.effect(() => installLiveIntercept(), "file-native: document intercept");
  ctx.slots.inject("conversation.input.attachments", () => ctx.slots.register({
    name: "conversation.input.attachments",
    priority: -1
  }, RailSlot));
  ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
    name: "conversation.input.left",
    id: "file-native-picker",
    order: 0
  }, PickerSlot));
  ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
    name: "conversation.chat.node",
    key: "context",
    priority: -1
  }, ContextNodeView));
  ctx.slots.inject("conversation.chat.turnTail", () => ctx.slots.register({
    name: "conversation.chat.turnTail",
    priority: -1,
    select: selectTail
  }, TailSlot));
  ctx.logger?.info?.("[file-native] client loaded");
}

return module.exports;
}});
