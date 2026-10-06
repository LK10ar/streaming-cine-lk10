/* Ciné LK10 — couche visuelle : barre de progression, apparition au scroll, tilt 3D du héros (desktop). */
(function(){
 try{
  var d=document,h=d.documentElement,w=window;
  var mm=function(q){return w.matchMedia&&w.matchMedia(q).matches};
  var c=navigator.connection||{};
  var lite=mm('(prefers-reduced-motion: reduce)')||c.saveData||(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2);
  if(lite)h.classList.add('fx-lite');

  var bar=d.createElement('div');bar.id='fx-progress';d.body.appendChild(bar);
  var tick=false;
  function upd(){tick=false;var m=Math.max(d.body.scrollHeight,h.scrollHeight)-w.innerHeight;bar.style.transform='scaleX('+(m>0?Math.min(1,w.scrollY/m):0)+')'}
  w.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});

  var io=(!lite&&'IntersectionObserver' in w)?new IntersectionObserver(function(es){
   es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
  },{threshold:.08,rootMargin:'0px 0px -5% 0px'}):null;
  function scan(){if(!io)return;d.querySelectorAll('#home-page .slider-section:not(.fx-reveal)').forEach(function(s){s.classList.add('fx-reveal');io.observe(s)})}
  scan();
  var hp=d.getElementById('home-page');
  if(hp&&'MutationObserver' in w)new MutationObserver(scan).observe(hp,{childList:true});
  // sécurité : si rien ne s'est révélé, on affiche tout
  setTimeout(function(){if(!d.querySelector('.fx-reveal.in'))d.querySelectorAll('.fx-reveal').forEach(function(s){s.classList.add('in')})},5000);

  if(!lite&&mm('(hover:hover) and (pointer:fine)')&&mm('(min-width:993px)')){
   var hero=d.getElementById('hero-carousel'),raf=0;
   if(hero){
    hero.addEventListener('mousemove',function(e){
     if(raf)return;raf=requestAnimationFrame(function(){raf=0;var r=hero.getBoundingClientRect();
      var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      hero.style.setProperty('--ry',(x*5).toFixed(2)+'deg');hero.style.setProperty('--rx',(-y*3).toFixed(2)+'deg')})
    });
    hero.addEventListener('mouseleave',function(){hero.style.setProperty('--ry','0deg');hero.style.setProperty('--rx','0deg')});
   }
  }
 }catch(e){console.warn('cine-fx',e)}
})();

/* ===== Fond de formes qui s'allument sous la souris + tilt 3D de l'affiche (desktop uniquement) ===== */
(function(){
 try{
  var d=document,w=window,mm=function(q){return w.matchMedia&&w.matchMedia(q).matches};
  var c=navigator.connection||{};
  var lite=mm('(prefers-reduced-motion: reduce)')||c.saveData||(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2);
  if(lite||!mm('(hover:hover) and (pointer:fine)')||!mm('(min-width:993px)'))return;

  /* tilt 3D de l'affiche dans la fenêtre film */
  d.addEventListener('mousemove',function(e){var p=e.target.closest&&e.target.closest('.d-poster-img');if(!p)return;
   var r=p.getBoundingClientRect();p.style.setProperty('--ry',(((e.clientX-r.left)/r.width-.5)*16).toFixed(1)+'deg');p.style.setProperty('--rx',(-((e.clientY-r.top)/r.height-.5)*12).toFixed(1)+'deg')},{passive:true});
  d.addEventListener('mouseout',function(e){var p=e.target.closest&&e.target.closest('.d-poster-img');
   if(p&&!p.contains(e.relatedTarget)){p.style.setProperty('--ry','0deg');p.style.setProperty('--rx','0deg')}},{passive:true});

  /* fond de formes : 'hex' (nid d'abeille) | 'diamond' (losanges) | 'dot' (points)
     Rien n'est dessiné au repos : seules les formes proches de la souris s'allument. */
  var SHAPE='hex',R=30,RAD=190,SQ=Math.sqrt(3);
  var lit=d.createElement('canvas');lit.className='fx-hexc';d.body.appendChild(lit);
  var lx=lit.getContext('2d'),W=0,H=0,dpr=1,cols=0,rows=0,cw=SQ*R,rh=1.5*R;
  var cells={},mx=-9999,my=-9999,run=false;

  function shape(x,y,s,ctx){
   ctx.beginPath();
   if(SHAPE==='dot'){ctx.arc(x,y,s*.5,0,6.2832);return}
   if(SHAPE==='diamond'){ctx.moveTo(x,y-s);ctx.lineTo(x+s*.75,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*.75,y);ctx.closePath();return}
   for(var i=0;i<6;i++){var a=Math.PI/180*(60*i-30),px=x+s*Math.cos(a),py=y+s*Math.sin(a);i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();
  }
  function pos(cc,rr){return[cc*cw+(rr%2?cw/2:0),rr*rh]}
  function size(){
   dpr=Math.min(2,w.devicePixelRatio||1);W=w.innerWidth;H=w.innerHeight;
   lit.width=W*dpr;lit.height=H*dpr;lx.setTransform(dpr,0,0,dpr,0,0);
   cols=Math.ceil(W/cw)+2;rows=Math.ceil(H/rh)+2;
  }
  function frame(){
   lx.clearRect(0,0,W,H);
   if(mx>-999){var g=lx.createRadialGradient(mx,my,0,mx,my,280);g.addColorStop(0,'rgba(255,222,0,.06)');g.addColorStop(1,'rgba(255,222,0,0)');lx.fillStyle=g;lx.fillRect(mx-280,my-280,560,560)}
   var n=0;
   for(var k in cells){var s=cells[k];
    lx.fillStyle='rgba(255,222,0,'+(s.a*.14).toFixed(3)+')';lx.strokeStyle='rgba(255,222,0,'+(s.a*.85).toFixed(3)+')';lx.lineWidth=1.2;
    shape(s.x,s.y,R*.9,lx);lx.fill();lx.stroke();
    s.a*=.93;if(s.a<.02)delete cells[k];else n++}
   if(n||mx>-999)requestAnimationFrame(frame);else{lx.clearRect(0,0,W,H);run=false}
  }
  function kick(){if(!run){run=true;requestAnimationFrame(frame)}}
  w.addEventListener('mousemove',function(e){
   mx=e.clientX;my=e.clientY;
   var r0=Math.max(0,Math.floor((my-RAD)/rh)),r1=Math.min(rows-1,Math.ceil((my+RAD)/rh));
   for(var r=r0;r<=r1;r++){var c0=Math.max(0,Math.floor((mx-RAD)/cw)-1),c1=Math.min(cols-1,Math.ceil((mx+RAD)/cw)+1);
    for(var cc=c0;cc<=c1;cc++){var p=pos(cc,r),dist=Math.hypot(p[0]-mx,p[1]-my);
     if(dist<RAD){var t=1-dist/RAD,a=t*t*(3-2*t),key=r*cols+cc,s=cells[key];
      if(!s)cells[key]={x:p[0],y:p[1],a:a};else if(a>s.a)s.a=a}}}
   kick()},{passive:true});
  d.addEventListener('mouseleave',function(){mx=my=-9999},{passive:true});
  var t=0;w.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(size,200)});
  size();
 }catch(e){console.warn('cine-fx hex',e)}
})();


