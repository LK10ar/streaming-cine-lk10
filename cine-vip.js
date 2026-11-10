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

  /* ---------- onglet VIP + page catalogue (même grille que « Catalogue », avec filtres + recherche propres au VIP) ---------- */
  var VP = { type: 'all', q: '' };
  var GEM_POSTER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#151515"/><text x="150" y="250" font-size="110" text-anchor="middle">💎</text></svg>');

  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }

  function refreshNav() {
    var show = vipOk() ? '' : 'none';
    document.querySelectorAll('.vip-menu-link').forEach(function (x) { if (x.style.display !== show) x.style.display = show; });
  }
  setInterval(refreshNav, 1200);

  /* liens « 💎 VIP » dans les menus Films et Séries (réinjectés si le menu est reconstruit par le site) */
  function addMenuLinks() {
    [['nav-film', 'film', 'Films VIP'], ['nav-serie', 'serie', 'Séries VIP']].forEach(function (x) {
      var nav = $(x[0]); if (!nav) return;
      var dd = nav.nextElementSibling; if (!dd || dd.querySelector('.vip-menu-link')) return;
      var col = dd.querySelector('.drop-column') || dd;
      var a = document.createElement('a'); a.className = 'vip-menu-link'; a.style.display = vipOk() ? '' : 'none';
      a.innerHTML = '<i class="fas fa-gem" style="color:var(--primary);margin-right:6px"></i> ' + x[2];
      a.onclick = function (e) { if (e) e.stopPropagation(); try { closeProfilePage(); } catch (er) {} window.showVip(x[1]); try { closeMobileMenu(); } catch (er) {} };
      col.insertBefore(a, col.firstChild);
    });
  }
  addMenuLinks();
  [['nav-film'], ['nav-serie']].forEach(function (x) {
    var nav = $(x[0]), dd = nav && nav.nextElementSibling;
    if (dd && window.MutationObserver) new MutationObserver(addMenuLinks).observe(dd, { childList: true });
  });
  setInterval(addMenuLinks, 2000);

  /* barre d'outils VIP */
  function bar() {
    var b = $('vip-toolbar'); if (b) return b;
    var st2 = document.createElement('style');
    st2.textContent = '#vip-toolbar{display:none;flex-wrap:wrap;gap:10px;align-items:center;margin:-8px 0 18px}' +
      '#vip-toolbar .vt-btn{background:#111;color:#ccc;border:1px solid #333;border-radius:999px;padding:8px 16px;font-weight:bold;font-size:13px;cursor:pointer;font-family:inherit;touch-action:manipulation}' +
      '#vip-toolbar .vt-btn.on,#vip-toolbar .vt-btn:hover{background:var(--primary,#ffde00);color:#000;border-color:var(--primary,#ffde00)}' +
      '#vip-toolbar .vt-search{flex:1 1 240px;min-width:0;display:flex;background:#111;border:1px solid #333;border-radius:999px;overflow:hidden}' +
      '#vip-toolbar .vt-search input{flex:1;min-width:0;background:transparent;border:0;color:#fff;padding:9px 14px;font-size:14px;outline:none}' +
      '#vip-toolbar .vt-search button{background:#222;border:0;color:#fff;padding:0 14px;cursor:pointer}' +
      '#vip-toolbar .vt-req{background:rgba(255,222,0,.1);border-color:var(--primary,#ffde00);color:var(--primary,#ffde00);display:none}' +
      '.vip-empty{grid-column:1/-1;text-align:center;padding:40px 16px;color:#bbb}.vip-empty b{color:#fff}.vip-empty button{margin-top:14px;background:var(--primary,#ffde00);color:#000;border:0;border-radius:999px;padding:12px 22px;font-weight:bold;font-size:14px;cursor:pointer;font-family:inherit}';
    document.head.appendChild(st2);
    b = document.createElement('div'); b.id = 'vip-toolbar';
    b.innerHTML = '<button class="vt-btn" data-t="all">Tous</button><button class="vt-btn" data-t="film"><i class="fas fa-film"></i> Films</button><button class="vt-btn" data-t="serie"><i class="fas fa-video"></i> Séries</button>' +
      '<div class="vt-search"><input type="text" id="vip-q" placeholder="Rechercher dans le catalogue VIP…" autocomplete="off"><button id="vip-q-clear" title="Effacer"><i class="fas fa-times"></i></button></div>' +
      '<button class="vt-btn vt-req" id="vip-req"><i class="fas fa-paper-plane"></i> Demander ce titre</button>';
    var anchor = document.querySelector('.section-title'); if (!anchor) return b;
    anchor.parentNode.insertBefore(b, anchor.nextSibling);
    b.querySelectorAll('[data-t]').forEach(function (x) { x.onclick = function () { VP.type = x.getAttribute('data-t'); var h = $(VP.type === 'film' ? 'nav-film' : (VP.type === 'serie' ? 'nav-serie' : 'nav-catalogue')); document.querySelectorAll('.nav-link').forEach(function (a) { a.classList.remove('active'); }); var nv = $('nav-vip'); if (nv) nv.classList.add('active'); if (h) h.classList.add('active'); applyVip(); }; });
    var q = b.querySelector('#vip-q'), t = null;
    q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { VP.q = q.value; applyVip(); }, 180); });
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(t); VP.q = q.value; applyVip(); } });
    b.querySelector('#vip-q-clear').onclick = function () { q.value = ''; VP.q = ''; applyVip(); q.focus(); };
    b.querySelector('#vip-req').onclick = function () { requestTitle(VP.q); };
    return b;
  }

  /* demande d'un titre introuvable : elle part directement sur le Wishboard (avec vote + mail « ajouté ») */
  function requestTitle(title) {
    title = String(title || '').trim(); if (!title) return;
    var token = localStorage.getItem('monBadgeCineLK10'); if (!token) return alert('Connecte-toi pour envoyer une demande.');
    var type = VP.type === 'serie' ? 'tv' : 'movie';
    fetch(API_URL + '/api/wishes/add', {
      method: 'POST', headers: { 'Content-Type': 'application/json', authorization: token },
      body: JSON.stringify({ tmdbId: 'vip-' + norm(title).replace(/[^a-z0-9]+/g, '-') + '-' + type, title: title, type: type, posterUrl: GEM_POSTER, description: 'Demande depuis le catalogue VIP', notifyEmail: true })
    }).then(function (r) { return r.json(); }).then(function (d) {
      alert((d.success ? '✅ ' : 'ℹ️ ') + (d.message || 'Demande envoyée.'));
    }).catch(function () { alert('❌ Erreur de connexion au serveur.'); });
  }

  function setControls(vip) {
    var yr = $('year-filter-input'), ids = [$('sort-select'), $('hide-anime-toggle'), yr && yr.parentNode];
    ids.forEach(function (el) { if (el) el.style.display = vip ? 'none' : ''; });
    var b = bar(); if (b) b.style.display = vip ? 'flex' : 'none';
  }

  function applyVip() {
    var b = bar(), q = norm(VP.q);
    b.querySelectorAll('[data-t]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-t') === VP.type); });
    var qi = b.querySelector('#vip-q'); if (qi.value !== VP.q) qi.value = VP.q;
    var ct = $('cat-title'); if (ct) ct.innerText = VP.type === 'film' ? 'Films VIP' : (VP.type === 'serie' ? 'Séries VIP' : 'Catalogue VIP');
    try {
      filteredList = moviesDB.filter(function (m) {
        return m.type !== 'saga' && movieHasVip(m) && (VP.type === 'all' || m.type === VP.type) && (!q || norm(m.title).indexOf(q) > -1);
      });
      currentPage = 1; updateGrid(true);
    } catch (e) { return; }
    var req = b.querySelector('#vip-req'); req.style.display = q.length >= 2 ? 'inline-block' : 'none';
    if (!filteredList.length) {
      var g = $('grid');
      if (g) {
        var label = VP.type === 'film' ? 'film' : (VP.type === 'serie' ? 'série' : 'titre');
        g.innerHTML = q
          ? '<div class="vip-empty"><i class="fas fa-search" style="font-size:26px;color:var(--primary)"></i><p>Aucun ' + label + ' VIP trouvé pour <b>« ' + esc(VP.q.trim()) + ' »</b>.</p><button id="vip-empty-req"><i class="fas fa-paper-plane"></i> Demander ce titre</button></div>'
          : '<div class="vip-empty"><i class="fas fa-gem" style="font-size:26px;color:var(--primary)"></i><p>Aucun ' + label + ' VIP pour le moment.</p></div>';
        var eb = $('vip-empty-req'); if (eb) eb.onclick = function () { requestTitle(VP.q); };
      }
    }
  }

  window.showVip = function (type) {
    if (!vipOk()) return;
    try { showCatalogue(); } catch (e) { return; }
    VP.type = (type === 'film' || type === 'serie') ? type : 'all'; VP.q = '';
    var t = $('cat-title');
    document.querySelectorAll('.nav-link').forEach(function (a) { a.classList.remove('active'); });
    var n = $('nav-vip'); if (n) n.classList.add('active');           /* repère interne (caché) : sert à savoir qu'on est dans le VIP */
    var hl = $(VP.type === 'film' ? 'nav-film' : (VP.type === 'serie' ? 'nav-serie' : 'nav-catalogue')); if (hl) hl.classList.add('active');
    setControls(true); applyVip();
    if (t) t.innerText = VP.type === 'film' ? 'Films VIP' : (VP.type === 'serie' ? 'Séries VIP' : 'Catalogue VIP');
  };

  /* dès qu'on quitte la page VIP (autre onglet, accueil, recherche…) : on remet les contrôles normaux */
  (function () {
    var n = $('nav-vip'); if (!n || !window.MutationObserver) return;
    new MutationObserver(function () { if (!n.classList.contains('active')) setControls(false); }).observe(n, { attributes: true, attributeFilter: ['class'] });
  })();

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
