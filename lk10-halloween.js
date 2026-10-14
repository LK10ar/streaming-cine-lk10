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
  /* Zombie qui marche (tourné vers la droite) : cravate déchirée, yeux inégaux, dents, bras tendus qui balancent, genoux qui plient */
  var ZOMBIE = (function () {
    function leg(hx, kind, pant, skin, shoe) {
      return '<g class="zt' + kind + '" style="transform-origin:' + hx + 'px 98px"><path d="M' + (hx - 6.5) + ' 96L' + (hx + 6.5) + ' 96L' + (hx + 5) + ' 124L' + (hx - 5.5) + ' 124z" fill="' + pant + '"/><path d="M' + (hx - 6) + ' 108l4 3 3-4 3 4" fill="none" stroke="#1f2338" stroke-width="1"/>' +
        '<g class="zs' + kind + '" style="transform-origin:' + hx + 'px 123px"><path d="M' + (hx - 5.5) + ' 122L' + (hx + 5) + ' 122L' + (hx + 4) + ' 143L' + (hx - 4) + ' 143z" fill="' + skin + '" stroke="#4d7a36" stroke-width=".8"/><path d="M' + (hx - 5.5) + ' 122L' + (hx + 5) + ' 122L' + (hx + 4.6) + ' 130L' + (hx - 5) + ' 130z" fill="' + pant + '"/>' +
        shoe + '</g></g>';
    }
    function arm(sx, sy, kind, sleeve, skin) {
      return '<g class="za' + kind + '" style="transform-origin:' + sx + 'px ' + sy + 'px"><rect x="' + (sx - 2) + '" y="' + (sy - 4.5) + '" width="26" height="9" rx="4.5" fill="' + sleeve + '" stroke="#2d3f6b" stroke-width="1"/>' +
        '<path d="M' + (sx + 22) + ' ' + (sy - 4) + 'l3 4-3 4" fill="none" stroke="#2d3f6b" stroke-width="1"/><rect x="' + (sx + 23) + '" y="' + (sy - 3.6) + '" width="25" height="7.2" rx="3.6" fill="' + skin + '" stroke="#4d7a36" stroke-width="1"/>' +
        '<ellipse cx="' + (sx + 50) + '" cy="' + sy + '" rx="5.6" ry="5" fill="' + skin + '" stroke="#4d7a36" stroke-width="1"/><path d="M' + (sx + 53) + ' ' + (sy - 3.6) + 'l5 -1.4M' + (sx + 54) + ' ' + sy + 'l5.6 0M' + (sx + 53) + ' ' + (sy + 3.6) + 'l5 1.4" stroke="#4d7a36" stroke-width="2.2" stroke-linecap="round"/></g>';
    }
    return '<svg viewBox="0 0 118 150" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="58" cy="148" rx="30" ry="3.6" fill="#000" opacity=".35"/>' +
      leg(55, '2', '#2f3552', '#7ea45f', '<path d="M' + 51 + ' 141L' + 61 + ' 141L' + 62 + ' 149L' + 48 + ' 149z" fill="#7ea45f" stroke="#4d7a36" stroke-width=".8"/>') +
      arm(52, 54, '2', '#4a68a6', '#7ea45f') +
      /* torse : chemise en lambeaux + cravate */
      '<path d="M36 52C32 66 34 82 38 98L42 93L46 101L52 93L57 102L62 93L68 99C71 82 70 66 66 52C60 47 42 47 36 52z" fill="#5b7dbf" stroke="#2d3f6b" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M40 70l6 3-5 3M58 80l5 2-4 3" stroke="#2d3f6b" stroke-width="1.2" fill="none"/><path d="M50 50L54 55L53 74L50 80L47 74L46 55z" fill="#b3202a" stroke="#6e1218" stroke-width=".9"/><path d="M45 50L51 56L57 50L51 48z" fill="#e8e8f0" stroke="#9a9aa8" stroke-width=".8"/>' +
      '<path d="M44 96L68 96" stroke="#2f3552" stroke-width="3"/>' +
      leg(46, '1', '#3a4166', '#8fbf6a', '<path d="M40 141L54 141L56 148L38 149z" fill="#1b1b24"/><path d="M40 141L54 141" stroke="#555" stroke-width="1.4"/>') +
      /* cou + tête */
      '<rect x="46" y="38" width="9" height="12" fill="#6f9650"/>' +
      '<g class="zhd" style="transform-origin:52px 44px"><ellipse cx="52" cy="24" rx="15.5" ry="17.5" fill="#9cc27a" stroke="#4d7a36" stroke-width="1.3"/><ellipse cx="60" cy="31" rx="7" ry="5" fill="#7ba35c" opacity=".7"/><path d="M63 11C70 21 69 35 55 41.4C63 34 65 22 63 11z" fill="#2f5a22" opacity=".25"/><path d="M41 29q4 2 8 0M55 27.6q3 1.6 7 0" stroke="#4d7a36" stroke-width="1" fill="none" opacity=".7"/>' +
      '<path d="M37 20C34 8 44 3 53 5C62 2 70 8 67 19C62 12 56 12 52 14C47 11 41 13 37 20z" fill="#2c2a22"/><path d="M40 8l-4-4M60 5l3-4" stroke="#2c2a22" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="45" cy="24" r="6" fill="#2b3a22"/><circle cx="45" cy="24" r="4.4" fill="#f4f4e8"/><circle cx="46.4" cy="24.4" r="1.7" fill="#c4161c"/>' +
      '<circle cx="59" cy="22.4" r="4.4" fill="#2b3a22"/><circle cx="59" cy="22.4" r="3.2" fill="#f4f4e8"/><circle cx="60" cy="22.8" r="1.2" fill="#111"/>' +
      '<path d="M40 18L49 20M55 17.4L63 18.6" stroke="#3b4d28" stroke-width="1.6" stroke-linecap="round"/><path d="M52 27l-1.4 5h3z" fill="#4d7a36"/>' +
      '<path d="M41 36Q52 46 63 35L61 33Q52 41 43 33z" fill="#2a0f10"/><path d="M44 34l1.5 3 2-2.6 2 3.2 2-3 2 3 2-3 1.8 2.4" fill="#f1f1e4" stroke="#bfbfae" stroke-width=".4"/>' +
      '<path d="M54 6L58 14M52.5 8.6L57 7.4M55 12L59.5 10.6" stroke="#6b3b3b" stroke-width="1.2"/><path d="M38 28l4 2-3 3" fill="none" stroke="#6b3b3b" stroke-width="1.1"/></g>' +
      arm(54, 50, '1', '#5b7dbf', '#8fbf6a') +
      '</svg>';
  })();

  var GHOST = '<svg viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg"><path d="M25 3C13 3 5 12 5 24v31l7-6 6 6 7-6 7 6 6-6 7 6V24C45 12 37 3 25 3z" fill="#fff"/>' +
    '<ellipse cx="18" cy="24" rx="3.4" ry="5" fill="#2a1b4d"/><ellipse cx="32" cy="24" rx="3.4" ry="5" fill="#2a1b4d"/><ellipse cx="25" cy="36" rx="3" ry="4" fill="#2a1b4d"/></svg>';

  /* Étincelle à 4 branches */
  function spark(x, y, sz, col, dl) { return '<path class="tw" transform="translate(' + x + ' ' + y + ') scale(' + sz + ')" d="M0-6L1.6-1.6L6 0L1.6 1.6L0 6L-1.6 1.6L-6 0L-1.6-1.6z" fill="' + col + '" style="animation-delay:-' + dl + 's"/>'; }

  /* Sorcière sur son balai (tournée vers la droite) : chat noir, cheveux au vent, bas rayés, traînée d'étincelles */
  var WITCH = '<svg viewBox="-14 -40 214 158" xmlns="http://www.w3.org/2000/svg">' +
    spark(-4, 70, .9, '#ffd36b', .1) + spark(8, 88, .7, '#c9a3ff', .4) + spark(-10, 52, .6, '#ff9a3c', .7) + spark(18, 100, .55, '#ffd36b', .25) + spark(2, 40, .5, '#c9a3ff', .55) +
    /* balai : paille puis manche */
    '<path d="M46 66L6 46C11 57 3 63 8 72C13 77 8 85 13 89L46 76z" fill="#c9984a" stroke="#7a5a22" stroke-width="1.1" stroke-linejoin="round"/>' +
    '<path d="M46 68L10 52M46 70L9 62M46 72L10 74M46 74L13 84M46 67L12 46" stroke="#8a6224" stroke-width="1" opacity=".8"/>' +
    '<path d="M18 72L190 52" stroke="#4d2f14" stroke-width="6.4" stroke-linecap="round"/><path d="M18 71L190 51" stroke="#8a5a2b" stroke-width="3.2" stroke-linecap="round"/>' +
    '<path d="M44 64L46 78M50 63.5L52 77.5M56 63L58 77" stroke="#3a220f" stroke-width="3.2" stroke-linecap="round"/>' +
    /* chat noir */
    '<g stroke="#7a55c8" stroke-width="1" stroke-linejoin="round"><path d="M78 62C70 56 70 40 80 36C90 40 90 56 88 63z" fill="#0e0a18"/><path d="M66 56C58 52 54 42 58 32" fill="none" stroke="#0e0a18" stroke-width="4.5" stroke-linecap="round"/><circle cx="82" cy="30" r="8" fill="#0e0a18"/><path d="M75.5 25L76 14L82 22zM88.5 25L88 14L82 22z" fill="#0e0a18"/></g>' +
    '<ellipse cx="79" cy="30" rx="1.8" ry="2.6" fill="#ffd34a"/><ellipse cx="86" cy="30" rx="1.8" ry="2.6" fill="#ffd34a"/>' +
    /* cheveux qui volent */
    '<path d="M124 6C108-2 92 6 78 -2C86 10 74 16 62 14C76 22 88 20 98 30C84 34 78 44 68 46C88 48 104 40 114 32C120 28 124 20 126 14z" fill="#ff7a1a"/><path d="M120 8C108 4 98 9 88 5C94 13 88 17 80 18C92 22 102 22 110 28z" fill="#ffb347" opacity=".85"/>' +
    /* robe, jupe qui flotte */
    '<g stroke="#b58bff" stroke-width="1.1" stroke-linejoin="round">' +
    '<path d="M112 70C96 66 82 72 66 88C76 84 84 90 88 98C98 90 106 92 114 84z" fill="#1a0f33"/>' +
    '<path d="M108 72C100 58 104 40 122 36C138 34 146 48 142 66C140 74 132 76 124 74C118 78 112 76 108 72z" fill="#2b1654"/></g>' +
    '<path d="M114 50C118 43 127 40 135 45" fill="none" stroke="#6a45b8" stroke-width="2" opacity=".6" stroke-linecap="round"/>' +
    '<path d="M116 66C122 64 130 66 136 62" fill="none" stroke="#ff9a3c" stroke-width="2.2" stroke-linecap="round"/>' +
    /* jambes : bas rayés + bottes pointues */
    '<g class="wlg"><path d="M126 74L138 94L148 108" fill="none" stroke="#ff8a1f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M126 74L138 94L148 108" fill="none" stroke="#2b1654" stroke-width="8" stroke-dasharray="5 6" stroke-linecap="butt" stroke-linejoin="round"/>' +
    '<path d="M144 104C148 100 156 104 162 100C160 108 154 112 146 112z" fill="#120a24" stroke="#b58bff" stroke-width="1"/><rect x="146" y="103" width="5" height="5" rx="1" fill="#ffd34a"/></g>' +
    /* bras vers le manche */
    '<path d="M132 46L152 62" stroke="#b58bff" stroke-width="8.6" stroke-linecap="round"/><path d="M132 46L152 62" stroke="#2b1654" stroke-width="7" stroke-linecap="round"/><circle cx="156" cy="64" r="4.4" fill="#8fc46a" stroke="#4d7a36" stroke-width="1"/>' +
    /* tête */
    '<path d="M136 30C145 30 154 34 152 42C147 38 142 38 137 38z" fill="#8fc46a" stroke="#4d7a36" stroke-width="1.1" stroke-linejoin="round"/><circle cx="148.6" cy="39.6" r="1.5" fill="#5f9a3c"/>' +
    '<circle cx="132" cy="28" r="10.5" fill="#8fc46a" stroke="#4d7a36" stroke-width="1.2"/><path d="M126 35Q134 41 143 34" fill="none" stroke="#2a150e" stroke-width="1.6" stroke-linecap="round"/><path d="M130 36.6l1.4 3.2l1.8-2.8" fill="#fff" stroke="#2a150e" stroke-width=".6"/>' +
    '<ellipse cx="136.6" cy="25.4" rx="3.2" ry="3.4" fill="#fff"/><circle cx="137.6" cy="25.8" r="1.5" fill="#d1161a"/><path d="M131.4 20.6L140.4 23" stroke="#2a150e" stroke-width="1.8" stroke-linecap="round"/>' +
    /* chapeau pointu qui retombe */
    '<ellipse cx="130" cy="17" rx="19" ry="4.8" transform="rotate(-6 130 17)" fill="#1a0f33" stroke="#b58bff" stroke-width="1.2"/>' +
    '<path d="M114 15C118 2 124-10 122-22C120-30 114-32 108-30C118-38 132-36 136-22C140-8 142 4 146 14z" fill="#1a0f33" stroke="#b58bff" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<path d="M115 9.5Q130 15 144.6 9" fill="none" stroke="#ff8a1f" stroke-width="4"/><rect x="127" y="8" width="8" height="8" rx="1.5" fill="none" stroke="#ffd34a" stroke-width="1.6" transform="rotate(8 131 12)"/>' +
    '</svg>';

  /* Cavalier sans tête (tourné vers la droite) : cheval au galop (genoux qui plient), crinière en flammes, citrouille brandie */
  var HORSEMAN = (function () {
    function leg(px, py, kind, fill, dl) {
      var P = function (dx, dy) { return (px + dx) + ' ' + (py + dy); }, st = ' fill="' + fill + '" stroke="#6e4bb0" stroke-width="1.2" stroke-linejoin="round"';
      return '<g class="h' + kind + '" style="transform-origin:' + px + 'px ' + py + 'px;animation-delay:-' + dl + 's">' +
        '<path d="M' + P(-10, 0) + 'C' + P(-9, 14) + ' ' + P(-6, 24) + ' ' + P(-5, 32) + 'L' + P(5, 32) + 'C' + P(6, 24) + ' ' + P(9, 14) + ' ' + P(10, 0) + 'z"' + st + '/>' +
        '<g class="kn' + kind + '" style="transform-origin:' + px + 'px ' + (py + 31) + 'px;animation-delay:-' + dl + 's">' +
        '<path d="M' + P(-4.8, 30) + 'L' + P(4.8, 30) + 'C' + P(3.8, 42) + ' ' + P(3.4, 52) + ' ' + P(3.6, 58) + 'C' + P(5.8, 60) + ' ' + P(6.2, 64) + ' ' + P(7.6, 69) + 'L' + P(-6, 69) + 'C' + P(-5, 64) + ' ' + P(-4.4, 61) + ' ' + P(-3.8, 58) + 'C' + P(-3.4, 52) + ' ' + P(-3.8, 42) + ' ' + P(-4.8, 30) + 'z"' + st + '/></g></g>';
    }
    return '<svg viewBox="-6 -34 252 210" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="110" cy="171" rx="100" ry="6" fill="#ff8a1f" opacity=".16"/>' +
      '<circle class="sk" cx="30" cy="160" r="2.2" fill="#ffd36b"/><circle class="sk" cx="52" cy="166" r="1.8" fill="#ff9a3c" style="animation-delay:-.17s"/><circle class="sk" cx="14" cy="168" r="1.6" fill="#ffd36b" style="animation-delay:-.33s"/><circle class="sk" cx="70" cy="162" r="1.5" fill="#ff8a1f" style="animation-delay:-.4s"/>' +
      /* étincelles */
      spark(30, 112, .7, '#ffd36b', .1) + spark(6, 70, .6, '#ff9a3c', .5) + spark(214, 14, .6, '#ffd36b', .3) + spark(168, -22, .7, '#ff9a3c', .6) +
      /* jambes lointaines (plus sombres) */
      leg(86, 92, 'bf', '#0b0817', 0.23) + leg(128, 94, 'ff', '#0b0817', 0.23) +
      /* queue de feu */
      '<path class="fl" d="M48 78C34 70 22 78 8 70C16 82 8 90-2 96C14 96 28 92 38 98C44 92 48 86 52 84z" fill="#ff8a1f"/><path class="fl" d="M46 80C36 76 28 80 18 77C24 84 20 88 14 91C26 90 36 88 42 92z" fill="#ffd36b"/>' +
      /* cape qui flotte */
      '<path class="cp" d="M104 24C84 20 62 32 34 26C46 38 38 50 20 58C42 58 58 64 74 74C88 74 100 72 108 66z" fill="#3b1f72" stroke="#b58bff" stroke-width="1.2" stroke-linejoin="round"/><path d="M96 30C80 30 64 38 46 36C54 44 50 50 40 56C56 54 70 58 82 66" fill="none" stroke="#6a45b8" stroke-width="1.2" opacity=".8"/>' +
      /* corps du cheval : dos, encolure, tête */
      '<path d="M46 80C42 66 56 58 74 58C96 57 118 56 140 54C154 52 164 42 172 30L176 22L184 31C194 33 206 40 216 54C221 61 218 69 210 69C203 69 198 64 190 63C184 68 178 72 170 80C164 90 156 102 142 106C120 111 92 108 72 104C56 100 48 92 46 80z" fill="#17102a" stroke="#7a55c8" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M70 66C96 62 124 62 146 60" fill="none" stroke="#3c2a6e" stroke-width="2" opacity=".7"/><path d="M174 24L176 10L184 26z" fill="#17102a" stroke="#7a55c8" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<circle cx="198" cy="47" r="6.4" fill="#ff3b3b" opacity=".3"/><circle cx="198" cy="47" r="3.2" fill="#ff5a3a"/><circle cx="198" cy="47" r="1.2" fill="#ffd3a0"/><path d="M212 60C213 58 215 58 216 60" stroke="#7a55c8" stroke-width="1.2" fill="none"/>' +
      '<path class="fl" d="M220 56C228 50 236 54 240 48C238 58 232 62 224 62z" fill="#ff8a1f"/>' +
      /* crinière de flammes */
      '<path class="fl" d="M142 54C138 42 130 46 126 38C126 48 118 50 114 58C122 56 130 58 136 62z" fill="#ff8a1f"/><path class="fl" d="M176 24C170 16 166 22 160 18C162 28 154 30 150 38C158 36 164 38 170 42C176 38 178 30 176 24z" fill="#ff8a1f"/><path class="fl" d="M172 28C168 24 164 28 160 26C160 33 156 35 154 40C160 38 166 40 170 43z" fill="#ffd36b"/><path class="fl" d="M156 40C150 32 146 38 140 34C142 44 134 46 130 54C140 50 148 52 154 56z" fill="#ffb347"/>' +
      /* cavalier : jambe, torse, col, moignon de cou enflammé */
      '<path d="M104 62C114 66 130 66 138 76L130 84C120 78 108 78 98 70z" fill="#2b1654" stroke="#b58bff" stroke-width="1.2" stroke-linejoin="round"/><path d="M126 78L137 80L141 93C142 97 138 99 133 99L124 97L125 86z" fill="#1b1030" stroke="#b58bff" stroke-width="1.1" stroke-linejoin="round"/><path d="M122 99L140 99" stroke="#ffd34a" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M96 66C90 48 92 28 104 18C116 14 126 20 128 34C130 48 128 60 122 68z" fill="#2b1654" stroke="#b58bff" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M100 22L94 6L108 14zM124 24L130 8L114 14z" fill="#3b1f72" stroke="#b58bff" stroke-width="1.1" stroke-linejoin="round"/><path d="M104 38L122 44M103 50L121 54" stroke="#b58bff" stroke-width="1" opacity=".5"/>' +
      '<ellipse cx="112" cy="15" rx="8" ry="4" fill="#ff6a00"/><ellipse cx="112" cy="14" rx="5" ry="2.6" fill="#ffd36b"/>' +
      '<path class="fl" d="M108 14C104 4 110 2 108-8C114-2 118 4 116 14z" fill="#ff8a1f" opacity=".9"/><path class="fl" d="M110 13C108 6 112 4 111-2C114 3 116 7 114 13z" fill="#ffd36b"/>' +
      /* rênes + bras gauche */
      '<path d="M136 52L212 62" stroke="#b58bff" stroke-width="1.1" fill="none"/><path d="M110 40L128 52L142 52" stroke="#b58bff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M110 40L128 52L142 52" stroke="#2b1654" stroke-width="7.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      /* bras droit levé + citrouille */
      '<path d="M120 28L142 14L158-2" stroke="#b58bff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M120 28L142 14L158-2" stroke="#2b1654" stroke-width="8.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<path d="M170-24c0-4 3-6 6-7" fill="none" stroke="#4d8a2b" stroke-width="3.2" stroke-linecap="round"/><circle cx="170" cy="-10" r="17" fill="#ffb02e" opacity=".25"/>' +
      '<ellipse cx="160" cy="-8" rx="11" ry="14" fill="#e8620c"/><ellipse cx="180" cy="-8" rx="11" ry="14" fill="#e8620c"/><ellipse cx="170" cy="-8" rx="12" ry="15" fill="#ff8a1f"/>' +
      '<path d="M162-10l5-5 3 6zM178-10l-5-5-3 6z" fill="#ffe27a"/><path d="M170-6l-2.4 4h4.8z" fill="#ffe27a"/><path d="M162 0c3 5 5 2 8 5 3-3 5 0 8-5-3 1-5-1-8 2-3-3-5-1-8-2z" fill="#ffe27a"/>' +
      /* jambes proches */
      leg(66, 92, 'bb', '#17102a', 0) + leg(142, 94, 'fb', '#17102a', 0) +
      '</svg>';
  })();

  /* Variantes : on change seulement les couleurs d'un même dessin */
  function recolor(svg, map) { for (var k in map) svg = svg.split(k).join(map[k]); return svg; }
  var WITCH_B = recolor(WITCH, { '#ff7a1a': '#b45cff', '#ffb347': '#e0b3ff', '#2b1654': '#0f4c5c', '#1a0f33': '#0a2f3a', '#b58bff': '#5be0d0', '#6a45b8': '#2a8f93', '#ff8a1f': '#ff5fa2', '#ff9a3c': '#ff5fa2', '#8fc46a': '#cdb8ee', '#4d7a36': '#7a5ca8', '#5f9a3c': '#a98bd0' });
  var ZOMBIES = [ZOMBIE,
    recolor(ZOMBIE, { '#9cc27a': '#8cc2b0', '#8fbf6a': '#80b5a3', '#7ea45f': '#6f9f8d', '#7ba35c': '#65998a', '#6f9650': '#5b8576', '#4d7a36': '#3b6b5c', '#5b7dbf': '#e0771c', '#4a68a6': '#c4640f', '#2d3f6b': '#7a3d08', '#b3202a': '#f2f2f2', '#6e1218': '#bdbdbd', '#2c2a22': '#6a2fa0' }),
    recolor(ZOMBIE, { '#9cc27a': '#bccf80', '#8fbf6a': '#aec672', '#7ea45f': '#9db462', '#7ba35c': '#8fa856', '#6f9650': '#81994b', '#4d7a36': '#62793a', '#5b7dbf': '#c0272f', '#4a68a6': '#a31f27', '#2d3f6b': '#5a0f14', '#b3202a': '#ffffff', '#6e1218': '#cfcfcf', '#2c2a22': '#d8c36a' })];
  /* Arbre mort du cimetière */
  var TREE = '<svg viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#150f1f" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M60 170C62 140 56 118 54 96C52 80 44 70 30 62" stroke-width="10"/><path d="M54 96C60 84 72 76 90 70" stroke-width="7"/>' +
    '<path d="M30 62C22 58 14 50 8 38M30 62C26 50 28 40 24 28M30 62C38 56 40 46 46 40" stroke-width="4"/><path d="M90 70C98 64 106 56 112 44M90 70C92 60 96 52 94 40M80 74C84 66 80 58 84 50" stroke-width="4"/>' +
    '<path d="M54 120C48 114 40 112 32 108" stroke-width="5"/><path d="M8 38l-6-6M24 28l-2-8M46 40l4-7M112 44l6-4M94 40l2-8" stroke-width="2.4"/></g>' +
    '<path d="M58 150c-4 8-10 14-12 20h26c-2-6-8-12-14-20z" fill="#150f1f"/><path d="M100 61c4-6 9-5 12-2l-3 3 5 3-8 1z" fill="#0a0710"/></svg>';
  var FENCE = 'url(data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='16' height='44'><g fill='#120d1a'><rect x='6.5' y='6' width='3' height='38'/><path d='M8 0l3.4 8h-6.8z'/><rect x='0' y='16' width='16' height='2.4'/><rect x='0' y='32' width='16' height='2.4'/></g></svg>") + ')';

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
    '#hw-yard{position:relative;height:200px;margin-top:34px;overflow:hidden;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(60,25,80,.28))}' +
    '#hw-yard .hw-gnd{position:absolute;left:0;right:0;bottom:0;height:22px;background:linear-gradient(180deg,#25361d,#120d18);z-index:5;box-shadow:0 -6px 14px rgba(0,0,0,.5)}' +
    '#hw-yard .hw-gnd::before{content:"";position:absolute;left:0;right:0;top:-7px;height:8px;background:repeating-linear-gradient(90deg,transparent 0 5px,#25361d 5px 7px,transparent 7px 12px);clip-path:polygon(0 100%,4% 20%,8% 100%,13% 10%,18% 100%,24% 30%,30% 100%,36% 0,42% 100%,48% 25%,54% 100%,60% 15%,66% 100%,72% 30%,78% 100%,84% 5%,90% 100%,95% 25%,100% 100%)}' +
    '#hw-yard .hw-tb{position:absolute;bottom:14px;left:var(--x);width:var(--w);z-index:3}#hw-yard .hw-tb svg{display:block;width:100%;filter:drop-shadow(0 0 6px rgba(0,0,0,.6))}' +
    '#hw-yard .hw-hd{position:absolute;bottom:-4px;left:var(--x);width:26px;z-index:2;animation:hwRise 7s ease-in-out infinite;animation-delay:var(--dl);animation-play-state:paused}#hw-yard .hw-hd svg{display:block;width:100%}' +
    '#hw-yard .hw-zb{position:absolute;bottom:12px;left:0;width:var(--w);z-index:4;animation:hwWalk var(--d) linear infinite;animation-delay:var(--dl);animation-play-state:paused}' +
    '#hw-yard .hw-zb.l{animation-name:hwWalkL}#hw-yard .hw-zb.l>i{transform:scaleX(-1)}' +
    '#hw-yard .hw-zb>i{display:block;animation:hwZBob .8s ease-in-out infinite alternate;animation-play-state:paused}#hw-yard .hw-zb svg{display:block;width:100%;overflow:visible}' +
    '#hw-yard .zt1,#hw-yard .zt2,#hw-yard .zs1,#hw-yard .zs2,#hw-yard .za1,#hw-yard .za2,#hw-yard .zhd{transform-box:view-box;animation-play-state:paused;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}' +
    '#hw-yard .zt1{animation-name:hwTh;animation-duration:.9s}#hw-yard .zt2{animation-name:hwTh;animation-duration:.9s;animation-direction:alternate-reverse}' +
    '#hw-yard .zs1{animation-name:hwSh;animation-duration:.9s}#hw-yard .zs2{animation-name:hwSh;animation-duration:.9s;animation-direction:alternate-reverse}' +
    '#hw-yard .za1{animation-name:hwArm;animation-duration:1.3s}#hw-yard .za2{animation-name:hwArm;animation-duration:1.3s;animation-direction:alternate-reverse}#hw-yard .zhd{animation-name:hwHead;animation-duration:1.7s}' +
    '#hw-yard.run .hw-hd,#hw-yard.run .hw-zb,#hw-yard.run .hw-zb>i,#hw-yard.run .zt1,#hw-yard.run .zt2,#hw-yard.run .zs1,#hw-yard.run .zs2,#hw-yard.run .za1,#hw-yard.run .za2,#hw-yard.run .zhd{animation-play-state:running}' +
    '#hw-yard .hw-moon{position:absolute;right:8%;top:10px;width:66px;height:66px;border-radius:50%;z-index:0;background:radial-gradient(circle at 62% 62%,rgba(160,140,80,.4) 0 7px,transparent 8px),radial-gradient(circle at 30% 68%,rgba(160,140,80,.32) 0 5px,transparent 6px),radial-gradient(circle at 40% 28%,rgba(160,140,80,.3) 0 4px,transparent 5px),radial-gradient(circle at 35% 35%,#fffbe0,#f0e4a6 62%,#d9c878);box-shadow:0 0 44px 16px rgba(255,238,160,.26)}' +
    '#hw-yard .hw-tree{position:absolute;left:14%;bottom:16px;width:120px;z-index:1}#hw-yard .hw-tree svg{display:block;width:100%}' +
    '#hw-yard .hw-fence{position:absolute;left:0;right:0;bottom:16px;height:44px;z-index:1;opacity:.9;background:var(--hw-fence) repeat-x bottom}' +
    '#hw-yard .hw-pg{position:absolute;bottom:14px;left:var(--x);width:var(--w);z-index:4;animation:hwGlow 2.6s ease-in-out infinite alternate;animation-play-state:paused}#hw-yard .hw-pg svg{display:block;width:100%}' +
    '#hw-yard .hw-fog{position:absolute;left:0;bottom:16px;width:200%;height:70px;z-index:5;background:radial-gradient(ellipse at 12% 80%,rgba(210,200,240,.2),transparent 55%),radial-gradient(ellipse at 38% 60%,rgba(210,200,240,.15),transparent 55%),radial-gradient(ellipse at 62% 85%,rgba(210,200,240,.2),transparent 55%),radial-gradient(ellipse at 88% 60%,rgba(210,200,240,.15),transparent 55%);animation:hwFog 50s linear infinite;animation-play-state:paused}' +
    '#hw-yard.run .hw-pg,#hw-yard.run .hw-fog{animation-play-state:running}' +
    '.hw-hm .sk{transform-box:fill-box;transform-origin:center;animation:hwSk .5s linear infinite}' +
    '.hw-gf{position:absolute;top:var(--y);left:0;width:var(--w);opacity:.6;will-change:transform}.hw-gf.r{animation:hwFlyR var(--d) linear forwards}.hw-gf.l{animation:hwFlyL var(--d) linear forwards}' +
    '.hw-gf>div{animation:hwWobG 3.4s ease-in-out infinite}.hw-gf svg{display:block;width:100%;filter:drop-shadow(0 0 10px rgba(200,220,255,.8))}' +
    '.hw-flash{position:absolute;inset:0;opacity:0;background:radial-gradient(circle at 50% 35%,rgba(190,150,255,.32),transparent 62%);animation:hwFlash 1.6s ease-out forwards}' +
    '@keyframes hwFog{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
    '@keyframes hwSk{from{opacity:1;transform:translate(0,0) scale(1)}to{opacity:0;transform:translate(-28px,10px) scale(.3)}}' +
    '@keyframes hwWobG{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-34px) rotate(5deg)}}' +
    '@keyframes hwFlash{0%{opacity:0}20%{opacity:.8}100%{opacity:0}}' +
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
    '@keyframes hwTh{from{transform:rotate(24deg)}to{transform:rotate(-26deg)}}' +
    '@keyframes hwSh{from{transform:rotate(2deg)}to{transform:rotate(44deg)}}' +
    '@keyframes hwArm{from{transform:rotate(-6deg)}to{transform:rotate(8deg)}}' +
    '@keyframes hwHead{from{transform:rotate(-3deg)}to{transform:rotate(6deg)}}' +
    /* sorcières sur leur balai */
    '.hw-wi{position:absolute;top:var(--y);left:0;width:var(--w);will-change:transform}' +
    '.hw-wi.r{animation:hwFlyR var(--d) linear forwards}.hw-wi.l{animation:hwFlyL var(--d) linear forwards}' +
    '.hw-wi>div{animation:hwWobW 2.8s ease-in-out infinite}' +
    '.hw-wi svg{display:block;width:100%;overflow:visible;filter:drop-shadow(0 0 7px rgba(170,110,255,.75))}' +
    '.hw-wi .tw{transform-box:fill-box;transform-origin:center;animation:hwTw .8s ease-in-out infinite alternate}' +
    /* cavalier sans tête */
    '.hw-hm{position:absolute;bottom:var(--b);left:0;width:var(--w);will-change:transform}' +
    '.hw-hm.r{animation:hwFlyR var(--d) linear forwards}.hw-hm.l{animation:hwFlyL var(--d) linear forwards}' +
    '.hw-hm>div{animation:hwGallop .42s ease-in-out infinite alternate}' +
    '.hw-hm svg{display:block;width:100%;overflow:visible;filter:drop-shadow(0 0 9px rgba(255,120,30,.6))}' +
    '.hw-hm [class^="h"],.hw-hm [class^="kn"],.hw-hm .cp,.hw-hm .fl{transform-box:view-box}' +
    '.hw-hm .hbb,.hw-hm .hbf{animation:hwHB .46s ease-in-out infinite alternate}.hw-hm .hfb,.hw-hm .hff{animation:hwHF .46s ease-in-out infinite alternate}' +
    '.hw-hm .knbb,.hw-hm .knbf{animation:hwKB .46s ease-in-out infinite alternate}.hw-hm .knfb,.hw-hm .knff{animation:hwKF .46s ease-in-out infinite alternate}' +
    '.hw-hm .cp{transform-box:fill-box;transform-origin:100% 40%;animation:hwCape .36s ease-in-out infinite alternate}' +
    '.hw-wi .wlg{transform-box:view-box;transform-origin:126px 74px;animation:hwKick .9s ease-in-out infinite alternate}' +
    '.hw-hm .fl{transform-box:fill-box;transform-origin:50% 100%;animation:hwFl .3s ease-in-out infinite alternate}' +
    '@keyframes hwWobW{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-30px) rotate(3deg)}}' +
    '@keyframes hwTw{from{opacity:.2;transform:scale(.6)}to{opacity:1;transform:scale(1.25)}}' +
    '@keyframes hwGallop{from{transform:translateY(0)}to{transform:translateY(-8px)}}' +
    '@keyframes hwHF{from{transform:rotate(-34deg)}to{transform:rotate(16deg)}}' +
    '@keyframes hwHB{from{transform:rotate(24deg)}to{transform:rotate(-20deg)}}' +
    '@keyframes hwKF{from{transform:rotate(0)}to{transform:rotate(38deg)}}' +
    '@keyframes hwKB{from{transform:rotate(36deg)}to{transform:rotate(0)}}' +
    '@keyframes hwCape{from{transform:scaleY(.92) skewY(-3deg)}to{transform:scaleY(1.08) skewY(3deg)}}' +
    '@keyframes hwKick{from{transform:rotate(-8deg)}to{transform:rotate(14deg)}}' +
    '@keyframes hwFl{from{transform:scale(1,.9);opacity:.85}to{transform:scale(1.06,1.1);opacity:1}}' +
    /* petite citrouille seule quand le visiteur a coupé la déco */
    '#hw-root.off>*:not(.hw-pk){display:none}#hw-root.off .hw-pk{opacity:.4}#hw-root.off .hw-pk .big{width:30px}#hw-root.off .hw-pk .small{display:none}#hw-root.off .hw-pk svg{animation:none}' +
    '#hw-top.off,#hw-yard.off{display:none}' +
    /* mobile */
    '@media(max-width:700px){.hw-web{width:min(110px,30vw)}.hw-pk .big{width:52px}.hw-pk .small{width:32px}.hw-gh{left:44px;bottom:66px;width:32px}.hw-cn.t{left:94px;width:34px}.hw-cn.h{left:128px;width:20px}.hw-sp svg{width:24px;margin-left:-12px}#hw-root.off .hw-pk .big{width:26px}#hw-yard{height:150px}}' +
    /* télé / mode lite / mouvement réduit : décor fixe (toiles, citrouilles, pierres tombales), sans animation ni effets */
    'html.lk10-tv #hw-root .hw-vg,html.lk10-tv #hw-top .hw-sp,html.lk10-tv #hw-root .hw-gh,html.lk10-tv #hw-root .hw-bat,html.lk10-tv #hw-root .hw-gf,html.lk10-tv #hw-root .hw-flash,html.lk10-tv #hw-yard .hw-fog,html.lk10-tv #hw-root .hw-wi,html.lk10-tv #hw-root .hw-hm,html.lk10-tv #hw-root .hw-em,html.lk10-tv #hw-yard .hw-zb,html.lk10-tv #hw-yard .hw-hd,html.lk10-tv #hw-root .hw-cn.h,' +
    'html.fx-lite #hw-root .hw-bat,html.fx-lite #hw-root .hw-gf,html.fx-lite #hw-root .hw-flash,html.fx-lite #hw-yard .hw-fog,html.fx-lite #hw-root .hw-wi,html.fx-lite #hw-root .hw-hm,html.fx-lite #hw-root .hw-em,html.fx-lite #hw-root .hw-vg{display:none!important}' +
    'html.lk10-tv #hw-root *,html.lk10-tv #hw-top *,html.lk10-tv #hw-yard *{animation:none!important;filter:none!important}' +
    '@media(prefers-reduced-motion:reduce){#hw-root *,#hw-top *,#hw-yard *{animation:none!important}#hw-root .hw-bat,#hw-root .hw-wi,#hw-root .hw-hm,#hw-root .hw-gf,#hw-root .hw-flash,#hw-root .hw-em,#hw-yard .hw-zb,#hw-yard .hw-fog{display:none!important}}';
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
  var yh = '<div class="hw-moon"></div><div class="hw-tree">' + TREE + '</div><div class="hw-fence"></div>', tp = [[3, 54, 0], [12, 40, 3], [21, 50, 1], [33, 44, 2], [47, 52, 0], [58, 40, 1], [68, 50, 3], [79, 46, 2], [89, 54, 0], [96, 38, 1]];
  tp.forEach(function (t) { yh += '<div class="hw-tb" style="--x:' + t[0] + '%;--w:' + t[1] + 'px">' + tomb(t[2]) + '</div>'; });
  [8, 27, 40, 53, 64, 74, 85, 93].forEach(function (x, i) { yh += '<div class="hw-hd" style="--x:' + x + '%;--dl:-' + (i * 1.7).toFixed(1) + 's">' + HAND + '</div>'; });
  [[18, 34], [52, 28], [75, 38]].forEach(function (c, i) { yh += '<div class="hw-pg" style="--x:' + c[0] + '%;--w:' + c[1] + 'px;animation-delay:-' + (i * 0.9) + 's">' + pumpkin('') + '</div>'; });
  yh += '<div class="hw-zb" style="--w:92px;--d:48s;--dl:-8s"><i>' + ZOMBIES[0] + '</i></div>' +
        '<div class="hw-zb l" style="--w:78px;--d:64s;--dl:-34s"><i>' + ZOMBIES[1] + '</i></div>' +
        '<div class="hw-zb" style="--w:68px;--d:80s;--dl:-58s"><i>' + ZOMBIES[2] + '</i></div><div class="hw-fog"></div><div class="hw-gnd"></div>';
  yard.innerHTML = yh; yard.style.setProperty('--hw-fence', FENCE);

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
  /* Sorcières sur leur balai : une de temps en temps (parfois deux) */
  function fly(cls, html, css, delay) {
    setTimeout(function () {
      if (!on || document.hidden) return;
      var dir = Math.random() < 0.5 ? 'r' : 'l', el = document.createElement('div'); el.className = cls + ' ' + dir;
      el.style.cssText = css;
      el.innerHTML = '<div><i style="display:block;' + (dir === 'l' ? 'transform:scaleX(-1)' : '') + '">' + html + '</i></div>';
      el.addEventListener('animationend', function (e) { if (e.target === el) el.remove(); });
      root.appendChild(el);
    }, delay);
  }
  function calm() { return reduce || de.classList.contains('lk10-tv') || de.classList.contains('fx-lite'); }
  function witches() {
    if (calm()) return;
    var k = Math.random() < 0.3 ? 2 : 1, m = window.innerWidth < 700;
    for (var j = 0; j < k; j++) fly('hw-wi', Math.random() < 0.5 ? WITCH : WITCH_B, '--y:' + Math.round(8 + Math.random() * 28) + 'vh;--w:' + ((m ? 96 : 140) + Math.round(Math.random() * 50)) + 'px;--d:' + (11 + Math.random() * 5).toFixed(1) + 's', j * 2500);
  }
  /* Cavalier sans tête : il traverse le bas de l'écran au galop, rarement */
  function horseman() {
    if (calm()) return;
    var m = window.innerWidth < 700;
    var fl = document.createElement('div'); fl.className = 'hw-flash';
    fl.addEventListener('animationend', function () { fl.remove(); }); root.appendChild(fl);
    fly('hw-hm', HORSEMAN, '--b:' + (m ? 56 : 30) + 'px;--w:' + (m ? 170 : 280) + 'px;--d:' + (9 + Math.random() * 3).toFixed(1) + 's', 0);
  }
  /* Fantômes translucides qui flottent d'un bord à l'autre */
  function ghosts() {
    if (calm()) return;
    var m = window.innerWidth < 700;
    fly('hw-gf', GHOST, '--y:' + Math.round(28 + Math.random() * 40) + 'vh;--w:' + ((m ? 44 : 60) + Math.round(Math.random() * 30)) + 'px;--d:' + (14 + Math.random() * 6).toFixed(1) + 's', 0);
  }
  if (!reduce) {
    setTimeout(ghosts, 11000); setInterval(ghosts, 36000);
    setTimeout(wave, 2000); setInterval(wave, BATS_EVERY);
    setTimeout(witches, 7000); setInterval(witches, 24000);
    setTimeout(horseman, 15000); setInterval(horseman, 52000);
  }
})();
