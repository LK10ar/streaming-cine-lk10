/* Ciné LK10 — lk10-deco.js : DÉCO DES FÊTES
   • L'admin a un bouton « Déco » (baguette magique, dans le header) : Halloween / Noël / Pâques / Saint-Valentin / Nouvel an.
     Un clic sur une fête = la déco apparaît pour TOUT LE MONDE. Re-clic (ou « Aucune déco ») = tout est enlevé.
   • « Noël » : neige, guirlande lumineuse, sapin, cadeaux, bonbons, lutin, Père Noël, Reine des neiges, bonhomme de neige,
     traîneau qui traverse le ciel, petit train + le bandeau « Le mois de Noël » (lk10-noel.js).
   • « Halloween » : pilote lk10-halloween.js (toiles, chauves-souris, cimetière...) et le bandeau « Le mois de l'horreur ».
   • Pâques / Saint-Valentin / Nouvel an : déjà dans le menu, leur déco sera ajoutée plus tard (voir THEMES plus bas).
   • Tant que l'admin n'a JAMAIS cliqué sur le bouton, le site garde son comportement d'avant (Halloween automatique du 1er octobre
     au 2 novembre). Dès qu'il choisit (même « Aucune déco »), son choix décide pour tout le monde.
   • Autres scripts : écoute  document.addEventListener('lk10deco', e => e.detail.theme)  (null = rien choisi, '' = aucune déco)
     ou lis  window.LK10Deco.get() ;  <html data-deco="noel|halloween|...|none">.
   À ajouter dans index.html, TOUT EN DERNIER (après lk10-noel.js) :  <script src="lk10-deco.js"></script>
   et dans <head> :  <link rel="stylesheet" href="lk10-deco.css"> */
