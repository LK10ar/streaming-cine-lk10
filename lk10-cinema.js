/* Ciné LK10 — lk10-cinema.js
   1) MODE CINÉMA (plein écran « CSS », sans le plein écran natif capricieux) : la vidéo occupe tout l'écran.
        - sur TÉLÉ : se lance tout seul quand on choisit un lecteur (Premium / Uqload / Vidzy) — option activable / désactivable
        - bouton « Cinéma » dans la barre sous la vidéo (télé) ; touche RETOUR de la télécommande = on quitte le mode cinéma
   2) OPTIONS TÉLÉ (barre sous la vidéo) : « Plein écran auto » et « Épisode suivant auto » (OUI / NON)
   3) LANCER SUR LA TÉLÉ depuis le téléphone / PC : si ta télé est ouverte sur le site avec le même compte,
      un bouton « Lancer sur la télé » apparaît sur la fiche du titre ; la télé ouvre le titre en mode cinéma.
   À ajouter dans index.html, TOUT EN DERNIER (après lk10-tv-fix.js) :  <script src="lk10-cinema.js"></script>
   Nécessite le server.js fourni (3 routes /api/tv/inbox, /api/tv/status, /api/tv/cast). */
(function () {
  'use strict';
  var de = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var LS = null; try { LS = window.localStorage; } catch (e) {}
  var tok = function () { try { return LS.getItem('monBadgeCineLK10') || ''; } catch (e) { return ''; } };
  var isTV = function () { return de.classList.contains('lk10-tv'); };
  var shown = function (id) { var e = $(id); return !!e && getComputedStyle(e).display !== 'none'; };
  function toast(m) { try { showToast(m, 'fa-info-circle', '#ffde00'); } catch (e) {} }
  function api(path, opts) {
    opts = opts || {}; opts.headers = { 'Content-Type': 'application/json', authorization: tok() };
    return fetch(API_URL + path, opts).then(function (r) { return r.json().catch(function () { return { success: false }; }); });
  }
  function wrap(name, fn) {
    var o = window[name]; if (typeof o !== 'function') return;
    window[name] = function () { return fn.call(this, o, arguments); };
  }
  /* options mémorisées (par défaut : OUI) */
  function opt(k) { try { return LS.getItem(k) !== '0'; } catch (e) { return true; } }
  function setOpt(k, v) { try { LS.setItem(k, v ? '1' : '0'); } catch (e) {} }
  var K_CINE = 'lk10_auto_cinema', K_NEXT = 'lk10_auto_next';

  /* ---------- CSS ---------- */
  var st = document.createElement('style');
  st.textContent =
    'html.lk10-cinema,html.lk10-cinema body{overflow:hidden!important}' +
    /* la vidéo prend tout l'écran ; on neutralise les transformations des parents (sinon « fixed » reste coincé dans le cadre) */
    'html.lk10-cinema .player-content,html.lk10-cinema #player-overlay{transform:none!important;animation:none!important;filter:none!important;perspective:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;will-change:auto!important;contain:none!important}' +
    'html.lk10-cinema #video-container{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border-radius:0!important;aspect-ratio:auto!important;z-index:2147483000!important;background:#000!important}' +
    '@supports (height:100dvh){html.lk10-cinema #video-container{height:100dvh!important}}' +
    'html.lk10-cinema #video-container iframe{width:100%!important;height:100%!important;border:0!important}' +
    /* petits boutons (souris / tactile) : quitter + épisode suivant */
    '#lk10-cine-ui{display:none;position:fixed;top:10px;right:10px;z-index:2147483001;gap:8px}' +
    'html.lk10-cinema #lk10-cine-ui{display:flex}' +
    '#lk10-cine-ui button{width:46px;height:46px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(0,0,0,.55);color:#fff;font-size:18px;cursor:pointer;opacity:.55;transition:.2s}' +
    '#lk10-cine-ui button:hover,#lk10-cine-ui button:focus{opacity:1;border-color:#ffde00;outline:none}' +
    '#lk10-opts{display:flex;align-items:center;flex-wrap:wrap;gap:8px}' +
    '.lk10-chip.lk10-on{border-color:#2ecc71}.lk10-chip.lk10-on i{color:#2ecc71}' +
    '.lk10-chip.lk10-off{opacity:.75}.lk10-chip.lk10-off i{color:#e74c3c}';
  document.head.appendChild(st);

  /* ---------- Interface du mode cinéma ---------- */
  var active = false, popping = false;
  function ui() {
    var u = $('lk10-cine-ui');
    if (!u) {
      u = document.createElement('div'); u.id = 'lk10-cine-ui';
      u.innerHTML = '<button type="button" id="lk10-cine-next" title="Épisode suivant" style="display:none"><i class="fas fa-step-forward"></i></button>' +
                    '<button type="button" id="lk10-cine-x" title="Quitter le mode cinéma"><i class="fas fa-times"></i></button>';
      de.appendChild(u);                                    // sur <html> : le zoom éventuel du body ne l'affecte pas
      $('lk10-cine-x').onclick = function () { exitCinema(); };
      $('lk10-cine-next').onclick = function () { var n = $('lk10-next'); if (n && !n.disabled) n.click(); };
    }
    return u;
  }
  function refreshUi() {
    ui(); var m = null; try { m = currentMovie; } catch (e) {}
    var nx = $('lk10-cine-next'), has = false;
    try { has = !!m && m.type === 'serie' && m.episodes && currentEpisodeIndex < m.episodes.length - 1; } catch (e) {}
    if (nx) nx.style.display = has ? '' : 'none';
  }
  function enterCinema() {
    if (active || !$('video-container') || !shown('player-overlay')) return;
    active = true; ui();
    try { document.body.style.zoom = ''; } catch (e) {}      // jamais de zoom en plein écran
    var pill = $('lk10-zoom-reset'); if (pill) pill.style.display = 'none';
    de.classList.add('lk10-cinema');
    try { history.pushState({ lk10cine: 1 }, ''); } catch (e) {}  // le bouton Retour de la télé = on quitte le cinéma
    refreshUi();
    setTimeout(function () {
      var vc = $('video-container'); if (!vc) return;
      var f = vc.querySelector('iframe'), s = $('skip-ad-btn');
      try { if (f) { f.setAttribute('tabindex', '0'); f.focus(); } else if (s) s.focus(); } catch (e) {}
    }, 250);
  }
  function exitCinema(fromPop) {
    if (!active) return;
    active = false; de.classList.remove('lk10-cinema');
    if (!fromPop) { try { if (history.state && history.state.lk10cine) { popping = true; history.back(); } } catch (e) {} }
    var vc = $('video-container'); try { (document.querySelector('#lk10-opts button') || vc).focus({ preventScroll: true }); } catch (e) {}
  }
  window.addEventListener('popstate', function () {
    if (popping) { popping = false; return; }
    if (active) exitCinema(true);
  });
  /* Retour / Échap : quitte le cinéma en premier (avant le reste du site) */
  var BACK = { 4: 1, 8: 1, 27: 1, 461: 1, 10009: 1 };
  window.addEventListener('keydown', function (e) {
    if (!active) return;
    if (BACK[e.keyCode] || e.key === 'GoBack' || e.key === 'BrowserBack' || e.key === 'Escape') {
      e.preventDefault(); e.stopImmediatePropagation(); exitCinema();
    }
  }, true);

  /* ---------- Déclenchement automatique : quand on choisit un lecteur ---------- */
  wrap('changeServer', function (o, a) {
    var r = o.apply(this, a);
    try {
      if (isTV() && opt(K_CINE)) {
        var vc = $('video-container');
        if (vc && vc.querySelector('iframe, #skip-ad-btn')) enterCinema();
      }
    } catch (e) {}
    return r;
  });
  wrap('closeP', function (o, a) { exitCinema(); return o.apply(this, a); });

  /* « Épisode suivant » : OUI = on enchaîne directement en plein écran ; NON = on revient à la page du lecteur */
  document.addEventListener('click', function (e) {
    if (!isTV() || !e.target || !e.target.closest || !e.target.closest('#lk10-next, #lk10-cine-next')) return;
    setTimeout(function () {
      if (opt(K_NEXT)) { enterCinema(); refreshUi(); } else exitCinema();
    }, 80);
  }, true);

  /* ---------- Options + bouton « Lancer sur la télé » dans la barre sous la vidéo ---------- */
  function chip(id, icon, html, cls) { return '<button type="button" id="' + id + '" class="lk10-chip ' + (cls || '') + '"><i class="fas ' + icon + '"></i><span>' + html + '</span></button>'; }
  function refreshChips() {
    var a = $('lk10-opt-cine'), n = $('lk10-opt-next');
    if (a) { var o1 = opt(K_CINE); a.classList.toggle('lk10-on', o1); a.classList.toggle('lk10-off', !o1); a.querySelector('span').textContent = 'Plein écran auto : ' + (o1 ? 'OUI' : 'NON'); }
    if (n) { var o2 = opt(K_NEXT); n.classList.toggle('lk10-on', o2); n.classList.toggle('lk10-off', !o2); n.querySelector('span').textContent = 'Épisode suivant auto : ' + (o2 ? 'OUI' : 'NON'); }
  }
  function ensureChips() {
    var bar = $('lk10-bar'); if (!bar || $('lk10-opts')) return;
    var box = document.createElement('div'); box.id = 'lk10-opts';
    if (isTV()) {
      box.innerHTML = chip('lk10-cine-go', 'fa-expand', 'Cinéma', 'lk10-primary') + chip('lk10-opt-cine', 'fa-expand-arrows-alt', '') + chip('lk10-opt-next', 'fa-forward', '');
    } else {
      box.innerHTML = chip('lk10-cast', 'fa-tv', 'Lancer sur la télé', 'lk10-primary');
      box.firstChild.style.display = 'none';
    }
    bar.appendChild(box);
    var g = $('lk10-cine-go'); if (g) g.onclick = function () { enterCinema(); };
    var a = $('lk10-opt-cine'); if (a) a.onclick = function () { setOpt(K_CINE, !opt(K_CINE)); refreshChips(); };
    var n = $('lk10-opt-next'); if (n) n.onclick = function () { setOpt(K_NEXT, !opt(K_NEXT)); refreshChips(); };
    var c = $('lk10-cast'); if (c) c.onclick = castNow;
    refreshChips();
  }
  wrap('openP', function (o, a) { var r = o.apply(this, a); try { setTimeout(function () { ensureChips(); checkTv(); }, 60); } catch (e) {} return r; });
  wrap('updatePlayerInterface', function (o, a) { var r = o.apply(this, a); try { ensureChips(); refreshUi(); } catch (e) {} return r; });

  /* ---------- Téléphone / PC : la télé est-elle en ligne ? bouton « Lancer sur la télé » ---------- */
  var tvOnline = false, lastCheck = 0;
  function checkTv() {
    if (isTV() || !tok() || !shown('player-overlay')) return;
    if (Date.now() - lastCheck < 3000) return; lastCheck = Date.now();
    api('/api/tv/status').then(function (d) {
      tvOnline = !!(d && d.online);
      var c = $('lk10-cast'); if (c) c.style.display = tvOnline ? '' : 'none';
    }).catch(function () {});
  }
  setInterval(checkTv, 10000);
  function castNow() {
    var m = null, ep = 0, lang = 'vf';
    try { m = currentMovie; ep = currentEpisodeIndex | 0; lang = currentLanguage; } catch (e) {}
    if (!m) return;
    api('/api/tv/cast', { method: 'POST', body: JSON.stringify({ id: m.id, ep: m.type === 'serie' ? ep : 0, lang: lang }) }).then(function (d) {
      if (d && d.success) toast('Envoyé sur la télé : ' + m.title);
      else { toast((d && d.message) || 'Impossible de joindre la télé.'); checkTv(); }
    }).catch(function () { toast('Erreur de connexion.'); });
  }

  /* ---------- Télé : on reçoit les commandes du téléphone ---------- */
  function onCast(cmd) {
    var list = []; try { list = moviesDB || []; } catch (e) {}
    var m = list.find(function (x) { return x.id === cmd.id; });
    if (!m) return toast('Titre introuvable sur la télé.');
    try { if (typeof closeProfilePage === 'function') closeProfilePage(); } catch (e) {}
    exitCinema();
    toast('Lancement depuis ton téléphone : ' + m.title);
    openP(m.id, m.type === 'serie' ? (cmd.ep | 0) : null);
    setTimeout(function () {
      try {
        var sel = $('language-select');
        if (sel && cmd.lang && Array.prototype.some.call(sel.options, function (o) { return o.value === cmd.lang; }) && sel.value !== cmd.lang) { sel.value = cmd.lang; changeLanguage(); }
        var vc = $('video-container');
        if (vc && vc.querySelector('iframe, #skip-ad-btn')) enterCinema();
        else changeServer(currentServer);
        setTimeout(function () { if (!active) enterCinema(); }, 400);
      } catch (e) {}
    }, 400);
  }
  var polling = false;
  setInterval(function () {
    if (!isTV() || !tok() || document.hidden || polling) return;
    try { if (typeof hasAccess !== 'undefined' && !hasAccess) return; } catch (e) {}
    polling = true;
    api('/api/tv/inbox').then(function (d) { if (d && d.success && d.cmd) onCast(d.cmd); }).catch(function () {}).then(function () { polling = false; });
  }, 4000);
})();
