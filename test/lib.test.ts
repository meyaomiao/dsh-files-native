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
  parseNoticeFiles,
  sanitizeFileName,
  splitIntake,
  uniqueName,
  UPLOAD_DIR,
  classifyPasteFiles,
  decidePasteAction,
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

describe('isAnyImage / decidePasteAction', () => {
  it('任意 image/* 都算图(含 heic),官方轨以外的图也让出', () => {
    assert.equal(isAnyImage({ type: 'image/heic', name: 'a.heic' }), true);
    assert.equal(isAnyImage({ type: 'image/svg+xml', name: 'a.svg' }), true);
    assert.equal(isAnyImage({ type: 'image/png', name: 'a.png' }), true);
    assert.equal(isAnyImage({ type: 'application/pdf', name: 'a.pdf' }), false);
    assert.equal(isAnyImage({ type: '', name: 'shot.PNG' }), true);
  });
  it('纯图粘贴 yield,纯文件 take-files,混贴 split', () => {
    assert.equal(decidePasteAction(1, 0), 'yield');
    assert.equal(decidePasteAction(2, 0), 'yield');
    assert.equal(decidePasteAction(0, 1), 'take-files');
    assert.equal(decidePasteAction(1, 1), 'split');
    assert.equal(decidePasteAction(0, 0), 'yield');
  });
  it('classifyPasteFiles 把 heic 归到 images', () => {
    const heic = { name: 'a.heic', type: 'image/heic' } as File;
    const pdf = { name: 'b.pdf', type: 'application/pdf' } as File;
    const { images, others } = classifyPasteFiles([heic, pdf]);
    assert.equal(images.length, 1);
    assert.equal(others.length, 1);
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
