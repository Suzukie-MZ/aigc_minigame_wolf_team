'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../js/main.js'),'utf8');
function setup(dpr,native=false,safeArea=null){
  let callback,width=0,height=0,writes=0;
  const canvas={style:{},getContext:()=>({viewport(){}})};
  Object.defineProperties(canvas,{width:{get:()=>width,set(v){width=v;writes++;}},height:{get:()=>height,set(v){height=v;writes++;}}});
  const M3={Layout:{},Game:{ensureStarted(){},update(){}},Renderer:{draw(){}},SceneModels:{snapshot:()=>({})}};
  const window={canvas,M3,devicePixelRatio:dpr,innerWidth:414,innerHeight:896,addEventListener(){}};
  const s={window,document:{documentElement:{getAttribute:name=>name==='data-debug-w'?'414':'896'}},console,requestAnimationFrame(fn){callback=fn;}};
  if(native)s.ks={getSystemInfoSync:()=>({windowWidth:414,windowHeight:896,pixelRatio:dpr,safeArea})};
  vm.runInNewContext(source,s);
  return {M3,canvas,window,frame(){callback();},writes:()=>writes};
}
test('browser preview renders at 2x minimum and caps the backing buffer at 3x',()=>{
  for(const [device,expected] of [[1,2],[2,2],[3,3],[4,3]]){
    const s=setup(device);assert.equal(s.canvas.width,414*expected);assert.equal(s.canvas.height,896*expected);
    assert.equal(s.M3.Layout.dpr,expected);
  }
});
test('unchanged frames do not reallocate the canvas; native low-DPR devices retain their own density',()=>{
  const s=setup(1);assert.equal(s.writes(),2);s.frame();s.frame();assert.equal(s.writes(),2);
  s.window.devicePixelRatio=3;s.frame();assert.equal(s.writes(),4);assert.equal(s.canvas.width,1242);
  const native=setup(1,true);assert.equal(native.M3.Layout.dpr,1);assert.equal(native.canvas.width,414);
});

test("native bottom safe area keeps the dock away from the home indicator",()=>{
  const s=setup(3,true,{top:44,bottom:862});
  assert.equal(s.M3.Layout.safeTop,44);
  assert.equal(s.M3.Layout.bottomPadding,34);
  assert.equal(s.M3.Layout.usableH,818);
  s.frame();assert.equal(s.writes(),2);
});
