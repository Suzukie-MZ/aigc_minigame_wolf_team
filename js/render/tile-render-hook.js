(function(){
  var M3=window.M3,draw=M3.Renderer.draw;
  M3.Renderer.draw=function(context,view){M3.Renderer._activeView=view;draw(context,view);};
})();
