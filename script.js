/* ============================================================
   CONFIGURAÇÃO — troque pelo número real (DDI + DDD + número, só dígitos)
============================================================ */
const WHATSAPP = '555194391441';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* Links de WhatsApp com mensagem pronta */
$$('[data-wa]').forEach(a => {
  a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(a.dataset.wa)}`;
});

/* Estatísticas reais vindas do data.js */
const STATS = window.PORTFOLIO_STATS || {};
$$('[data-stat]').forEach(el => { if (STATS[el.dataset.stat]) el.textContent = STATS[el.dataset.stat]; });
$$('[data-stat-count]').forEach(el => { if (STATS[el.dataset.statCount]) el.dataset.countTo = STATS[el.dataset.statCount]; });
$('#year').textContent = new Date().getFullYear();

/* Marquee: triplica a faixa (loop contínuo + deslocamento extra pelo scroll) */
const track = $('#marqueeTrack');
const marqueeShift = $('#marqueeShift');
track.innerHTML = track.innerHTML.repeat(3);

/* Colunas do hero: duplica cada trilha para rolar sem emenda */
$$('.hm-track').forEach(t => { t.innerHTML += t.innerHTML; });

/* Seleção de texto animada: fundo + cursor de texto em cada destaque */
const selIO = new IntersectionObserver(entries => entries.forEach(e => {
  // reinicia quando sai da tela, para animar de novo na próxima passagem
  if (e.isIntersecting) e.target.classList.add('sel-on');
  else if (e.boundingClientRect.top > 0) e.target.classList.remove('sel-on');
}), { threshold: 0.9 });
$$('.mark').forEach(m => {
  m.insertAdjacentHTML('afterbegin', '<span class="sel-bg" aria-hidden="true"></span>');
  m.insertAdjacentHTML('beforeend', '<span class="sel-caret" aria-hidden="true"></span>');
  selIO.observe(m);
});

/* Feed horizontal: uma peça de cada cliente de social media + identidade */
const hsTrack = $('#hsTrack');
const FEED = [
  ['social', 'Triunfo Ice', 3], ['social', 'Kaizen', 1], ['social', 'Automax', 0], ['identidade', 'Kamix', 0],
  ['social', 'N&V', 5], ['social', 'Dr. Jorge Mendes', 1], ['social', 'Hedge', 2], ['social', 'Coração de Mãe', 1],
  ['identidade', 'Flor de Liz', 0], ['social', 'Funerária São Pedro', 4], ['social', 'Aura', 0], ['social', 'Bfoods', 2],
  ['social', 'Central do Design', 1], ['social', 'Catavento', 0], ['identidade', 'Grubba', 0], ['social', 'Mafra', 0],
  ['social', 'Grupo Tedeschi', 1], ['social', 'Triunfo Ice', 9],
];
const PF = window.PORTFOLIO || {};
const th = src => src.replace('assets/', 'assets/th/'); // miniatura leve (640px)
FEED.forEach(([cat, client, i]) => {
  const c = (PF[cat] || { projects: [] }).projects.findIndex(p => p.client === client);
  if (c < 0) return;
  const it = PF[cat].projects[c].items[i] || PF[cat].projects[c].items[0];
  const fig = document.createElement('figure');
  fig.className = 'hs-item';
  fig.tabIndex = 0;
  fig.style.aspectRatio = `${it.w} / ${it.h}`;
  fig.innerHTML = `<img src="${th(it.src)}" alt="${client}: ${it.tag}" loading="lazy"><figcaption><strong>${client}</strong>${PF[cat].label}</figcaption>`;
  const open = () => openLb(cat, c, PF[cat].projects[c].items.indexOf(it));
  fig.addEventListener('click', open);
  fig.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  hsTrack.append(fig);
});
const hsItems = $$('.hs-item', hsTrack);

/* ============================================================
   MENU MOBILE
============================================================ */
const hamburger = $('#hamburger');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  document.body.classList.toggle('lock', open);
  hamburger.setAttribute('aria-expanded', open);
}
hamburger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$$('#mobileMenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

/* ============================================================
   SCROLL: nav, progresso, hero, processo, manifesto
============================================================ */
const nav = $('#nav');
const progress = $('#scrollProgress');
const hero = $('#hero');
const heroStage = $('#heroStage');
const waFloat = $('#waFloat');
const processEl = $('#process');
const processFill = $('#processFill');
const steps = $$('.step');
const hsBar = $('#hsBar');
const rshow = $('#reels-show');
const rsStage = $('#rsStage');
const spEls = $$('[data-sp]');
const catCards = $$('.cat-card');

/* Manifesto: quebra em palavras que acendem com o scroll */
const manifesto = $('#manifesto-text');
(function splitWords(node) {
  [...node.childNodes].forEach(ch => {
    if (ch.nodeType === 3) {
      const frag = document.createDocumentFragment();
      ch.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.append(part);
        else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s); }
      });
      ch.replaceWith(frag);
    } else splitWords(ch);
  });
})(manifesto);
const words = $$('.w', manifesto);

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* ------------------------------------------------------------
   Desempenho: todas as medidas (posições, alturas) são lidas UMA vez
   em measure(), no carregamento e quando o layout muda de tamanho.
   O frame de scroll só faz contas e escreve transform/opacity,
   sem ler o layout (evita o navegador recalcular a página a cada frame).
------------------------------------------------------------ */
const docTop = el => { let t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; };
const M = {};
const marqueeEl = $('.marquee');
const heroCopy = $('.hero-copy');
const heroMedia = $('.hero-media');
const hxName = $('#hxName');
const hxNameIn = $('.hx-name-in');
// nome gigante: cada letra numa máscara própria, para subir em cascata
let chI = 0;
(function splitChars(node) {
  [...node.childNodes].forEach(ch => {
    if (ch.nodeType !== 3) return splitChars(ch);
    const frag = document.createDocumentFragment();
    [...ch.textContent].forEach(c => {
      if (c === ' ') return frag.append(' ');
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--d', (0.35 + chI++ * 0.06).toFixed(3) + 's');
      s.textContent = c;
      frag.append(s);
    });
    ch.replaceWith(frag);
  });
})(hxNameIn);
const hmCaption = $('.hm-caption');
const rsCopy = $('.rs-copy');
const rsEnd = $('.rs-end');
const rsMain = $('.rs-main');
const rsL = $('.rs-l');
const rsR = $('.rs-r');

// efeitos por elemento data-sp: recebem o progresso (0 entrando por baixo, 1 saindo por cima)
const spFx = spEls.map(el => {
  const k = v => clamp(v * 2.6); // chega a 1 quando o elemento está ~40% para dentro da tela
  if (el.classList.contains('sobre-photo')) {
    const img = $('img', el);
    return { el, fn: sp => {
      const i = k(sp);
      el.style.transform = `translate3d(0,${((1 - i) * 50).toFixed(1)}px,0) scale(${(0.9 + 0.1 * i).toFixed(4)})`;
      // no celular a foto fica inteira, sem zoom; no desktop mantém o leve zoom-out
      img.style.transform = M.vw <= 760 ? 'none' : `scale(${(1.28 - 0.22 * i).toFixed(4)}) translate3d(0,${((sp - 0.5) * -36).toFixed(1)}px,0)`;
    } };
  }
  if (el.classList.contains('numeros')) {
    const nums = $$('.numero', el);
    return { el, fn: sp => {
      const i = k(sp);
      nums.forEach((n, j) => { n.style.transform = `translate3d(0,${((1 - i) * (60 + 50 * j)).toFixed(1)}px,0) scale(${(0.88 + 0.12 * i).toFixed(4)})`; });
    } };
  }
  const l = $('.drift-l', el), r = $('.drift-r', el);
  return { el, fn: sp => {
    const d = ((1 - k(sp)) * 90).toFixed(1);
    if (l) l.style.transform = `translate3d(-${d}px,0,0)`;
    if (r) r.style.transform = `translate3d(${d}px,0,0)`;
  } };
});

let ticking = false;
let last = {};

/* ------------------------------------------------------------
   Feed: faixa horizontal independente do scroll da página.
   Dedo/trackpad rolam nativamente; no mouse dá para arrastar; setas avançam.
------------------------------------------------------------ */
const hsScroller = $('#hsScroller');
const hsPrev = $('#hsPrev'), hsNext = $('#hsNext');
let feedTick = false;
function updateFeed() {
  feedTick = false;
  if (!M.hsItems) return;
  const sl = hsScroller.scrollLeft, w = hsScroller.clientWidth;
  const max = hsScroller.scrollWidth - w;
  set('hsb', hsBar, 'transform', `scaleX(${max > 0 ? (sl / max).toFixed(4) : 0})`);
  hsPrev.disabled = sl < 4;
  hsNext.disabled = sl > max - 4;
  M.hsItems.forEach(([cx, el], i) => {
    const c = (cx - sl) / w - 0.5; // -0.5 (esquerda) a 0.5 (direita)
    if (c < -1 || c > 1) return;
    set('hi' + i, el, 'transform', `translate3d(0,${(Math.abs(c) * 50 * (i % 2 ? 1 : -1)).toFixed(1)}px,0) rotate(${(c * -4).toFixed(2)}deg)`);
    set('hp' + i, el.firstElementChild, 'transform', `scale(1.06) translate3d(${(c * -30).toFixed(1)}px,0,0)`);
  });
}
hsScroller.addEventListener('scroll', () => { if (!feedTick) { feedTick = true; requestAnimationFrame(updateFeed); } }, { passive: true });
const feedStep = d => hsScroller.scrollBy({ left: d * hsScroller.clientWidth * 0.7, behavior: 'smooth' });
hsPrev.addEventListener('click', () => feedStep(-1));
hsNext.addEventListener('click', () => feedStep(1));

// arrastar com o mouse (com um pouco de inércia ao soltar)
let drag = null;
hsScroller.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  drag = { x: e.clientX, sl: hsScroller.scrollLeft, moved: false, vx: 0, lx: e.clientX, lt: performance.now() };
});
addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; hsScroller.classList.add('dragging'); }
  if (!drag.moved) return;
  const now = performance.now();
  drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.lt);
  drag.lx = e.clientX; drag.lt = now;
  hsScroller.scrollLeft = drag.sl - dx;
});
addEventListener('pointerup', () => {
  if (!drag) return;
  const { moved } = drag;
  let v = drag.vx * 16;
  drag = null;
  if (!moved) return;
  hsScroller.classList.remove('dragging');
  (function glide() {
    if (Math.abs(v) < 0.5 || drag) return;
    hsScroller.scrollLeft -= v; v *= 0.92;
    requestAnimationFrame(glide);
  })();
});

let rsNear = false, rsP = 0, scrolling = false, idleT;
const rsVids = [[rsMain, 'main'], [rsL, 'side'], [rsR, 'side']].map(([el, k]) => [$('video', el), k]);
function updateReels() {
  const sides = M.vw > 760;
  rsVids.forEach(([v, k]) => {
    // laterais só tocam com a rolagem parada: três vídeos decodificando junto travam o scroll
    const want = rsNear && (k === 'main' || (sides && rsP > 0.12 && !scrolling));
    if (want && !v.src) v.src = v.dataset.src;
    if (want && v.paused) v.play().catch(() => {});
    else if (!want && !v.paused) v.pause();
  });
}
// só escreve no DOM quando o valor muda
const set = (key, el, prop, val) => { if (last[key] !== val) { last[key] = val; el.style[prop] = val; } };
const vis = (top, h, y) => top + h > y - 50 && top < y + M.vh + 50;

function measure() {
  const vw = innerWidth, vh = innerHeight, mob = vw <= 640;
  M.vw = vw; M.vh = vh;
  M.max = document.documentElement.scrollHeight - vh;
  M.heroH = hero.offsetHeight;
  // nome gigante: ocupa a largura toda, sem passar de 30% da altura da tela
  const gut = parseFloat(getComputedStyle(heroCopy).paddingLeft);
  hxName.style.fontSize = '100px';
  hxName.style.fontSize = Math.min((vw - gut * 2) / hxNameIn.offsetWidth * 100, vh * 0.24).toFixed(1) + 'px';
  // janela do hero: nasce escondida embaixo e sobe cobrindo a tela
  M.t0 = vh;
  M.w0 = mob ? vw - 32 : Math.min(1040, vw - 48);
  M.procTop = docTop(processEl); M.procH = processEl.offsetHeight;
  M.steps = steps.map(docTop);
  M.manTop = docTop(manifesto); M.manH = manifesto.offsetHeight;
  M.hsItems = hsItems.map(el => [el.offsetLeft + el.offsetWidth / 2, el]);
  updateFeed();
  M.rsTop = docTop(rshow); M.rsH = rshow.offsetHeight;
  M.rsT0 = mob ? clamp(vh * 0.28, 190, 250) : clamp(vh * 0.32, 200, 290);
  M.sp = spFx.map(f => [docTop(f.el), f.el.offsetHeight]);
  M.cards = catCards.map(c => [docTop(c), c.offsetHeight]);
  M.third = track.scrollWidth / 3;
  M.marqTop = docTop(marqueeEl); M.marqH = marqueeEl.offsetHeight;
  last = {};
  onScroll();
}

function onScroll() {
  ticking = false;
  const y = scrollY, vh = M.vh, vw = M.vw;

  nav.classList.toggle('scrolled', y > 20);
  set('prog', progress, 'transform', `scaleX(${M.max > 0 ? (y / M.max).toFixed(4) : 0})`);
  waFloat.classList.toggle('show', y > M.heroH - vh * 0.5);

  // HERO: a janela (clip-path) abre até a tela cheia; as imagens não mudam de tamanho
  if (y < M.heroH) {
    const p = clamp(y / ((M.heroH - vh) * 0.85));
    // recorte retangular (sem cantos arredondados): o navegador processa bem mais rápido
    const top = M.t0 * (1 - p), side = ((vw - M.w0) / 2) * (1 - p);
    set('hm', heroMedia, 'clipPath', `inset(${top.toFixed(1)}px ${side.toFixed(1)}px 0px)`);
    set('hc', heroCopy, 'transform', `translate3d(0,${(p * -120).toFixed(1)}px,0) scale(${(1 - p * 0.08).toFixed(4)})`);
    set('hco', heroCopy, 'opacity', clamp(1 - p * 1.25).toFixed(3));
    set('cap', hmCaption, 'opacity', clamp((p - 0.6) * 2.5).toFixed(3));
    set('capt', hmCaption, 'transform', `translate3d(0,${((1 - p) * 30).toFixed(1)}px,0)`);
    heroStage.classList.toggle('moving', p > 0.02);
  }
  heroStage.classList.toggle('off', y > M.heroH);
  marqueeEl.classList.toggle('off', !vis(M.marqTop, M.marqH, y));

  // Processo
  if (vis(M.procTop, M.procH, y)) {
    set('proc', processFill, 'transform', `scaleY(${clamp((y + vh * 0.6 - M.procTop) / M.procH).toFixed(4)})`);
    steps.forEach((s, i) => s.classList.toggle('on', M.steps[i] - y < vh * 0.6));
  }

  // Manifesto
  if (vis(M.manTop, M.manH, y)) {
    const lit = Math.round(clamp((vh * 0.85 - (M.manTop - y)) / (M.manH + vh * 0.35)) * words.length);
    if (last.lit !== lit) { last.lit = lit; words.forEach((w, i) => w.classList.toggle('on', i < lit)); }
  }

  // Reels: celulares já estão no tamanho final; crescem por scale
  if (vis(M.rsTop, M.rsH, y)) {
    const p = clamp((y - M.rsTop) / ((M.rsH - vh) * 0.8));
    const s0 = ((vh - M.rsT0) * 0.9) / vh;
    const sc = (s0 + (1 - s0) * p).toFixed(4);
    const ty = ((M.rsT0 / 2 + (vh - M.rsT0) * 0.05) * (1 - p)).toFixed(1);
    const sx = ((1 - p) * vw * 0.4).toFixed(1), rot = ((1 - p) * 8).toFixed(2);
    set('rsm', rsMain, 'transform', `translate3d(0,${ty}px,0) scale(${sc})`);
    set('rsl', rsL, 'transform', `translate3d(-${sx}px,${ty}px,0) rotate(-${rot}deg) scale(${sc})`);
    set('rsr', rsR, 'transform', `translate3d(${sx}px,${ty}px,0) rotate(${rot}deg) scale(${sc})`);
    const so = clamp(p * 1.6).toFixed(3);
    set('rslo', rsL, 'opacity', so); set('rsro', rsR, 'opacity', so);
    set('rsc', rsCopy, 'opacity', clamp(1 - p * 2.2).toFixed(3));
    set('rsct', rsCopy, 'transform', `translate3d(0,${(p * -60).toFixed(1)}px,0)`);
    set('rse', rsEnd, 'opacity', clamp((p - 0.7) * 3.4).toFixed(3));
    rsStage.classList.toggle('done', p > 0.85);
    if ((rsP > 0.12) !== (p > 0.12)) { rsP = p; updateReels(); } else rsP = p;
  }

  // Títulos, foto e números
  spFx.forEach((f, i) => {
    const [top, h] = M.sp[i];
    if (!vis(top, h, y)) return;
    const sp = +clamp((vh - (top - y)) / (vh + h)).toFixed(3);
    if (last['sp' + i] !== sp) { last['sp' + i] = sp; f.fn(sp); }
  });

  // Leque dos cards do portfólio abre quando o card passa pelo centro da tela
  catCards.forEach((card, i) => {
    const [top, h] = M.cards[i];
    if (!vis(top, h, y)) return;
    const f = clamp(1 - Math.abs((top - y + h / 2) / vh - 0.5) * 2.4).toFixed(2);
    if (last['f' + i] !== f) { last['f' + i] = f; card.style.setProperty('--f', f); }
  });

  // Marquee anda um pouco mais conforme a rolagem
  if (M.third && vis(M.marqTop, M.marqH, y)) set('mq', marqueeShift, 'transform', `translate3d(${(-((y * 0.35) % M.third)).toFixed(1)}px,0,0)`);
}
addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  if (!scrolling) { scrolling = true; if (rsNear) updateReels(); }
  clearTimeout(idleT);
  idleT = setTimeout(() => { scrolling = false; if (rsNear) updateReels(); }, 200);
}, { passive: true });

// remede quando o tamanho da janela ou do conteúdo muda (fontes, accordion etc.)
let mt;
const remeasure = () => { clearTimeout(mt); mt = setTimeout(measure, 120); };
addEventListener('resize', remeasure);
new ResizeObserver(remeasure).observe(document.body);
if (document.fonts) document.fonts.ready.then(measure);
measure();

/* ============================================================
   ENTRADA do hero + lente que revela a foto colorida
============================================================ */
const root = document.documentElement;
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('hero-in')));

const hxPerson = $('#hxPerson');
const hxColor = $('.hx-color');
// funciona em qualquer computador com mouse (não depende das configurações de animação do sistema)
if (matchMedia('(any-hover: hover), (any-pointer: fine)').matches) {
  let lensR = 0, lensTo = 0, lensRaf = 0;
  const grow = () => {
    lensR += (lensTo - lensR) * 0.18;
    hxColor.style.setProperty('--r', lensR.toFixed(1) + 'px');
    lensRaf = Math.abs(lensTo - lensR) > 0.5 ? requestAnimationFrame(grow) : 0;
  };
  const aim = to => { lensTo = to; if (!lensRaf) lensRaf = requestAnimationFrame(grow); };
  hxPerson.addEventListener('pointermove', e => {
    const r = hxPerson.getBoundingClientRect();
    hxColor.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
    hxColor.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    aim(Math.max(140, r.width * 0.3));
  });
  hxPerson.addEventListener('pointerleave', () => aim(0));
}

/* ============================================================
   REVEAL + CONTADORES
============================================================ */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count-to]', e.target).forEach(countUp);
    io.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => io.observe(el));

function countUp(el) {
  const to = +el.dataset.countTo;
  const suffix = to > 3 ? '+' : '';
  if (reduced) { el.textContent = to + suffix; return; }
  const t0 = performance.now(), dur = 1600;
  (function frame(t) {
    const k = clamp((t - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + (k === 1 ? suffix : '');
    if (k < 1) requestAnimationFrame(frame);
  })(t0);
}

/* ============================================================
   ACCORDION
============================================================ */
$$('.acc-trigger').forEach(btn => btn.addEventListener('click', () => {
  const item = btn.parentElement;
  const open = !item.classList.contains('open');
  $$('.acc-item.open').forEach(i => { i.classList.remove('open'); $('.acc-trigger', i).setAttribute('aria-expanded', 'false'); });
  item.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open);
}));

/* ============================================================
   PORTFÓLIO: contagens + lightbox
============================================================ */
const DATA = window.PORTFOLIO || {};
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
$$('[data-count]').forEach(el => {
  const cat = DATA[el.dataset.count];
  if (!cat) return;
  const n = cat.projects.reduce((a, p) => a + p.items.length, 0);
  const label = el.dataset.count === 'identidade' ? plural(cat.projects.length, 'manual', 'manuais')
              : el.dataset.count === 'reels' ? plural(n, 'vídeo', 'vídeos') : plural(n, 'peça', 'peças');
  el.textContent = `${label} · ${plural(cat.projects.length, 'marca', 'marcas')}`;
});

const lb = $('#lb');
const lbStage = $('#lbStage');
const lbMedia = $('#lbMedia');
const lbThumbs = $('#lbThumbs');
const lbClients = $('#lbClients');
const state = { cat: null, c: 0, i: 0 };
let lastFocus = null;

function openLb(catKey, c = 0, i = 0) {
  const cat = DATA[catKey];
  if (!cat) return;
  lastFocus = document.activeElement;
  state.cat = cat; state.c = c; state.i = Math.max(0, i);
  $('#lbKicker').textContent = cat.label;
  lbClients.innerHTML = cat.projects.map((p, k) =>
    `<button data-c="${k}">${p.client}<small>${p.items.length}</small></button>`).join('');
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lock');
  render(true);
  $('#lbClose').focus();
}

function closeLb() {
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lock');
  lbStage.classList.remove('zoomed');
  lbMedia.innerHTML = '';
  if (lastFocus) lastFocus.focus();
}

function render(newClient) {
  const proj = state.cat.projects[state.c];
  const item = proj.items[state.i];
  lbStage.classList.remove('zoomed');
  $('#lbClient').textContent = proj.client;
  $('#lbTag').textContent = item.tag;
  $('#lbCounter').textContent = `${state.i + 1} / ${proj.items.length}`;

  if (item.t === 'video') {
    lbMedia.innerHTML = `<video src="${item.src}" poster="${item.poster}" controls playsinline autoplay muted loop preload="metadata"></video>`;
  } else {
    lbMedia.innerHTML = `<img src="${item.src}" alt="${proj.client}: ${item.tag}">`;
  }

  if (newClient) {
    lbThumbs.innerHTML = proj.items.map((it, k) =>
      `<button data-i="${k}" aria-label="Peça ${k + 1}"><img src="${th(it.t === 'video' ? it.poster : it.src)}" alt="" loading="lazy"></button>`).join('');
    $$('button', lbClients).forEach((b, k) => b.classList.toggle('active', k === state.c));
    const ab = $('button.active', lbClients);
    if (ab) ab.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  $$('button', lbThumbs).forEach((b, k) => b.classList.toggle('active', k === state.i));
  const at = $('button.active', lbThumbs);
  if (at) at.scrollIntoView({ block: 'nearest', inline: 'center', behavior: newClient ? 'auto' : 'smooth' });

  const last = state.c === state.cat.projects.length - 1 && state.i === proj.items.length - 1;
  $('#lbPrev').disabled = state.c === 0 && state.i === 0;
  $('#lbNext').disabled = last;

  // pré-carrega a próxima imagem
  const nxt = proj.items[state.i + 1] || (state.cat.projects[state.c + 1] || {}).items?.[0];
  if (nxt && nxt.t === 'img') { const im = new Image(); im.src = nxt.src; }
}

function step(d) {
  const projs = state.cat.projects;
  let { c, i } = state;
  i += d;
  if (i >= projs[c].items.length) { if (c === projs.length - 1) return; c++; i = 0; }
  if (i < 0) { if (c === 0) return; c--; i = projs[c].items.length - 1; }
  const changed = c !== state.c;
  state.c = c; state.i = i;
  render(changed);
}
function goClient(c) {
  const n = state.cat.projects.length;
  state.c = (c + n) % n; state.i = 0;
  render(true);
}

$$('.cat-card').forEach(card => card.addEventListener('click', () => openLb(card.dataset.cat)));
$$('[data-open]').forEach(b => b.addEventListener('click', () => openLb(b.dataset.open)));

/* Reels: contagens reais + vídeos carregam só quando a seção se aproxima */
if (DATA.reels) {
  $('[data-reels-count]').textContent = DATA.reels.projects.reduce((a, p) => a + p.items.length, 0);
  $('[data-reels-brands]').textContent = DATA.reels.projects.length;
}
/* Vídeos dos reels: só baixam quando a seção se aproxima e só tocam quando
   estão realmente na tela (os laterais esperam aparecer; no celular nem carregam) */
new IntersectionObserver(([e]) => { rsNear = e.isIntersecting; updateReels(); }, { rootMargin: '300px 0px' }).observe($('#reels-show'));
$('#lbClose').addEventListener('click', closeLb);
$('#lbPrev').addEventListener('click', () => step(-1));
$('#lbNext').addEventListener('click', () => step(1));
lbClients.addEventListener('click', e => { const b = e.target.closest('button'); if (b) goClient(+b.dataset.c); });
lbThumbs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { state.i = +b.dataset.i; render(false); } });
lbMedia.addEventListener('click', e => {
  if (e.target.tagName !== 'IMG') return;
  const z = !lbStage.classList.contains('zoomed');
  lbStage.classList.toggle('zoomed', z);
  if (z) {
    const r = e.target.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    requestAnimationFrame(() => {
      lbStage.scrollLeft = fx * lbStage.scrollWidth - lbStage.clientWidth / 2;
      lbStage.scrollTop = fy * lbStage.scrollHeight - lbStage.clientHeight / 2;
    });
  }
});

addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') { lbStage.classList.contains('zoomed') ? lbStage.classList.remove('zoomed') : closeLb(); }
  else if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'ArrowLeft') step(-1);
  else if (e.key === 'ArrowDown') { e.preventDefault(); goClient(state.c + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); goClient(state.c - 1); }
});

/* Swipe no celular */
let sx = 0, sy = 0;
lbStage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
lbStage.addEventListener('touchend', e => {
  if (lbStage.classList.contains('zoomed')) return;
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
}, { passive: true });
