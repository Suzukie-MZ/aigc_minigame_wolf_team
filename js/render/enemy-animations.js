(function () {
  var M3 = window.M3, FPS = 8;
  var monsters = {
    'monster-1': '裂隙爬兽', 'monster-2': '流亡掠夺者', 'monster-3': '幽影飞袭者',
    'monster-4': '远古战争傀儡', 'monster-5': '重甲异兽', 'monster-6': '咒印潜伏者', 'boss-1': '终末领主'
  }, atlases = {}, manifest = [];
  var packs = {
    '裂隙爬兽': 'monsters', '流亡掠夺者': 'monsters-light', '幽影飞袭者': 'monsters-light',
    '咒印潜伏者': 'monsters-light', '远古战争傀儡': 'monsters-heavy', '重甲异兽': 'monsters-heavy',
    '终末领主': 'monsters-heavy'
  };
  var raw = {
    '裂隙爬兽': {move:[1024,256,'742,0,246,202,0,-5;496,0,244,204,0,3;249,0,245,219,0,3;0,0,247,220,-1,6'],up:[512,1024,'0,0,242,229,8,-10;0,465,228,236,0,-4;0,231,238,232,5,4;230,465,220,233,-4,11'],left:[1024,512,'498,0,244,165,0,-8;0,0,243,174,0,-6;245,0,251,164,1,0;0,176,236,178,5,8'],'right':[2048,256,'771,0,257,186,0,-10;259,0,251,195,-3,-9;512,0,257,187,0,0;0,0,257,199,0,-3']},
    '流亡掠夺者': {move:[1024,512,'0,246,227,245,14,-3;0,0,233,244,-12,-1;235,0,229,241,8,0;466,0,220,240,-3,1'],up:[1024,512,'0,251,243,251,7,-4;0,0,251,249,-3,-3;483,0,221,243,12,6;253,0,228,243,0,6'],left:[1024,256,'0,0,244,228,7,-1;719,0,218,227,-19,-1;246,0,243,228,7,10;491,0,226,228,-15,8'],'right':[1024,256,'753,0,225,243,16,6;0,0,257,248,0,4;518,0,233,243,12,6;259,0,257,245,0,5']},
    '幽影飞袭者': {move:[1024,256,'0,0,249,247,4,4;506,0,257,199,0,-19;765,0,257,181,0,-9;251,0,253,214,-2,7'],up:[1024,256,'0,0,245,249,6,3;739,0,257,201,0,-21;495,0,242,224,8,6;247,0,246,236,-5,4'],left:[1024,256,'0,0,222,245,-7,5;458,0,235,206,3,-14;695,0,235,178,-4,-9;224,0,232,213,-5,8'],'right':[1024,256,'0,0,221,244,3,6;447,0,228,212,-8,-15;677,0,222,203,5,-5;223,0,222,221,-4,2']},
    '远古战争傀儡': {move:[1024,512,'252,0,250,245,4,-2;0,0,250,257,-3,-1;504,0,245,250,0,3;751,0,243,250,1,3'],up:[1024,512,'0,245,250,244,-3,-1;259,0,250,243,-1,-1;0,0,257,243,0,-2;511,0,249,242,4,7'],left:[1024,512,'0,0,251,242,3,-8;0,244,233,244,-12,-7;493,0,236,235,-3,10;253,0,238,234,-9,11'],'right':[2048,512,'0,0,257,257,0,-1;259,0,257,257,0,-1;777,0,257,234,0,11;518,0,257,236,0,10']},
    '终末领主': {move:[1024,256,'518,0,252,228,3,-3;0,0,257,249,0,-5;772,0,238,238,-4,3;259,0,257,246,0,5'],up:[1024,512,'0,0,219,257,3,-1;221,0,212,256,0,0;435,0,213,250,-8,3;650,0,206,252,-4,2'],left:[1024,256,'0,0,257,227,0,-4;259,0,257,222,0,-6;772,0,251,218,3,4;518,0,252,226,-2,9'],'right':[1024,256,'259,0,257,226,0,-1;518,0,244,228,-6,-2;764,0,257,204,0,3;0,0,257,241,0,7']},
    '重甲异兽': {move:[1024,256,'0,0,245,225,0,7;247,0,237,222,3,9;723,0,229,218,0,13;486,0,235,223,-2,9'],up:[512,512,'0,0,219,241,-4,7;221,0,214,238,1,3;0,243,218,242,-2,7;220,243,217,242,-1,7'],left:[1024,256,'505,0,249,169,4,-4;253,0,250,172,-3,3;756,0,257,163,0,7;0,0,251,172,-3,12'],'right':[1024,256,'259,0,247,168,1,-2;760,0,247,167,-1,0;0,0,257,207,0,15;508,0,250,165,4,0']},
    '咒印潜伏者': {move:[1024,256,'0,0,230,252,-8,-3;459,0,218,252,-1,-3;232,0,225,252,-8,2;679,0,214,248,-7,4'],up:[1024,512,'0,0,240,257,9,-1;464,0,217,257,-19,-1;242,0,220,257,-6,-1;683,0,204,257,-13,-1'],left:[1024,512,'246,0,241,232,1,-4;0,0,244,232,-2,-3;489,0,240,231,2,1;0,234,237,235,-4,7'],'right':[1024,256,'512,0,252,245,3,-3;259,0,251,253,-3,-1;766,0,250,243,4,-1;0,0,257,253,0,1']}
  };
  function parse(name, direction, data, width, height) {
    var parts = data.split(';'), frames = [], i, values;
    for (i = 0; i < parts.length; i += 1) { values = parts[i].split(',').map(Number); frames.push({name:'walk-0' + (i + 1), rect:values.slice(0,4), offset:values.slice(4), source:[256,256]}); }
    return {key:name + '-' + direction + '-move-atlas', width:width, height:height, frames:frames};
  }
  Object.keys(raw).forEach(function (name) {
    ['move','up','left','right'].forEach(function (direction) {
      var d = raw[name][direction], atlas = parse(name, direction, d[2], d[0], d[1]);
      atlases[name + ':' + direction] = atlas;
      manifest.push({key:atlas.key,type:'image',url:'subpackages/' + packs[name] + '/assets/Image/' + name + '/' + name + '_' + direction + '.png',version:'1'});
    });
  });
  function direction(enemy) {
    if (Math.abs(Number(enemy.moveX) || 0) > Math.abs(Number(enemy.moveY) || 0)) return enemy.moveX < 0 ? 'left' : 'right';
    return enemy.moveY < 0 ? 'up' : 'move';
  }
  function atlasFor(assetKey, enemy) {
    var name = monsters[enemy && enemy.unitId] || monsters[assetKey];
    return name && atlases[name + ':' + direction(enemy)];
  }
  function frameFor(assetKey, enemy, elapsed) {
    var atlas = atlasFor(assetKey, enemy);
    if (!atlas || !enemy || enemy.dying) return null;
    return atlas.frames[Math.floor(Math.max(0, Number(elapsed) || 0) * FPS) % atlas.frames.length];
  }
  function draw(imageRegion, assetKey, enemy, elapsed, x, y, w, h, alpha) {
    var atlas = atlasFor(assetKey, enemy), frame = frameFor(assetKey, enemy, elapsed), r, sx, sy;
    if (!atlas || !frame) return false;
    r = frame.rect; sx = w / frame.source[0]; sy = h / frame.source[1];
    return imageRegion(atlas.key, x + frame.offset[0] * sx, y + frame.offset[1] * sy,
      r[2] * sx, r[3] * sy, r[0] / atlas.width, 1 - r[1] / atlas.height,
      (r[0] + r[2]) / atlas.width, 1 - (r[1] + r[3]) / atlas.height,
      [1,1,1,1], alpha, false, 0);
  }
  M3.EnemyAnimations = {manifest:manifest, frameFor:frameFor, draw:draw, monsters:monsters};
})();
