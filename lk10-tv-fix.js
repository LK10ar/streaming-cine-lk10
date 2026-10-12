/* Ciné LK10 — lk10-tv-fix.js : correctifs TÉLÉ uniquement (PC et mobile ne changent pas)
   1) Diamant VIP/Premium : plus d'animation, il reste fixe.
   2) Icône de profil : de nouveau visible dans l'en-tête (le menu était trop large et la poussait hors de l'écran).
   3) Bouton télé / zoom : le zoom ne peut plus coincer.
        - le bouton alterne seulement Normal <-> Zoom léger (il ne désactive plus le mode télé)
        - la touche RETOUR de la télécommande enlève d'abord le zoom, puis fonctionne normalement
        - touches MENU / 0 / bouton rouge = remise à zéro immédiate
        - petit bouton « Zoom ✕ » en bas à gauche (OK dessus = zoom enlevé)
        - le zoom est remis à zéro à chaque ouverture du site (jamais bloqué au démarrage)
   À ajouter dans index.html, TOUT EN DERNIER (après lk10-perf.js) :  <script src="lk10-tv-fix.js"></script> */
(function () {
  'use strict';
  var de = document.documentElement, ZOOM = 1.15, LS = null;
  try { LS = window.localStorage; } catch (e) {}

  /* ---------- CSS (actif seulement quand html.lk10-tv est présent) ---------- */
  var st = document.createElement('style');
  st.textContent =
    /* 1) diamant figé */
    'html.lk10-tv #vip-diamond{animation:none!important;transition:none!important;transform:none!important;filter:drop-shadow(0 0 6px #ff69b4)!important}' +
    /* 2) en-tête compact : l'avatar passe en premier et ne sort plus de l'écran */
    'html.lk10-tv header{padding:0 12px}' +
    'html.lk10-tv nav{min-width:0;flex:1 1 auto}' +
    'html.lk10-tv .nav-link{padding:0 10px!important;font-size:13px!important;white-space:nowrap}' +
    'html.lk10-tv .header-right{gap:8px;flex:0 0 auto;margin-left:auto}' +
    'html.lk10-tv .search-box{width:140px}' +
    'html.lk10-tv .random-btn-header{padding:8px 10px;margin-right:0}' +
    'html.lk10-tv .random-btn-header .random-text{display:none}' +
    'html.lk10-tv #lk10-tv-btn{order:-3;margin-right:0}' +
    'html.lk10-tv #notif-bell-wrap{order:-2}' +
    'html.lk10-tv #user-profile-nav{order:-1;flex:0 0 auto;margin-right:0!important}' +
    /* 3) pastille de remise à zéro du zoom */
    '#lk10-zoom-reset{display:none;position:fixed;left:16px;bottom:16px;z-index:2147483000;background:#ffde00;color:#000;border:0;border-radius:999px;padding:12px 20px;font:700 16px system-ui,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.6)}' +
    '#lk10-zoom-reset:focus{outline:4px solid #fff;outline-offset:2px}';
  document.head.appendChild(st);

  /* ---------- Zoom ---------- */
  function isTV() { return de.classList.contains('lk10-tv'); }
  function curZoom() { return parseFloat(document.body && document.body.style.zoom) || 1; }
  function pill() {
    var p = document.getElementById('lk10-zoom-reset');
    if (!p) {
      p = document.createElement('button'); p.type = 'button'; p.id = 'lk10-zoom-reset';
      p.textContent = 'Zoom ✕ (OK = enlever)';
      p.onclick = function () { setZoom(1); };
      de.appendChild(p);                                   // sur <html> : le zoom du body ne l'affecte pas
    }
    return p;
  }
  function setZoom(z) {
    try { document.body.style.zoom = z > 1 ? z : ''; } catch (e) {}
    try { if (LS) LS.setItem('lk10_tv_z', '0'); } catch (e) {}   // jamais mémorisé : au prochain lancement, zoom normal
    var p = pill(); p.style.display = z > 1 ? 'block' : 'none';
    var b = document.getElementById('lk10-tv-btn'); if (b) b.classList.toggle('on', isTV());
  }
  /* au chargement : on enlève tout zoom mémorisé par l'ancienne version */
  try { if (LS) LS.setItem('lk10_tv_z', '0'); } catch (e) {}
  function resetStart() { if (curZoom() > 1) setZoom(1); }
  resetStart();
  document.addEventListener('DOMContentLoaded', resetStart);
  window.addEventListener('load', resetStart);

  /* Bouton télé : en mode télé il ne fait qu'alterner Normal <-> Zoom léger (pas de désactivation, pas de zoom ×1,4) */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#lk10-tv-btn');
    if (!b || !isTV()) return;                             // hors mode télé : le bouton d'origine active le mode télé
    e.preventDefault(); e.stopImmediatePropagation();
    setZoom(curZoom() > 1 ? 1 : ZOOM);
  }, true);

  /* Télécommande : Retour enlève d'abord le zoom ; Menu / 0 / rouge = remise à zéro */
  var BACK = { 4: 1, 8: 1, 27: 1, 461: 1, 10009: 1 };
  var RESET = { 82: 1, 48: 1, 96: 1, 403: 1 };
  window.addEventListener('keydown', function (e) {
    if (!isTV() || curZoom() <= 1) return;
    var back = BACK[e.keyCode] || e.key === 'GoBack' || e.key === 'BrowserBack' || e.key === 'Escape';
    var reset = RESET[e.keyCode] || e.key === 'ContextMenu' || e.key === 'ColorF0Red';
    if (!back && !reset) return;
    var t = e.target, tag = t && t.tagName;
    if (back && (tag === 'INPUT' || tag === 'TEXTAREA') && e.keyCode !== 4) return;   // on laisse effacer / quitter la saisie
    e.preventDefault(); e.stopImmediatePropagation();
    setZoom(1);
  }, true);
})();
