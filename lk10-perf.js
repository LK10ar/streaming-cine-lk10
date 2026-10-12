/* Ciné LK10 — lk10-perf.js : anti-crash
   • TÉLÉ (mode télé / user-agent télé) : plus de fond « nid d'abeille » jaune, plus AUCUNE bande-annonce automatique (grand carrousel + survol des films),
     plus de vidéos de fond (plateformes, bannières vidéo) -> on garde seulement les affiches. Mobile et PC ne changent pas.
   • PC / mobile : on allège sans rien enlever de visible :
       - le trailer du grand carrousel s'arrête quand on ouvre un film, quand l'onglet est caché ou quand le carrousel n'est plus à l'écran ;
       - les 15 vidéos des plateformes ne tournent plus en permanence : elles ne se lancent qu'au survol ;
       - une seule prévisualisation au survol à la fois, jamais pendant la lecture d'un film.
   À ajouter dans index.html, TOUT EN DERNIER (après cine-plus.js) :  <script src="lk10-perf.js"></script> */
(function () {
  'use strict';
  var de = document.documentElement;
  /* Détection télé large : marques de télés / box / sticks (Fire TV, Xiaomi Mi TV / Mi Box / TV Stick, Google TV, Samsung, LG,
     Sony, Philips, Hisense, TCL, Roku, consoles...) + navigateurs de box (Silk, TV Bro, Puffin TV) + tout Android SANS écran tactile. */
  var UA_TV = /SmartTV|SMART-TV|Tizen|Web0S|WebOS|NetCast|HbbTV|VIDAA|Hisense|BRAVIA|AFT[A-Z0-9]+|Android ?TV|Google ?TV|CrKey|Roku|PlayStation|Xbox|AppleTV|Viera|SonyDTV|Opera TV|MiTV|Mi ?TV|MiBOX|Mi ?Box|TV ?Bro|Puffin ?TV|Fire ?TV|AmazonWebAppPlatform|NETTV|Vestel|Philips|\bTV\b/i;
  function detectTV() {
    var ua = navigator.userAgent || '', touch = navigator.maxTouchPoints || 0;
    if (UA_TV.test(ua)) return true;
    if (/Silk\//.test(ua) && !touch) return true;                    // Fire TV en mode « site PC »
    if (/Android/.test(ua) && !/Mobile/.test(ua) && !touch) return true; // Android sans tactile = télé / box
    return false;
  }

  /* Même logique que cine-plus.js : réglage manuel (bouton télé / ?tv=1) sinon détection automatique */
  function isTV() {
    if (de.classList.contains('lk10-tv')) return true;
    try {
      var s = localStorage.getItem('lk10_tv');
      if (s === '1') return true;
      if (s === '0') return false;
    } catch (e) {}
    return detectTV();
  }
  var $ = function (id) { return document.getElementById(id); };
  function shown(id) { var e = $(id); return !!e && getComputedStyle(e).display !== 'none'; }

  /* ---------- CSS ---------- */
  var st = document.createElement('style');
  st.textContent =
    'html.lk10-tv .fx-hexc{display:none!important}' +
    'html.lk10-tv .hero-sound-btn,html.lk10-tv .hero-slide-trailer,html.lk10-tv .netflix-preview-popup{display:none!important}' +
    /* la télé n'a pas besoin des effets coûteux : on réutilise le mode "lite" de cine-fx */
    'html.lk10-tv *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';
  document.head.appendChild(st);

  /* ---------- Conditions pour qu'un trailer ait le droit de tourner ---------- */
  var heroVisible = true;
  function playerBusy() { return shown('player-overlay') || shown('trailer-overlay'); }
  function heroAllowed() {
    return !isTV() && !document.hidden && heroVisible && !playerBusy();
  }

  /* ---------- 1. Grand carrousel : trailer ---------- */
  var origSchedule = window.scheduleHeroTrailer;
  if (typeof origSchedule === 'function') {
    window.scheduleHeroTrailer = function (index) {
      if (!heroAllowed()) { try { window.clearHeroTrailer(); } catch (e) {} return; }
      return origSchedule.apply(this, arguments);
    };
  }
  function stopHero() { try { window.clearHeroTrailer(); } catch (e) {} }
  function resumeHero() {
    if (!heroAllowed()) return;
    try { window.scheduleHeroTrailer(currentHeroIndex); } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { document.hidden ? stopHero() : resumeHero(); });

  var hc = $('hero-carousel');
  if (hc && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      heroVisible = es[0].isIntersecting;
      heroVisible ? resumeHero() : stopHero();
    }, { threshold: 0.25 }).observe(hc);
  }
  /* Lecteur / trailer ouverts -> on coupe le trailer du héros ; fermés -> on le relance */
  ['player-overlay', 'trailer-overlay'].forEach(function (id) {
    var el = $(id); if (!el) return;
    new MutationObserver(function () { playerBusy() ? (stopHero(), killPreview()) : resumeHero(); })
      .observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
  });

  /* ---------- 2. Survol des films (popup + trailer) ---------- */
  function killPreview() { try { window.hideNpPopup(); } catch (e) {} }
  var origShow = window.showNpPopup;
  if (typeof origShow === 'function') {
    window.showNpPopup = function () {
      if (isTV() || document.hidden || playerBusy()) return;      // télé : jamais de popup/trailer
      return origShow.apply(this, arguments);
    };
  }
  var origAttach = window.attachNetflixHover;
  if (typeof origAttach === 'function') {
    window.attachNetflixHover = function () {
      if (isTV()) return;                                          // télé : on n'attache même pas le survol
      return origAttach.apply(this, arguments);
    };
  }
  /* Sécurité : au plus UNE iframe de prévisualisation dans la page */
  new MutationObserver(function () {
    var f = document.querySelectorAll('.netflix-preview-media iframe');
    for (var i = 0; i < f.length - 1; i++) f[i].remove();
  }).observe(document.body, { childList: true, subtree: true });

  /* ---------- 3. Vidéos de fond ---------- */
  function lightPlatforms() {
    var tv = isTV();
    document.querySelectorAll('video.plat-vid').forEach(function (v) {
      if (v.dataset.lk10) return; v.dataset.lk10 = '1';
      try { v.pause(); v.removeAttribute('autoplay'); v.preload = 'none'; } catch (e) {}
      if (tv) { v.querySelectorAll('source').forEach(function (s) { s.remove(); }); try { v.load(); } catch (e) {} return; }
      var card = v.closest('.platform-card') || v;
      card.addEventListener('mouseenter', function () { try { v.play().catch(function () {}); } catch (e) {} });
      card.addEventListener('mouseleave', function () { try { v.pause(); } catch (e) {} });
    });
  }
  lightPlatforms();

  /* Télé : les bannières .mp4 du héros sont remplacées par l'affiche (image), la vidéo de saga est coupée */
  function tvNoVideo() {
    if (!isTV()) return;
    document.querySelectorAll('video.hero-slide-media').forEach(function (v) {
      var slide = v.closest('.hero-slide'), idx = slide ? Array.prototype.indexOf.call(slide.parentNode.children, slide) : -1, m = null;
      try { m = heroMovies[idx]; } catch (e) {}
      var d = document.createElement('div'); d.className = 'hero-slide-media';
      var img = (m && m.poster) || ''; if (img) d.style.backgroundImage = 'url("' + String(img).replace(/"/g, '%22') + '")';
      v.pause(); v.removeAttribute('src'); v.load(); v.replaceWith(d);
    });
    var sv = $('saga-hero-video'); if (sv) { try { sv.pause(); sv.removeAttribute('src'); sv.load(); } catch (e) {} }
  }
  var busy = false;
  new MutationObserver(function () {
    if (busy) return; busy = true;
    setTimeout(function () { busy = false; try { tvNoVideo(); lightPlatforms(); } catch (e) {} }, 200);
  }).observe(document.body, { childList: true, subtree: true });

  /* ---------- Touches des télécommandes Android TV / Fire TV / Xiaomi ----------
     OK = DPAD_CENTER (23) ou Entrée (13) ; Retour = 4 (Android) -> traduits en Entrée / Échap pour cine-plus.js */
  function fake(code, key) {
    var ev = new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true });
    try { Object.defineProperty(ev, 'keyCode', { get: function () { return code; } }); Object.defineProperty(ev, 'which', { get: function () { return code; } }); } catch (e) {}
    (document.activeElement || document.body).dispatchEvent(ev);
  }
  document.addEventListener('keydown', function (e) {
    if (!isTV() || !e.isTrusted) return;
    var k = e.keyCode;
    if (k === 23 || k === 66) { e.preventDefault(); e.stopImmediatePropagation(); fake(13, 'Enter'); }
    else if (k === 4 || e.key === 'GoBack' || e.key === 'BrowserBack') { e.preventDefault(); e.stopImmediatePropagation(); fake(27, 'Escape'); }
  }, true);

  /* ---------- 4. Télé : on active le mode "lite" de cine-fx et on coupe tout trailer déjà lancé ---------- */
  function applyTvPerf() {
    if (!isTV()) return;
    de.classList.add('fx-lite');
    stopHero(); killPreview(); tvNoVideo(); killHex();
  }
  /* Télé : plus de fond jaune interactif « nid d'abeille » (canvas plein écran de cine-fx.js) */
  function killHex() {
    document.querySelectorAll('canvas.fx-hexc').forEach(function (c) {
      try { c.width = 1; c.height = 1; } catch (e) {}   // l'animation continue de dessiner, mais sur 1 pixel
      c.remove();
    });
  }
  applyTvPerf();
  new MutationObserver(applyTvPerf).observe(de, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('load', applyTvPerf);
})();
