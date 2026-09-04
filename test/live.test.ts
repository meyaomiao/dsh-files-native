import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  addImages,
  clearLiveOwner,
  getLiveOwner,
  resetLiveForTests,
  setLiveOwner,
} from '../src/live.ts';
import type { LiveOwner } from '../src/live.ts';

function image(name: string): File {
  return { name, type: 'image/png' } as File;
}

function owner(sessionId: string, onAddImages: LiveOwner['onAddImages']): LiveOwner {
  return {
    sessionId,
    attachments: [],
    canAcceptDrop: true,
    onAddImages,
    onRemoveImage: () => {},
  };
}

describe('live attachment owner', () => {
  beforeEach(() => resetLiveForTests());

  it('旧会话卸载不会清掉刚挂上的新会话 owner', () => {
    const seen: string[] = [];
    const oldToken = setLiveOwner(owner('A', () => seen.push('A')));
    setLiveOwner(owner('B', (files) => seen.push(`B:${files[0]?.name ?? ''}`)));
    clearLiveOwner(oldToken);
    assert.equal(getLiveOwner()?.sessionId, 'B');
    addImages('B', [image('shot.png')]);
    assert.deepEqual(seen, ['B:shot.png']);
  });

  it('owner 未挂上时图片排队,挂上后交给官方 onAddImages', () => {
    const seen: string[] = [];
    addImages('S', [image('queued.png')]);
    setLiveOwner(owner('S', (files) => seen.push(files.map((file) => file.name).join(','))));
    assert.deepEqual(seen, ['queued.png']);
  });

  it('排队图片不会投递给错误会话', () => {
    const seen: string[] = [];
    addImages('A', [image('only-a.png')]);
    setLiveOwner(owner('B', (files) => seen.push(`B:${files[0]?.name ?? ''}`)));
    assert.equal(seen.length, 0);
    setLiveOwner(owner('A', (files) => seen.push(`A:${files[0]?.name ?? ''}`)));
    assert.deepEqual(seen, ['A:only-a.png']);
  });
});
