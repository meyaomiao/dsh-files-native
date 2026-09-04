import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as store from '../src/store.ts';

describe('archiveIfNoticeMatches', () => {
  it('路径对上才清待发,对不上不动', () => {
    const sid = `test-${Date.now()}`;
    store.add(sid, {
      id: 'a',
      sessionId: sid,
      name: 'a.txt',
      relPath: '.dsh-uploads/a.txt',
      size: 1,
      mediaType: 'text/plain',
      status: 'done',
    });
    assert.equal(store.pending().some((item) => item.id === 'a'), true);
    assert.equal(store.archiveIfNoticeMatches(sid, [{
      name: 'old.txt',
      relPath: '.dsh-uploads/old.txt',
      size: 1,
      mediaType: 'text/plain',
    }]).length, 0);
    assert.equal(store.pending().some((item) => item.id === 'a'), true);
    assert.equal(store.archiveIfNoticeMatches(sid, [{
      name: 'a.txt',
      relPath: '.dsh-uploads/a.txt',
      size: 1,
      mediaType: 'text/plain',
    }]).length, 1);
    assert.equal(store.pending().some((item) => item.id === 'a'), false);
  });

  it('pendingFor 只返回当前会话的待发卡', () => {
    const a = `session-a-${Date.now()}`;
    const b = `session-b-${Date.now()}`;
    store.add(a, {
      id: `${a}-item`,
      name: 'a.txt',
      relPath: '.dsh-uploads/a.txt',
      size: 1,
      mediaType: 'text/plain',
      status: 'done',
    });
    store.add(b, {
      id: `${b}-item`,
      name: 'b.pdf',
      relPath: '',
      size: 2,
      mediaType: 'application/pdf',
      status: 'uploading',
    });
    assert.deepEqual(store.pendingFor(a).map((item) => item.name), ['a.txt']);
    assert.deepEqual(store.pendingFor(b).map((item) => item.name), ['b.pdf']);
    assert.equal(store.pendingFor('other').length, 0);
  });
});
