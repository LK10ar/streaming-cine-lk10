/* Ciné LK10 — lk10-cover-tv.js : sur TÉLÉ, la page d'accueil n'affiche plus la vidéo (press-start.mp4 / loading.mp4)
   mais seulement le logo + une animation de chargement. PC et mobile ne changent pas.
   À ajouter dans index.html JUSTE APRÈS le bloc <div id="cover-page" ...> ... </div> (et pas en bas de page),
   pour que la vidéo soit coupée avant même de commencer à charger :
       <script src="lk10-cover-tv.js"></script>                                                         */
(function () {
  'use strict';

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
  var tv;
  try {
    var q = new URLSearchParams(location.search).get('tv');
    if (q === '1' || q === '0') localStorage.setItem('lk10_tv', q);
    var sv = localStorage.getItem('lk10_tv');
    tv = sv === '1' ? true : sv === '0' ? false : detectTV();
    /* on mémorise la détection : cine-plus.js (flèches de la télécommande) s'en sert aussi */
    if (tv && sv === null) localStorage.setItem('lk10_tv', '1');
  } catch (e) { tv = detectTV(); }
  if (!tv) return;

  var cover = document.getElementById('cover-page'); if (!cover) return;

  /* 1) On tue la vidéo avant qu'elle ne charge */
  var v = document.getElementById('cover-video');
  if (v) { try { v.pause(); v.removeAttribute('autoplay'); v.removeAttribute('src'); v.load(); } catch (e) {} v.remove(); }

  /* 2) Logo + "Appuie sur OK" (puis barre de chargement au clic / OK) */
  var st = document.createElement('style');
  st.textContent =
    '#lk10-cv{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center;padding:20px}' +
    '#lk10-cv img{width:min(46vw,420px);height:auto;max-height:46vh;object-fit:contain}' +
    '#lk10-cv-msg{color:#ddd;font:700 22px/1.3 system-ui,Arial,sans-serif;letter-spacing:2px;text-transform:uppercase}' +
    '#lk10-cv-msg b{color:var(--primary,#ffde00)}' +
    '#lk10-cv-bar{display:none;width:min(60vw,520px);height:8px;border-radius:8px;background:#222;overflow:hidden}' +
    '#lk10-cv-bar i{display:block;height:100%;width:0;background:var(--primary,#ffde00);border-radius:8px}' +
    '#cover-page.is-loading #lk10-cv-bar{display:block}' +
    '#cover-page.is-loading #lk10-cv-bar i{width:100%;transition:width 2.2s ease-out}' +
    '#cover-page.is-loading #lk10-cv-msg{animation:lk10cv 1s ease-in-out infinite alternate}' +
    '@keyframes lk10cv{from{opacity:.45}to{opacity:1}}';
  document.head.appendChild(st);

  var box = document.createElement('div'); box.id = 'lk10-cv';
  box.innerHTML = '<img alt="Ciné LK10" src="asset/logolk10.png">' +
    '<div id="lk10-cv-msg">Chargement…</div>' +
    '<div id="lk10-cv-bar"><i></i></div>';
  cover.appendChild(box);

  /* 3) closeCover version télé : pas de vidéo, juste le chargement puis on entre */
  window.closeCover = function () {
    if (cover.classList.contains('is-loading')) return;
    cover.classList.add('is-loading');
    var m = document.getElementById('lk10-cv-msg'); if (m) m.textContent = 'Chargement…';
    setTimeout(function () { try { window.finishCover(); } catch (e) { cover.style.display = 'none'; } }, 2300);
  };

  /* 4) Sur télé on n'attend PAS la touche OK (selon les télécommandes elle n'envoie pas toujours « Entrée ») :
        le chargement démarre tout seul, et n'importe quelle touche / clic le démarre aussi. */
  var go = function () { try { window.closeCover(); } catch (e) {} };
  ['keydown', 'keyup', 'click', 'pointerdown', 'touchstart', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, go, true); });
  setTimeout(go, 700);
  /* Sécurité finale : quoi qu'il arrive, l'écran d'accueil disparaît après 6 s */
  setTimeout(function () { try { window.finishCover(); } catch (e) { cover.style.display = 'none'; } }, 6000);
})();
