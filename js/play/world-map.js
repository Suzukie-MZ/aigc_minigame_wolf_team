(function () {
  var M3 = window.M3;
  function completed(save,node){return!!(node&&(save.completed[node.levelId]||save.completed[node.id]));}
  function completedRef(save,configured,ref){var i,node;if(save.completed[ref])return true;for(i=0;i<configured.length;i+=1){node=configured[i];if((node.id===ref||node.levelId===ref)&&completed(save,node))return true;}return false;}
  function starsFor(save,node){return Math.max(save.stars[node.levelId]||0,save.stars[node.id]||0);}
  function starsForRef(save,configured,ref){var i,node,value=save.stars[ref]||0;if(!ref)return value;for(i=0;i<configured.length;i+=1){node=configured[i];if(node.id===ref||node.levelId===ref)value=Math.max(value,starsFor(save,node));}return value;}
  M3.WorldMap = {
    isUnlocked: function (node, save, previousNode, index, configured) { var i, p = node.prerequisites || [];configured=configured||[];if(index===0)return true;if(!completed(save,previousNode))return false;if((save.playerLevel||1)<(node.minPlayerLevel||1))return false;for(i=0;i<p.length;i+=1)if(!completedRef(save,configured,p[i]))return false;return starsForRef(save,configured,node.starSource||'')>=(node.minStars||0); },
    nodes: function (manifest) { var save=M3.SaveData.get(),configured=manifest.worldMap.nodes||[];return configured.map(function(n,index){var previousNode=index>0?configured[index-1]:null;return{id:n.id,levelId:n.levelId,x:n.x,y:n.y,displayName:n.displayName||('前哨'+(index+1)),description:n.description||'守住最后的珊瑚礁',unlocked:M3.WorldMap.isUnlocked(n,save,previousNode,index,configured),stars:starsFor(save,n)};}); }
  };
})();
