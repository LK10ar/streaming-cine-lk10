/* Ciné LK10 — sélecteur d'avatars par thèmes (style Netflix)
   • Paramètres du profil : bouton « Parcourir tous les avatars »
   • Inscription : choix de l'avatar avant de créer le compte
   À ajouter dans index.html, sous cine-fx.js / cine-profile.js :
     <script src="avatars-data.js"></script>
     <script src="cine-avatars.js"></script> */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var DEF = 'https://i.imgur.com/6VBx3io.png';
  var pack = function () { return Array.isArray(window.AVATAR_PACK) ? window.AVATAR_PACK : []; };
  var total = function () { return pack().reduce(function (n, t) { return n + ((t && t.icons) || []).length; }, 0); };
  var safeUrl = function (u) { return /^https?:\/\/\S+$/i.test(u || ''); };

  function css() {
    if ($('av-css')) return;
    var s = document.createElement('style'); s.id = 'av-css';
    s.textContent =
      '#av-picker{position:fixed;inset:0;z-index:20000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.84);padding:16px}' +
      '#av-picker.on{display:flex}' +
      '.av-box{width:min(960px,100%);max-height:92vh;display:flex;flex-direction:column;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:22px;overflow:hidden;box-shadow:0 30px 80px #000}' +
      '.av-top{display:flex;align-items:center;gap:12px;padding:20px 26px;border-bottom:1px solid #1d1d1d;flex-wrap:wrap}' +
      '.av-top h3{flex:1;margin:0;color:#fff;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:-.5px;min-width:160px}' +
      '.av-search{background:#1b1b1b;border:1px solid #2c2c2c;border-radius:999px;color:#fff;padding:9px 16px;font-size:13px;width:220px;max-width:100%;outline:none}' +
      '.av-search:focus{border-color:var(--primary,#ffde00)}' +
      '.av-x{width:38px;height:38px;border-radius:12px;border:none;background:#1b1b1b;color:#fff;font-size:18px;cursor:pointer}' +
      '.av-x:hover{background:#2a2a2a}' +
      '.av-body{overflow-y:auto;overscroll-behavior:contain;padding:4px 26px 28px;flex:1}' +
      '.av-theme{margin-top:24px}' +
      '.av-th{position:relative;display:flex;align-items:flex-end;min-height:44px;border-radius:12px;overflow:hidden;margin-bottom:12px;background:#151515 center/cover no-repeat;border:1px solid #1f1f1f}' +
      '.av-th.has-b{min-height:92px}' +
      '.av-th.has-b::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.85),rgba(0,0,0,.25))}' +
      '.av-th span{position:relative;padding:10px 14px;color:#fff;font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;text-shadow:0 2px 8px #000}' +
      '.av-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:12px}' +
      '.av-grid button{aspect-ratio:1;border:2px solid transparent;border-radius:14px;padding:0;background:#1a1a1a;overflow:hidden;cursor:pointer;transition:transform .15s,border-color .15s}' +
      '.av-grid button:hover{transform:scale(1.08);border-color:var(--primary,#ffde00)}' +
      '.av-grid button.sel{border-color:var(--primary,#ffde00);box-shadow:0 0 0 2px rgba(255,222,0,.35)}' +
      '.av-grid img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.av-empty{color:#888;text-align:center;padding:44px 10px;font-size:14px;line-height:1.7}' +
      '#su-av{display:flex;align-items:center;gap:12px;width:100%;margin:2px 0 10px;text-align:left}' +
      '#su-av img{width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--primary,#ffde00);background:#222;flex-shrink:0}' +
      '#su-av button{flex:1;background:#2a2a2a;color:#fff;border:1px solid #3a3a3a;border-radius:10px;padding:11px 14px;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s}' +
      '#su-av button:hover{background:#383838}' +
      '@media(max-width:600px){.av-top{padding:14px 16px}.av-body{padding:2px 14px 22px}.av-search{width:100%;order:3}.av-grid{grid-template-columns:repeat(auto-fill,minmax(68px,1fr));gap:9px}}';
    document.head.appendChild(s);
  }

  var cb = null;
  function currentPic() { try { return window.__signupAvatar || (typeof currentUser !== 'undefined' && currentUser && currentUser.profilePic) || ''; } catch (e) { return ''; } }
  function build() {
    var o = document.createElement('div'); o.id = 'av-picker';
    o.innerHTML = '<div class="av-box"><div class="av-top"><h3>Choisir une icône</h3><input class="av-search" id="av-q" type="search" placeholder="Rechercher un thème…" autocomplete="off"><button type="button" class="av-x" id="av-close" aria-label="Fermer">✕</button></div><div class="av-body" id="av-body"></div></div>';
    document.body.appendChild(o);
    var body = $('av-body'), list = pack().filter(function (t) { return t && (t.icons || []).length; });
    if (!list.length) body.innerHTML = '<div class="av-empty">Aucun avatar n\'a encore été ajouté.<br>Remplis le fichier <b>avatars-data.js</b> pour les voir ici.</div>';
    list.forEach(function (t) {
      var sec = document.createElement('div'); sec.className = 'av-theme'; sec.dataset.name = String(t.name || '').toLowerCase();
      var th = document.createElement('div'); th.className = 'av-th';
      if (safeUrl(t.banner)) { th.classList.add('has-b'); th.style.backgroundImage = 'url("' + t.banner.replace(/"/g, '%22') + '")'; }
      th.innerHTML = '<span>' + esc(t.name || 'Divers') + '</span>'; sec.appendChild(th);
      var g = document.createElement('div'); g.className = 'av-grid';
      t.icons.filter(safeUrl).forEach(function (u) {
        var b = document.createElement('button'); b.type = 'button'; b.dataset.u = u;
        var im = new Image(); im.loading = 'lazy'; im.decoding = 'async'; im.alt = ''; im.src = u; im.onerror = function () { b.style.display = 'none'; };
        b.appendChild(im); g.appendChild(b);
      });
      sec.appendChild(g); body.appendChild(sec);
    });
    body.onclick = function (e) {
      var b = e.target.closest && e.target.closest('button[data-u]'); if (!b) return;
      var f = cb; close(); if (f) f(b.dataset.u);
    };
    $('av-q').oninput = function () {
      var q = this.value.trim().toLowerCase();
      body.querySelectorAll('.av-theme').forEach(function (s) { s.style.display = !q || s.dataset.name.indexOf(q) > -1 ? '' : 'none'; });
    };
    $('av-close').onclick = close;
    o.onclick = function (e) { if (e.target === o) close(); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && o.classList.contains('on')) close(); });
  }
  function close() { var o = $('av-picker'); if (o) o.classList.remove('on'); }
  function openPicker(onPick) {
    css(); if (!$('av-picker')) build(); cb = onPick;
    var cur = currentPic();
    $('av-picker').querySelectorAll('button[data-u]').forEach(function (b) { b.classList.toggle('sel', b.dataset.u === cur); });
    $('av-q').value = ''; $('av-q').oninput();
    $('av-picker').classList.add('on'); var bd = $('av-body'); if (bd) bd.scrollTop = 0;
  }
  window.openAvatarPicker = openPicker;

  /* ---------- Paramètres du profil ---------- */
  function setMyPic(url) {
    fetch(API_URL + '/api/user/update-pic', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: localStorage.getItem('monBadgeCineLK10') || '' }, body: JSON.stringify({ url: url }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.success) return alert(d.message || 'Erreur');
        try { currentUser.profilePic = url; } catch (e) {}
        ['nav-avatar', 'prof-page-avatar'].forEach(function (i) { if ($(i)) $(i).src = url; });
      }).catch(function () { alert('Erreur de connexion.'); });
  }
  function patchSettings() {
    var g = $('fx-avs'); if (!g || $('av-more')) return;
    css();
    var b = document.createElement('button'); b.type = 'button'; b.id = 'av-more'; b.className = 'action-btn'; b.style.margin = '8px 0 10px';
    b.innerHTML = '<i class="fas fa-images"></i> Parcourir tous les avatars' + (total() ? ' (' + total() + ')' : '');
    b.onclick = function () { openPicker(setMyPic); };
    g.parentNode.insertBefore(b, g);
  }

  /* ---------- Inscription ---------- */
  function signupBlock() {
    var reg = typeof isLoginMode !== 'undefined' && !isLoginMode, old = $('su-av');
    if (!reg) { if (old) old.remove(); window.__signupAvatar = ''; return; }
    var pw = $('password-input'); if (!pw || old) return;
    css();
    var d = document.createElement('div'); d.id = 'su-av';
    d.innerHTML = '<img id="su-av-img" alt="" src="' + DEF + '"><button type="button" id="su-av-btn"><i class="fas fa-images"></i> Choisir mon avatar</button>';
    pw.after(d);
    $('su-av-btn').onclick = function () {
      openPicker(function (u) { window.__signupAvatar = u; $('su-av-img').src = u; });
    };
  }
  var oT = window.toggleAuthMode;
  if (typeof oT === 'function') window.toggleAuthMode = function () {
    var r = oT.apply(this, arguments); try { signupBlock(); } catch (e) { console.warn('cine-avatars', e); } return r;
  };

  /* Les paramètres sont construits à l'ouverture du profil : on attend qu'ils existent */
  var busy = false;
  new MutationObserver(function () {
    if (busy) return; busy = true;
    setTimeout(function () { busy = false; try { patchSettings(); } catch (e) {} }, 150);
  }).observe(document.body, { childList: true, subtree: true });
  try { patchSettings(); } catch (e) {}
})();
