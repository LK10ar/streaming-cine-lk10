/* Ciné LK10 — page profil enrichie (email, GIF, bannière, Mes alertes, En cours)
   + Tableau de bord (membres récents d'abord, demandes à traiter en premier).
   À ajouter dans index.html, sous cine-fx.js :  <script src="cine-profile.js"></script> */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var cu = function () { try { return currentUser; } catch (e) { return null; } };
  var api = function (p, o) {
    o = o || {}; o.headers = { 'Content-Type': 'application/json', authorization: localStorage.getItem('monBadgeCineLK10') || '' };
    return fetch(API_URL + p, o).then(function (r) { return r.json(); });
  };
  var fmt = function (d) { try { return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  var ts = function (o) { return parseInt(String((o && o._id) || '').slice(0, 8), 16) || 0; };

  /* ---------- Bannière ---------- */
  function applyBanner() {
    var h = document.querySelector('.prof-header'); if (!h) return;
    var b = $('fx-prof-banner');
    if (!b) { b = document.createElement('div'); b.id = 'fx-prof-banner'; h.insertBefore(b, h.firstChild); }
    var u = (cu() && cu().banner) || '';
    if (/^https?:\/\//i.test(u)) { b.style.backgroundImage = 'url("' + u.replace(/"/g, '%22') + '")'; h.classList.add('has-banner'); }
    else { b.style.backgroundImage = ''; h.classList.remove('has-banner'); }
  }

  /* ---------- Paramètres : GIF, bannière, email ---------- */
  function patchSettings() {
    var m = document.querySelector('#settings-overlay .settings-modal'), pic = $('input-new-pic');
    if (!m || !pic || $('fx-set-extra')) return;
    var lab = m.querySelector('label'); if (lab) lab.textContent = 'Changer la photo de profil (URL — GIF accepté)';
    pic.insertAdjacentHTML('afterend', '<img id="fx-pic-prev" class="fx-prev" alt="">');
    pic.addEventListener('input', function () { var p = $('fx-pic-prev'), v = pic.value.trim(); if (/^https?:\/\//i.test(v)) { p.src = v; p.style.display = 'block'; } else p.style.display = 'none'; });
    var box = document.createElement('div'); box.id = 'fx-set-extra';
    box.innerHTML = '<div class="fx-set"><label>Bannière du profil (URL image ou GIF — idéal 1546×423)</label>' +
      '<input type="text" id="fx-in-banner" placeholder="https://lien-de-ma-banniere.jpg"><div class="fx-row">' +
      '<button class="action-btn" id="fx-b-save">Enregistrer la bannière</button><button class="fx-btn" id="fx-b-del">Retirer</button></div></div>' +
      '<div class="fx-set"><label>Adresse email <span id="fx-mail-cur"></span></label>' +
      '<input type="email" id="fx-in-mail" placeholder="nouvel@email.com"><input type="password" id="fx-in-mailpw" placeholder="Ton mot de passe actuel (confirmation)">' +
      '<button class="action-btn" id="fx-m-save">Enregistrer l\'email</button></div>';
    pic.parentNode.after(box);
    function saveBanner(clear) {
      var u = clear ? '' : $('fx-in-banner').value.trim();
      if (!clear && !u) return alert("Entre un lien d'image ou de GIF.");
      api('/api/user/update-banner', { method: 'POST', body: JSON.stringify({ url: u }) }).then(function (d) {
        if (d.success) { if (cu()) cu().banner = u; applyBanner(); $('fx-in-banner').value = ''; alert(clear ? 'Bannière retirée.' : 'Bannière mise à jour !'); }
        else alert(d.message || 'Erreur');
      }).catch(function () { alert('Erreur de connexion.'); });
    }
    $('fx-b-save').onclick = function () { saveBanner(false); };
    $('fx-b-del').onclick = function () { saveBanner(true); };
    $('fx-m-save').onclick = function () {
      var e = $('fx-in-mail').value.trim(), p = $('fx-in-mailpw').value;
      if (!e || !p) return alert('Entre ton nouvel email et ton mot de passe.');
      api('/api/user/update-email', { method: 'POST', body: JSON.stringify({ email: e, password: p }) }).then(function (d) {
        if (d.success) { if (cu()) cu().email = d.email; $('fx-mail-cur').textContent = '(' + d.email + ')'; $('fx-in-mail').value = $('fx-in-mailpw').value = ''; alert('Email enregistré !'); }
        else alert(d.message || 'Erreur');
      }).catch(function () { alert('Erreur de connexion.'); });
    };
  }
  function showMail() { var s = $('fx-mail-cur'), u = cu(); if (s) s.textContent = u && u.email ? '(' + u.email + ')' : '(aucun email)'; }

  /* ---------- Onglets « Mes alertes » et « En cours » ---------- */
  function panel() {
    var p = $('fx-prof-panel');
    if (!p) { var g = $('profile-grid'); p = document.createElement('div'); p.id = 'fx-prof-panel'; g.parentNode.insertBefore(p, g); }
    return p;
  }
  function addTabs() {
    var s = $('tab-suggest'); if (!s || $('tab-alerts')) return;
    var mk = function (id, ico, label) {
      var e = document.createElement('span'); e.id = id; e.className = 'prof-tab-btn';
      e.innerHTML = '<i class="fas ' + ico + '"></i> ' + label; e.onclick = function () { openTab(id === 'tab-alerts' ? 'alerts' : 'wip'); }; return e;
    };
    var a = mk('tab-alerts', 'fa-bell', 'Mes alertes <span id="tab-alerts-count" class="fx-pill"></span>'), w = mk('tab-wip', 'fa-hourglass-half', 'En cours');
    s.after(a, w);
  }
  function openTab(kind) {
    document.querySelectorAll('.prof-tab-btn').forEach(function (b) { b.classList.remove('active'); });
    $(kind === 'alerts' ? 'tab-alerts' : 'tab-wip').classList.add('active');
    document.querySelectorAll('.prof-stat-box').forEach(function (b) { b.classList.remove('active-stat-box'); });
    var g = $('profile-grid'), f = document.querySelector('.prof-filters-container'); if (g) g.style.display = 'none'; if (f) f.style.display = 'none';
    var p = panel(); p.style.display = 'block'; p.innerHTML = '<div class="fx-empty">Chargement…</div>';
    (kind === 'alerts' ? loadAlerts : loadWip)(p);
  }
  function loadAlerts(p) {
    api('/api/notifications').then(function (d) {
      var l = d.notifications || [];
      var html = '<div class="fx-head"><b><i class="fas fa-bell"></i> Mes alertes</b>' + (l.length ? '<button class="fx-btn" id="fx-readall">Tout marquer comme lu</button>' : '') + '</div>';
      html += l.length ? l.map(function (n) {
        return '<div class="fx-item' + (n.read ? '' : ' unread') + '"><i class="fas fa-bell"></i><div><div class="fx-t">' + esc(n.message) + '</div><div class="fx-s">' + fmt(n.date) + '</div></div></div>';
      }).join('') : '<div class="fx-empty">🔔<br>Aucune alerte pour le moment.</div>';
      p.innerHTML = html;
      var r = $('fx-readall'); if (r) r.onclick = function () {
        api('/api/notifications/mark-read', { method: 'POST' }).then(function () { var nb = $('notif-badge'); if (nb) nb.style.display = 'none'; $('tab-alerts-count').textContent = ''; loadAlerts(p); });
      };
    }).catch(function () { p.innerHTML = '<div class="fx-empty">Erreur de chargement.</div>'; });
  }
  function wishCard(w) {
    var st = w.status || 'En attente', k = st === 'Ajouté' ? 2 : (st === 'En cours' ? 1 : 0), me = cu() && w.requestedBy === cu().username;
    var steps = ['Envoyée', 'En cours', 'Ajoutée'].map(function (t, i) { return '<span class="fx-step' + (i <= k ? ' on' : '') + '">' + t + '</span>'; }).join('<i class="fx-bar' + '"></i>');
    var img = /^https?:\/\//i.test(w.posterUrl || '') ? '<img src="' + esc(w.posterUrl) + '" alt="" loading="lazy">' : '<div class="fx-nop"><i class="fas fa-film"></i></div>';
    return '<div class="fx-wish" data-id="' + esc(w._id) + '">' + img + '<div class="fx-wb"><div class="fx-t">' + esc(w.title) + '</div>' +
      '<div class="fx-s">' + (me ? 'Ma demande' : 'Je l\'ai votée') + ' · ' + esc(w.votes || 1) + ' vote' + ((w.votes || 1) > 1 ? 's' : '') + '</div><div class="fx-steps">' + steps + '</div></div></div>';
  }
  function loadWip(p) {
    api('/api/wishes/mine').then(function (d) {
      var l = d.wishes || [], wip = l.filter(function (w) { return w.status !== 'Ajouté'; }), done = l.filter(function (w) { return w.status === 'Ajouté'; });
      var html = '<div class="fx-head"><b><i class="fas fa-hourglass-half"></i> Mes demandes en cours <span class="fx-pill on">' + wip.length + '</span></b></div>';
      html += wip.length ? '<div class="fx-wgrid">' + wip.map(wishCard).join('') + '</div>' : '<div class="fx-empty">🎬<br>Aucune demande en cours.<br><small>Fais une demande depuis le Wishboard !</small></div>';
      if (done.length) html += '<details class="fx-done-box"><summary>Déjà ajoutées (' + done.length + ')</summary><div class="fx-wgrid">' + done.map(wishCard).join('') + '</div></details>';
      p.innerHTML = html;
      p.querySelectorAll('.fx-wish').forEach(function (el) {
        el.onclick = function () { try { if (typeof closeProfilePage === 'function') closeProfilePage(); if (typeof openWishDetails === 'function') openWishDetails(el.dataset.id); } catch (e) {} };
      });
    }).catch(function () { p.innerHTML = '<div class="fx-empty">Erreur de chargement.</div>'; });
  }
  function alertCount() {
    api('/api/notifications').then(function (d) { var c = $('tab-alerts-count'); if (c) c.textContent = d.unreadCount > 0 ? d.unreadCount : ''; }).catch(function () {});
  }

  /* ---------- Branchements sur les fonctions du site ---------- */
  var oSwitch = window.switchProfTab;
  if (typeof oSwitch === 'function') window.switchProfTab = function () {
    var p = $('fx-prof-panel'), g = $('profile-grid'), f = document.querySelector('.prof-filters-container');
    if (p) p.style.display = 'none'; if (g) g.style.display = ''; if (f) f.style.display = '';
    return oSwitch.apply(this, arguments);
  };
  var oOpen = window.openProfilePage;
  if (typeof oOpen === 'function') window.openProfilePage = function () {
    var r = oOpen.apply(this, arguments);
    try { addTabs(); patchSettings(); applyBanner(); showMail(); alertCount(); } catch (e) { console.warn('cine-profile', e); }
    return r;
  };

  /* Tableau de bord : membres du plus récent au plus ancien */
  var oUsers = window.renderAnalyticsUsersPage;
  if (typeof oUsers === 'function') window.renderAnalyticsUsersPage = function () {
    try { var by = function (a, b) { return ts(b) - ts(a); }; analyticsUsersAll = analyticsUsersAll.slice().sort(by); analyticsUsersFiltered = analyticsUsersFiltered.slice().sort(by); } catch (e) {}
    return oUsers.apply(this, arguments);
  };
  /* Tableau de bord : demandes à traiter d'abord (puis les « Ajouté »), les plus récentes en premier */
  var oWish = window.renderAnalyticsWishesPage;
  if (typeof oWish === 'function') window.renderAnalyticsWishesPage = function () {
    try {
      var d = function (w) { return w.status === 'Ajouté' ? 1 : 0; };
      analyticsWishesFiltered = analyticsWishesFiltered.slice().sort(function (a, b) { return d(a) - d(b) || ts(b) - ts(a); });
    } catch (e) {}
    var r = oWish.apply(this, arguments), c = $('analytics-wishes-list');
    if (c) c.querySelectorAll('.user-list-item').forEach(function (el) { el.classList.add(el.textContent.toUpperCase().indexOf('AJOUTÉ') > -1 ? 'fx-done' : 'fx-pending'); });
    return r;
  };

  try { addTabs(); patchSettings(); } catch (e) {}
})();
