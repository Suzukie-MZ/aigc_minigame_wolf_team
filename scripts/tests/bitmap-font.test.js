'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('bitmap font covers common Chinese and falls back for missing glyphs', () => {
  const calls = [], context = { window: { M3: { Layout: { dpr: 3 } } } };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../js/render/font-cn-main-data.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../js/render/bitmap-font.js'), 'utf8'), context);
  context.window.M3.TextureAssets = { get() { return {}; } };
  context.window.M3.BitmapFont.configure({ presentation: { typography: {} } });
  const renderer = { imageRegion() { calls.push(Array.from(arguments)); return true; } };
  assert.equal(context.window.M3.BitmapFont.hasGlyph('游'), true);
  assert.equal(context.window.M3.BitmapFont.hasGlyph('9'), true);
  assert.equal(context.window.M3.BitmapFont.hasGlyph('𠀀'), false);
  assert.equal(context.window.M3.BitmapFont.drawText(renderer, '游戏𠀀', 0, 0, 2, [1,1,1,1], 200, 'left', 'body'), true);
  assert.ok(calls.length >= 3);
  assert.ok(calls.every(call => call[0].startsWith('font-cn-main-')));
  assert.ok(calls.every(call => call[4] >= 13.5));
  assert.ok(calls.every(call => call[11] === true));
});

test('small UI copy keeps a readable size and truncates instead of shrinking indefinitely', () => {
  const calls = [], context = { window: { M3: { Layout: { dpr: 3 } } } };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../js/render/font-cn-main-data.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../js/render/bitmap-font.js'), 'utf8'), context);
  context.window.M3.TextureAssets = { get() { return {}; } };
  context.window.M3.BitmapFont.configure({ presentation: { typography: { minReadableSize: 10.5 } } });
  const renderer = { imageRegion() { calls.push(Array.from(arguments)); return true; } };
  assert.equal(context.window.M3.BitmapFont.drawText(renderer, '很长的手机界面说明文字', 0, 0, .36, [1,1,1,1], 42, 'left', 'body'), true);
  assert.ok(calls.length > 0);
  assert.ok(calls.every(call => call[3] >= 13.5 && call[4] >= 13.5));
  assert.ok(calls.length < 11 * 6);
});

test('font effects stay within one physical pixel and button text has no ghost layers', () => {
  const calls = [], context = { window: { M3: { Layout: { dpr: 3 } } } };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../js/render/font-cn-main-data.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../js/render/bitmap-font.js'), 'utf8'), context);
  context.window.M3.TextureAssets = { get() { return {}; } };
  context.window.M3.BitmapFont.configure({ presentation: { typography: {
    effectsEnabled: true,
    outlineWidth: 3,
    shadowColor: [0, 0, 0, 0.8],
    shadowOffsetX: 3,
    shadowOffsetY: 3,
    styles: { button: { minSize: 13.5, letterSpacing: -1.5, outlineWidth: 0, shadowColor: [0,0,0,0], shadowOffsetX: 0, shadowOffsetY: 0 } }
  } } });
  const renderer = { imageRegion() { calls.push(Array.from(arguments)); return true; } };
  assert.equal(context.window.M3.BitmapFont.drawText(renderer, '清', 10, 20, 1, [1,1,1,1], 100, 'left', 'body'), true);
  assert.equal(calls.length, 6);
  assert.ok(calls.every(call => Math.abs(call[1] - 10) <= 1 / 3 + 1e-9 && Math.abs(call[2] - 20) <= 1 / 3 + 1e-9));
  assert.ok(calls.some(call => call[9][3] === 0.8 && call[10] === 0.16));
  calls.length = 0;
  assert.equal(context.window.M3.BitmapFont.drawText(renderer, '按钮', 10, 20, .4, [.02,.07,.1,1], 100, 'left', 'button'), true);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(call => call[3] >= 15 && call[4] >= 15));
  assert.ok(calls[1][1] - calls[0][1] >= 15 * .86 + .75 - 1 / 3);
  calls.length = 0;
  assert.equal(context.window.M3.BitmapFont.drawText(renderer, '观看广告 · 立即使用', 75, 20, .55, [.02,.07,.1,1], 150, 'center', 'compactButton'), true);
  assert.equal(calls.length, 11);
  assert.ok(calls.every(call => call[3] >= 15 && call[4] >= 15));
  calls.length = 0;
  assert.equal(context.window.M3.BitmapFont.drawText(renderer, '翻倍', 75, 20, .8, [1,1,1,1], 150, 'center', 'resultButton'), true);
  assert.equal(calls.length, 2);
  assert.ok(calls[1][1] - calls[0][1] >= 15 * .86 + 1.1 - 1 / 3);
});

