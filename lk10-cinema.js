/* Ciné LK10 — lk10-cinema.js (v10)
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
  function opt(k) {
    try { var v = LS.getItem(k); if (v === '1') return true; if (v === '0') return false; } catch (e) {}
    return isTV();            // jamais réglé : OUI sur télé, NON sur PC / mobile (rien ne change tant qu'on n'active pas l'option)
  }
  function setOpt(k, v) { try { LS.setItem(k, v ? '1' : '0'); } catch (e) {} }
  var K_CINE = 'lk10_auto_cinema', K_NEXT = 'lk10_auto_next';

  /* ---------- CSS ---------- */
  var st = document.createElement('style');
  st.textContent =
    'html.lk10-cinema,html.lk10-cinema body{overflow:hidden!important}' +
    'html.lk10-tv:not(.lk10-cinema) #video-container{width:min(100%,86vh)!important;margin-left:auto!important;margin-right:auto!important}' +
    /* la vidéo prend tout l'écran ; on neutralise les transformations des parents (sinon « fixed » reste coincé dans le cadre) */
    'html.lk10-cinema .player-content,html.lk10-cinema #player-overlay{transform:none!important;animation:none!important;filter:none!important;perspective:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;will-change:auto!important;contain:none!important}' +
    'html.lk10-cinema #video-container{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:auto!important;height:auto!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border-radius:0!important;aspect-ratio:auto!important;overflow:hidden!important;z-index:2147483000!important;background:#000!important}' +
    'html.lk10-cinema #video-container iframe{width:100%!important;height:100%!important;border:0!important}' +
    /* petits boutons (souris / tactile) : quitter + épisode suivant */
    '#lk10-cine-ui{display:none;position:fixed;top:8px;left:8px;z-index:2147483001;gap:6px;pointer-events:none;transition:opacity .4s}' +
    'html.lk10-cinema #lk10-cine-ui{display:flex}' +
    '#lk10-cine-ui.hide{opacity:0}' +
    '#lk10-cine-ui button{pointer-events:auto;width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(0,0,0,.55);color:#fff;font-size:16px;cursor:pointer;opacity:.7;transition:.2s}' +
    '#lk10-cine-ui button:hover,#lk10-cine-ui button:focus{opacity:1;border-color:#ffde00;outline:none}' +
    '#lk10-opts{display:flex;align-items:center;flex-wrap:wrap;gap:8px}' +
    '.lk10-chip.lk10-on{border-color:#2ecc71}.lk10-chip.lk10-on i{color:#2ecc71}' +
    '.lk10-chip.lk10-off{opacity:.75}.lk10-chip.lk10-off i{color:#e74c3c}' +
    '.lk10-pick{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;margin-top:20px;max-width:90%}' +
    '.lk10-pick .lk10-chip{background:rgba(0,0,0,.7)}' +
    '.lk10-pick .lk10-chip.lk10-cur{background:var(--primary,#ffde00);color:#000;border-color:var(--primary,#ffde00)}' +
    '.lk10-pick-t{width:100%;font-size:13px;color:#ccc;letter-spacing:1px;text-transform:uppercase}';
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
  /* un VRAI lecteur est affiché (pas la bande-annonce YouTube ni le vide) */
  function hasPlayer() { var vc = $('video-container'); return !!vc && !!vc.querySelector('iframe:not(.fx-yt), #skip-ad-btn'); }
  /* lance la vraie lecture (bouton « Lecture » du site), puis le plein écran */
  function startPlay() {
    try {
      if (!hasPlayer()) {
        var vc = $('video-container'), go = $('fx-go');
        if (go && vc && (vc.querySelector('.fx-yt') || vc.querySelector('.fx-nt'))) go.click();   // fiche en mode « bande-annonce » -> lecture
        else changeServer(currentServer);
      }
    } catch (e) {}
    wantCine = true;
    setTimeout(function () { if (hasPlayer()) enterCinema(); }, 350);
  }
  /* TÉLÉ : pas de bande-annonce dans la fiche (lourd, inutile, et rien ne se lançait) -> image + gros bouton Lecture */
  function tvNoTrailer() {
    return;   /* v9 : la fiche garde sa bande-annonce sur télé (on ne la remplace plus par l'image) */
    if (!isTV()) return;
    var vc = $('video-container'); if (!vc || !vc.querySelector('iframe.fx-yt')) return;
    var m = null; try { m = currentMovie; } catch (e) {}
    var bg = (m && (m.backdrop || m.poster)) || '';
    vc.innerHTML = '<div class="fx-nt"><div><button type="button" class="fx-lecture" id="lk10-tv-play"><i class="fas fa-play"></i> Lecture</button><div class="lk10-pick" id="lk10-pick"></div></div></div>';
    var nt = vc.querySelector('.fx-nt'); if (nt && bg) nt.style.backgroundImage = 'url("' + String(bg).replace(/"/g, '%22') + '")';
    buildPick();
    var b = $('lk10-tv-play'); if (b) { b.onclick = startPlay; try { b.focus({ preventScroll: true }); } catch (e) {} }
  }
  /* Choix de la langue et du lecteur directement sur l'image (les vrais boutons sont sous la vidéo, hors de l'écran sur télé) */
  var SRV = [['btn-server-prem', 'Premium'], ['btn-server-vidzy', 'Vidzy'], ['btn-server-uql', 'Uqload'], ['btn-server-regarder', 'Regarder']];
  function buildPick() {
    var box = $('lk10-pick'); if (!box) return;
    var h = '', sel = $('language-select');
    if (sel && sel.options.length > 1) h += '<button type="button" class="lk10-chip" id="lk10-pick-lang"><i class="fas fa-language"></i><span>' + sel.options[sel.selectedIndex].text + '</span></button>';
    SRV.forEach(function (x) {
      var r = $(x[0]); if (!r || r.offsetParent === null) return;       // seulement les lecteurs réellement disponibles
      h += '<button type="button" class="lk10-chip' + (r.classList.contains('active') ? ' lk10-cur' : '') + '" data-srv="' + x[0] + '"><i class="fas fa-play-circle"></i><span>' + x[1] + '</span></button>';
    });
    box.innerHTML = h;
    var l = $('lk10-pick-lang');
    if (l) l.onclick = function () {                                     // change la langue SANS lancer la lecture
      var s2 = $('language-select'); if (!s2) return;
      s2.selectedIndex = (s2.selectedIndex + 1) % s2.options.length;
      try { currentLanguage = s2.value || 'vf'; } catch (e) {}
      l.querySelector('span').textContent = s2.options[s2.selectedIndex].text;
    };
    box.querySelectorAll('[data-srv]').forEach(function (b) {
      b.onclick = function () { var r = $(b.dataset.srv); if (r) r.click(); };   // = clic sur le vrai bouton : lecteur choisi, lecture, plein écran
    });
  }
  function enterCinema() {
    if (active || !hasPlayer() || !shown('player-overlay')) return;   // jamais de plein écran sur la bande-annonce
    active = true; ui();
    try { document.body.style.zoom = ''; } catch (e) {}      // jamais de zoom en plein écran
    var pill = $('lk10-zoom-reset'); if (pill) pill.style.display = 'none';
    de.classList.add('lk10-cinema');
    try { history.pushState({ lk10cine: 1 }, ''); } catch (e) {}  // le bouton Retour de la télé = on quitte le cinéma
    refreshUi(); showUi();
    try { if (isOwnPlayer(playerFrame())) toPlayer({ action: 'enter_fullscreen' }); } catch (e) {}
    setTimeout(function () {
      var vc = $('video-container'); if (!vc) return;
      var f = vc.querySelector('iframe'), s = $('skip-ad-btn');
      try { if (f) { f.setAttribute('tabindex', '0'); f.focus(); } else if (s) s.focus(); } catch (e) {}
    }, 250);
  }
  var hideT = null;
  function showUi() { var u = $('lk10-cine-ui'); if (!u) return; u.classList.remove('hide'); clearTimeout(hideT); hideT = setTimeout(function () { u.classList.add('hide'); }, 4000); }
  ['mousemove', 'pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { if (active) showUi(); }, true); });
  function exitCinema(fromPop) {
    if (!active) return;
    active = false; de.classList.remove('lk10-cinema');
    try { if (isOwnPlayer(playerFrame())) toPlayer({ action: 'exit_fullscreen' }); } catch (e) {}
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

  /* ---------- Dialogue avec le lecteur (même principe que French Stream) ----------
     Le lecteur prévient « playerReady » quand il est prêt -> on lui répond « play » (sinon : sous-titres sans image).
     Au lancement on renvoie « play » toutes les 900 ms (max 7 fois) tant qu'il n'a pas dit « fss_playing ».
     En mode cinéma, les flèches / OK de la télécommande sont transmises au lecteur (avance, volume, pause),
     0 / 1 / 2 = sous-titres / langue des sous-titres / piste audio, double OK = quitter le cinéma. */
  /* Lecteurs « maison » (Premium = fsvid, Vidzy) : seuls eux comprennent les messages play / fss_key.
     Uqload, Voe, Filmoon sont des lecteurs tiers : on ne leur envoie rien et on laisse les touches passer. */
  var VZ = /(^|\.)(vidzy|fsvid)\.[a-z]{2,6}$/i;
  function isOwnPlayer(f) { try { return !!f && VZ.test(new URL(f.getAttribute('src') || f.src, location.href).hostname); } catch (e) { return false; } }
  function playerFrame() { var vc = $('video-container'); return vc ? vc.querySelector('iframe:not(.fx-yt)') : null; }
  function toPlayer(msg) { var f = playerFrame(); if (f && f.contentWindow) { try { f.contentWindow.postMessage(msg, '*'); } catch (e) {} } }
  var playing = false, kickT = null, wantCine = false;
  function kick() {
    clearInterval(kickT); playing = false; var n = 0;
    if (!isOwnPlayer(playerFrame())) return;
    kickT = setInterval(function () {
      n++; if (playing || n > 7 || !playerFrame()) { clearInterval(kickT); return; }
      toPlayer({ action: 'play' });
    }, 900);
  }
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || typeof d !== 'object') return;
    var f = playerFrame(); if (!f || e.source !== f.contentWindow) return;     // seulement notre lecteur
    var a = d.action || d.type;
    if (a === 'playerReady') { try { e.source.postMessage({ action: 'play' }, '*'); } catch (x) {} return; }
    /* le lecteur dit « ça joue » : fss_playing, ou (comme chez French Stream) play / playing / timeupdate / temps > 0 */
    var ct = typeof d.currentTime === 'number' ? d.currentTime : (typeof d.time === 'number' ? d.time : (typeof d.position === 'number' ? d.position : 0));
    var isPlaying = a === 'fss_playing' || a === 'play' || a === 'playing' || a === 'timeupdate' || a === 'currentTime' || d.event === 'play' || d.playing === true || d.paused === false || ct > 0.3;
    if (isPlaying) {
      playing = true; clearInterval(kickT);
      if (wantCine && !active && opt(K_CINE)) { wantCine = false; setTimeout(function () { if (hasPlayer()) enterCinema(); }, 800); }   // plein écran dès que ça joue
    } else if (isTV() && (a === 'fss_css_fs' || a === 'fss_fs_enter')) {
      if (hasPlayer()) enterCinema();                                          // le bouton plein écran DU lecteur = notre mode cinéma
    } else if (a === 'exit_fullscreen' || a === 'iframe_exited_fullscreen' || a === 'fss_exit_fs') {
      exitCinema();
    }
  });
  var DIRK = { 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown' }, lastOk = 0;
  window.addEventListener('keydown', function (e) {
    if (!active || e.ctrlKey || e.altKey || e.metaKey) return;
    var a = document.activeElement; if (a && a.closest && a.closest('#lk10-cine-ui')) return;
    if (!isOwnPlayer(playerFrame())) return;                                   // lecteur tiers : touches natives   // boutons ✕ / suivant : OK = cliquer
    var k = e.keyCode;
    var sub = (k === 48 || k === 96) ? 'fss_sub_toggle' : (k === 49 || k === 97) ? 'fss_sub_cycle' : (k === 50 || k === 98) ? 'fss_audio' : null;
    if (sub) { toPlayer({ action: sub }); return; }
    var key = DIRK[k] || ((k === 13 || k === 23 || k === 66) ? 'Enter' : null);
    if (!key) return;
    if (key === 'Enter') {
      var n = Date.now();
      if (lastOk && n - lastOk < 500) { lastOk = 0; e.preventDefault(); e.stopImmediatePropagation(); exitCinema(); return; }
      lastOk = n;
    }
    toPlayer({ action: 'fss_key', key: key });
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);

  /* TÉLÉ, lecteurs Premium / Vidzy : French Stream charge « embed-xxx.html?autoplay=1 » et réécrit les vieux domaines vidzy.org/.cc/.live
     en vidzy.lol. Le site retire l'autoplay des liens (sanitizePlayerIframe) : on le remet ici, sur télé et pour ces deux lecteurs seulement. */
  wrap('sanitizePlayerIframe', function (o, a) {
    var r = o.apply(this, a);
    try {
      if (isTV() && typeof r === 'string' && /<iframe/i.test(r)) {
        r = r.replace(/(src\s*=\s*)(["'])([^"']*)\2/i, function (m, p, q, url) {
          try {
            var u = new URL(url);
            if (!VZ.test(u.hostname)) return m;
            if (/^(www\.)?vidzy\.(org|cc|live)$/i.test(u.hostname)) u.hostname = 'vidzy.lol';
            u.searchParams.set('autoplay', '1');
            return p + q + u.toString() + q;
          } catch (e) { return m; }
        });
      }
    } catch (e) {}
    return r;
  });

  /* ---------- Déclenchement automatique : quand on choisit un lecteur ---------- */
  wrap('changeServer', function (o, a) {
    var r = o.apply(this, a);
    try {
      if (opt(K_CINE)) {
        wantCine = true;
        var vc = $('video-container');
        if (vc && vc.querySelector('iframe:not(.fx-yt), #skip-ad-btn')) enterCinema();
      }
    } catch (e) {}
    return r;
  });
  wrap('closeP', function (o, a) { exitCinema(); return o.apply(this, a); });

  /* « Épisode suivant » : OUI = on enchaîne directement en plein écran ; NON = on revient à la page du lecteur */
  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest || !e.target.closest('#lk10-next, #lk10-cine-next')) return;
    setTimeout(function () {
      if (opt(K_NEXT)) { enterCinema(); refreshUi(); } else exitCinema();
    }, 80);
  }, true);

  var tvOnline = false, lastCheck = 0;
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
    /* options visibles sur TOUS les appareils ; « Lancer sur la télé » seulement hors télé (et caché tant que la télé n'est pas en ligne) */
    box.innerHTML = chip('lk10-cine-go', 'fa-expand', 'Cinéma', 'lk10-primary') + chip('lk10-opt-cine', 'fa-expand-arrows-alt', '') + chip('lk10-opt-next', 'fa-forward', '') +
      (isTV() ? '' : chip('lk10-cast', 'fa-tv', 'Lancer sur la télé', 'lk10-primary'));
    var cc = box.querySelector('#lk10-cast'); if (cc) cc.style.display = tvOnline ? '' : 'none';
    bar.appendChild(box);
    var g = $('lk10-cine-go'); if (g) g.onclick = function () { hasPlayer() ? enterCinema() : startPlay(); };
    var a = $('lk10-opt-cine'); if (a) a.onclick = function () { setOpt(K_CINE, !opt(K_CINE)); refreshChips(); };
    var n = $('lk10-opt-next'); if (n) n.onclick = function () { setOpt(K_NEXT, !opt(K_NEXT)); refreshChips(); };
    var c = $('lk10-cast'); if (c) c.onclick = castNow;
    refreshChips();
  }
  wrap('openP', function (o, a) { var r = o.apply(this, a); try { tvNoTrailer(); setTimeout(function () { ensureChips(); checkTv(); if (isTV()) { var g = $('fx-go'); try { if (g && shown('player-overlay')) g.focus({ preventScroll: true }); } catch (e) {} } }, 80); } catch (e) {} return r; });
  wrap('updatePlayerInterface', function (o, a) { var r = o.apply(this, a); try { ensureChips(); refreshUi(); if (isTV()) kick(); } catch (e) {} return r; });

  /* ---------- Téléphone / PC : la télé est-elle en ligne ? bouton « Lancer sur la télé » ---------- */
  
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
    api('/api/tv/cast', { method: 'POST', body: JSON.stringify({ id: m.id, ep: m.type === 'serie' ? ep : 0, lang: lang, server: (function () { try { return currentServer; } catch (e) { return ''; } })() }) }).then(function (d) {
      if (d && d.success) toast('Envoyé sur la télé : ' + m.title);
      else { toast((d && d.message) || 'Impossible de joindre la télé.'); checkTv(); }
    }).catch(function () { toast('Erreur de connexion.'); });
  }

  /* ---------- Télé : on reçoit les commandes du téléphone ---------- */
  /* v4 : UNE SEULE charge du lecteur, directement avec la bonne langue et le bon lecteur.
     Avant, openP() lançait Premium, puis 400 ms plus tard on rechargeait, puis une 3e fois (sécurité) :
     le lecteur redémarrait en boucle (sous-titres sans image, vidéo décalée, mauvais lecteur). */
  var castGuard = false, castSeq = 0;
  (function () {
    var oSet = window.setVideoContent;
    if (typeof oSet === 'function') window.setVideoContent = function () { if (castGuard) return; return oSet.apply(this, arguments); };
  })();
  function onCast(cmd) {
    var list = []; try { list = moviesDB || []; } catch (e) {}
    var m = list.find(function (x) { return x.id === cmd.id; });
    if (!m) return toast('Titre introuvable sur la télé.');
    var seq = ++castSeq;
    try { if (typeof closeProfilePage === 'function') closeProfilePage(); } catch (e) {}
    exitCinema();
    /* 1) on prépare la fiche SANS charger de lecteur (openP voudrait lancer Premium) */
    castGuard = true;
    try { openP(m.id, m.type === 'serie' ? (cmd.ep | 0) : 0); } catch (e) {} finally { castGuard = false; }
    /* 2) langue + lecteur choisis sur le téléphone, puis UNE seule lecture */
    try {
      var sel = $('language-select');
      if (sel && cmd.lang && Array.prototype.some.call(sel.options, function (o) { return o.value === cmd.lang; })) sel.value = cmd.lang;
      if (sel) currentLanguage = sel.value || 'vf';
      currentServer = cmd.server || 'premium';
      changeServer(currentServer);
    } catch (e) { console.warn('lk10 cast', e); }
    var used = ''; try { used = currentServer; } catch (e) {}
    toast('Lancement (v4) : ' + m.title + ' [' + (cmd.server || 'aucun lecteur reçu') + ' → ' + used + ']');
    /* 3) plein écran (la lecture elle-même ne se recharge plus) */
    setTimeout(function () { if (seq === castSeq && !active) enterCinema(); }, 300);
  }
  var polling = false;
  setInterval(function () {
    if (!isTV() || !tok() || document.hidden || polling) return;
    try { if (typeof hasAccess !== 'undefined' && !hasAccess) return; } catch (e) {}
    polling = true;
    api('/api/tv/inbox').then(function (d) { if (d && d.success && d.cmd) onCast(d.cmd); }).catch(function () {}).then(function () { polling = false; });
  }, 4000);
})();
