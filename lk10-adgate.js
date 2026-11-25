/* ==========================================================================
   Ciné LK10 — Étape pub (2 écrans) avant le lecteur  ·  Adsterra
   Remplace ENTIÈREMENT l'ancien lk10-adgate.js (déjà chargé dans index.html).
   Aucune modif HTML nécessaire (sauf le numéro de version ?v=4).

   • Popup pub décoré selon la fête choisie par l'admin (Noël : guirlande, neige, bonnet / Halloween : toiles + araignée).
   • Plein écran automatique après les pubs (AUTO_FULLSCREEN).
   • Bouton « Sources » en haut à droite de la vidéo (visible aussi en plein écran) pour changer de lecteur
     (Premium / Vidzy / Uqload...) et de langue (VF / VOSTFR). Il apparaît quand on bouge dans le coin haut-droite
     de la vidéo, puis se cache tout seul.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__lk10AdGate) return;          // évite un double chargement
  window.__lk10AdGate = true;

  /* ---------------- RÉGLAGES ---------------- */
  var AD_SCRIPTS = [
    'https://bancadeltempoidea.org/14/a7bb0edad64d5016897fa30b88f11754', // Pub 1/2
    'https://aarems.org/1/9490af5c64e3c951e26fb94acd93a4a7'              // Pub 2/2
  ];
  // OPTIONNEL : liens directs Adsterra (Direct Link). Si tu en mets un, le bouton
  // l'ouvre aussi dans un nouvel onglet (plus fiable que le script seul).
  var AD_DIRECT_LINKS = ['', ''];
  var MIN_WAIT_MS   = 4000;   // temps minimum avant de passer à l'étape suivante après le clic
  var REMEMBER_MIN  = 0;      // 0 = pub à chaque ouverture d'un film ; ex. 30 = pas de pub pendant 30 min
  var LS_KEY        = 'lk10_adgate_passed_at';
  var AUTO_FULLSCREEN = true; // true = le film se lance directement en plein écran | false = c'est au spectateur de le faire
  var SOURCES_BTN   = true;   // true = bouton « Sources » sur la vidéo | false = pas de bouton
  var SOURCES_HIDE_MS = 3500; // le bouton se cache tout seul après ce délai (en millisecondes)
  var TOTAL         = AD_SCRIPTS.length;

  /* ---------------- ÉTAT ---------------- */
  var de = document.documentElement;
  var origSetVideo = null;
  var gatePassed = false;
  var pendingContent = null;
  var step = 1;
  var busy = false;
  var blocked = false;
  var scriptState = {};        // index -> 'ok' | 'blocked' | 'loading'
  var els = {};

  function isPrivileged() {
    try { if (typeof isVipUser !== 'undefined' && isVipUser) return true; } catch (e) {}
    try { if (typeof isAdminUnlocked !== 'undefined' && isAdminUnlocked) return true; } catch (e) {}
    return false;
  }

  function recentlyPassed() {
    if (!REMEMBER_MIN) return false;
    try {
      var t = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
      return t && (Date.now() - t) < REMEMBER_MIN * 60000;
    } catch (e) { return false; }
  }

  /* ====================== DÉCO DU POPUP (selon la fête choisie par l'admin) ====================== */
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function garlandSvg() {
    var cols = ['#ff4d4d', '#ffd23b', '#46d36f', '#4aa8ff', '#ff9f2e'], d = 'M0 3Q55 32 110 3Q165 32 220 3Q275 32 330 3Q385 32 440 3', s = '', i, k = 0;
    s += '<path d="' + d + '" fill="none" stroke="#14602e" stroke-width="7" stroke-linecap="round"/>' +
         '<path d="' + d + '" fill="none" stroke="#2da44e" stroke-width="4.4" stroke-linecap="round" stroke-dasharray="1 4"/>';
    for (i = 0; i < 4; i++) {
      [27.5, 55, 82.5].forEach(function (dx, j) {
        var x = i * 110 + dx, y = j === 1 ? 17 : 13.75;
        s += '<circle class="b b' + (k % 3) + '" cx="' + x + '" cy="' + (y + 7) + '" r="5" fill="' + cols[k % 5] + '"/>'; k++;
      });
    }
    [110, 220, 330].forEach(function (x) {
      s += '<rect x="' + (x - 2) + '" y="3" width="4" height="4" fill="#d9a400"/><circle cx="' + x + '" cy="13" r="6" fill="#e63946" stroke="#8d1717" stroke-width=".8"/><circle cx="' + (x - 2) + '" cy="11" r="1.6" fill="#fff" opacity=".8"/>';
    });
    return '<svg class="lk10g-gar" viewBox="0 0 440 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' + s + '</svg>';
  }
  function snowHtml() {
    var h = '<div class="lk10g-snow">', i;
    for (i = 0; i < 18; i++) h += '<i style="--x:' + Math.round(rnd(2, 98)) + '%;--s:' + rnd(2, 5).toFixed(1) + 'px;--d:' + rnd(5, 10).toFixed(1) + 's;--dl:-' + rnd(0, 9).toFixed(1) + 's;--sw:' + Math.round(rnd(-14, 14)) + 'px"></i>';
    return h + '</div>';
  }
  var HAT = '<svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg"><path d="M4 26C4 8 18 0 30 6C35 9 36 18 34 26Z" fill="#d62832"/><path d="M8 20C9 12 16 6 24 6" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2.4" stroke-linecap="round"/><circle cx="35" cy="8" r="4.6" fill="#fff"/><rect x="2" y="22" width="34" height="7" rx="3.5" fill="#fff"/></svg>';

  function webSvg() {
    var d = '', i, r, a1, a2, am;
    for (i = 0; i < 5; i++) { a1 = i * Math.PI / 8; d += 'M0 0L' + (70 * Math.cos(a1)).toFixed(1) + ' ' + (70 * Math.sin(a1)).toFixed(1); }
    for (r = 1; r <= 4; r++) {
      var rr = r * 17;
      for (i = 0; i < 4; i++) {
        a1 = i * Math.PI / 8; a2 = (i + 1) * Math.PI / 8; am = (a1 + a2) / 2;
        d += 'M' + (rr * Math.cos(a1)).toFixed(1) + ' ' + (rr * Math.sin(a1)).toFixed(1) + 'Q' + (rr * .8 * Math.cos(am)).toFixed(1) + ' ' + (rr * .8 * Math.sin(am)).toFixed(1) + ' ' + (rr * Math.cos(a2)).toFixed(1) + ' ' + (rr * Math.sin(a2)).toFixed(1);
      }
    }
    return '<svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg"><path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1"/></svg>';
  }
  var SPIDER = '<svg viewBox="0 0 24 66" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="0" x2="12" y2="40" stroke="#fff" stroke-opacity=".6"/><g fill="none" stroke="#c9b3ff" stroke-width="1.4" stroke-linecap="round"><path d="M8 48L2 44L1 50M8 52L1 54L2 60M16 48L22 44L23 50M16 52L23 54L22 60"/></g><ellipse cx="12" cy="52" rx="6" ry="7.5" fill="#3b2a63" stroke="#c9b3ff" stroke-width="1"/><circle cx="12" cy="43" r="4.4" fill="#3b2a63" stroke="#c9b3ff" stroke-width="1"/><circle cx="10.4" cy="42.6" r="1" fill="#ff4d4d"/><circle cx="13.6" cy="42.6" r="1" fill="#ff4d4d"/></svg>';

  function themeNow() {
    var t = de.getAttribute('data-deco');
    if (!t) { try { if (window.LK10Halloween && window.LK10Halloween.active()) t = 'halloween'; } catch (e) {} }
    return (t === 'noel' || t === 'halloween') ? t : '';
  }
  function applyTheme() {
    if (!els.dialog) return;
    var t = themeNow(), old = els.ico.querySelector('.lk10g-hat');
    els.box.classList.remove('lk10g-t-noel', 'lk10g-t-halloween');
    els.deco.innerHTML = '';
    if (old) old.remove();
    if (!t) return;
    els.box.classList.add('lk10g-t-' + t);
    if (t === 'noel') {
      els.deco.innerHTML = garlandSvg() + snowHtml();
      els.ico.insertAdjacentHTML('beforeend', '<span class="lk10g-hat">' + HAT + '</span>');
    } else {
      els.deco.innerHTML = '<div class="lk10g-web l">' + webSvg() + '</div><div class="lk10g-web r">' + webSvg() + '</div><div class="lk10g-spi">' + SPIDER + '</div>';
    }
  }
  /* l'admin change de fête pendant que le popup est ouvert : on met à jour tout de suite */
  document.addEventListener('lk10deco', applyTheme);

  /* ---------------- CSS + HTML ---------------- */
  function build() {
    if (els.dialog) return;
    var css = document.createElement('style');
    css.textContent =
      '#lk10-gate{position:fixed;inset:0;z-index:16000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.82);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}' +
      '#lk10-gate.show{display:flex}' +
      '.lk10g-box{position:relative;width:440px;max-width:100%;background:linear-gradient(160deg,#1c1c1c,#0d0d0d);border:1px solid rgba(255,222,0,.35);border-radius:18px;padding:34px 28px 28px;text-align:center;color:#eee;box-shadow:0 25px 60px rgba(0,0,0,.8),0 0 40px rgba(255,222,0,.08);font-family:Arial,sans-serif}' +
      '.lk10g-x{position:absolute;top:14px;right:14px;z-index:3;width:34px;height:34px;border-radius:50%;border:1px solid #444;background:#1a1a1a;color:#ccc;font-size:16px;cursor:pointer;transition:.2s}' +
      '.lk10g-x:hover{color:#000;background:#ffde00;border-color:#ffde00}' +
      '.lk10g-ico{position:relative;font-size:30px;color:#ffde00;margin-bottom:10px}' +
      '.lk10g-badge{display:inline-block;padding:3px 14px;border-radius:20px;border:1px solid rgba(255,222,0,.5);background:rgba(255,222,0,.08);color:#ffde00;font-size:11px;font-weight:bold;letter-spacing:1px;margin-bottom:14px}' +
      '.lk10g-title{font-size:25px;font-weight:900;color:#fff;margin:0 0 8px}' +
      '.lk10g-sub{font-size:13px;color:#aaa;margin:0 0 18px;line-height:1.5}' +
      '.lk10g-steps{text-align:left;margin:0 0 14px;padding-left:20px;font-size:13px;color:#ddd;line-height:1.7}' +
      '.lk10g-thanks{font-size:12px;color:#ffde00;margin:0 0 18px;font-style:italic}' +
      '.lk10g-warn{display:none;text-align:left;margin:0 0 16px;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,222,0,.4);background:rgba(255,222,0,.07);font-size:12px;color:#ccc;line-height:1.5}' +
      '.lk10g-warn.show{display:block}' +
      '.lk10g-warn b{display:block;color:#ffde00;margin-bottom:3px;font-size:13px}' +
      '.lk10g-btn{width:100%;height:50px;border:none;border-radius:30px;background:#ffde00;color:#000;font-size:15px;font-weight:900;cursor:pointer;transition:.2s;box-shadow:0 8px 24px rgba(255,222,0,.22)}' +
      '.lk10g-btn:hover:not(:disabled){transform:scale(1.02);background:#fff}' +
      '.lk10g-btn:disabled{opacity:.6;cursor:wait}' +
      /* ----- déco du popup ----- */
      '.lk10g-deco{position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:18px}' +
      '.lk10g-gar{position:absolute;left:0;top:0;width:100%;height:42px;display:block}' +
      '.lk10g-gar .b{animation:lk10gTw 1.6s ease-in-out infinite;filter:drop-shadow(0 0 3px currentColor)}.lk10g-gar .b1{animation-delay:-.5s}.lk10g-gar .b2{animation-delay:-1s}' +
      '.lk10g-snow{position:absolute;inset:0;overflow:hidden;border-radius:18px}' +
      '.lk10g-snow i{position:absolute;top:-8px;left:var(--x);width:var(--s);height:var(--s);border-radius:50%;background:#fff;opacity:.8;box-shadow:0 0 4px rgba(255,255,255,.8);animation:lk10gFall var(--d) linear infinite;animation-delay:var(--dl)}' +
      '.lk10g-hat{position:absolute;left:50%;top:-13px;width:30px;margin-left:-22px;transform:rotate(-14deg);filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))}.lk10g-hat svg{display:block;width:100%;height:auto}' +
      '.lk10g-t-noel{padding-top:52px;border-color:rgba(214,40,40,.55);box-shadow:0 25px 60px rgba(0,0,0,.8),0 0 40px rgba(214,40,40,.2),0 0 80px rgba(46,204,113,.08)}' +
      '.lk10g-t-noel .lk10g-x{top:46px}' +
      '.lk10g-t-noel .lk10g-ico{color:#ff6b6b}' +
      '.lk10g-t-noel .lk10g-badge{border-color:rgba(214,40,40,.6);background:rgba(214,40,40,.12);color:#ff8a93}' +
      '.lk10g-t-noel .lk10g-thanks{color:#7be29a}' +
      '.lk10g-t-noel .lk10g-btn{background:linear-gradient(135deg,#e63946,#b0121f);color:#fff;box-shadow:0 8px 24px rgba(214,40,40,.35)}' +
      '.lk10g-t-noel .lk10g-btn:hover:not(:disabled){background:linear-gradient(135deg,#ff4d5a,#d62828)}' +
      '.lk10g-t-halloween{border-color:rgba(255,138,31,.6);box-shadow:0 25px 60px rgba(0,0,0,.8),0 0 40px rgba(255,138,31,.2),0 0 80px rgba(130,70,220,.12)}' +
      '.lk10g-t-halloween .lk10g-ico{color:#ff8a1f}' +
      '.lk10g-t-halloween .lk10g-badge{border-color:rgba(255,138,31,.6);background:rgba(255,138,31,.12);color:#ffb26b}' +
      '.lk10g-t-halloween .lk10g-thanks{color:#c9a3ff}' +
      '.lk10g-t-halloween .lk10g-btn{background:linear-gradient(135deg,#ff9a3c,#e8620c);color:#1a0a00;box-shadow:0 8px 24px rgba(255,138,31,.3)}' +
      '.lk10g-web{position:absolute;top:0;width:96px;opacity:.7}.lk10g-web svg{display:block;width:100%;height:auto}.lk10g-web.l{left:0}.lk10g-web.r{right:0;transform:scaleX(-1)}' +
      '.lk10g-spi{position:absolute;top:0;left:76%;width:22px;transform-origin:50% 0;animation:lk10gSwing 4s ease-in-out infinite}.lk10g-spi svg{display:block;width:100%;height:auto}' +
      '@keyframes lk10gTw{0%,100%{opacity:1}50%{opacity:.3}}' +
      '@keyframes lk10gFall{from{transform:translate(0,0)}to{transform:translate(var(--sw),520px)}}' +
      '@keyframes lk10gSwing{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}' +
      'html.dc-calm .lk10g-deco *,html.lk10-tv .lk10g-deco *{animation:none!important}html.dc-calm .lk10g-snow,html.lk10-tv .lk10g-snow{display:none}' +
      '@media(prefers-reduced-motion:reduce){.lk10g-deco *{animation:none!important}.lk10g-snow{display:none}}';
    document.head.appendChild(css);

    var d = document.createElement('div');
    d.id = 'lk10-gate';
    d.innerHTML =
      '<div class="lk10g-box" role="dialog" aria-modal="true" aria-labelledby="lk10g-title">' +
        '<div class="lk10g-deco" id="lk10g-deco"></div>' +
        '<button class="lk10g-x" id="lk10g-x" aria-label="Annuler et revenir">✕</button>' +
        '<div class="lk10g-ico"><i class="fas fa-tv"></i></div>' +
        '<span class="lk10g-badge" id="lk10g-badge">PUB 1/2</span>' +
        '<h2 class="lk10g-title" id="lk10g-title">Votre vidéo arrive.</h2>' +
        '<p class="lk10g-sub">Cette étape publicitaire aide à faire vivre CINÉLK10.</p>' +
        '<ol class="lk10g-steps"><li>Ouvre la pub dans un nouvel onglet.</li><li>Ferme cet onglet et reviens ici pour accéder au lecteur.</li></ol>' +
        '<p class="lk10g-thanks">Merci de votre soutien ❤</p>' +
        '<div class="lk10g-warn" id="lk10g-warn"><b>La publicité semble bloquée</b>Un bloqueur de publicité ou un filtre semble actif. Pour accéder au lecteur, désactive-le pour CINÉLK10, puis vérifie à nouveau.</div>' +
        '<button class="lk10g-btn" id="lk10g-btn">Regarder la pub (1/2)</button>' +
      '</div>';
    document.body.appendChild(d);

    els.dialog = d;
    els.box   = d.querySelector('.lk10g-box');
    els.deco  = d.querySelector('#lk10g-deco');
    els.ico   = d.querySelector('.lk10g-ico');
    els.badge = d.querySelector('#lk10g-badge');
    els.warn  = d.querySelector('#lk10g-warn');
    els.btn   = d.querySelector('#lk10g-btn');
    els.x     = d.querySelector('#lk10g-x');

    els.btn.addEventListener('click', onButton);
    els.x.addEventListener('click', cancelGate);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.dialog.classList.contains('show')) cancelGate();
    });
    applyTheme();
  }

  /* ---------------- CHARGEMENT DU SCRIPT ADSTERRA ---------------- */
  function loadAdScript(i) {
    return new Promise(function (resolve) {
      if (scriptState[i] === 'ok') return resolve(true);
      var old = document.querySelector('script[data-lk10-ad="' + i + '"]');
      if (old) old.remove();
      scriptState[i] = 'loading';
      var s = document.createElement('script');
      s.async = true;
      s.src = AD_SCRIPTS[i];
      s.setAttribute('data-cfasync', 'false');
      s.setAttribute('data-lk10-ad', i);
      var done = false;
      function finish(ok) {
        if (done) return; done = true;
        scriptState[i] = ok ? 'ok' : 'blocked';
        resolve(ok);
      }
      s.onload  = function () { finish(true); };
      s.onerror = function () { finish(false); };
      setTimeout(function () { finish(true); }, 7000); // aucune réponse = on ne bloque pas l'utilisateur
      document.head.appendChild(s);
    });
  }

  /* ---------------- AFFICHAGE DES ÉTAPES ---------------- */
  function renderStep() {
    els.badge.textContent = 'PUB ' + step + '/' + TOTAL;
    els.btn.disabled = true;
    els.btn.textContent = 'Préparation…';
    els.warn.classList.remove('show');
    blocked = false;
    loadAdScript(step - 1).then(function (ok) {
      if (!els.dialog.classList.contains('show')) return;
      if (ok) {
        els.btn.disabled = false;
        els.btn.textContent = 'Regarder la pub (' + step + '/' + TOTAL + ')';
      } else {
        blocked = true;
        els.warn.classList.add('show');
        els.btn.disabled = false;
        els.btn.textContent = 'Vérifier à nouveau';
      }
    });
  }

  function waitReturn() {
    return new Promise(function (resolve) {
      var start = Date.now();
      (function tick() {
        var elapsed = Date.now() - start;
        var left = Math.max(0, Math.ceil((MIN_WAIT_MS - elapsed) / 1000));
        if (left > 0) {
          els.btn.textContent = 'Reviens ici après la pub… ' + left + 's';
          return setTimeout(tick, 250);
        }
        if (document.hidden) {           // l'utilisateur est encore sur l'onglet pub
          els.btn.textContent = 'Ferme l’onglet de pub pour continuer';
          return setTimeout(tick, 400);
        }
        resolve();
      })();
    });
  }

  function onButton() {
    if (busy) return;

    if (blocked) {                        // « Vérifier à nouveau »
      busy = true;
      scriptState[step - 1] = null;
      els.btn.disabled = true;
      els.btn.textContent = 'Vérification…';
      loadAdScript(step - 1).then(function (ok) {
        busy = false;
        if (ok) { blocked = false; els.warn.classList.remove('show'); els.btn.disabled = false; els.btn.textContent = 'Regarder la pub (' + step + '/' + TOTAL + ')'; }
        else { els.btn.disabled = false; els.btn.textContent = 'Vérifier à nouveau'; els.warn.classList.add('show'); }
      });
      return;
    }

    busy = true;
    els.btn.disabled = true;
    var link = AD_DIRECT_LINKS[step - 1];
    if (link) { try { window.open(link, '_blank', 'noopener'); } catch (e) {} }
    // sans lien direct : le script Adsterra (chargé juste avant) déclenche la pub sur CE clic

    waitReturn().then(function () {
      busy = false;
      if (step < TOTAL) { step++; renderStep(); }
      else { completeGate(); }
    });
  }

  /* ---------------- OUVERTURE / FERMETURE ---------------- */
  function showGate() {
    build();
    applyTheme();            // reprend la fête actuelle (Noël, Halloween...) à chaque ouverture
    step = 1; busy = false;
    els.dialog.classList.add('show');
    renderStep();
  }

  function hideGate() { if (els.dialog) els.dialog.classList.remove('show'); }

  function cancelGate() {
    hideGate();
    pendingContent = null;
    if (typeof window.closeP === 'function') window.closeP();
  }

  function playNow(c) {
    var box = document.getElementById('video-container');
    if (!box) return;
    try { if (typeof adTimer !== 'undefined' && adTimer) clearInterval(adTimer); } catch (e) {}
    if (typeof window.sanitizePlayerIframe === 'function') c = window.sanitizePlayerIframe(c);
    box.innerHTML = c;
  }

  /* ---------------- PLEIN ÉCRAN AUTOMATIQUE ---------------- */
  function goFullscreen() {
    if (!AUTO_FULLSCREEN) return;
    var box = document.getElementById('video-container');
    if (!box || document.fullscreenElement) return;
    var req = box.requestFullscreen || box.webkitRequestFullscreen;
    if (!req) return;
    try {
      var p = req.call(box);
      if (p && p.catch) p.catch(function () {}); // refusé par le navigateur : le film se lance quand même en normal
    } catch (e) {}
  }

  function exitFs() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    } catch (e) {}
  }

  function completeGate() {
    gatePassed = true;
    try { if (REMEMBER_MIN) localStorage.setItem(LS_KEY, String(Date.now())); } catch (e) {}
    hideGate();
    if (pendingContent) {
      playNow(pendingContent);
      goFullscreen();          // plein écran automatique si AUTO_FULLSCREEN = true
    }
    pendingContent = null;
  }

  /* ====================== BOUTON « SOURCES » SUR LA VIDÉO ====================== */
  /* Le bouton est posé DANS #video-container : il reste donc visible en plein écran.
     Le lecteur est un iframe d'un autre site : on ne peut pas savoir quand la souris bouge dessus.
     On surveille donc une petite zone invisible dans le coin haut-droite : en bougeant la souris (ou en touchant) là,
     le bouton apparaît, puis se cache tout seul. Il s'affiche aussi quelques secondes au début du film. */
  var src = { el: null, hideT: 0, open: false, hover: false, css: false };

  function srcCss() {
    if (src.css) return; src.css = true;
    var s = document.createElement('style');
    s.textContent =
      '.lk10s{position:absolute;inset:0;z-index:50;pointer-events:none;font-family:Arial,sans-serif}' +
      '.lk10s.none{display:none}' +
      '.lk10s-hot{position:absolute;top:0;right:0;width:200px;height:64px;pointer-events:auto}' +
      '.lk10s-btn{position:absolute;top:14px;right:14px;display:flex;align-items:center;gap:8px;background:rgba(10,12,20,.86);color:#fff;border:1px solid #2c3146;border-radius:10px;padding:10px 16px;font:700 13px Arial,sans-serif;cursor:pointer;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .25s,transform .25s,border-color .2s;touch-action:manipulation}' +
      '.lk10s-btn i{color:#ff5a66}' +
      '.lk10s.show .lk10s-btn{opacity:1;transform:none;pointer-events:auto}' +
      '.lk10s-btn:hover{border-color:#ff5a66}' +
      '.lk10s.open .lk10s-btn{opacity:0;pointer-events:none}' +
      '.lk10s-scrim{position:absolute;inset:0;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .25s}' +
      '.lk10s.open .lk10s-scrim{opacity:1;pointer-events:auto}' +
      '.lk10s-panel{position:absolute;top:0;right:0;bottom:0;width:min(340px,88%);display:flex;flex-direction:column;background:#0a0c14;border-left:1px solid #1d2030;color:#fff;transform:translateX(100%);transition:transform .28s ease;pointer-events:none}' +
      '.lk10s.open .lk10s-panel{transform:none;pointer-events:auto}' +
      '.lk10s-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #1d2030;font-size:16px}' +
      '.lk10s-close{background:none;border:0;color:#aaa;font-size:18px;cursor:pointer;width:34px;height:34px;border-radius:8px}.lk10s-close:hover{color:#fff;background:#1a1d2b}' +
      '.lk10s-body{flex:1;overflow-y:auto;padding:14px 16px 20px}' +
      '.lk10s-sec{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#7c8199;margin:6px 2px 10px}' +
      '.lk10s-it{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:#0f121c;border:1px solid #1d2233;border-radius:10px;color:#fff;padding:13px 14px;margin-bottom:8px;font:700 14px Arial,sans-serif;cursor:pointer;transition:border-color .2s}' +
      '.lk10s-it:hover{border-color:#4a5075}' +
      '.lk10s-it i{width:18px;text-align:center;color:#ffde00}' +
      '.lk10s-it span{flex:1}' +
      '.lk10s-it em{font-style:normal;font-size:11px;background:#e11d2e;color:#fff;border-radius:999px;padding:3px 10px}' +
      '.lk10s-it.on{border-color:#e11d2e;color:#ff5a66;background:#17101a}' +
      '.lk10s-langs{display:flex;gap:8px;margin-bottom:12px}.lk10s-langs .lk10s-it{margin:0;justify-content:center}' +
      '.lk10s-note{font-size:12px;color:#8b90a8;line-height:1.5;margin-top:6px}' +
      '@media(max-width:600px){.lk10s-btn{top:10px;right:10px;padding:9px 13px}}';
    document.head.appendChild(s);
  }

  function G() {
    var o = {};
    try { o.m = currentMovie; } catch (e) {}
    try { o.lang = currentLanguage; } catch (e) {}
    try { o.server = currentServer; } catch (e) {}
    try { o.ep = currentEpisodeIndex; } catch (e) {}
    return o;
  }
  function isAnimeM(m) {
    return !!(m && ((m.genre && String(m.genre).toLowerCase().indexOf('anime') > -1) || m.dir === 'Voiranime' || (m.id && String(m.id).indexOf('voir_anime') === 0)));
  }
  function listSources() {
    var s = G(), m = s.m;
    if (!m || isAnimeM(m)) return [];                       // les animés n'ont qu'un seul lecteur (bouton « REGARDER »)
    var d = m.type === 'serie' ? (m.episodes && m.episodes[s.ep || 0]) : m;
    if (!d) return [];
    var vf = s.lang !== 'vostfr';
    var P = vf ? d.iframe_premium : (d.iframe_premium_vostfr || d.iframe_premium);
    var V = vf ? d.iframe_vidzy : (d.iframe_vidzy_vostfr || d.iframe_vidzy);
    var U = vf ? d.iframe_uqload : (d.iframe_uqload_vostfr || d.iframe_uqload);
    var out = [];
    if (P && isPrivileged()) out.push({ k: 'premium', label: 'Premium', icon: 'fa-crown' });
    if (V) out.push({ k: 'vidzy', label: 'Vidzy', icon: 'fa-bolt' });
    if (U) {
      var h = String(U).toLowerCase();
      out.push({ k: 'uqload', label: h.indexOf('voembed') > -1 ? 'Voembed' : (h.indexOf('vidmoly') > -1 ? 'Vidmoly' : 'Uqload'), icon: 'fa-play-circle' });
    }
    return out;
  }
  function listLangs() {
    var sel = document.getElementById('language-select'), out = [];
    if (!sel || sel.options.length < 2) return out;
    for (var i = 0; i < sel.options.length; i++) out.push({ v: sel.options[i].value, t: sel.options[i].text });
    return out;
  }

  function srcRender() {
    if (!src.el) return;
    var s = G(), list = listSources(), langs = listLangs(), body = src.el.querySelector('.lk10s-body'), h = '';
    if (list.length < 2 && langs.length < 2) { src.el.classList.add('none'); return; }
    src.el.classList.remove('none');
    if (langs.length > 1) {
      h += '<div class="lk10s-sec">Langue</div><div class="lk10s-langs">';
      langs.forEach(function (l) { h += '<button type="button" class="lk10s-it' + (s.lang === l.v ? ' on' : '') + '" data-lang="' + l.v + '"><span style="text-align:center">' + l.t + '</span></button>'; });
      h += '</div>';
    }
    if (list.length) {
      h += '<div class="lk10s-sec">Lecteurs</div>';
      list.forEach(function (x) {
        var on = s.server === x.k;
        h += '<button type="button" class="lk10s-it' + (on ? ' on' : '') + '" data-srv="' + x.k + '"><i class="fas ' + x.icon + '"></i><span>' + x.label + '</span>' + (on ? '<em>Actif</em>' : '') + '</button>';
      });
      h += '<div class="lk10s-note">Si la vidéo ne se lance pas ou saccade, essaie un autre lecteur.</div>';
    }
    body.innerHTML = h;
  }

  function srcShow() {
    if (!src.el) return;
    src.el.classList.add('show');
    clearTimeout(src.hideT);
    src.hideT = setTimeout(function () { if (!src.open && !src.hover) src.el.classList.remove('show'); }, SOURCES_HIDE_MS);
  }
  function srcOpen() { srcRender(); src.open = true; src.el.classList.add('open'); clearTimeout(src.hideT); }
  function srcClose() {
    if (!src.el) return;
    src.open = false; src.el.classList.remove('open');
    srcShow();
  }

  function srcBuild() {
    if (src.el) return;
    srcCss();
    var d = document.createElement('div'); d.className = 'lk10s'; d.id = 'lk10-src';
    d.innerHTML =
      '<div class="lk10s-hot"></div>' +
      '<button type="button" class="lk10s-btn" aria-label="Changer de source"><i class="fas fa-list-ul"></i> Sources</button>' +
      '<div class="lk10s-scrim"></div>' +
      '<aside class="lk10s-panel" role="dialog" aria-label="Changer de source"><div class="lk10s-head"><b>Changer de source</b><button type="button" class="lk10s-close" aria-label="Fermer">✕</button></div><div class="lk10s-body"></div></aside>';
    src.el = d;
    var hot = d.querySelector('.lk10s-hot'), btn = d.querySelector('.lk10s-btn');
    ['mousemove', 'mouseenter', 'touchstart', 'pointerdown'].forEach(function (ev) { hot.addEventListener(ev, srcShow, { passive: true }); });
    btn.addEventListener('mouseenter', function () { src.hover = true; srcShow(); });
    btn.addEventListener('mouseleave', function () { src.hover = false; srcShow(); });
    btn.addEventListener('click', srcOpen);
    d.querySelector('.lk10s-close').addEventListener('click', srcClose);
    d.querySelector('.lk10s-scrim').addEventListener('click', srcClose);
    d.querySelector('.lk10s-body').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.srv && typeof window.changeServer === 'function') {
        window.changeServer(b.dataset.srv);          // même fonction que les boutons PREMIUM / VIDZY / UQLOAD sous la vidéo
      } else if (b.dataset.lang) {
        var sel = document.getElementById('language-select');
        if (sel && typeof window.changeLanguage === 'function') { sel.value = b.dataset.lang; window.changeLanguage(); }
      }
      setTimeout(function () { srcRender(); srcClose(); }, 120);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && src.open) srcClose(); });
  }

  /* Garde le bouton dans la vidéo : le site remplace tout le contenu de #video-container à chaque changement de lecteur */
  function srcWatch() {
    if (!SOURCES_BTN) return;
    var box = document.getElementById('video-container');
    if (!box || box.__lk10w) return;
    box.__lk10w = true;
    var sync = function () {
      var has = !!box.querySelector('iframe');
      if (has) {
        srcBuild();
        if (src.el.parentNode !== box) { box.appendChild(src.el); src.open = false; src.el.classList.remove('open'); srcRender(); srcShow(); }
      } else if (src.el && src.el.parentNode === box) {
        src.open = false; src.el.classList.remove('open', 'show');
        box.removeChild(src.el);
      }
    };
    new MutationObserver(sync).observe(box, { childList: true });
    box.addEventListener('mousemove', function () { if (src.el && src.el.parentNode === box) srcShow(); }, { passive: true });
    sync();
  }

  /* ---------------- BRANCHEMENT SUR LE SITE ---------------- */
  function wrapSetVideo() {
    var cur = window.setVideoContent;
    if (typeof cur !== 'function' || cur.__lk10gate) return;
    origSetVideo = cur;
    var w = function (c) {
      // VIP / admin, lien indisponible, écran « VIP » : comportement d'origine
      if (isPrivileged() || !c || c === 'VIP_LOCK') {
        hideGate();
        return origSetVideo.apply(this, arguments);
      }
      if (gatePassed) { return playNow(c); }   // pub déjà faite : lecture directe

      // Pub à faire : on garde le lien en attente et on vide le lecteur
      pendingContent = c;
      var box = document.getElementById('video-container');
      if (box) box.innerHTML = '';
      try { if (typeof adTimer !== 'undefined' && adTimer) clearInterval(adTimer); } catch (e) {}
      if (!els.dialog || !els.dialog.classList.contains('show')) showGate();
    };
    w.__lk10gate = true;
    window.setVideoContent = w;
  }

  function hook() {
    if (typeof window.setVideoContent !== 'function' || typeof window.openP !== 'function') {
      return setTimeout(hook, 200);
    }
    var origOpenP = window.openP;

    // Nouvelle ouverture de fiche => nouvelle pub (sauf délai mémorisé)
    window.openP = function () {
      gatePassed = recentlyPassed();
      pendingContent = null;
      hideGate();
      return origOpenP.apply(this, arguments);
    };

    // Fermer le lecteur ferme aussi la fenêtre de pub et quitte le plein écran
    var origCloseP = window.closeP;
    if (typeof origCloseP === 'function') {
      window.closeP = function () { exitFs(); hideGate(); pendingContent = null; return origCloseP.apply(this, arguments); };
    }

    wrapSetVideo();
    srcWatch();
    setInterval(wrapSetVideo, 500); // se remet en place si un autre script l'écrase
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook);
  else hook();
})();
