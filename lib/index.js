// src/index.ts
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

// src/lib.ts
var MAX_FILE_BYTES = 50 * 1024 * 1024;
var UPLOAD_DIR = ".dsh-uploads";
function sanitizeFileName(name2) {
  const base = name2.replace(/^.*[/\\]/, "").replace(/[\u0000-\u001f]/g, "");
  const cleaned = base.replace(/[<>:"/\\|?*]/g, "_").replace(/^\.+/, "").trim();
  const sliced = cleaned.slice(0, 180);
  return sliced === "" ? "file" : sliced;
}
function uniqueName(name2, taken) {
  if (!taken.has(name2)) return name2;
  const dot = name2.lastIndexOf(".");
  const stem = dot > 0 ? name2.slice(0, dot) : name2;
  const ext = dot > 0 ? name2.slice(dot) : "";
  let i = 1;
  while (taken.has(`${stem}-${i}${ext}`)) i += 1;
  return `${stem}-${i}${ext}`;
}
function isSafeRelPath(relPath) {
  if (relPath === "" || relPath.startsWith("/") || relPath.startsWith("\\")) return false;
  const parts = relPath.split(/[/\\]/);
  if (parts[0] !== UPLOAD_DIR) return false;
  return parts.every((part) => part !== "" && part !== "." && part !== "..");
}
function fileListText(files) {
  const lines = files.map((file) => `- ${file.name} \u2014 path="${file.relPath}" size=${file.size} type="${file.mediaType}"`);
  return [
    "\u7528\u6237\u968F\u672C\u6761\u6D88\u606F\u4E0A\u4F20\u4E86\u4EE5\u4E0B\u6587\u4EF6,\u5DF2\u4FDD\u5B58\u5230\u5F53\u524D\u5DE5\u4F5C\u533A,\u53EF\u7528 read \u5DE5\u5177\u6309\u8DEF\u5F84\u8BFB\u53D6:",
    ...lines
  ].join("\n");
}

// src/index.ts
var name = "file-native";
var inject = ["webServer", "sessions"];
var pending = /* @__PURE__ */ new Map();
var lastSent = /* @__PURE__ */ new Map();
function sessionCwd(ctx, sessionId, clientCwd) {
  const headerCwd = ctx.sessions.get(sessionId)?.header?.cwd;
  if (headerCwd) return headerCwd;
  if (clientCwd && resolve(clientCwd) === clientCwd) return clientCwd;
  return process.cwd();
}
function json(res, code, body) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function isLoopback(req) {
  const host = String(req.headers.host ?? "").split(":")[0] ?? "";
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1") return true;
  const parts = host.split(".");
  return parts.length === 4 && parts[0] === "127" && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}
function query(req) {
  return new URL(req.url ?? "/", "http://dsh.internal").searchParams;
}
async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > limit) {
      const error = new Error("too-large");
      error.code = "too-large";
      throw error;
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}
async function writeUpload(cwd, fileName, bytes) {
  const dir = join(cwd, UPLOAD_DIR);
  await mkdir(dir, { recursive: true });
  const taken = /* @__PURE__ */ new Set();
  try {
    const { readdir } = await import("node:fs/promises");
    for (const item of await readdir(dir)) taken.add(item);
  } catch {
  }
  const safe = uniqueName(sanitizeFileName(fileName), taken);
  const target = join(dir, safe);
  const resolvedCwd = resolve(cwd);
  const resolvedTarget = resolve(target);
  if (resolvedTarget !== resolvedCwd && !resolvedTarget.startsWith(resolvedCwd + sep)) {
    throw new Error("path-escape");
  }
  const tmp = join(dirname(target), `.${safe}.${randomUUID()}.tmp`);
  await new Promise((resolveWrite, reject) => {
    const stream = createWriteStream(tmp, { flags: "wx" });
    stream.on("error", reject);
    stream.end(bytes, () => resolveWrite());
  });
  await rename(tmp, target);
  const info = await stat(target);
  return {
    name: fileName.replace(/^.*[/\\]/, "") || safe,
    relPath: `${UPLOAD_DIR}/${safe}`,
    size: info.size,
    mediaType: "application/octet-stream"
  };
}
function takePending(sessionId) {
  const files = pending.get(sessionId) ?? [];
  pending.delete(sessionId);
  if (files.length > 0) lastSent.set(sessionId, files);
  return files;
}
function registerRoutes(ctx, webServer) {
  const upload = webServer.register({
    kind: "exact",
    path: "/plugins/file-native/upload",
    handler: async (req, res) => {
      if (!isLoopback(req)) return json(res, 403, { ok: false, error: "forbidden" });
      if (req.method !== "POST") return json(res, 405, { ok: false, error: "method" });
      const q = query(req);
      const sessionId = q.get("sessionId") ?? "";
      const fileName = q.get("name") ?? "file";
      if (sessionId === "") return json(res, 400, { ok: false, error: "sessionId" });
      try {
        const bytes = await readBody(req, MAX_FILE_BYTES);
        if (bytes.length === 0) return json(res, 400, { ok: false, error: "empty" });
        const cwd = sessionCwd(ctx, sessionId, q.get("cwd") ?? void 0);
        const file = await writeUpload(cwd, fileName, bytes);
        file.mediaType = q.get("type") || file.mediaType;
        const list = pending.get(sessionId) ?? [];
        list.push(file);
        pending.set(sessionId, list);
        json(res, 200, { ok: true, file });
      } catch (error) {
        const code = error.code === "too-large" ? 413 : 400;
        ctx.logger.warn("[file-native] upload failed: %o", error);
        json(res, code, { ok: false, error: code === 413 ? "too-large" : "write-failed" });
      }
    }
  });
  const remove = webServer.register({
    kind: "exact",
    path: "/plugins/file-native/remove",
    handler: async (req, res) => {
      if (!isLoopback(req)) return json(res, 403, { ok: false, error: "forbidden" });
      if (req.method !== "POST") return json(res, 405, { ok: false, error: "method" });
      const q = query(req);
      const sessionId = q.get("sessionId") ?? "";
      const relPath = q.get("path") ?? "";
      if (sessionId === "" || !isSafeRelPath(relPath)) return json(res, 400, { ok: false, error: "bad-path" });
      const cwd = sessionCwd(ctx, sessionId, q.get("cwd") ?? void 0);
      pending.set(sessionId, (pending.get(sessionId) ?? []).filter((f) => f.relPath !== relPath));
      try {
        await rm(join(cwd, relPath), { force: true });
      } catch {
      }
      json(res, 200, { ok: true });
    }
  });
  const last = webServer.register({
    kind: "exact",
    path: "/plugins/file-native/last",
    handler: (req, res) => {
      if (!isLoopback(req)) return json(res, 403, { ok: false, error: "forbidden" });
      const sessionId = query(req).get("sessionId") ?? "";
      json(res, 200, { ok: true, files: lastSent.get(sessionId) ?? [] });
    }
  });
  return () => {
    upload();
    remove();
    last();
  };
}
function apply(ctx) {
  const tryRegister = () => {
    const webServer = ctx.get("webServer") ?? ctx.webServer;
    if (webServer === void 0) return void 0;
    return registerRoutes(ctx, webServer);
  };
  const direct = tryRegister();
  if (direct) {
    ctx.effect(() => direct, "file-native: routes");
  } else {
    let dispose;
    const timer = setInterval(() => {
      const d = tryRegister();
      if (d) {
        clearInterval(timer);
        dispose = d;
        ctx.logger.info("[file-native] upload route registered (deferred)");
      }
    }, 400);
    ctx.effect(() => () => {
      clearInterval(timer);
      dispose?.();
    }, "file-native: routes deferred");
  }
  ctx.on("agent/pre-step", async (...args) => {
    const payload = args[0];
    const next = args[1];
    const decision = await next();
    if (decision?.kind === "reject") return decision;
    const agent = payload.agent;
    const sessionId = String(agent?.id ?? "");
    const files = takePending(sessionId);
    if (files.length === 0 || !Array.isArray(decision.messages) || decision.messages.length === 0) {
      return decision;
    }
    const lastIndex = decision.messages.length - 1;
    const notice = {
      id: `file-native-${String(decision.messages[lastIndex]?.id ?? randomUUID())}`,
      role: "user",
      content: [{ type: "text", text: fileListText(files) }],
      source: {
        kind: "plugin",
        plugin: "file-native",
        form: "notice",
        summary: `\u{1F4CE} \u9644\u4EF6 ${files.length} \u4E2A\u6587\u4EF6`
      }
    };
    return {
      ...decision,
      messages: [...decision.messages.slice(0, lastIndex), notice, decision.messages[lastIndex], ...decision.messages.slice(lastIndex + 1)]
    };
  });
  ctx.logger.info("[file-native] host loaded");
}
export {
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
