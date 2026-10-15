(function () {
  var M3 = window.M3, KEY = 'monster-1-move-atlas', SIDE_KEY = 'monster-1-right-move-atlas', UP_KEY = 'monster-1-up-move-atlas', LEFT_KEY = 'monster-1-left-move-atlas', FPS = 8;
  // All directions follow the supplied plist frame names and original canvas offsets.
  var frames = [{name:'move-01.png',rect:[0,0,250,240],offset:[7,15],source:[258,258]},
    {name:'move-02.png',rect:[761,0,248,235],offset:[4,16],source:[258,258]},
    {name:'move-03.png',rect:[252,0,252,237],offset:[6,3],source:[258,258]},
    {name:'move-04.png',rect:[506,0,253,233],offset:[0,15],source:[258,258]}];
  var sideFrames = [{"name":"monster-1-right-01.png","rect":[0.0,0.0,244.0,166.0],"offset":[7.0,46.0],"source":[258.0,258.0],"side":true},{"name":"monster-1-right-02.png","rect":[246.0,0.0,240.0,166.0],"offset":[12.0,46.0],"source":[258.0,258.0],"side":true},{"name":"monster-1-right-03.png","rect":[735.0,0.0,230.0,158.0],"offset":[20.0,46.0],"source":[258.0,258.0],"side":true},{"name":"monster-1-right-04.png","rect":[488.0,0.0,245.0,149.0],"offset":[6.0,46.0],"source":[258.0,258.0],"side":true}], upFrames = [{"name":"monster-1-up-01.png","rect":[710.0,0.0,220.0,216.0],"offset":[19.0,31.0],"source":[258.0,258.0],"back":true},{"name":"monster-1-up-02.png","rect":[0.0,0.0,246.0,237.0],"offset":[6.0,10.0],"source":[258.0,258.0],"back":true},{"name":"monster-1-up-03.png","rect":[486.0,0.0,222.0,233.0],"offset":[15.0,14.0],"source":[258.0,258.0],"back":true},{"name":"monster-1-up-04.png","rect":[248.0,0.0,236.0,231.0],"offset":[16.0,12.0],"source":[258.0,258.0],"back":true}];
  var leftFrames = [{"name":"monster-1-left-01.png","rect":[0.0,0.0,244.0,166.0],"offset":[7.0,46.0],"source":[258.0,258.0],"left":true},{"name":"monster-1-left-02.png","rect":[246.0,0.0,240.0,166.0],"offset":[6.0,46.0],"source":[258.0,258.0],"left":true},{"name":"monster-1-left-03.png","rect":[735.0,0.0,230.0,158.0],"offset":[8.0,46.0],"source":[258.0,258.0],"left":true},{"name":"monster-1-left-04.png","rect":[488.0,0.0,245.0,149.0],"offset":[7.0,46.0],"source":[258.0,258.0],"left":true}];
  function horizontal(enemy) { return Math.abs(Number(enemy.moveX)||0) > Math.abs(Number(enemy.moveY)||0); }
  function frameFor(assetKey, enemy, elapsed) {
    if (!enemy || enemy.dying || (assetKey !== 'monster-1' && enemy.unitId !== 'monster-1')) return null;
    return (horizontal(enemy) ? (enemy.moveX < 0 ? leftFrames : sideFrames) : enemy.moveY < 0 ? upFrames : frames)[Math.floor(Math.max(0, Number(elapsed) || 0) * FPS) % 4];
  }
  function drawFrame(imageRegion, frame, flip, x, y, w, h, alpha) {
    var r = frame.rect, scaleX = w/frame.source[0], scaleY = h/frame.source[1], u0 = r[0]/1024, u1 = (r[0]+r[2])/1024;
    return imageRegion(frame.left ? LEFT_KEY : frame.side ? SIDE_KEY : frame.back ? UP_KEY : KEY,
      x + (flip ? frame.source[0]-frame.offset[0]-r[2] : frame.offset[0])*scaleX, y + frame.offset[1]*scaleY,
      r[2]*scaleX, r[3]*scaleY, flip ? u1 : u0, 1-r[1]/256, flip ? u0 : u1, 1-(r[1]+r[3])/256,
      [1,1,1,1], alpha, false, 0);
  }
  function draw(imageRegion, assetKey, enemy, elapsed, x, y, w, h, alpha) {
    var frame = frameFor(assetKey,enemy,elapsed), index;
    if (!frame) return false;
    if (drawFrame(imageRegion,frame,frame.side && enemy.moveX < 0,x,y,w,h,alpha)) return true;
    // Keep an animated front fallback while the side texture is still loading.
    if (frame.side || frame.back || frame.left) { index = Math.floor(Math.max(0,Number(elapsed)||0)*FPS)%4; return drawFrame(imageRegion,frames[index],false,x,y,w,h,alpha); }
    return false;
  }
  M3.EnemyAnimations = {
    manifest: [{key:KEY,type:'image',url:'subpackages/monsters/assets/Image/enemies/spider_move.png',version:'1'},
      {key:SIDE_KEY,type:'image',url:'subpackages/monsters/assets/Image/enemies/spider_move_right.png',version:'1'},
      {key:UP_KEY,type:'image',url:'subpackages/monsters/assets/Image/enemies/spider_move_up.png',version:'2'},
      {key:LEFT_KEY,type:'image',url:'subpackages/monsters/assets/Image/enemies/spider_move_left.png',version:'1'}],
    frameFor:frameFor, draw:draw
  };
})();
