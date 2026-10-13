/* Ciné LK10 — lk10-cinema.js (v15)
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
    'html.lk10-tv #video-container{border-radius:0!important;overflow:visible!important;box-shadow:none!important;filter:none!important;transform:none!important;will-change:auto!important}' +
    'html.lk10-tv .player-content{border-radius:0!important;animation:none!important;transform:none!important;filter:none!important;will-change:auto!important}' +
    'html.lk10-tv:not(.lk10-cinema) #video-container{width:min(100%,86vh)!important;margin-left:auto!important;margin-right:auto!important}' +
    /* la vidéo prend tout l'écran ; on neutralise les transformations des parents (sinon « fixed » reste coincé dans le cadre) */
    'html.lk10-cinema .player-content,html.lk10-cinema #player-overlay{transform:none!important;animation:none!important;filter:none!important;perspective:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;will-change:auto!important;contain:none!important}' +
    'html.lk10-cinema #video-container{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:auto!important;height:auto!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border-radius:0!important;aspect-ratio:auto!important;overflow:hidden!important;z-index:2147483000!important;background:#000!important}' +
    'html.lk10-cinema #player-overlay{overflow:hidden!important}' +
    'html.lk10-cinema #video-container{display:block!important}' +
    'html.lk10-cinema #video-container iframe,html.lk10-cinema #video-container video{position:absolute!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;border:0!important;display:block!important;transform:none!important}' +
    /* v13 : plus de contour (bleu / jaune) autour de la vidéo en cinéma */
    'html.lk10-cinema #video-container,html.lk10-cinema #video-container:focus,html.lk10-cinema #video-container:focus-visible,html.lk10-cinema #video-container iframe,html.lk10-cinema #video-container iframe:focus,html.lk10-cinema #video-container iframe:focus-visible,html.lk10-cinema #player-overlay:focus,html.lk10-cinema .player-content:focus{outline:none!important;box-shadow:none!important;-webkit-tap-highlight-color:transparent!important}' +
    /* télé : l'iframe déborde de 4 px de chaque côté (le cadre est en overflow:hidden) -> un éventuel liseré de focus interne au lecteur est rogné */
    'html.lk10-tv.lk10-cinema #video-container iframe{top:-4px!important;left:-4px!important;right:auto!important;bottom:auto!important;width:calc(100% + 8px)!important;height:calc(100% + 8px)!important}' +
    'html.lk10-tv #video-container iframe,html.lk10-tv #video-container iframe:focus,html.lk10-tv #video-container iframe:focus-visible{outline:none!important;box-shadow:none!important}' +
    '#lk10-cine-recal{display:none}html.lk10-tv #lk10-cine-ui button#lk10-cine-recal{display:block}' +
    '#lk10-sink{position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;outline:none!important}' +
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
                    '<button type="button" id="lk10-cine-recal" title="Recalibrer la vidéo (touche 5)"><i class="fas fa-crosshairs"></i></button>' +
                    '<button type="button" id="lk10-cine-x" title="Quitter le mode cinéma"><i class="fas fa-times"></i></button>';
      de.appendChild(u);                                    // sur <html> : le zoom éventuel du body ne l'affecte pas
      $('lk10-cine-x').onclick = function () { exitCinema(); };
      $('lk10-cine-recal').onclick = function () { recalibrate(); };
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
    intent();
    try {
      if (!hasPlayer()) {
        var vc = $('video-container'), go = $('fx-go');
        if (go && vc && (vc.querySelector('.fx-yt') || vc.querySelector('.fx-nt'))) go.click();   // fiche en mode « bande-annonce » -> lecture
        else changeServer(currentServer);
      }
    } catch (e) {}
    wantCine = true; keepVideoInView();
    setTimeout(function () { if (hasPlayer()) enterCinema(); }, 350);
  }
  /* Télé : le focus de la télécommande fait défiler la fiche vers « Lecture » / les lecteurs -> la vidéo se retrouve coupée en haut.
     On remet la fiche en haut au lancement (et un instant après, pour passer APRÈS le défilement automatique du focus). */
  function topScroll() { var o = $('player-overlay'); if (o) o.scrollTop = 0; try { window.scrollTo(0, 0); } catch (e) {} }
  function keepVideoInView() {
    if (!isTV()) return;
    [0, 250, 700, 1500].forEach(function (t) { setTimeout(function () { if (!active && shown('player-overlay')) topScroll(); }, t); });
  }
  /* « Secoue » l'iframe (1 px de hauteur en moins puis retour) : force le lecteur à recalculer la taille / position de l'image
     après un changement de taille (cause du décalage de la vidéo en haut à gauche) */
  function nudge() {
    [60, 400, 1200].forEach(function (t) {
      setTimeout(function () {
        var f = playerFrame(); if (!f) return;
        f.style.setProperty('height', 'calc(100% - 2px)', 'important'); f.style.setProperty('width', 'calc(100% - 2px)', 'important');
        setTimeout(function () { try { f.style.removeProperty('height'); f.style.removeProperty('width'); } catch (e) {} }, 80);
      }, t);
    });
  }
  function enterCinema(force) {
    if (active || !shown('player-overlay') || (force !== true && !hasPlayer())) return;   // jamais de plein écran sur la bande-annonce (sauf si on s'apprête à charger le lecteur)
    active = true; ui(); topScroll();
    try { document.body.style.zoom = ''; } catch (e) {}      // jamais de zoom en plein écran
    var pill = $('lk10-zoom-reset'); if (pill) pill.style.display = 'none';
    de.classList.add('lk10-cinema');
    try { history.pushState({ lk10cine: 1 }, ''); } catch (e) {}  // le bouton Retour de la télé = on quitte le cinéma
    refreshUi(); showUi();
    if (hasPlayer()) nudge();
    if (isTV()) { setTimeout(bounce, 500); setTimeout(bounce, 1800); }
    setTimeout(function () {
      var vc = $('video-container'); if (!vc) return;
      var f = playerFrame(), s = $('skip-ad-btn');
      try {
        if (f) sinkFocus();            // v15 : TOUS les lecteurs (Premium = Abyss, Vidzy, Uqload...) -> la PAGE garde le focus (sinon les touches partent dans l'iframe : on ne peut plus sortir ni défiler)
        else if (s) s.focus();
      } catch (e) {}
    }, 250);
  }
  /* v13 : focus « invisible » sur la page */
  function sinkFocus() {
    var s = $('lk10-sink');
    if (!s) { s = document.createElement('div'); s.id = 'lk10-sink'; s.tabIndex = -1; de.appendChild(s); }
    try { s.focus({ preventScroll: true }); } catch (e) {}
  }
  /* v13 : « rebond » du cinéma = ce que tu faisais à la main (fermer / rouvrir le plein écran) pour que l'image se replace */
  var bounceT = null;
  function bounce() {
    if (!active || !isTV()) return;
    clearTimeout(bounceT);
    de.classList.remove('lk10-cinema'); void de.offsetWidth;
    bounceT = setTimeout(function () { if (active) { de.classList.add('lk10-cinema'); nudge(); } }, 140);
  }
  /* v14 : RECALIBRAGE manuel (bouton ⌖ en plein écran, puce « Recalibrer » sous la vidéo, touche 5 ou bouton vert) :
     rebond du plein écran + secousse de l'iframe + événement resize, deux fois de suite, pour que l'image se remette en place */
  var recalT = null;
  function recalibrate() {
    if (!isTV() || !shown('player-overlay') || !playerFrame()) return;
    clearTimeout(recalT); toast('Recalibrage de la vidéo…');
    var pass = function () {
      try { window.dispatchEvent(new Event('resize')); } catch (e) {}
      if (active) bounce(); else nudge();
      nudge();
    };
    pass(); recalT = setTimeout(pass, 700);
  }
  /* v13 (télé) : à chaque nouveau lecteur, on le « secoue » même hors plein écran (écran noir sans plein écran auto) */
  function refit() { if (!isTV()) return; nudge(); if (active) bounce(); }
  (function () {
    var vc = $('video-container'), seen = null; if (!vc) return;
    new MutationObserver(function () {
      if (!isTV()) return;
      var f = playerFrame(); if (!f) { seen = null; return; }
      if (f === seen) return; seen = f;
      f.addEventListener('load', function () { refit(); });
      setTimeout(refit, 900); setTimeout(refit, 2200);
    }).observe(vc, { childList: true });
  })();
  /* v15 : garde-focus — la PAGE garde le focus, pour tous les lecteurs. Sinon l'iframe (Abyss...) avale les flèches
     (elles ne font qu'avancer / reculer la vidéo) et la fiche ne défile plus. OK / flèches en plein écran = « prise en main »
     du lecteur pendant 10 s (flèches = avance, OK = pause), puis le focus revient à la page (0 / 5 / Retour fonctionnent). */
  var ctrlUntil = 0;
  function guard() {
    if (!isTV() || !shown('player-overlay')) return;
    var a = document.activeElement; if (!a || a.tagName !== 'IFRAME') return;
    var mine = isOwnPlayer(a) || (a.classList && a.classList.contains('fx-yt'));
    if (!mine && Date.now() < ctrlUntil) return;
    sinkFocus();
  }
  setInterval(guard, 400);
  window.addEventListener('blur', function () { setTimeout(guard, 0); setTimeout(guard, 150); });
  function handToPlayer(f) {
    ctrlUntil = Date.now() + 10000;
    try { f.setAttribute('tabindex', '0'); f.focus(); } catch (e) {}
    toast('Commandes du lecteur actives 10 s (ensuite : 0 = quitter, 5 = recalibrer)');
  }
  var hideT = null;
  function showUi() { var u = $('lk10-cine-ui'); if (!u) return; u.classList.remove('hide'); clearTimeout(hideT); hideT = setTimeout(function () { u.classList.add('hide'); }, 4000); }
  ['mousemove', 'pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { if (active) showUi(); }, true); });
  function exitCinema(fromPop) {
    if (!active && !de.classList.contains('lk10-cinema')) return;
    clearTimeout(bounceT); ctrlUntil = 0;
    active = false; de.classList.remove('lk10-cinema');
    if (!fromPop) { try { if (history.state && history.state.lk10cine) { popping = true; history.back(); } } catch (e) {} }
    var vc = $('video-container'); try { ($('fx-go') || document.querySelector('#lk10-opts button') || vc).focus({ preventScroll: true }); } catch (e) {}
    keepVideoInView(); nudge();
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
  /* v13 : touches de SORTIE DE SECOURS (télé) : 0, Menu, bouton rouge */
  var EXIT_K = { 48: 1, 96: 1, 82: 1, 93: 1, 403: 1 };
  function isExitKey(e) { return !!EXIT_K[e.keyCode] || e.key === 'ContextMenu' || e.key === 'Menu' || e.key === 'ColorF0Red' || e.key === 'Red'; }
  function isRecalKey(e) { return e.keyCode === 53 || e.keyCode === 101 || e.keyCode === 404 || e.key === 'ColorF1Green' || e.key === 'Green'; }
  function isOk(k) { return k === 13 || k === 23 || k === 66; }
  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var k = e.keyCode, f;
    if (active) {
      if (isTV() && isExitKey(e)) { e.preventDefault(); e.stopImmediatePropagation(); exitCinema(); return; }
      if (isTV() && isRecalKey(e)) { e.preventDefault(); e.stopImmediatePropagation(); recalibrate(); return; }
      var a = document.activeElement; if (a && a.closest && a.closest('#lk10-cine-ui')) return;   // boutons ✕ / suivant : OK = cliquer
      f = playerFrame();
      if (!isOwnPlayer(f)) {
        /* lecteur tiers (Uqload / Voe / Filmoon) : touches natives. Si une touche arrive à la page, c'est que le focus s'est échappé : on le rend à l'iframe */
        if (f && (DIRK[k] || isOk(k))) { e.preventDefault(); e.stopImmediatePropagation(); handToPlayer(f); }
        return;
      }
      /* lecteur maison : 3 = sous-titres on/off, 1 = langue des sous-titres, 2 = piste audio */
      var sub = (k === 51 || k === 99) ? 'fss_sub_toggle' : (k === 49 || k === 97) ? 'fss_sub_cycle' : (k === 50 || k === 98) ? 'fss_audio' : null;
      if (sub) { e.preventDefault(); e.stopImmediatePropagation(); toPlayer({ action: sub }); return; }
      var key = DIRK[k] || (isOk(k) ? 'Enter' : null);
      if (!key) return;
      if (key === 'Enter') {
        var n = Date.now();
        if (lastOk && n - lastOk < 500) { lastOk = 0; e.preventDefault(); e.stopImmediatePropagation(); exitCinema(); return; }
        lastOk = n;
      }
      toPlayer({ action: 'fss_key', key: key });
      e.preventDefault(); e.stopImmediatePropagation();
      return;
    }
    /* ----- fiche ouverte, hors plein écran (télé uniquement) ----- */
    if (!isTV() || !shown('player-overlay')) return;
    var ae = document.activeElement, tag = ae && ae.tagName;
    if (isRecalKey(e) && tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); e.stopImmediatePropagation(); recalibrate(); return; }
    if (isOk(k) && ae && ae.id === 'video-container') {
      /* v13 : OK sur le cadre vidéo = lancer / plein écran (avant, ça donnait le focus à l'iframe : les touches étaient perdues, fiche bloquée en haut) */
      e.preventDefault(); e.stopImmediatePropagation(); hasPlayer() ? enterCinema() : startPlay(); return;
    }
    if ((k === 38 || k === 40) && tag !== 'SELECT' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
      /* v13 : si ↓ / ↑ ne déplace plus le curseur (fin de ligne, rien en dessous), on fait défiler la fiche */
      var ov = $('player-overlay'), r0 = ae && ae.getBoundingClientRect ? ae.getBoundingClientRect().top : null, s0 = ov ? ov.scrollTop : 0, dir = k === 40 ? 1 : -1;
      setTimeout(function () {
        if (!ov) return;
        var a2 = document.activeElement, r1 = a2 && a2.getBoundingClientRect ? a2.getBoundingClientRect().top : null;
        if (a2 === ae && r1 === r0 && ov.scrollTop === s0) ov.scrollTop = s0 + dir * Math.round(window.innerHeight * 0.6);
      }, 40);
    }
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
    intent();
    var r = o.apply(this, a);
    try {
      if (isTV()) keepVideoInView();
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
    refreshEps();
    if (n) { var o2 = opt(K_NEXT); n.classList.toggle('lk10-on', o2); n.classList.toggle('lk10-off', !o2); n.querySelector('span').textContent = 'Épisode suivant auto : ' + (o2 ? 'OUI' : 'NON'); }
  }
  function ensureChips() {
    var bar = $('lk10-bar'); if (!bar || $('lk10-opts')) return;
    var box = document.createElement('div'); box.id = 'lk10-opts';
    /* options visibles sur TOUS les appareils ; « Lancer sur la télé » seulement hors télé (et caché tant que la télé n'est pas en ligne) */
    box.innerHTML = (isTV() ? chip('lk10-eps', 'fa-list-ul', 'Épisodes', 'lk10-primary') : '') + chip('lk10-cine-go', 'fa-expand', 'Cinéma', 'lk10-primary') + (isTV() ? chip('lk10-recal', 'fa-crosshairs', 'Recalibrer', '') : '') + chip('lk10-opt-cine', 'fa-expand-arrows-alt', '') + chip('lk10-opt-next', 'fa-forward', '') +
      (isTV() ? '' : chip('lk10-cast', 'fa-tv', 'Lancer sur la télé', 'lk10-primary'));
    var cc = box.querySelector('#lk10-cast'); if (cc) cc.style.display = tvOnline ? '' : 'none';
    bar.appendChild(box);
    var g = $('lk10-cine-go'); if (g) g.onclick = function () { hasPlayer() ? enterCinema() : startPlay(); };
    var a = $('lk10-opt-cine'); if (a) a.onclick = function () { setOpt(K_CINE, !opt(K_CINE)); refreshChips(); };
    var n = $('lk10-opt-next'); if (n) n.onclick = function () { setOpt(K_NEXT, !opt(K_NEXT)); refreshChips(); };
    var c = $('lk10-cast'); if (c) c.onclick = castNow;
    var ep = $('lk10-eps'); if (ep) ep.onclick = openEpisodes;
    var rc = $('lk10-recal'); if (rc) rc.onclick = recalibrate;
    refreshChips();
  }
  /* v13 (télé) : puce « Épisodes » = ouvre la liste et met le curseur sur l'épisode en cours (plus besoin de descendre jusqu'au bouton) */
  function isSerie() { try { return !!currentMovie && currentMovie.type === 'serie'; } catch (e) { return false; } }
  function refreshEps() { var b = $('lk10-eps'); if (b) b.style.display = isTV() && isSerie() ? '' : 'none'; }
  function openEpisodes() {
    try { var l = $('ep-list-container'); if (l && l.style.display === 'none') toggleEpisodes(); } catch (e) {}
    setTimeout(function () {
      var it = document.querySelector('#ep-items-wrapper .ep-item.active') || document.querySelector('#ep-items-wrapper .ep-item'); if (!it) return;
      try { it.setAttribute('tabindex', '0'); it.focus({ preventScroll: true }); it.scrollIntoView({ block: 'center' }); } catch (e) {}
    }, 80);
  }
  wrap('openP', function (o, a) { if (typeof a[1] === 'number' || a[1] === 'play') intent(); var r = o.apply(this, a); try { setTimeout(function () { ensureChips(); checkTv(); if (isTV()) { var g = $('fx-go'); try { if (g && shown('player-overlay')) g.focus({ preventScroll: true }); } catch (e) {} } }, 80); } catch (e) {} return r; });
  wrap('updatePlayerInterface', function (o, a) { var r = o.apply(this, a); try { ensureChips(); refreshEps(); refreshUi(); if (isTV()) kick(); } catch (e) {} return r; });

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
  /* Le plein écran « avant chargement » ne doit se faire que si on lance VRAIMENT une lecture (pas à l'ouverture de la fiche,
     où le site prépare aussi un lecteur qu'il n'affiche pas). */
  var playIntent = 0;
  function intent() { playIntent = Date.now(); }
  document.addEventListener('click', function (e) {
    try { if (isTV() && e.target && e.target.closest && e.target.closest('#fx-go,.fx-lecture,.ep-item,#lk10-next,#lk10-prev,#lk10-cine-next,#lk10-cine-go,.server-btn,#language-select')) intent(); } catch (x) {}
  }, true);
  (function () {
    var oSet = window.setVideoContent;
    if (typeof oSet === 'function') window.setVideoContent = function (c) {
      if (castGuard) return;
      try {
        /* v12 : sur télé, on passe en plein écran AVANT de charger le lecteur, pour qu'il se mette à la bonne taille dès le départ */
        if (isTV() && !active && Date.now() - playIntent < 2000 && opt(K_CINE) && typeof c === 'string' && /<iframe/i.test(c) && shown('player-overlay')) { wantCine = true; enterCinema(true); }
      } catch (e) {}
      return oSet.apply(this, arguments);
    };
  })();
  function onCast(cmd) {
    var list = []; try { list = moviesDB || []; } catch (e) {}
    var m = list.find(function (x) { return x.id === cmd.id; });
    if (!m) return toast('Titre introuvable sur la télé.');
    var seq = ++castSeq; intent();
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
    keepVideoInView();
    var used = ''; try { used = currentServer; } catch (e) {}
    toast('Lancement (v13) : ' + m.title + ' [' + (cmd.server || 'aucun lecteur reçu') + ' → ' + used + ']');
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