test('legacy remote typography cannot reintroduce blurry ghost layers by default', () => {
  const calls = [], context = { window: { M3: { Layout: { dpr: 3 } } } };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../js/render/font-cn-main-data.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../js/render/bitmap-font.js'), 'utf8'), context);
  context.window.M3.TextureAssets = { get() { return {}; } };
  context.window.M3.BitmapFont.configure({ presentation: { typography: {
    minReadableSize: 10.5,
    outlineWidth: 3,
    shadowColor: [0, 0, 0, 0.8],
    shadowOffsetX: 3,
    shadowOffsetY: 3,
    styles: { label: { outlineWidth: 2, shadowOffsetY: 2 } }
  } } });
  const renderer = { imageRegion() { calls.push(Array.from(arguments)); return true; } };
  assert.equal(context.window.M3.BitmapFont.drawText(renderer, '清晰', 10, 20, .4, [1,1,1,1], 100, 'left', 'label'), true);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(call => call[3] >= 14 && call[4] >= 14));
});

test('HD glyph overlay uses high-resolution pixels and falls back while its image is loading',()=>{
  const calls=[],M3={Layout:{dpr:3},
    BitmapFontData:{characters:'A□',fallback:'□',pageSize:480,columns:32,cell:40,padding:5},
    UIFontHDData:{key:'font-cn-ui-hd',characters:'测',cell:64,padding:8,columns:20,width:1280,height:64}};
  const context={window:{M3}};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../js/render/bitmap-font.js'),'utf8'),context);
  let ready=true;
  M3.TextureAssets={get:key=>key==='font-cn-ui-hd'&&!ready?null:{}};
  M3.BitmapFont.configure({presentation:{typography:{}}});
  const renderer={imageRegion(...args){calls.push(args);return true;}};
  assert.equal(M3.BitmapFont.hasGlyph('测'),true);
  assert.equal(M3.BitmapFont.drawText(renderer,'测',0,0,1,[1,1,1,1],100,'left','body'),true);
  assert.equal(calls[0][0],'font-cn-ui-hd');
  assert.equal((calls[0][7]-calls[0][5])*1280,48);
  assert.ok(calls[0][6]>calls[0][8]); // top-origin atlas, correctly flipped texture UVs
  assert.equal(calls[0][11],false); // preserve the HD font's antialiased edges
  ready=false;calls.length=0;
  assert.equal(M3.BitmapFont.drawText(renderer,'测',0,0,1,[1,1,1,1],100,'left','body'),true);
  assert.equal(calls[0][0],'font-cn-main-0');
});

test('map labels preserve font proportions, natural digit widths and aligned visible centers',()=>{
  const calls=[],M3={Layout:{dpr:3}},context={window:{M3}};
  for(const file of ['font-cn-main-data.js','ui-font-hd-data.js','bitmap-font.js'])
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../js/render',file),'utf8'),context);
  M3.TextureAssets={get:()=>({})};
  M3.BitmapFont.configure({presentation:{typography:{styles:{cardBody:{size:30}}}}});
  const renderer={imageRegion(...args){calls.push(args);return true;}},r={x:10,y:20,w:100,h:24};
  const draw=(text,width=100)=>M3.BitmapFont.drawLabel(renderer,text,{...r,w:width},16,[1,1,1,1]);
  assert.equal(draw('第1关'),true);
  const first=calls.splice(0),metrics=M3.UIFontHDData;
  assert.ok(first.every(c=>c[3]===c[4]));
  assert.ok(Math.abs(first[1][1]-first[0][1]-(16+.35))<.34);
  assert.ok(Math.abs(first[2][1]-first[1][1]-(16*metrics.advances['1']+.35))<.34);
  const width=16*(2+metrics.advances['1'])+.7;
  assert.ok(Math.abs(first[0][1]-(r.x+(r.w-width)/2))<.34);
  assert.equal(draw('霓虹防线'),true);
  const center=(call,ch)=>call[2]+metrics.inkCenters[metrics.characters.indexOf(ch)]*16/metrics.emSize;
  for(let i=0;i<first.length;i++)assert.ok(Math.abs(center(first[i],'第1关'[i])-(r.y+r.h/2))<.34);
  assert.ok(Math.abs(center(calls[0],'霓')-(r.y+r.h/2))<.34);
  calls.length=0;
  assert.equal(draw('霓虹防线',40),true);
  assert.ok(calls.length<4);
  assert.ok(calls.every(c=>c[3]===first[0][3]&&c[4]===first[0][4]));
});
