'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
function load(s, file) { vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), s); }
function setup() {
  const s = { M3: {}, setTimeout(fn) { fn(); }, console };
  s.window = s;
  vm.createContext(s);
  load(s, 'runtime-endpoints.js');
  load(s, 'play/neutral-config.js');
  load(s, 'play/config-validator.js');
  s.KwaiStorage = { getSync() {}, setSync() {} };
  return s;
}
test('CDN manifest URL loads first and versioned level URL takes precedence over template', async () => {
  const s = setup(), requests = [];
  const manifest = JSON.parse(JSON.stringify(s.M3.NeutralConfig.manifest));
  const id = manifest.worldMap.nodes[0].levelId;
  const level = JSON.parse(JSON.stringify(s.M3.NeutralConfig.levels[id]));
  manifest.levels = { [id]: { url: 'https://example.com/releases/new/level-1.json' } };
  manifest.worldMap.nodes = [manifest.worldMap.nodes[0]];
  s.KwaiNetwork = { request(o) { requests.push(o.url); o.onSuccess({ statusCode: 200, data: JSON.parse(JSON.stringify(requests.length === 1 ? manifest : level)) }); } };
  load(s, 'play/runtime-config.js');
  await new Promise(resolve => s.M3.RuntimeConfig.init(resolve));
  assert.equal(s.M3.RuntimeConfig.getSource(), 'remote');
  assert.equal(new URL(requests[0]).origin + new URL(requests[0]).pathname, s.RUNTIME_CONFIG_ENDPOINTS.manifestUrl);
  assert.ok(new URL(requests[0]).searchParams.get('_runtime'));
  assert.equal(requests[1], manifest.levels[id].url);
  assert.equal(s.RUNTIME_CONFIG_ENDPOINTS.levelUrlTemplate, undefined);
});
test('explicit development template remains supported', async () => {
  const s = setup(), requests = [];
  const manifest = JSON.parse(JSON.stringify(s.M3.NeutralConfig.manifest));
  const id = manifest.worldMap.nodes[0].levelId;
  const level = JSON.parse(JSON.stringify(s.M3.NeutralConfig.levels[id]));
  s.RUNTIME_CONFIG_ENDPOINTS.levelUrlTemplate = 'https://example.com/dev/{levelId}.json';
  manifest.levels = { [id]: { revision: 1 } };
  manifest.worldMap.nodes = [manifest.worldMap.nodes[0]];
  s.KwaiNetwork = { request(o) { requests.push(o.url); o.onSuccess({ statusCode: 200, data: JSON.parse(JSON.stringify(requests.length === 1 ? manifest : level)) }); } };
  load(s, 'play/runtime-config.js');
  await new Promise(resolve => s.M3.RuntimeConfig.init(resolve));
  assert.equal(s.M3.RuntimeConfig.getSource(), 'remote');
  assert.equal(requests[1], s.RUNTIME_CONFIG_ENDPOINTS.levelUrlTemplate.replace('{levelId}', id));
});

test('missing CDN level URL fails without requesting an old release', async () => {
  const s = setup(), requests = [];
  const manifest = JSON.parse(JSON.stringify(s.M3.NeutralConfig.manifest));
  const id = manifest.worldMap.nodes[0].levelId;
  manifest.levels = { [id]: { revision: 1 } };
  manifest.worldMap.nodes = [manifest.worldMap.nodes[0]];
  s.KwaiNetwork = { request(o) { requests.push(o.url); o.onSuccess({ statusCode: 200, data: manifest }); } };
  load(s, 'play/runtime-config.js');
  await new Promise(resolve => s.M3.RuntimeConfig.init(resolve));
  assert.equal(s.M3.RuntimeConfig.getSource(), 'error');
  assert.equal(requests.length, 1);
  assert.match(s.M3.RuntimeConfig.getErrors().join(','), /关卡地址缺失/);
});
test('each initialization refreshes the entry and follows its new release', async () => {
  const s = setup(), requests = [];
  const original = JSON.parse(JSON.stringify(s.M3.NeutralConfig.manifest));
  const id = original.worldMap.nodes[0].levelId;
  const originalLevel = JSON.parse(JSON.stringify(s.M3.NeutralConfig.levels[id]));
  let version = 1;
  s.RUNTIME_CONFIG_ENDPOINTS.manifestUrl += '?channel=demo#entry';
  s.KwaiNetwork = { request(o) {
    requests.push(o.url);
    const manifestRequest = new URL(o.url).pathname.endsWith('runtime-manifest.json');
    const data = JSON.parse(JSON.stringify(manifestRequest ? original : originalLevel));
    if (manifestRequest) {
      data.releaseId = 'release-' + version;
      data.levels = { [id]: { url: 'https://example.com/releases/' + version + '/' + id + '.json' } };
      data.worldMap.nodes = [data.worldMap.nodes[0]];
    } else data.displayName = '版本' + version;
    o.onSuccess({ statusCode: 200, data });
  } };
  load(s, 'play/runtime-config.js');
  await new Promise(resolve => s.M3.RuntimeConfig.init(resolve));
  version = 2;
  await new Promise(resolve => s.M3.RuntimeConfig.init(resolve));
  assert.equal(s.M3.RuntimeConfig.getSource(), 'remote');
  assert.notEqual(requests[0], requests[2]);
  for (const url of [requests[0], requests[2]]) {
    assert.equal(new URL(url).searchParams.get('channel'), 'demo');
    assert.ok(new URL(url).searchParams.get('_runtime'));
    assert.equal(new URL(url).hash, '#entry');
  }
  assert.equal(requests[3], 'https://example.com/releases/2/' + id + '.json');
  assert.equal(s.M3.RuntimeConfig.getManifest().releaseId, 'release-2');
  assert.equal(s.M3.RuntimeConfig.getLevel(id).displayName, '版本2');
});

test('runtime normalization preserves remote combat descriptors including invalid presence for fail-closed validation',async()=>{
 for(const descriptor of [{schemaVersion:1,sourceCommit:'test',roles:{}},null]) {
  const s=setup(),manifest=JSON.parse(JSON.stringify(s.M3.NeutralConfig.manifest)),id=manifest.worldMap.nodes[0].levelId,level=JSON.parse(JSON.stringify(s.M3.NeutralConfig.levels[id]));
  manifest.levels={[id]:{url:'https://example.com/new/level.json'}};manifest.worldMap.nodes=[manifest.worldMap.nodes[0]];manifest.presentation.combatAnimations=descriptor;
  s.KwaiNetwork={request(o){o.onSuccess({statusCode:200,data:JSON.parse(JSON.stringify(o.url.includes('/new/level.json')?level:manifest))});}};
  load(s,'play/runtime-config.js');await new Promise(resolve=>s.M3.RuntimeConfig.init(resolve));assert.equal(s.M3.RuntimeConfig.getSource(),'remote');
  assert.equal(JSON.stringify(s.M3.RuntimeConfig.getManifest().presentation.combatAnimations),JSON.stringify(descriptor));
 }
});
