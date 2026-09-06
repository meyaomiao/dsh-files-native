/**
 * file-native 宿主半:把非图片附件落到会话工作区 `.dsh-uploads/`,
 * 发送时经 agent/pre-step 把相对路径交给模型。图片仍走官方草稿图。
 */

import { randomUUID } from 'node:crypto';
import { appendFileSync, createWriteStream, mkdirSync } from 'node:fs';
import { mkdir, readFile, rename, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  fileListText,
  isSafeRelPath,
  MAX_FILE_BYTES,
  type RailFile,
  sanitizeFileName,
  uniqueName,
  UPLOAD_DIR,
} from './lib.ts';

const name = 'file-native';
/** 访问 webServer / sessions 前必须写进 inject,否则 DSH 抛 cannot get property without inject,进程起不来。见 docs/plugin-dev-gate.md。 */
const inject = ['webServer', 'sessions'];

export type { RailFile };

interface HostCtx {
  logger: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };
  sessions: { get: (id: string) => { header?: { cwd?: string } } | undefined };
  webServer?: {
    register: (route: {
      kind: 'exact';
      path: string;
      handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
    }) => () => void;
  };
  get: (key: string) => unknown;
  effect: (fn: () => (() => void) | void, label?: string) => void;
  on: (event: string, listener: (...args: never[]) => unknown) => void;
}

const pending = new Map<string, RailFile[]>();
const lastSent = new Map<string, RailFile[]>();
/** 已武装会话:下一条消息的 pre-step 注入当前 pending 文件(提交瞬间由客户端设置)。 */
const armed = new Set<string>();

function sessionCwd(ctx: HostCtx, sessionId: string, clientCwd?: string): string {
  const headerCwd = ctx.sessions.get(sessionId)?.header?.cwd;
  if (headerCwd) return headerCwd;
  if (clientCwd && resolve(clientCwd) === clientCwd) return clientCwd;
  return process.cwd();
}

