import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  contentText,
  extOf,
  fileListText,
  formatSize,
  isAnyImage,
  isNativeImage,
  isSafeRelPath,
  extractPasteText,
  parseNoticeFiles,
  planPaste,
  sanitizeFileName,
  splitIntake,
  uniqueName,
  UPLOAD_DIR,
} from '../src/lib.ts';

describe('isNativeImage', () => {
  it('认官方四种 MIME', () => {
    assert.equal(isNativeImage({ type: 'image/png', name: 'a.png' }), true);
    assert.equal(isNativeImage({ type: 'image/jpeg', name: 'a.jpg' }), true);
    assert.equal(isNativeImage({ type: 'image/webp', name: 'a.webp' }), true);
    assert.equal(isNativeImage({ type: 'image/gif', name: 'a.gif' }), true);
  });
  it('其它图片不进官方轨', () => {
    assert.equal(isNativeImage({ type: 'image/svg+xml', name: 'a.svg' }), false);
    assert.equal(isNativeImage({ type: 'image/bmp', name: 'a.bmp' }), false);
  });
  it('MIME 空时按扩展名兜底', () => {
    assert.equal(isNativeImage({ type: '', name: 'shot.PNG' }), true);
    assert.equal(isNativeImage({ type: 'application/octet-stream', name: 'x.webp' }), true);
    assert.equal(isNativeImage({ type: '', name: 'notes.pdf' }), false);
  });
});

describe('sanitizeFileName / uniqueName', () => {
  it('剥路径与非法字符', () => {
    assert.equal(sanitizeFileName('../../a b.pdf'), 'a b.pdf');
    assert.equal(sanitizeFileName('a<>:"|?*.txt'), 'a_______.txt');
    assert.equal(sanitizeFileName('...'), 'file');
    assert.equal(sanitizeFileName(''), 'file');
  });
  it('重名追加 -1', () => {
    const taken = new Set(['report.pdf', 'report-1.pdf']);
    assert.equal(uniqueName('report.pdf', taken), 'report-2.pdf');
    assert.equal(uniqueName('fresh.txt', taken), 'fresh.txt');
  });
});

describe('isSafeRelPath', () => {
  it('只允许 .dsh-uploads 下一层', () => {
    assert.equal(isSafeRelPath(`${UPLOAD_DIR}/a.pdf`), true);
    assert.equal(isSafeRelPath(`${UPLOAD_DIR}/../etc/passwd`), false);
    assert.equal(isSafeRelPath('/etc/passwd'), false);
    assert.equal(isSafeRelPath('notes.md'), false);
  });
});

describe('extOf / formatSize / splitIntake', () => {
  it('扩展名角标', () => {
    assert.equal(extOf('a.PDF'), 'PDF');
    assert.equal(extOf('Makefile'), 'FILE');
    assert.equal(extOf('a.markdown'), 'MARK');
  });
  it('体积文案', () => {
    assert.equal(formatSize(800), '800 B');
    assert.equal(formatSize(2048), '2.0 KB');
    assert.equal(formatSize(2 * 1024 * 1024), '2.0 MB');
  });
  it('按类型分流', () => {
    const png = { name: 'a.png', type: 'image/png' } as File;
    const pdf = { name: 'b.pdf', type: 'application/pdf' } as File;
    const { images, others } = splitIntake([png, pdf]);
    assert.equal(images.length, 1);
    assert.equal(others.length, 1);
  });
});

