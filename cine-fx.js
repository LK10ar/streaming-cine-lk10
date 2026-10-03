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
