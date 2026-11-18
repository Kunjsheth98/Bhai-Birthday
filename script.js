/* Happy Birthday, Bhai — made with love by Kunj */
(() => {
'use strict';
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => Math.random() * (b - a) + a;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* ============ SOUND (all synthesized — no audio files needed) ============ */
const Sound = (() => {
  let ctx, master, muted = false, amb = false, ambTimer = null, duck = false;
  const init = () => {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
  };
  const tone = (f, t, d, o = {}) => {
    if (!ctx) return;
    const { type = 'triangle', vol = 0.15, attack = 0.012 } = o;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + d + 0.05);
  };
  const boot = () => {
    if (!ctx) return; const t = ctx.currentTime + 0.02;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, t + i * 0.09, 0.5, { type: 'square', vol: 0.05 }));
    tone(130.81, t, 1.2, { type: 'sine', vol: 0.12 });
  };
  const ping = () => {
    if (!ctx) return; const t = ctx.currentTime;
    tone(1318.5, t, 0.5, { type: 'sine', vol: 0.09 }); tone(1975.5, t + 0.1, 0.7, { type: 'sine', vol: 0.08 });
  };
  const puff = () => {
    if (!ctx) return;
    const len = ctx.sampleRate * 0.25, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800;
    const g = ctx.createGain(); g.gain.value = 0.12;
    src.connect(bp); bp.connect(g); g.connect(master); src.start();
  };
  const hb = () => { // "Happy Birthday" (public domain tune)
    if (!ctx) return;
    const beat = 0.46;
    const seq = [[392,.75],[392,.25],[440,1],[392,1],[523.25,1],[493.88,2],
                 [392,.75],[392,.25],[440,1],[392,1],[587.33,1],[523.25,2],
                 [392,.75],[392,.25],[783.99,1],[659.25,1],[523.25,1],[493.88,1],[440,2],
                 [698.46,.75],[698.46,.25],[659.25,1],[523.25,1],[587.33,1],[523.25,2.5]];
    let t = ctx.currentTime + 0.05; duck = true;
    seq.forEach(([f, b]) => {
      tone(f, t, b * beat * 1.15, { type: 'triangle', vol: 0.17 });
      tone(f * 2, t, b * beat, { type: 'sine', vol: 0.045 });
      t += b * beat;
    });
    setTimeout(() => { duck = false; }, (t - ctx.currentTime) * 1000);
  };
  const penta = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
  let step = 0;
  const ambient = on => {
    amb = on;
    if (on && !ambTimer) ambTimer = setInterval(() => {
      if (!amb || !ctx || duck || document.hidden || muted) return;
      const t = ctx.currentTime;
      if (step % 4 === 0) tone(130.81 * (step % 8 === 0 ? 1 : 1.335), t, 3, { type: 'sine', vol: 0.05 });
      if (Math.random() < 0.8) tone(penta[(Math.random() * penta.length) | 0], t, 2.4, { type: 'sine', vol: 0.032 });
      step++;
    }, 760);
  };
  const toggle = () => {
    muted = !muted;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.05);
    return muted;
  };
  return { init, boot, ping, puff, hb, ambient, toggle };
})();

/* ============ CANVASES : petals + confetti / fireworks ============ */
const pc = $('#petals'), pctx = pc.getContext('2d');
const fx = $('#fx'), fctx = fx.getContext('2d');
let W = innerWidth, H = innerHeight, DPR = Math.min(devicePixelRatio || 1, 2);
function sizeCanvas() {
  DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
  [pc, fx].forEach(c => { c.width = W * DPR; c.height = H * DPR; });
  pctx.setTransform(DPR, 0, 0, DPR, 0, 0); fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
let lastW = W;
addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; sizeCanvas(); } });
sizeCanvas();

// marigold petals drifting down
const petalCols = ['#ffb627', '#ff9a1f', '#ff7a1a', '#ffd35c'];
const newPetal = init => ({ x: rand(0, W), y: init ? rand(0, H) : rand(-60, -10), s: rand(5, 11), vy: rand(.35, 1), vx: rand(-.25, .35),
  r: rand(0, 6.28), vr: rand(-.02, .02), sw: rand(0, 6.28), c: petalCols[(Math.random() * 4) | 0], a: rand(.22, .5) });
