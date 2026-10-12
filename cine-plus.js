/* Ciné LK10 — cine-plus.js
   Retours utilisateurs : reprise (chrono + sync), épisodes vus, épisode suivant, langue mémorisée,
   titres similaires, mail « ta demande est ajoutée », mode télé (télécommande + connexion par code), appli installable.
   À charger EN DERNIER dans index.html (après cine-fx.js et les autres scripts). */
(function () {
  'use strict';

  /* =====================================================================================
     1. FONCTIONS PURES (aussi exportées pour les tests Node)
     ===================================================================================== */
  function fmtTime(s) {
    s = Math.max(0, Math.floor(s || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') + m : m) + ':' + (x < 10 ? '0' : '') + x;
  }
  // "42" => 42 min · "42:10" => 42 min 10 s · "1:12:30" · "1h12"
  function parseTime(str) {
    str = String(str == null ? '' : str).trim().toLowerCase().replace(/\s+/g, '');
    if (!str) return null;
    var out = null, m;
    if (str.indexOf(':') > -1) {
      var p = str.split(':').map(Number);
      if (p.length > 3 || p.some(function (n) { return isNaN(n) || n < 0; })) return null;
      out = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
    } else if (/^\d+$/.test(str)) out = +str * 60;
    else if ((m = str.match(/^(\d+)h(\d{1,2})?$/))) out = (+m[1]) * 3600 + (+(m[2] || 0)) * 60;
    return out == null ? null : Math.min(86400, out);
  }
  function genresOf(m) { return String(m.genre || '').split(',').map(function (g) { return g.trim().toLowerCase(); }).filter(Boolean); }
  function simScore(a, b) {
    var ga = genresOf(a), gb = genresOf(b), shared = 0;
    ga.forEach(function (g) { if (gb.indexOf(g) > -1) shared++; });
    if (!shared) return 0;
    var s = shared * 4; if (a.type === b.type) s += 2;
    var ya = parseInt(a.year, 10), yb = parseInt(b.year, 10); if (ya && yb && Math.abs(ya - yb) <= 3) s += 1;
    var r = parseFloat(b.rating) || 0; if (r >= 7) s += 1;
    return s + r / 100;
  }
  // Navigation à la télécommande : cur = rect courant, cands = [{r: rect}], dir = left|right|up|down → index du meilleur voisin (ou -1)
  function pick(cur, cands, dir) {
    var cx = cur.left + cur.width / 2, cy = cur.top + cur.height / 2, best = -1, bs = Infinity;
    for (var i = 0; i < cands.length; i++) {
      var r = cands[i].r, x = r.left + r.width / 2, y = r.top + r.height / 2, dx = x - cx, dy = y - cy, ok, prim, off, cross;
      if (dir === 'right') { ok = dx > 2 && r.right > cur.right + 2; prim = Math.max(0, r.left - cur.right); off = Math.abs(dy); cross = Math.max(0, Math.max(cur.top, r.top) - Math.min(cur.bottom, r.bottom)); }
      else if (dir === 'left') { ok = dx < -2 && r.left < cur.left - 2; prim = Math.max(0, cur.left - r.right); off = Math.abs(dy); cross = Math.max(0, Math.max(cur.top, r.top) - Math.min(cur.bottom, r.bottom)); }
      else if (dir === 'down') { ok = dy > 2 && r.bottom > cur.bottom + 2; prim = Math.max(0, r.top - cur.bottom); off = Math.abs(dx); cross = Math.max(0, Math.max(cur.left, r.left) - Math.min(cur.right, r.right)); }
      else { ok = dy < -2 && r.top < cur.top - 2; prim = Math.max(0, cur.top - r.bottom); off = Math.abs(dx); cross = Math.max(0, Math.max(cur.left, r.left) - Math.min(cur.right, r.right)); }
      if (!ok) continue;
      var score = prim + off * 2 + cross * 4;
      if (score < bs) { bs = score; best = i; }
    }
    return best;
  }
  var PURE = { fmtTime: fmtTime, parseTime: parseTime, simScore: simScore, pick: pick };
  if (typeof document === 'undefined') { if (typeof module !== 'undefined') module.exports = PURE; return; }

  /* =====================================================================================
     2. OUTILS
     ===================================================================================== */
  var $ = function (i) { return document.getElementById(i); };
  var cu = function () { try { return currentUser; } catch (e) { return null; } };
  var DB = function () { try { return moviesDB || []; } catch (e) { return []; } };
  var gm = function () { try { return currentMovie; } catch (e) { return null; } };
  var ge = function () { try { return currentEpisodeIndex | 0; } catch (e) { return 0; } };
  var gl = function () { try { return currentLanguage; } catch (e) { return 'vf'; } };
  var tok = function () { try { return localStorage.getItem('monBadgeCineLK10') || ''; } catch (e) { return ''; } };
  var LS = (function () { try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); return localStorage; } catch (e) { return { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} }; } })();
  function toast(msg) { try { showToast(msg, 'fa-info-circle', '#ffde00'); } catch (e) { try { alert(msg); } catch (x) {} } }
  function api(path, opts) {
    opts = opts || {}; opts.headers = { 'Content-Type': 'application/json', authorization: tok() };
    return fetch(API_URL + path, opts).then(function (r) { return r.json().catch(function () { return { success: false }; }); });
  }
  function wrap(name, fn) {
    var o = window[name]; if (typeof o !== 'function') return;
    window[name] = function () { return fn.call(this, o, arguments); };
  }
  function whenUser(cb) { var n = 0, iv = setInterval(function () { if (cu()) { clearInterval(iv); cb(); } else if (++n > 240) clearInterval(iv); }, 500); }

  /* =====================================================================================
     3. PROGRESSION : épisode, langue, minute estimée, épisodes vus — local + synchronisée au compte
        (le lecteur est une iframe externe : on ne peut PAS lire sa vraie minute. On estime donc avec un
         chrono qui tourne tant que la vidéo est affichée ; la minute reste réglable à la main.)
     ===================================================================================== */
  var SEEN_AFTER = 600; // un épisode est marqué « vu » après 10 min de lecture (ou en passant au suivant)
  var P = {}, dirty = {}, userKey = 'guest', flushT = null;
  function pkey() { return 'lk10_prog_' + userKey; }
  function loadP() { try { P = JSON.parse(LS.getItem(pkey()) || '{}') || {}; } catch (e) { P = {}; } }
  function saveP() { try { LS.setItem(pkey(), JSON.stringify(P)); } catch (e) {} }
  function scheduleFlush() { clearTimeout(flushT); flushT = setTimeout(function () { flush(); }, 8000); }
  function touch(id, patch) {
    var o = P[id] || (P[id] = { ep: 0, lang: 'vf', t: 0, seen: [], at: 0 });
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) o[k] = patch[k];
    o.at = Date.now(); dirty[id] = 1; saveP(); scheduleFlush(); return o;
  }
  function flush(keep) {
    if (!cu() || !tok()) return;
    var ids = Object.keys(dirty); if (!ids.length) return;
    var items = {}; ids.forEach(function (id) { var o = P[id]; if (o) { items[id] = { ep: o.ep, lang: o.lang, t: o.t, seen: o.seen || [], unseen: o.rm || [], at: o.at }; } });
    dirty = {};
    fetch(API_URL + '/api/user/progress', { method: 'POST', keepalive: !!keep, headers: { 'Content-Type': 'application/json', authorization: tok() }, body: JSON.stringify({ items: items }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.success) ids.forEach(function (id) { if (P[id]) delete P[id].rm; }); else ids.forEach(function (id) { dirty[id] = 1; }); })
      .catch(function () { ids.forEach(function (id) { dirty[id] = 1; }); });
  }
  function union(a, b) { var s = {}, o = []; (a || []).concat(b || []).forEach(function (x) { if (!s[x]) { s[x] = 1; o.push(x); } }); return o.sort(function (p, q) { return p - q; }); }
  function mergeServer(sp) {
    Object.keys(sp || {}).forEach(function (id) {
      var s = sp[id], l = P[id]; if (!s || typeof s !== 'object') return;
      if (!l) { P[id] = s; return; }
      var seen = union(l.seen, s.seen);
      if ((s.at || 0) > (l.at || 0)) P[id] = Object.assign({}, s, { seen: seen });
      else { l.seen = seen; dirty[id] = 1; }
    });
    saveP(); if (Object.keys(dirty).length) scheduleFlush();
  }
  function isSeen(id, i) { var s = (P[id] || {}).seen; return !!s && s.indexOf(i) > -1; }
  function setSeen(id, i, on) {
    var o = P[id] || (P[id] = { ep: (cur && cur.id === id) ? cur.ep : 0, lang: gl(), t: 0, seen: [], at: 0 });
    var s = o.seen || (o.seen = []), k = s.indexOf(i);
    if (on && k < 0) s.push(i);
    if (!on && k > -1) { s.splice(k, 1); (o.rm = o.rm || []).push(i); }
    if (on && o.rm) o.rm = o.rm.filter(function (x) { return x !== i; });
    o.at = Date.now(); dirty[id] = 1; saveP(); scheduleFlush();
  }

  // --- API utilisée par index.html (openP, rangée « Continuer à regarder ») ---
  var LK10 = window.LK10 = {
    resumeEp: function (m) { var o = P[m.id]; return (m.type === 'serie' && o && typeof o.ep === 'number' && m.episodes && o.ep >= 0 && o.ep < m.episodes.length) ? o.ep : 0; },
    preferredLang: function (m) { var o = P[m.id]; return (o && o.lang) || LS.getItem('lk10_lang') || null; },
    timeLabel: function (id, ep) { var o = P[id]; if (!o || !o.t || o.t < 60) return ''; if (typeof ep === 'number' && o.ep !== ep) return ''; return 'à ' + fmtTime(o.t); }
  };

  // --- Chrono de lecture ---
  var cur = null, secs = 0, paused = false, resumeHint = 0, hintOff = false, seenMarked = false;
  var overlayOpen = function () { var o = $('player-overlay'); return !!o && o.style.display === 'block'; };
  function curKey() { var m = gm(); return m ? m.id + '#' + (m.type === 'serie' ? ge() : 0) : ''; }
  function sync() {
    var k = overlayOpen() ? curKey() : '';
    if ((cur && cur.key) === k) return;
    commit();
    if (!k) { cur = null; secs = 0; return; }
    var m = gm(), ep = m.type === 'serie' ? ge() : 0, sv = P[m.id];
    cur = { key: k, id: m.id, ep: ep, serie: m.type === 'serie' };
    secs = (sv && sv.ep === ep) ? (sv.t || 0) : 0;
    resumeHint = secs >= 60 ? secs : 0; hintOff = false; paused = false; seenMarked = isSeen(m.id, ep);
    refreshBar();
  }
  function commit() { if (cur && secs >= 5) touch(cur.id, { ep: cur.ep, t: Math.floor(secs), lang: gl() }); }

  setInterval(function () {
    try {
      sync(); if (!cur) return;
      var box = $('video-container');
      if (box && box.querySelector('iframe') && !paused && document.visibilityState === 'visible') {
        secs++;
        if (cur.serie && !seenMarked && secs >= SEEN_AFTER) { seenMarked = true; setSeen(cur.id, cur.ep, true); decorateEpisodes(); }
        if (secs % 15 === 0) commit();
      }
      renderTimer();
    } catch (e) {}
  }, 1000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') { try { commit(); flush(true); } catch (e) {} } });
  window.addEventListener('pagehide', function () { try { commit(); flush(true); } catch (e) {} });

  // --- Barre sous la vidéo : chrono, réglage, épisode précédent / suivant ---
  function ensureBar() {
    if ($('lk10-bar')) return;
    var vc = $('video-container'); if (!vc || !vc.parentNode) return;
    var bar = document.createElement('div'); bar.id = 'lk10-bar';
    bar.innerHTML =
      '<div class="lk10-left">' +
        '<button type="button" id="lk10-chip" class="lk10-chip" title="Chrono estimé de ta lecture. Touche-le pour le mettre en pause quand tu mets la vidéo en pause."><i class="fas fa-stopwatch"></i><span id="lk10-tv">0:00</span><em id="lk10-ts">estimé</em></button>' +
        '<button type="button" id="lk10-edit" class="lk10-chip lk10-ico" title="Régler la minute où tu en es"><i class="fas fa-pen"></i></button>' +
        '<span id="lk10-hint" class="lk10-hint" style="display:none"></span>' +
      '</div>' +
      '<div class="lk10-right" id="lk10-epnav" style="display:none">' +
        '<button type="button" id="lk10-prev" class="lk10-chip"><i class="fas fa-step-backward"></i><span>Précédent</span></button>' +
        '<button type="button" id="lk10-next" class="lk10-chip lk10-primary"><span>Épisode suivant</span><i class="fas fa-step-forward"></i></button>' +
      '</div>';
    vc.parentNode.insertBefore(bar, vc.nextSibling);
    $('lk10-chip').onclick = function () { paused = !paused; renderTimer(); };
    $('lk10-edit').onclick = function () {
      var v = prompt('À quelle minute en es-tu ?\nExemples : 42:10 · 1:12:30 · 42', fmtTime(secs));
      if (v === null) return; var t = parseTime(v);
      if (t === null) return toast('Format non reconnu. Exemple : 42:10');
      secs = t; hintOff = true; if (cur) touch(cur.id, { ep: cur.ep, t: secs, lang: gl() }); refreshBar(); toast('Minute enregistrée : ' + fmtTime(secs));
    };
    $('lk10-prev').onclick = function () { goEp(ge() - 1); };
    $('lk10-next').onclick = function () { goEp(ge() + 1); };
  }
  function renderTimer() {
    var tv = $('lk10-tv'), chip = $('lk10-chip'); if (!tv || !chip) return;
    tv.textContent = fmtTime(secs); chip.classList.toggle('lk10-paused', paused);
    $('lk10-ts').textContent = paused ? 'pause' : 'estimé';
  }
  function refreshBar() {
    ensureBar(); var m = gm(); if (!m || !$('lk10-bar')) return;
    var nav = $('lk10-epnav'), ser = m.type === 'serie' && m.episodes && m.episodes.length > 1;
    nav.style.display = ser ? 'flex' : 'none';
    if (ser) { $('lk10-prev').disabled = ge() <= 0; $('lk10-next').disabled = ge() >= m.episodes.length - 1; }
    var h = $('lk10-hint');
    if (resumeHint && !hintOff) {
      h.style.display = 'inline-flex';
      h.innerHTML = '<span>Tu en étais à <b>' + fmtTime(resumeHint) + '</b> — avance jusque-là dans le lecteur</span><button type="button" id="lk10-restart">Depuis le début</button>';
      $('lk10-restart').onclick = function () { secs = 0; resumeHint = 0; hintOff = true; if (cur) touch(cur.id, { ep: cur.ep, t: 0 }); refreshBar(); };
    } else h.style.display = 'none';
    renderTimer();
  }
  function goEp(i) {
    var m = gm(); if (!m || m.type !== 'serie' || !m.episodes || i < 0 || i >= m.episodes.length) return;
    if (i > ge()) setSeen(m.id, ge(), true); // passer au suivant = l'épisode est terminé
    try { currentEpisodeIndex = i; updatePlayerInterface(); if (cu()) logHistoryEntry(m, i); } catch (e) {}
    var l = $('ep-list-container'); if (l) l.style.display = 'none';
    var b = document.querySelector('.episodes-toggle-btn'); if (b) b.classList.remove('active-dropdown');
    var ov = $('player-overlay'); if (ov) ov.scrollTop = 0;
  }

  // --- Épisodes déjà vus (pastille cliquable dans la liste) ---
  function decorateEpisodes() {
    var m = gm(); if (!m || m.type !== 'serie') return;
    var set = {}; ((P[m.id] || {}).seen || []).forEach(function (x) { set[x] = 1; });
    document.querySelectorAll('#ep-items-wrapper .ep-item').forEach(function (it, i) {
      var on = !!set[i]; it.classList.toggle('lk10-seen', on);
      var b = it.querySelector('.lk10-eye');
      if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'lk10-eye'; b.onclick = function (e) { e.stopPropagation(); setSeen(m.id, i, !isSeen(m.id, i)); decorateEpisodes(); }; it.appendChild(b); }
      b.title = on ? 'Vu — toucher pour marquer comme non vu' : 'Marquer comme vu';
      b.innerHTML = on ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>';
    });
  }

  // --- Branchements sur les fonctions du site ---
  wrap('openP', function (o, a) {
    try { sync(); commit(); cur = null; secs = 0; } catch (e) {}
    var r = o.apply(this, a);
    try { ensureBar(); sync(); refreshBar(); renderSimilar(gm()); var ov = $('player-overlay'); if (ov) ov.scrollTop = 0; } catch (e) {}
    return r;
  });
  wrap('closeP', function (o, a) {
    try { sync(); commit(); flush(true); cur = null; secs = 0; } catch (e) {}
    var r = o.apply(this, a);
    try { if (typeof buildContinueWatchingRow === 'function') buildContinueWatchingRow(); } catch (e) {}
    return r;
  });
  wrap('updatePlayerInterface', function (o, a) { var r = o.apply(this, a); try { sync(); refreshBar(); decorateEpisodes(); } catch (e) {} return r; });
  wrap('renderEpisodeList', function (o, a) { var r = o.apply(this, a); try { decorateEpisodes(); } catch (e) {} return r; });
  wrap('changeLanguage', function (o, a) {
    var r = o.apply(this, a);
    try { var l = gl(); LS.setItem('lk10_lang', l); var m = gm(); if (m) touch(m.id, { lang: l }); } catch (e) {}
    return r;
  });

  // Connexion : on fusionne la progression du compte avec celle de l'appareil
  whenUser(function () {
    try { var u = cu(); userKey = String(u._id || u.id || u.username || 'guest'); loadP(); mergeServer(u.progress || {}); } catch (e) {}
  });
  loadP();

  /* =====================================================================================
     4. TITRES SIMILAIRES sous la fiche
     ===================================================================================== */
  function ensureSimilar() {
    if ($('lk10-similar')) return $('lk10-similar');
    var cs = document.querySelector('#player-overlay .comments-section'); if (!cs || !cs.parentNode) return null;
    var s = document.createElement('div'); s.id = 'lk10-similar'; s.className = 'lk10-similar'; s.style.display = 'none';
    s.innerHTML = '<h3><i class="fas fa-clone"></i> Titres similaires</h3><div class="lk10-sim-row" id="lk10-sim-row"></div>';
    cs.parentNode.insertBefore(s, cs); return s;
  }
  function renderSimilar(m) {
    var box = ensureSimilar(); if (!box || !m) return;
    var row = $('lk10-sim-row'); row.innerHTML = '';
    var list = DB().filter(function (x) { return x && x.id !== m.id && x.type !== 'saga' && x.poster; })
      .map(function (x) { return { m: x, s: simScore(m, x) }; })
      .filter(function (x) { return x.s >= 4; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 14);
    box.style.display = list.length ? 'block' : 'none';
    list.forEach(function (x) {
      var c = document.createElement('div'); c.className = 'lk10-sim-card'; c.tabIndex = 0; c.setAttribute('role', 'button');
      var img = document.createElement('img'); img.loading = 'lazy'; img.alt = ''; img.src = x.m.poster;
      var t = document.createElement('span'); t.textContent = x.m.title || '';
      c.appendChild(img); c.appendChild(t);
      var go = function () { try { openP(x.m.id); } catch (e) {} };
      c.onclick = go;
      c.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
      row.appendChild(c);
    });
  }

  /* =====================================================================================
     5. WISHBOARD : « Me prévenir par e-mail » sur la confirmation d'une demande
     ===================================================================================== */
  function injectWishMail() {
    var acts = document.querySelector('#wb-step-3 .wb-confirm-actions');
    if (!acts || $('lk10-wish-mail')) return;
    var box = document.createElement('div'); box.id = 'lk10-wish-mail'; box.className = 'lk10-wishmail';
    box.innerHTML = '<label class="lk10-chk"><input type="checkbox" id="lk10-wish-mail-cb"><span>Me prévenir <b>par e-mail</b> dès que c\'est ajouté</span></label><small id="lk10-wish-mail-hint"></small>';
    acts.parentNode.insertBefore(box, acts);
  }
  function refreshWishMail() {
    injectWishMail(); var cb = $('lk10-wish-mail-cb'), h = $('lk10-wish-mail-hint'); if (!cb) return;
    var u = cu(), ok = !!(u && u.email);
    cb.disabled = !ok; cb.checked = ok;
    h.textContent = ok ? 'Envoyé à ' + String(u.email).replace(/^(.).*(@.*)$/, '$1•••$2') : 'Ajoute ton e-mail dans Profil › Paramètres pour activer cette alerte.';
  }
  wrap('selectTmdbItem', function (o, a) { var r = o.apply(this, a); try { refreshWishMail(); } catch (e) {} return r; });
  wrap('submitWish', function (o, a) {
    try { var cb = $('lk10-wish-mail-cb'); selectedTmdbItem.notifyEmail = !!(cb && cb.checked && !cb.disabled); } catch (e) {}
    return o.apply(this, a);
  });

  /* =====================================================================================
     6. MODE TÉLÉ : télécommande (flèches / OK / Retour), gros focus, connexion par code
     ===================================================================================== */
  var UA_TV = /SmartTV|SMART-TV|Tizen|Web0S|WebOS|NetCast|HbbTV|VIDAA|Hisense|BRAVIA|AFT[A-Z0-9]+|Android TV|GoogleTV|CrKey|Roku|PlayStation|Xbox|AppleTV|Viera|SonyDTV|Opera TV/i;
  function tvInit() {
    try {
      var q = new URLSearchParams(location.search).get('tv');
      if (q === '1') LS.setItem('lk10_tv', '1'); else if (q === '0') LS.setItem('lk10_tv', '0');
    } catch (e) {}
  }
  tvInit();
  var TV = (function () { var s = LS.getItem('lk10_tv'); return s === '1' ? true : s === '0' ? false : UA_TV.test(navigator.userAgent); })();
  var ZOOMS = [1, 1.2, 1.4];
  function applyTv() {
    document.documentElement.classList.toggle('lk10-tv', TV);
    var z = parseInt(LS.getItem('lk10_tv_z') || '0', 10) || 0; if (z < 0 || z > 2) z = 0;
    document.body.style.zoom = TV && z ? ZOOMS[z] : '';
    if (TV) document.querySelectorAll('video.plat-vid').forEach(function (v) { try { v.pause(); v.removeAttribute('autoplay'); v.preload = 'none'; } catch (e) {} });
    var b = $('lk10-tv-btn'); if (b) { b.classList.toggle('on', TV); b.title = TV ? 'Mode télé activé (touche pour changer la taille / désactiver)' : 'Activer le mode télé'; }
    var gate = $('lk10-tv-gate'); if (gate) gate.style.display = TV ? 'block' : 'none';
  }
  function cycleTv() {
    var z = parseInt(LS.getItem('lk10_tv_z') || '0', 10) || 0;
    if (!TV) { TV = true; LS.setItem('lk10_tv', '1'); LS.setItem('lk10_tv_z', '0'); applyTv(); return toast('Mode télé activé : flèches pour naviguer, OK pour valider, Retour pour fermer.'); }
    if (z < 2) { LS.setItem('lk10_tv_z', String(z + 1)); applyTv(); return toast('Mode télé : taille ' + (z + 2) + '/3'); }
    TV = false; LS.setItem('lk10_tv', '0'); LS.setItem('lk10_tv_z', '0'); applyTv(); toast('Mode télé désactivé.');
  }
  function injectTvButton() {
    if ($('lk10-tv-btn')) return;
    var hr = document.querySelector('header .header-right') || document.querySelector('header');
    if (hr) {
      var b = document.createElement('button'); b.type = 'button'; b.id = 'lk10-tv-btn'; b.innerHTML = '<i class="fas fa-tv"></i>';
      b.onclick = cycleTv; hr.insertBefore(b, hr.firstChild);
    }
    // Connexion par code (écran d'accès) : visible seulement en mode télé
    var dm = document.querySelector('#discord-overlay .discord-modal');
    if (dm && !$('lk10-tv-gate')) {
      var g = document.createElement('div'); g.id = 'lk10-tv-gate'; g.style.display = 'none';
      g.innerHTML = '<button type="button" class="btn-validate-code" id="lk10-tv-go" style="width:100%;margin-top:12px"><i class="fas fa-tv"></i> Je suis sur une télé : me connecter avec mon téléphone</button>';
      dm.appendChild(g); g.querySelector('button').onclick = startTvLink;
    }
    // Côté téléphone / tablette : saisir le code affiché par la télé
    var sm = document.querySelector('#settings-overlay .settings-modal'), h2 = sm && sm.querySelector('h2');
    if (sm && h2 && !$('lk10-set-tv')) {
      var s = document.createElement('div'); s.id = 'lk10-set-tv'; s.className = 'lk10-set-tv';
      s.innerHTML = '<label><i class="fas fa-tv"></i> Lier une télé</label><small>Sur la télé, ouvre le site, choisis « me connecter avec mon téléphone », puis tape ici le code à 6 caractères affiché.</small><div class="lk10-row"><input type="text" id="lk10-tv-code" maxlength="6" placeholder="CODE" autocomplete="off" autocapitalize="characters"><button type="button" class="action-btn" id="lk10-tv-link">Lier</button></div>';
      h2.after(s);
      $('lk10-tv-code').oninput = function () { this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
      $('lk10-tv-link').onclick = function () {
        var code = $('lk10-tv-code').value.trim();
        if (code.length !== 6) return toast('Le code fait 6 caractères.');
        api('/api/tv/link', { method: 'POST', body: JSON.stringify({ code: code }) }).then(function (r) {
          if (r && r.success) { $('lk10-tv-code').value = ''; toast('Télé liée ! Elle se connecte toute seule.'); } else toast((r && r.message) || 'Erreur');
        });
      };
    }
  }

  var tvPoll = null;
  function startTvLink() {
    var ov = $('lk10-tvlink');
    if (!ov) { ov = document.createElement('div'); ov.id = 'lk10-tvlink'; document.body.appendChild(ov); }
    ov.style.display = 'flex';
    ov.innerHTML = '<div class="lk10-tvbox"><h2>Connexion par code</h2><p>Chargement du code…</p></div>';
    clearInterval(tvPoll);
    api('/api/tv/code', { method: 'POST' }).then(function (r) {
      if (!r || !r.success) { ov.innerHTML = '<div class="lk10-tvbox"><h2>Oups</h2><p>' + ((r && r.message) || 'Impossible de générer un code pour le moment.') + '</p><button type="button" id="lk10-tv-retry" class="btn-validate-code">Réessayer</button><button type="button" id="lk10-tv-close" class="btn-validate-code lk10-alt">Fermer</button></div>'; $('lk10-tv-retry').onclick = startTvLink; $('lk10-tv-close').onclick = closeTvLink; return; }
      ov.innerHTML = '<div class="lk10-tvbox"><h2>Connexion par code</h2>' +
        '<p>Sur ton téléphone ou ta tablette (déjà connecté) :<br><b>Profil › Paramètres › Lier une télé</b>, puis tape ce code</p>' +
        '<div class="lk10-code">' + r.code.split('').join(' ') + '</div>' +
        '<p class="lk10-sm">Le code expire dans 10 minutes. En attente de validation…</p>' +
        '<button type="button" id="lk10-tv-close" class="btn-validate-code lk10-alt">Annuler</button></div>';
      $('lk10-tv-close').onclick = closeTvLink; $('lk10-tv-close').focus();
      var t0 = Date.now();
      tvPoll = setInterval(function () {
        if (Date.now() - t0 > 600000) { clearInterval(tvPoll); return startTvLink(); }
        fetch(API_URL + '/api/tv/poll/' + encodeURIComponent(r.code)).then(function (x) { return x.json(); }).then(function (d) {
          if (d && d.token) { clearInterval(tvPoll); try { LS.setItem('monBadgeCineLK10', d.token); } catch (e) {} closeTvLink(); try { autoLogin(d.token); } catch (e) { location.reload(); } }
          else if (d && d.expired) { clearInterval(tvPoll); startTvLink(); }
        }).catch(function () {});
      }, 3000);
    });
  }
  function closeTvLink() { clearInterval(tvPoll); var ov = $('lk10-tvlink'); if (ov) ov.style.display = 'none'; }

  // --- Navigation spatiale ---
  var NAV_SEL = 'a[href],button,input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"]),[onclick],.movie-card,.netflix-card,.wish-card,.saga-card,.sagas-page-card,.pro-sg-card,.platform-card,.ep-item,.genre-tag,.person-link,.cast-card,.hero-dot,.nav-link,.lk10-sim-card,.page-btn,.server-btn,#video-container,[class*="btn"],[class*="card"]';
  var OVERLAYS = '#player-overlay,#trailer-overlay,#settings-overlay,#notifications-overlay,#report-overlay,#random-overlay,#actor-overlay,#admin-overlay,#analytics-overlay,#wb-request-modal,#wb-details-modal,#discord-overlay,#lk10-tvlink';
  var NATIVE = /^(A|BUTTON|SELECT|SUMMARY)$/;
  function isShown(el) { return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'; }
  var KNOWN = '.movie-card,.netflix-card,.wish-card,.saga-card,.sagas-page-card,.pro-sg-card,.platform-card,.ep-item,.cast-card,.lk10-sim-card,.hero-dot,.page-btn,.server-btn,.nav-link,#video-container';
  function interactive(el) {
    var t = el.tagName;
    if (/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(t)) return !el.disabled;
    if (el.matches(KNOWN)) return true;
    if (el.hasAttribute('tabindex') || el.hasAttribute('onclick') || el.onclick) return true;
    return getComputedStyle(el).cursor === 'pointer';
  }
  function topLayer() {
    var best = null, bz = -1;
    document.querySelectorAll(OVERLAYS).forEach(function (el) {
      var cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
      var r = el.getBoundingClientRect(); if (r.width < 50 || r.height < 50) return;
      var z = parseInt(cs.zIndex, 10) || 0; if (z >= bz) { bz = z; best = el; }
    });
    return best;
  }
  function candidates(root) {
    var out = [], seen = new Set();
    root.querySelectorAll(NAV_SEL).forEach(function (el) {
      if (seen.has(el) || !isShown(el)) return; seen.add(el);
      var r = el.getBoundingClientRect(); if (r.width < 10 || r.height < 10) return;
      if (el.closest('#cover-page')) return;
      if (!interactive(el)) return;
      out.push({ el: el, r: r });
    });
    return out;
  }
  function focusEl(el) {
    if (!el.matches('a[href],button,input,select,textarea,[tabindex]')) el.setAttribute('tabindex', '0');
    el.focus({ preventScroll: true });
    try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { el.scrollIntoView(); }
  }
  function move(dir) {
    var root = topLayer() || document.body, cands = candidates(root), a = document.activeElement, cur2 = null;
    if (!cands.length) return;
    if (a && a !== document.body && root.contains(a) && isShown(a)) cur2 = a.getBoundingClientRect();
    if (!cur2) { // rien n'est sélectionné : on prend le premier élément visible en haut à gauche
      var vh = window.innerHeight, best = null, bs = Infinity;
      cands.forEach(function (c) { if (c.r.bottom < 0 || c.r.top > vh) return; var s = c.r.top * 3 + c.r.left; if (s < bs) { bs = s; best = c; } });
      return focusEl((best || cands[0]).el);
    }
    var i = pick(cur2, cands, dir);
    if (i < 0) { if (dir === 'down') window.scrollBy(0, 240); else if (dir === 'up') window.scrollBy(0, -240); return; }
    focusEl(cands[i].el);
  }
  function closeLayer(el) {
    if (!el) return false;
    if (el.id === 'player-overlay') { try { closeP(); } catch (e) { el.style.display = 'none'; } return true; }
    if (el.id === 'lk10-tvlink') { closeTvLink(); return true; }
    var btn = el.querySelector('.close-corner,.settings-close-btn,.close-btn,[class*="close"],[onclick*="close"],[onclick*="Close"]');
    if (btn && isShown(btn)) { btn.click(); return true; }
    if (el.id !== 'discord-overlay') { el.style.display = 'none'; return true; }
    return false;
  }
  function goBack() {
    if (closeLayer(topLayer())) return;
    var pp = $('profile-page'); if (pp && isShown(pp)) { try { closeProfilePage(); } catch (e) {} return; }
  }
  var KEYMAP = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
  var BACKKEYS = { 10009: 1, 461: 1, 27: 1, 8: 1 };
  document.addEventListener('keydown', function (e) {
    if (!TV || e.ctrlKey || e.altKey || e.metaKey) return;
    var t = e.target, tag = t && t.tagName;
    var typing = (tag === 'INPUT' && /^(text|search|email|password|tel|url|number)$/i.test(t.type || 'text')) || tag === 'TEXTAREA' || (t && t.isContentEditable);
    var cover = $('cover-page');
    if (cover && isShown(cover) && (e.keyCode === 13 || e.key === 'Enter')) { e.preventDefault(); try { closeCover(); } catch (x) {} return; }
    var dir = KEYMAP[e.keyCode];
    if (dir) {
      if (typing && (dir === 'left' || dir === 'right')) return;
      if (tag === 'SELECT' && (dir === 'up' || dir === 'down')) return;
      e.preventDefault(); move(dir); return;
    }
    if (e.keyCode === 13) {
      if (typing) return;
      var a = document.activeElement; if (!a || a === document.body) return;
      if (a.id === 'video-container') { e.preventDefault(); var f = a.querySelector('iframe'); if (f) f.focus(); return; }
      if (NATIVE.test(a.tagName) || (a.tagName === 'INPUT' && /^(checkbox|radio|button|submit)$/i.test(a.type))) return;
      e.preventDefault(); a.click(); return;
    }
    if (BACKKEYS[e.keyCode] || e.key === 'GoBack' || e.key === 'BrowserBack') {
      if (typing && (e.keyCode === 8 || e.keyCode === 27)) { if (e.keyCode === 27) t.blur(); return; }
      e.preventDefault(); goBack();
    }
  }, true);

  /* =====================================================================================
     7. APPLI INSTALLABLE (Android / iOS « ajouter à l'écran d'accueil ») — sans cache, donc sans risque
     ===================================================================================== */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  /* =====================================================================================
     8. INIT
     ===================================================================================== */
  function init() {
    try { ensureBar(); ensureSimilar(); injectWishMail(); injectTvButton(); applyTv(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
