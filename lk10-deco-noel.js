/* Ciné LK10 — lk10-deco-noel.js : DÉCO DE NOËL (version 2, dessins détaillés)
   • Haut de l'écran : guirlande de sapin avec lumières qui clignotent, baies, nœuds rouges et boules qui se balancent ; bonnet sur le logo.
   • Neige douce en plusieurs plans (flocons nets au loin, gros flocons flous devant, cristaux qui tournent) ; traîneau du Père Noël
     et étoile filante qui traversent le ciel de temps en temps ; petit sapin + cadeaux à gauche, bonhomme de neige + cadeaux à droite.
   • Juste avant le pied de page : le VILLAGE DE NOËL (chalets, forêt, grand sapin, lutin, Père Noël, bonhomme de neige, Reine des neiges,
     cadeaux, cannes en sucre) avec le petit train qui passe sur sa voie.
   • Sur télé / mouvement réduit : décors fixes seulement (pas de neige, traîneau ni train).
   Ce fichier est chargé par lk10-deco.js (bouton Déco de l'admin). À ajouter dans index.html AVANT lk10-deco.js :
   <script src="lk10-deco-noel.js"></script> */
(function () {
  'use strict';
/* ====== DESSINS (SVG) : version 2, avec dégradés, ombres et détails ====== */
var _n = 0;
function U(p) { return 'dn' + p + (++_n); }
function ST(a) { return a.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join(''); }
function LG(id, a, x1, y1, x2, y2) { return '<linearGradient id="' + id + '" x1="' + (x1 || 0) + '" y1="' + (y1 || 0) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + ST(a) + '</linearGradient>'; }
function RG(id, a, cx, cy, r, fx, fy) { return '<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + (fx != null ? ' fx="' + fx + '" fy="' + fy + '"' : '') + '>' + ST(a) + '</radialGradient>'; }
function SV(vb, defs, inner, cls) { return '<svg viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg"' + (cls ? ' class="' + cls + '"' : '') + '><defs>' + defs + '</defs>' + inner + '</svg>'; }
function hx(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
function shade(c, k) { var a = hx(c).map(function (v) { v = k >= 0 ? v + (255 - v) * k : v * (1 + k); v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }); return '#' + a.join(''); }

/* ---------- Sapin ---------- */
function tierPath(cx, y0, y1, hw, k) {
  var d = 'M' + cx + ' ' + y0 + ' Q' + (cx + hw * .42) + ' ' + (y0 + (y1 - y0) * .55) + ' ' + (cx + hw) + ' ' + (y1 - 8), i, x1, xm;
  for (i = 0; i < k; i++) { x1 = cx + hw - 2 * hw * (i + 1) / k; xm = cx + hw - 2 * hw * (i + .5) / k; d += ' Q' + xm.toFixed(1) + ' ' + (y1 + 13) + ' ' + x1.toFixed(1) + ' ' + (y1 - 8); }
  return d + ' Q' + (cx - hw * .42) + ' ' + (y0 + (y1 - y0) * .55) + ' ' + cx + ' ' + y0 + 'Z';
}
function scallopLine(cx, y1, hw, k) {
  var d = 'M' + (cx + hw) + ' ' + (y1 - 8), i, x1, xm;
  for (i = 0; i < k; i++) { x1 = cx + hw - 2 * hw * (i + 1) / k; xm = cx + hw - 2 * hw * (i + .5) / k; d += ' Q' + xm.toFixed(1) + ' ' + (y1 + 13) + ' ' + x1.toFixed(1) + ' ' + (y1 - 8); }
  return d;
}
function tree() {
  var g = U('tg'), tr = U('tr'), gl = U('gl'), st = U('st'), sh = U('sh');
  var bc = [['#ff6b6b', '#c0182b'], ['#ffe27a', '#d89b00'], ['#7cc4ff', '#1e63c8'], ['#d6a6ff', '#7a2fc2']], bb = '';
  var defs = LG(g, [[0, '#3fbf66'], [.5, '#1f8c45'], [1, '#0d5128']]) + LG(tr, [[0, '#8a5a2b'], [1, '#4d2f14']], 0, 0, 1, 0) +
    RG(gl, [[0, '#fff6c2', 1], [.35, '#ffd86b', .75], [1, '#ffb300', 0]], .5, .5, .5) + LG(st, [[0, '#fff7b0'], [1, '#ffb400']], 0, 0, 1, 1) +
    RG(sh, [[0, '#000', .35], [1, '#000', 0]], .5, .5, .5);
  bc.forEach(function (c, i) { var id = U('b'); defs += RG(id, [[0, c[0]], [1, c[1]]], .35, .3, .75); bb += id + ','; });
  var ids = bb.split(',');
  var tiers = [[140, 262, 88, 6], [98, 214, 72, 5], [58, 164, 56, 4], [28, 112, 40, 3]], o = '';
  o += '<ellipse cx="100" cy="292" rx="78" ry="9" fill="url(#' + sh + ')"/><rect x="88" y="256" width="24" height="34" rx="3" fill="url(#' + tr + ')"/>';
  tiers.forEach(function (t) {
    o += '<path d="' + tierPath(100, t[0], t[1], t[2], t[3]) + '" fill="url(#' + g + ')" stroke="#0a3d1d" stroke-width="1.2"/>';
    o += '<path d="' + scallopLine(100, t[1], t[2], t[3]) + '" fill="none" stroke="#fff" stroke-opacity=".92" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="14 9"/>';
    o += '<path d="M' + (100 - t[2] * .5) + ' ' + (t[0] + (t[1] - t[0]) * .62) + ' Q100 ' + (t[0] + (t[1] - t[0]) * .62 - 10) + ' ' + (100 + t[2] * .5) + ' ' + (t[0] + (t[1] - t[0]) * .62) + '" fill="none" stroke="#fff" stroke-opacity=".10" stroke-width="10" stroke-linecap="round"/>';
  });
  /* guirlandes lumineuses */
  var lc = ['#fff1a8', '#ff8a8a', '#8ad8ff', '#a8ffb8', '#ffd1f0'], li = 0;
  tiers.forEach(function (t, ti) {
    var y = t[0] + (t[1] - t[0]) * .66, hw = t[2] * .72, sag = 16 + ti * 2, x0 = 100 - hw, x1 = 100 + hw;
    o += '<path d="M' + x0 + ' ' + y + ' Q100 ' + (y + sag * 2) + ' ' + x1 + ' ' + y + '" fill="none" stroke="#d9a400" stroke-width="1.4" opacity=".8"/>';
    for (var k = 0; k < 6; k++) {
      var s = (k + .5) / 6, px = (1 - s) * (1 - s) * x0 + 2 * s * (1 - s) * 100 + s * s * x1, py = (1 - s) * (1 - s) * y + 2 * s * (1 - s) * (y + sag * 2) + s * s * y;
      o += '<circle class="dc-tw t' + (li % 3) + '" cx="' + px.toFixed(1) + '" cy="' + (py + 3).toFixed(1) + '" r="7" fill="url(#' + gl + ')"/><circle cx="' + px.toFixed(1) + '" cy="' + (py + 3).toFixed(1) + '" r="2.4" fill="' + lc[li % 5] + '"/>';
      li++;
    }
  });
  /* boules */
  [[74, 108, 0, 7], [128, 118, 1, 7], [100, 82, 2, 6], [66, 168, 3, 8], [136, 176, 0, 8], [96, 150, 1, 8], [58, 226, 2, 9], [146, 232, 3, 9], [102, 214, 0, 9], [80, 60, 1, 5.5], [118, 58, 3, 5.5]].forEach(function (b) {
    o += '<rect x="' + (b[0] - 2) + '" y="' + (b[1] - b[3] - 3) + '" width="4" height="4" fill="#d9a400"/><circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[3] + '" fill="url(#' + ids[b[2]] + ')" stroke="rgba(0,0,0,.25)" stroke-width=".6"/><circle cx="' + (b[0] - b[3] * .35) + '" cy="' + (b[1] - b[3] * .38) + '" r="' + (b[3] * .22) + '" fill="#fff" opacity=".85"/>';
  });
  /* étoile */
  o += '<circle class="dc-tw" cx="100" cy="22" r="34" fill="url(#' + gl + ')"/><polygon class="dc-star" points="100,0 106,15 122,15 109,25 114,41 100,31 86,41 91,25 78,15 94,15" fill="url(#' + st + ')" stroke="#d98e00" stroke-width="1.3" stroke-linejoin="round"/>';
  return SV('0 0 200 300', defs, o);
}

/* ---------- Cadeau ---------- */
function gift(c, r) {
  var a = U('ga'), b = U('gb'), sh = U('gs');
  var defs = LG(a, [[0, shade(c, .22)], [1, shade(c, -.18)]], 0, 0, 1, 1) + LG(b, [[0, shade(r, .3)], [1, shade(r, -.12)]], 0, 0, 1, 0) + RG(sh, [[0, '#000', .35], [1, '#000', 0]], .5, .5, .5);
  var o = '<ellipse cx="32" cy="60" rx="28" ry="4.5" fill="url(#' + sh + ')"/>' +
    '<rect x="6" y="26" width="52" height="32" rx="3" fill="url(#' + a + ')"/><rect x="3" y="18" width="58" height="13" rx="3" fill="url(#' + a + ')" stroke="rgba(0,0,0,.18)"/>' +
    '<rect x="8" y="30" width="5" height="25" rx="2" fill="#fff" opacity=".18"/>' +
    '<rect x="27" y="18" width="10" height="40" fill="url(#' + b + ')"/><rect x="3" y="21" width="58" height="5" fill="url(#' + b + ')" opacity=".0"/>' +
    '<path d="M32 18 C12 -4 -2 14 27 19Z" fill="url(#' + b + ')" stroke="rgba(0,0,0,.2)" stroke-width=".8"/><path d="M32 18 C52 -4 66 14 37 19Z" fill="url(#' + b + ')" stroke="rgba(0,0,0,.2)" stroke-width=".8"/>' +
    '<path d="M24 14 C18 6 12 8 14 12" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/><circle cx="32" cy="17" r="5" fill="url(#' + b + ')" stroke="rgba(0,0,0,.2)" stroke-width=".8"/>';
  return SV('0 -4 64 68', defs, o);
}

/* ---------- Canne en sucre ---------- */
function cane() {
  var p = U('cp'), sh = U('cs'), d = 'M30 108V38A12 12 0 0 0 6 38';
  var defs = '<pattern id="' + p + '" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="16" height="16" fill="#fff"/><rect width="8" height="16" fill="#e0262f"/></pattern>' + RG(sh, [[0, '#000', .3], [1, '#000', 0]], .5, .5, .5);
  var o = '<ellipse cx="26" cy="110" rx="20" ry="4" fill="url(#' + sh + ')"/><path d="' + d + '" fill="none" stroke="#9f1219" stroke-width="14.5" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="url(#' + p + ')" stroke-width="11.5"/>' +
    '<path d="M27.2 104V38A9 9 0 0 0 9 38" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M30 62 C18 50 12 66 28 64Z M30 62 C42 50 48 66 32 64Z" fill="#2da44e" stroke="#13692c" stroke-width=".8"/><circle cx="30" cy="63" r="3.4" fill="#e63946"/>' +
    '<path d="M30 64 L22 84 M30 64 L38 84" stroke="#2da44e" stroke-width="3" stroke-linecap="round"/>';
  return SV('0 0 44 116', defs, o);
}


/* ---------- Bonhomme de neige ---------- */
function snowman() {
  var b = U('sb'), nose = U('sn'), hat = U('sh'), sc = U('ss'), sh = U('sd');
  var defs = RG(b, [[0, '#ffffff'], [.6, '#e4eefa'], [1, '#a9c0da']], .34, .3, .8) + LG(nose, [[0, '#ffb347'], [1, '#e8661a']], 0, 0, 1, 0) + LG(hat, [[0, '#3a3a44'], [1, '#101014']], 0, 0, 1, 0) +
    '<pattern id="' + sc + '" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#d62828"/><rect width="7" height="14" fill="#fff"/></pattern>' + RG(sh, [[0, '#000', .3], [1, '#000', 0]], .5, .5, .5);
  var o = '<ellipse cx="75" cy="214" rx="56" ry="8" fill="url(#' + sh + ')"/>' +
    '<path d="M36 108 Q16 100 6 74 M20 94 L8 98 M13 82 L20 74" stroke="#5a3a1c" stroke-width="5" stroke-linecap="round" fill="none"/>' +
    '<path d="M114 108 Q136 104 146 80 M132 100 L144 104 M141 88 L136 78" stroke="#5a3a1c" stroke-width="5" stroke-linecap="round" fill="none"/>' +
    '<circle cx="75" cy="160" r="52" fill="url(#' + b + ')"/><circle cx="75" cy="102" r="38" fill="url(#' + b + ')"/><circle cx="75" cy="52" r="29" fill="url(#' + b + ')"/>';
  [112, 132, 152].forEach(function (y) { o += '<circle cx="75" cy="' + y + '" r="4.2" fill="#1b1b1f"/><circle cx="73.6" cy="' + (y - 1.4) + '" r="1.2" fill="#fff" opacity=".6"/>'; });
  o += '<circle cx="64" cy="50" r="3.8" fill="#1b1b1f"/><circle cx="86" cy="50" r="3.8" fill="#1b1b1f"/><circle cx="63" cy="48.6" r="1.2" fill="#fff"/><circle cx="85" cy="48.6" r="1.2" fill="#fff"/>' +
    '<circle cx="58" cy="60" r="6" fill="#ff8aa0" opacity=".38"/><circle cx="92" cy="60" r="6" fill="#ff8aa0" opacity=".38"/>' +
    '<path d="M75 56 L112 62 L75 66Z" fill="url(#' + nose + ')"/><path d="M82 59 L100 61.4 M82 62 L98 63.4" stroke="#b34a10" stroke-width=".9"/>';
  for (var i = 0; i < 7; i++) { var t = i / 6, x = 60 + t * 30, y = 68 + Math.sin(t * Math.PI) * 6; o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="1.9" fill="#1b1b1f"/>'; }
  o += '<path d="M44 84 Q75 98 106 84 L106 98 Q75 112 44 98Z" fill="url(#' + sc + ')" stroke="#8d1717" stroke-width="1"/>' +
    '<path d="M92 96 Q102 120 94 142 L108 146 Q118 120 106 94Z" fill="url(#' + sc + ')" stroke="#8d1717" stroke-width="1"/><path d="M94 142 L108 146 M96 140 l-3 8 M101 142 l-2 8 M106 144 l-1 8" stroke="#b02020" stroke-width="1.4" stroke-linecap="round"/>' +
    '<ellipse cx="75" cy="30" rx="38" ry="8" fill="#14141a"/><path d="M52 28 L54 -6 Q75 -14 96 -6 L98 28Z" fill="url(#' + hat + ')"/><path d="M52.6 14 Q75 22 97.4 14 L98 26 Q75 34 52 26Z" fill="#d62828"/>' +
    '<path d="M86 22 C80 14 90 12 90 20Z M92 24 C98 16 104 22 96 26Z" fill="#2da44e" stroke="#13692c" stroke-width=".6"/><circle cx="90" cy="24" r="2.6" fill="#e63946"/><circle cx="94" cy="26" r="2.6" fill="#e63946"/>' +
    '<ellipse cx="75" cy="29" rx="38" ry="3" fill="#fff" opacity=".12"/>';
  return SV('0 -16 150 238', defs, o);
}

/* ---------- Père Noël ---------- */
function santa() {
  var coat = U('sc'), fur = U('sf'), skin = U('sk'), gold = U('sg'), sh = U('sd'), boot = U('sb');
  var defs = LG(coat, [[0, '#f0414a'], [1, '#a8101c']], 0, 0, 1, 1) + LG(fur, [[0, '#ffffff'], [1, '#dfe8f2']]) + LG(skin, [[0, '#ffe0c2'], [1, '#f0ac84']], 0, 0, 0, 1) +
    LG(gold, [[0, '#fff0a0'], [1, '#d8a000']], 0, 0, 1, 1) + RG(sh, [[0, '#000', .32], [1, '#000', 0]], .5, .5, .5) + LG(boot, [[0, '#3b3b44'], [1, '#0e0e12']]);
  var o = '<ellipse cx="65" cy="192" rx="50" ry="7" fill="url(#' + sh + ')"/>' +
    '<rect x="36" y="168" width="24" height="22" rx="7" fill="url(#' + boot + ')"/><rect x="70" y="168" width="24" height="22" rx="7" fill="url(#' + boot + ')"/><rect x="34" y="184" width="28" height="6" rx="3" fill="#050507"/><rect x="68" y="184" width="28" height="6" rx="3" fill="#050507"/>' +
    '<path d="M28 100 Q22 150 34 176 L96 176 Q108 150 102 100Z" fill="url(#' + coat + ')"/>' +
    '<path d="M24 62 Q65 46 106 62 L104 118 L26 118Z" fill="url(#' + coat + ')"/>' +
    '<g class="dc-wave" style="transform-origin:96px 70px"><path d="M98 70 Q124 60 120 34" fill="none" stroke="#bf1a26" stroke-width="19" stroke-linecap="round"/><circle cx="120" cy="36" r="10.5" fill="url(#' + fur + ')"/><circle cx="120" cy="24" r="8.4" fill="#17171c"/></g>' +
    '<path d="M32 70 Q14 94 20 122" fill="none" stroke="#bf1a26" stroke-width="19" stroke-linecap="round"/><circle cx="21" cy="122" r="10.5" fill="url(#' + fur + ')"/><circle cx="21" cy="133" r="8.4" fill="#17171c"/>' +
    '<rect x="60" y="62" width="11" height="116" rx="5.5" fill="url(#' + fur + ')"/>' +
    '<path d="M27 172 q4 -8 10 0 q5 -8 10 0 q5 -8 10 0 q5 -8 10 0 q5 -8 10 0 q5 -8 10 0 q5 -8 10 0 q3 -6 6 0 L103 184 L28 184Z" fill="url(#' + fur + ')"/><rect x="28" y="172" width="76" height="12" rx="6" fill="url(#' + fur + ')"/>' +
    '<rect x="26" y="118" width="78" height="15" rx="2" fill="#17171c"/><rect x="55" y="115" width="20" height="21" rx="3" fill="url(#' + gold + ')"/><rect x="60" y="120" width="10" height="11" rx="1.5" fill="#17171c"/>' +
    /* barbe, visage, moustache */
    '<ellipse cx="65" cy="86" rx="35" ry="34" fill="url(#' + fur + ')"/>';
  [[34, 92], [42, 106], [54, 114], [65, 117], [76, 114], [88, 106], [96, 92]].forEach(function (p) { o += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="url(#' + fur + ')"/>'; });
  o += '<ellipse cx="65" cy="58" rx="22" ry="21" fill="url(#' + skin + ')"/>' +
    '<path d="M53 54 Q58 48 63 54 M67 54 Q72 48 77 54" fill="none" stroke="#3a2a22" stroke-width="2.6" stroke-linecap="round"/>' +
    '<path d="M49 46 Q57 40 64 45 M66 45 Q73 40 81 46" fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round"/>' +
    '<circle cx="50" cy="63" r="5.6" fill="#ff8f93" opacity=".6"/><circle cx="80" cy="63" r="5.6" fill="#ff8f93" opacity=".6"/><circle cx="65" cy="63" r="7" fill="#f58a86"/><circle cx="63" cy="61" r="2" fill="#fff" opacity=".5"/>' +
    '<path d="M65 68 Q40 64 35 79 Q50 88 65 74Z" fill="url(#' + fur + ')" stroke="#d3deea" stroke-width=".8"/><path d="M65 68 Q90 64 95 79 Q80 88 65 74Z" fill="url(#' + fur + ')" stroke="#d3deea" stroke-width=".8"/>' +
    '<path d="M59 86 Q65 95 71 86Z" fill="#b8323a"/>' +
    '<path d="M42 40 C38 6 66 -8 94 6 C108 12 114 28 110 46 C102 34 92 28 84 28 Z" fill="url(#' + coat + ')"/><path d="M106 40 Q118 44 120 56" fill="none" stroke="#bf1a26" stroke-width="10" stroke-linecap="round"/><circle cx="120" cy="60" r="9" fill="url(#' + fur + ')"/>' +
    '<rect x="40" y="30" width="54" height="15" rx="7.5" fill="url(#' + fur + ')"/>';
  return SV('0 -8 134 204', defs, o);
}

/* ---------- Lutin ---------- */
function elf() {
  var tun = U('et'), skin = U('ek'), hat = U('eh'), gold = U('eg'), sh = U('ed'), st = U('es'), sk = U('eo');
  var defs = LG(tun, [[0, '#3fc46a'], [1, '#16803a']], 0, 0, 1, 1) + LG(skin, [[0, '#ffe3c8'], [1, '#f2b48c']]) + LG(hat, [[0, '#46c96f'], [1, '#14793a']], 0, 0, 1, 1) + LG(gold, [[0, '#fff0a0'], [1, '#d8a000']], 0, 0, 1, 1) +
    RG(sh, [[0, '#000', .3], [1, '#000', 0]], .5, .5, .5) + '<pattern id="' + st + '" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#fff"/><rect width="14" height="7" fill="#e0262f"/></pattern>';
  var o = '<ellipse cx="50" cy="166" rx="38" ry="6" fill="url(#' + sh + ')"/>' +
    '<rect x="32" y="122" width="14" height="38" rx="6" fill="url(#' + st + ')"/><rect x="54" y="122" width="14" height="38" rx="6" fill="url(#' + st + ')"/>' +
    '<path d="M22 164 Q20 150 36 152 L46 154 Q44 168 28 168Z" fill="url(#' + gold + ')"/><path d="M22 164 Q14 158 18 150" fill="none" stroke="#d8a000" stroke-width="4" stroke-linecap="round"/><circle cx="18" cy="149" r="3.4" fill="#e63946"/>' +
    '<path d="M78 164 Q80 150 64 152 L54 154 Q56 168 72 168Z" fill="url(#' + gold + ')"/><path d="M78 164 Q86 158 82 150" fill="none" stroke="#d8a000" stroke-width="4" stroke-linecap="round"/><circle cx="82" cy="149" r="3.4" fill="#e63946"/>' +
    '<path d="M24 84 L76 84 L82 128 L74 124 L68 130 L60 124 L50 130 L40 124 L32 130 L26 124 L18 128Z" fill="url(#' + tun + ')"/><path d="M18 128 L26 124 L32 130 L40 124 L50 130 L60 124 L68 130 L74 124 L82 128 L82 133 L18 133Z" fill="#fff" opacity=".92"/>' +
    '<rect x="22" y="108" width="56" height="8" fill="#9c1d25"/><rect x="43" y="105" width="14" height="14" rx="2" fill="url(#' + gold + ')"/>' +
    '<path d="M26 88 Q10 100 18 112" fill="none" stroke="#22a64e" stroke-width="12" stroke-linecap="round"/><circle cx="19" cy="114" r="6.4" fill="url(#' + skin + ')"/>' +
    '<g class="dc-wave" style="transform-origin:74px 90px"><path d="M74 88 Q92 80 88 60" fill="none" stroke="#22a64e" stroke-width="12" stroke-linecap="round"/><circle cx="88" cy="58" r="6.4" fill="url(#' + skin + ')"/></g>' +
    '<path d="M34 82 L40 90 L46 82 L50 90 L54 82 L60 90 L66 82 L64 78 L36 78Z" fill="#fff"/>' +
    '<path d="M30 52 L10 40 Q12 58 30 62Z M70 52 L90 40 Q88 58 70 62Z" fill="url(#' + skin + ')" stroke="#d99a72" stroke-width="1"/>' +
    '<circle cx="50" cy="56" r="24" fill="url(#' + skin + ')"/><circle cx="41" cy="54" r="5.2" fill="#fff"/><circle cx="59" cy="54" r="5.2" fill="#fff"/><circle cx="42" cy="55" r="3" fill="#2a2018"/><circle cx="58" cy="55" r="3" fill="#2a2018"/><circle cx="43" cy="53.6" r="1" fill="#fff"/><circle cx="59" cy="53.6" r="1" fill="#fff"/>' +
    '<path d="M36 46 Q41 42 46 45 M54 45 Q59 42 64 46" fill="none" stroke="#7a4a22" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="61" r="3.4" fill="#f59a8c"/><circle cx="35" cy="63" r="5" fill="#ff8f93" opacity=".5"/><circle cx="65" cy="63" r="5" fill="#ff8f93" opacity=".5"/><path d="M42 68 Q50 77 58 68Z" fill="#a8323a"/>' +
    '<path d="M26 44 C30 12 56 2 76 8 C90 12 98 24 96 42 C90 32 80 28 70 28 L28 42Z" fill="url(#' + hat + ')"/><path d="M84 18 Q96 14 94 30" fill="none" stroke="#22a64e" stroke-width="9" stroke-linecap="round"/><circle cx="95" cy="34" r="5.6" fill="url(#' + gold + ')" stroke="#a87a00" stroke-width=".8"/><circle cx="95" cy="35" r="1.4" fill="#7a5600"/>' +
    '<rect x="24" y="38" width="52" height="10" rx="5" fill="#fff"/><rect x="24" y="43" width="52" height="5" rx="2.5" fill="#e0262f" opacity=".9"/>';
  return SV('0 0 110 174', defs, o);
}

/* ---------- Reine des neiges ---------- */
function queen() {
  var gown = U('qg'), cape = U('qc'), hair = U('qh'), skin = U('qk'), ice = U('qi'), gl = U('ql'), sh = U('qs');
  var defs = LG(gown, [[0, '#ffffff'], [.45, '#cfeaff'], [1, '#5fb0ff']]) + LG(cape, [[0, '#bfe2ff', .75], [1, '#8fb8ff', .12]], 0, 0, 1, 1) + LG(hair, [[0, '#ffffff'], [1, '#cfe0f5']], 0, 0, 1, 1) +
    LG(skin, [[0, '#fff0e2'], [1, '#f2c9ac']]) + LG(ice, [[0, '#f4fcff'], [1, '#6cc0ff']]) + RG(gl, [[0, '#ffffff', 1], [.4, '#aee0ff', .7], [1, '#7cc4ff', 0]], .5, .5, .5) + RG(sh, [[0, '#000', .28], [1, '#000', 0]], .5, .5, .5);
  var o = '<ellipse cx="60" cy="214" rx="50" ry="6" fill="url(#' + sh + ')"/>' +
    '<path d="M44 72 Q-8 130 4 210 L60 200 L116 210 Q128 130 76 72Z" fill="url(#' + cape + ')"/>' +
    '<path d="M46 66 L74 66 L72 108 L48 108Z" fill="url(#' + gown + ')"/>' +
    '<path d="M48 104 Q12 150 10 210 L110 210 Q108 150 72 104Z" fill="url(#' + gown + ')"/>' +
    '<path d="M10 210 q6 -8 12 0 q6 -8 12 0 q6 -8 12 0 q6 -8 12 0 q6 -8 12 0 q6 -8 12 0 q6 -8 12 0 q6 -8 12 0 L110 214 L10 214Z" fill="#fff" opacity=".9"/>' +
    '<path d="M60 112 L60 190 M44 150 L76 150 M48 134 L72 166 M72 134 L48 166" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>' +
    '<path d="M46 66 Q60 76 74 66" fill="none" stroke="#fff" stroke-width="2.2"/><circle cx="60" cy="76" r="3.4" fill="url(#' + ice + ')" stroke="#fff" stroke-width=".8"/>' +
    '<path d="M46 72 Q32 96 36 120" fill="none" stroke="#f2c9ac" stroke-width="7" stroke-linecap="round"/><path d="M44 70 Q28 92 32 116" fill="none" stroke="#dff2ff" stroke-width="10" stroke-linecap="round" opacity=".55"/>' +
    '<path d="M74 72 Q96 60 102 40" fill="none" stroke="#f2c9ac" stroke-width="7" stroke-linecap="round"/><path d="M74 70 Q98 58 104 38" fill="none" stroke="#dff2ff" stroke-width="10" stroke-linecap="round" opacity=".55"/>' +
    '<g style="transform-origin:104px 22px" class="dc-spin"><circle cx="104" cy="22" r="26" fill="url(#' + gl + ')"/><g stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M104 8 V36 M92 15 L116 29 M92 29 L116 15"/></g><g stroke="#aee0ff" stroke-width="1.4" stroke-linecap="round"><path d="M104 8 l-3 -4 M104 8 l3 -4 M104 36 l-3 4 M104 36 l3 4 M92 15 l-5 0 M92 15 l1 -5 M116 29 l5 0 M116 29 l-1 5 M92 29 l-5 0 M92 29 l1 5 M116 15 l5 0 M116 15 l-1 -5"/></g></g>' +
    '<path d="M54 62 L66 62 L65 70 L55 70Z" fill="url(#' + skin + ')"/>' +
    '<path d="M42 40 Q40 18 60 16 Q80 18 78 40 Q70 28 60 28 Q50 28 42 40Z" fill="url(#' + hair + ')"/>' +
    '<circle cx="60" cy="44" r="17" fill="url(#' + skin + ')"/>' +
    '<path d="M42 38 Q40 30 46 26 Q60 34 74 26 Q80 30 78 38 Q70 28 60 30 Q50 28 42 38Z" fill="url(#' + hair + ')"/>' +
    '<path d="M44 44 Q36 60 40 80 Q34 96 38 120 Q40 140 36 150" fill="none" stroke="url(#' + hair + ')" stroke-width="12" stroke-linecap="round"/><path d="M42 74 l6 4 M40 92 l7 3 M40 110 l7 3 M39 128 l7 3" stroke="#a9c3e0" stroke-width="1.6" stroke-linecap="round"/><path d="M33 152 l-4 10 l8 -3 l5 8 l1 -10z" fill="url(#' + ice + ')" stroke="#fff" stroke-width=".7"/>' +
    '<circle cx="53" cy="44" r="3.6" fill="#fff"/><circle cx="67" cy="44" r="3.6" fill="#fff"/><circle cx="53.4" cy="44.4" r="2.3" fill="#3d86d6"/><circle cx="67.4" cy="44.4" r="2.3" fill="#3d86d6"/><circle cx="52.8" cy="43.6" r=".9" fill="#fff"/><circle cx="66.8" cy="43.6" r=".9" fill="#fff"/>' +
    '<path d="M48 38 Q53 35 57 38 M63 38 Q67 35 72 38" fill="none" stroke="#9fb4cc" stroke-width="1.6" stroke-linecap="round"/><path d="M55 54 Q60 58 65 54" fill="none" stroke="#e0607e" stroke-width="2" stroke-linecap="round"/><circle cx="49" cy="52" r="3.6" fill="#ff9aa8" opacity=".45"/><circle cx="71" cy="52" r="3.6" fill="#ff9aa8" opacity=".45"/>' +
    '<path d="M42 30 L45 10 L52 24 L60 0 L68 24 L75 10 L78 30 Q60 36 42 30Z" fill="url(#' + ice + ')" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/><circle cx="60" cy="24" r="3.4" fill="#fff"/><circle class="dc-tw" cx="60" cy="24" r="8" fill="url(#' + gl + ')"/>';
  return SV('0 -4 136 222', defs, o);
}

function pineTier(cx, y0, y1, hw, k) { var d = 'M' + cx + ' ' + y0 + ' L' + (cx + hw) + ' ' + (y1 - 6), i, x1, xm; for (i = 0; i < k; i++) { x1 = cx + hw - 2 * hw * (i + 1) / k; xm = cx + hw - 2 * hw * (i + .5) / k; d += ' Q' + xm.toFixed(1) + ' ' + (y1 + 9) + ' ' + x1.toFixed(1) + ' ' + (y1 - 6); } return d + ' Z'; }

/* ---------- Sapin de décor (forêt) ---------- */
function pine(c1, c2) {
  var g = U('pg'), defs = LG(g, [[0, c1], [1, c2]]);
  var o = '<rect x="32" y="116" width="8" height="16" fill="#4d2f14"/>';
  [[60, 128, 32, 4], [34, 96, 26, 4], [10, 64, 20, 3]].forEach(function (t) { o += '<path d="' + pineTier(36, t[0] - 50, t[1], t[2], t[3]) + '" fill="url(#' + g + ')"/>'; });
  o += '<path d="M36 6 L24 40 Q36 34 48 40Z" fill="#fff" opacity=".85"/><path d="M36 44 L18 82 Q36 74 54 82Z" fill="#fff" opacity=".6"/><path d="M36 84 L12 122 Q36 112 60 122Z" fill="#fff" opacity=".5"/>';
  return SV('0 0 72 134', defs, o);
}

/* Renne au galop : (0,0) = arrière du corps ; ~210 de long */
function deer3(x, y, sc, nose, ids) {
  var o = '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">';
  /* pattes arrière (derrière le corps) */
  o += '<path d="M30 74 C14 86 4 98 -8 100" fill="none" stroke="#5a3417" stroke-width="10" stroke-linecap="round"/><path d="M50 78 C40 96 30 108 18 112" fill="none" stroke="#6a3f1c" stroke-width="10" stroke-linecap="round"/>' +
    '<ellipse cx="-10" cy="102" rx="7" ry="4" fill="#1d1208" transform="rotate(-20 -10 102)"/><ellipse cx="16" cy="114" rx="7" ry="4" fill="#1d1208" transform="rotate(-25 16 114)"/>';
  /* pattes avant tendues */
  o += '<path d="M122 74 C142 84 156 84 170 78" fill="none" stroke="#5a3417" stroke-width="9" stroke-linecap="round"/><path d="M108 80 C126 98 142 100 156 98" fill="none" stroke="#6a3f1c" stroke-width="9" stroke-linecap="round"/>' +
    '<ellipse cx="173" cy="77" rx="6.5" ry="4" fill="#1d1208" transform="rotate(-16 173 77)"/><ellipse cx="159" cy="98" rx="6.5" ry="4" fill="#1d1208" transform="rotate(-8 159 98)"/>';
  /* corps */
  o += '<path d="M6 64 C4 40 34 26 74 28 C110 30 132 36 140 54 C136 76 114 86 84 86 C46 88 8 90 6 64Z" fill="url(#' + ids.b + ')"/>' +
    '<path d="M16 44 C40 32 90 30 128 42" fill="none" stroke="#6a3f1c" stroke-width="5" stroke-linecap="round" opacity=".55"/>' +
    '<path d="M40 82 C70 92 110 90 128 70 C112 80 70 84 40 82Z" fill="#f6e8d2"/>' +
    '<path d="M8 52 Q-6 46 -2 36 Q8 38 14 46Z" fill="#fff"/>';
  /* cou et tête */
  o += '<path d="M118 44 C134 28 146 16 158 8 L180 22 C170 42 154 62 138 70Z" fill="url(#' + ids.b + ')"/>' +
    '<path d="M156 8 C168 -4 192 0 204 14 C210 22 208 30 198 32 C186 34 174 30 164 22Z" fill="url(#' + ids.b + ')"/><path d="M190 18 C200 14 210 20 208 28 C204 34 194 32 188 28Z" fill="#f6e8d2"/>' +
    '<path d="M162 6 L156 -8 C162 -4 168 -2 170 4Z" fill="#8a5a2b"/><circle cx="178" cy="14" r="3.2" fill="#1b1008"/><circle cx="177" cy="13" r="1.1" fill="#fff"/>' +
    '<circle cx="207" cy="21" r="5.2" fill="' + (nose ? '#ff2d2d' : '#2a1a10') + '"/>' + (nose ? '<circle cx="207" cy="21" r="16" fill="url(#' + ids.n + ')"/>' : '') + '<circle cx="205.6" cy="19.6" r="1.4" fill="#fff" opacity=".7"/>';
  /* bois */
  o += '<g fill="none" stroke="#efe2c8" stroke-width="3.6" stroke-linecap="round"><path d="M166 4 C162 -14 168 -28 160 -40 M164 -12 C154 -16 150 -24 144 -26 M166 -22 C176 -26 178 -34 186 -36 M168 -2 C180 -10 188 -20 196 -22"/><path d="M174 6 C176 -12 186 -22 190 -34 M182 -12 C190 -12 198 -20 202 -18"/></g>';
  /* harnais, bandeau rouge et grelots */
  o += '<path d="M126 38 C140 52 142 66 134 80" fill="none" stroke="#d62828" stroke-width="7" stroke-linecap="round"/><path d="M60 28 C64 44 64 66 58 86" fill="none" stroke="#d62828" stroke-width="5" opacity=".9"/>' +
    '<circle cx="138" cy="62" r="5.6" fill="#ffd24a" stroke="#b88700" stroke-width=".9"/><circle cx="62" cy="62" r="4.6" fill="#ffd24a" stroke="#b88700" stroke-width=".8"/>';
  return o + '</g>';
}
function sleigh() {
  var b = U('db'), n = U('dn'), r = U('sr'), r2 = U('sr2'), g = U('sg'), bag = U('bg'), tr = U('tr');
  var defs = LG(b, [[0, '#c28a52'], [1, '#7a4a22']], 0, 0, 0, 1) + RG(n, [[0, '#ff4a4a', .8], [1, '#ff2d2d', 0]], .5, .5, .5) + LG(r, [[0, '#f0414a'], [1, '#9c0f1c']], 0, 0, 1, 1) + LG(r2, [[0, '#c4181f'], [1, '#7c0a14']]) +
    LG(g, [[0, '#fff2a8'], [.5, '#f0c020'], [1, '#b88500']], 0, 0, 1, 1) + LG(bag, [[0, '#a8743a'], [1, '#5f3a17']], 0, 0, 1, 1) + LG(tr, [[0, '#fff', .9], [1, '#7cc4ff', 0]], 1, 0, 0, 0);
  var ids = { b: b, n: n }, o = '';
  /* traînée magique */
  o += '<path d="M0 170 Q80 138 230 158 L230 180 Q80 178 0 170Z" fill="url(#' + tr + ')" opacity=".75"/>';
  [[26, 168, 6], [60, 158, 4], [98, 166, 7], [140, 154, 4], [180, 162, 5], [214, 170, 4]].forEach(function (p, i) { o += '<path class="dc-tw t' + (i % 3) + '" transform="translate(' + p[0] + ' ' + p[1] + ') scale(' + (p[2] * .55) + ')" d="M0-6L1.6-1.6L6 0L1.6 1.6L0 6L-1.6 1.6L-6 0L-1.6-1.6z" fill="#fff"/>'; });
  /* rennes (le plus loin d'abord) */
  o += deer3(440, 44, .76, false, ids) + deer3(590, 30, .86, false, ids) + deer3(745, 14, .98, true, ids);
  /* brides */
  o += '<g fill="none" stroke="#f0c020" stroke-width="2.2"><path d="M452 78 C490 74 520 80 560 84"/><path d="M604 70 C650 68 690 72 722 78"/></g>';
  /* traîneau */
  o += '<g transform="translate(230 30)">' +
    '<path d="M0 128 C-14 128 -20 110 -8 100" fill="none" stroke="url(#' + g + ')" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M-6 130 L196 130 C214 130 226 118 224 98 C222 84 208 80 198 90" fill="none" stroke="url(#' + g + ')" stroke-width="7" stroke-linecap="round"/><path d="M34 130 L30 106 M100 130 L98 106 M164 130 L162 106" stroke="url(#' + g + ')" stroke-width="5" stroke-linecap="round"/>' +
    /* caisse */
    '<path d="M2 62 C-4 40 6 28 22 28 L170 28 C176 56 196 66 206 56 C212 82 204 108 178 112 L34 114 C12 114 6 92 2 62Z" fill="url(#' + r + ')"/>' +
    '<path d="M6 84 C60 96 150 96 200 82" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".9"/>' +
    '<path d="M14 54 C30 46 40 62 52 54 C64 46 72 62 84 54 C96 46 104 62 116 54 C128 46 138 62 150 54" fill="none" stroke="url(#' + g + ')" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M2 62 C-4 40 6 28 22 28 L40 28 C28 40 22 74 28 112 L34 114 C12 114 6 92 2 62Z" fill="url(#' + r2 + ')" opacity=".55"/>' +
    '<path d="M170 28 C196 22 214 30 214 52" fill="none" stroke="url(#' + g + ')" stroke-width="6" stroke-linecap="round"/><circle cx="214" cy="54" r="7" fill="url(#' + g + ')"/>' +
    /* sac de cadeaux */
    '<g><path d="M18 40 C4 8 36 -14 70 -6 C96 0 100 28 88 40Z" fill="url(#' + bag + ')" stroke="#3d230c" stroke-width="1.6"/><path d="M22 22 C40 14 68 14 86 24" fill="none" stroke="#3d230c" stroke-width="2" opacity=".6"/>' +
    '<path d="M44 -2 C48 -12 60 -12 62 -2" fill="none" stroke="#d62828" stroke-width="4" stroke-linecap="round"/>' +
    '<g transform="translate(28 -26)"><rect width="22" height="20" rx="2" fill="#2e86de"/><rect x="9" width="4" height="20" fill="#fff"/><path d="M11 0 C4 -8 -2 -2 9 0Z M11 0 C18 -8 24 -2 13 0Z" fill="#fff"/></g>' +
    '<g transform="translate(58 -34)"><rect width="22" height="22" rx="2" fill="#27ae60"/><rect x="9" width="4" height="22" fill="#ffd93b"/><path d="M11 0 C4 -8 -2 -2 9 0Z M11 0 C18 -8 24 -2 13 0Z" fill="#ffd93b"/></g></g>' +
    /* Père Noël assis */
    '<g transform="translate(116 -10)"><path d="M-18 70 C-24 38 -10 22 14 22 C38 22 52 40 48 70Z" fill="url(#' + r + ')"/><rect x="-20" y="62" width="70" height="13" rx="6.5" fill="#fff"/><rect x="2" y="48" width="38" height="8" fill="#17171c"/><rect x="14" y="46" width="14" height="12" rx="2" fill="url(#' + g + ')"/>' +
    '<g class="dc-wave" style="transform-origin:36px 36px"><path d="M36 38 Q58 30 56 6" fill="none" stroke="#bf1a26" stroke-width="13" stroke-linecap="round"/><circle cx="56" cy="2" r="8.5" fill="#17171c"/><circle cx="56" cy="10" r="7" fill="#fff"/></g>' +
    '<ellipse cx="14" cy="24" rx="19" ry="21" fill="#fff"/><circle cx="14" cy="14" r="15" fill="#ffd9b8"/><path d="M-2 18 Q14 6 30 18 Q22 12 14 14 Q6 12 -2 18Z" fill="#fff" opacity=".0"/>' +
    '<path d="M4 12 Q8 8 12 12 M16 12 Q20 8 24 12" fill="none" stroke="#3a2a22" stroke-width="2" stroke-linecap="round"/><path d="M0 7 Q6 2 13 6 M15 6 Q22 2 29 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><circle cx="14" cy="18" r="4.6" fill="#f58a86"/><circle cx="3" cy="18" r="3.6" fill="#ff8f93" opacity=".6"/><circle cx="25" cy="18" r="3.6" fill="#ff8f93" opacity=".6"/>' +
    '<path d="M14 22 Q-4 20 -6 30 Q4 38 14 28Z M14 22 Q32 20 34 30 Q24 38 14 28Z" fill="#fff" stroke="#d3deea" stroke-width=".7"/><path d="M-4 2 C-6 -20 14 -30 34 -18 C42 -12 42 0 38 8 C30 0 22 -2 12 0Z" fill="url(#' + r + ')"/><circle cx="42" cy="6" r="6.4" fill="#fff"/><rect x="-6" y="0" width="40" height="11" rx="5.5" fill="#fff"/></g>' +
    '</g>';
  /* rênes du Père Noël */
  
  return SV('-14 -60 980 250', defs, o);
}

/* ---------- Train ---------- */
function wheel(cx, cy, r, cls) { var s = ''; for (var i = 0; i < 4; i++) s += '<path d="M' + cx + ' ' + cy + ' L' + (cx + r * .86 * Math.cos(i * Math.PI / 4)).toFixed(1) + ' ' + (cy + r * .86 * Math.sin(i * Math.PI / 4)).toFixed(1) + ' M' + cx + ' ' + cy + ' L' + (cx - r * .86 * Math.cos(i * Math.PI / 4)).toFixed(1) + ' ' + (cy - r * .86 * Math.sin(i * Math.PI / 4)).toFixed(1) + '" stroke="#c8c8d0" stroke-width="1.6"/>'; return '<g class="dc-wheel" style="transform-origin:' + cx + 'px ' + cy + 'px"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#1f1f27" stroke="#d62828" stroke-width="2.4"/>' + s + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * .22) + '" fill="#ffd24a"/></g>'; }
function train() {
  var red = U('tr'), blk = U('tb'), gold = U('tg'), w1 = U('t1'), w2 = U('t2'), w3 = U('t3'), st = U('ts'), rg = U('tp');
  var defs = LG(red, [[0, '#f0414a'], [1, '#9c0f1c']]) + LG(blk, [[0, '#4a4a56'], [1, '#14141a']]) + LG(gold, [[0, '#fff0a0'], [1, '#d8a000']], 0, 0, 1, 1) + LG(w1, [[0, '#35c46a'], [1, '#157a3c']]) + LG(w2, [[0, '#4aa8ff'], [1, '#1b5fb8']]) + LG(w3, [[0, '#ffe27a'], [1, '#e0a400']]) +
    '<pattern id="' + st + '" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#fff"/><rect width="7" height="14" fill="#e0262f"/></pattern>';
  var o = '';
  /* wagons (de gauche à droite) : cadeaux, sapins, bonbons */
  function wagon(x, g, load) { return '<path d="M' + x + ' 96 H' + (x + 6) + '" stroke="#777" stroke-width="3"/><rect x="' + (x + 6) + '" y="58" width="112" height="40" rx="5" fill="url(#' + g + ')"/><rect x="' + (x + 6) + '" y="68" width="112" height="5" fill="#fff" opacity=".35"/><rect x="' + (x + 2) + '" y="96" width="120" height="7" rx="2" fill="url(#' + blk + ')"/><g transform="translate(' + x + ' 0)">' + load + '</g>' + wheel(x + 30, 112, 11) + wheel(x + 94, 112, 11); }
  var lg1 = '<g transform="translate(' + (0) + ' 0)">';
  o += wagon(6, w1, '<rect x="22" y="40" width="26" height="20" rx="2" fill="#d62828"/><rect x="33" y="40" width="4" height="20" fill="#ffd93b"/><rect x="54" y="34" width="24" height="26" rx="2" fill="#2e86de"/><rect x="64" y="34" width="4" height="26" fill="#fff"/><rect x="82" y="44" width="22" height="16" rx="2" fill="#8e44ad"/><rect x="91" y="44" width="4" height="16" fill="#ffd93b"/>');
  o += wagon(134, w2, '<path d="M36 60 L48 26 L60 60Z" fill="#1e8c46"/><path d="M42 60 L54 18 L66 60Z" fill="#27ae60"/><path d="M70 60 L80 30 L90 60Z" fill="#1e8c46"/><path d="M48 22 l2 4 l4 0 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 0z" fill="#ffd93b"/>');
  o += wagon(262, w3, '<path d="M24 60 V38 A9 9 0 0 1 42 38" fill="none" stroke="#e0262f" stroke-width="7"/><path d="M60 60 V40 A9 9 0 0 1 78 40" fill="none" stroke="#e0262f" stroke-width="7"/><path d="M96 60 V36 A9 9 0 0 1 114 36" fill="none" stroke="#e0262f" stroke-width="7"/><path d="M24 60 V38 A9 9 0 0 1 42 38" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="4 5"/>');
  /* tender + locomotive */
  o += '<path d="M382 96 H392" stroke="#777" stroke-width="3"/><rect x="392" y="62" width="64" height="36" rx="4" fill="url(#' + blk + ')"/><rect x="396" y="56" width="56" height="10" rx="3" fill="#2a2a32"/><circle cx="412" cy="54" r="7" fill="#5a3a1c"/><circle cx="428" cy="52" r="8" fill="#6a4524"/><circle cx="444" cy="55" r="7" fill="#5a3a1c"/>' + wheel(412, 112, 11) + wheel(440, 112, 11);
  o += '<rect x="456" y="30" width="46" height="68" rx="5" fill="url(#' + red + ')"/><rect x="450" y="24" width="58" height="9" rx="3" fill="url(#' + blk + ')"/><rect x="464" y="40" width="26" height="24" rx="3" fill="#bfe8ff" stroke="#2a2a32" stroke-width="3"/><path d="M477 40 V64" stroke="#2a2a32" stroke-width="2"/>' +
    '<rect x="496" y="46" width="88" height="44" rx="14" fill="url(#' + red + ')"/><rect x="552" y="46" width="32" height="44" rx="14" fill="url(#' + blk + ')"/><rect x="522" y="46" width="5" height="44" fill="url(#' + gold + ')"/><rect x="542" y="46" width="5" height="44" fill="url(#' + gold + ')"/>' +
    '<path d="M556 46 L562 18 L580 18 L586 46Z" fill="url(#' + blk + ')"/><rect x="552" y="12" width="38" height="8" rx="3" fill="url(#' + gold + ')"/><path d="M510 46 Q518 28 528 46Z" fill="url(#' + gold + ')"/><circle cx="584" cy="66" r="7" fill="#fff6b0"/><circle class="dc-tw" cx="584" cy="66" r="14" fill="#fff6b0" opacity=".35"/>' +
    '<path d="M588 92 L612 108 L588 108Z" fill="url(#' + blk + ')"/><rect x="470" y="92" width="130" height="8" rx="3" fill="url(#' + blk + ')"/>' + wheel(488, 112, 15) + wheel(526, 112, 15) + wheel(572, 114, 10) +
    '<path d="M488 112 H526" stroke="#c8c8d0" stroke-width="4"/>';
  /* fumée */
  o += '<g><circle class="dc-puff" cx="571" cy="8" r="9" fill="#eef3fa"/><circle class="dc-puff" style="animation-delay:-.55s" cx="571" cy="8" r="9" fill="#eef3fa"/><circle class="dc-puff" style="animation-delay:-1.1s" cx="571" cy="8" r="9" fill="#eef3fa"/></g>';
  return SV('0 -14 620 134', defs, o);
}

/* ---------- Chalet enneigé ---------- */
function cottage() {
  var wall = U('cw'), roof = U('cr'), win = U('cwi'), door = U('cd'), sh = U('cs'), snow = U('cn');
  var defs = LG(wall, [[0, '#a66a35'], [1, '#6b3f1c']]) + LG(roof, [[0, '#3a2a22'], [1, '#1c1410']]) + RG(win, [[0, '#fff2b0'], [1, '#ff9d2e']], .5, .5, .8) + LG(door, [[0, '#d63a3a'], [1, '#8f1a1a']]) + RG(sh, [[0, '#000', .3], [1, '#000', 0]], .5, .5, .5) + LG(snow, [[0, '#ffffff'], [1, '#cfe0f2']]);
  var o = '<ellipse cx="105" cy="170" rx="92" ry="9" fill="url(#' + sh + ')"/>' +
    '<rect x="150" y="30" width="22" height="46" fill="#8a3d2b"/><rect x="146" y="26" width="30" height="9" rx="2" fill="url(#' + snow + ')"/>' +
    '<rect x="28" y="84" width="150" height="82" fill="url(#' + wall + ')"/>';
  for (var i = 0; i < 6; i++) o += '<path d="M28 ' + (96 + i * 13) + ' H178" stroke="#4d2c12" stroke-width="1.2" opacity=".6"/>';
  o += '<path d="M14 90 L103 22 L192 90Z" fill="url(#' + roof + ')"/><path d="M10 92 Q22 70 38 80 Q54 60 72 64 Q88 40 103 30 Q118 40 134 64 Q152 60 168 80 Q184 70 196 92 Q186 86 178 92 Q168 86 160 92 Q150 86 142 92 L64 92 Q56 86 48 92 Q40 86 32 92 Q22 86 10 92Z" fill="url(#' + snow + ')"/>';
  for (i = 0; i < 12; i++) { var ix = 22 + i * 14; o += '<path d="M' + ix + ' 92 L' + (ix + 4) + ' ' + (92 + 8 + (i % 3) * 5) + ' L' + (ix + 8) + ' 92Z" fill="#e8f4ff" opacity=".9"/>'; }
  o += '<rect x="44" y="102" width="34" height="34" rx="2" fill="#3b2412"/><rect x="48" y="106" width="26" height="26" fill="url(#' + win + ')"/><path d="M61 106 V132 M48 119 H74" stroke="#3b2412" stroke-width="2.4"/><circle class="dc-tw" cx="61" cy="119" r="26" fill="url(#' + win + ')" opacity=".35"/>' +
    '<rect x="128" y="102" width="34" height="34" rx="2" fill="#3b2412"/><rect x="132" y="106" width="26" height="26" fill="url(#' + win + ')"/><path d="M145 106 V132 M132 119 H158" stroke="#3b2412" stroke-width="2.4"/>' +
    '<rect x="88" y="112" width="34" height="54" rx="3" fill="url(#' + door + ')"/><circle cx="116" cy="140" r="2.2" fill="#ffd24a"/><circle cx="105" cy="104" r="12" fill="none" stroke="#1e8c46" stroke-width="5"/><circle cx="105" cy="104" r="9" fill="none" stroke="#2da44e" stroke-width="2" stroke-dasharray="2 3"/><path d="M99 112 l6 -4 l6 4 l-3 6 l-6 0z" fill="#e63946"/>' +
    '<path d="M10 168 Q50 152 105 160 Q160 152 200 168Z" fill="url(#' + snow + ')"/>' +
    '<g><circle class="dc-puff" cx="161" cy="22" r="8" fill="#eef3fa"/><circle class="dc-puff" style="animation-delay:-.8s" cx="161" cy="22" r="8" fill="#eef3fa"/><circle class="dc-puff" style="animation-delay:-1.6s" cx="161" cy="22" r="8" fill="#eef3fa"/></g>';
  return SV('0 0 210 180', defs, o);
}


/* ---------- Bonnet du logo (dessin) ---------- */
function hat() {
  var r = U('hr'), f = U('hf'), sh = U('hs');
  var defs = LG(r, [[0, '#ff5a63'], [.6, '#d62832'], [1, '#8f0f1a']], 0, 0, 1, 1) + LG(f, [[0, '#ffffff'], [1, '#d9e4f0']]) + RG(sh, [[0, '#000', .35], [1, '#000', 0]], .5, .5, .5);
  var o = '<ellipse cx="32" cy="50" rx="26" ry="3.6" fill="url(#' + sh + ')"/>' +
    '<path d="M8 38 C8 12 28 0 46 8 C58 14 62 30 58 40Z" fill="url(#' + r + ')"/>' +
    '<path d="M16 34 C16 18 28 8 42 12" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M44 10 Q60 14 62 32" fill="none" stroke="#c4202b" stroke-width="9" stroke-linecap="round"/><circle cx="62" cy="36" r="7.4" fill="url(#' + f + ')"/><circle cx="60.6" cy="34.4" r="2.6" fill="#fff"/>' +
    '<g fill="url(#' + f + ')"><circle cx="9" cy="42" r="6"/><circle cx="17" cy="45" r="6.4"/><circle cx="26" cy="46" r="6.6"/><circle cx="35" cy="46" r="6.6"/><circle cx="44" cy="45" r="6.4"/><circle cx="52" cy="42" r="6"/><rect x="9" y="37" width="43" height="10" rx="4"/></g>';
  return SV('0 0 70 54', defs, o);
}

/* ====================== MOTEUR ====================== */
var de = document.documentElement;
function div(cls, html) { var d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; return d; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function uri(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }
function bowSvg(x, y) {
  return '<g><path d="M' + x + ' ' + y + ' C' + (x - 28) + ' ' + (y - 22) + ' ' + (x - 34) + ' ' + (y + 8) + ' ' + x + ' ' + (y + 3) + 'Z" fill="#e0262f" stroke="#8d1717" stroke-width="1"/>' +
    '<path d="M' + x + ' ' + y + ' C' + (x + 28) + ' ' + (y - 22) + ' ' + (x + 34) + ' ' + (y + 8) + ' ' + x + ' ' + (y + 3) + 'Z" fill="#e0262f" stroke="#8d1717" stroke-width="1"/>' +
    '<path d="M' + (x - 3) + ' ' + (y + 2) + ' L' + (x - 13) + ' ' + (y + 24) + ' L' + (x - 5) + ' ' + (y + 19) + ' L' + (x + 1) + ' ' + (y + 26) + ' L' + (x + 2) + ' ' + (y + 4) + 'Z" fill="#c4181f" stroke="#8d1717" stroke-width=".8"/>' +
    '<path d="M' + (x + 3) + ' ' + (y + 2) + ' L' + (x + 13) + ' ' + (y + 24) + ' L' + (x + 5) + ' ' + (y + 19) + ' L' + (x - 1) + ' ' + (y + 26) + ' L' + (x - 2) + ' ' + (y + 4) + 'Z" fill="#d62a32" stroke="#8d1717" stroke-width=".8"/>' +
    '<circle cx="' + x + '" cy="' + (y + 2) + '" r="5" fill="#ffd24a" stroke="#b88700" stroke-width=".8"/></g>';
}

/* ---------- Guirlande de sapin avec lumières, baies, nœuds et boules qui se balancent ---------- */
function garland(W) {
  var small = W < 700, seg = small ? 150 : 230, n = Math.max(2, Math.round(W / seg)), sw = W / n, sag = small ? 18 : 26, y0 = 3, H = Math.round(y0 + sag + (small ? 56 : 72));
  var C = ['#ff4d4d', '#ffd23b', '#46d36f', '#4aa8ff', '#ff9f2e'], defs = '', gid = [], i, j, o = '';
  C.forEach(function (c) { var id = U('l'); gid.push(id); defs += RG(id, [[0, '#fff', .95], [.25, c, .85], [1, c, 0]], .5, .5, .5); });
  var bid = [['#ff6b6b', '#c0182b'], ['#ffe27a', '#d89b00'], ['#7cc4ff', '#1e63c8'], ['#d6a6ff', '#7a2fc2']].map(function (c) { var id = U('lb'); defs += RG(id, [[0, c[0]], [1, c[1]]], .35, .3, .75); return id; });
  var d = '';
  for (i = 0; i < n; i++) d += 'M' + (i * sw).toFixed(1) + ' ' + y0 + ' Q' + ((i + .5) * sw).toFixed(1) + ' ' + (y0 + 2 * sag) + ' ' + ((i + 1) * sw).toFixed(1) + ' ' + y0 + ' ';
  o += '<path d="' + d + '" fill="none" stroke="#0c3d1e" stroke-width="14" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#1d8a41" stroke-width="10.5" stroke-linecap="round"/>' +
    '<path d="' + d + '" fill="none" stroke="#5fd183" stroke-width="7" stroke-dasharray="1 4.5" stroke-linecap="round" opacity=".75"/><path d="' + d + '" fill="none" stroke="#0f5a2b" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round" opacity=".6" transform="translate(0 2)"/>';
  function pt(k, t) { var x0 = k * sw, x1 = (k + 1) * sw, xm = (k + .5) * sw, cy = y0 + 2 * sag; return [(1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * xm + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * cy + t * t * y0]; }
  var ci = 0;
  for (i = 0; i < n; i++) {
    var m = Math.max(4, 2 * Math.round(sw / 70));
    for (j = 0; j < m; j++) {
      var p = pt(i, (j + .5) / m), c = ci % 5, bx = p[0].toFixed(1), by = (p[1] + 14).toFixed(1);
      o += '<rect x="' + (p[0] - 2.4).toFixed(1) + '" y="' + (p[1] + 3).toFixed(1) + '" width="4.8" height="6" rx="1" fill="#26262c"/><circle class="dc-bulb b' + c + '" cx="' + bx + '" cy="' + by + '" r="13" fill="url(#' + gid[c] + ')"/>' +
        '<ellipse cx="' + bx + '" cy="' + by + '" rx="4.4" ry="6.2" fill="' + C[c] + '"/><ellipse cx="' + (p[0] - 1.4).toFixed(1) + '" cy="' + (p[1] + 11.6).toFixed(1) + '" rx="1.2" ry="2" fill="#fff" opacity=".7"/>';
      ci++;
    }
    for (j = 0; j < 4; j++) { var q = pt(i, (j + 1) / 5), qx = q[0] + (j % 2 ? 4 : -4); o += '<circle cx="' + qx.toFixed(1) + '" cy="' + (q[1] - 2).toFixed(1) + '" r="2.6" fill="#e63946"/><circle cx="' + (qx - .7).toFixed(1) + '" cy="' + (q[1] - 2.8).toFixed(1) + '" r=".8" fill="#fff" opacity=".7"/>'; }
    var mp = pt(i, .5), L = small ? 16 : 24 + (i % 2) * 10, bi = i % 4, mx = mp[0].toFixed(1), my = (mp[1] + 2).toFixed(1);
    o += '<g class="dc-swing" style="transform-origin:' + mx + 'px ' + my + 'px;animation-delay:-' + (i * .7).toFixed(1) + 's"><path d="M' + mx + ' ' + my + ' V' + (mp[1] + L).toFixed(1) + '" stroke="#d9a400" stroke-width="1.4"/><rect x="' + (mp[0] - 3).toFixed(1) + '" y="' + (mp[1] + L).toFixed(1) + '" width="6" height="5" fill="#d9a400"/>' +
      '<circle cx="' + mx + '" cy="' + (mp[1] + L + 14).toFixed(1) + '" r="10" fill="url(#' + bid[bi] + ')" stroke="rgba(0,0,0,.3)" stroke-width=".7"/><circle cx="' + (mp[0] - 3.4).toFixed(1) + '" cy="' + (mp[1] + L + 10).toFixed(1) + '" r="2.6" fill="#fff" opacity=".8"/></g>';
  }
  for (i = 1; i < n; i++) o += bowSvg(i * sw, y0);
  return '<svg class="dcn-garland" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>' + o + '</svg>';
}

/* ---------- Neige douce en plusieurs plans (pas de gros points durs) ---------- */
function spriteDot(size, hard, alpha) {
  var c = document.createElement('canvas'); c.width = c.height = size; var x = c.getContext('2d'); if (!x) return c;
  var g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,' + alpha + ')'); g.addColorStop(hard, 'rgba(255,255,255,' + (alpha * .85) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, size, size); return c;
}
function spriteFlake(size) {
  var c = document.createElement('canvas'); c.width = c.height = size; var x = c.getContext('2d'); if (!x) return c;
  var r = size / 2 - 2, i; x.translate(size / 2, size / 2); x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineCap = 'round'; x.lineWidth = Math.max(1.2, size / 14);
  for (i = 0; i < 6; i++) { x.save(); x.rotate(i * Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -r); x.moveTo(0, -r * .55); x.lineTo(r * .28, -r * .8); x.moveTo(0, -r * .55); x.lineTo(-r * .28, -r * .8); x.stroke(); x.restore(); }
  return c;
}
function snow(root, env) {
  var c = document.createElement('canvas'); c.className = 'dcn-snow'; root.appendChild(c);
  var ctx = c.getContext('2d'); if (!ctx) return function () {};
  var W = 0, H = 0, fl = [], last = 0, raf = 0, t0 = 0;
  var s0 = spriteDot(10, .3, .95), s1 = spriteDot(18, .2, .8), s2 = spriteDot(40, .02, .5), s3 = spriteFlake(28);
  var L = [{ n: 44, sp: s0, s: [4, 8], v: [.45, .95] }, { n: 24, sp: s1, s: [8, 14], v: [.9, 1.6] }, { n: 6, sp: s2, s: [22, 40], v: [1.8, 2.8] }, { n: 8, sp: s3, s: [11, 19], v: [.7, 1.3], rot: 1 }];
  function mk(l, top) { return { l: l, x: Math.random() * W, y: top ? -50 : Math.random() * H, s: rnd(l.s[0], l.s[1]), v: rnd(l.v[0], l.v[1]), ph: rnd(0, 6.28), a: rnd(.55, 1), r: rnd(0, 6.28), rv: rnd(-.02, .02) }; }
  function size() {
    W = c.width = window.innerWidth; H = c.height = window.innerHeight; fl = []; var k = W < 700 ? .5 : 1;
    L.forEach(function (l) { for (var i = 0, n = Math.round(l.n * k); i < n; i++) fl.push(mk(l, false)); });
  }
  size();
  var rt = 0; function onR() { clearTimeout(rt); rt = setTimeout(size, 250); } window.addEventListener('resize', onR);
  (function tick(t) {
    raf = requestAnimationFrame(tick);
    if (document.hidden || env.busy() || t - last < 32) return;
    last = t; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    var wind = Math.sin(t / 4000) * .5;
    for (var i = 0; i < fl.length; i++) {
      var f = fl[i]; f.y += f.v; f.ph += .02; f.x += Math.sin(f.ph) * .5 + wind * f.v;
      if (f.y > H + 20 || f.x < -50 || f.x > W + 50) { fl[i] = mk(f.l, true); continue; }
      ctx.globalAlpha = f.a;
      if (f.l.rot) { f.r += f.rv; ctx.setTransform(1, 0, 0, 1, f.x, f.y); ctx.rotate(f.r); ctx.drawImage(f.l.sp, -f.s / 2, -f.s / 2, f.s, f.s); }
      else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(f.l.sp, f.x, f.y, f.s, f.s); }
    }
  })(0);
  return function () { cancelAnimationFrame(raf); clearTimeout(rt); window.removeEventListener('resize', onR); };
}

/* ---------- Le village de Noël, juste avant le pied de page ---------- */
function pineUri(c1, c2) { return uri(pine(c1, c2)); }
function yardBuild(env) {
  var y = document.createElement('div'); y.id = 'dc-yard'; y.className = 'dcy'; y.setAttribute('aria-hidden', 'true');
  var h = '<div class="dcy-sky">';
  for (var i = 0; i < 38; i++) h += '<i style="left:' + rnd(1, 99).toFixed(1) + '%;top:' + rnd(2, 52).toFixed(1) + '%;--s:' + rnd(1.4, 3.2).toFixed(1) + 'px;animation-delay:-' + rnd(0, 4).toFixed(1) + 's"></i>';
  h += '</div><div class="dcy-moon"></div>';
  var farFill = LG('dnFar', [[0, '#27466d'], [1, '#14284a']]), midFill = LG('dnMid', [[0, '#f2f8ff'], [1, '#bcd3ea']]), gFill = LG('dnGnd', [[0, '#ffffff'], [1, '#d3e3f3']]);
  h += '<svg class="dcy-hill far" viewBox="0 0 1000 140" preserveAspectRatio="none"><defs>' + farFill + '</defs><path d="M0 140 V84 Q110 26 250 72 T520 56 T780 76 T1000 44 V140Z" fill="url(#dnFar)"/></svg>';
  h += '<div class="dcy-forest far">'; [1.5, 5, 8.5, 12, 17, 22, 31, 38, 46, 52, 60, 66, 74, 80, 86, 91, 95, 98.5].forEach(function (x, k) { h += '<i style="left:' + x + '%;--h:' + (62 + (k * 17) % 40) + 'px"></i>'; }); h += '</div>';
  h += '<svg class="dcy-hill mid" viewBox="0 0 1000 120" preserveAspectRatio="none"><defs>' + midFill + '</defs><path d="M0 120 V74 Q150 30 300 66 T620 58 T1000 64 V120Z" fill="url(#dnMid)"/></svg>';
  h += '<div class="dcy-forest mid">'; [3, 14, 47, 62, 77, 92, 97].forEach(function (x, k) { h += '<i style="left:' + x + '%;--h:' + (80 + (k * 23) % 44) + 'px"></i>'; }); h += '</div>';
  var items = [
    ['cottage', 8.5, 46, 205, 'dcy-cot'], ['cottage', 90, 48, 175, 'dcy-cot flip'],
    ['tree', 29, 26, 220, 'dcy-tree'],
    ['elf', 17.5, 20, 84, 'dcy-bob'], ['santa', 41.5, 20, 112, 'dcy-bob b2'], ['snowman', 56, 20, 118, 'dcy-bob'], ['queen', 69, 22, 104, 'dcy-bob b2'],
    ['cane', 50, 20, 30, ''], ['cane', 79.5, 20, 28, ''], ['cane', 12.5, 20, 26, ''],
    ['gift', 21.6, 18, 54, '', '#d62828', '#ffd93b'], ['gift', 23.8, 18, 40, '', '#2e86de', '#ffffff'], ['gift', 35, 18, 48, '', '#27ae60', '#ffd93b'], ['gift', 37.4, 18, 38, '', '#8e44ad', '#f1f1f1'], ['gift', 45.2, 18, 40, '', '#ff8a1f', '#fff6c2'], ['gift', 60.8, 18, 38, '', '#d62828', '#fff'], ['gift', 62.6, 18, 46, '', '#2e86de', '#ffd93b']
  ];
  h += '<svg class="dcy-hill gnd" viewBox="0 0 1000 80" preserveAspectRatio="none"><defs>' + gFill + '</defs><path d="M0 80 V28 Q250 6 500 24 T1000 18 V80Z" fill="url(#dnGnd)"/></svg><div class="dcy-track"></div>';
  items.forEach(function (it) {
    var art = { cottage: cottage, tree: tree, elf: elf, santa: santa, snowman: snowman, queen: queen, cane: cane }[it[0]];
    var svg = it[0] === 'gift' ? gift(it[5], it[6]) : art();
    h += '<div class="dcy-i dcy-' + it[0] + ' ' + (it[4] || '') + '" style="--x:' + it[1] + '%;--b:' + it[2] + ';--w:' + it[3] + '">' + svg + '</div>';
  });
  if (!env.tv && !env.reduced) h += '<div class="dcy-train">' + train() + '</div>';
  y.innerHTML = h;
  y.style.setProperty('--pf', pineUri('#2f7fa0', '#173f60')); y.style.setProperty('--pm', pineUri('#35b062', '#14593a'));
  return y;
}

/* ====================== POINT D'ENTRÉE ====================== */
function build(root, env) {
  var timers = [], killers = [], yard = null, hatEl = null, garEl = null, rz = 0;
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  var still = env.tv || env.reduced;

  root.appendChild(div('dcn-vg'));
  garEl = div('dcn-gwrap', garland(window.innerWidth)); root.appendChild(garEl);
  var onResize = function () { clearTimeout(rz); rz = setTimeout(function () { if (garEl) garEl.innerHTML = garland(window.innerWidth); }, 300); };
  window.addEventListener('resize', onResize); killers.push(function () { window.removeEventListener('resize', onResize); clearTimeout(rz); });
  if (!still) killers.push(snow(root, env));

  var L = div('dcn-fix dcn-fl'); L.appendChild(div('dcn-gf', gift('#2e86de', '#fff'))); L.appendChild(div('dcn-tr', tree())); L.appendChild(div('dcn-gf g2', gift('#d62828', '#ffd93b'))); root.appendChild(L);
  var R = div('dcn-fix dcn-fr'); R.appendChild(div('dcn-gf g2', gift('#8e44ad', '#f1f1f1'))); R.appendChild(div('dcn-sm', snowman())); R.appendChild(div('dcn-gf', gift('#27ae60', '#ffd93b'))); root.appendChild(R);

  if (!still) {
    var sl = div('dcn-sleigh', sleigh()); root.appendChild(sl);
    (function fly() {
      if (!document.hidden && !env.busy() && sl.animate) {
        var W = window.innerWidth, sw = sl.offsetWidth || 400;
        sl.style.opacity = '1';
        var a = sl.animate([{ transform: 'translate(' + (-sw - 40) + 'px,10px) rotate(2deg)' }, { transform: 'translate(' + (W * .45) + 'px,-26px) rotate(-1deg)' }, { transform: 'translate(' + (W + 60) + 'px,14px) rotate(2deg)' }], { duration: 20000, easing: 'linear' });
        a.onfinish = function () { sl.style.opacity = '0'; };
      }
      later(fly, rnd(42000, 80000));
    })();
    later(function () { try { sl.style.opacity = '0'; } catch (e) {} }, 0);
    var ss = div('dcn-shoot'); root.appendChild(ss);
    (function shoot() {
      if (!document.hidden && !env.busy() && ss.animate) {
        ss.style.left = rnd(10, 70).toFixed(0) + '%'; ss.style.top = rnd(14, 36).toFixed(0) + '%'; ss.style.opacity = '1';
        var b = ss.animate([{ transform: 'translate(0,0) rotate(28deg)', opacity: 0 }, { opacity: 1, offset: .15 }, { transform: 'translate(360px,190px) rotate(28deg)', opacity: 0 }], { duration: 1300, easing: 'ease-in' });
        b.onfinish = function () { ss.style.opacity = '0'; };
      }
      later(shoot, rnd(22000, 45000));
    })();
  }

  /* Village avant le pied de page (comme le cimetière d'Halloween) */
  yard = yardBuild(env);
  var ft = document.querySelector('footer');
  if (ft && ft.parentNode) ft.parentNode.insertBefore(yard, ft); else document.body.appendChild(yard);
  if (!still && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { yard.classList.toggle('run', es[0].isIntersecting); }, { threshold: .05 }); io.observe(yard); killers.push(function () { io.disconnect(); });
  } else if (!still) yard.classList.add('run');

  /* Bonnet : posé sur le haut de l'icône du logo (position calculée d'après la vraie image, donc il reste dessus à toutes les tailles) */
  var logo = document.querySelector('.logo');
  if (logo) {
    hatEl = div('dc-hat', hat()); logo.appendChild(hatEl);
    var place = function () {
      if (!hatEl) return;
      var im = logo.querySelector('img'), lr = logo.getBoundingClientRect(), ir = im ? im.getBoundingClientRect() : lr;
      if (!ir.width) return;
      var w = Math.max(30, Math.min(64, ir.width * .62)), h = w * 54 / 70;
      var cx = (ir.left - lr.left) + ir.width * .50 - w * .04, base = (ir.top - lr.top) + ir.height * .27;   // le bord blanc du bonnet touche le haut de l'icône
      hatEl.style.width = w.toFixed(1) + 'px'; hatEl.style.height = h.toFixed(1) + 'px';
      hatEl.style.left = (cx - w / 2).toFixed(1) + 'px'; hatEl.style.top = (base - h * .86).toFixed(1) + 'px';
    };
    place(); later(place, 300); later(place, 1200); later(place, 3500);
    var im0 = logo.querySelector('img'); if (im0 && !im0.complete) im0.addEventListener('load', place);
    window.addEventListener('resize', place); killers.push(function () { window.removeEventListener('resize', place); });
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(place); ro.observe(logo); killers.push(function () { ro.disconnect(); }); }
  }

  return { destroy: function () {
    timers.forEach(clearTimeout); killers.forEach(function (k) { try { k(); } catch (e) {} });
    if (yard && yard.parentNode) yard.parentNode.removeChild(yard);
    if (hatEl && hatEl.parentNode) hatEl.parentNode.removeChild(hatEl);
  } };
}

window.LK10DecoNoel = { build: build };

})();
