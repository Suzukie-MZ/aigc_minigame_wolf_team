const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(w,h,safeTop=0,bottomPadding=0){const M3={Layout:{w,h,safeTop,bottomPadding}},ctx={window:{M3}};vm.runInNewContext(fs.readFileSync('js/render/ui-layout.js','utf8'),ctx);return M3;}
test('briefing sections fit phones and safe areas without overlapping actions or map legend',()=>{
 for(const dims of [[414,896,0,0],[390,844,44,34],[320,568,0,0],[320,568,20,20]]){
  const M3=setup(...dims),l=M3.UILayout.get(),sections=[l.detailHeader,l.detailMapFrame,l.detailObjective,l.detailFlow,l.detailBack];
  assert.ok(l.detailHeader.y>=dims[2]+54);
  for(let i=1;i<sections.length;i++)assert.ok(sections[i].y>=sections[i-1].y+sections[i-1].h);
  assert.ok(l.detailPreview.h>=120);assert.ok(l.detailPreview.y+l.detailPreview.h<=l.detailLegend.y);
  assert.ok(l.detailLegend.y+l.detailLegend.h<=l.detailMapFrame.y+l.detailMapFrame.h-8);
  assert.ok(l.detailBack.x+l.detailBack.w<l.detailStart.x);
  for(const r of [l.detailBack,l.detailStart,l.detailClose]){assert.ok(r.w>=48&&r.h>=48);assert.ok(r.x>=0&&r.x+r.w<=dims[0]);assert.ok(r.y>=dims[2]&&r.y+r.h<=dims[1]-dims[3]);}
 }
});