const petals = Array.from({ length: innerWidth < 700 ? 13 : 24 }, () => newPetal(true));
function petalLoop() {
  if (!document.hidden) {
    pctx.clearRect(0, 0, W, H);
    for (const p of petals) {
      p.sw += .018; p.x += p.vx + Math.sin(p.sw) * .5; p.y += p.vy; p.r += p.vr;
      if (p.y > H + 20) Object.assign(p, newPetal(false), { x: rand(0, W) });
      pctx.save(); pctx.translate(p.x, p.y); pctx.rotate(p.r); pctx.globalAlpha = p.a; pctx.fillStyle = p.c;
      pctx.beginPath(); pctx.ellipse(0, 0, p.s, p.s * .5, 0, 0, 6.283); pctx.fill(); pctx.restore();
    }
  }
  requestAnimationFrame(petalLoop);
}
if (!reduce) petalLoop();

// confetti + fireworks
const colors = ['#ffb627', '#ff7a1a', '#ff5d73', '#4cc9f0', '#ffffff', '#9be564', '#ff7be0'];
let confetti = [], sparks = [], rockets = [], fxOn = false;
function startFx() { if (!fxOn) { fxOn = true; requestAnimationFrame(fxLoop); } }
function burst(x, y, n = 100) {
  if (reduce) n = 25;
  for (let i = 0; i < n; i++) {
    const a = rand(0, 6.283), s = rand(3, 12);
    confetti.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - rand(2, 7), w: rand(6, 11), h: rand(4, 8), r: rand(0, 6.28), vr: rand(-.3, .3), c: colors[i % colors.length], life: rand(100, 190) });
  }
  startFx();
}
function rain(n = 120) {
  for (let i = 0; i < n; i++) confetti.push({ x: rand(0, W), y: rand(-H * .5, -10), vx: rand(-1.5, 1.5), vy: rand(2, 5), w: rand(6, 11), h: rand(4, 8), r: rand(0, 6.28), vr: rand(-.2, .2), c: colors[i % colors.length], life: rand(220, 360) });
  startFx();
}
function rocket(x) {
  rockets.push({ x: x ?? rand(W * .12, W * .88), y: H + 10, vx: rand(-.7, .7), vy: -rand(9, 13), ty: rand(H * .14, H * .45), c: colors[(Math.random() * colors.length) | 0] });
  startFx();
}
function explode(x, y, c) {
  const n = 72;
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283 + rand(-.05, .05), s = rand(1.5, 6.8);
    sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(55, 95), max: 95, c: Math.random() < .72 ? c : '#fff' });
  }
}
async function fireworks(ms = 6000) {
  if (reduce) { rocket(); return; }
  const end = performance.now() + ms;
  while (performance.now() < end) { rocket(); if (Math.random() < .5) rocket(); await sleep(rand(350, 700)); }
}
function fxLoop() {
  fctx.clearRect(0, 0, W, H);
  rockets = rockets.filter(r => {
    r.x += r.vx; r.y += r.vy; r.vy += .12;
    fctx.globalAlpha = 1; fctx.fillStyle = r.c; fctx.fillRect(r.x - 1.5, r.y, 3, 10);
    if (r.vy > -1.8 || r.y <= r.ty) { explode(r.x, r.y, r.c); return false; }
    return true;
  });
  sparks = sparks.filter(s => {
    s.vx *= .98; s.vy = s.vy * .98 + .07; s.x += s.vx; s.y += s.vy; s.life--;
    fctx.globalAlpha = Math.max(0, s.life / s.max); fctx.fillStyle = s.c;
    fctx.beginPath(); fctx.arc(s.x, s.y, 2.2, 0, 6.283); fctx.fill();
    return s.life > 0;
  });
  confetti = confetti.filter(c => {
    c.vy += .17; c.vx *= .99; c.vy *= .985; c.x += c.vx; c.y += c.vy; c.r += c.vr; c.life--;
    fctx.save(); fctx.translate(c.x, c.y); fctx.rotate(c.r); fctx.globalAlpha = Math.min(1, c.life / 30); fctx.fillStyle = c.c;
    fctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); fctx.restore();
    return c.life > 0 && c.y < H + 30;
  });
  fctx.globalAlpha = 1;
  if (rockets.length || sparks.length || confetti.length) requestAnimationFrame(fxLoop);
  else { fxOn = false; fctx.clearRect(0, 0, W, H); }
}

