/* Ciné LK10 — lk10-halloween.js : décorations d'Halloween (toiles d'araignée collées en haut de l'écran, araignées qui se
   balancent, chauves-souris qui battent des ailes, citrouilles qui brillent, fantôme, braises, lueur orangée / violette,
   cimetière avec pierres tombales, mains de zombies qui sortent de terre et zombies qui marchent).
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
  /* Chauve-souris : corps + deux ailes séparées qui battent (rotation autour des épaules) */
  var WING = 'M56 29C47 15 28 10 3 17C9 21 11 27 10 33C15 29 21 29 24 35C28 30 34 31 37 38C41 34 47 35 52 41Z';
  var BAT = '<svg viewBox="0 0 120 56" xmlns="http://www.w3.org/2000/svg"><g fill="#2a1650" stroke="#ff9a3c" stroke-width="1.1" stroke-linejoin="round">' +
    '<g class="wl"><path d="' + WING + '"/></g><g transform="translate(120 0) scale(-1 1)"><g class="wl"><path d="' + WING + '"/></g></g>' +
    '<ellipse cx="60" cy="34" rx="6.5" ry="11"/><circle cx="60" cy="21" r="6.5"/><path d="M54.5 18L53 8l6 6zM65.5 18L67 8l-6 6z"/></g>' +
    '<circle cx="57.6" cy="21" r="1.4" fill="#ff4d4d"/><circle cx="62.4" cy="21" r="1.4" fill="#ff4d4d"/></svg>';
  function pumpkin(cls) {
    return '<svg class="' + cls + '" viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M38 12c0-6 3-9 8-10" fill="none" stroke="#4d8a2b" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse cx="22" cy="42" rx="19" ry="24" fill="#e8620c"/><ellipse cx="58" cy="42" rx="19" ry="24" fill="#e8620c"/>' +
      '<ellipse cx="40" cy="42" rx="22" ry="26" fill="#ff8a1f"/><path d="M40 16v52M26 20c-6 10-6 36 0 46M54 20c6 10 6 36 0 46" fill="none" stroke="#c24d05" stroke-width="2" opacity=".55"/>' +
      '<path d="M22 36l9-9 7 11zM58 36l-9-9-7 11z" fill="#ffe27a"/><path d="M40 44l-4 7h8z" fill="#ffe27a"/>' +
      '<path d="M22 54c4 8 9 4 12 9 3-6 9-4 12 0 3-5 8-1 12-9-5 3-9 0-12 4-3-5-9-5-12 0-3-4-8-2-12-4z" fill="#ffe27a"/></svg>';
  }
  /* Pierres tombales (4 modèles) */
  function tomb(k) {
    var o = 'stroke="#2b2b3a" stroke-width="2" stroke-linejoin="round"', moss = '<path d="M4 70q6-8 12-3 6-9 14-2 8-6 16 3V70z" fill="#3d6b2c" opacity=".85"/>';
    var body = [
      '<path d="M4 70V24A21 21 0 0 1 46 24V70z" fill="#5d5d72" ' + o + '/><path d="M4 70V24A21 21 0 0 1 14 7V70z" fill="#7a7a94" opacity=".45"/><text x="25" y="35" font-family="Arial,sans-serif" font-size="13" font-weight="900" fill="#2b2b3a" text-anchor="middle">RIP</text><path d="M14 42h22M18 48h14" stroke="#2b2b3a" stroke-width="1.4" opacity=".6"/>',
      '<path d="M5 70V30l9-6 5 7 8-11 6 9 12-4V70z" fill="#5a5a6e" ' + o + '/><path d="M24 32l-3 10 5 6-4 12" fill="none" stroke="#2b2b3a" stroke-width="1.6"/><text x="25" y="52" font-family="Arial,sans-serif" font-size="9" font-weight="900" fill="#2b2b3a" text-anchor="middle" opacity=".85">R.I.P</text>',
      '<g transform="rotate(-7 25 70)"><rect x="7" y="12" width="36" height="58" rx="5" fill="#666680" ' + o + '/><text x="25" y="34" font-family="Arial,sans-serif" font-size="12" font-weight="900" fill="#2b2b3a" text-anchor="middle">RIP</text><path d="M13 42h24M13 48h24M13 54h24" stroke="#2b2b3a" stroke-width="1.2" opacity=".5"/></g>',
      '<path d="M4 70V24A21 21 0 0 1 46 24V70z" fill="#55556a" ' + o + '/><circle cx="25" cy="30" r="9" fill="#dcdce6"/><rect x="19" y="36" width="12" height="7" rx="2" fill="#dcdce6"/><ellipse cx="21.5" cy="30" rx="2.6" ry="3.2" fill="#1a1a24"/><ellipse cx="28.5" cy="30" rx="2.6" ry="3.2" fill="#1a1a24"/><path d="M25 34l-1.4 3h2.8zM21.5 40v3M25 40v3M28.5 40v3" stroke="#1a1a24" stroke-width="1" fill="#1a1a24"/>'
    ][k % 4];
    return '<svg viewBox="0 0 50 72" xmlns="http://www.w3.org/2000/svg">' + body + moss + '</svg>';
  }
  /* Main de zombie qui sort de terre */
  var HAND = (function () {
    var f = '', xs = [8, 12.2, 16.4, 20.6], as = [-20, -7, 6, 19], i;
    for (i = 0; i < 4; i++) f += '<rect x="' + xs[i] + '" y="6" width="3.8" height="16" rx="1.9" transform="rotate(' + as[i] + ' ' + (xs[i] + 1.9) + ' 24)" fill="#8fbf6a" stroke="#4d7a36" stroke-width=".8"/>';
    return '<svg viewBox="0 0 32 70" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M10 70L12 30h9l2 40z" fill="#8fbf6a" stroke="#4d7a36" stroke-width="1"/><path d="M11 42l10 3M11.5 52l9.5-2" stroke="#4d7a36" stroke-width="1" opacity=".7"/>' + f +
      '<ellipse cx="16.5" cy="25" rx="8.5" ry="8" fill="#8fbf6a" stroke="#4d7a36" stroke-width="1"/><rect x="3" y="22" width="3.8" height="13" rx="1.9" transform="rotate(-48 5 33)" fill="#8fbf6a" stroke="#4d7a36" stroke-width=".8"/>' +
      '<ellipse cx="16" cy="68" rx="15" ry="4" fill="#33241a"/></svg>';
  })();
  /* Zombie qui marche (tourné vers la droite) : jambes qui se balancent, bras tendus */
  var ZOMBIE = '<svg viewBox="0 0 84 112" xmlns="http://www.w3.org/2000/svg">' +
    '<g class="zl2"><rect x="38" y="72" width="9" height="31" rx="3.5" fill="#2e2e45"/><rect x="36" y="100" width="15" height="7" rx="3" fill="#1b1b24"/></g>' +
    '<rect x="33" y="43" width="42" height="7" rx="3.5" fill="#79a85a" stroke="#4d7a36" stroke-width="1"/><circle cx="76" cy="46.5" r="4.6" fill="#79a85a" stroke="#4d7a36" stroke-width="1"/>' +
    '<path d="M25 30H47V70L43 74L39 69L35 75L31 69L25 74z" fill="#4f6ea8" stroke="#2d3f6b" stroke-width="1.4" stroke-linejoin="round"/><path d="M27 44l5 2-4 3M40 55l4 2-5 3" stroke="#2d3f6b" stroke-width="1.2" fill="none"/>' +
    '<g class="zl1"><rect x="29" y="72" width="9" height="31" rx="3.5" fill="#3b3b58"/><rect x="26" y="100" width="15" height="7" rx="3" fill="#1b1b24"/></g>' +
    '<rect x="33" y="33" width="42" height="7" rx="3.5" fill="#8fbf6a" stroke="#4d7a36" stroke-width="1"/><rect x="33" y="31.5" width="12" height="10" rx="3" fill="#4f6ea8" stroke="#2d3f6b" stroke-width="1"/><circle cx="76" cy="36.5" r="4.6" fill="#8fbf6a" stroke="#4d7a36" stroke-width="1"/>' +
    '<circle cx="36" cy="18" r="11.5" fill="#8fbf6a" stroke="#4d7a36" stroke-width="1.2"/><path d="M25 12q4-10 11-7 6-3 11 7-6-4-11-2-6-3-11 2z" fill="#3b2d22"/>' +
    '<circle cx="32" cy="17" r="3.6" fill="#fff"/><circle cx="41" cy="16" r="2.8" fill="#fff"/><circle cx="33.2" cy="17.2" r="1.6" fill="#1a1a1a"/><circle cx="42" cy="16.2" r="1.3" fill="#1a1a1a"/>' +
    '<path d="M29 25q3.5 3.5 7 0 3.5 3.5 7 0" fill="none" stroke="#3a2020" stroke-width="1.5" stroke-linecap="round"/><path d="M38 6l3 7M37 8l4-1M38.5 11l3.5-1" stroke="#5b3a3a" stroke-width="1.1"/></svg>';

  var GHOST = '<svg viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg"><path d="M25 3C13 3 5 12 5 24v31l7-6 6 6 7-6 7 6 6-6 7 6V24C45 12 37 3 25 3z" fill="#fff"/>' +
    '<ellipse cx="18" cy="24" rx="3.4" ry="5" fill="#2a1b4d"/><ellipse cx="32" cy="24" rx="3.4" ry="5" fill="#2a1b4d"/><ellipse cx="25" cy="36" rx="3" ry="4" fill="#2a1b4d"/></svg>';

  /* ---------- CSS ---------- */
  var st = document.createElement('style'); st.id = 'hw-css';
  st.textContent =
    /* calque du haut : toiles + araignées collées en haut de l'écran, AU-DESSUS de l'en-tête (mais sous le lecteur, les fenêtres...) */
    '#hw-top{position:fixed;top:0;left:0;right:0;height:0;z-index:1100;pointer-events:none}' +
    '.hw-web{position:absolute;top:0;width:min(180px,24vw);opacity:.6;filter:drop-shadow(0 0 3px rgba(255,255,255,.25))}' +
    '.hw-web svg{display:block;width:100%;height:auto}' +
    '.hw-web.l{left:0}.hw-web.r{right:0;transform:scaleX(-1)}' +
    '.hw-sp{position:absolute;top:0;width:0;transform-origin:50% 0;animation:hwSwing 4.4s ease-in-out infinite}' +
    '.hw-th{width:1px;margin-left:-.5px;height:var(--len);background:rgba(255,255,255,.55);animation:hwBob 8s ease-in-out infinite}' +
    '.hw-sp svg{display:block;width:30px;margin-left:-15px;filter:drop-shadow(0 0 4px rgba(150,100,255,.7))}' +
    /* calque du reste */
    '#hw-root{position:fixed;inset:0;pointer-events:none;z-index:998;overflow:hidden}' +
    '.hw-vg{position:absolute;inset:0;background:radial-gradient(ellipse at 0 0,rgba(255,140,30,.11),transparent 42%),radial-gradient(ellipse at 100% 0,rgba(130,70,220,.11),transparent 42%)}' +
    '.hw-pk{position:absolute;left:8px;bottom:8px;pointer-events:auto;background:none;border:0;padding:0;cursor:pointer;display:flex;align-items:flex-end;touch-action:manipulation;-webkit-tap-highlight-color:transparent}' +
    '.hw-pk svg{display:block;animation:hwGlow 2.6s ease-in-out infinite alternate}' +
    '.hw-pk .big{width:70px}.hw-pk .small{width:44px;margin-left:-14px;animation-delay:-1.1s}' +
    '.hw-gh{position:absolute;left:62px;bottom:84px;width:40px;opacity:.88;filter:drop-shadow(0 0 8px rgba(255,255,255,.7));animation:hwFloat 5.5s ease-in-out infinite}' +
    '.hw-gh svg{display:block;width:100%}' +
    '.hw-cn{position:absolute;bottom:6px;display:block}.hw-cn svg{display:block;width:100%}' +
    '.hw-cn.t{left:128px;width:44px}.hw-cn.h{left:170px;width:24px;bottom:-6px;animation:hwRise 6s ease-in-out infinite}' +
    /* chauves-souris */
    '.hw-bat{position:absolute;top:var(--y);left:0;width:var(--w);will-change:transform}' +
    '.hw-bat.r{animation:hwFlyR var(--d) linear forwards}.hw-bat.l{animation:hwFlyL var(--d) linear forwards}' +
    '.hw-bat>div{animation:hwWob 1.9s ease-in-out infinite}' +
    '.hw-bat svg{display:block;width:100%;overflow:visible;filter:drop-shadow(0 0 5px rgba(255,140,30,.8))}' +
    '.hw-bat .wl{transform-box:view-box;transform-origin:56px 29px;animation:hwWing .24s ease-in-out infinite alternate}' +
    '.hw-em{position:absolute;bottom:-12px;left:var(--x);width:4px;height:4px;border-radius:50%;background:#ffb04a;box-shadow:0 0 8px 2px rgba(255,150,30,.75);opacity:0;animation:hwEm var(--d) linear infinite;animation-delay:var(--dl)}' +
    /* cimetière (dans la page, juste au-dessus du pied de page) */
    '#hw-yard{position:relative;height:150px;margin-top:34px;overflow:hidden;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(60,25,80,.28))}' +
    '#hw-yard .hw-gnd{position:absolute;left:0;right:0;bottom:0;height:22px;background:linear-gradient(180deg,#25361d,#120d18);z-index:5;box-shadow:0 -6px 14px rgba(0,0,0,.5)}' +
    '#hw-yard .hw-gnd::before{content:"";position:absolute;left:0;right:0;top:-7px;height:8px;background:repeating-linear-gradient(90deg,transparent 0 5px,#25361d 5px 7px,transparent 7px 12px);clip-path:polygon(0 100%,4% 20%,8% 100%,13% 10%,18% 100%,24% 30%,30% 100%,36% 0,42% 100%,48% 25%,54% 100%,60% 15%,66% 100%,72% 30%,78% 100%,84% 5%,90% 100%,95% 25%,100% 100%)}' +
    '#hw-yard .hw-tb{position:absolute;bottom:14px;left:var(--x);width:var(--w);z-index:3}#hw-yard .hw-tb svg{display:block;width:100%;filter:drop-shadow(0 0 6px rgba(0,0,0,.6))}' +
    '#hw-yard .hw-hd{position:absolute;bottom:-4px;left:var(--x);width:26px;z-index:2;animation:hwRise 7s ease-in-out infinite;animation-delay:var(--dl);animation-play-state:paused}#hw-yard .hw-hd svg{display:block;width:100%}' +
    '#hw-yard .hw-zb{position:absolute;bottom:12px;left:0;width:var(--w);z-index:4;animation:hwWalk var(--d) linear infinite;animation-delay:var(--dl);animation-play-state:paused}' +
    '#hw-yard .hw-zb.l{animation-name:hwWalkL}#hw-yard .hw-zb.l>i{transform:scaleX(-1)}' +
    '#hw-yard .hw-zb>i{display:block;animation:hwZBob .8s ease-in-out infinite alternate;animation-play-state:paused}#hw-yard .hw-zb svg{display:block;width:100%;overflow:visible}' +
    '#hw-yard .zl1,#hw-yard .zl2{transform-box:view-box;transform-origin:35px 72px;animation:hwLeg .8s ease-in-out infinite alternate;animation-play-state:paused}#hw-yard .zl2{transform-origin:42px 72px;animation-direction:alternate-reverse}' +
    '#hw-yard.run .hw-hd,#hw-yard.run .hw-zb,#hw-yard.run .hw-zb>i,#hw-yard.run .zl1,#hw-yard.run .zl2{animation-play-state:running}' +
    '@keyframes hwSwing{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}' +
    '@keyframes hwBob{0%,100%{height:var(--len)}50%{height:calc(var(--len) + 46px)}}' +
    '@keyframes hwGlow{from{filter:drop-shadow(0 0 4px rgba(255,140,30,.55))}to{filter:drop-shadow(0 0 16px rgba(255,180,40,.95))}}' +
    '@keyframes hwFloat{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-14px) rotate(4deg)}}' +
    '@keyframes hwFlyR{from{transform:translateX(-140px)}to{transform:translateX(calc(100vw + 140px))}}' +
    '@keyframes hwFlyL{from{transform:translateX(calc(100vw + 140px))}to{transform:translateX(-140px)}}' +
    '@keyframes hwWob{0%,100%{transform:translateY(0)}50%{transform:translateY(-26px)}}' +
    '@keyframes hwWing{from{transform:rotate(26deg)}to{transform:rotate(-24deg)}}' +
    '@keyframes hwEm{0%{transform:translate(0,0);opacity:0}12%{opacity:.9}100%{transform:translate(var(--dx),-105vh);opacity:0}}' +
    '@keyframes hwRise{0%,30%{transform:translateY(85%)}48%,78%{transform:translateY(0)}100%{transform:translateY(85%)}}' +
    '@keyframes hwWalk{from{transform:translateX(-120px)}to{transform:translateX(calc(100vw + 120px))}}' +
    '@keyframes hwWalkL{from{transform:translateX(calc(100vw + 120px))}to{transform:translateX(-120px)}}' +
    '@keyframes hwZBob{from{transform:translateY(0) rotate(-1deg)}to{transform:translateY(-4px) rotate(2deg)}}' +
    '@keyframes hwLeg{from{transform:rotate(24deg)}to{transform:rotate(-24deg)}}' +
    /* petite citrouille seule quand le visiteur a coupé la déco */
    '#hw-root.off>*:not(.hw-pk){display:none}#hw-root.off .hw-pk{opacity:.4}#hw-root.off .hw-pk .big{width:30px}#hw-root.off .hw-pk .small{display:none}#hw-root.off .hw-pk svg{animation:none}' +
    '#hw-top.off,#hw-yard.off{display:none}' +
    /* mobile */
    '@media(max-width:700px){.hw-web{width:min(110px,30vw)}.hw-pk .big{width:52px}.hw-pk .small{width:32px}.hw-gh{left:44px;bottom:66px;width:32px}.hw-cn.t{left:94px;width:34px}.hw-cn.h{left:128px;width:20px}.hw-sp svg{width:24px;margin-left:-12px}#hw-root.off .hw-pk .big{width:26px}#hw-yard{height:120px}}' +
    /* télé / mode lite / mouvement réduit : décor fixe (toiles, citrouilles, pierres tombales), sans animation ni effets */
    'html.lk10-tv #hw-root .hw-vg,html.lk10-tv #hw-top .hw-sp,html.lk10-tv #hw-root .hw-gh,html.lk10-tv #hw-root .hw-bat,html.lk10-tv #hw-root .hw-em,html.lk10-tv #hw-yard .hw-zb,html.lk10-tv #hw-yard .hw-hd,html.lk10-tv #hw-root .hw-cn.h,' +
    'html.fx-lite #hw-root .hw-bat,html.fx-lite #hw-root .hw-em,html.fx-lite #hw-root .hw-vg{display:none!important}' +
    'html.lk10-tv #hw-root *,html.lk10-tv #hw-top *,html.lk10-tv #hw-yard *{animation:none!important;filter:none!important}' +
    '@media(prefers-reduced-motion:reduce){#hw-root *,#hw-top *,#hw-yard *{animation:none!important}#hw-root .hw-bat,#hw-root .hw-em,#hw-yard .hw-zb{display:none!important}}';
  document.head.appendChild(st);

  /* ---------- Construction ---------- */
  var top = document.createElement('div'); top.id = 'hw-top'; top.setAttribute('aria-hidden', 'true');
  top.innerHTML = '<div class="hw-web l">' + web(220) + '</div><div class="hw-web r">' + web(220) + '</div>' +
    '<div class="hw-sp" style="left:8%;--len:92px"><div class="hw-th"></div>' + SPIDER + '</div>' +
    '<div class="hw-sp" style="left:92%;--len:70px;animation-delay:-2s"><div class="hw-th" style="animation-delay:-3s"></div>' + SPIDER + '</div>';

  var root = document.createElement('div'); root.id = 'hw-root'; root.setAttribute('aria-hidden', 'true');
  var h = '<div class="hw-vg"></div>' +
    '<div class="hw-gh">' + GHOST + '</div>' +
    '<span class="hw-cn t">' + tomb(0) + '</span><span class="hw-cn h">' + HAND + '</span>' +
    '<button type="button" class="hw-pk" id="hw-toggle" title="Couper / remettre la déco Halloween" aria-label="Couper ou remettre la déco Halloween">' + pumpkin('big') + pumpkin('small') + '</button>';
  var n = window.innerWidth < 700 ? Math.ceil(EMBERS / 2) : EMBERS;
  for (var i = 0; i < n; i++) {
    h += '<span class="hw-em" style="--x:' + Math.round(Math.random() * 100) + '%;--d:' + (9 + Math.random() * 9).toFixed(1) + 's;--dl:-' + (Math.random() * 12).toFixed(1) + 's;--dx:' + Math.round(-60 + Math.random() * 120) + 'px"></span>';
  }
  root.innerHTML = h;

  /* Cimetière : pierres tombales, mains de zombies qui sortent de terre, zombies qui marchent (au-dessus du pied de page) */
  var yard = document.createElement('div'); yard.id = 'hw-yard'; yard.setAttribute('aria-hidden', 'true');
  var yh = '', tp = [[3, 54, 0], [12, 40, 3], [21, 50, 1], [33, 44, 2], [47, 52, 0], [58, 40, 1], [68, 50, 3], [79, 46, 2], [89, 54, 0], [96, 38, 1]];
  tp.forEach(function (t) { yh += '<div class="hw-tb" style="--x:' + t[0] + '%;--w:' + t[1] + 'px">' + tomb(t[2]) + '</div>'; });
  [8, 27, 40, 53, 64, 74, 85, 93].forEach(function (x, i) { yh += '<div class="hw-hd" style="--x:' + x + '%;--dl:-' + (i * 1.7).toFixed(1) + 's">' + HAND + '</div>'; });
  yh += '<div class="hw-zb" style="--w:62px;--d:46s;--dl:-8s"><i>' + ZOMBIE + '</i></div>' +
        '<div class="hw-zb l" style="--w:54px;--d:62s;--dl:-34s"><i>' + ZOMBIE + '</i></div><div class="hw-gnd"></div>';
  yard.innerHTML = yh;

  function applyOff() {
    root.classList.toggle('off', !on); top.classList.toggle('off', !on); yard.classList.toggle('off', !on);
  }
  applyOff();
  document.body.appendChild(top); document.body.appendChild(root);
  var ft = document.querySelector('footer');
  if (ft && ft.parentNode) ft.parentNode.insertBefore(yard, ft); else document.body.appendChild(yard);

  /* Les zombies ne marchent que quand le cimetière est visible à l'écran (économise le processeur) */
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { yard.classList.toggle('run', es[0].isIntersecting); }, { threshold: 0.05 }).observe(yard);
  else yard.classList.add('run');

  /* Bouton citrouille : coupe / rallume (mémorisé) */
  document.getElementById('hw-toggle').onclick = function () { on = !on; applyOff(); set(KEY, on ? '1' : '0'); };

  /* Chauves-souris : une de temps en temps (3 d'un coup de temps à autre) */
  function bat(delay) {
    setTimeout(function () {
      if (!on || document.hidden) return;
      var dir = Math.random() < 0.5 ? 'r' : 'l', w = (window.innerWidth < 700 ? 44 : 64) + Math.round(Math.random() * 34), d = (7 + Math.random() * 6).toFixed(1);
      var el = document.createElement('div'); el.className = 'hw-bat ' + dir;
      el.style.cssText = '--y:' + (Math.round(12 + Math.random() * 40)) + 'vh;--w:' + w + 'px;--d:' + d + 's';
      el.innerHTML = '<div><i style="display:block;' + (dir === 'l' ? 'transform:scaleX(-1)' : '') + '">' + BAT + '</i></div>';
      el.addEventListener('animationend', function (e) { if (e.target === el) el.remove(); });
      root.appendChild(el);
    }, delay);
  }
  function wave() {
    if (reduce || de.classList.contains('lk10-tv') || de.classList.contains('fx-lite')) return;
    var k = Math.random() < 0.3 ? 3 : 1;
    for (var j = 0; j < k; j++) bat(j * 800);
  }
  if (!reduce) { setTimeout(wave, 2000); setInterval(wave, BATS_EVERY); }
})();