/* ===== Page profil enrichie (email, photo/GIF, bannière, Mes alertes, En cours) + tris du Tableau de bord ===== */
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

  /* ---------- Paramètres : photo/GIF (lien ou fichier), bannière (lien ou fichier), email ---------- */
  function readFile(f) { return new Promise(function (ok, ko) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = ko; r.readAsDataURL(f); }); }
  function shrink(data, w, h) {
    return new Promise(function (ok, ko) {
      var im = new Image();
      im.onload = function () { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'), s = Math.max(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s; x.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh); ok(c.toDataURL('image/jpeg', .82)); };
      im.onerror = ko; im.src = data;
    });
  }
  function fromFile(file, kind) {
    if (!file || !/^image\//.test(file.type)) return Promise.reject(new Error("Ce fichier n'est pas une image."));
    var max = kind === 'pic' ? 150 * 1024 : 400 * 1024;
    return readFile(file).then(function (d) {
      if (file.type === 'image/gif') { if (file.size > max) throw new Error('GIF trop lourd (max ' + Math.round(max / 1024) + ' Ko). Utilise plutôt un lien (Giphy, Imgur, Tenor…).'); return d; }
      return kind === 'pic' ? shrink(d, 256, 256) : shrink(d, 1400, 383);
    });
  }
  function send(kind, url) {
    return api(kind === 'pic' ? '/api/user/update-pic' : '/api/user/update-banner', { method: 'POST', body: JSON.stringify({ url: url }) }).then(function (d) {
      if (!d.success) throw new Error(d.message || 'Erreur');
      var u = cu();
      if (kind === 'pic') { if (u) u.profilePic = url; ['nav-avatar', 'prof-page-avatar'].forEach(function (i) { if ($(i)) $(i).src = url; }); }
      else { if (u) u.banner = url; applyBanner(); }
    });
  }
  function patchSettings() {
    var m = document.querySelector('#settings-overlay .settings-modal'), pic = $('input-new-pic');
    if (!m || !pic || $('fx-set-extra')) return;
    var lab = m.querySelector('label'); if (lab) lab.textContent = 'Photo de profil : lien (GIF accepté) ou fichier';
    var picBtn = pic.parentNode.querySelector('.action-btn');
    pic.insertAdjacentHTML('afterend', '<img id="fx-pic-prev" class="fx-prev" alt="">');
    pic.addEventListener('input', function () { var p = $('fx-pic-prev'), v = pic.value.trim(); if (/^https?:\/\//i.test(v)) { p.src = v; p.style.display = 'block'; } else p.style.display = 'none'; });
    if (picBtn) picBtn.insertAdjacentHTML('afterend', '<label class="fx-file"><i class="fas fa-folder-open"></i> Choisir une photo ou un GIF depuis mon appareil<input type="file" id="fx-pic-file" accept="image/*" hidden></label>');
    var box = document.createElement('div'); box.id = 'fx-set-extra';
    box.innerHTML = '<div class="fx-set"><label>Bannière du profil : lien (image ou GIF) ou fichier — idéal 1546×423</label>' +
      '<input type="text" id="fx-in-banner" placeholder="https://lien-de-ma-banniere.jpg"><div class="fx-row">' +
      '<button class="action-btn" id="fx-b-save">Enregistrer la bannière</button><button class="fx-btn" id="fx-b-del">Retirer</button></div>' +
      '<label class="fx-file"><i class="fas fa-folder-open"></i> Choisir une bannière depuis mon appareil<input type="file" id="fx-ban-file" accept="image/*" hidden></label></div>' +
      '<div class="fx-set"><label>Adresse email <span id="fx-mail-cur"></span></label>' +
      '<input type="email" id="fx-in-mail" placeholder="nouvel@email.com"><input type="password" id="fx-in-mailpw" placeholder="Ton mot de passe actuel (confirmation)">' +
      '<button class="action-btn" id="fx-m-save">Enregistrer l\'email</button></div>';
    pic.parentNode.after(box);
    var done = function (msg) { return function () { alert(msg); }; }, fail = function (e) { alert((e && e.message) || 'Erreur de connexion.'); };
    $('fx-pic-file').onchange = function () { var f = this.files[0]; this.value = ''; if (f) fromFile(f, 'pic').then(function (d) { return send('pic', d); }).then(done('Photo mise à jour !')).catch(fail); };
    $('fx-ban-file').onchange = function () { var f = this.files[0]; this.value = ''; if (f) fromFile(f, 'banner').then(function (d) { return send('banner', d); }).then(done('Bannière mise à jour !')).catch(fail); };
    $('fx-b-save').onclick = function () { var u = $('fx-in-banner').value.trim(); if (!u) return alert("Entre un lien d'image ou de GIF, ou choisis un fichier."); send('banner', u).then(function () { $('fx-in-banner').value = ''; alert('Bannière mise à jour !'); }).catch(fail); };
    $('fx-b-del').onclick = function () { send('banner', '').then(done('Bannière retirée.')).catch(fail); };
    $('fx-m-save').onclick = function () {
      var e = $('fx-in-mail').value.trim(), p = $('fx-in-mailpw').value;
      if (!e || !p) return alert('Entre ton nouvel email et ton mot de passe.');
      api('/api/user/update-email', { method: 'POST', body: JSON.stringify({ email: e, password: p }) }).then(function (d) {
        if (!d.success) throw new Error(d.message || 'Erreur');
        if (cu()) cu().email = d.email; $('fx-mail-cur').textContent = '(' + d.email + ')'; $('fx-in-mail').value = $('fx-in-mailpw').value = ''; alert('Email enregistré !');
      }).catch(fail);
    };
  }
  /* bouton visible sur l'en-tête du profil */
  function addBannerBtn() {
    var h = document.querySelector('.prof-header'); if (!h || $('fx-banner-btn')) return;
    var b = document.createElement('button'); b.id = 'fx-banner-btn'; b.type = 'button'; b.innerHTML = '<i class="fas fa-camera"></i> <span>Modifier la bannière</span>';
    b.onclick = function () { var s = $('settings-overlay'); if (s) s.style.display = 'flex'; patchSettings(); setTimeout(function () { var i = $('fx-in-banner'); if (i) { i.scrollIntoView({ block: 'center' }); i.focus(); } }, 50); };
    h.appendChild(b);
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
    try { addTabs(); patchSettings(); addBannerBtn(); applyBanner(); showMail(); alertCount(); } catch (e) { console.warn('cine-profile', e); }
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

  try { addTabs(); patchSettings(); addBannerBtn(); } catch (e) {}
})();

/* ===== Profil social : listes, profils publics, abonnements, réglages, calendrier, rappel, fenêtre flottante ===== */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var cu = function () { try { return currentUser; } catch (e) { return null; } };
  var DB = function () { try { return moviesDB || []; } catch (e) { return []; } };
  var movie = function (id) { var d = DB(); for (var i = 0; i < d.length; i++) if (d[i].id === id) return d[i]; return null; };
  var idOf = function (x) { return typeof x === 'string' ? x : (x && x.id); };
  var tok = function () { return localStorage.getItem('monBadgeCineLK10') || ''; };
  var DISCORD = 'https://lk10ar.github.io/invite-discord-lk10/';
  var shareUrl = function (q) { return location.origin + location.pathname + '?' + q; };
  function api(p, o) {
    o = o || {}; o.headers = { 'Content-Type': 'application/json', authorization: tok() };
    return fetch(API_URL + p, o).then(function (r) { return r.json().catch(function () { return { success: false }; }); });
  }
  function toast(msg, action, label) {
    var t = $('fx-toast'); if (!t) { t = document.createElement('div'); t.id = 'fx-toast'; document.body.appendChild(t); }
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? '<button id="fx-toast-go">' + esc(label || 'OK') + '</button>' : '');
    t.classList.add('on'); if (action) $('fx-toast-go').onclick = function () { t.classList.remove('on'); action(); };
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('on'); }, action ? 9000 : 2600);
  }
  function copy(text) { (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast('Lien copié !'); }, function () { prompt('Copie ce lien :', text); }); }
  function whenUser(cb) { var n = 0, iv = setInterval(function () { if (cu()) { clearInterval(iv); cb(); } else if (++n > 120) clearInterval(iv); }, 500); }
  function whenDB(cb) { var n = 0, iv = setInterval(function () { if (DB().length) { clearInterval(iv); cb(); } else if (++n > 120) { clearInterval(iv); cb(); } }, 400); }
  var sinceOf = function (id) { return (parseInt(String(id || '').slice(0, 8), 16) || 0) * 1000; };

  /* ---------- Couleur d'accent ---------- */
  function applyAccent(c) { var r = document.documentElement.style; if (/^#[0-9a-f]{6}$/i.test(c || '')) r.setProperty('--primary', c); else r.removeProperty('--primary'); }

  /* ---------- Badges, stats, reprise ---------- */
  function totalViews(u) {
    var vm = u.viewsMap || {}, n = 0, k; for (k in vm) n += (vm[k] && vm[k].n) || 0;
    if (n) return n; return (u.history || []).reduce(function (a, h) { return a + ((h && h.views) || 1); }, 0);
  }
  function badgesFor(u, nWish) {
    var b = [], m = Math.floor((Date.now() - sinceOf(u._id)) / 2629800000), v = totalViews(u), f = (u.favorites || []).length;
    if (u.username === 'Admin') b.push(['fa-shield-alt', 'Admin']);
    if (u.isVip) b.push(['fa-gem', 'VIP']);
    if (m >= 12) b.push(['fa-medal', 'Membre depuis ' + (m >= 24 ? Math.floor(m / 12) + ' ans' : '1 an')]);
    else if (m >= 1) b.push(['fa-calendar-check', 'Membre depuis ' + m + ' mois']); else b.push(['fa-seedling', 'Nouveau membre']);
    if (v >= 200) b.push(['fa-film', 'Grand cinéphile']); else if (v >= 50) b.push(['fa-film', 'Cinéphile']); else if (v >= 10) b.push(['fa-eye', 'Spectateur']);
    if (f >= 10) b.push(['fa-heart', 'Collectionneur']);
    if (nWish >= 1) b.push(['fa-star', 'Wishboard']);
    return b;
  }
  var badgeHtml = function (b) { return b.map(function (x) { return '<span class="fx-badge"><i class="fas ' + x[0] + '"></i> ' + esc(x[1]) + '</span>'; }).join(''); };
  function statsFor(u) {
    var vm = u.viewsMap || {}, best = null, g = {}, k, top = '—';
    for (k in vm) { var n = (vm[k] && vm[k].n) || 0; if (!best || n > best.n) best = { n: n, t: vm[k].t || (movie(k) || {}).title || '' }; var mv = movie(k); if (mv) String(mv.genre || '').split(',').forEach(function (x) { x = x.trim(); if (x && x.toLowerCase() !== 'anime') g[x] = (g[x] || 0) + n; }); }
    (u.favorites || []).forEach(function (f) { var mv = movie(idOf(f)); if (mv) String(mv.genre || '').split(',').forEach(function (x) { x = x.trim(); if (x) g[x] = (g[x] || 0) + 1; }); });
    var arr = Object.keys(g).sort(function (a, b) { return g[b] - g[a]; }); if (arr.length) top = arr[0];
    if (!best) (u.history || []).forEach(function (h) { if (h && h.views > 1 && (!best || h.views > best.n)) best = { n: h.views, t: h.title }; });
    var h = Math.round((u.watchMinutes || 0) / 6) / 10;
    return [['fa-clock', h ? '≈ ' + h + ' h' : '—', 'Temps regardé (estimation)'], ['fa-play-circle', totalViews(u) || '—', 'Visionnages'], ['fa-theater-masks', top, 'Genre préféré'], ['fa-redo', best && best.n > 1 ? best.t + ' (×' + best.n + ')' : '—', 'Le plus revu']];
  }
  function renderExtra() {
    var u = cu(), h = document.querySelector('.prof-header'); if (!u || !h) return;
    var nm = $('prof-page-name');
    if (nm && !nm.parentNode.classList.contains('fx-nameblock')) { var w = document.createElement('div'); w.className = 'fx-nameblock'; nm.parentNode.insertBefore(w, nm); w.appendChild(nm); w.insertAdjacentHTML('beforeend', '<div id="fx-badges"></div>'); }
    var bb = $('fx-badges'); if (bb) { bb.innerHTML = badgeHtml(badgesFor(u, 0)); api('/api/wishes/mine').then(function (d) { var n = (d.wishes || []).filter(function (x) { return x.requestedBy === u.username; }).length; if (bb) bb.innerHTML = badgeHtml(badgesFor(u, n)); }).catch(function () {}); }
    var s = document.querySelector('.prof-btn-settings'), box = s && s.parentNode;
    if (box && !$('fx-share-prof')) {
      box.insertAdjacentHTML('afterbegin', '<button id="fx-share-prof" class="prof-btn-settings" type="button"><i class="fas fa-share-alt"></i> Partager</button><a id="fx-contact" class="prof-btn-settings" href="' + DISCORD + '" target="_blank" rel="noopener"><i class="fas fa-headset"></i> Contact équipe</a>');
      $('fx-share-prof').onclick = function () { if (!cu().isPublic) toast('Ton profil est privé : active « Profil public » dans les Paramètres pour que le lien fonctionne.'); copy(shareUrl('u=' + encodeURIComponent(cu().username))); };
    }
    var ex = $('fx-extra'); if (!ex) { ex = document.createElement('div'); ex.id = 'fx-extra'; h.after(ex); }
    var rs = '';
    ex.innerHTML = rs + '<div class="fx-stats">' + statsFor(u).map(function (x) { return '<div class="fx-stat"><i class="fas ' + x[0] + '"></i><b>' + esc(x[1]) + '</b><span>' + x[2] + '</span></div>'; }).join('') + '</div>';
  }

  /* ---------- Onglets : Mes listes, Abonnements ---------- */
  function panel() { var p = $('fx-prof-panel'); if (!p) { var g = $('profile-grid'); p = document.createElement('div'); p.id = 'fx-prof-panel'; g.parentNode.insertBefore(p, g); } return p; }
  function addTabs() {
    var a = $('tab-wip') || $('tab-suggest'); if (!a || $('tab-lists')) return;
    var mk = function (id, ico, label, fn) { var e = document.createElement('span'); e.id = id; e.className = 'prof-tab-btn'; e.innerHTML = '<i class="fas ' + ico + '"></i> ' + label; e.onclick = fn; return e; };
    a.after(mk('tab-lists', 'fa-list', 'Mes listes', function () { openPanel('tab-lists', loadLists); }), mk('tab-follow', 'fa-user-friends', 'Abonnements', function () { openPanel('tab-follow', loadFollow); }));
  }
  function openPanel(tab, fn) {
    document.querySelectorAll('.prof-tab-btn').forEach(function (b) { b.classList.remove('active'); }); $(tab).classList.add('active');
    document.querySelectorAll('.prof-stat-box').forEach(function (b) { b.classList.remove('active-stat-box'); });
    var g = $('profile-grid'), f = document.querySelector('.prof-filters-container'); if (g) g.style.display = 'none'; if (f) f.style.display = 'none';
    var p = panel(); p.style.display = 'block'; p.innerHTML = '<div class="fx-empty">Chargement…</div>'; fn(p);
  }
  var poster = function (id) { var m = movie(id); return m ? m.poster : ''; };
  function grid(ids, removable, onRemove) {
    var items = ids.map(function (id) { return movie(id); }).filter(Boolean);
    if (!items.length) return '<div class="fx-empty">🎬<br>Rien ici pour le moment.</div>';
    return '<div class="fx-pgrid">' + items.map(function (m) { return '<div class="fx-pc" data-id="' + esc(m.id) + '"><div class="fx-pp" style="background-image:url(\'' + esc(m.poster) + '\')">' + (removable ? '<button class="fx-x" data-rm="' + esc(m.id) + '" title="Retirer">✕</button>' : '') + '</div><div class="fx-pt">' + esc(m.title) + '</div></div>'; }).join('') + '</div>';
  }
  function bindGrid(root, onOpen, onRm) {
    root.querySelectorAll('.fx-pc').forEach(function (c) { c.onclick = function (e) { if (e.target.closest('.fx-x')) return; onOpen(c.dataset.id); }; });
    root.querySelectorAll('.fx-x').forEach(function (b) { b.onclick = function () { onRm(b.dataset.rm); }; });
  }
  function loadLists(p) {
    api('/api/lists/mine').then(function (d) {
      var l = d.lists || [];
      p.innerHTML = '<div class="fx-head"><b><i class="fas fa-list"></i> Mes listes <span class="fx-pill on">' + l.length + '</span></b></div>' +
        '<div class="fx-newlist"><input id="fx-nl" maxlength="40" placeholder="Nouvelle liste (ex : Soirée horreur)"><button class="fx-btn fx-go" id="fx-nlb">Créer</button></div>' +
        (l.length ? '<div class="fx-wgrid">' + l.map(function (x) {
          return '<div class="fx-list" data-id="' + x._id + '"><div class="fx-minis">' + x.items.slice(0, 4).map(function (i) { return '<i style="background-image:url(\'' + esc(poster(i)) + '\')"></i>'; }).join('') + '</div><div class="fx-lb"><div class="fx-t">' + esc(x.name) + '</div><div class="fx-s">' + x.items.length + ' titre' + (x.items.length > 1 ? 's' : '') + ' · ' + (x.isPublic ? 'Publique' : 'Privée') + '</div>' +
            '<div class="fx-acts"><button class="fx-btn" data-a="open">Ouvrir</button><button class="fx-btn" data-a="share"><i class="fas fa-link"></i></button><button class="fx-btn" data-a="pub">' + (x.isPublic ? 'Rendre privée' : 'Rendre publique') + '</button><button class="fx-btn fx-del" data-a="del"><i class="fas fa-trash"></i></button></div></div></div>';
        }).join('') + '</div>' : '<div class="fx-empty">📚<br>Aucune liste.<br><small>Crée-en une, puis ajoute des films depuis leur fiche (bouton « Ajouter à une liste »).</small></div>');
      $('fx-nlb').onclick = function () { var n = $('fx-nl').value.trim(); api('/api/lists', { method: 'POST', body: JSON.stringify({ name: n }) }).then(function (r) { if (!r.success) return toast(r.message || 'Erreur'); loadLists(p); }); };
      p.querySelectorAll('.fx-list').forEach(function (el) {
        var x = l.filter(function (y) { return y._id === el.dataset.id; })[0];
        el.querySelectorAll('[data-a]').forEach(function (b) {
          b.onclick = function () {
            var a = b.dataset.a;
            if (a === 'open') return openList(p, x);
            if (a === 'share') { var go = function () { copy(shareUrl('list=' + x._id)); }; if (x.isPublic) return go(); if (!confirm('Cette liste est privée : la rendre publique pour que le lien fonctionne ?')) return; return api('/api/lists/' + x._id + '/update', { method: 'POST', body: JSON.stringify({ isPublic: true }) }).then(function () { go(); loadLists(p); }); }
            if (a === 'pub') return api('/api/lists/' + x._id + '/update', { method: 'POST', body: JSON.stringify({ isPublic: !x.isPublic }) }).then(function () { loadLists(p); });
            if (a === 'del' && confirm('Supprimer la liste « ' + x.name + ' » ?')) api('/api/lists/' + x._id, { method: 'DELETE' }).then(function () { loadLists(p); });
          };
        });
      });
    }).catch(function () { p.innerHTML = '<div class="fx-empty">Erreur de chargement.</div>'; });
  }
  function openList(p, x) {
    p.innerHTML = '<div class="fx-head"><button class="fx-btn" id="fx-back"><i class="fas fa-arrow-left"></i> Mes listes</button><b>' + esc(x.name) + '</b></div>' + grid(x.items, true);
    $('fx-back').onclick = function () { loadLists(p); };
    bindGrid(p, function (id) { try { if (typeof closeProfilePage === 'function') closeProfilePage(); openP(id); } catch (e) {} }, function (id) {
      api('/api/lists/' + x._id + '/toggle-item', { method: 'POST', body: JSON.stringify({ movieId: id }) }).then(function (r) { if (r.success) { x.items = r.items; openList(p, x); } });
    });
  }
  function loadFollow(p) {
    api('/api/user/following').then(function (d) {
      var l = d.following || [];
      p.innerHTML = '<div class="fx-head"><b><i class="fas fa-user-friends"></i> Abonnements <span class="fx-pill on">' + l.length + '</span></b><span class="fx-s">' + (d.followers || 0) + ' abonné' + ((d.followers || 0) > 1 ? 's' : '') + '</span></div>' +
        '<div class="fx-newlist"><input id="fx-fn" maxlength="24" placeholder="Voir le profil d\'un membre (pseudo)"><button class="fx-btn fx-go" id="fx-fnb">Voir</button></div>' +
        (l.length ? '<div class="fx-wgrid">' + l.map(function (u) { return '<div class="fx-wish fx-usr" data-n="' + esc(u.username) + '"><img src="' + esc(u.profilePic) + '" alt=""><div class="fx-wb"><div class="fx-t">' + esc(u.username) + '</div><div class="fx-s">Voir le profil</div></div></div>'; }).join('') + '</div>' : '<div class="fx-empty">👥<br>Tu ne suis personne pour le moment.</div>');
      $('fx-fnb').onclick = function () { var n = $('fx-fn').value.trim(); if (n) showProfile(n); };
      p.querySelectorAll('.fx-usr').forEach(function (el) { el.onclick = function () { showProfile(el.dataset.n); }; });
    }).catch(function () { p.innerHTML = '<div class="fx-empty">Erreur de chargement.</div>'; });
  }

  /* ---------- Vue publique (profil / liste partagée) ---------- */
  function pub() {
    var o = $('fx-pub'); if (!o) { o = document.createElement('div'); o.id = 'fx-pub'; o.innerHTML = '<div class="fx-pubin"><button class="fx-pubx" id="fx-pubx">✕</button><div id="fx-pubc"></div></div>'; document.body.appendChild(o); $('fx-pubx').onclick = closePub; o.onclick = function (e) { if (e.target === o) closePub(); }; }
    o.classList.add('on'); document.body.classList.add('no-scroll'); return $('fx-pubc');
  }
  function closePub() { var o = $('fx-pub'); if (o) o.classList.remove('on'); if (!document.querySelector('#player-overlay[style*="block"]')) document.body.classList.remove('no-scroll'); }
  function openMovie(id) { closePub(); try { if (typeof closeProfilePage === 'function' && $('profile-page') && $('profile-page').style.display === 'block') closeProfilePage(); openP(id); } catch (e) {} }
  function showProfile(name) {
    var c = pub(); c.innerHTML = '<div class="fx-empty">Chargement…</div>';
    api('/api/users/' + encodeURIComponent(name) + '/public').then(function (d) {
      if (!d.success) { c.innerHTML = '<div class="fx-empty">🔒<br>' + esc(d.message || 'Profil introuvable.') + '</div>'; return; }
      var p = d.profile, acc = /^#[0-9a-f]{6}$/i.test(p.accent) ? p.accent : '#ffde00', bn = /^(https?:|data:image)/i.test(p.banner || '') ? 'url(\'' + String(p.banner).replace(/'/g, '%27') + '\')' : '';
      var bg = badgesFor({ _id: p._id, username: p.username, isVip: p.isVip, viewsMap: {}, history: [], favorites: [] }, 0).filter(function (x) { return x[1] !== 'Nouveau membre' || true; });
      c.style.setProperty('--acc', acc);
      c.innerHTML = '<div class="fx-pban" style="' + (bn ? 'background-image:' + bn : '') + '"></div><div class="fx-phead"><img src="' + esc(p.profilePic) + '" alt=""><div class="fx-nameblock"><h2>' + esc(p.username) + '</h2><div id="fx-badges">' + badgeHtml(bg) + '</div><div class="fx-s"><b id="fx-nfol">' + p.followers + '</b> abonné' + (p.followers > 1 ? 's' : '') + ' · ' + p.following + ' abonnement' + (p.following > 1 ? 's' : '') + '</div></div><div class="fx-pact"><button class="fx-btn" id="fx-pcopy"><i class="fas fa-share-alt"></i> Partager</button>' + (cu() && !p.isMe ? '<button class="fx-btn fx-go" id="fx-pfol">' + (p.isFollowing ? 'Ne plus suivre' : 'Suivre') + '</button>' : '') + '</div></div>' +
        (p.top ? '<div class="fx-sech"><b><i class="fas fa-trophy"></i> Mon Top</b></div>' + grid(p.top) : '') + (p.favorites ? '<div class="fx-sech"><b><i class="fas fa-heart"></i> Favoris</b></div>' + grid(p.favorites) : '') +
        (p.lists.length ? '<div class="fx-sech"><b><i class="fas fa-list"></i> Listes</b></div><div class="fx-wgrid">' + p.lists.map(function (l) { return '<div class="fx-list fx-pl" data-id="' + l._id + '"><div class="fx-minis">' + l.items.slice(0, 4).map(function (i) { return '<i style="background-image:url(\'' + esc(poster(i)) + '\')"></i>'; }).join('') + '</div><div class="fx-lb"><div class="fx-t">' + esc(l.name) + '</div><div class="fx-s">' + l.items.length + ' titre' + (l.items.length > 1 ? 's' : '') + '</div></div></div>'; }).join('') + '</div>' : '');
      bindGrid(c, openMovie, function () {});
      $('fx-pcopy').onclick = function () { copy(shareUrl('u=' + encodeURIComponent(p.username))); };
      var f = $('fx-pfol'); if (f) f.onclick = function () { api('/api/follow/' + encodeURIComponent(p.username), { method: 'POST' }).then(function (r) { if (!r.success) return toast(r.message || 'Erreur'); f.textContent = r.following ? 'Ne plus suivre' : 'Suivre'; var n = $('fx-nfol'); n.textContent = Math.max(0, +n.textContent + (r.following ? 1 : -1)); }); };
      c.querySelectorAll('.fx-pl').forEach(function (el) { el.onclick = function () { showList(el.dataset.id); }; });
    }).catch(function () { c.innerHTML = '<div class="fx-empty">Erreur de chargement.</div>'; });
  }
  function showList(id) {
    var c = pub(); c.style.setProperty('--acc', '#ffde00'); c.innerHTML = '<div class="fx-empty">Chargement…</div>';
    api('/api/lists/public/' + encodeURIComponent(id)).then(function (d) {
      if (!d.success) { c.innerHTML = '<div class="fx-empty">🔒<br>' + esc(d.message || 'Liste introuvable.') + '</div>'; return; }
      var l = d.list;
      c.innerHTML = '<div class="fx-phead"><div class="fx-nameblock"><h2><i class="fas fa-list"></i> ' + esc(l.name) + '</h2><div class="fx-s">Par <a href="#" id="fx-lown">' + esc(l.ownerName) + '</a> · ' + l.items.length + ' titre' + (l.items.length > 1 ? 's' : '') + '</div></div><div class="fx-pact"><button class="fx-btn" id="fx-lcopy"><i class="fas fa-share-alt"></i> Partager</button></div></div>' + grid(l.items);
      bindGrid(c, openMovie, function () {});
      $('fx-lcopy').onclick = function () { copy(shareUrl('list=' + l._id)); };
      $('fx-lown').onclick = function (e) { e.preventDefault(); showProfile(l.ownerName); };
    }).catch(function () { c.innerHTML = '<div class="fx-empty">Erreur de chargement.</div>'; });
  }
  function fromUrl() {
    var q = new URLSearchParams(location.search), u = q.get('u'), l = q.get('list');
    if (u || l) whenDB(function () { if (l) showList(l); else showProfile(u); });
  }

  /* ---------- Ajouter à une liste (depuis la fiche d'un film) ---------- */
  function addListBtn() {
    var d = document.querySelector('#player-overlay .d-left'); if (!d || $('fx-addlist')) return;
    var b = document.createElement('button'); b.id = 'fx-addlist'; b.type = 'button'; b.className = 'fx-btn fx-wide'; b.innerHTML = '<i class="fas fa-list"></i> Ajouter à une liste';
    b.onclick = function () {
      if (!cu()) return toast('Connecte-toi pour utiliser les listes.');
      var m; try { m = currentMovie; } catch (e) { return; } if (!m) return;
      var o = $('fx-addl'); if (!o) { o = document.createElement('div'); o.id = 'fx-addl'; document.body.appendChild(o); }
      o.className = 'on'; o.innerHTML = '<div class="fx-addin"><div class="fx-head"><b>Ajouter « ' + esc(m.title) + ' »</b><button class="fx-btn" id="fx-addx">✕</button></div><div id="fx-addb">Chargement…</div></div>';
      $('fx-addx').onclick = function () { o.className = ''; }; o.onclick = function (e) { if (e.target === o) o.className = ''; };
      var render = function () {
        api('/api/lists/mine').then(function (r) {
          var l = r.lists || [];
          $('fx-addb').innerHTML = (l.length ? l.map(function (x) { var on = x.items.indexOf(m.id) > -1; return '<label class="fx-chk"><input type="checkbox" data-id="' + x._id + '"' + (on ? ' checked' : '') + '> ' + esc(x.name) + ' <span class="fx-s">(' + x.items.length + ')</span></label>'; }).join('') : '<div class="fx-s">Aucune liste pour le moment.</div>') +
            '<div class="fx-newlist"><input id="fx-anl" maxlength="40" placeholder="Nouvelle liste…"><button class="fx-btn fx-go" id="fx-anlb">Créer + ajouter</button></div>';
          $('fx-addb').querySelectorAll('input[type=checkbox]').forEach(function (c) { c.onchange = function () { api('/api/lists/' + c.dataset.id + '/toggle-item', { method: 'POST', body: JSON.stringify({ movieId: m.id }) }).then(function (r2) { toast(r2.success ? (c.checked ? 'Ajouté à la liste' : 'Retiré de la liste') : (r2.message || 'Erreur')); }); }; });
          $('fx-anlb').onclick = function () { api('/api/lists', { method: 'POST', body: JSON.stringify({ name: $('fx-anl').value.trim() }) }).then(function (r2) { if (!r2.success) return toast(r2.message || 'Erreur'); api('/api/lists/' + r2.list._id + '/toggle-item', { method: 'POST', body: JSON.stringify({ movieId: m.id }) }).then(render); }); };
        });
      }; render();
    };
    d.appendChild(b);
  }

  /* ---------- Réglages : pseudo, avatars, couleur, confidentialité, notifications, suppression ---------- */
  var AV = [['🎬', '#ffde00', '#ff8a00'], ['🍿', '#ff6b6b', '#c0392b'], ['🎭', '#a29bfe', '#6c5ce7'], ['👻', '#74b9ff', '#0984e3'], ['🤖', '#55efc4', '#00b894'], ['👽', '#81ecec', '#00cec9'], ['🦸', '#fd79a8', '#e84393'], ['🧛', '#636e72', '#2d3436'], ['🐉', '#fab1a0', '#d63031'], ['🦊', '#ffeaa7', '#e17055'], ['🐼', '#dfe6e9', '#636e72'], ['🚀', '#a29bfe', '#0984e3']];
  function avatar(i, size) {
    var c = document.createElement('canvas'); c.width = c.height = size; var x = c.getContext('2d'); if (!x) return '';
    var g = x.createLinearGradient(0, 0, size, size); g.addColorStop(0, AV[i][1]); g.addColorStop(1, AV[i][2]); x.fillStyle = g; x.fillRect(0, 0, size, size);
    x.font = Math.round(size * .58) + 'px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(AV[i][0], size / 2, size * .54); return c.toDataURL('image/png');
  }
  var COLORS = ['#ffde00', '#ff6b6b', '#4da3ff', '#2ecc71', '#b57bff', '#ff7ab8', '#ff9f43', '#1dd1c1'];
  var NOTIFS = [['wish', 'Alerte quand une de mes demandes est ajoutée'], ['wishEmail', 'Et aussi par email (demandes)'], ['follow', 'Alerte quand quelqu\'un me suit'], ['followEmail', 'Et aussi par email (nouveaux abonnés)'], ['resume', 'Rappel pour reprendre mon film / ma série']];
  function patchSettings2() {
    var m = document.querySelector('#settings-overlay .settings-modal'); if (!m || $('fx-set-plus')) return;
    var box = document.createElement('div'); box.id = 'fx-set-plus';
    box.innerHTML = '<div class="fx-set"><label>Pseudo</label><input type="text" id="fx-in-name" maxlength="20"><input type="password" id="fx-in-namepw" placeholder="Ton mot de passe actuel (confirmation)"><button class="action-btn" id="fx-n-save">Changer mon pseudo</button></div>' +
      '<div class="fx-set"><label>Choisir un avatar</label><div class="fx-avs" id="fx-avs"></div></div>' +
      '<div class="fx-set"><label>Couleur d\'accent du site</label><div class="fx-cols" id="fx-cols">' + COLORS.map(function (c) { return '<button type="button" data-c="' + c + '" style="background:' + c + '"></button>'; }).join('') + '<input type="color" id="fx-colin" value="#ffde00"></div></div>' +
      '<div class="fx-set"><label>Confidentialité</label><label class="fx-chk"><input type="checkbox" id="fx-pv-pub"> Profil public (les autres peuvent me voir et me suivre)</label><label class="fx-chk"><input type="checkbox" id="fx-pv-top"> Afficher « Mon Top » sur mon profil public</label><label class="fx-chk"><input type="checkbox" id="fx-pv-fav"> Afficher mes favoris sur mon profil public</label></div>' +
      '<div class="fx-set"><label>Notifications</label>' + NOTIFS.map(function (n) { return '<label class="fx-chk"><input type="checkbox" data-n="' + n[0] + '"> ' + n[1] + '</label>'; }).join('') + '<small class="fx-s">Les alertes par email nécessitent d\'avoir renseigné ton email ci-dessus.</small><button class="action-btn" id="fx-prefs-save">Enregistrer mes préférences</button></div>' +
      '<div class="fx-set"><a class="fx-file" href="' + DISCORD + '" target="_blank" rel="noopener"><i class="fas fa-headset"></i> Contacter l\'équipe (Discord)</a></div>' +
      '<div class="fx-set fx-danger"><label>Zone dangereuse — supprimer mon compte</label><input type="password" id="fx-del-pw" placeholder="Ton mot de passe"><input type="text" id="fx-del-conf" placeholder="Tape SUPPRIMER pour confirmer"><button class="fx-btn fx-del fx-wide" id="fx-del-go"><i class="fas fa-trash"></i> Supprimer définitivement mon compte</button></div>';
    var ex = $('fx-set-extra'); (ex || m.lastElementChild).after(box);
    var av = $('fx-avs'); AV.forEach(function (_, i) { var b = document.createElement('button'); b.type = 'button'; b.style.backgroundImage = 'url(' + avatar(i, 96) + ')'; b.onclick = function () { setPic(avatar(i, 256)); }; av.appendChild(b); });
    $('fx-cols').querySelectorAll('button').forEach(function (b) { b.onclick = function () { $('fx-colin').value = b.dataset.c; applyAccent(b.dataset.c); }; }); $('fx-colin').oninput = function () { applyAccent(this.value); };
    $('fx-n-save').onclick = function () {
      api('/api/user/update-username', { method: 'POST', body: JSON.stringify({ username: $('fx-in-name').value.trim(), password: $('fx-in-namepw').value }) }).then(function (r) {
        if (!r.success) return toast(r.message || 'Erreur'); cu().username = r.username; if ($('prof-page-name')) $('prof-page-name').textContent = r.username; $('fx-in-namepw').value = ''; toast('Pseudo mis à jour !');
      });
    };
    $('fx-prefs-save').onclick = function () {
      var n = {}; box.querySelectorAll('[data-n]').forEach(function (c) { n[c.dataset.n] = c.checked; });
      var col = $('fx-colin').value, body = { accent: col.toLowerCase() === '#ffde00' ? '' : col, isPublic: $('fx-pv-pub').checked, showTop: $('fx-pv-top').checked, showFavs: $('fx-pv-fav').checked, notif: n };
      api('/api/user/settings', { method: 'POST', body: JSON.stringify(body) }).then(function (r) { if (!r.success) return toast(r.message || 'Erreur'); var u = cu(); u.accent = body.accent; u.isPublic = body.isPublic; u.showTop = body.showTop; u.showFavs = body.showFavs; u.notif = n; applyAccent(body.accent); toast('Préférences enregistrées !'); });
    };
    $('fx-del-go').onclick = function () {
      if ($('fx-del-conf').value.trim() !== 'SUPPRIMER') return toast('Tape SUPPRIMER pour confirmer.');
      if (!confirm('Supprimer définitivement ton compte, tes listes et tes alertes ? Cette action est irréversible.')) return;
      api('/api/user/account', { method: 'DELETE', body: JSON.stringify({ password: $('fx-del-pw').value }) }).then(function (r) { if (!r.success) return toast(r.message || 'Erreur'); localStorage.removeItem('monBadgeCineLK10'); location.href = location.pathname; });
    };
  }
  function fillSettings() {
    var u = cu(); if (!u || !$('fx-set-plus')) return; var N = Object.assign({ wish: true, wishEmail: false, follow: true, followEmail: false, resume: true }, u.notif || {});
    $('fx-in-name').value = u.username; $('fx-colin').value = /^#[0-9a-f]{6}$/i.test(u.accent || '') ? u.accent : '#ffde00';
    $('fx-pv-pub').checked = !!u.isPublic; $('fx-pv-top').checked = u.showTop !== false; $('fx-pv-fav').checked = !!u.showFavs;
    $('fx-set-plus').querySelectorAll('[data-n]').forEach(function (c) { c.checked = !!N[c.dataset.n]; });
  }
  function setPic(url) {
    api('/api/user/update-pic', { method: 'POST', body: JSON.stringify({ url: url }) }).then(function (r) { if (!r.success) return toast(r.message || 'Erreur'); cu().profilePic = url; ['nav-avatar', 'prof-page-avatar'].forEach(function (i) { if ($(i)) $(i).src = url; }); toast('Avatar mis à jour !'); });
  }

  /* ---------- Rappel pour reprendre ---------- */
  /* attend que la page « Press start » soit fermée avant d'afficher quoi que ce soit */
  function afterCover(cb) {
    var c = $('cover-page'), gone = function () { return !c || !c.isConnected || getComputedStyle(c).display === 'none'; };
    if (gone()) return cb();
    var i = setInterval(function () { if (gone()) { clearInterval(i); cb(); } }, 400);
  }
  function resumeReminder() {
    var u = cu(); if (!u || sessionStorage.getItem('fxResume2')) return; if ((u.notif || {}).resume === false) return;
    var h = (u.history || []).filter(function (x) { return x && typeof x === 'object'; }).sort(function (a, b) { return new Date(b.watchedAt || 0) - new Date(a.watchedAt || 0); })[0]; if (!h) return;
    afterCover(function () { setTimeout(function () { try { sessionStorage.setItem('fxResume2', '1'); } catch (e) {} toast('Reprendre « ' + h.title + ' »' + (typeof h.episodeIndex === 'number' ? ' — épisode ' + (h.episodeIndex + 1) : '') + ' ?', function () { try { openP(h.id, typeof h.episodeIndex === 'number' ? h.episodeIndex : null); } catch (e) {} }, '▶ Reprendre'); }, 1500); });
  }

  /* ---------- Calendrier des sorties : page à part, dans le menu à côté de Wishboard ---------- */
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); };
  var pad2 = function (n) { return n < 10 ? '0' + n : '' + n; };
  var isoD = function (d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  var KIND = { film: 'Film', serie: 'Série', anime: 'Animé' };
  var CAL = { y: new Date().getFullYear(), m: new Date().getMonth(), kind: 'all', cat: false, q: '', data: {}, done: {}, sh: {}, se: {}, pend: 0, idx: null, t: 0 };

  var GEN_X = [10763, 10767, 10764, 10766]; /* talk-shows, actualités, télé-réalité, feuilletons quotidiens : exclus (une « sortie » chaque jour, sans épisode utile) */
  var latin = function (s) { var l = String(s || '').match(/\p{L}/gu); if (!l || !l.length) return false; var la = String(s).match(/\p{Script=Latin}/gu); return (la ? la.length : 0) * 2 >= l.length; };
  var addDays = function (ds, n) { var d = new Date(ds + 'T12:00:00'); d.setDate(d.getDate() + n); return isoD(d); };

  function tmdb(path, params, lang, again) {
    var k; try { k = TMDB_API_KEY; } catch (e) { return Promise.reject(e); }
    return fetch('https://api.themoviedb.org/3' + path + '?api_key=' + k + '&language=' + (lang || 'fr-FR') + (params ? '&' + params : '')).then(function (r) {
      if (r.status === 429 && !again) return new Promise(function (ok) { setTimeout(ok, 700); }).then(function () { return tmdb(path, params, lang, 1); });
      if (!r.ok) throw new Error('TMDB ' + r.status);
      return r.json();
    });
  }
  function pool(tasks, n, each) {          // exécute les requêtes n par n
    var i = 0, out = [];
    function next() {
      if (i >= tasks.length) return Promise.resolve();
      var t = tasks[i++];
      return Promise.resolve().then(t).then(function (r) { if (r != null) out.push(r); }, function () {}).then(function () { if (each) each(); return next(); });
    }
    var w = [], k; for (k = 0; k < Math.min(n, tasks.length); k++) w.push(next());
    return Promise.all(w).then(function () { return out; });
  }
  /* Un titre est « au catalogue » seulement si le NOM, le TYPE (film / série-animé) et l'ANNÉE (±1) correspondent.
     Les noms vides (titres en japonais, chinois… une fois nettoyés) sont ignorés : c'était la cause des faux « Regarder ». */
  function catIndex() {
    if (CAL.idx && CAL.idxN === DB().length) return CAL.idx;
    CAL.idx = {}; CAL.idxN = DB().length;
    DB().forEach(function (m) {
      if (!m || m.type === 'saga' || !m.title || m.id == null) return;
      var k = norm(m.title); if (!k) return;
      (CAL.idx[k] = CAL.idx[k] || []).push({ id: m.id, type: m.type, year: parseInt(m.year, 10) || 0 });
    });
    return CAL.idx;
  }
  function matchCat(it) {
    var n = DB().length; if (it._n === n) return it._c;
    var ix = catIndex(), tv = it.kind !== 'film', y = parseInt(it.year, 10) || 0, seen = {}, res = null;
    it.mt.forEach(function (k) {
      if (!k) return;
      (ix[k] || []).forEach(function (m) {
        if (res || seen[m.id]) return; seen[m.id] = 1;
        if (tv ? m.type === 'film' : m.type !== 'film') return;
        if (y && m.year && Math.abs(m.year - y) > 1) return;
        res = m.id;
      });
    });
    it._n = n; it._c = res; return res;
  }
  function mk(x, kind) {
    var t = x.title || x.name || '';
    return { kind: kind, title: t, poster: x.poster_path ? 'https://image.tmdb.org/t/p/w154' + x.poster_path : '', rating: x.vote_average || 0, pop: x.popularity || 0,
      over: x.overview || '', year: (x.release_date || x.first_air_date || '').slice(0, 4), mt: [norm(t), norm(x.original_title || x.original_name)],
      get cat() { return matchCat(this); } };
  }
  var dayOf = function (ds) { return CAL.data[ds] || (CAL.data[ds] = { movies: [], tv: [] }); };
  function gridDays() {
    var first = new Date(CAL.y, CAL.m, 1), dow = (first.getDay() + 6) % 7, n = new Date(CAL.y, CAL.m + 1, 0).getDate(), total = Math.ceil((dow + n) / 7) * 7, out = [], i;
    for (i = 0; i < total; i++) out.push(new Date(CAL.y, CAL.m, 1 - dow + i));
    return out;
  }
  /* ----- Séries & animés : on repère les séries qui diffusent dans la période, puis on lit leurs saisons pour avoir les VRAIS épisodes (S2E05…) jour par jour ----- */
  function discoverShows(a, b, tick) {
    var rng = 'include_adult=false&sort_by=popularity.desc&air_date.gte=' + a + '&air_date.lte=' + b, cand = {}, jobs = [], today = isoD(new Date()), p;
    function take(r) {
      ((r && r.results) || []).forEach(function (x) {
        var g = x.genre_ids || [];
        if (g.some(function (i) { return GEN_X.indexOf(i) > -1; })) return;
        var an = g.indexOf(16) > -1 && (x.origin_country || []).indexOf('JP') > -1, c = cand[x.id];
        cand[x.id] = { id: x.id, anime: an, pop: Math.max(x.popularity || 0, c ? c.pop : 0) };
      });
    }
    function page(path, n, extra) { jobs.push(function () { return tmdb(path, (extra ? extra + '&' : '') + 'page=' + n).then(take); }); }
    for (p = 1; p <= 4; p++) page('/discover/tv', p, rng + '&without_genres=' + GEN_X.join(','));
    for (p = 1; p <= 5; p++) page('/discover/tv', p, rng + '&with_genres=16&with_origin_country=JP');     // animés japonais
    if (today >= a && today <= b) { for (p = 1; p <= 3; p++) page('/tv/airing_today', p); for (p = 1; p <= 2; p++) page('/tv/on_the_air', p); }
    return pool(jobs, 6, tick).then(function () {
      var l = Object.keys(cand).map(function (k) { return cand[k]; }).sort(function (x, y) { return y.pop - x.pop; });
      return l.filter(function (x) { return !x.anime; }).slice(0, 60).concat(l.filter(function (x) { return x.anime; }).slice(0, 90));
    });
  }
  function showDet(id) { return CAL.sh[id] || (CAL.sh[id] = tmdb('/tv/' + id, '').catch(function () { delete CAL.sh[id]; return null; })); }
  function seasonDet(id, n) { var k = id + ':' + n; return CAL.se[k] || (CAL.se[k] = tmdb('/tv/' + id + '/season/' + n, '').catch(function () { delete CAL.se[k]; return null; })); }
  function showFull(id) {                  // titre latin obligatoire (sinon on retente en anglais, sinon on ignore)
    return showDet(id).then(function (s) {
      if (!s) return null; if (latin(s.name)) return s;
      return tmdb('/tv/' + id, '', 'en-US').then(function (e) { if (e && latin(e.name)) { s.name = e.name; return s; } return null; }).catch(function () { return null; });
    });
  }
  function seasonsFor(show, a, b) {        // saisons qui diffusent dans la période
    var set = {};
    (show.seasons || []).forEach(function (s) {
      if (!(s.season_number >= 1) || !s.air_date) return;
      if (s.air_date <= b && addDays(s.air_date, Math.max(1, s.episode_count || 1) * 7) >= a) set[s.season_number] = 1;
    });
    [show.last_episode_to_air, show.next_episode_to_air].forEach(function (e) {
      if (e && e.season_number >= 1 && e.air_date && e.air_date >= addDays(a, -60) && e.air_date <= b) set[e.season_number] = 1;
    });
    return Object.keys(set).map(Number).sort(function (x, y) { return y - x; }).slice(0, 2);
  }
  var MAX_SEASONS = 15;                    /* séries et animés avec plus de saisons : retirés du calendrier (mets 999 pour tout garder) */
  var seasonCount = function (show) { var n = (show.seasons || []).filter(function (s) { return s.season_number >= 1; }).length; return Math.max(n, show.number_of_seasons || 0); };
  function addShow(show, a, b, anime) {
    if (seasonCount(show) > MAX_SEASONS) return Promise.resolve();
    return Promise.all(seasonsFor(show, a, b).map(function (n) { return seasonDet(show.id, n); })).then(function (res) {
      var groups = {};
      res.forEach(function (sd) {
        ((sd && sd.episodes) || []).forEach(function (e) {
          if (!e.air_date || e.air_date < a || e.air_date > b || typeof e.episode_number !== 'number') return;
          var k = e.air_date + ':' + e.season_number; (groups[k] = groups[k] || []).push(e);
        });
      });
      Object.keys(groups).forEach(function (k) {
        var l = groups[k].sort(function (x, y) { return x.episode_number - y.episode_number; }), f = l[0], z = l[l.length - 1], it = mk(show, anime ? 'anime' : 'serie');
        it.ep = 'S' + f.season_number + 'E' + pad2(f.episode_number) + (l.length > 1 ? '–E' + pad2(z.episode_number) : '');
        it.epName = l.length > 1 ? l.length + ' épisodes' : (f.name || '');
        it.epOver = l.length === 1 ? (f.overview || '') : '';
        it.key = 't:' + show.id + ':' + f.season_number + ':' + f.episode_number + '-' + z.episode_number;
        var d = dayOf(f.air_date); if (!d.tv.some(function (x) { return x.key === it.key; })) d.tv.push(it);
      });
    });
  }
  function loadRange() {
    var days = gridDays(), a = isoD(days[0]), b = isoD(days[days.length - 1]), key = a + '_' + b,
      tick = function () { clearTimeout(CAL.t); CAL.t = setTimeout(renderGrid, 150); },
      fin = function () { CAL.pend = Math.max(0, CAL.pend - 1); tick(); };
    if (CAL.done[key]) return renderGrid();
    CAL.done[key] = 1;
    var movieJobs = [1, 2, 3, 4, 5, 6].map(function (p) {
      return function () {
        return tmdb('/discover/movie', 'sort_by=popularity.desc&include_adult=false&primary_release_date.gte=' + a + '&primary_release_date.lte=' + b + '&page=' + p).then(function (r) {
          (r.results || []).forEach(function (x) { if (!x.release_date) return; var d = dayOf(x.release_date), it = mk(x, 'film'); if (!d.movies.some(function (m) { return m.title === it.title; })) d.movies.push(it); });
        });
      };
    });
    CAL.pend++; pool(movieJobs, 4, tick).then(fin, fin);
    CAL.pend++;
    discoverShows(a, b, tick).then(function (c) {
      if (!c.length) { CAL.done[key] = 0; return; }
      return pool(c.map(function (s) { return function () { return showFull(s.id).then(function (sh) { return sh ? addShow(sh, a, b, s.anime) : null; }); }; }), 8, tick);
    }).then(fin, function () { CAL.done[key] = 0; fin(); });
    renderGrid();
  }
  function itemsOf(ds, all) {
    var d = CAL.data[ds]; if (!d) return [];
    var l = d.movies.concat(d.tv).filter(function (x) {
      return (all || ((CAL.kind === 'all' || x.kind === CAL.kind) && (!CAL.cat || x.cat) && (!CAL.q || norm(x.title).indexOf(norm(CAL.q)) > -1)));
    });
    return l.sort(function (a, b) { return (b.cat ? 1 : 0) - (a.cat ? 1 : 0) || (b.pop || 0) - (a.pop || 0); });
  }
  function renderGrid() {
    var g = $('fxc-grid'); if (!g) return;
    var days = gridDays(), today = isoD(new Date()), html = '', wd = ['LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.', 'DIM.'];
    wd.forEach(function (w) { html += '<div class="fxc-wd">' + w + '</div>'; });
    var monthN = 0, weekN = 0, todayN = 0, now = new Date(), ws = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)), wsI = isoD(ws), weI = isoD(new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6));
    days.forEach(function (d) {
      var ds = isoD(d), all = itemsOf(ds, true), l = itemsOf(ds, false), out = d.getMonth() !== CAL.m;
      if (!out) monthN += all.length; if (ds >= wsI && ds <= weI) weekN += all.length; if (ds === today) todayN = all.length;
      html += '<div class="fxc-cell' + (out ? ' out' : '') + (ds === today ? ' today' : '') + '" data-d="' + ds + '"><span class="fxc-n">' + d.getDate() + '</span>' +
        l.slice(0, 3).map(function (x) { return '<div class="fxc-chip k-' + x.kind + (x.cat ? ' cat' : '') + '" title="' + esc(x.title + (x.ep ? ' — ' + x.ep : '')) + '">' + (x.ep ? '<b>' + esc(x.ep) + '</b>' : '') + esc(x.title) + '</div>'; }).join('') +
        (l.length > 3 ? '<div class="fxc-more">+' + (l.length - 3) + ' autres</div>' : '') +
        (l.length ? '<div class="fxc-dots">' + l.slice(0, 4).map(function (x) { return '<i class="d-' + x.kind + '"></i>'; }).join('') + '</div><div class="fxc-cnt">' + l.length + '</div>' : '') + '</div>';
    });
    g.innerHTML = html;
    $('fxc-s1').textContent = todayN; $('fxc-s2').textContent = weekN; $('fxc-s3').textContent = monthN;
    $('fxc-sub').textContent = monthN + ' sortie' + (monthN > 1 ? 's' : '') + ' ce mois-ci';
    $('fxc-month').textContent = new Date(CAL.y, CAL.m, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    $('fxc-load').style.opacity = CAL.pend > 0 ? 1 : 0;
    g.querySelectorAll('.fxc-cell').forEach(function (c) { c.onclick = function () { openDay(c.dataset.d); }; });
  }
  function openDay(ds) {
    var o = $('fxc-day'), l = itemsOf(ds, false), d = new Date(ds + 'T12:00:00');
    $('fxc-dt').textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('fxc-dl').innerHTML = l.length ? l.map(function (x, i) {
      return '<div class="fxc-r"><div class="fxc-rp" style="background-image:url(\'' + esc(x.poster) + '\')"></div><div class="fxc-rb"><div class="fxc-rt">' + esc(x.title) + '</div>' +
        '<div class="fxc-rm"><span class="fxc-tag k-' + x.kind + '">' + KIND[x.kind] + '</span>' + (x.year ? ' ' + x.year : '') + (x.rating ? ' · ★ ' + x.rating.toFixed(1) : '') + '</div>' +
        (x.ep ? '<div class="fxc-epn"><b>' + esc(x.ep) + '</b>' + (x.epName ? ' · ' + esc(x.epName) : '') + '</div>' : '') +
        ((x.epOver || x.over) ? '<div class="fxc-ro">' + esc(x.epOver || x.over) + '</div>' : '') +
        (x.cat ? '<button class="fxc-watch" data-id="' + esc(x.cat) + '"><i class="fas fa-play"></i> Regarder</button>' : '<span class="fxc-no">Pas encore au catalogue</span>') + '</div></div>';
    }).join('') : '<div class="fx-empty">🎬<br>Aucune sortie ce jour-là.</div>';
    $('fxc-dl').querySelectorAll('.fxc-watch').forEach(function (b) { b.onclick = function () { var id = b.dataset.id; if (!DB().some(function (m) { return String(m.id) === String(id); })) return; closeCal(); try { openP(id); } catch (e) {} }; });
    o.classList.add('on');
  }
  function shiftMonth(n) { CAL.m += n; if (CAL.m < 0) { CAL.m = 11; CAL.y--; } if (CAL.m > 11) { CAL.m = 0; CAL.y++; } loadRange(); }
  function openCal() {
    try { if (typeof closeProfilePage === 'function') closeProfilePage(); } catch (e) {}
    var o = $('fx-calpage');
    if (!o) {
      o = document.createElement('div'); o.id = 'fx-calpage';
      o.innerHTML = '<div class="fxc"><div class="fxc-top"><button class="fxc-back" id="fxc-back" aria-label="Retour"><i class="fas fa-arrow-left"></i></button><div class="fxc-ico"><i class="fas fa-calendar-alt"></i></div><div><h2>Calendrier</h2><small id="fxc-sub">…</small></div></div>' +
        '<div class="fxc-stats"><div><b id="fxc-s1">0</b><span>Aujourd\'hui</span></div><div><b id="fxc-s2">0</b><span>Cette semaine</span></div><div><b id="fxc-s3">0</b><span>Ce mois-ci</span></div></div>' +
        '<div class="fxc-bar"><button class="fxc-btn" id="fxc-prev"><i class="fas fa-chevron-left"></i></button><div class="fxc-month" id="fxc-month"></div><button class="fxc-btn" id="fxc-next"><i class="fas fa-chevron-right"></i></button><button class="fxc-btn" id="fxc-today">Aujourd\'hui</button>' +
        '<label class="fxc-search"><i class="fas fa-search"></i><input id="fxc-q" type="text" placeholder="Rechercher dans le calendrier…"></label>' +
        '<div class="fxc-seg" id="fxc-seg"><button data-k="all" class="on">Tout</button><button data-k="film">Films</button><button data-k="serie">Séries</button><button data-k="anime">Animés</button></div>' +
        '<button class="fxc-btn" id="fxc-cat"><i class="fas fa-check-circle"></i> Au catalogue</button></div>' +
        '<div class="fxc-load" id="fxc-load"></div><div class="fxc-grid" id="fxc-grid"></div>' +
        '<div class="fxc-legend"><span><i class="d-film"></i>Films</span><span><i class="d-serie"></i>Séries</span><span><i class="d-anime"></i>Animés</span><span><i class="d-cat"></i>Disponible sur LK10</span><span class="fxc-src">Données TMDB</span></div></div>' +
        '<div id="fxc-day"><div class="fxc-dp"><button class="fxc-x" id="fxc-dx">✕</button><h3 id="fxc-dt"></h3><div id="fxc-dl"></div></div></div>';
      document.body.appendChild(o);
      $('fxc-back').onclick = closeCal;
      $('fxc-prev').onclick = function () { shiftMonth(-1); }; $('fxc-next').onclick = function () { shiftMonth(1); };
      $('fxc-today').onclick = function () { var n = new Date(); CAL.y = n.getFullYear(); CAL.m = n.getMonth(); loadRange(); };
      $('fxc-q').oninput = function () { CAL.q = this.value; renderGrid(); };
      $('fxc-seg').querySelectorAll('button').forEach(function (b) { b.onclick = function () { CAL.kind = b.dataset.k; $('fxc-seg').querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); renderGrid(); }; });
      $('fxc-cat').onclick = function () { CAL.cat = !CAL.cat; this.classList.toggle('on', CAL.cat); renderGrid(); };
      $('fxc-dx').onclick = function () { $('fxc-day').classList.remove('on'); };
      $('fxc-day').onclick = function (e) { if (e.target === this) this.classList.remove('on'); };
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('fx-calpage').classList.contains('on')) { if ($('fxc-day').classList.contains('on')) $('fxc-day').classList.remove('on'); else closeCal(); } });
    }
    if (!$('fxc-extra-css')) { var st = document.createElement('style'); st.id = 'fxc-extra-css'; st.textContent = '.fxc-chip b{font-weight:800;font-size:10px;opacity:.75;margin-right:5px}.fxc-epn{color:var(--primary,#ffde00);font-weight:700;font-size:13px;margin:4px 0 2px}.fxc-epn b{font-weight:900;margin-right:2px}'; document.head.appendChild(st); }
    o.classList.add('on'); document.body.classList.add('no-scroll'); o.scrollTop = 0; loadRange();
  }
  function closeCal() { var o = $('fx-calpage'); if (o) o.classList.remove('on'); var d = $('fxc-day'); if (d) d.classList.remove('on'); document.body.classList.remove('no-scroll'); }
  function addNavCal() {
    var w = $('nav-wishboard'), li = w && w.closest('li'); if (!li || $('nav-calendar')) return;
    var n = document.createElement('li'); n.className = 'nav-item';
    n.innerHTML = '<a id="nav-calendar" class="nav-link" href="#"><i class="fas fa-calendar-alt"></i> CALENDRIER</a>';
    li.after(n);
    $('nav-calendar').onclick = function (e) { e.preventDefault(); try { if (window.innerWidth <= 992 && typeof toggleMobileMenu === 'function') toggleMobileMenu(); } catch (x) {} openCal(); };
  }

  /* ---------- Fenêtre flottante ---------- */
  function floatOn() {
    var o = $('player-overlay'); if (!o || o.classList.contains('fx-float')) return;
    o.classList.add('fx-float'); document.body.classList.remove('no-scroll');
    var vb = o.querySelector('.video-box'); if (vb && !$('fx-fctl')) {
      var ctl = document.createElement('div'); ctl.id = 'fx-fctl'; ctl.innerHTML = '<span class="fx-fh" title="Déplacer"><i class="fas fa-arrows-alt"></i></span><button type="button" id="fx-fbig" title="Agrandir"><i class="fas fa-expand-alt"></i></button><button type="button" id="fx-fcl" title="Fermer"><i class="fas fa-times"></i></button>'; vb.appendChild(ctl);
      $('fx-fbig').onclick = floatOff; $('fx-fcl').onclick = function () { floatOff(); try { closeP(); } catch (e) {} };
      var h = ctl.querySelector('.fx-fh'), sx, sy, ox, oy, mv = function (e) { var p = e.touches ? e.touches[0] : e; vb.style.left = Math.max(0, Math.min(innerWidth - 120, ox + p.clientX - sx)) + 'px'; vb.style.top = Math.max(0, Math.min(innerHeight - 80, oy + p.clientY - sy)) + 'px'; vb.style.right = vb.style.bottom = 'auto'; e.preventDefault(); },
        up = function () { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); document.removeEventListener('touchmove', mv); document.removeEventListener('touchend', up); },
        dn = function (e) { var p = e.touches ? e.touches[0] : e, r = vb.getBoundingClientRect(); sx = p.clientX; sy = p.clientY; ox = r.left; oy = r.top; document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); document.addEventListener('touchmove', mv, { passive: false }); document.addEventListener('touchend', up); e.preventDefault(); };
      h.addEventListener('mousedown', dn); h.addEventListener('touchstart', dn, { passive: false });
    }
  }
  function floatOff() { var o = $('player-overlay'); if (!o) return; o.classList.remove('fx-float'); var vb = o.querySelector('.video-box'); if (vb) vb.style.left = vb.style.top = vb.style.right = vb.style.bottom = ''; if (o.style.display !== 'none') document.body.classList.add('no-scroll'); }
  function floatBtn() {
    var pc = document.querySelector('#player-overlay .player-content'); if (!pc || $('fx-floatbtn')) return;
    var b = document.createElement('button'); b.id = 'fx-floatbtn'; b.type = 'button'; b.innerHTML = '<i class="fas fa-external-link-alt"></i> <span>Fenêtre flottante</span>'; b.onclick = floatOn; pc.appendChild(b);
  }

  /* ---------- Branchements ---------- */
  var oOpen = window.openProfilePage;
  if (typeof oOpen === 'function') window.openProfilePage = function () {
    var r = oOpen.apply(this, arguments);
    try { addTabs(); patchSettings2(); fillSettings(); renderExtra(); } catch (e) { console.warn('cine-social', e); }
    return r;
  };
  var oSw = window.switchProfTab; if (typeof oSw === 'function') window.switchProfTab = function () { var p = $('fx-prof-panel'); if (p) p.style.display = 'none'; return oSw.apply(this, arguments); };
  var oCl = window.closeP; if (typeof oCl === 'function') window.closeP = function () { floatOff(); return oCl.apply(this, arguments); };
  var oOp = window.openP; if (typeof oOp === 'function') window.openP = function () { floatOff(); return oOp.apply(this, arguments); };
  var oSet = $('settings-overlay'); if (oSet) new MutationObserver(function () { if (oSet.style.display === 'flex') { patchSettings2(); fillSettings(); } }).observe(oSet, { attributes: true, attributeFilter: ['style'] });

  try { addNavCal(); } catch (e) { console.warn('cine-cal', e); }
  try { addListBtn(); floatBtn(); addTabs(); } catch (e) {}
  whenUser(function () { applyAccent(cu().accent); resumeReminder(); });
  fromUrl();
})();
