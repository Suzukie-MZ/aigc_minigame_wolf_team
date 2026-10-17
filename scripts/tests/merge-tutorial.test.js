'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const M3={Layout:{w:390,h:844,safeTop:0,bottomPadding:0},SaveData:{get:()=>({tutorial:{}})},_now:()=>1000};
 const ctx={window:{M3},console};vm.createContext(ctx);
 for(const f of ['js/render/ui-layout.js','js/render/combat-projection.js','js/play/tutorial.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
 M3.Tutorial.init();return {M3,ctx};
}
test('merged tutorial follows hero modal then tower modal with working next controls',()=>{
 const {M3}=setup(),l=M3.UILayout.get(),v={presentation:{},state:'HERO_SELECT',heroes:[],deck:[]};
 let t=M3.Tutorial.view(v);assert.equal(t.id,'hero-pick');assert.equal(t.targets[0],l.heroModalCards[0]);
 v.heroes=['hero-1'];t=M3.Tutorial.view(v);assert.equal(t.targets[0],l.heroNext);
 assert.equal(M3.Tutorial.handlePointer(l.heroNext.x+10,l.heroNext.y+10,{tutorial:t}),false);
 v.state='DECK_SELECT';t=M3.Tutorial.view(v);assert.equal(t.id,'tower-pick');assert.equal(t.targets[0],l.towerCards[0]);
 v.deck=['a','b','c','d'];t=M3.Tutorial.view(v);assert.equal(t.targets[0],l.towerStart);
 assert.equal(M3.Tutorial.handlePointer(l.towerStart.x+10,l.towerStart.y+10,{tutorial:t}),false);
});
test('merged deployment tutorial targets the projected playable cell and ignores margins',()=>{
 const {M3}=setup();M3.UILayout.setGrid(8,6);const l=M3.UILayout.get();
 const c={board:{width:8,height:6,path:[],isBuildable:(x,y)=>x===3&&y===2,isHeroSlot:()=>false},towers:[],heroes:[],mode:'tower',selectedCard:'a',deckIds:['a'],cardCosts:{a:10},gold:100};
 const v={presentation:{},state:'BATTLE',difficulty:1,combat:c,paused:false};
 const click=()=>{const t=M3.Tutorial.view(v),r=t.nextRect||t.targets[0];return M3.Tutorial.handlePointer(r.x+r.w/2,r.y+r.h/2,{tutorial:t});};
 M3.Tutorial.onBattleStart(true);click();assert.equal(M3.Tutorial.view(v).id,'pause');
 v.paused=true;assert.equal(M3.Tutorial.view(v).id,'resume');v.paused=false;assert.equal(M3.Tutorial.view(v).id,'tower-card');click();
 const t=M3.Tutorial.view(v),g=M3.CombatProjection.geometry(l,c.board);assert.equal(t.id,'tower-place');
 assert.deepEqual(JSON.parse(JSON.stringify(t.targets[0])),{x:g.x+3*g.cx,y:g.y+2*g.cy,w:g.cx,h:g.cy});
 assert.equal(M3.Tutorial.handlePointer(g.x+3.5*g.cx,g.y+2.5*g.cy,{tutorial:t}),false);
 assert.equal(M3.Tutorial.handlePointer(l.board.x,l.board.y,{tutorial:t}),true);
});