(function () {
  'use strict';
  var KEY = 'lk10_deco', de = document.documentElement;
  var root = null, rafId = 0, timers = [], busy = false, busyTimer = 0, theme = '', ctl = null;   // ctl : null = rien choisi · '' = aucune déco · sinon nom de la fête
  var $ = function (id) { return document.getElementById(id); };

  function isTV() {
    if (de.classList.contains('lk10-tv')) return true;
    try { if (localStorage.getItem('lk10_tv') === '1') return true; } catch (e) {}
    return false;
  }
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ====================== DESSINS (SVG) ====================== */
  function gift(a, b) {
    return '<svg viewBox="0 0 40 42"><rect x="3" y="17" width="34" height="23" rx="2" fill="' + a + '"/><rect x="2" y="12" width="36" height="9" rx="2" fill="' + a + '" stroke="rgba(0,0,0,.18)"/>' +
      '<rect x="17" y="12" width="6" height="28" fill="' + b + '"/><ellipse cx="14" cy="9" rx="7" ry="4.5" fill="' + b + '" transform="rotate(-20 14 9)"/><ellipse cx="26" cy="9" rx="7" ry="4.5" fill="' + b + '" transform="rotate(20 26 9)"/><circle cx="20" cy="10" r="3.2" fill="' + b + '" stroke="rgba(0,0,0,.2)"/></svg>';
  }
  var SVG = {
    tree: '<svg viewBox="0 0 120 172"><rect x="52" y="146" width="16" height="22" rx="2" fill="#6b4423"/>' +
      '<polygon points="60,18 98,68 22,68" fill="#1e8449"/><polygon points="60,42 108,104 12,104" fill="#239b56"/><polygon points="60,72 116,148 4,148" fill="#27ae60"/>' +
      '<path d="M30 60 Q60 78 90 60 M20 94 Q60 116 100 94 M14 132 Q60 158 106 132" fill="none" stroke="#fff6c9" stroke-width="2.4" stroke-dasharray="1 6" stroke-linecap="round"/>' +
      '<polygon class="dc-star" points="60,2 64,12 75,12 66,18 70,29 60,22 50,29 54,18 45,12 56,12" fill="#ffd93b" stroke="#f1b800"/>' +
      '<circle cx="46" cy="56" r="4.5" fill="#e74c3c"/><circle cx="74" cy="88" r="5" fill="#f1c40f"/><circle cx="38" cy="116" r="5" fill="#3498db"/><circle cx="82" cy="126" r="5" fill="#e74c3c"/><circle cx="60" cy="100" r="4.5" fill="#9b59b6"/><circle cx="26" cy="138" r="4.5" fill="#f1c40f"/><circle cx="98" cy="140" r="4.5" fill="#3498db"/><circle cx="64" cy="48" r="3.5" fill="#3498db"/>' +
      '<circle class="dc-tw" cx="54" cy="80" r="3" fill="#fff59d"/><circle class="dc-tw t2" cx="88" cy="110" r="3" fill="#ff8a80"/><circle class="dc-tw t3" cx="34" cy="98" r="3" fill="#80d8ff"/><circle class="dc-tw" cx="70" cy="136" r="3" fill="#fff59d"/><circle class="dc-tw t2" cx="46" cy="140" r="3" fill="#ff8a80"/></svg>',
    cane: '<svg viewBox="0 0 28 82"><path d="M23 80V24A10.5 10.5 0 0 0 2 24" fill="none" stroke="#fff" stroke-width="8.5"/><path d="M23 80V24A10.5 10.5 0 0 0 2 24" fill="none" stroke="#d62828" stroke-width="8.5" stroke-dasharray="6 6"/></svg>',
    snowman: '<svg viewBox="0 0 100 152"><g stroke="#b9c9d8" stroke-width="1.6"><circle cx="50" cy="114" r="33" fill="#fff"/><circle cx="50" cy="72" r="24" fill="#fff"/><circle cx="50" cy="38" r="18" fill="#fff"/></g>' +
      '<path d="M28 70 L6 52 M72 70 L94 50" stroke="#6b4423" stroke-width="3.5" stroke-linecap="round"/><rect x="34" y="8" width="32" height="14" rx="2" fill="#222"/><rect x="29" y="21" width="42" height="5" rx="2" fill="#222"/><rect x="34" y="17" width="32" height="4" fill="#d62828"/>' +
      '<circle cx="43" cy="34" r="2.4" fill="#222"/><circle cx="57" cy="34" r="2.4" fill="#222"/><polygon points="50,38 68,42 50,45" fill="#ff8c1a"/><path d="M42 46 Q50 51 58 46" fill="none" stroke="#222" stroke-width="1.8"/>' +
      '<rect x="30" y="52" width="40" height="9" rx="4" fill="#d62828"/><rect x="58" y="58" width="9" height="22" rx="3" fill="#d62828"/><circle cx="50" cy="76" r="2.6" fill="#222"/><circle cx="50" cy="92" r="2.8" fill="#222"/><circle cx="50" cy="108" r="3" fill="#222"/></svg>',
    elf: '<svg viewBox="0 0 60 112"><path d="M16 30 Q30 -6 46 30Z" fill="#27ae60"/><path d="M45 26 Q56 10 58 4" fill="none" stroke="#27ae60" stroke-width="6" stroke-linecap="round"/><circle cx="58" cy="4" r="4" fill="#f1c40f"/>' +
      '<rect x="14" y="27" width="34" height="6" rx="3" fill="#d62828"/><circle cx="30" cy="42" r="13" fill="#f6c9a0"/><path d="M17 42 L8 38 L16 48Z M43 42 L52 38 L44 48Z" fill="#f6c9a0"/>' +
      '<circle cx="25" cy="40" r="1.8" fill="#222"/><circle cx="35" cy="40" r="1.8" fill="#222"/><path d="M25 47 Q30 51 35 47" fill="none" stroke="#c0392b" stroke-width="1.8"/><circle cx="21" cy="45" r="2.4" fill="#ff9aa2" opacity=".7"/><circle cx="39" cy="45" r="2.4" fill="#ff9aa2" opacity=".7"/>' +
      '<path d="M16 58 L44 58 L48 90 L12 90Z" fill="#27ae60"/><rect x="14" y="76" width="32" height="5" fill="#222"/><rect x="26" y="75" width="8" height="7" fill="#f1c40f"/>' +
      '<rect x="17" y="90" width="9" height="16" fill="#d62828"/><rect x="34" y="90" width="9" height="16" fill="#fff"/><path d="M13 108 Q16 102 27 104 L27 110 L13 110Z M33 104 Q44 102 47 108 L47 110 L33 110Z" fill="#6b4423"/><path d="M13 60 L4 80 M47 60 L56 80" stroke="#27ae60" stroke-width="6" stroke-linecap="round"/></svg>',
    santa: '<svg viewBox="0 0 70 122"><path d="M16 34 Q22 -2 52 22 Q56 28 54 34Z" fill="#d62828"/><circle cx="53" cy="22" r="6" fill="#fff"/><rect x="13" y="30" width="44" height="9" rx="4.5" fill="#fff"/>' +
      '<circle cx="35" cy="46" r="13" fill="#f6c9a0"/><path d="M20 46 Q22 76 35 80 Q48 76 50 46 Q42 56 35 54 Q28 56 20 46Z" fill="#fff"/><circle cx="35" cy="45" r="3" fill="#e8a37a"/><circle cx="29" cy="41" r="1.8" fill="#222"/><circle cx="41" cy="41" r="1.8" fill="#222"/>' +
      '<path d="M14 66 L56 66 L60 102 L10 102Z" fill="#d62828"/><rect x="11" y="86" width="48" height="7" fill="#222"/><rect x="29" y="85" width="12" height="9" rx="1" fill="#f1c40f"/><path d="M33 66 L37 66 L37 102 L33 102Z" fill="#fff" opacity=".9"/>' +
      '<rect x="16" y="102" width="14" height="14" fill="#d62828"/><rect x="40" y="102" width="14" height="14" fill="#d62828"/><path d="M12 120 L12 114 L31 114 L31 120Z M39 114 L58 114 L58 120 L39 120Z" fill="#222"/><path d="M14 68 L2 90 M56 68 L68 50" stroke="#d62828" stroke-width="8" stroke-linecap="round"/><circle cx="2" cy="92" r="5" fill="#fff"/><circle cx="68" cy="48" r="5" fill="#fff"/></svg>',
    queen: '<svg viewBox="0 0 70 132"><path d="M22 28 Q12 64 18 100 L52 100 Q58 64 48 28Z" fill="#dff3ff"/><path d="M20 24 L24 8 L30 18 L35 4 L40 18 L46 8 L50 24Z" fill="#8fd3ff" stroke="#fff" stroke-width="1.4"/>' +
      '<circle cx="35" cy="34" r="12" fill="#fbe0cc"/><path d="M23 34 Q22 22 35 20 Q48 22 47 34 Q44 26 35 26 Q26 26 23 34Z" fill="#e9f6ff"/><circle cx="30" cy="35" r="1.6" fill="#3a6ea5"/><circle cx="40" cy="35" r="1.6" fill="#3a6ea5"/><path d="M31 41 Q35 44 39 41" fill="none" stroke="#e0607e" stroke-width="1.6"/>' +
      '<path d="M26 50 L44 50 L58 124 L12 124Z" fill="#6ec6ff"/><path d="M26 50 L44 50 L50 78 L20 78Z" fill="#8fd3ff"/><path d="M14 90 Q35 110 56 90" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/><path d="M22 50 Q6 70 8 118 L16 120 Q16 80 26 56Z" fill="#b388ff" opacity=".75"/>' +
      '<g stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M35 86 v14 M28 93 h14 M30 88 l10 10 M40 88 l-10 10"/></g><path class="dc-tw" d="M54 34 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff"/></svg>',
    hat: '<svg viewBox="0 0 40 40"><path d="M6 30 Q8 6 28 8 Q30 18 34 28Z" fill="#d62828"/><rect x="3" y="27" width="34" height="9" rx="4.5" fill="#fff"/><circle cx="30" cy="9" r="5" fill="#fff"/></svg>',
    sleigh: '<svg viewBox="0 0 270 96"><defs><g id="dcRd"><ellipse cx="34" cy="46" rx="22" ry="11" fill="#9a6232"/><path d="M18 52 L14 74 M26 54 L24 76 M44 54 L46 76 M52 52 L56 72" stroke="#7a4a22" stroke-width="3.6" stroke-linecap="round"/><path d="M50 42 L62 26 L70 30 L62 48Z" fill="#9a6232"/><circle cx="68" cy="28" r="8" fill="#a8703a"/><circle cx="75" cy="30" r="3.6" fill="#ff3b30"/><circle cx="75" cy="30" r="7" fill="#ff3b30" opacity=".25"/><circle cx="66" cy="25" r="1.4" fill="#222"/><path d="M64 20 L58 6 M60 12 L52 10 M70 19 L74 4 M72 11 L80 8" stroke="#6b4423" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M12 42 L6 38" stroke="#7a4a22" stroke-width="3" stroke-linecap="round"/></g></defs>' +
      '<use href="#dcRd" x="186" y="2"/><use href="#dcRd" x="132" y="6"/><path d="M200 44 L168 52 L132 50 L112 56" stroke="#f1c40f" stroke-width="1.6" fill="none"/>' +
      '<path d="M14 58 Q10 36 28 34 L96 34 Q108 36 112 46 L106 70 L22 70Z" fill="#d62828"/><path d="M8 78 Q4 70 16 70 L112 74 Q124 72 122 64" fill="none" stroke="#f1c40f" stroke-width="4" stroke-linecap="round"/><path d="M26 70 L24 78 M70 72 L68 78 M104 72 L102 76" stroke="#f1c40f" stroke-width="3"/>' +
      '<circle cx="40" cy="32" r="9" fill="#d62828"/><path d="M32 24 Q40 8 52 22Z" fill="#d62828"/><circle cx="52" cy="22" r="4" fill="#fff"/><circle cx="62" cy="26" r="9" fill="#d62828"/><circle cx="62" cy="22" r="7" fill="#f6c9a0"/><path d="M55 25 Q62 36 69 25 Q62 29 55 25Z" fill="#fff"/><ellipse cx="86" cy="30" rx="14" ry="12" fill="#8e5a2b"/><path d="M76 20 Q86 12 96 20" stroke="#6b4423" stroke-width="2" fill="none"/></svg>',
    train: '<svg viewBox="0 0 340 74"><g class="dc-puffs"><circle class="dc-puff" cx="60" cy="8" r="6" fill="#e8eef5"/><circle class="dc-puff" style="animation-delay:-.5s" cx="60" cy="8" r="6" fill="#e8eef5"/><circle class="dc-puff" style="animation-delay:-1s" cx="60" cy="8" r="6" fill="#e8eef5"/></g>' +
      '<rect x="6" y="30" width="62" height="26" rx="4" fill="#222"/><rect x="48" y="14" width="26" height="42" rx="3" fill="#d62828"/><rect x="53" y="19" width="16" height="14" rx="2" fill="#bfe8ff"/><rect x="52" y="12" width="28" height="5" fill="#222"/><rect x="52" y="16" width="8" height="14" fill="#222"/><rect x="56" y="14" width="8" height="2" fill="#222"/><rect x="14" y="20" width="10" height="12" fill="#222"/><rect x="11" y="17" width="16" height="4" fill="#f1c40f"/><path d="M4 58 L16 58 L8 66Z" fill="#888"/>' +
      '<g fill="#444"><circle cx="22" cy="60" r="8"/><circle cx="46" cy="60" r="8"/><circle cx="62" cy="62" r="5.5"/></g><g fill="#bbb"><circle cx="22" cy="60" r="3"/><circle cx="46" cy="60" r="3"/><circle cx="62" cy="62" r="2"/></g>' +
      '<path d="M68 52 H82 M158 52 H172" stroke="#555" stroke-width="3"/><rect x="82" y="26" width="76" height="30" rx="3" fill="#27ae60"/><rect x="86" y="14" width="16" height="12" fill="#f1c40f" stroke="#c9a000"/><rect x="108" y="10" width="14" height="16" fill="#3498db"/><rect x="128" y="16" width="14" height="10" fill="#e74c3c"/><rect x="82" y="34" width="76" height="4" fill="#1e8449"/><g fill="#444"><circle cx="98" cy="60" r="7"/><circle cx="142" cy="60" r="7"/></g>' +
      '<rect x="172" y="26" width="76" height="30" rx="3" fill="#3498db"/><path d="M176 26 L190 8 L204 26Z" fill="#1e8449"/><path d="M200 26 L216 4 L232 26Z" fill="#27ae60"/><rect x="172" y="34" width="76" height="4" fill="#2678b0"/><g fill="#444"><circle cx="188" cy="60" r="7"/><circle cx="232" cy="60" r="7"/></g>' +
      '<path d="M248 52 H262" stroke="#555" stroke-width="3"/><rect x="262" y="26" width="64" height="30" rx="3" fill="#f1c40f"/><rect x="266" y="12" width="14" height="14" fill="#d62828"/><rect x="288" y="8" width="18" height="18" fill="#9b59b6"/><rect x="262" y="34" width="64" height="4" fill="#d4a900"/><g fill="#444"><circle cx="278" cy="60" r="7"/><circle cx="312" cy="60" r="7"/></g></svg>'
  };

  /* ====================== DÉCO DE NOËL ====================== */
  function div(cls, html) { var d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; return d; }

  function buildLights() {
    var wrap = div('dc-lights'), cols = ['#ff3b30', '#ffd60a', '#34c759', '#0a84ff', '#ff9f0a'];
    var n = Math.ceil(window.innerWidth / 38) + 2;
    for (var i = 0; i < n; i++) {
      var li = document.createElement('i');
      li.style.setProperty('--c', cols[i % cols.length]); li.style.setProperty('--d', (-(i % 5) * 0.37) + 's');
      wrap.appendChild(li);
    }
    return wrap;
  }

  function buildSnow() {
    var c = document.createElement('canvas'); c.className = 'dc-snow'; root.appendChild(c);
    var ctx = c.getContext('2d'), W = 0, H = 0, fl = [], last = 0;
    function mk(random) { return { x: Math.random() * W, y: random ? Math.random() * H : -8, r: rnd(1, 3.2), v: rnd(.5, 1.5), s: rnd(0, 6.28), a: rnd(.5, 1) }; }
    function size() {
      W = c.width = window.innerWidth; H = c.height = window.innerHeight;
      var n = W < 700 ? 34 : Math.min(95, Math.round(W / 20));
      while (fl.length < n) fl.push(mk(true)); fl.length = n;
    }
    size(); window.addEventListener('resize', size);
    c._off = function () { window.removeEventListener('resize', size); };
    (function tick(t) {
      rafId = requestAnimationFrame(tick);
      if (document.hidden || busy || t - last < 32) return;   // ~30 images/s, et rien pendant la lecture d'un film
      last = t; ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#fff';
      for (var i = 0; i < fl.length; i++) {
        var f = fl[i]; f.y += f.v; f.s += .018; f.x += Math.sin(f.s) * .55;
        if (f.y > H + 6) { fl[i] = mk(false); continue; }
        ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832); ctx.fill();
      }
    })(0);
  }

  function pass(el, frames, opts, firstMs, gapFn) {
    if (!el.animate) return;
    (function run() {
      if (!root) return;
      if (!document.hidden && !busy) { el.style.opacity = '1'; var a = el.animate(frames(), opts); a.onfinish = function () { el.style.opacity = '0'; }; }
      later(run, gapFn());
    })();
  }

  function buildNoel() {
    var tv = isTV(), still = tv || reduced();
    root.appendChild(buildLights());
    if (!still) buildSnow();
    root.appendChild(div('dc-ground'));

    var L = div('dc-cluster dc-left');
    L.appendChild(div('dc-elf dc-bob', SVG.elf));
    L.appendChild(div('dc-tree', SVG.tree));
    L.appendChild(div('dc-giftA', gift('#d62828', '#ffd93b')));
    L.appendChild(div('dc-giftB', gift('#2e86de', '#fff')));
    L.appendChild(div('dc-santa dc-bob b2', SVG.santa));
    L.appendChild(div('dc-cane', SVG.cane));
    root.appendChild(L);

    var R = div('dc-cluster dc-right');
    R.appendChild(div('dc-cane', SVG.cane));
    R.appendChild(div('dc-giftC', gift('#27ae60', '#ffd93b')));
    R.appendChild(div('dc-queen dc-bob', SVG.queen));
    R.appendChild(div('dc-snowman dc-bob b2', SVG.snowman));
    R.appendChild(div('dc-giftA', gift('#8e44ad', '#fff')));
    R.appendChild(div('dc-giftB', gift('#d62828', '#ffd93b')));
    root.appendChild(R);

    if (!still) {
      var sl = div('dc-sleigh', SVG.sleigh); root.appendChild(sl);
      var W1 = function () { return window.innerWidth; };
      pass(sl, function () { return [{ transform: 'translate(-300px,6px)' }, { transform: 'translate(' + (W1() * .5) + 'px,-16px)' }, { transform: 'translate(' + (W1() + 40) + 'px,4px)' }]; }, { duration: 17000, easing: 'linear' }, 5000, function () { return rnd(45000, 80000); });

      var tr = div('dc-train', SVG.train); root.appendChild(tr);
      pass(tr, function () { return [{ transform: 'translateX(' + (W1() + 40) + 'px)' }, { transform: 'translateX(-420px)' }]; }, { duration: 24000, easing: 'linear' }, 20000, function () { return rnd(70000, 110000); });
    }

    var logo = document.querySelector('.logo');
    if (logo) logo.appendChild(div('dc-hat', SVG.hat));
  }

  /* ====================== FÊTES DISPONIBLES ====================== */
  var THEMES = {
    halloween: { label: 'Halloween', emoji: '🎃', ready: true },
    noel:      { label: 'Noël', emoji: '🎄', build: buildNoel },
    paques:    { label: 'Pâques', emoji: '🐰' },
    valentin:  { label: 'Saint-Valentin', emoji: '💘' },
    nouvelan:  { label: 'Nouvel an', emoji: '🎆' }
  };

  function clear() {
    timers.forEach(clearTimeout); timers = [];
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (root) { var c = root.querySelector('canvas'); if (c && c._off) c._off(); root.remove(); root = null; }
    var h = document.querySelector('.dc-hat'); if (h) h.remove();
  }
  function setHeaderVar() { var h = document.querySelector('header'); if (h) de.style.setProperty('--dc-h', h.offsetHeight + 'px'); }

  function syncHalloween() {
    var H = window.LK10Halloween; if (!H) return;
    try { if (ctl === null) H.auto(); else if (ctl === 'halloween') H.enable(); else H.disable(); } catch (e) { console.warn('lk10-deco/halloween', e); }
  }
  function effective() {
    if (ctl !== null) return ctl;
    var H = window.LK10Halloween;
    return (H && H.active && H.active()) ? 'halloween' : '';
  }
  function apply(t) {
    if (t !== null && t !== '' && !THEMES[t]) t = null;
    clear(); ctl = t; theme = t || '';
    if (t === null) de.removeAttribute('data-deco'); else de.setAttribute('data-deco', t === '' ? 'none' : t);
    if (theme && THEMES[theme].build) {
      setHeaderVar();
      root = document.createElement('div'); root.id = 'lk10-deco-root'; document.body.appendChild(root);
      try { THEMES[theme].build(); } catch (e) { console.warn('lk10-deco', e); }
    }
    syncHalloween();
    syncModal();
    try { document.dispatchEvent(new CustomEvent('lk10deco', { detail: { theme: t } })); } catch (e) {}
  }
  /* mémorisé pour l'affichage immédiat au prochain chargement : rien = pas choisi, 'none' = aucune déco */
  function remember(t) { try { if (t === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, t === '' ? 'none' : t); } catch (e) {} }
  window.LK10Deco = { get: function () { return ctl; }, set: function (t) { remember(t); apply(t); } };

  /* Pause de la neige quand un film / une bande-annonce est ouvert */
  busyTimer = setInterval(function () {
    var o = $('player-overlay'), t = $('trailer-overlay');
    busy = !!((o && getComputedStyle(o).display !== 'none') || (t && getComputedStyle(t).display !== 'none'));
  }, 1000);
  window.addEventListener('resize', function () { setHeaderVar(); });

  /* ====================== LECTURE DU RÉGLAGE (tout le monde) ====================== */
  function api(p, o) { return fetch(API_URL + p, o).then(function (r) { return r.json(); }); }
  function pull() {
    api('/api/deco').then(function (d) {
      if (!d || !d.success) return;
      var t = (d.theme === null || d.theme === undefined) ? null : d.theme;   // null = l'admin n'a encore rien choisi
      remember(t);
      if (t !== ctl) apply(t);
    }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) pull(); });
  setInterval(pull, 5 * 60 * 1000);

  /* ====================== BOUTON ADMIN « DÉCO » ====================== */
  var modal = null, statusEl = null;
  function setStatus(msg, err) { if (statusEl) { statusEl.textContent = msg || ''; statusEl.className = 'dc-status' + (err ? ' err' : ''); } }
  function syncModal() {
    if (!modal) return;
    var eff = effective();
    modal.querySelectorAll('.dc-opt[data-t]').forEach(function (b) {
      var k = b.dataset.t, on = k === eff; b.classList.toggle('on', on);
      var sm = b.querySelector('small'); if (!sm) return;
      var T = THEMES[k], ready = !!(T.build || T.ready);
      sm.textContent = on ? (ctl === null ? 'Actif (automatique)' : 'Activée pour tout le monde') : (ready ? 'Cliquer pour activer' : 'Bientôt (menu prêt)');
    });
    var off = modal.querySelector('.dc-off'); if (off) off.classList.toggle('on', eff === '');
  }
  function choose(t) {
    if (t === effective()) t = '';                               // re-clic sur la fête active = on enlève tout
    var token = '';
    try { token = localStorage.getItem('monBadgeCineLK10') || ''; } catch (e) {}
    setStatus('Enregistrement…');
    api('/api/admin/deco', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: token }, body: JSON.stringify({ theme: t }) })
      .then(function (d) {
        if (d && d.success) { window.LK10Deco.set(d.theme || ''); setStatus(d.theme ? 'Déco « ' + THEMES[d.theme].label + ' » activée pour tout le monde ✔' : 'Toutes les déco sont enlevées ✔'); }
        else setStatus((d && d.message) || 'Erreur (es-tu bien connecté en admin ?)', true);
      }).catch(function () { setStatus('Erreur de connexion au serveur.', true); });
  }
  function buildModal() {
    modal = div('', ''); modal.id = 'dc-modal';
    var opts = Object.keys(THEMES).map(function (k) {
      return '<button class="dc-opt" data-t="' + k + '"><span>' + THEMES[k].emoji + '</span><div>' + THEMES[k].label + '<small></small></div></button>';
    }).join('');
    modal.innerHTML = '<div class="dc-box"><button class="dc-x" aria-label="Fermer">&times;</button><h2><i class="fas fa-magic"></i> Déco du site</h2>' +
      '<p>Clique sur une fête pour décorer tout le site, pour tous les visiteurs. Clique de nouveau sur la fête active (ou « Aucune déco ») pour tout enlever.</p>' +
      '<div class="dc-grid">' + opts + '</div><button class="dc-opt dc-off"><span>🚫</span><div>Aucune déco</div></button><div class="dc-status"></div></div>';
    document.body.appendChild(modal);
    statusEl = modal.querySelector('.dc-status');
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('.dc-x')) { modal.classList.remove('open'); return; }
      var b = e.target.closest('.dc-opt'); if (!b) return;
      choose(b.dataset.t || '');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') modal.classList.remove('open'); });
    syncModal();
  }
  function addAdminButton() {
    if ($('deco-btn-header')) return;
    var host = document.querySelector('.header-right'); if (!host) return;
    var b = document.createElement('button');
    b.id = 'deco-btn-header'; b.className = 'deco-btn-header admin-btn'; b.title = 'Déco des fêtes';
    b.innerHTML = '<i class="fas fa-magic"></i>';
    b.onclick = function (e) { if (e) e.stopPropagation(); if (!modal) buildModal(); setStatus(''); syncModal(); modal.classList.add('open'); };
    var ref = host.querySelector('.analytics-btn-header') || host.querySelector('.add-btn-header');
    if (ref) host.insertBefore(b, ref); else host.appendChild(b);
  }

  /* ====================== DÉMARRAGE ====================== */
  addAdminButton();
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  saved = saved === 'none' ? '' : (saved && THEMES[saved] ? saved : null);
  apply(saved);          // on applique tout de suite la dernière déco connue (pas de clignotement), puis on vérifie auprès du serveur
  pull();
})();