/* ============ TOAST ============ */
let toastT;
function toast(icon, title, sub) {
  const t = $('#toast');
  t.innerHTML = `<span>${icon}</span><div>${title}<small>${sub}</small></div>`;
  t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 4200);
}

/* ============ GATE / START ============ */
$('#start').addEventListener('click', () => {
  Sound.init(); Sound.boot();
  document.body.classList.remove('locked');
  $('#gate').classList.add('hide');
  window.scrollTo(0, 0);
  setTimeout(() => {
    document.body.classList.add('started');
    burst(W / 2, H * .42, 130); rocket(W * .25); setTimeout(() => rocket(W * .75), 400);
    Sound.ambient(true);
  }, 450);
});
$('#snd').addEventListener('click', e => { Sound.init(); e.currentTarget.textContent = Sound.toggle() ? '🔇' : '🔊'; });
$('#bhaiWord').addEventListener('click', () => { burst(W / 2, H / 3, 90); rain(60); });

/* ============ HERO PHOTO CYCLE ============ */
const heroImgs = $$('.hero-photo .stack img'), bgs = [$('#bgA'), $('#bgB')];
let hi = 0, bgi = 0;
function showHero(i) {
  heroImgs.forEach((im, k) => im.classList.toggle('on', k === i));
  bgi = 1 - bgi;
  bgs[bgi].style.backgroundImage = `url(${heroImgs[i].getAttribute('src')})`;
  bgs[bgi].classList.add('on'); bgs[1 - bgi].classList.remove('on');
  $('#heroCap').textContent = heroImgs[i].dataset.cap;
}
showHero(0);
setInterval(() => { if (!document.hidden) { hi = (hi + 1) % heroImgs.length; showHero(hi); } }, 4600);

/* ============ SCROLL: progress, reveal, parallax, tilt ============ */
const xp = $('#xp i'), par = $('.parallax'), cine = $('#ch3');
let ticking = false;
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  xp.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + '%';
  if (!reduce && par) {
    const r = cine.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) par.style.transform = `translateY(${(r.top + r.height / 2 - innerHeight / 2) * -.12}px)`;
  }
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

const onceIO = (els, cb, opts = { threshold: .18, rootMargin: '0px 0px -6% 0px' }) => {
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } }), opts);
  els.forEach(el => io.observe(el));
};
const staggers = new WeakMap();
onceIO($$('.reveal'), el => {
  const sib = el.parentElement ? $$(':scope > .reveal', el.parentElement) : [];
  const d = Math.max(0, sib.indexOf(el)) * 90;
  setTimeout(() => el.classList.add('in'), Math.min(d, 360));
});

