/* Ciné LK10 — Bannières des thèmes d'avatars
   1) Pour tout le monde : charge les réglages enregistrés (lien + position) et les applique au sélecteur d'avatars.
   2) Pour l'admin : carte « Bannières des avatars » dans le Tableau de bord analytique
      → ajouter une bannière là où il en manque, la repositionner (glisser sur l'aperçu ou curseurs), enregistrer.
   À ajouter dans index.html, juste APRÈS cine-avatars.js :  <script src="avatar-banners-admin.js"></script> */
(function () {
  'use strict';
  var PER = 6;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var tok = function () { return localStorage.getItem('monBadgeCineLK10') || ''; };
  var safeUrl = function (u) { return /^https?:\/\/\S+$/i.test(u || ''); };
  var pack = function () { return Array.isArray(window.AVATAR_PACK) ? window.AVATAR_PACK : []; };
  var api = function (p, o) {
    o = o || {}; o.headers = { authorization: tok(), 'Content-Type': 'application/json' };
    return fetch(API_URL + p, o).then(function (r) { return r.json(); });
  };

  var defaults = {};            // bannière d'origine (fichier avatars-data.js), par nom de thème
  pack().forEach(function (t) { if (t && t.name != null && !(t.name in defaults)) defaults[t.name] = t.banner || ''; });
  var saved = {};               // réglages enregistrés en base : nom -> {banner,posX,posY}
  var draft = {};               // modifications pas encore enregistrées : nom -> {banner,posX,posY}
  var st = { page: 1, q: '', f: '' };

  function themes() {           // un thème par nom (les doublons de nom partagent le même réglage)
    var seen = {}, out = [];
    pack().forEach(function (t) { if (t && t.name != null && !seen[t.name]) { seen[t.name] = 1; out.push(t); } });
    return out;
  }
  function cur(t) {
    return draft[t.name] || { banner: t.banner || '', posX: t.posX == null ? 50 : t.posX, posY: t.posY == null ? 50 : t.posY };
  }

  /* ---------- Applique les réglages au sélecteur d'avatars (déjà ouvert ou pas) ---------- */
  function applyAll() {
    pack().forEach(function (t) {
      var o = saved[t.name];
      if (o) { t.banner = o.banner; t.posX = o.posX; t.posY = o.posY; }
      else { t.banner = defaults[t.name] || ''; delete t.posX; delete t.posY; }
    });
    var byName = {};
    pack().forEach(function (t) { byName[String(t.name || '').toLowerCase()] = t; });
    document.querySelectorAll('#av-picker .av-theme').forEach(function (sec) {
      var t = byName[sec.dataset.name], th = sec.querySelector('.av-th'); if (!t || !th) return;
      if (safeUrl(t.banner)) {
        th.classList.add('has-b'); th.style.backgroundImage = 'url("' + t.banner.replace(/"/g, '%22') + '")';
        th.style.backgroundPosition = (t.posX == null ? 50 : t.posX) + '% ' + (t.posY == null ? 50 : t.posY) + '%';
      } else { th.classList.remove('has-b'); th.style.backgroundImage = ''; th.style.backgroundPosition = ''; }
    });
  }
  function loadSaved() {
    return fetch(API_URL + '/api/avatar-banners').then(function (r) { return r.json(); }).then(function (d) {
      saved = {}; (d.banners || []).forEach(function (b) { saved[b.name] = b; }); applyAll();
    }).catch(function () {});
  }

  /* ---------- Carte admin ---------- */
  function css() {
    if ($('bn-css')) return;
    var s = document.createElement('style'); s.id = 'bn-css';
    s.textContent =
      '.bn-row{border-bottom:1px solid #2a2b36;padding:14px 0}' +
      '.bn-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;color:#fff;font-weight:700;font-size:13px}' +
      '.bn-head small{color:#888;font-weight:400}' +
      '.bn-tag{font-size:10px;border-radius:8px;padding:1px 7px;font-weight:700}' +
      '.bn-tag.miss{background:rgba(255,107,94,.15);color:#ff6b5e}.bn-tag.edit{background:rgba(255,222,0,.15);color:var(--primary,#ffde00)}' +
      '.bn-prev{position:relative;height:92px;border-radius:12px;border:1px dashed #3a3b48;background:#151515 center/cover no-repeat;overflow:hidden;touch-action:none;cursor:grab;user-select:none}' +
      '.bn-prev.has{border:1px solid #1f1f1f}.bn-prev:active{cursor:grabbing}' +
      '.bn-prev::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.85),rgba(0,0,0,.25));pointer-events:none}' +
      '.bn-prev span{position:absolute;left:0;bottom:0;padding:10px 14px;color:#fff;font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;text-shadow:0 2px 8px #000;pointer-events:none}' +
      '.bn-prev i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#777;font-size:12px;font-style:normal;pointer-events:none}' +
      '.bn-hint{font-size:11px;color:#777;margin:5px 0 8px}' +
      '.bn-url{width:100%;box-sizing:border-box;margin:0 0 8px}' +
      '.bn-sl{display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:#aaa;margin-bottom:10px}' +
      '.bn-sl label{display:flex;align-items:center;gap:8px;flex:1;min-width:140px}' +
      '.bn-sl input[type=range]{flex:1;accent-color:var(--primary,#ffde00)}' +
      '.bn-acts{display:flex;gap:6px;flex-wrap:wrap}' +
      '.bn-acts button:disabled{opacity:.4;cursor:default}';
    document.head.appendChild(s);
  }

  function addCard() {
    var m = document.querySelector('#analytics-overlay .analytics-modal'); if (!m || $('bn-card')) return;
    css();
    var c = document.createElement('div');
    c.id = 'bn-card'; c.className = 'users-list-container'; c.style.cssText = 'margin:20px 0;border:1px solid var(--primary)';
    c.innerHTML = '<h3><i class="fas fa-images" style="color:var(--primary)"></i> Bannières des avatars <span id="bn-miss" style="background:var(--danger);color:#fff;border-radius:10px;padding:1px 8px;font-size:11px;margin-left:6px;display:none"></span></h3>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      '<input id="bn-q" class="analytics-search-input" style="flex:2;min-width:160px" placeholder="Rechercher un thème...">' +
      '<select id="bn-f" class="analytics-search-input" style="flex:1;min-width:130px"><option value="">Tous les thèmes</option><option value="miss">Sans bannière</option><option value="has">Avec bannière</option></select></div>' +
      '<div class="users-list-box" id="bn-list" style="max-height:none"></div><div class="analytics-pagination" id="bn-pg"></div>';
    var grid = m.querySelector('.charts-grid'); grid ? m.insertBefore(c, grid) : m.appendChild(c);
    $('bn-q').oninput = function () { st.q = this.value.trim().toLowerCase(); st.page = 1; render(); };
    $('bn-f').onchange = function () { st.f = this.value; st.page = 1; render(); };
  }

  function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
  function paint(row, d) {
    var p = row.querySelector('.bn-prev'), ok = safeUrl(d.banner);
    p.style.backgroundImage = ok ? 'url("' + d.banner.replace(/"/g, '%22') + '")' : '';
    p.style.backgroundPosition = d.posX + '% ' + d.posY + '%'; p.classList.toggle('has', ok);
    var i = p.querySelector('i'); if (i) i.style.display = ok ? 'none' : 'flex';
    row.querySelector('.bn-x').value = d.posX; row.querySelector('.bn-y').value = d.posY;
  }
  function dirty(row, t, d) {       // enregistre le brouillon + affiche « non enregistré »
    draft[t.name] = { banner: d.banner, posX: d.posX, posY: d.posY };
    var e = row.querySelector('.bn-tag.edit'); if (e) e.style.display = '';
    row.querySelector('.bn-save').disabled = false;
  }

  function render() {
    var all = themes();
    var miss = all.filter(function (t) { return !safeUrl(cur(t).banner); }).length, b = $('bn-miss');
    b.style.display = miss ? 'inline' : 'none'; b.textContent = miss + ' sans bannière';
    var list = all.filter(function (t) {
      var has = safeUrl(cur(t).banner);
      return (!st.q || String(t.name).toLowerCase().indexOf(st.q) > -1) && (!st.f || (st.f === 'has' ? has : !has));
    });
    var pages = Math.max(1, Math.ceil(list.length / PER)); st.page = Math.min(st.page, pages);
    var box = $('bn-list');
    if (!list.length) { box.innerHTML = '<div style="color:#aaa;text-align:center;padding:12px">Aucun thème.</div>'; $('bn-pg').innerHTML = ''; return; }
    box.innerHTML = list.slice((st.page - 1) * PER, st.page * PER).map(function (t, i) {
      var d = cur(t), has = safeUrl(d.banner), n = (t.icons || []).length;
      return '<div class="bn-row" data-i="' + i + '">' +
        '<div class="bn-head">' + esc(t.name) + '<small>' + n + ' icône' + (n > 1 ? 's' : '') + '</small>' +
        (has ? '' : '<span class="bn-tag miss">Sans bannière</span>') + '<span class="bn-tag edit" style="' + (draft[t.name] ? '' : 'display:none') + '">Non enregistré</span></div>' +
        '<div class="bn-prev"><i>Colle un lien d\'image ci-dessous</i><span>' + esc(t.name) + '</span></div>' +
        '<div class="bn-hint">Glisse l\'image dans l\'aperçu pour la repositionner, ou utilise les curseurs.</div>' +
        '<input class="analytics-search-input bn-url" placeholder="https://lien-de-la-banniere.jpg" value="' + esc(d.banner) + '">' +
        '<div class="bn-sl"><label>Horizontal <input type="range" class="bn-x" min="0" max="100"></label><label>Vertical <input type="range" class="bn-y" min="0" max="100"></label></div>' +
        '<div class="bn-acts"><button class="analytics-page-btn bn-save" style="padding:0 12px;width:auto;background:var(--primary);color:#000"' + (draft[t.name] ? '' : ' disabled') + '>Enregistrer</button>' +
        '<button class="analytics-page-btn bn-reset" style="padding:0 12px;width:auto">Rétablir l\'original</button></div></div>';
    }).join('');

    var slice = list.slice((st.page - 1) * PER, st.page * PER);
    box.querySelectorAll('.bn-row').forEach(function (row) {
      var t = slice[+row.dataset.i], d = cur(t); d = { banner: d.banner, posX: d.posX, posY: d.posY };
      paint(row, d);
      var prev = row.querySelector('.bn-prev'), nat = null;
      function loadNat() {            // dimensions réelles de l'image, pour que le glisser suive le doigt/la souris
        nat = null; if (!safeUrl(d.banner)) return;
        var im = new Image(); var u = d.banner; im.onload = function () { if (u === d.banner) nat = { w: im.naturalWidth, h: im.naturalHeight }; }; im.src = u;
      }
      loadNat();
      row.querySelector('.bn-url').oninput = function () { d.banner = this.value.trim(); paint(row, d); loadNat(); dirty(row, t, d); };
      row.querySelector('.bn-x').oninput = function () { d.posX = +this.value; paint(row, d); dirty(row, t, d); };
      row.querySelector('.bn-y').oninput = function () { d.posY = +this.value; paint(row, d); dirty(row, t, d); };

      var drag = null;
      prev.onpointerdown = function (e) {
        if (!nat) return; var w = prev.clientWidth, h = prev.clientHeight, k = Math.max(w / nat.w, h / nat.h);
        drag = { x: e.clientX, y: e.clientY, px: d.posX, py: d.posY, ox: nat.w * k - w, oy: nat.h * k - h };
        try { prev.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault();
      };
      prev.onpointermove = function (e) {
        if (!drag) return;
        if (drag.ox > 1) d.posX = clamp(drag.px - (e.clientX - drag.x) / drag.ox * 100);
        if (drag.oy > 1) d.posY = clamp(drag.py - (e.clientY - drag.y) / drag.oy * 100);
        paint(row, d); dirty(row, t, d);
      };
      prev.onpointerup = prev.onpointercancel = function () { drag = null; };

      row.querySelector('.bn-save').onclick = function () {
        var btn = this; if (d.banner && !safeUrl(d.banner)) return alert("Le lien doit commencer par http:// ou https://");
        btn.disabled = true;
        api('/api/admin/avatar-banners', { method: 'POST', body: JSON.stringify({ name: t.name, banner: d.banner, posX: d.posX, posY: d.posY }) }).then(function (r) {
          if (!r.success) { btn.disabled = false; return alert(r.message || 'Erreur'); }
          saved[t.name] = { name: t.name, banner: d.banner, posX: d.posX, posY: d.posY }; delete draft[t.name]; applyAll(); render();
        }).catch(function () { btn.disabled = false; alert('Erreur de connexion.'); });
      };
      row.querySelector('.bn-reset').onclick = function () {
        if (!confirm('Revenir à la bannière du fichier avatars-data.js pour « ' + t.name + ' » ?')) return;
        api('/api/admin/avatar-banners/' + encodeURIComponent(t.name), { method: 'DELETE' }).then(function (r) {
          if (!r.success) return alert(r.message || 'Erreur');
          delete saved[t.name]; delete draft[t.name]; applyAll(); render();
        }).catch(function () { alert('Erreur de connexion.'); });
      };
    });

    $('bn-pg').innerHTML = pages > 1 ? Array.from({ length: pages }, function (_, i) { return '<button class="analytics-page-btn' + (i + 1 === st.page ? ' active' : '') + '" data-p="' + (i + 1) + '">' + (i + 1) + '</button>'; }).join('') : '';
    $('bn-pg').querySelectorAll('button').forEach(function (b) { b.onclick = function () { st.page = +b.dataset.p; render(); }; });
  }

  function open() { addCard(); if ($('bn-list')) render(); }

  function init() {
    loadSaved();
    addCard();
    if (typeof window.openAnalytics === 'function') {
      var o = window.openAnalytics;
      window.openAnalytics = async function () { var r = o.apply(this, arguments); open(); return r; };
    }
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
