/* Ciné LK10 — lk10-halloween.js : décorations d'Halloween (toiles d'araignée, araignées qui se balancent,
   chauves-souris, citrouilles qui brillent, petit fantôme, braises, lueur orangée / violette).
   • Tout est dessiné en SVG + CSS : aucune image à héberger, aucun clic bloqué (pointer-events: none).
   • Automatique du 1er octobre au 2 novembre ; en dehors, rien ne s'affiche (ALWAYS = true pour le garder toute l'année).
   • Le visiteur peut tout couper en cliquant sur la citrouille (en bas à gauche) ; son choix est mémorisé.
   • Lien magique : ?halloween=1 (forcer l'affichage) / ?halloween=0 (le couper).
   • Allégé automatiquement : sur télé (toiles + citrouilles fixes seulement), en mode « lite », et si l'appareil
     demande moins d'animations.
   À ajouter dans index.html, juste avant </body> (après lk10-tv-fix.js) :  <script src="lk10-halloween.js"></script> */
(function () {
  'use strict';

  /* ---------- Réglages ---------- */
  var ALWAYS = false;            // true = décorations toute l'année
  var SEASON = [9, 1, 10, 2];    // [mois début, jour début, mois fin, jour fin] (mois : 0 = janvier ... 9 = octobre, 10 = novembre)
  var BATS_EVERY = 12000;        // une chauve-souris traverse l'écran toutes les ~12 secondes
  var EMBERS = 10;               // nombre de braises qui montent (réduit sur mobile)

  var de = document.documentElement;
  var KEY = 'lk10_hw';
  var ls = null; try { ls = window.localStorage; } catch (e) {}
  var get = function (k) { try { return ls && ls.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { ls && ls.setItem(k, v); } catch (e) {} };

  /* ?halloween=1 / 0 */
  try {
    var q = new URLSearchParams(location.search).get('halloween');
    if (q === '1' || q === '0') set(KEY, q);
  } catch (e) {}

  function inSeason() {
    if (ALWAYS) return true;
    var d = new Date(), t = d.getMonth() * 100 + d.getDate(), a = SEASON[0] * 100 + SEASON[1], b = SEASON[2] * 100 + SEASON[3];
    return a <= b ? (t >= a && t <= b) : (t >= a || t <= b);
  }
  var pref = get(KEY);                                   // '1' = forcé, '0' = coupé par le visiteur, null = automatique
  var on = pref === '1' ? true : pref === '0' ? false : inSeason();
  if (!on && pref !== '0') return;                       // hors saison et rien de forcé : on n'ajoute rien du tout
  /* (si le visiteur l'a coupé en pleine saison, on garde la petite citrouille pour le rallumer) */

  var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- Dessins SVG ---------- */
  /* Toile d'araignée dans un coin (point d'ancrage en haut à gauche) */
  function web(size) {
    var R = 7, K = 6, i, k, d = '', a = [];
    for (i = 0; i < R; i++) a.push((Math.PI / 2) * (i / (R - 1)));
    for (i = 0; i < R; i++) d += 'M0 0L' + (size * Math.cos(a[i])).toFixed(1) + ' ' + (size * Math.sin(a[i])).toFixed(1);
    for (k = 1; k <= K; k++) {
      var r = size * (k / K) * (0.96 + 0.04 * ((k * 7) % 3) / 2);
      for (i = 0; i < R - 1; i++) {
        var x1 = r * Math.cos(a[i]), y1 = r * Math.sin(a[i]), x2 = r * Math.cos(a[i + 1]), y2 = r * Math.sin(a[i + 1]);
        var am = (a[i] + a[i + 1]) / 2, c = r * 0.8;                       // le fil se creuse vers le centre
        d += 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'Q' + (c * Math.cos(am)).toFixed(1) + ' ' + (c * Math.sin(am)).toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
      }
    }
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg"><path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1" stroke-linecap="round"/></svg>';
  }
  var SPIDER = '<svg viewBox="0 0 40 38" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#c9b3ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M14 18L5 11L2 17M14 22L4 22L1 29M15 26L7 33L8 37M16 28L12 36"/><path d="M26 18L35 11L38 17M26 22L36 22L39 29M25 26L33 33L32 37M24 28L28 36"/></g>' +
    '<ellipse cx="20" cy="24" rx="8" ry="9.5" fill="#3b2a63" stroke="#c9b3ff" stroke-width="1.2"/><circle cx="20" cy="12.5" r="5.2" fill="#3b2a63" stroke="#c9b3ff" stroke-width="1.2"/>' +
    '<circle cx="18" cy="12" r="1.3" fill="#ff4d4d"/><circle cx="22" cy="12" r="1.3" fill="#ff4d4d"/><ellipse cx="20" cy="25" rx="3.2" ry="4.6" fill="#ff9a3c" opacity=".85"/></svg>';
  var BAT = '<svg viewBox="0 0 64 30" xmlns="http://www.w3.org/2000/svg"><path d="M32 9l-3-6 2 4h2l2-4-3 6zM32 9c-2 0-3 3-4 5-4-4-9-6-16-6 3 3 4 6 4 9-3-1-6-1-10 1 5 1 8 3 10 6 3-2 6-3 9-1 2-2 4-3 7-3s5 1 7 3c3-2 6-1 9 1 2-3 5-5 10-6-4-2-7-2-10-1 0-3 1-6 4-9-7 0-12 2-16 6-1-2-2-5-4-5z" fill="#1c1130" stroke="#ff9a3c" stroke-width="1" stroke-linejoin="round"/></svg>';
  function pumpkin(cls) {
    return '<svg class="' + cls + '" viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M38 12c0-6 3-9 8-10" fill="none" stroke="#4d8a2b" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse cx="22" cy="42" rx="19" ry="24" fill="#e8620c"/><ellipse cx="58" cy="42" rx="19" ry="24" fill="#e8620c"/>' +
      '<ellipse cx="40" cy="42" rx="22" ry="26" fill="#ff8a1f"/><path d="M40 16v52M26 20c-6 10-6 36 0 46M54 20c6 10 6 36 0 46" fill="none" stroke="#c24d05" stroke-width="2" opacity=".55"/>' +
      '<path d="M22 36l9-9 7 11zM58 36l-9-9-7 11z" fill="#ffe27a"/><path d="M40 44l-4 7h8z" fill="#ffe27a"/>' +
      '<path d="M22 54c4 8 9 4 12 9 3-6 9-4 12 0 3-5 8-1 12-9-5 3-9 0-12 4-3-5-9-5-12 0-3-4-8-2-12-4z" fill="#ffe27a"/></svg>';
  }
  var GHOST = '<svg viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg"><path d="M25 3C13 3 5 12 5 24v31l7-6 6 6 7-6 7 6 6-6 7 6V24C45 12 37 3 25 3z" fill="#fff"/>' +
    '<ellipse cx="18" cy="24" rx="3.4" ry="5" fill="#2a1b4d"/><ellipse cx="32" cy="24" rx="3.4" ry="5" fill="#2a1b4d"/><ellipse cx="25" cy="36" rx="3" ry="4" fill="#2a1b4d"/></svg>';

  /* ---------- CSS ---------- */
  var st = document.createElement('style'); st.id = 'hw-css';
  st.textContent =
    '#hw-root{position:fixed;inset:0;pointer-events:none;z-index:998;overflow:hidden;--hw-top:70px}' +
    '.hw-vg{position:absolute;inset:0;background:radial-gradient(ellipse at 0 0,rgba(255,140,30,.11),transparent 42%),radial-gradient(ellipse at 100% 0,rgba(130,70,220,.11),transparent 42%)}' +
    '.hw-web{position:absolute;top:var(--hw-top);width:min(220px,26vw);filter:drop-shadow(0 0 3px rgba(255,255,255,.18))}' +
    '.hw-web svg{display:block;width:100%;height:auto}' +
    '.hw-web.l{left:0}.hw-web.r{right:0;transform:scaleX(-1)}' +
    '.hw-sp{position:absolute;top:var(--hw-top);width:0;transform-origin:50% 0;animation:hwSwing 4.4s ease-in-out infinite}' +
    '.hw-th{width:1px;margin-left:-.5px;height:var(--len);background:rgba(255,255,255,.5);animation:hwBob 8s ease-in-out infinite}' +
    '.hw-sp svg{display:block;width:30px;margin-left:-15px;filter:drop-shadow(0 0 4px rgba(150,100,255,.6))}' +
    '.hw-pk{position:absolute;left:8px;bottom:8px;pointer-events:auto;background:none;border:0;padding:0;cursor:pointer;display:flex;align-items:flex-end;touch-action:manipulation;-webkit-tap-highlight-color:transparent}' +
    '.hw-pk svg{display:block;animation:hwGlow 2.6s ease-in-out infinite alternate}' +
    '.hw-pk .big{width:70px}.hw-pk .small{width:44px;margin-left:-14px;animation-delay:-1.1s}' +
    '.hw-gh{position:absolute;left:96px;bottom:30px;width:40px;opacity:.88;filter:drop-shadow(0 0 8px rgba(255,255,255,.7));animation:hwFloat 5.5s ease-in-out infinite}' +
    '.hw-gh svg{display:block;width:100%}' +
    '.hw-bat{position:absolute;top:var(--y);left:0;width:var(--w);will-change:transform}' +
    '.hw-bat.r{animation:hwFlyR var(--d) linear forwards}.hw-bat.l{animation:hwFlyL var(--d) linear forwards}' +
    '.hw-bat>div{animation:hwWob 1.6s ease-in-out infinite}' +
    '.hw-bat svg{display:block;width:100%;animation:hwFlap .26s ease-in-out infinite alternate;transform-origin:50% 40%}' +
        '.hw-em{position:absolute;bottom:-12px;left:var(--x);width:4px;height:4px;border-radius:50%;background:#ffb04a;box-shadow:0 0 8px 2px rgba(255,150,30,.75);opacity:0;animation:hwEm var(--d) linear infinite;animation-delay:var(--dl)}' +
    '@keyframes hwSwing{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}' +
    '@keyframes hwBob{0%,100%{height:var(--len)}50%{height:calc(var(--len) + 46px)}}' +
    '@keyframes hwGlow{from{filter:drop-shadow(0 0 4px rgba(255,140,30,.55))}to{filter:drop-shadow(0 0 16px rgba(255,180,40,.95))}}' +
    '@keyframes hwFloat{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-14px) rotate(4deg)}}' +
    '@keyframes hwFlyR{from{transform:translateX(-120px)}to{transform:translateX(calc(100vw + 120px))}}' +
    '@keyframes hwFlyL{from{transform:translateX(calc(100vw + 120px))}to{transform:translateX(-120px)}}' +
    '@keyframes hwWob{0%,100%{transform:translateY(0)}50%{transform:translateY(-22px)}}' +
    '@keyframes hwFlap{from{transform:scaleY(1)}to{transform:scaleY(.5)}}' +
    '@keyframes hwEm{0%{transform:translate(0,0);opacity:0}12%{opacity:.9}100%{transform:translate(var(--dx),-105vh);opacity:0}}' +
    /* petite citrouille seule quand le visiteur a coupé la déco */
    '#hw-root.off>*:not(.hw-pk){display:none}#hw-root.off .hw-pk{opacity:.4}#hw-root.off .hw-pk .big{width:30px}#hw-root.off .hw-pk .small{display:none}#hw-root.off .hw-pk svg{animation:none}' +
    /* mobile */
    '@media(max-width:700px){.hw-web{width:min(150px,34vw)}.hw-pk .big{width:52px}.hw-pk .small{width:32px}.hw-gh{left:70px;bottom:20px;width:32px}.hw-sp svg{width:24px;margin-left:-12px}#hw-root.off .hw-pk .big{width:26px}}' +
    /* télé / mode lite / mouvement réduit : décor fixe (toiles + citrouilles), sans animation ni effets */
    'html.lk10-tv #hw-root .hw-vg,html.lk10-tv #hw-root .hw-sp,html.lk10-tv #hw-root .hw-gh,html.lk10-tv #hw-root .hw-bat,html.lk10-tv #hw-root .hw-em,' +
    'html.fx-lite #hw-root .hw-bat,html.fx-lite #hw-root .hw-em,html.fx-lite #hw-root .hw-vg{display:none!important}' +
    'html.lk10-tv #hw-root *{animation:none!important;filter:none!important}' +
    '@media(prefers-reduced-motion:reduce){#hw-root *{animation:none!important}#hw-root .hw-bat,#hw-root .hw-em{display:none!important}}';
  document.head.appendChild(st);

  /* ---------- Construction ---------- */
  var root = document.createElement('div'); root.id = 'hw-root'; root.setAttribute('aria-hidden', 'true');
  var h = '<div class="hw-vg"></div>' +
    '<div class="hw-web l">' + web(220) + '</div><div class="hw-web r">' + web(220) + '</div>' +
    '<div class="hw-sp" style="left:7%;--len:46px"><div class="hw-th"></div>' + SPIDER + '</div>' +
    '<div class="hw-sp" style="left:91%;--len:30px;animation-delay:-2s"><div class="hw-th" style="animation-delay:-3s"></div>' + SPIDER + '</div>' +
    '<div class="hw-gh">' + GHOST + '</div>' +
    '<button type="button" class="hw-pk" id="hw-toggle" title="Couper / remettre la déco Halloween" aria-label="Couper ou remettre la déco Halloween">' + pumpkin('big') + pumpkin('small') + '</button>';
  var n = window.innerWidth < 700 ? Math.ceil(EMBERS / 2) : EMBERS;
  for (var i = 0; i < n; i++) {
    h += '<span class="hw-em" style="--x:' + Math.round(Math.random() * 100) + '%;--d:' + (9 + Math.random() * 9).toFixed(1) + 's;--dl:-' + (Math.random() * 12).toFixed(1) + 's;--dx:' + Math.round(-60 + Math.random() * 120) + 'px"></span>';
  }
  root.innerHTML = h;
  if (!on) root.classList.add('off');
  document.body.appendChild(root);

  /* Les toiles et araignées se posent juste sous l'en-tête du site (sticky), quelle que soit sa hauteur */
  function place() {
    var hd = document.querySelector('header'), b = hd ? Math.round(hd.getBoundingClientRect().bottom) : 70;
    root.style.setProperty('--hw-top', Math.max(0, Math.min(b, 120)) + 'px');
  }
  place(); window.addEventListener('resize', place); window.addEventListener('load', place);

  /* Bouton citrouille : coupe / rallume (mémorisé) */
  document.getElementById('hw-toggle').onclick = function () {
    on = !on; root.classList.toggle('off', !on); set(KEY, on ? '1' : '0');
  };

  /* Chauves-souris : une de temps en temps (3 d'un coup de temps à autre) */
  function bat(delay) {
    setTimeout(function () {
      if (!on || document.hidden) return;
      var dir = Math.random() < 0.5 ? 'r' : 'l', w = 34 + Math.round(Math.random() * 30), d = (7 + Math.random() * 6).toFixed(1);
      var el = document.createElement('div'); el.className = 'hw-bat ' + dir;
      el.style.cssText = '--y:' + (Math.round(10 + Math.random() * 35)) + 'vh;--w:' + w + 'px;--d:' + d + 's';
      el.innerHTML = '<div><i style="display:block;' + (dir === 'l' ? 'transform:scaleX(-1)' : '') + '">' + BAT + '</i></div>';
      el.addEventListener('animationend', function (e) { if (e.target === el) el.remove(); });
      root.appendChild(el);
    }, delay);
  }
  function wave() {
    if (reduce || de.classList.contains('lk10-tv') || de.classList.contains('fx-lite')) return;
    var k = Math.random() < 0.25 ? 3 : 1;
    for (var j = 0; j < k; j++) bat(j * 700);
  }
  if (!reduce) { setTimeout(wave, 2500); setInterval(wave, BATS_EVERY); }
})();
