/* Ciné LK10 — lk10-deco.js : DÉCO DES FÊTES
   • L'admin a un bouton « Déco » (baguette magique, dans le header) : Halloween / Noël / Pâques / Saint-Valentin / Nouvel an.
     Un clic sur une fête = la déco apparaît pour TOUT LE MONDE. Re-clic (ou « Aucune déco ») = tout est enlevé.
   • « Noël » : guirlande, neige, village de Noël avant le pied de page (sapin, lutin, Père Noël, Reine des neiges, bonhomme de neige,
     cadeaux, train), traîneau dans le ciel (dessins dans lk10-deco-noel.js) + le bandeau « Le mois de Noël » (lk10-noel.js).
   • « Halloween » : pilote lk10-halloween.js (toiles, chauves-souris, cimetière...) et le bandeau « Le mois de l'horreur ».
   • Pâques / Saint-Valentin / Nouvel an : déjà dans le menu, leur déco sera ajoutée plus tard (voir THEMES plus bas).
   • Tant que l'admin n'a JAMAIS cliqué sur le bouton, le site garde son comportement d'avant (Halloween automatique du 1er octobre
     au 2 novembre). Dès qu'il choisit (même « Aucune déco »), son choix décide pour tout le monde.
   • Autres scripts : écoute  document.addEventListener('lk10deco', e => e.detail.theme)  (null = rien choisi, '' = aucune déco)
     ou lis  window.LK10Deco.get() ;  <html data-deco="noel|halloween|...|none">.
   À ajouter dans index.html, TOUT EN DERNIER (après lk10-noel.js et lk10-deco-noel.js) :  <script src="lk10-deco.js"></script>
   et dans <head> :  <link rel="stylesheet" href="lk10-deco.css"> */
