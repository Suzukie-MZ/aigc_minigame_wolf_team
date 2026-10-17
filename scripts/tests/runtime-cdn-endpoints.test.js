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
  assert.deepEqual(requests, ['https://p1-ad.adkwai.com/udata/pkg/KS-GAME/ksgame_wolves/runtime-manifest.json', manifest.levels[id].url]);
});
test('manifest without level URLs uses the configured JSON template', async () => {
  const s = setup(), requests = [];
  const manifest = JSON.parse(JSON.stringify(s.M3.NeutralConfig.manifest));
  const id = manifest.worldMap.nodes[0].levelId;
  const level = JSON.parse(JSON.stringify(s.M3.NeutralConfig.levels[id]));
  manifest.levels = { [id]: { revision: 1 } };
  manifest.worldMap.nodes = [manifest.worldMap.nodes[0]];
  s.KwaiNetwork = { request(o) { requests.push(o.url); o.onSuccess({ statusCode: 200, data: JSON.parse(JSON.stringify(requests.length === 1 ? manifest : level)) }); } };
  load(s, 'play/runtime-config.js');
  await new Promise(resolve => s.M3.RuntimeConfig.init(resolve));
  assert.equal(s.M3.RuntimeConfig.getSource(), 'remote');
  assert.equal(requests[1], s.RUNTIME_CONFIG_ENDPOINTS.levelUrlTemplate.replace('{levelId}', id));
});

test('remote font atlas cannot replace bundled pixels used by the local glyph index', async () => {
  const s=setup();
  const manifest=JSON.parse(JSON.stringify(s.M3.NeutralConfig.manifest));
  const id=manifest.worldMap.nodes[0].levelId,level=s.M3.NeutralConfig.levels[id];
  manifest.worldMap.nodes=[manifest.worldMap.nodes[0]];
  manifest.assetManifest=manifest.assetManifest.filter(item=>item.key!=='font-cn-main-8');
  manifest.assetManifest.push({key:'font-cn-main-8',type:'image',url:'https://example.com/obsolete-atlas.png',version:'old'});
  let request=0;
  s.KwaiNetwork={request(o){o.onSuccess({statusCode:200,data:JSON.parse(JSON.stringify(request++===0?manifest:level))});}};
  load(s,'play/runtime-config.js');
  await new Promise(resolve=>s.M3.RuntimeConfig.init(resolve));
  const fonts=s.M3.RuntimeConfig.getManifest().assetManifest.filter(item=>item.key==='font-cn-main-8');
  assert.equal(fonts.length,1);
  assert.equal(fonts[0].url,'assets/Font/font-cn-main-8.png');
  assert.equal(fonts[0].version,'3');
});
