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
});
