/** 文件名清洗、图片分流、体积文案——host / client / 测试共用的纯函数。 */

export interface RailFile {
  name: string;
  relPath: string;
  size: number;
  mediaType: string;
}

/** 官方草稿图只收这四种；其余图片走文件卡。 */
export const NATIVE_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const NATIVE_IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);

/** 单文件默认上限 50 MiB。 */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

/** 单批最多 20 个文件。 */
export const MAX_FILES_PER_BATCH = 20;

/** 工作区上传目录（相对会话 cwd）。 */
export const UPLOAD_DIR = '.dsh-uploads';

/** 是否走官方图片轨。 */
export function isNativeImage(file: { type?: string; name?: string }): boolean {
  const type = (file.type ?? '').toLowerCase();
  if (NATIVE_IMAGE_TYPES.has(type)) return true;
  if (type !== '' && type !== 'application/octet-stream') return false;
  const ext = extOf(file.name ?? '');
  return NATIVE_IMAGE_EXT.has(ext.toLowerCase());
}

/** 扩展名角标（最多 4 字符；无扩展名用 FILE）。 */
export function extOf(name: string): string {
  const base = name.replace(/^.*[/\\]/, '');
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return 'FILE';
  return base.slice(dot + 1).slice(0, 4).toUpperCase();
}

/** 剥路径、控制字符、Windows 非法字符；空名回退 file。 */
export function sanitizeFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, '').replace(/[\u0000-\u001f]/g, '');
  const cleaned = base.replace(/[<>:"/\\|?*]/g, '_').replace(/^\.+/, '').trim();
  const sliced = cleaned.slice(0, 180);
  return sliced === '' ? 'file' : sliced;
}

/** 已占用名上追加 -1 / -2。 */
export function uniqueName(name: string, taken: ReadonlySet<string>): string {
  if (!taken.has(name)) return name;
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let i = 1;
  while (taken.has(`${stem}-${i}${ext}`)) i += 1;
  return `${stem}-${i}${ext}`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 相对路径必须落在 UPLOAD_DIR 下、不含 .. */
export function isSafeRelPath(relPath: string): boolean {
  if (relPath === '' || relPath.startsWith('/') || relPath.startsWith('\\')) return false;
  const parts = relPath.split(/[/\\]/);
  if (parts[0] !== UPLOAD_DIR) return false;
  return parts.every((part) => part !== '' && part !== '.' && part !== '..');
}

export function splitIntake(files: readonly File[]): { images: File[]; others: File[] } {
  const images: File[] = [];
  const others: File[] = [];
  for (const file of files) {
    if (isNativeImage(file)) images.push(file);
    else others.push(file);
  }
  return { images, others };
}

/** 发给模型的可读清单。对话区用 parseNoticeFiles 还原卡片。 */
export function fileListText(files: readonly RailFile[]): string {
  const lines = files.map((file) => `- ${file.name} — path="${file.relPath}" size=${file.size} type="${file.mediaType}"`);
  return [
    '用户随本条消息上传了以下文件,已保存到当前工作区,可用 read 工具按路径读取:',
    ...lines,
  ].join('\n');
}

const NOTICE_LINE = /^- (.+?) — path="([^"]+)" size=(\d+)(?: type="([^"]*)")?/;

export function parseNoticeFiles(text: string): RailFile[] {
  const files: RailFile[] = [];
  for (const line of text.split('\n')) {
    const match = NOTICE_LINE.exec(line.trim());
    if (match === null) continue;
    const relPath = match[2] ?? '';
    if (!isSafeRelPath(relPath)) continue;
    files.push({
      name: match[1] ?? 'file',
      relPath,
      size: Number(match[3] ?? 0),
      mediaType: match[4] || 'application/octet-stream',
    });
  }
  return files;
}

export function contentText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const block of content) {
    if (block && typeof block === 'object' && 'text' in block && typeof (block as { text: unknown }).text === 'string') {
      parts.push((block as { text: string }).text);
    }
  }
  return parts.join('\n');
}