(function () {
  'use strict';
  var KEY = 'lk10_deco', de = document.documentElement;
  var root = null, rafId = 0, timers = [], busy = false, busyTimer = 0, theme = '', ctl = null;   // ctl : null = rien choisi · '' = aucune déco · sinon nom de la fête
  var $ = function (id) { return document.getElementById(id); };

  function isTV() {
    if (de.classList.contains('lk10-tv')) return true;
    try { if (localStorage.getItem('lk10_tv') === '1') return true; } catch (e) {}
    return false;
  }
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ====================== DÉCO DE NOËL ====================== */
  /* Les dessins et animations sont dans lk10-deco-noel.js (à charger AVANT ce fichier). */
  function div(cls, html) { var d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; return d; }
  var noelCtl = null;
  function buildNoel() {
    var N = window.LK10DecoNoel; if (!N) { console.warn('lk10-deco : lk10-deco-noel.js manquant'); return; }
    noelCtl = N.build(root, { tv: isTV(), reduced: reduced(), busy: function () { return busy; } });
  }

  /* ====================== FÊTES DISPONIBLES ====================== */
  var THEMES = {
    halloween: { label: 'Halloween', emoji: '🎃', ready: true },
    noel:      { label: 'Noël', emoji: '🎄', build: buildNoel },
    paques:    { label: 'Pâques', emoji: '🐰' },
    valentin:  { label: 'Saint-Valentin', emoji: '💘' },
    nouvelan:  { label: 'Nouvel an', emoji: '🎆' }
  };

  function clear() {
    if (noelCtl && noelCtl.destroy) { try { noelCtl.destroy(); } catch (e) {} } noelCtl = null;
    timers.forEach(clearTimeout); timers = [];
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (root) { var c = root.querySelector('canvas'); if (c && c._off) c._off(); root.remove(); root = null; }
    var h = document.querySelector('.dc-hat'); if (h) h.remove();
  }
  function setHeaderVar() { var h = document.querySelector('header'); if (h) de.style.setProperty('--dc-h', h.offsetHeight + 'px'); }

  function syncHalloween() {
    var H = window.LK10Halloween; if (!H) return;
    try { if (ctl === null) H.auto(); else if (ctl === 'halloween') H.enable(); else H.disable(); } catch (e) { console.warn('lk10-deco/halloween', e); }
  }
  function effective() {
    if (ctl !== null) return ctl;
    var H = window.LK10Halloween;
    return (H && H.active && H.active()) ? 'halloween' : '';
  }
  function apply(t) {
    if (t !== null && t !== '' && !THEMES[t]) t = null;
    clear(); ctl = t; theme = t || '';
    if (t === null) de.removeAttribute('data-deco'); else de.setAttribute('data-deco', t === '' ? 'none' : t);
    if (theme && THEMES[theme].build) {
      setHeaderVar();
      root = document.createElement('div'); root.id = 'lk10-deco-root'; document.body.appendChild(root);
      try { THEMES[theme].build(); } catch (e) { console.warn('lk10-deco', e); }
    }
    syncHalloween();
    syncModal();
    try { document.dispatchEvent(new CustomEvent('lk10deco', { detail: { theme: t } })); } catch (e) {}
  }
  /* mémorisé pour l'affichage immédiat au prochain chargement : rien = pas choisi, 'none' = aucune déco */
  function remember(t) { try { if (t === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, t === '' ? 'none' : t); } catch (e) {} }
  window.LK10Deco = { get: function () { return ctl; }, set: function (t) { remember(t); apply(t); } };

  /* Pause de la neige quand un film / une bande-annonce est ouvert */
  busyTimer = setInterval(function () {
    var o = $('player-overlay'), t = $('trailer-overlay');
    busy = !!((o && getComputedStyle(o).display !== 'none') || (t && getComputedStyle(t).display !== 'none'));
  }, 1000);
  window.addEventListener('resize', function () { setHeaderVar(); });

  /* ====================== LECTURE DU RÉGLAGE (tout le monde) ====================== */
  function api(p, o) { return fetch(API_URL + p, o).then(function (r) { return r.json(); }); }
  function pull() {
    api('/api/deco').then(function (d) {
      if (!d || !d.success) return;
      var t = (d.theme === null || d.theme === undefined) ? null : d.theme;   // null = l'admin n'a encore rien choisi
      remember(t);
      if (t !== ctl) apply(t);
    }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) pull(); });
  setInterval(pull, 5 * 60 * 1000);

  /* ====================== BOUTON ADMIN « DÉCO » ====================== */
  var modal = null, statusEl = null;
  function setStatus(msg, err) { if (statusEl) { statusEl.textContent = msg || ''; statusEl.className = 'dc-status' + (err ? ' err' : ''); } }
  function syncModal() {
    if (!modal) return;
    var eff = effective();
    modal.querySelectorAll('.dc-opt[data-t]').forEach(function (b) {
      var k = b.dataset.t, on = k === eff; b.classList.toggle('on', on);
      var sm = b.querySelector('small'); if (!sm) return;
      var T = THEMES[k], ready = !!(T.build || T.ready);
      sm.textContent = on ? (ctl === null ? 'Actif (automatique)' : 'Activée pour tout le monde') : (ready ? 'Cliquer pour activer' : 'Bientôt (menu prêt)');
    });
    var off = modal.querySelector('.dc-off'); if (off) off.classList.toggle('on', eff === '');
  }
  function choose(t) {
    if (t === effective()) t = '';                               // re-clic sur la fête active = on enlève tout
    var token = '';
    try { token = localStorage.getItem('monBadgeCineLK10') || ''; } catch (e) {}
    setStatus('Enregistrement…');
    api('/api/admin/deco', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: token }, body: JSON.stringify({ theme: t }) })
      .then(function (d) {
        if (d && d.success) { window.LK10Deco.set(d.theme || ''); setStatus(d.theme ? 'Déco « ' + THEMES[d.theme].label + ' » activée pour tout le monde ✔' : 'Toutes les déco sont enlevées ✔'); }
        else setStatus((d && d.message) || 'Erreur (es-tu bien connecté en admin ?)', true);
      }).catch(function () { setStatus('Erreur de connexion au serveur.', true); });
  }
  function buildModal() {
    modal = div('', ''); modal.id = 'dc-modal';
    var opts = Object.keys(THEMES).map(function (k) {
      return '<button class="dc-opt" data-t="' + k + '"><span>' + THEMES[k].emoji + '</span><div>' + THEMES[k].label + '<small></small></div></button>';
    }).join('');
    modal.innerHTML = '<div class="dc-box"><button class="dc-x" aria-label="Fermer">&times;</button><h2><i class="fas fa-magic"></i> Déco du site</h2>' +
      '<p>Clique sur une fête pour décorer tout le site, pour tous les visiteurs. Clique de nouveau sur la fête active (ou « Aucune déco ») pour tout enlever.</p>' +
      '<div class="dc-grid">' + opts + '</div><button class="dc-opt dc-off"><span>🚫</span><div>Aucune déco</div></button><div class="dc-status"></div></div>';
    document.body.appendChild(modal);
    statusEl = modal.querySelector('.dc-status');
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('.dc-x')) { modal.classList.remove('open'); return; }
      var b = e.target.closest('.dc-opt'); if (!b) return;
      choose(b.dataset.t || '');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') modal.classList.remove('open'); });
    syncModal();
  }
  function addAdminButton() {
    if ($('deco-btn-header')) return;
    var host = document.querySelector('.header-right'); if (!host) return;
    var b = document.createElement('button');
    b.id = 'deco-btn-header'; b.className = 'deco-btn-header admin-btn'; b.title = 'Déco des fêtes';
    b.innerHTML = '<i class="fas fa-magic"></i>';
    b.onclick = function (e) { if (e) e.stopPropagation(); if (!modal) buildModal(); setStatus(''); syncModal(); modal.classList.add('open'); };
    var ref = host.querySelector('.analytics-btn-header') || host.querySelector('.add-btn-header');
    if (ref) host.insertBefore(b, ref); else host.appendChild(b);
  }

  /* ====================== DÉMARRAGE ====================== */
  addAdminButton();
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  saved = saved === 'none' ? '' : (saved && THEMES[saved] ? saved : null);
  apply(saved);          // on applique tout de suite la dernière déco connue (pas de clignotement), puis on vérifie auprès du serveur
  pull();
})();
