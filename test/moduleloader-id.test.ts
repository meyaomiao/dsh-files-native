import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name: string };
const client = readFileSync(join(root, 'lib/client.js'), 'utf8');
const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8');

describe('ModuleLoader id matches package.json name', () => {
  it('package.json name is a non-empty string', () => {
    assert.equal(typeof pkg.name, 'string');
    assert.ok(pkg.name.length > 0);
  });

  it('committed lib/client.js ModuleLoader id equals package.json name', () => {
    const match = client.match(/window\.__ModuleLoader__\.load\(\{\s*id:\s*"([^"]+)"/);
    assert.ok(match, 'lib/client.js must contain a ModuleLoader load({ id }) banner');
    assert.equal(match[1], pkg.name);
  });

  it('client module inject is slots only (no betterSidebar)', () => {
    const src = readFileSync(join(root, 'src/client.ts'), 'utf8');
    const match = src.match(/^const inject = \[([^\]]*)\];/m);
    assert.ok(match, 'src/client.ts must declare const inject');
    assert.equal(match[1].replace(/\s/g, '').replace(/'/g, '"'), '"slots"');
  });

  it('cordis.patch.yml insert name equals package.json name; plugin id stays file-native', () => {
    const insert = patch.match(/-\s*insert:\s*\n\s*-\s*id:\s*(\S+)\s*\n\s*name:\s*(\S+)/);
    assert.ok(insert, 'cordis.patch.yml must contain an insert with id and name');
    const pluginId = insert[1];
    const insertName = insert[2];
    assert.equal(pluginId, 'file-native');
    assert.equal(insertName, pkg.name);
    assert.notEqual(pluginId, pkg.name);
  });
});
