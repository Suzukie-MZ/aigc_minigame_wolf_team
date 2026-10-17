'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../js/render/terrain-depth.js'),'utf8');
function setup(tiles,width=3,search=''){
 const calls=[],active={state:'BATTLE'},M={Renderer:{_activeView:active},TextureAssets:{get:()=>({width:1024}),tileKey:(m,t)=>m.tileAssets[t]}};
 vm.runInNewContext(source,{window:{M3:M,location:{search}}});
 const board={width,height:tiles.length/width,tile(x,y){return x<0||y<0||x>=this.width||y>=this.height?'void':tiles[y*this.width+x];}};
 const map={tiles,tileAssets:{grass:'g',road:'r',obstacle:'o',spawn:'s',goal:'z',hero_slot:'h',tower_slot:'t'}};
 return{M,board,map,calls,active,draw(towers){return M.TerrainDepth.draw(map,board,{x:20,y:30},40,(...a)=>calls.push(['atlas',...a]),(...a)=>{assert.equal(M.Renderer._activeView,null);calls.push(['rect',...a]);},(...a)=>calls.push(['special',...a]),towers);}};
}
test('continuous ground only exposes perimeter and follows live cleared board',()=>{
 const x=setup(['grass','obstacle','road','grass','grass','road']);
 assert.equal(x.M.TerrainDepth.edges(x.board,0,0).east,false);
 assert.equal(x.M.TerrainDepth.edges(x.board,1,0).south,false);
 assert.equal(x.M.TerrainDepth.edges(x.board,1,0).east,true);
 x.map.tiles[1]='tower_slot';assert.equal(x.M.TerrainDepth.edges(x.board,0,0).east,false);
 x.map.tiles[1]='road';assert.equal(x.M.TerrainDepth.edges(x.board,0,0).east,true);
});
test('draw keeps map unchanged, special markers, positions, and restores legacy hook',()=>{
 const x=setup(['spawn','road','goal','obstacle','tower_slot','hero_slot']);const old=JSON.stringify(x.map);
 assert.equal(x.draw(),true);assert.equal(JSON.stringify(x.map),old);assert.equal(x.M.Renderer._activeView,x.active);
 assert.deepEqual(x.calls.filter(c=>c[0]==='special').map(c=>c[1]),['terrain-depth-foundation']);
 for(const c of x.calls.filter(c=>c[0]==='atlas')){assert.ok(c[2]>=20&&c[3]>=30);assert.ok(c[2]+c[4]<=140.01&&c[3]+c[5]<=110.01);}
});
test('missing image or flat option draws nothing and preserves legacy state',()=>{
 for(const mode of ['missing','flat']){const x=setup(['grass','road','grass'],3,mode==='flat'?'?terrain=flat':'');if(mode==='missing')x.M.TextureAssets.get=()=>null;assert.equal(x.draw(),false);assert.equal(x.calls.length,0);assert.equal(x.M.Renderer._activeView,x.active);}
});
test('draw restores legacy hook even after rendering throws',()=>{
 const x=setup(['grass','road','grass']);assert.throws(()=>x.M.TerrainDepth.draw(x.map,x.board,{x:0,y:0},40,()=>{throw Error('GL failure')},()=>{},()=>{}));assert.equal(x.M.Renderer._activeView,x.active);
});

