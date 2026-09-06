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

function png(name = 'a.png'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/png' });
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

describe('live owner', () => {
  beforeEach(() => resetLiveForTests());

  it('切会话时旧槽 clear 不会把新槽的 onAddImages 清成空', () => {
    const seen: string[] = [];
    const tokenA = setLiveOwner(owner('A', (files) => {
      seen.push(`A:${files.length}`);
    }));
    setLiveOwner(owner('B', (files) => {
      seen.push(`B:${files[0]?.name ?? ''}`);
    }));
    clearLiveOwner(tokenA);
    assert.equal(getLiveOwner()?.sessionId, 'B');
    addImages('B', [png('shot.png')]);
    assert.deepEqual(seen, ['B:shot.png']);
  });

  it('槽还没挂上时回形针/粘贴的图先排队,挂上后交给 onAddImages', () => {
    const seen: string[] = [];
    addImages('S', [png('queued.png')]);
    assert.equal(seen.length, 0);
    setLiveOwner(owner('S', (files) => {
      seen.push(files.map((file) => file.name).join(','));
    }));
    assert.deepEqual(seen, ['queued.png']);
  });

  it('排队的图不会送到别的会话', () => {
    const seen: string[] = [];
    addImages('A', [png('only-a.png')]);
    setLiveOwner(owner('B', (files) => {
      seen.push(`B:${files[0]?.name ?? ''}`);
    }));
    assert.equal(seen.length, 0);
    setLiveOwner(owner('A', (files) => {
      seen.push(`A:${files[0]?.name ?? ''}`);
    }));
    assert.deepEqual(seen, ['A:only-a.png']);
  });
});
