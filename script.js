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
FEED.forEach(([cat, client, i]) => {
  const c = (PF[cat] || { projects: [] }).projects.findIndex(p => p.client === client);
  if (c < 0) return;
  const it = PF[cat].projects[c].items[i] || PF[cat].projects[c].items[0];
  const fig = document.createElement('figure');
  fig.className = 'hs-item';
  fig.tabIndex = 0;
  fig.style.aspectRatio = `${it.w} / ${it.h}`;
  fig.innerHTML = `<img src="${it.src}" alt="${client}: ${it.tag}" loading="lazy"><figcaption><strong>${client}</strong>${PF[cat].label}</figcaption>`;
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
const feed = $('#feed');
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
let ticking = false;

function onScroll() {
  const y = scrollY;
  const vh = innerHeight;
  const max = document.documentElement.scrollHeight - vh;

  nav.classList.toggle('scrolled', y > 20);
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  waFloat.classList.toggle('show', y > hero.offsetHeight - vh * 0.5);

  // Hero: 0 → 1 enquanto o palco está fixo
  const range = hero.offsetHeight - vh;
  const p = clamp(y / (range * 0.85));
  heroStage.style.setProperty('--p', p.toFixed(4));

  // Processo: linha preenche conforme a seção passa pelo centro da tela
  const r = processEl.getBoundingClientRect();
  const pp = clamp((vh * 0.6 - r.top) / r.height);
  processFill.style.transform = `scaleY(${pp})`;
  steps.forEach(s => s.classList.toggle('on', s.getBoundingClientRect().top < vh * 0.6));

  // Manifesto
  const mr = manifesto.getBoundingClientRect();
  const mp = clamp((vh * 0.85 - mr.top) / (mr.height + vh * 0.35));
  const lit = Math.round(mp * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < lit));

  // Feed horizontal: a rolagem vertical vira deslocamento lateral
  const fTop = feed.offsetTop, fRange = feed.offsetHeight - vh;
  if (y > fTop - vh && y < fTop + feed.offsetHeight) {
    const fp = clamp((y - fTop) / fRange);
    const dist = Math.max(0, hsTrack.scrollWidth - innerWidth);
    hsTrack.style.transform = `translate3d(${-fp * dist}px,0,0)`;
    hsBar.style.transform = `scaleX(${fp})`;
    hsItems.forEach((el, i) => {
      const r2 = el.getBoundingClientRect();
      const c = (r2.left + r2.width / 2) / innerWidth - 0.5; // -0.5 (esq) … 0.5 (dir)
      el.style.setProperty('--lift', (Math.abs(c) * 50 * (i % 2 ? 1 : -1)).toFixed(1));
      el.style.setProperty('--tilt', (c * -4).toFixed(2));
      el.style.setProperty('--px', (c * -30).toFixed(1));
    });
  }

  // Reels: celular central cresce e os laterais entram
  const rTop = rshow.offsetTop, rRange = rshow.offsetHeight - vh;
  if (y > rTop - vh && y < rTop + rshow.offsetHeight) {
    const rp = clamp((y - rTop) / (rRange * 0.8));
    rsStage.style.setProperty('--p', rp.toFixed(4));
    rsStage.classList.toggle('done', rp > 0.85);
  }

  // Elementos com data-sp: progresso 0→1 enquanto atravessam a tela
  spEls.forEach(el => {
    const r3 = el.getBoundingClientRect();
    if (r3.bottom < -50 || r3.top > vh + 50) return;
    el.style.setProperty('--sp', clamp((vh - r3.top) / (vh + r3.height)).toFixed(4));
  });

  // Leque dos cards do portfólio abre quando o card está no centro da tela
  catCards.forEach(card => {
    const r4 = card.getBoundingClientRect();
    const c = (r4.top + r4.height / 2) / vh - 0.5;
    card.style.setProperty('--f', clamp(1 - Math.abs(c) * 2.4).toFixed(3));
  });

  // Marquee anda um pouco mais conforme a rolagem
  const third = track.scrollWidth / 3;
  if (third) marqueeShift.style.transform = `translate3d(${-((y * 0.35) % third)}px,0,0)`;

  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

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
      `<button data-i="${k}" aria-label="Peça ${k + 1}"><img src="${it.t === 'video' ? it.poster : it.src}" alt="" loading="lazy"></button>`).join('');
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
const rsVideos = $$('#reels-show video');
new IntersectionObserver(([e]) => {
  rsVideos.forEach(v => {
    if (e.isIntersecting) {
      if (!v.src) v.src = v.dataset.src;
      if (getComputedStyle(v.parentElement).display !== 'none') v.play().catch(() => {});
    } else v.pause();
  });
}, { rootMargin: '400px 0px' }).observe($('#reels-show'));
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