function platforms(x){return x.calls.filter(c=>(c[0]==='atlas'&&c[1]==='terrain-depth-markers'&&c[6]<.01&&c[7]>.9)||(c[0]==='special'&&c[1]==='terrain-depth-foundation')).map(c=>[c[2],c[3]]);}
test('occupied towers omit extra platforms; empty slots and hero platforms remain',()=>{
 const x=setup(['tower_slot','tower_slot','hero_slot']);
 const towers=[{x:0,y:0,level:1}];const before=JSON.stringify({map:x.map,towers});
 x.draw(towers);
 assert.deepEqual(platforms(x),[[60,30],[100,30]]);
 assert.equal(x.calls.filter(c=>c[0]==='atlas'&&c[1]==='terrain-depth-atlas'&&c[2]===20&&c[4]===40&&c[5]===20).length,2); // ground remains below baked tower base
 assert.equal(JSON.stringify({map:x.map,towers}),before);
 x.calls.length=0;towers.push({x:1,y:0,level:6});x.draw(towers);
 assert.deepEqual(platforms(x),[[100,30]]);
});
test('removing or moving towers restores platforms without stale occupancy',()=>{
 const x=setup(['tower_slot','tower_slot'],2),towers=[{x:0,y:0}];
 x.draw(towers);assert.deepEqual(platforms(x),[[60,30]]);
 x.calls.length=0;towers[0].x=1;x.draw(towers);assert.deepEqual(platforms(x),[[20,30]]);
 x.calls.length=0;towers.pop();x.draw(towers);assert.deepEqual(platforms(x),[[20,30],[60,30]]);
});
test('map preview without occupancy keeps all empty platforms',()=>{
 const x=setup(['tower_slot','tower_slot','hero_slot']);x.draw();
 assert.deepEqual(platforms(x),[[20,30],[60,30],[100,30]]);
});

test('empty foundation uses the full tower cell canvas and bottom anchor',()=>{
 const x=setup(['tower_slot'],1);x.draw();
 const pad=x.calls.find(c=>c[0]==='special'&&c[1]==='terrain-depth-foundation');
 assert.deepEqual(pad.slice(2),[20,30,40,40,1]);
 assert.equal(x.calls.filter(c=>c[0]==='atlas'&&c[6]>.5&&c[7]<.5).length,0);
});
test('unavailable foundation keeps a compressed bottom-aligned construction marker',()=>{
 const x=setup(['tower_slot'],1),calls=[];
 x.M.TerrainDepth.draw(x.map,x.board,{x:0,y:0},100,(...a)=>calls.push(a),()=>{},()=>false);
 const pad=calls.find(c=>c[5]>.5&&c[6]<.5);
 assert.deepEqual(pad.slice(1,5),[8,54,84,42]);
});

test('hero, portal, goal and obstacle use distinct atlas regions without a second platform',()=>{
 const x=setup(['hero_slot','spawn','goal','obstacle'],4);x.draw();
 const markers=x.calls.filter(c=>c[0]==='atlas'&&c[1]==='terrain-depth-markers');
 assert.equal(markers.length,4);
 assert.equal(new Set(markers.map(c=>JSON.stringify(c.slice(6,10)))).size,4);
 assert.deepEqual(markers.map(c=>c.slice(2,6)),[[20,30,40,40],[60,30,40,40],[100,30,40,40],[140,30,40,40]]);
 assert.equal(x.calls.filter(c=>c[0]==='special').length,0);
});
test('marker loading fallback remains visible and has no stacked hero platform',()=>{
 const x=setup(['hero_slot','spawn','goal','obstacle'],4);
 x.M.TextureAssets.get=k=>k==='terrain-depth-markers'?null:{width:512};x.draw();
 const markers=x.calls.filter(c=>c[0]==='special');
 assert.deepEqual(markers.map(c=>c[1]),['h','s','z','terrain-depth-rock']);
 for(const c of markers.slice(0,3)){assert.equal(c[4],33.6);assert.equal(c[5],16.8);}
 assert.equal(markers[3][4],40);
});
test('ground and roads stay contiguous with compressed texture depth',()=>{
 const x=setup(['grass','tower_slot','hero_slot','road'],4);x.draw();
 const ground=x.calls.filter(c=>c[0]==='atlas'&&c[1]==='terrain-depth-atlas'&&c[4]===40&&c[5]===20);
 assert.equal(ground.length,8);
 for(let i=0;i<4;i++){assert.deepEqual(ground.slice(i*2,i*2+2).map(c=>c.slice(2,6)),[[20+i*40,30,40,20],[20+i*40,50,40,20]]);}
 assert.equal(x.M.TerrainDepth.edges(x.board,0,0).east,false);
 assert.equal(x.M.TerrainDepth.edges(x.board,1,0).east,false);
});