function json(res: ServerResponse, code: number, body: unknown): void {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function isLoopback(req: IncomingMessage): boolean {
  const host = String(req.headers.host ?? '').split(':')[0] ?? '';
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1') return true;
  const parts = host.split('.');
  return parts.length === 4 && parts[0] === '127' && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

function query(req: IncomingMessage): URLSearchParams {
  return new URL(req.url ?? '/', 'http://dsh.internal').searchParams;
}

async function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > limit) {
      const error = new Error('too-large');
      (error as { code?: string }).code = 'too-large';
      throw error;
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

async function writeUpload(cwd: string, fileName: string, bytes: Buffer): Promise<RailFile> {
  const dir = join(cwd, UPLOAD_DIR);
  await mkdir(dir, { recursive: true });
  const taken = new Set<string>();
  try {
    const { readdir } = await import('node:fs/promises');
    for (const item of await readdir(dir)) taken.add(item);
  } catch {
    // 目录刚创建
  }
  const safe = uniqueName(sanitizeFileName(fileName), taken);
  const target = join(dir, safe);
  const resolvedCwd = resolve(cwd);
  const resolvedTarget = resolve(target);
  if (resolvedTarget !== resolvedCwd && !resolvedTarget.startsWith(resolvedCwd + sep)) {
    throw new Error('path-escape');
  }
  const tmp = join(dirname(target), `.${safe}.${randomUUID()}.tmp`);
  await new Promise<void>((resolveWrite, reject) => {
    const stream = createWriteStream(tmp, { flags: 'wx' });
    stream.on('error', reject);
    stream.end(bytes, () => resolveWrite());
  });
  await rename(tmp, target);
  const info = await stat(target);
  return {
    name: fileName.replace(/^.*[/\\]/, '') || safe,
    relPath: `${UPLOAD_DIR}/${safe}`,
    size: info.size,
    mediaType: 'application/octet-stream',
  };
}

function takePending(sessionId: string): RailFile[] {
  const files = pending.get(sessionId) ?? [];
  pending.delete(sessionId);
  if (files.length > 0) lastSent.set(sessionId, files);
  return files;
}

function registerRoutes(ctx: HostCtx, webServer: NonNullable<HostCtx['webServer']>): () => void {
  const upload = webServer.register({
    kind: 'exact',
    path: '/plugins/file-native/upload',
    handler: async (req, res) => {
      if (!isLoopback(req)) return json(res, 403, { ok: false, error: 'forbidden' });
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method' });
      const q = query(req);
      const sessionId = q.get('sessionId') ?? '';
      const fileName = q.get('name') ?? 'file';
      if (sessionId === '') return json(res, 400, { ok: false, error: 'sessionId' });
      try {
        const bytes = await readBody(req, MAX_FILE_BYTES);
        if (bytes.length === 0) return json(res, 400, { ok: false, error: 'empty' });
        const cwd = sessionCwd(ctx, sessionId, q.get('cwd') ?? undefined);
        const file = await writeUpload(cwd, fileName, bytes);
        file.mediaType = q.get('type') || file.mediaType;
        const list = pending.get(sessionId) ?? [];
        list.push(file);
        pending.set(sessionId, list);
        json(res, 200, { ok: true, file });
      } catch (error) {
        const code = (error as { code?: string }).code === 'too-large' ? 413 : 400;
        ctx.logger.warn('[file-native] upload failed: %o', error);
        json(res, code, { ok: false, error: code === 413 ? 'too-large' : 'write-failed' });
      }
    },
  });

  const remove = webServer.register({
    kind: 'exact',
    path: '/plugins/file-native/remove',
    handler: async (req, res) => {
      if (!isLoopback(req)) return json(res, 403, { ok: false, error: 'forbidden' });
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method' });
      const q = query(req);
      const sessionId = q.get('sessionId') ?? '';
      const relPath = q.get('path') ?? '';
      if (sessionId === '' || !isSafeRelPath(relPath)) return json(res, 400, { ok: false, error: 'bad-path' });
      const cwd = sessionCwd(ctx, sessionId, q.get('cwd') ?? undefined);
      pending.set(sessionId, (pending.get(sessionId) ?? []).filter((f) => f.relPath !== relPath));
      try {
        await rm(join(cwd, relPath), { force: true });
      } catch {
        // 已不在磁盘上不算失败
      }
      json(res, 200, { ok: true });
    },
  });

  const last = webServer.register({
    kind: 'exact',
    path: '/plugins/file-native/last',
    handler: (req, res) => {
      if (!isLoopback(req)) return json(res, 403, { ok: false, error: 'forbidden' });
      const sessionId = query(req).get('sessionId') ?? '';
      json(res, 200, { ok: true, files: lastSent.get(sessionId) ?? [] });
    },
  });

  // 武装:客户端在提交瞬间调用,标记「下一条消息的 pre-step 注入当前 pending 文件」。
  // 一次性消费;忙时排队不调用,排队消息自然不带文件。
  const arm = webServer.register({
    kind: 'exact',
    path: '/plugins/file-native/arm',
    handler: (req, res) => {
      if (!isLoopback(req)) return json(res, 403, { ok: false, error: 'forbidden' });
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method' });
      const sessionId = query(req).get('sessionId') ?? '';
      if (sessionId === '') return json(res, 400, { ok: false, error: 'sessionId' });
      armed.add(sessionId);
      json(res, 200, { ok: true });
    },
  });

  // 对话区文件卡「新页签打开」:按扩展名给 Content-Type,文本/图片/PDF 页签内展示,
  // 二进制(office/zip 等)浏览器自动下载(=本地打开)。
  const file = webServer.register({
    kind: 'exact',
    path: '/plugins/file-native/file',
    handler: async (req, res) => {
      if (!isLoopback(req)) return json(res, 403, { ok: false, error: 'forbidden' });
      if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method' });
      const q = query(req);
      const sessionId = q.get('sessionId') ?? '';
      const relPath = q.get('path') ?? '';
      if (sessionId === '' || !isSafeRelPath(relPath)) return json(res, 400, { ok: false, error: 'bad-path' });
      try {
        const cwd = sessionCwd(ctx, sessionId);
        const abs = resolve(cwd, relPath);
        const info = await stat(abs);
        if (!info.isFile()) throw new Error('not-file');
        const bytes = await readFile(abs);
        const ext = relPath.split('.').pop()?.toLowerCase() ?? '';
        const types: Record<string, string> = {
          md: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8',
          json: 'application/json; charset=utf-8', csv: 'text/csv; charset=utf-8',
          pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
          html: 'text/html; charset=utf-8', xml: 'application/xml',
        };
        const name = relPath.replace(/^.*[/\\]/, '');
        res.writeHead(200, {
          'content-type': types[ext] ?? 'application/octet-stream',
          'content-length': String(bytes.length),
          'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
        });
        res.end(bytes);
      } catch {
        json(res, 404, { ok: false, error: 'not-found' });
      }
    },
  });

  return () => {
    upload();
    remove();
    last();
    arm();
    file();
  };
}

export function apply(ctx: HostCtx): void {
  const tryRegister = (): (() => void) | undefined => {
    const webServer = (ctx.get('webServer') as HostCtx['webServer']) ?? ctx.webServer;
    if (webServer === undefined) return undefined;
    return registerRoutes(ctx, webServer);
  };

  const direct = tryRegister();
  if (direct) {
    ctx.effect(() => direct, 'file-native: routes');
  } else {
    let dispose: (() => void) | undefined;
    const timer = setInterval(() => {
      const d = tryRegister();
      if (d) {
        clearInterval(timer);
        dispose = d;
        ctx.logger.info('[file-native] upload route registered (deferred)');
      }
    }, 400);
    ctx.effect(() => () => {
      clearInterval(timer);
      dispose?.();
    }, 'file-native: routes deferred');
  }

  ctx.on('agent/pre-step', async (...args: never[]) => {
    const payload = args[0] as { agent?: { id?: unknown } };
    const next = args[1] as () => Promise<unknown>;
    const decision = await next() as {
      kind?: string;
      messages?: Array<{ id?: string; role?: string; content?: unknown; source?: unknown }>;
    };
    if (decision?.kind === 'reject') return decision;
    const agent = (payload as { agent?: { id?: unknown } }).agent;
    const sessionId = String(agent?.id ?? '');
    // 辅助 step(标题/摘要生成等)的消息列表为空:绝不能取 pending,否则附件被吞、
    // 正式消息(如排队消息)开跑时 pending 已空,附件静默丢失。
    if (!Array.isArray(decision.messages) || decision.messages.length === 0) return decision;
    const lastMessage = decision.messages[decision.messages.length - 1];
    if (String(lastMessage?.role) !== 'user') return decision;
    const files = takePending(sessionId);
    // 新链路:客户端提交瞬间武装,这里一次性消费 pending 注入精确属于本消息的
    // 附件通知。未武装(如忙时纯文字排队)就不动消息。
    if (!armed.has(sessionId)) return decision;
    armed.delete(sessionId);
    const deliver = files;
    if (deliver.length === 0) return decision;
    lastSent.set(sessionId, deliver);
    const lastIndex = decision.messages.length - 1;
    const notice = {
      id: `file-native-${String(decision.messages[lastIndex]?.id ?? randomUUID())}`,
      role: 'user',
      content: [{ type: 'text', text: fileListText(deliver) }],
      source: {
        kind: 'plugin',
        plugin: 'file-native',
        form: 'notice',
        summary: `📎 附件 ${deliver.length} 个文件`,
      },
    };
    return {
      ...decision,
      messages: [...decision.messages.slice(0, lastIndex), notice, decision.messages[lastIndex], ...decision.messages.slice(lastIndex + 1)],
    };
  });

  ctx.logger.info('[file-native] host loaded');
}

export { inject, name };
