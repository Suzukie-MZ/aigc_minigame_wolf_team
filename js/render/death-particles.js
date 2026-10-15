(function () {
  var M3 = window.M3, KEY = 'monster-1-death-particle', cfg = {"angle":45.0,"angleVariance":236.0,"blendFuncDestination":1,"blendFuncSource":770,"duration":-1.0,"emitterType":0.0,"finishColorAlpha":0.65,"finishColorBlue":0.15,"finishColorGreen":1.0,"finishColorRed":0.96,"finishColorVarianceAlpha":0.37,"finishColorVarianceBlue":0.2,"finishColorVarianceGreen":1.0,"finishColorVarianceRed":1.0,"finishParticleSize":0.0,"finishParticleSizeVariance":100.0,"gravityx":-20.0,"gravityy":1786.0,"maxParticles":60.0,"maxRadius":0.0,"maxRadiusVariance":0.0,"minRadius":0.0,"particleLifespan":0.4000000059604645,"particleLifespanVariance":0.0,"radialAccelVariance":107.65486907958984,"radialAcceleration":729.830810546875,"rotatePerSecond":0.0,"rotatePerSecondVariance":0.0,"rotationEnd":0.0,"rotationEndVariance":0.0,"rotationStart":0.0,"rotationStartVariance":-317.2353820800781,"sourcePositionVariancex":0.0,"sourcePositionVariancey":20.0,"sourcePositionx":330.05893909626724,"sourcePositiony":471.5127701375246,"speed":691.0,"speedVariance":200.0,"startColorAlpha":0.61,"startColorBlue":0.33,"startColorGreen":1.0,"startColorRed":1.0,"startColorVarianceAlpha":0.53,"startColorVarianceBlue":0.48,"startColorVarianceGreen":1.0,"startColorVarianceRed":1.0,"startParticleSize":200.0,"startParticleSizeVariance":200.0,"tangentialAccelVariance":233.7172393798828,"tangentialAcceleration":-302.3797302246094,"textureFileName":"particle_texture.png"};
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function sample(value, variance) { return Number(value || 0) + (Math.random() * 2 - 1) * Math.abs(Number(variance || 0)); }
  function color(prefix) {
    var channels = ['Red', 'Green', 'Blue', 'Alpha'], result = [], i;
    for (i = 0; i < channels.length; i += 1) result.push(clamp(sample(cfg[prefix + 'Color' + channels[i]], cfg[prefix + 'ColorVariance' + channels[i]]), 0, 1));
    return result;
  }
  function matches(assetKey, unitId) { return assetKey === 'monster-1' || unitId === 'monster-1'; }
  function create(x, y) {
    var event = { x: x, y: y, age: 0, particles: [] }, i, angle, speed;
    // The source plist is an endless emitter. A death is a single burst at the enemy's position.
    for (i = 0; i < Math.min(60, cfg.maxParticles); i += 1) {
      angle = sample(cfg.angle, cfg.angleVariance) * Math.PI / 180; speed = sample(cfg.speed, cfg.speedVariance);
      event.particles.push({ x: sample(0, cfg.sourcePositionVariancex), y: sample(0, cfg.sourcePositionVariancey),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: Math.max(.01, sample(cfg.particleLifespan, cfg.particleLifespanVariance)),
        radial: sample(cfg.radialAcceleration, cfg.radialAccelVariance), tangent: sample(cfg.tangentialAcceleration, cfg.tangentialAccelVariance),
        startSize: Math.max(0, sample(cfg.startParticleSize, cfg.startParticleSizeVariance)), endSize: Math.max(0, sample(cfg.finishParticleSize, cfg.finishParticleSizeVariance)),
        startColor: color('start'), endColor: color('finish'), startRotation: sample(cfg.rotationStart, cfg.rotationStartVariance), endRotation: sample(cfg.rotationEnd, cfg.rotationEndVariance) });
    }
    return event;
  }
  function update(events, dt) {
    var i, j, event, particle, length, rx, ry;
    for (i = events.length - 1; i >= 0; i -= 1) {
      event = events[i]; event.age += dt;
      for (j = event.particles.length - 1; j >= 0; j -= 1) {
        particle = event.particles[j];
        if (event.age >= particle.life) { event.particles.splice(j, 1); continue; }
        length = Math.sqrt(particle.x * particle.x + particle.y * particle.y); rx = length > .001 ? particle.x / length : 0; ry = length > .001 ? particle.y / length : 0;
        particle.vx += (cfg.gravityx + rx * particle.radial - ry * particle.tangent) * dt;
        particle.vy += (cfg.gravityy + ry * particle.radial + rx * particle.tangent) * dt;
        particle.x += particle.vx * dt; particle.y += particle.vy * dt;
      }
      if (!event.particles.length) events.splice(i, 1);
    }
  }
  function draw(events, board, cell, imageRegion) {
    var scale = cell / 258, i, j, event, particle, t, size, tint, c, rotation;
    for (i = 0; i < events.length; i += 1) {
      event = events[i];
      for (j = 0; j < event.particles.length; j += 1) {
        particle = event.particles[j]; t = clamp(event.age / particle.life, 0, 1);
        size = (particle.startSize + (particle.endSize - particle.startSize) * t) * scale; tint = [];
        for (c = 0; c < 4; c += 1) tint.push(particle.startColor[c] + (particle.endColor[c] - particle.startColor[c]) * t);
        rotation = (particle.startRotation + (particle.endRotation - particle.startRotation) * t) * Math.PI / 180;
        imageRegion(KEY, board.x + event.x * cell + particle.x * scale - size * .5,
          board.y + event.y * cell - particle.y * scale - size * .5, size, size, 0, 1, 1, 0, tint, 1, false, 0, rotation);
      }
    }
  }
  M3.DeathParticles = { manifest: [{ key: KEY, type: 'image', url: 'subpackages/monsters/assets/Image/enemies/monster-1-death-particle.png', version: '1' }],
    matches: matches, create: create, update: update, draw: draw, blendSource: cfg.blendFuncSource, blendDestination: cfg.blendFuncDestination };
})();
