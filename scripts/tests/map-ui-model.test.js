'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(w,h,top=0,bottom=0){
  const M3={Layout:{w,h,safeTop:top,bottomPadding:bottom}},ctx={window:{M3}};
  for(const file of ['js/play/neutral-config.js','js/render/font-cn-main-data.js','js/render/ui-font-hd-data.js','js/render/bitmap-font.js','js/render/ui-layout.js','js/render/map-ui-model.js'])
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../..',file),'utf8'),ctx);
  M3.BitmapFont.configure({presentation:{typography:{}}});return M3;
}
test('all 30 level numbers and actual long names fit at phone widths without squeezing glyphs',()=>{
  for(const [w,h,top,bottom] of [[414,896,0,0],[390,844,44,34],[320,568,20,0]]){
    const M3=setup(w,h,top,bottom),l=M3.UILayout.get(),r=l.levelCard(0,0),c=M3.MapUI.content(l,r);
    for(let n=1;n<=30;n++)assert.ok(M3.BitmapFont.measureLabel('第'+n+'关',18)<=c.number.w);
    const names=Object.values(M3.NeutralConfig.levels).map(x=>x.uiName)
      .concat(require('../fixtures/map-level-labels.json').map(x=>x.name),'垂直贫民窟');
    for(const raw of names){
      const name=raw.replace(/\s*[·•—]\s*第.*关\s*$/,''),lines=M3.MapUI.wrap(name,14,c.name.w);
      assert.equal(lines.join(''),name);
      assert.ok(lines.length*16<=c.name.h,`${w}: ${name}`);
      for(const line of lines)assert.ok(M3.BitmapFont.measureLabel(line,14)<=c.name.w);
    }
    assert.equal(c.divider.y,c.number.y+c.number.h/2);
    assert.equal(c.divider.y,c.name.y+c.name.h/2);
    assert.equal(c.divider.x+c.divider.w/2,(c.number.x+c.number.w+c.name.x)/2);
    assert.ok(c.hint.y+c.hint.h<=c.action.y);
    assert.ok(c.action.y+c.action.h<r.y+r.h);
  }
});
test('navigation targets stay at least 48px, separate and above the title on small safe-area screens',()=>{
  for(const [w,h,top,bottom] of [[414,896,0,0],[390,844,44,34],[320,568,20,0]]){
    const l=setup(w,h,top,bottom).UILayout.get(),nav=[l.mapHome,l.mapMore,l.mapExit];
    for(const r of nav){assert.ok(r.w>=48&&r.h>=48);assert.ok(r.y>=top);assert.ok(r.y+r.h<=l.mapHeader.y);assert.ok(r.x+r.w<=w);}
    assert.ok(nav[0].x+nav[0].w<nav[1].x&&nav[1].x+nav[1].w<nav[2].x);
    assert.ok(l.mapDock.y+l.mapDock.h<=h-bottom);
  }
});
test('preview themes honor explicit map metadata and use name-based presentation fallbacks',()=>{
  const M3=setup(414,896);
  assert.equal(Array.from(M3.MapUI.wrap('霓虹防线',14,51)).join('/'),'霓虹/防线');
  for(const entry of require('../fixtures/map-level-labels.json'))for(const ch of entry.name)
    assert.ok(M3.UIFontHDData.characters.includes(ch),`HD glyph missing: ${ch}`);
  for(const [name,theme] of [['霓虹防线','city'],['钢铁苍穹','factory'],['峡谷哨戒线','wasteland']])
    assert.equal(M3.MapUI.theme({uiName:name,map:{theme:'8e5d1f50ea0f'}}),theme);
  assert.equal(M3.MapUI.theme({uiName:'钢铁苍穹',map:{presentation:{previewTheme:'wasteland'}}}),'wasteland');
  assert.equal(M3.MapUI.theme({uiName:'钢铁苍穹',map:{theme:'forest'}}),'forest');
});
