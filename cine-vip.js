/* Ciné LK10 — cine-vip.js
   Rubrique VIP : onglet « VIP » (catalogue des titres qui ont un lien M3U8), bouton serveur « VIP » dans la fiche,
   lecteur HLS (hls.js). Les liens M3U8 ne sont jamais envoyés au navigateur sauf à un compte VIP / admin (route /api/vip/source).
   À charger EN DERNIER dans index.html (après tous les autres scripts). */
(function () {
  'use strict';

  var HLS_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
  var V = { on: false, tok: 0, hls: null, video: null };
  var $ = function (id) { return document.getElementById(id); };

  function wrap(name, fn) {
    var o = window[name]; if (typeof o !== 'function') return;
    window[name] = function () { return fn.call(this, o, arguments); };
  }
  function vipOk() { try { return !!(isVipUser || isAdminUnlocked); } catch (e) { return false; } }
  function lang() { try { return currentLanguage; } catch (e) { return 'vf'; } }
  function curMovie() { try { return currentMovie; } catch (e) { return null; } }
  function epIdx() { try { return currentEpisodeIndex || 0; } catch (e) { return 0; } }

  /* ---------- données : le serveur envoie des drapeaux vipVf / vipVostfr (et les liens m3u8_* à l'admin seulement) ---------- */
  function has(o, l) { return !!(o && (l === 'vostfr' ? (o.vipVostfr || o.m3u8_vostfr) : (o.vipVf || o.m3u8_vf))); }
  function srcObj(m) { return !m ? null : (m.type === 'serie' ? (m.episodes || [])[epIdx()] || null : m); }
  function anyHas(m, l) { return !!m && (has(m, l) || (m.episodes || []).some(function (e) { return has(e, l); })); }
  function movieHasVip(m) { return anyHas(m, 'vf') || anyHas(m, 'vostfr'); }
  function classicOf(o, l) {
    if (!o) return false;
    return l === 'vostfr'
      ? !!(o.iframe_premium_vostfr || o.iframe_vidzy_vostfr || o.iframe_uqload_vostfr)
      : !!(o.iframe_premium || o.iframe_vidzy || o.iframe_uqload);
  }
  function movieHasClassic(m) {
    if (!m) return false;
    return m.type === 'serie'
      ? (m.episodes || []).some(function (e) { return classicOf(e, 'vf') || classicOf(e, 'vostfr'); })
      : (classicOf(m, 'vf') || classicOf(m, 'vostfr'));
  }
  function inVipPage() { var n = $('nav-vip'); return !!(n && n.classList.contains('active')); }

  /* ---------- onglet VIP + page catalogue (même grille que « Catalogue ») ---------- */
  function refreshNav() {
    var li = $('nav-vip-li'); if (!li) return;
    var show = vipOk() ? '' : 'none';
    if (li.style.display !== show) li.style.display = show;
  }
  setInterval(refreshNav, 1200);

  window.showVip = function () {
    if (!vipOk()) return;
    try { showCatalogue(); } catch (e) { return; }
    var t = $('cat-title'); if (t) t.innerText = 'Catalogue VIP';
    try {
      filteredList = moviesDB.filter(function (m) { return m.type !== 'saga' && movieHasVip(m); });
      currentPage = 1;
    } catch (e) { return; }
    document.querySelectorAll('.nav-link').forEach(function (a) { a.classList.remove('active'); });
    var n = $('nav-vip'); if (n) n.classList.add('active');
    try { updateGrid(true); } catch (e) {}
    if (t) t.innerText = 'Catalogue VIP';
  };

  /* ---------- lecteur HLS ---------- */
  var hlsLoading = null;
  function loadHls() {
    if (window.Hls) return Promise.resolve();
    if (hlsLoading) return hlsLoading;
    hlsLoading = new Promise(function (ok, ko) {
      var s = document.createElement('script'); s.src = HLS_SRC; s.onload = ok; s.onerror = function () { hlsLoading = null; ko(new Error('Lecteur indisponible (hls.js non chargé).')); };
      document.head.appendChild(s);
    });
    return hlsLoading;
  }
  function stopVip() {
    V.tok++;
    if (V.hls) { try { V.hls.destroy(); } catch (e) {} V.hls = null; }
    if (V.video) { try { V.video.pause(); V.video.removeAttribute('src'); V.video.load(); } catch (e) {} V.video = null; }
  }
  function msgHtml(t, red) {
    return '<div style="color:' + (red ? '#e74c3c' : '#fff') + ';text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;font-size:14px;padding:0 15px;">' + t + '</div>';
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function mount(box, url, my) {
    box.innerHTML = '';
    var wrapEl = document.createElement('div'); wrapEl.style.cssText = 'position:relative;width:100%;height:100%;background:#000;';
    var v = document.createElement('video');
    v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('playsinline', ''); v.style.cssText = 'width:100%;height:100%;display:block;background:#000;';
    wrapEl.appendChild(v); box.appendChild(wrapEl); V.video = v;

    function tryPlay() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function fail(t) { if (my === V.tok) box.innerHTML = msgHtml('<i class="fas fa-exclamation-triangle" style="font-size:22px;margin-bottom:8px"></i>' + esc(t), true); }

    if (window.Hls && Hls.isSupported()) {
      var hls = new Hls({ enableWorker: true, maxBufferLength: 40 }); V.hls = hls;
      hls.loadSource(url); hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, function (e, d) {
        tryPlay();
        if (d.levels && d.levels.length > 1) {
          var sel = document.createElement('select');
          sel.style.cssText = 'position:absolute;top:10px;right:10px;background:rgba(0,0,0,.7);color:#fff;border:1px solid #444;border-radius:6px;padding:6px 8px;font-size:12px;z-index:5;';
          sel.innerHTML = '<option value="-1">Auto</option>' + d.levels.map(function (l, i) { return '<option value="' + i + '">' + (l.height ? l.height + 'p' : Math.round(l.bitrate / 1000) + ' kb/s') + '</option>'; }).join('');
          sel.onchange = function () { hls.currentLevel = +sel.value; };
          wrapEl.appendChild(sel);
        }
      });
      hls.on(Hls.Events.ERROR, function (e, d) {
        if (!d.fatal || my !== V.tok) return;
        if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
          var code = d.response && d.response.code;
          if (code === 401 || code === 403 || code === 404) return fail('Vidéo indisponible (erreur ' + code + ').');
          if (d.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) return fail('Vidéo indisponible (le serveur de la vidéo ne répond pas ou refuse la lecture).');
          hls.startLoad();
        } else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); }
        else fail('Lecture impossible.');
      });
    } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = url; tryPlay();                                   /* Safari / iPhone : HLS natif */
    } else fail('Ce navigateur ne sait pas lire ce format.');
  }

  function playVip() {
    var m = curMovie(); if (!m) return;
    var box = $('video-container'); if (!box) return;
    stopVip(); var my = V.tok;
    box.innerHTML = msgHtml('<i class="fas fa-circle-notch fa-spin" style="font-size:22px;margin-bottom:8px"></i>Chargement…');
    var url = API_URL + '/api/vip/source?id=' + encodeURIComponent(m.id) + '&lang=' + encodeURIComponent(lang()) + '&ep=' + (m.type === 'serie' ? epIdx() : 0);
    fetch(url, { headers: { authorization: localStorage.getItem('monBadgeCineLK10') || '' } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (my !== V.tok) return;
        if (!d || !d.success) throw new Error((d && d.message) || 'Lien VIP indisponible.');
        return loadHls().then(function () { if (my === V.tok) mount(box, d.url, my); });
      })
      .catch(function (e) { if (my === V.tok) box.innerHTML = msgHtml('<i class="fas fa-exclamation-triangle" style="font-size:22px;margin-bottom:8px"></i>' + esc(e.message || 'Erreur'), true); });
  }

  /* si la vidéo est remplacée par autre chose (bande-annonce, iframe, fermeture) : on coupe le flux */
  (function () {
    var box = $('video-container'); if (!box || !window.MutationObserver) return;
    new MutationObserver(function () { if (V.video && !box.contains(V.video)) stopVip(); }).observe(box, { childList: true });
  })();

  /* ---------- bouton serveur « VIP » + langues ---------- */
  var st = document.createElement('style');
  st.textContent = '#btn-server-vip{border-color:var(--primary,#ffde00)!important;color:var(--primary,#ffde00)}#btn-server-vip.active{background:var(--primary,#ffde00)!important;color:#000!important}';
  document.head.appendChild(st);

  function vipBtn() {
    var b = $('btn-server-vip');
    if (!b) {
      b = document.createElement('button'); b.className = 'server-btn'; b.id = 'btn-server-vip';
      b.innerHTML = '<i class="fas fa-gem"></i> VIP'; b.style.display = 'none';
      b.onclick = function () { V.on = true; window.updatePlayerInterface(); };
    }
    return b;
  }
  function ensureLangs(m) {
    var sel = $('language-select'); if (!sel || !m || !vipOk()) return;
    [['vf', 'VF'], ['vostfr', 'VOSTFR']].forEach(function (x) {
      if (anyHas(m, x[0]) && !Array.prototype.some.call(sel.options, function (o) { return o.value === x[0]; })) sel.add(new Option(x[1], x[0]));
    });
    if (V.on) {
      var o = srcObj(m);
      if (!has(o, lang())) { var other = lang() === 'vf' ? 'vostfr' : 'vf'; if (has(o, other)) { try { currentLanguage = other; } catch (e) {} } }
    }
    if (sel.value !== lang() && Array.prototype.some.call(sel.options, function (o) { return o.value === lang(); })) sel.value = lang();
  }
  function updateBtn(m) {
    var b = vipBtn(), show = vipOk() && has(srcObj(m), lang());
    var anime = $('anime-servers') && $('anime-servers').style.display !== 'none';
    var host = anime ? $('anime-servers') : $('classic-servers');
    if (host && b.parentNode !== host) host.appendChild(b);
    b.style.display = show ? 'inline-block' : 'none';
    var on = !!(V.on && show);
    b.classList.toggle('active', on);
    if (on) ['btn-server-prem', 'btn-server-vidzy', 'btn-server-uql', 'btn-server-regarder'].forEach(function (id) { var x = $(id); if (x) x.classList.remove('active'); });
  }
  function vipAvail() { var m = curMovie(); return !!m && vipOk() && has(srcObj(m), lang()); }

  /* ---------- branchements sur le lecteur existant ---------- */
  wrap('openP', function (o, a) {
    stopVip();
    var m = null; try { m = moviesDB.find(function (x) { return x.id === a[0]; }); } catch (e) {}
    /* ouvert depuis l'onglet VIP, ou titre qui n'existe qu'en VIP : on lance le serveur VIP */
    V.on = !!(m && vipOk() && movieHasVip(m) && (inVipPage() || !movieHasClassic(m)));
    return o.apply(this, a);
  });

  wrap('updatePlayerInterface', function (o, a) {
    var m = curMovie();
    ensureLangs(m);
    if (!vipAvail()) V.on = false;
    var r = o.apply(this, a);
    try { updateBtn(m); } catch (e) {}
    return r;
  });

  wrap('setVideoContent', function (o, a) {
    var m = curMovie();
    if (V.on && vipAvail()) {
      /* on laisse la logique existante décider (ouverture en mode bande-annonce : rien ne change → on ne lance pas la vidéo) */
      var box = $('video-container'), before = box ? box.innerHTML : '';
      o.call(this, 'VIP_LOCK');
      if (box && box.innerHTML !== before) playVip();
      return;
    }
    stopVip();
    var args = a;
    if (!a[0] && m && !vipOk() && movieHasVip(m)) args = ['VIP_LOCK'];   /* titre VIP vu par un non-VIP : message « Réservé aux membres VIP » */
    return o.apply(this, args);
  });

  wrap('changeServer', function (o, a) { V.on = false; return o.apply(this, a); });
  wrap('closeP', function (o, a) { V.on = false; stopVip(); return o.apply(this, a); });
})();
