(function () {
  var M3 = window.M3, KEY = 'terrain-depth-atlas', MARKERS = 'terrain-depth-markers';
  // Authored UV bounds preserve front faces near atlas row boundaries.
  var markerRegions = { hero_slot: [0, 0, .5, .525], spawn: [.5, 0, 1, .525],
    goal: [0, .53, .5, .965], obstacle: [.5, .53, 1, .98] };
  var disabled = window.location && /(?:\?|&)terrain=flat(?:&|$)/.test(window.location.search || '');
  function raised(tile) { return tile === 'grass' || tile === 'obstacle' || tile === 'tower_slot' || tile === 'hero_slot'; }
  function edges(board, x, y) {
    if (!raised(board.tile(x, y))) return { north: false, east: false, south: false, west: false };
    return { north: !raised(board.tile(x, y - 1)), east: !raised(board.tile(x + 1, y)),
      south: !raised(board.tile(x, y + 1)), west: !raised(board.tile(x - 1, y)) };
  }
  // UVs are in top-origin atlas space; renderer UVs use bottom origin.
  function region(draw, x, y, w, h, u0, v0, u1, v1, tint, textureKey) {
    var pad = .001;
    draw(textureKey || KEY, x, y, w, h, u0 + pad, 1 - v0 - pad, u1 - pad, 1 - v1 + pad, tint || [1, 1, 1, 1], 1, false, 0);
  }
  function render(map, board, box, cell, draw, rect, image, towers) {
    if (!M3.TerrainDepth.enabled || !map || !map.tileAssets || !M3.TextureAssets || !M3.TextureAssets.get(KEY)) return false;
    var x, y, px, py, tile, edge, key, uv, strip, sampleY, inset = cell * .025, depth = cell * .12;
    var markersReady = M3.TextureAssets.get(MARKERS);
    // Rebuild from live occupancy each frame so selling/moving a tower restores its pad.
    var occupied = {}, i;
    for (i = 0; towers && i < towers.length; i += 1) occupied[towers[i].x + ',' + towers[i].y] = true;
    var active = M3.Renderer && M3.Renderer._activeView;
    // The legacy rect hook replaces tile-sized rectangles with CDN art. Disable it
    // only while this visual layer renders, then restore it for the rest of the frame.
    if (M3.Renderer) M3.Renderer._activeView = null;
    try {
      for (y = 0; y < board.height; y += 1) for (x = 0; x < board.width; x += 1) {
        px = box.x + x * cell; py = box.y + y * cell; tile = board.tile(x, y);
        if (raised(tile)) {
          // Compress texture depth, not the board: adjacent cells still touch and
          // input/path coordinates remain unchanged. Platforms sit on this same ground.
          for (strip = 0; strip < 2; strip += 1) {
            sampleY = (y * 2 + strip) % 3;
            region(draw, px, py + strip * cell * .5, cell, cell * .5, x % 3 / 6, sampleY / 6, (x % 3 + 1) / 6, (sampleY + 1) / 6, [.68, .78, .78, 1]);
          }
        } else if (tile === 'road' || tile === 'spawn' || tile === 'goal') {
          for (strip = 0; strip < 2; strip += 1) {
            region(draw, px, py + strip * cell * .5, cell, cell * .5, .5, 0, 1, .5, [.82, .87, .90, 1]);
          }
        } else {
          key = M3.TextureAssets.tileKey(map, tile);
          if (!key || !image(key, px, py, cell, cell, 1)) rect(px, py, cell, cell, [.05, .16, .18, 1]);
        }
      }
      // Shared ground stays continuous; only the exposed perimeter has a rock face.
      for (y = 0; y < board.height; y += 1) for (x = 0; x < board.width; x += 1) {
        px = box.x + x * cell; py = box.y + y * cell; tile = board.tile(x, y);
        if (raised(tile)) {
          edge = edges(board, x, y);
          if (edge.south) {
            region(draw, px, py + cell - depth, cell, depth, x % 3 / 6, .53, (x % 3 + 1) / 6, .73, [.65, .72, .77, 1]);
            rect(px, py + cell - depth, cell, Math.max(.6, cell * .018), [.36, .54, .48, .5]);
            rect(px, py + cell - inset, cell, inset, [.01, .025, .035, .8]);
          }
          if (edge.north) rect(px, py, cell, inset, [.34, .52, .48, .55]);
          if (edge.west) rect(px, py, inset, cell, [.38, .54, .50, .45]);
          if (edge.east) rect(px + cell - inset, py, inset, cell, [.01, .035, .045, .65]);
        } else if (tile === 'road' || tile === 'spawn' || tile === 'goal') {
          // Ambient occlusion and low metal curbs stay inside the road cell.
          if (raised(board.tile(x, y - 1))) {
            rect(px, py, cell, depth * .60, [.005, .018, .027, .36]);
            rect(px, py, cell, inset, [.12, .19, .21, 1]);
          }
          if (raised(board.tile(x - 1, y))) {
            rect(px, py, depth * .35, cell, [.01, .025, .035, .25]);
            rect(px, py, inset, cell, [.43, .49, .49, 1]);
          }
          if (raised(board.tile(x + 1, y))) rect(px + cell - inset, py, inset, cell, [.43, .49, .49, 1]);
          if (raised(board.tile(x, y + 1))) rect(px, py + cell - inset, cell, inset, [.18, .25, .27, 1]);
        }
      }
      // Retain runtime portals, goal, hero marker and obstacle identity.
      for (y = 0; y < board.height; y += 1) for (x = 0; x < board.width; x += 1) {
        px = box.x + x * cell; py = box.y + y * cell; tile = board.tile(x, y);
        // Tower sprites include their own base; only empty tower slots need a platform.
        if (tile === 'tower_slot' && !occupied[x + ',' + y]) {
          // Keep the full transparent canvas: foundation and tower share the same
          // cell origin and bottom anchor. Cropping/centering would change perspective.
          if (!image('terrain-depth-foundation', px, py, cell, cell, 1)) {
            region(draw, px + cell * .08, py + cell * .54, cell * .84, cell * .42, .5, .5, 1, 1);
          }
        }
        uv = markerRegions[tile];
        if (uv) {
          if (markersReady) {
            // The sprite includes its own platform; never add another pad beneath it.
            region(draw, px, py, cell, cell, uv[0], uv[1], uv[2], uv[3], null, MARKERS);
          } else {
            key = tile === 'obstacle' && M3.TextureAssets.get('terrain-depth-rock') ? 'terrain-depth-rock' : M3.TextureAssets.tileKey(map, tile);
            if (key) {
              if (tile === 'obstacle') image(key, px, py, cell, cell, 1);
              else image(key, px + cell * .08, py + cell * .54, cell * .84, cell * .42, 1);
            }
          }
        }
      }
      return true;
    } finally { if (M3.Renderer) M3.Renderer._activeView = active; }
  }
  M3.TerrainDepth = { enabled: !disabled, edges: edges, draw: render,
    manifest: [{ key: MARKERS, type: 'image', url: 'assets/terrain-depth/terrain-markers.png', version: '1', preload: false },
      { key: 'terrain-depth-foundation', type: 'image', url: 'assets/terrain-depth/tower-foundation.png', version: '1', preload: false },
      { key: KEY, type: 'image', url: 'assets/terrain-depth/terrain-atlas.jpg', version: '1', preload: false },
      { key: 'terrain-depth-rock', type: 'image', url: 'assets/terrain-depth/crystal-rock.png', version: '1', preload: false }] };
})();
