(function(){
  var M3=window.M3,board=null,current=null,phase='in',changed=0,last=0,messageKey='',queue=[];
  var ENTER=160,EXIT=140;
  function idle(c,v){return{key:v.paused?'paused':'idle',kind:'idle',title:v.paused?'战斗暂停':'防线监控中',body:v.paused?'点击继续，恢复对局':'当前第 '+c.wave+' / '+c.waveCount+' 波 · 守住基地'};}
  function sample(v,now){
    var c=v.combat,dt,item,desired,t,opacity,offset,i,key;
    if(board!==c.board){board=c.board;current=null;queue=[];messageKey='';last=now;}
    dt=Math.max(0,Math.min(250,now-last));last=now;
    // Result backdrops retain the final message without creating new notifications.
    if(v.state==='RESULT'&&current)return{item:current,opacity:1,offset:0,phase:'steady'};
    for(i=queue.length-1;i>=0;i-=1){
      if(current&&current.key===queue[i].key&&!v.itemMenuOpen)queue[i].remaining-=dt;
      if(queue[i].remaining<=0)queue.splice(i,1);
    }
    if(v.message){
      key=String(v.message)+'|'+(v.messageExpiresAt||0)+'|'+!!v.messageFailed;
      if(key!==messageKey){
        messageKey=key;
        // Repeated feedback replaces its pending copy instead of flooding the panel.
        for(i=queue.length-1;i>=0;i-=1)if(queue[i].body===String(v.message)&&(!current||queue[i].key!==current.key))queue.splice(i,1);
        queue.push({key:'message:'+key,kind:v.messageFailed?'error':'feedback',title:v.messageFailed?'操作提醒':'作战反馈',body:String(v.message),remaining:2200});
        if(queue.length>6)queue.splice(1,1);
      }
    }else messageKey='';
    desired=idle(c,v);
    if(c.crisisActive)desired={key:'crisis',kind:'crisis',title:'资源危机',body:'基地受损可转化资源'};
    if(queue.length)desired=queue[0];
    if(c.waveWarning>0)desired={key:'wave:'+c.wave,kind:'wave',title:'第 '+c.wave+' 波即将开始',body:'准备防御'};
    if(c.bossWarning>0)desired={key:'boss:'+c.wave,kind:'boss',title:'BOSS 即将出现',body:'第 '+c.wave+' 波 · 准备迎战'};
    if(!current){current=desired;phase='in';changed=now;}
    if(current.key!==desired.key&&phase!=='out'){phase='out';changed=now;}
    if(phase==='out'&&now-changed>=EXIT){current=desired;phase='in';changed=now;}
    if(phase==='in'&&now-changed>=ENTER)phase='steady';
    // Keep live idle counters fresh without restarting the animation every frame.
    if(phase!=='out'&&current.key===desired.key)current=desired;
    t=Math.max(0,Math.min(1,(now-changed)/(phase==='out'?EXIT:ENTER)));
    t=t*t*(3-2*t);
    opacity=phase==='in'?t:phase==='out'?1-t:1;
    offset=phase==='in'?(1-t)*6:phase==='out'?-t*6:0;
    return{item:current,opacity:opacity,offset:offset,phase:phase};
  }
  M3.BattleMessages={sample:sample,assets:[{"key":"ui-settlement-win-v2","type":"image","version":"settlement-relief-2","preload":true,"url":"subpackages/ui-images/assets/Image/ui/ui-settlement-relief-v2.png","render":{"fit":"contain","region":[0.010416666666666666,0.078125,0.34375,0.4375]}},{"key":"ui-settlement-lose-v2","type":"image","version":"settlement-relief-2","preload":true,"url":"subpackages/ui-images/assets/Image/ui/ui-settlement-relief-v2.png","render":{"fit":"contain","region":[0.34375,0.0625,0.6666666666666666,0.4375]}},{"key":"ui-settlement-coins-v2","type":"image","version":"settlement-relief-2","preload":true,"url":"subpackages/ui-images/assets/Image/ui/ui-settlement-relief-v2.png","render":{"fit":"contain","region":[0.7109375,0.1328125,0.9739583333333334,0.4296875]}},{"key":"ui-settlement-experience-v2","type":"image","version":"settlement-relief-2","preload":true,"url":"subpackages/ui-images/assets/Image/ui/ui-settlement-relief-v2.png","render":{"fit":"contain","region":[0.052083333333333336,0.56640625,0.3020833333333333,0.9296875]}},{"key":"ui-settlement-video-v2","type":"image","version":"settlement-relief-2","preload":true,"url":"subpackages/ui-images/assets/Image/ui/ui-settlement-relief-v2.png","render":{"fit":"contain","region":[0.3984375,0.64453125,0.5989583333333334,0.8671875]}},{"key":"ui-settlement-map-v2","type":"image","version":"settlement-relief-2","preload":true,"url":"subpackages/ui-images/assets/Image/ui/ui-settlement-relief-v2.png","render":{"fit":"contain","region":[0.734375,0.5703125,0.9479166666666666,0.8984375]}},{"key":"ui-wave-radar-v1","type":"image","version":"wave-alert-1","preload":true,"url":"subpackages/ui-images/assets/Image/ui/ui-wave-alert-v1.png","render":{"fit":"contain","region":[0,0,0.5,1]}},{"key":"ui-wave-boss-v1","type":"image","version":"wave-alert-1","preload":true,"url":"subpackages/ui-images/assets/Image/ui/ui-wave-alert-v1.png","render":{"fit":"contain","region":[0.5,0,1,1]}},{"key":"battle-arena-background","url":"subpackages/battle-images/assets/Image/ui/battle-arena-background-v1.jpg","type":"image","version":"1","preload":true}]};
})();