if (matchMedia('(hover:hover)').matches && !reduce) {
  $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ============ TERMINAL (git log) ============ */
const termLines = [
  { t: '$ git log --author="Bhai" --oneline', cls: 'cmd', speed: 34, wait: 450 },
  { hash: 'a1f0c3e', t: 'Show little brother what a PlayStation is' },
  { hash: '7c2d9e4', t: 'Hand him the controller' },
  { hash: '3be81f0', t: 'Say "you can learn to code" — and keep saying it' },
  { hash: 'd4a7706', t: 'Believe in Shatakam before it was an app' },
  { hash: '9f12c3b', t: 'Believe in piZiste before it was a company' },
  { hash: 'e88b5a1', t: 'Stay protective. Every. Single. Day.' },
  { t: '', wait: 300 },
  { t: '$ git blame everything-good.js', cls: 'cmd', speed: 34, wait: 450 },
  { t: 'Bhai  ████████████████████  100%', cls: 'meter', speed: 22, wait: 500 },
  { t: '// every line I write has your name on it ❤', cls: 'cm', speed: 28 },
];
let termDone = false;
async function runTerminal() {
  if (termDone) return; termDone = true;
  const body = $('#termBody');
  const caret = document.createElement('span'); caret.className = 'caret';
  for (const l of termLines) {
    const row = document.createElement('div'); row.className = 'tl ' + (l.cls || ''); body.appendChild(row);
    let target = row;
    if (l.hash) { const h = document.createElement('span'); h.className = 'hash'; h.textContent = l.hash; row.appendChild(h); target = document.createElement('span'); row.appendChild(target); }
    row.appendChild(caret);
    if (!l.t) row.textContent = ' ', row.appendChild(caret);
    for (const ch of l.t) { target.textContent += ch; await sleep(reduce ? 0 : (l.speed || 17)); }
    await sleep(reduce ? 0 : (l.wait || 240));
  }
}
onceIO([$('#term')], runTerminal, { threshold: .3 });

/* ============ TROPHIES ============ */
onceIO([$('#tlist')], async () => {
  const items = $$('.trophy:not(.secret)');
  for (const it of items) {
    it.classList.add('unlocked'); Sound.ping();
    if (it.id === 'platinum') { toast('🏆', 'Trophy unlocked — Platinum', 'Best Elder Brother · 1 of 1'); burst(W / 2, H * .4, 70); }
    await sleep(it.id === 'platinum' ? 400 : 720);
  }
  $('#secret').classList.add('unlocked');
}, { threshold: .25 });
const secret = $('#secret');
function openSecret() {
  if (secret.classList.contains('open')) return;
  secret.classList.add('open');
  $('.ico', secret).textContent = '❤️';
  $('b', secret).textContent = 'Loved more than he knows';
  $('p', secret).textContent = 'Hidden trophy. Unlocked the day you became my Bhai.';
  $('em', secret).textContent = 'Secret';
  Sound.ping(); burst(secret.getBoundingClientRect().left + 60, secret.getBoundingClientRect().top + 30, 60);
  toast('❤️', 'Secret trophy unlocked', 'Loved more than he knows');
}
secret.addEventListener('click', openSecret);
secret.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSecret(); } });

/* ============ FLIP CARDS ============ */
$$('.card').forEach(c => c.addEventListener('click', () => {
  const f = c.classList.toggle('flipped'); c.setAttribute('aria-pressed', f);
  if (f) { Sound.ping(); const r = c.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 22); }
}));

/* ============ GALLERY + LIGHTBOX ============ */
const shots = $$('.polaroid img'), lb = $('#lb'); let li = 0;
function openLb(i) {
  li = (i + shots.length) % shots.length;
  $('#lbImg').src = shots[li].src; $('#lbImg').alt = shots[li].alt; $('#lbCap').textContent = shots[li].dataset.cap || '';
  lb.hidden = false; document.body.style.overflow = 'hidden';
}
const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; };
shots.forEach((im, i) => im.closest('.polaroid').addEventListener('click', () => openLb(i)));
$('#lbX').onclick = closeLb; $('#lbP').onclick = () => openLb(li - 1); $('#lbN').onclick = () => openLb(li + 1);
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') openLb(li - 1); if (e.key === 'ArrowRight') openLb(li + 1); });
let tx = 0; lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) openLb(li + (dx < 0 ? 1 : -1)); });