describe('planPaste 粘贴分流(无视觉桥用户不回归)', () => {
  it('任意 image/* 都算图(含 heic)', () => {
    assert.equal(isAnyImage({ type: 'image/heic', name: 'a.heic' }), true);
    assert.equal(isAnyImage({ type: 'image/svg+xml', name: 'a.svg' }), true);
    assert.equal(isAnyImage({ type: 'image/png', name: 'a.png' }), true);
    assert.equal(isAnyImage({ type: 'application/pdf', name: 'a.pdf' }), false);
  });
  it('纯官方四类图 → yield(官方/ModLens 自己处理)', () => {
    const plan = planPaste([
      { name: 'a.png', type: 'image/png' } as File,
      { name: 'b.jpg', type: 'image/jpeg' } as File,
    ]);
    assert.equal(plan.action, 'yield');
  });
  it('纯 heic 粘贴 → 接管进文件卡(v0.1.3 行为,不依赖视觉桥)', () => {
    const plan = planPaste([{ name: 'a.heic', type: 'image/heic' } as File]);
    assert.equal(plan.action, 'take');
    if (plan.action === 'take') {
      assert.equal(plan.cards.length, 1);
      assert.equal(plan.nativeImages.length, 0);
    }
  });
  it('混贴 heic+png+pdf:heic/pdf 进文件卡,png 走官方轨探测', () => {
    const plan = planPaste([
      { name: 'a.heic', type: 'image/heic' } as File,
      { name: 'b.png', type: 'image/png' } as File,
      { name: 'c.pdf', type: 'application/pdf' } as File,
    ]);
    assert.equal(plan.action, 'take');
    if (plan.action === 'take') {
      assert.deepEqual(plan.cards.map((f) => f.name).sort(), ['a.heic', 'c.pdf']);
      assert.deepEqual(plan.nativeImages.map((f) => f.name), ['b.png']);
    }
  });
  it('纯文件粘贴 → 接管上传', () => {
    const plan = planPaste([{ name: 'a.pdf', type: 'application/pdf' } as File]);
    assert.equal(plan.action, 'take');
    if (plan.action === 'take') assert.equal(plan.cards.length, 1);
  });
  it('MIME 空的 png 截图 → yield(官方扩展名兜底)', () => {
    const plan = planPaste([{ name: 'shot.PNG', type: '' } as File]);
    assert.equal(plan.action, 'yield');
  });
});

describe('extractPasteText 混贴附带文字取舍', () => {
  const pdf = { name: '报告.pdf' };
  const png = { name: '屏幕快照 2026-09-07.png' };
  it('Windows 路径字(全是文件路径)→ 丢弃', () => {
    assert.equal(extractPasteText('C:\\Users\\x\\Desktop\\报告.pdf', [pdf]), '');
    assert.equal(extractPasteText('/Users/x/Desktop/报告.pdf', [pdf]), '');
  });
  it('多文件多行路径 → 丢弃', () => {
    assert.equal(extractPasteText('C:\\a\\报告.pdf\nC:\\b\\图.png', [pdf, { name: '图.png' }]), '');
  });
  it('Excel/说明文字(不引用文件名)→ 整段保留', () => {
    const tsv = '姓名\t分数\n张三\t98';
    assert.equal(extractPasteText(tsv, [png]), tsv);
    assert.equal(extractPasteText('这是设计稿的修改说明,请看附件', [pdf]), '这是设计稿的修改说明,请看附件');
  });
  it('文字里顺带提到文件名 → 整段保留不拆改', () => {
    assert.equal(extractPasteText('详见 报告.pdf 的修改说明', [pdf]), '详见 报告.pdf 的修改说明');
  });
  it('空文字 → 空', () => {
    assert.equal(extractPasteText('  ', [pdf]), '');
  });
});

describe('fileListText / parseNoticeFiles', () => {
  it('往返还原安全路径', () => {
    const files = [{
      name: '谷歌买4.txt',
      relPath: `${UPLOAD_DIR}/谷歌买4.txt`,
      size: 248,
      mediaType: 'text/plain',
    }];
    const parsed = parseNoticeFiles(fileListText(files));
    assert.deepEqual(parsed, files);
  });
  it('拒绝越权路径', () => {
    const text = '- evil — path="../etc/passwd" size=1';
    assert.equal(parseNoticeFiles(text).length, 0);
  });
  it('contentText 抽文本块', () => {
    assert.equal(contentText([{ type: 'text', text: 'hello' }]), 'hello');
  });
});
