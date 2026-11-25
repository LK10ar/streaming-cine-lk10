/* ==========================================================================
   Ciné LK10 — Étape pub (2 écrans) avant le lecteur  ·  Adsterra
   Remplace ENTIÈREMENT l'ancien lk10-adgate.js (déjà chargé dans index.html).
   Aucune modif HTML nécessaire.
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
  var TOTAL         = AD_SCRIPTS.length;

  /* ---------------- ÉTAT ---------------- */
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

  /* ---------------- CSS + HTML ---------------- */
  function build() {
    if (els.dialog) return;
    var css = document.createElement('style');
    css.textContent =
      '#lk10-gate{position:fixed;inset:0;z-index:16000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.82);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}' +
      '#lk10-gate.show{display:flex}' +
      '.lk10g-box{position:relative;width:440px;max-width:100%;background:linear-gradient(160deg,#1c1c1c,#0d0d0d);border:1px solid rgba(255,222,0,.35);border-radius:18px;padding:34px 28px 28px;text-align:center;color:#eee;box-shadow:0 25px 60px rgba(0,0,0,.8),0 0 40px rgba(255,222,0,.08);font-family:Arial,sans-serif}' +
      '.lk10g-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid #444;background:#1a1a1a;color:#ccc;font-size:16px;cursor:pointer;transition:.2s}' +
      '.lk10g-x:hover{color:#000;background:#ffde00;border-color:#ffde00}' +
      '.lk10g-ico{font-size:30px;color:#ffde00;margin-bottom:10px}' +
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
      '.lk10g-btn:disabled{opacity:.6;cursor:wait}';
    document.head.appendChild(css);

    var d = document.createElement('div');
    d.id = 'lk10-gate';
    d.innerHTML =
      '<div class="lk10g-box" role="dialog" aria-modal="true" aria-labelledby="lk10g-title">' +
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
    els.badge = d.querySelector('#lk10g-badge');
    els.warn  = d.querySelector('#lk10g-warn');
    els.btn   = d.querySelector('#lk10g-btn');
    els.x     = d.querySelector('#lk10g-x');

    els.btn.addEventListener('click', onButton);
    els.x.addEventListener('click', cancelGate);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.dialog.classList.contains('show')) cancelGate();
    });
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

  function completeGate() {
    gatePassed = true;
    try { if (REMEMBER_MIN) localStorage.setItem(LS_KEY, String(Date.now())); } catch (e) {}
    hideGate();
    if (pendingContent) playNow(pendingContent);
    pendingContent = null;
  }

  /* ---------------- BRANCHEMENT SUR LE SITE ---------------- */
  function hook() {
    if (typeof window.setVideoContent !== 'function' || typeof window.openP !== 'function') {
      return setTimeout(hook, 200);
    }
    origSetVideo = window.setVideoContent;
    var origOpenP = window.openP;

    // Nouvelle ouverture de fiche => nouvelle pub (sauf délai mémorisé)
    window.openP = function () {
      gatePassed = recentlyPassed();
      pendingContent = null;
      hideGate();
      return origOpenP.apply(this, arguments);
    };

    window.setVideoContent = function (c) {
      // VIP / admin, lien indisponible, écran « VIP » : comportement d'origine
      if (isPrivileged() || !c || c === 'VIP_LOCK') {
        hideGate();
        return origSetVideo.apply(this, arguments);
      }
      if (gatePassed) { return playNow(c); }   // pub déjà faite : lecture directe (sans l'ancien chrono de 5 s)

      // Pub à faire : on garde le lien en attente et on vide le lecteur
      pendingContent = c;
      var box = document.getElementById('video-container');
      if (box) box.innerHTML = '';
      try { if (typeof adTimer !== 'undefined' && adTimer) clearInterval(adTimer); } catch (e) {}
      if (!els.dialog || !els.dialog.classList.contains('show')) showGate();
    };

    // Fermer le lecteur ferme aussi la fenêtre de pub
    var origCloseP = window.closeP;
    if (typeof origCloseP === 'function') {
      window.closeP = function () { hideGate(); pendingContent = null; return origCloseP.apply(this, arguments); };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook);
  else hook();
})();