/* ============ CAKE ============ */
const flames = $$('.flame'); let celebrated = false;
function blowOut(f) {
  if (f.classList.contains('out')) return;
  f.classList.add('out'); Sound.puff();
  if (!$$('.flame:not(.out)').length) celebrate();
}
flames.forEach(f => {
  f.addEventListener('click', () => { Sound.init(); blowOut(f); });
  f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); blowOut(f); } });
});
async function blowAll() {
  Sound.init();
  for (const f of flames) { blowOut(f); await sleep(190); }
}
async function celebrate() {
  if (celebrated) return; celebrated = true;
  $('#cakeActions').style.display = 'none'; $('#cakeHint').style.display = 'none';
  Sound.hb();
  const r = $('#cakeSvg').getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height * .3, 160); rain(120);
  setTimeout(() => $('#wishMsg').classList.add('show'), 600);
  fireworks(7000);
}
$('#blowBtn').addEventListener('click', blowAll);
$('#micBtn').addEventListener('click', async () => {
  const hint = $('#cakeHint');
  try {
    Sound.init();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
    const an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.fftSize); let hot = 0;
    hint.textContent = '🎤 Listening… take a deep breath and blow!';
    (function loop() {
      if (celebrated) { stream.getTracks().forEach(t => t.stop()); ac.close(); return; }
      an.getByteTimeDomainData(buf);
      let s = 0; for (const v of buf) { const d = (v - 128) / 128; s += d * d; }
      hot = Math.sqrt(s / buf.length) > .2 ? hot + 1 : 0;
      if (hot >= 4) { blowAll(); }
      requestAnimationFrame(loop);
    })();
  } catch (e) { hint.textContent = 'Mic not available — just tap the flames 😄'; }
});

/* ============ LETTER ============ */
const LETTER = [
  ['greet', 'Bhai,'],
  ['', "I'm not good at saying this out loud. You know that — you've always known. Somehow, you understand me even in my silence."],
  ['', 'So I did the one thing I know how to do. I built it.'],
  ['', "You're the reason I'm who I am. You put a controller in my hands when I was little and showed me there's a whole world inside a screen. You told me I could learn to code — and kept telling me until I believed it. Every app, every late night, Shatakam, piZiste… all of it began with you believing in me before I did."],
  ['', "You've always walked in front of me, clearing the way, making sure I never had to face anything alone. And I've always been right behind you. Ram never has to ask. Lakshman is just there."],
  ['', "I may never say it enough. But I love you, Bhai. I'm so proud to be your little brother."],
  ['', "You deserve every good thing this world has to give — happiness, love, and every dream of yours coming true. Today, and every day after. And I'll be right here beside you, no matter what."],
  ['sign', 'Happy Birthday, Bhai ❤️'],
  ['sign', '— Your Lakshman, Kunj'],
];
let skipType = false, letterStarted = false;
$('#envelope').addEventListener('click', async () => {
  if (letterStarted) return; letterStarted = true;
  Sound.init(); Sound.ping();
  $('#envelope').classList.add('gone');
  const letter = $('#letter'); letter.hidden = false;
  const body = $('#letterBody'); const parts = [];
  LETTER.forEach(([cls, txt]) => {
    const p = document.createElement('p'); if (cls) p.className = cls;
    const d = document.createElement('span'), g = document.createElement('span');
    g.className = 'g'; g.textContent = txt; p.append(d, g); body.appendChild(p); parts.push({ d, g, txt });
  });
  letter.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#skip').onclick = () => { skipType = true; };
  letter.addEventListener('click', () => { skipType = true; });
  await sleep(900);
  for (const p of parts) {
    let i = 0;
    while (i < p.txt.length) {
      if (skipType || reduce) { p.d.textContent = p.txt; p.g.textContent = ''; break; }
      const ch = p.txt[i++]; p.d.textContent += ch; p.g.textContent = p.txt.slice(i);
      await sleep(/[.,—…!]/.test(ch) ? 190 : 26);
    }
    p.d.textContent = p.txt; p.g.textContent = '';
    await sleep(skipType ? 0 : 380);
  }
  $('#skip').style.display = 'none';
  Sound.ping(); burst(W / 2, H * .5, 80);
});

/* ============ FINALE ============ */
let finaleDone = false;
onceIO([$('#finale')], () => {
  if (finaleDone) return; finaleDone = true;
  setTimeout(() => { burst(W / 2, H * .35, 150); rain(100); fireworks(5000); Sound.hb(); }, 500);
}, { threshold: .55 });
$('#replay').addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

})();
