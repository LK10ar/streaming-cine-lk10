/* Ciné LK10 — lk10-horreur.js : « LE MOIS DE L'HORREUR » (style Netflix)
   1) Sur l'accueil : bandeau avec le titre, le bouton « Tout explorer » et une rangée de titres d'horreur.
   2) Bouton « Tout explorer » : ouvre une page dédiée avec TOUS les films, séries et animés d'horreur / gore / épouvante,
      classés en rangées thématiques (nouveautés, slashers, monstres, maisons hantées, morts-vivants, vampires, animés...)
      + le catalogue complet d'horreur avec filtres (Tous / Films / Séries / Animés) et tri.
   Rien n'est à remplir à la main : tout est calculé depuis moviesDB (genres « Horreur », « Epouvante-horreur » + mots-clés).
   À ajouter dans index.html, AVANT lk10-perf.js :  <script src="lk10-horreur.js"></script> */
(function () {
  'use strict';

  /* ---------- Réglages ---------- */
  var ONLY_OCTOBER = false;      // true = le bandeau d'accueil n'apparaît que du 1er octobre au 2 novembre
  var BANNER_IMG = 'https://m.media-amazon.com/images/S/pv-target-images/0dedbdd7158481ccd4a7987c3fe61b18ad4e57a1a7cc501b49f640583e65ecaa._SX1080_FMjpg_.jpg';           // (facultatif) lien d'une image de fond ; vide = fond pris automatiquement sur un titre d'horreur
  var GRID_STEP = 42;            // nombre de titres ajoutés à chaque clic sur « Voir plus »
  var MIN_ROW = 4;               // une rangée avec moins de titres que ça est cachée

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
  var db = function () { try { return moviesDB || []; } catch (e) { return []; } };
  var isAnime = function (m) { return /anime/.test(norm(m.genre)); };
  var yr = function (m) { return parseInt(m.year, 10) || 0; };
  var ts = function (m) { return m.createdAt ? new Date(m.createdAt).getTime() : 0; };

  /* ---------- Qu'est-ce qui est « horreur » ? ---------- */
  var G_HORROR = /horreur|epouvante|gore|slasher|terreur/;
  var X_HORROR = /\b(gore|slasher|zombies?|exorcis\w*|poltergeist|demoniaque\w*|massacre\w*|tueur en serie|croque-mitaine|hante[es]?|morts?-vivants?)\b/;
  function text(m) { return norm((m.title || '') + ' ' + (m.desc || '') + ' ' + (m.genre || '')); }
  function isHorror(m) {
    if (!m || m.type === 'saga') return false;
    return G_HORROR.test(norm(m.genre)) || X_HORROR.test(text(m));
  }

  /* ---------- Rangées thématiques (mots-clés cherchés dans titre + résumé + genres) ---------- */
  var kw = function (re) { return function (m) { return re.test(text(m)); }; };
  var ROWS = [
    { t: 'Nouveautés effrayantes pour Halloween', f: function () { return true; }, sort: 'recent' },
    { t: 'Les films d\'horreur les mieux notés', f: function (m) { return m.type === 'film' && !isAnime(m); }, sort: 'rating' },
    { t: 'Les séries qui font frissonner', f: function (m) { return m.type === 'serie' && !isAnime(m); }, sort: 'rating' },
    { t: 'Animés d\'horreur et de gore', f: isAnime, sort: 'rating' },
    { t: 'Cent pour sang slashers', f: kw(/slasher|gore|tueur|massacre|sanglant|\bsang\b|masque|machette|meurtr|boucher|serial killer/), sort: 'rating' },
    { t: 'Monstres et créatures', f: kw(/monstre|creature|\bbete\b|requin|kaiju|alien|extraterrestre|mutant|araignee|geant|abomination/), sort: 'rating' },
    { t: 'Visitez nos maisons hantées', f: kw(/hant|fantome|esprit|poltergeist|spectre|revenant|maison|manoir|medium/), sort: 'rating' },
    { t: 'Réveillez les morts-vivants', f: kw(/zombie|mort-vivant|morts-vivants|infecte|infection|apocalypse|epidemie|virus|contamin/), sort: 'rating' },
    { t: 'Mordus de vampires ?', f: kw(/vampire|dracula|nosferatu|loup-garou|lycan|crocs|buveur de sang/), sort: 'rating' },
    { t: 'Entrez dans un univers surnaturel', f: kw(/surnaturel|possession|demon|exorcis|satan|occulte|sorcel|sorciere|malediction|rituel|secte|diable|paranormal/), sort: 'rating' },
    { t: 'Plongez dans un chaos mental', f: kw(/psychologi|folie|paranoia|hallucin|cauchemar|obsession|manipul|traumat|trouble|schizo/), sort: 'rating' },
    { t: 'Survivants', f: kw(/surviv|piege|enleve|sequestr|huis clos|traque|isole|cabane|foret|poursuite|fuir|echapper/), sort: 'rating' },
    { t: 'Rires et hurlements', f: function (m) { return /comedie/.test(norm(m.genre)); }, sort: 'rating' },
    { t: 'Des frissons en famille', f: function (m) { return !isAnime(m) && /animation|famille/.test(norm(m.genre)); }, sort: 'rating' },
    { t: 'Les classiques qui font peur', f: function (m) { return yr(m) && yr(m) <= 1999; }, sort: 'rating' }
  ];
  function sorted(list, mode) {
    var a = list.slice();
    if (mode === 'rating') a.sort(function (x, y) { return (parseFloat(y.rating) || 0) - (parseFloat(x.rating) || 0); });
    else if (mode === 'recent') a.sort(function (x, y) { return ts(y) - ts(x) || db().indexOf(y) - db().indexOf(x); });
    else if (mode === 'old') a.sort(function (x, y) { return ts(x) - ts(y) || db().indexOf(x) - db().indexOf(y); });
    else if (mode === 'alpha') a.sort(function (x, y) { return String(x.title).localeCompare(String(y.title), 'fr'); });
    return a;
  }

  /* ---------- CSS ---------- */
  function css() {
    if ($('hz-css')) return;
    var s = document.createElement('style'); s.id = 'hz-css';
    s.textContent =
      /* bandeau accueil */
      '.hz-band{position:relative;margin:0 4% 45px;border-radius:14px;overflow:hidden;background:#0a0a0a center/cover no-repeat;border:1px solid #1d1d1d}' +
      '.hz-band::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.96) 0%,rgba(0,0,0,.8) 35%,rgba(0,0,0,.45) 100%),radial-gradient(circle at 20% 80%,rgba(229,9,20,.28),transparent 55%)}' +
      '.hz-band-in{position:relative;display:flex;align-items:center;gap:26px;padding:26px 28px}' +
      '.hz-side{flex:0 0 250px}' +
      '.hz-mini{font:900 30px/.95 Impact,"Arial Black",sans-serif;color:#e50914;text-transform:uppercase;letter-spacing:1px;text-shadow:0 3px 12px rgba(0,0,0,.9)}' +
      '.hz-mini small{display:block;font:700 10px Arial,sans-serif;letter-spacing:3px;color:#ccc;margin:8px 0 10px;text-shadow:none}' +
      '.hz-side p{font-size:13px;line-height:1.5;color:#ddd;margin:0 0 16px}' +
      '.hz-btn{background:#fff;color:#000;border:0;border-radius:999px;padding:10px 26px;font-weight:800;font-size:14px;cursor:pointer;transition:.2s;font-family:inherit;touch-action:manipulation}' +
      '.hz-btn:hover,.hz-btn:focus-visible{background:var(--primary,#ffde00);outline:none;transform:scale(1.05)}' +
      '.hz-band .netflix-slider{flex:1;min-width:0;padding:10px 0 12px}' +
      '.hz-band .netflix-card{flex:0 0 150px;height:222px}' +
      /* page */
      '#horror-page{display:none;width:100%;flex-direction:column;background:#0b0b0b;min-height:100vh}' +
      '.hz-hero{position:relative;min-height:62vh;display:flex;align-items:flex-end;background:#050505 center/cover no-repeat;overflow:hidden}' +
      '.hz-hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 25%,rgba(0,255,170,.14),transparent 45%),radial-gradient(circle at 35% 75%,rgba(229,9,20,.32),transparent 55%),linear-gradient(180deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,.2) 40%,#0b0b0b 100%)}' +
      '.hz-hero-in{position:relative;padding:0 4% 38px;max-width:760px}' +
      '.hz-back{background:rgba(255,255,255,.08);border:0;color:#bbb;border-radius:6px;padding:8px 15px;font-size:14px;cursor:pointer;margin-bottom:22px;font-family:inherit}' +
      '.hz-back:hover,.hz-back:focus-visible{color:#fff;background:rgba(255,255,255,.16);outline:none}' +
      '.hz-big{font:900 clamp(46px,8vw,92px)/.92 Impact,"Arial Black",sans-serif;color:#e50914;text-transform:uppercase;letter-spacing:1px;text-shadow:0 6px 24px rgba(0,0,0,.95),0 0 30px rgba(229,9,20,.35)}' +
      '.hz-hero p{font-size:clamp(14px,1.6vw,19px);line-height:1.5;color:#e8e8e8;margin:18px 0 8px;text-shadow:0 2px 8px #000}' +
      '.hz-count{font-size:13px;color:#aaa;letter-spacing:1px;text-transform:uppercase}' +
      '#hz-rows{padding-top:8px}' +
      '#horror-page .slider-section{margin-bottom:32px}' +
      '.hz-gridwrap{padding:10px 4% 60px}' +
      '.hz-gridhead{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px}' +
      '.hz-gridhead h2{color:#fff;font-size:18px;text-transform:uppercase;letter-spacing:1px;margin:0 12px 0 0}' +
      '.hz-chip{background:#1a1a1a;color:#ccc;border:1px solid #333;border-radius:999px;padding:7px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:.2s;touch-action:manipulation}' +
      '.hz-chip:hover,.hz-chip:focus-visible{border-color:var(--primary,#ffde00);color:#fff;outline:none}' +
      '.hz-chip.on{background:#e50914;border-color:#e50914;color:#fff}' +
      '.hz-sort{margin-left:auto;background:#111;color:var(--primary,#ffde00);border:1px solid #333;border-radius:6px;padding:7px 10px;font-weight:700;outline:none;cursor:pointer}' +
      '.hz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}' +
      '.hz-grid .netflix-card{flex:none;width:auto;height:auto;aspect-ratio:2/3}' +
      '.hz-more{display:block;margin:28px auto 0;background:#1a1a1a;color:#fff;border:1px solid #444;border-radius:999px;padding:12px 34px;font-weight:700;cursor:pointer;font-family:inherit}' +
      '.hz-more:hover,.hz-more:focus-visible{border-color:#e50914;background:#e50914;outline:none}' +
      '.hz-empty{color:#888;text-align:center;padding:50px 10px}' +
      '@media(max-width:900px){.hz-band-in{flex-direction:column;align-items:stretch;gap:14px;padding:18px 14px}.hz-side{flex:none}.hz-band{margin:0 3% 30px}.hz-band .netflix-card{flex-basis:120px;height:178px}.hz-hero{min-height:52vh}.hz-grid{grid-template-columns:repeat(auto-fill,minmax(105px,1fr));gap:9px}.hz-sort{margin-left:0}}' +
      'html.lk10-tv .hz-hero{min-height:50vh}html.lk10-tv .hz-btn,html.lk10-tv .hz-chip{font-size:17px;padding:12px 24px}';
    document.head.appendChild(s);
  }

  /* ---------- Cartes (mêmes badges / survol que le reste du site) ---------- */
  function cardFor(m) {
    var c = document.createElement('div'); c.className = 'netflix-card'; c.tabIndex = 0;
    c.onclick = function () { openP(m.id); };
    var nb = ''; try { nb = getNewBadgeType(m) ? '<div class="badge-card-new" data-newtype="' + getNewBadgeType(m) + '"><i class="fas fa-bolt"></i> NOUVEAU</div>' : ''; } catch (e) {}
    c.innerHTML = '<div class="badge-card" style="pointer-events:none">' + String(m.type || '').toUpperCase() + '</div>' + nb +
      '<div class="netflix-poster" style="background-image:url(\'' + String(m.poster || '').replace(/'/g, '%27') + '\')"></div>';
    var n = c.querySelector('.badge-card-new');
    if (n) n.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); try { hide(); goToNewPage(n.dataset.newtype); } catch (x) {} });
    try { attachNetflixHover(c, m, '.netflix-poster'); } catch (e) {}
    return c;
  }
  function fillSlider(id, list) {
    if (typeof window.buildStandardSlider === 'function') return window.buildStandardSlider(id, list);
    var box = $(id); box.innerHTML = ''; list.forEach(function (m) { box.appendChild(cardFor(m)); });
  }

  /* ---------- Bandeau de l'accueil ---------- */
  function inSeason() {
    if (!ONLY_OCTOBER) return true;
    var d = new Date(), mo = d.getMonth(), da = d.getDate();
    return mo === 9 || (mo === 10 && da <= 2);
  }
  function bgFor(pool) {
    if (/^https?:\/\//i.test(BANNER_IMG)) return BANNER_IMG;
    var withBg = pool.filter(function (m) { return /^https?:\/\//i.test(m.backdrop || ''); });
    var pick = withBg.length ? withBg[Math.floor(Math.random() * withBg.length)] : null;
    return pick ? pick.backdrop : '';
  }
  function setBg(el, url) { el.style.backgroundImage = url ? 'url("' + String(url).replace(/"/g, '%22') + '")' : ''; }

  function buildBand() {
    var home = $('home-page'); if (!home) return;
    var old = $('hz-band'); if (old) old.remove();
    var pool = db().filter(isHorror);
    if (!inSeason() || pool.length < MIN_ROW) return;
    css();
    var band = document.createElement('div'); band.id = 'hz-band'; band.className = 'hz-band'; setBg(band, bgFor(pool));
    band.innerHTML =
      '<div class="hz-band-in"><div class="hz-side"><div class="hz-mini">Le mois<br>de l\'horreur<small>COLLECTION HALLOWEEN</small></div>' +
      '<p>Explorez les horreurs d\'Halloween, les thrillers les plus tordus et les récits les plus glaçants.</p>' +
      '<button type="button" class="hz-btn" id="hz-explore">Tout explorer</button></div>' +
      '<div class="netflix-slider" id="hz-band-slider"></div></div>';
    var cw = $('continue-watching-section');
    if (cw && cw.parentNode === home) cw.after(band);
    else { var hero = $('hero-carousel'); hero && hero.parentNode === home ? hero.after(band) : home.insertBefore(band, home.firstChild); }
    $('hz-explore').onclick = show;
    var pick = sorted(pool, 'recent').slice(0, 10).concat(sorted(pool, 'rating').slice(0, 14));
    var seen = {}, list = pick.filter(function (m) { if (seen[m.id]) return false; return (seen[m.id] = 1); }).slice(0, 16);
    fillSlider('hz-band-slider', list);
  }

  /* ---------- Page « Tout explorer » ---------- */
  var gridState = { f: 'all', s: 'rating', n: GRID_STEP };

  function ensurePage() {
    var p = $('horror-page'); if (p) return p;
    css();
    p = document.createElement('div'); p.id = 'horror-page';
    p.innerHTML =
      '<div class="hz-hero" id="hz-hero"><div class="hz-hero-in"><button type="button" class="hz-back" id="hz-back"><i class="fas fa-arrow-left"></i> Retour</button>' +
      '<div class="hz-big">Le mois<br>de l\'horreur</div>' +
      '<p>Explorez les horreurs d\'Halloween, les thrillers les plus tordus et les récits les plus glaçants : films, séries et animés d\'horreur, de gore et d\'épouvante.</p>' +
      '<div class="hz-count" id="hz-count"></div></div></div>' +
      '<div id="hz-rows"></div>' +
      '<div class="hz-gridwrap" id="hz-gridwrap"><div class="hz-gridhead"><h2>Tout le catalogue d\'horreur</h2>' +
      '<button type="button" class="hz-chip on" data-f="all">Tout</button><button type="button" class="hz-chip" data-f="film">Films</button>' +
      '<button type="button" class="hz-chip" data-f="serie">Séries</button><button type="button" class="hz-chip" data-f="anime">Animés</button>' +
      '<select class="hz-sort" id="hz-sort"><option value="rating">⭐ Mieux notés</option><option value="recent">🕒 Plus récents</option><option value="old">⏳ Plus anciens</option><option value="alpha">🔤 De A à Z</option></select></div>' +
      '<div class="hz-grid" id="hz-grid"></div><button type="button" class="hz-more" id="hz-more">Voir plus</button></div>';
    var home = $('home-page');
    if (home) home.after(p); else document.body.appendChild(p);
    $('hz-back').onclick = function () { try { showHome(); } catch (e) { hide(); } };
    p.querySelectorAll('.hz-chip').forEach(function (b) {
      b.onclick = function () {
        p.querySelectorAll('.hz-chip').forEach(function (x) { x.classList.toggle('on', x === b); });
        gridState.f = b.dataset.f; gridState.n = GRID_STEP; drawGrid();
      };
    });
    $('hz-sort').onchange = function () { gridState.s = this.value; gridState.n = GRID_STEP; drawGrid(); };
    $('hz-more').onclick = function () { gridState.n += GRID_STEP; drawGrid(); };
    return p;
  }

  function drawGrid() {
    var pool = db().filter(isHorror).filter(function (m) {
      return gridState.f === 'all' || (gridState.f === 'anime' ? isAnime(m) : (m.type === gridState.f && !isAnime(m)));
    });
    pool = sorted(pool, gridState.s);
    var g = $('hz-grid'); g.innerHTML = '';
    if (!pool.length) { g.innerHTML = '<div class="hz-empty" style="grid-column:1/-1">Aucun titre dans cette catégorie pour le moment.</div>'; $('hz-more').style.display = 'none'; return; }
    pool.slice(0, gridState.n).forEach(function (m) { g.appendChild(cardFor(m)); });
    $('hz-more').style.display = pool.length > gridState.n ? 'block' : 'none';
    $('hz-more').textContent = 'Voir plus (' + (pool.length - gridState.n) + ' restants)';
  }

  function drawRows(pool) {
    var box = $('hz-rows'); box.innerHTML = '';
    ROWS.forEach(function (r, i) {
      var list = sorted(pool.filter(r.f), r.sort).slice(0, 30);
      if (list.length < MIN_ROW) return;
      var id = 'hz-r-' + i, sec = document.createElement('div'); sec.className = 'slider-section';
      sec.innerHTML = '<h2 class="slider-title">' + esc(r.t) + '</h2>' +
        '<button class="slider-arrow left" onclick="scrollSlider(\'' + id + '\',-1)"><i class="fas fa-chevron-left"></i></button>' +
        '<div class="netflix-slider" id="' + id + '"></div>' +
        '<button class="slider-arrow right" onclick="scrollSlider(\'' + id + '\',1)"><i class="fas fa-chevron-right"></i></button>';
      box.appendChild(sec); fillSlider(id, list);
    });
  }

  function show() {
    var pool = db().filter(isHorror);
    var p = ensurePage();
    ['home-page', 'wishboard-page', 'profile-page', 'saga-details-page', 'sagas-page'].forEach(function (id) { var e = $(id); if (e) e.style.display = 'none'; });
    try { if (typeof closeProfilePage === 'function') closeProfilePage(); } catch (e) {}
    var mc = document.querySelector('.main-container'); if (mc) mc.style.display = 'none';
    document.querySelectorAll('.nav-link').forEach(function (a) { a.classList.remove('active'); });
    setBg($('hz-hero'), bgFor(pool));
    var nf = pool.filter(function (m) { return m.type === 'film' && !isAnime(m); }).length,
        ns = pool.filter(function (m) { return m.type === 'serie' && !isAnime(m); }).length,
        na = pool.filter(isAnime).length;
    $('hz-count').textContent = pool.length + ' titres · ' + nf + ' films · ' + ns + ' séries · ' + na + ' animés';
    drawRows(pool);
    gridState = { f: 'all', s: 'rating', n: GRID_STEP };
    p.querySelectorAll('.hz-chip').forEach(function (x) { x.classList.toggle('on', x.dataset.f === 'all'); });
    $('hz-sort').value = 'rating';
    drawGrid();
    p.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function hide() { var p = $('horror-page'); if (p) p.style.display = 'none'; }
  window.showHorrorPage = show;

  /* ---------- Branchements : la page se ferme dès qu'on va ailleurs ---------- */
  ['showCatalogue', 'showWishboard', 'openProfilePage', 'performSearch', 'setCategory', 'filterContent',
   'goToNewPage', 'showSagasPage', 'goToSagasFromMenu', 'openSaga'].forEach(function (n) {
    var o = window[n]; if (typeof o !== 'function') return;
    window[n] = function () { hide(); return o.apply(this, arguments); };
  });
  var oHome = window.showHome;
  if (typeof oHome === 'function') window.showHome = function () {
    hide();
    var r = oHome.apply(this, arguments);
    try { buildBand(); } catch (e) { console.warn('lk10-horreur', e); }
    return r;
  };
  try { if (db().length) buildBand(); } catch (e) {}
})();
