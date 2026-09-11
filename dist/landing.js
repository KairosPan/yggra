(() => {
  'use strict';
  const body = document.body;
  const hero = document.querySelector('.hero');
  const art = document.getElementById('art-drift');
  const canvas = document.getElementById('life-stream');
  const toggle = document.getElementById('motion-toggle');
  const status = document.getElementById('motion-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const context = canvas.getContext('2d');
  let userPaused = false;
  try { userPaused = localStorage.getItem('yggra-motion') === 'paused'; } catch {}
  let paused = userPaused || reducedMotion.matches;
  let heroVisible = true;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let activeStream = '';
  let width = 0;
  let height = 0;
  let imageScale = 1;
  let imageLeft = 0;
  let imageTop = 0;
  let pointer = { x: 0, y: 0 };
  let drift = { x: 0, y: 0 };
  let scrollDepth = 0;

  // These paths follow the generated artwork; they are decorative light only,
  // not research relationships or a reconstructed genealogy.
  const paths = [
    ['memory', [.40,.91], [.57,.91], [.69,.83], [.703,.64], [.70,.43], [.52,.40], [.40,.27]],
    ['memory', [.47,.94], [.63,.90], [.70,.83], [.705,.63], [.69,.42], [.53,.30], [.48,.14]],
    ['memory', [.55,.91], [.65,.84], [.72,.81], [.71,.61], [.71,.38], [.61,.29], [.55,.04]],
    ['memory', [.63,.97], [.69,.86], [.72,.78], [.712,.59], [.72,.34], [.60,.22], [.64,.02]],
    ['memory', [.72,.98], [.73,.87], [.69,.76], [.708,.60], [.72,.39], [.51,.39], [.37,.38]],
    ['evolution', [.82,.97], [.76,.87], [.69,.79], [.71,.61], [.73,.34], [.83,.29], [.87,.06]],
    ['evolution', [.88,.91], [.78,.88], [.71,.77], [.712,.61], [.75,.39], [.91,.32], [.96,.16]],
    ['evolution', [.96,.90], [.84,.87], [.72,.78], [.714,.60], [.78,.44], [.94,.40], [.99,.30]],
    ['evolution', [.90,.96], [.77,.85], [.73,.78], [.712,.59], [.75,.33], [.77,.22], [.77,.01]],
    ['evolution', [.78,.99], [.74,.87], [.70,.78], [.707,.59], [.75,.37], [.86,.34], [.95,.40]],
    ['improver', [.63,.93], [.69,.86], [.73,.79], [.71,.60], [.68,.42], [.64,.24], [.70,.02]],
    ['improver', [.76,.97], [.74,.88], [.69,.80], [.70,.60], [.68,.41], [.57,.26], [.58,.06]],
    ['improver', [.93,.96], [.79,.87], [.71,.80], [.705,.60], [.76,.35], [.84,.17], [.91,.03]],
    ['improver', [.50,.95], [.65,.86], [.70,.82], [.714,.62], [.73,.41], [.81,.26], [.83,.03]]
  ];
  const particles = Array.from({ length: 64 }, (_, i) => ({
    path: paths[i % paths.length],
    offset: ((i * .61803398875) % 1),
    duration: 11 + (i * 7 % 14),
    size: .65 + (i % 5) * .13,
    warm: i % 4 === 0
  }));
  const sprites = ['196,241,184', '244,224,172'].map(color => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const ctx = sprite.getContext('2d');
    if (!ctx) return sprite;
    const glow = ctx.createRadialGradient(16,16,0,16,16,16);
    glow.addColorStop(0, `rgba(${color},1)`);
    glow.addColorStop(.12, `rgba(${color},.95)`);
    glow.addColorStop(.32, `rgba(${color},.24)`);
    glow.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,32,32);
    return sprite;
  });

  function cubic(a, b, c, d, t) {
    const s = 1 - t;
    return [s*s*s*a[0] + 3*s*s*t*b[0] + 3*s*t*t*c[0] + t*t*t*d[0],
      s*s*s*a[1] + 3*s*s*t*b[1] + 3*s*t*t*c[1] + t*t*t*d[1]];
  }
  function pointAt(path, t) {
    const split = .53;
    const p = t < split
      ? cubic(path[1],path[2],path[3],path[4],t / split)
      : cubic(path[4],path[5],path[6],path[7],(t-split)/(1-split));
    return [p[0]*1586*imageScale+imageLeft, p[1]*992*imageScale+imageTop];
  }
  function resize() {
    width = art.clientWidth;
    height = art.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    if (context) context.setTransform(dpr,0,0,dpr,0,0);
    imageScale = Math.max(width / 1586, height / 992);
    imageLeft = (width - 1586 * imageScale) * (innerWidth <= 760 ? .64 : .5);
    imageTop = (height - 992 * imageScale) * (innerWidth >= 1700 ? .52 : .5);
    scrollDepth = Math.max(0, Math.min(1, scrollY / hero.offsetHeight));
  }
  function draw(time) {
    frame = 0;
    if (paused || !heroVisible || document.hidden || !context) return;
    frame = requestAnimationFrame(draw);
    if (time - lastTime < 1000 / 30) return;
    const dt = lastTime ? Math.min((time-lastTime)/1000,.075) : 0;
    lastTime = time;
    elapsed += dt;
    context.clearRect(0,0,width,height);
    const amount = innerWidth <= 760 ? 36 : particles.length;
    const opening = Math.min(1, elapsed / 3);
    context.globalCompositeOperation = 'lighter';
    for (let i=0; i<amount; i++) {
      const particle = particles[i];
      const t = (elapsed / particle.duration + particle.offset) % 1;
      const p = pointAt(particle.path,t);
      const tail = pointAt(particle.path,Math.max(0,t-.008));
      const selected = activeStream === particle.path[0];
      const fade = Math.min(1,t*8,(1-t)*7) * opening;
      const emphasis = activeStream ? (selected ? 1 : .2) : .64;
      context.globalAlpha = fade * emphasis;
      context.strokeStyle = particle.warm ? '#d4cca1' : '#b2e9b0';
      context.lineWidth = selected ? .9 : .5;
      context.beginPath();
      context.moveTo(tail[0],tail[1]);
      context.lineTo(p[0],p[1]);
      context.stroke();
      const size = particle.size * (selected ? 13 : 9);
      context.drawImage(sprites[particle.warm ? 1 : 0],p[0]-size/2,p[1]-size/2,size,size);
    }
    context.globalAlpha = 1;
    drift.x += (pointer.x - drift.x) * .065;
    drift.y += (pointer.y - drift.y) * .065;
    art.style.setProperty('--pointer-x', `${drift.x.toFixed(2)}px`);
    art.style.setProperty('--pointer-y', `${drift.y.toFixed(2)}px`);
    art.style.setProperty('--scene-scale', (1.035+scrollDepth*.028).toFixed(4));
  }
  function syncFrame() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    const suspended = paused || !heroVisible || document.hidden;
    body.classList.toggle('scene-suspended', suspended);
    if (!suspended && context) frame = requestAnimationFrame(draw);
  }
  function setMotion(announce = false) {
    paused = userPaused || reducedMotion.matches;
    body.classList.toggle('motion-paused',paused);
    // Keep this class after startup so resuming never replays the intro.
    if (!paused) body.classList.add('motion-running');
    toggle.hidden = false;
    toggle.disabled = reducedMotion.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    const label = reducedMotion.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
    toggle.querySelector('.motion-label').textContent = label;
    toggle.querySelector('.motion-glyph').textContent = paused ? '▷' : 'Ⅱ';
    toggle.setAttribute('aria-label', reducedMotion.matches
      ? 'Tree animation disabled by your reduced motion preference'
      : paused ? 'Resume the tree animation' : 'Pause the tree animation');
    if (paused) {
      body.classList.remove('scroll-enhanced');
      if (context) context.clearRect(0,0,width,height);
    }
    if (announce) status.textContent = paused ? 'Motion paused.' : 'Motion resumed.';
    syncFrame();
  }
  toggle.addEventListener('click', () => {
    userPaused = !paused;
    try { localStorage.setItem('yggra-motion',userPaused ? 'paused' : 'running'); } catch {}
    setMotion(true);
  });
  reducedMotion.addEventListener('change', () => setMotion());
  document.addEventListener('visibilitychange',syncFrame);
  hero.addEventListener('pointermove',event => {
    if (paused || !finePointer.matches) return;
    const box = hero.getBoundingClientRect();
    pointer = {x: ((event.clientX-box.left)/box.width-.5)*-12,
      y: ((event.clientY-box.top)/box.height-.5)*-8};
  }, {passive:true});
  hero.addEventListener('pointerleave', () => {pointer = {x:0,y:0};});
  window.addEventListener('scroll', () => {
    scrollDepth = Math.max(0,Math.min(1,scrollY/hero.offsetHeight));
  }, {passive:true});
  document.querySelectorAll('[data-stream]').forEach(link => {
    const select = () => {activeStream = link.dataset.stream;};
    const clear = () => {activeStream = '';};
    link.addEventListener('pointerenter',select);
    link.addEventListener('focus',select);
    link.addEventListener('pointerleave',clear);
    link.addEventListener('blur',clear);
  });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(art);
  else window.addEventListener('resize',resize,{passive:true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      syncFrame();
    },{threshold:0}).observe(hero);
    if (!paused) {
      body.classList.add('scroll-enhanced');
      const reveal = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          reveal.unobserve(entry.target);
        }
      },{threshold:.08,rootMargin:'0px 0px -25px 0px'});
      document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));
    }
  }
  resize();
  setMotion();
})();
