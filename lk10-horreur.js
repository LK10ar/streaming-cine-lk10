/* Ciné LK10 — lk10-horreur.js : « LE MOIS DE L'HORREUR » (style Netflix)
   1) Sur l'accueil : bandeau avec le titre, le bouton « Tout explorer » et une rangée de titres d'horreur.
   2) Bouton « Tout explorer » : ouvre une page dédiée avec TOUS les films, séries et animés d'horreur / gore / épouvante,
      classés en rangées thématiques (nouveautés, slashers, monstres, maisons hantées, morts-vivants, vampires, animés...)
      + le catalogue complet d'horreur avec filtres (Tous / Films / Séries / Animés) et tri.
   Rien n'est à remplir à la main : tout est calculé depuis moviesDB (genres « Horreur », « Epouvante-horreur » + mots-clés).
   3) ADMIN : bouton « Gérer la sélection » (ajouter / retirer n'importe quel film, série ou animé) + croix rouge sur chaque
      affiche de la page pour la retirer d'un clic. Enregistré sur le serveur (routes /api/horror-picks dans server.js).
   4) Mobile (affiches adaptées, panneau plein écran) et télé (navigation télécommande, touche Retour, allégé).
   À ajouter dans index.html, AVANT lk10-perf.js :  <script src="lk10-horreur.js"></script> */
(function () {
  'use strict';

  /* ---------- Réglages ---------- */
  var ONLY_OCTOBER = false;      // true = le bandeau d'accueil n'apparaît que du 1er octobre au 2 novembre
  var BANNER_IMG = 'https://imgsrc.cineserie.com/2023/01/art-le-clown-david-howard-thornton-terrifier-2.jpg?width=&height=&aspect_ratio=:';           // (facultatif) lien d'une image de fond ; vide = fond pris automatiquement sur un titre d'horreur
  var GRID_STEP = 42;            // nombre de titres ajoutés à chaque clic sur « Voir plus » (24 sur télé)
  var MIN_ROW = 4;               // une rangée avec moins de titres que ça est cachée

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
  var de = document.documentElement;
  var isTV = function () { if (de.classList.contains('lk10-tv')) return true; try { return localStorage.getItem('lk10_tv') === '1'; } catch (e) { return false; } };
  var step = function () { return isTV() ? 24 : GRID_STEP; };
  var isAdmin = function () { try { return typeof isAdminUnlocked !== 'undefined' && !!isAdminUnlocked; } catch (e) { return false; } };
  var shown = function (id) { var e = $(id); return !!e && getComputedStyle(e).display !== 'none'; };
  var db = function () { try { return moviesDB || []; } catch (e) { return []; } };
  var isAnime = function (m) { return /anime/.test(norm(m.genre)); };
  var yr = function (m) { return parseInt(m.year, 10) || 0; };
  var ts = function (m) { return m.createdAt ? new Date(m.createdAt).getTime() : 0; };

  /* ---------- Qu'est-ce qui est « horreur » ? ----------
     Règle stricte : le GENRE du titre doit contenir « Horreur » / « Epouvante-horreur » (ou gore / slasher).
     Les résumés ne comptent plus (c'était eux qui laissaient passer Willow, Star Wars...). */
  var G_HORROR = /horreur|epouvante|\bgore\b|slasher/;
  /* Liste noire : titres jamais affichés, même si leur genre est mal étiqueté (comparé sans accents ni majuscules) */
  var EXCLUDE = [
    'project derniere chance', 'projet derniere chance', 'derniere chance', 'hail mary',
    'secret de la plume', 'willow', 'mortal kombat', 'venom', 'batman', 'star wars', 'cite de la peur',
    'nouveaux mutant', 'new mutant', 'dernier souffle', 'yakuza', 'demon slave', 'demon slayer', 'elusive samurai', 'one piece',
    'pirates des caraibes', 'pirates of the caribbean', 'sisu', 'doctor on the edge', 'frankelda', 'ligue des justiciers', 'justice league',
    'crapaud et le maitre', 'mobile suit gundam', 'gundam', 'iron man', 'sword gai', 'swordgai', 'roar', 'mad max', 'freres scott', 'heavy metal'
  ];
  /* Liste blanche : titres toujours affichés (ex. : un vrai film d'horreur dont le genre n'est pas renseigné). Ajoute-les ici. */
  var INCLUDE = [];
  var flat = function (t) { return ' ' + norm(t).replace(/[^a-z0-9]+/g, ' ').trim() + ' '; };
  var has = function (list, t) { t = flat(t); for (var i = 0; i < list.length; i++) if (t.indexOf(flat(list[i])) > -1) return true; return false; };
  function text(m) { return norm((m.title || '') + ' ' + (m.desc || '') + ' ' + (m.genre || '')); }
  /* Sélection automatique (genres + listes ci-dessus), sans les choix de l'admin */
  function autoHorror(m) {
    if (!m || m.type === 'saga') return false;
    var t = m.title || '';
    if (has(EXCLUDE, t)) return false;
    if (has(INCLUDE, t)) return true;
    return G_HORROR.test(norm(m.genre));
  }
  /* Choix de l'admin (enregistrés sur le serveur) : ils passent avant tout le reste */
  var picks = { add: {}, remove: {} };
  function isHorror(m) {
    if (!m || m.type === 'saga') return false;
    if (picks.remove[m.id]) return false;
    if (picks.add[m.id]) return true;
    return autoHorror(m);
  }
  var tok = function () { try { return localStorage.getItem('monBadgeCineLK10') || ''; } catch (e) { return ''; } };
  function loadPicks() {
    return fetch(API_URL + '/api/horror-picks').then(function (r) { return r.json(); }).then(function (d) {
      picks = { add: {}, remove: {} };
      (d.add || []).forEach(function (i) { picks.add[i] = 1; });
      (d.remove || []).forEach(function (i) { picks.remove[i] = 1; });
      refresh();
    }).catch(function () {});
  }
  /* want = true : ajouter à l'horreur ; false : retirer. Si ça revient au choix automatique, on efface le choix manuel. */
  function setPick(m, want) {
    var before = { add: Object.assign({}, picks.add), remove: Object.assign({}, picks.remove) };
    var mode = want === autoHorror(m) ? 'reset' : (want ? 'add' : 'remove');
    delete picks.add[m.id]; delete picks.remove[m.id];
    if (mode === 'add') picks.add[m.id] = 1; else if (mode === 'remove') picks.remove[m.id] = 1;
    refresh();
    return fetch(API_URL + '/api/admin/horror-picks', {
      method: 'POST', headers: { 'Content-Type': 'application/json', authorization: tok() },
      body: JSON.stringify({ movieId: m.id, mode: mode })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.success) throw new Error(d.message || 'Erreur');
    }).catch(function (e) {
      picks = before; refresh(); alert((e && e.message) || 'Erreur de connexion.');
    });
  }

  /* ---------- Rangées thématiques (mots-clés cherchés dans titre + résumé + genres) ---------- */
  var kw = function (re) { return function (m) { return re.test(text(m)); }; };
  var ROWS = [
    { t: 'Nouveautés effrayantes pour Halloween', f: function () { return true; }, sort: 'recent' },
    { t: 'Les films d\'horreur les mieux notés', f: function (m) { return m.type === 'film' && !isAnime(m); }, sort: 'rating' },
    { t: 'Les séries qui font frissonner', f: function (m) { return m.type === 'serie' && !isAnime(m); }, sort: 'rating' },
    { t: 'Animés d\'horreur et de gore', f: isAnime, sort: 'rating' },
    { t: 'Cent pour sang slashers', f: kw(/slasher|\bgore\b|tueur|massacre|sanglant|machette|serial killer|boucher/), sort: 'rating' },
    { t: 'Monstres et créatures', f: kw(/monstre|creature|\bbete\b|requin|kaiju|alien|extraterrestre|mutant|araignee|geant|abomination/), sort: 'rating' },
    { t: 'Visitez nos maisons hantées', f: kw(/\bhant|fantome|poltergeist|spectre|revenant|manoir/), sort: 'rating' },
    { t: 'Réveillez les morts-vivants', f: kw(/zombie|mort-vivant|morts-vivants|infecte|infection|apocalypse|epidemie|virus|contamin/), sort: 'rating' },
    { t: 'Mordus de vampires ?', f: kw(/vampire|dracula|nosferatu|loup-garou|lycan/), sort: 'rating' },
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
      '.hz-manage{margin-left:10px;background:rgba(229,9,20,.9);color:#fff;border:0;border-radius:6px;padding:8px 15px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:22px;font-family:inherit}' +
      '.hz-manage:hover,.hz-manage:focus-visible{background:#ff1f2b;outline:none}' +
      '.hz-x{position:absolute;top:6px;right:6px;z-index:5;width:30px;height:30px;border-radius:50%;border:0;background:rgba(229,9,20,.95);color:#fff;font-size:14px;font-weight:900;cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:0 2px 8px #000;padding:0;line-height:1}' +
      '.netflix-card:hover .hz-x,.hz-x:focus{display:flex}' +
      '@media(pointer:coarse){.hz-x{display:flex;width:34px;height:34px}}' +
      '#hz-admin{position:fixed;inset:0;z-index:20050;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.86);padding:16px}' +
      '#hz-admin.on{display:flex}' +
      '.hz-ab{width:min(720px,100%);max-height:92vh;display:flex;flex-direction:column;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:18px;overflow:hidden;box-shadow:0 30px 80px #000}' +
      '.hz-at{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #1d1d1d}' +
      '.hz-at h3{flex:1;margin:0;color:#fff;font-size:17px;text-transform:uppercase;letter-spacing:.5px}' +
      '.hz-at h3 small{display:block;color:#888;font-size:11px;font-weight:400;text-transform:none;letter-spacing:0;margin-top:3px}' +
      '.hz-ax{width:40px;height:40px;border-radius:10px;border:0;background:#1b1b1b;color:#fff;font-size:18px;cursor:pointer}' +
      '.hz-af{padding:12px 18px;display:flex;flex-direction:column;gap:10px;border-bottom:1px solid #1d1d1d}' +
      '.hz-af input{background:#1b1b1b;border:1px solid #2c2c2c;border-radius:999px;color:#fff;padding:11px 16px;font-size:15px;outline:none;width:100%;box-sizing:border-box}' +
      '.hz-af input:focus{border-color:var(--primary,#ffde00)}' +
      '.hz-chips{display:flex;gap:8px;flex-wrap:wrap}' +
      '.hz-al{overflow-y:auto;overscroll-behavior:contain;padding:6px 18px 18px;flex:1}' +
      '.hz-ar{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #1c1c1c}' +
      '.hz-ar img{width:42px;height:62px;object-fit:cover;border-radius:5px;background:#1a1a1a;flex:0 0 auto}' +
      '.hz-ai{flex:1;min-width:0}' +
      '.hz-an{color:#fff;font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.hz-as{font-size:11px;color:#999;margin-top:3px;display:flex;gap:6px;flex-wrap:wrap}' +
      '.hz-tag{border-radius:8px;padding:1px 7px;font-weight:700;background:#222;color:#bbb}' +
      '.hz-tag.in{background:rgba(229,9,20,.18);color:#ff6b73}.hz-tag.man{background:rgba(255,222,0,.15);color:var(--primary,#ffde00)}' +
      '.hz-ab2{flex:0 0 auto;min-width:92px;min-height:42px;border-radius:999px;border:0;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;touch-action:manipulation}' +
      '.hz-ab2.add{background:var(--primary,#ffde00);color:#000}.hz-ab2.del{background:#2a2a2a;color:#ff6b73;border:1px solid #5a2a2d}' +
      '@media(max-width:600px){#hz-admin{padding:0}.hz-ab{width:100%;max-height:100dvh;height:100dvh;border-radius:0}.hz-ab2{min-width:80px}}' +
      '@media(max-width:480px){.hz-hero-in{padding:0 14px 26px}.hz-back,.hz-manage{margin-bottom:14px}}' +
      'html.lk10-tv .hz-manage,html.lk10-tv .hz-x,html.lk10-tv #hz-admin{display:none!important}' +
      'html.lk10-tv .hz-grid{grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:18px}html.lk10-tv .hz-band .netflix-card{flex-basis:170px;height:252px}' +
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
    addX(c, m);
    return c;
  }
  function addX(card, m) {
    if (!isAdmin() || isTV() || card.querySelector('.hz-x')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'hz-x'; b.title = 'Retirer du Mois de l\'horreur'; b.textContent = '✕';
    b.onclick = function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (confirm('Retirer « ' + m.title + ' » du Mois de l\'horreur ?')) setPick(m, false);
    };
    card.appendChild(b);
  }
  function fillSlider(id, list, withX) {
    if (typeof window.buildStandardSlider === 'function') window.buildStandardSlider(id, list);
    else { var b0 = $(id); b0.innerHTML = ''; list.forEach(function (m) { b0.appendChild(cardFor(m)); }); }
    var box = $(id), cards = box ? box.children : [];
    for (var i = 0; i < cards.length && i < list.length; i++) {
      cards[i].tabIndex = 0;                                       // sélectionnable à la télécommande / au clavier
      if (withX && !cards[i].querySelector('.hz-x')) addX(cards[i], list[i]);
    }
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
  var gridState = { f: 'all', s: 'rating', n: step() };

  function ensurePage() {
    var p = $('horror-page'); if (p) return p;
    css();
    p = document.createElement('div'); p.id = 'horror-page';
    p.innerHTML =
      '<div class="hz-hero" id="hz-hero"><div class="hz-hero-in"><button type="button" class="hz-back" id="hz-back"><i class="fas fa-arrow-left"></i> Retour</button>' +
      '<button type="button" class="hz-manage" id="hz-manage" style="display:none"><i class="fas fa-sliders-h"></i> Gérer la sélection</button>' +
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
    $('hz-manage').onclick = openAdmin;
    p.querySelectorAll('.hz-chip').forEach(function (b) {
      b.onclick = function () {
        p.querySelectorAll('.hz-chip').forEach(function (x) { x.classList.toggle('on', x === b); });
        gridState.f = b.dataset.f; gridState.n = step(); drawGrid();
      };
    });
    $('hz-sort').onchange = function () { gridState.s = this.value; gridState.n = step(); drawGrid(); };
    $('hz-more').onclick = function () { gridState.n += step(); drawGrid(); };
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
      box.appendChild(sec); fillSlider(id, list, true);
    });
  }

  /* Redessine le contenu de la page (sans remonter en haut, sans toucher aux filtres) */
  function paint() {
    var pool = db().filter(isHorror);
    var nf = pool.filter(function (m) { return m.type === 'film' && !isAnime(m); }).length,
        ns = pool.filter(function (m) { return m.type === 'serie' && !isAnime(m); }).length,
        na = pool.filter(isAnime).length;
    $('hz-count').textContent = pool.length + ' titres · ' + nf + ' films · ' + ns + ' séries · ' + na + ' animés';
    $('hz-manage').style.display = isAdmin() && !isTV() ? '' : 'none';
    drawRows(pool);
    drawGrid();
  }
  function refresh() {
    try { buildBand(); } catch (e) {}
    try { if (shown('horror-page')) paint(); } catch (e) {}
    try { if (shown('hz-admin')) adminRender(); } catch (e) {}
  }

  function show() {
    var pool = db().filter(isHorror);
    var p = ensurePage();
    ['home-page', 'wishboard-page', 'profile-page', 'saga-details-page', 'sagas-page'].forEach(function (id) { var e = $(id); if (e) e.style.display = 'none'; });
    try { if (typeof closeProfilePage === 'function') closeProfilePage(); } catch (e) {}
    var mc = document.querySelector('.main-container'); if (mc) mc.style.display = 'none';
    document.querySelectorAll('.nav-link').forEach(function (a) { a.classList.remove('active'); });
    setBg($('hz-hero'), bgFor(pool));
    gridState = { f: 'all', s: 'rating', n: step() };
    p.querySelectorAll('.hz-chip').forEach(function (x) { x.classList.toggle('on', x.dataset.f === 'all'); });
    $('hz-sort').value = 'rating';
    paint();
    p.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isTV()) setTimeout(function () { try { $('hz-back').focus({ preventScroll: true }); } catch (e) {} }, 80);
  }
  function hide() { var p = $('horror-page'); if (p) p.style.display = 'none'; }
  window.showHorrorPage = show;

  /* ---------- Panneau admin : ajouter / retirer des titres ---------- */
  var adm = { q: '', s: 'all', t: 'all', n: 40 };
  var typeOf = function (m) { return isAnime(m) ? 'anime' : m.type; };
  var typeLabel = function (m) { return isAnime(m) ? 'Animé' : (m.type === 'film' ? 'Film' : 'Série'); };
  function ensureAdmin() {
    var o = $('hz-admin'); if (o) return o;
    css();
    o = document.createElement('div'); o.id = 'hz-admin';
    o.innerHTML =
      '<div class="hz-ab"><div class="hz-at"><h3>Gérer le Mois de l\'horreur<small id="hz-acount"></small></h3><button type="button" class="hz-ax" id="hz-aclose" aria-label="Fermer">✕</button></div>' +
      '<div class="hz-af"><input id="hz-aq" type="search" placeholder="Rechercher un film, une série, un animé…" autocomplete="off">' +
      '<div class="hz-chips" id="hz-as"><button type="button" class="hz-chip on" data-s="all">Tous</button><button type="button" class="hz-chip" data-s="in">Dans l\'horreur</button><button type="button" class="hz-chip" data-s="out">Hors horreur</button></div>' +
      '<div class="hz-chips" id="hz-at2"><button type="button" class="hz-chip on" data-t="all">Tous types</button><button type="button" class="hz-chip" data-t="film">Films</button><button type="button" class="hz-chip" data-t="serie">Séries</button><button type="button" class="hz-chip" data-t="anime">Animés</button></div></div>' +
      '<div class="hz-al" id="hz-al"></div></div>';
    document.body.appendChild(o);
    $('hz-aclose').onclick = closeAdmin;
    o.onclick = function (e) { if (e.target === o) closeAdmin(); };
    $('hz-aq').oninput = function () { adm.q = norm(this.value.trim()); adm.n = 40; adminRender(); };
    $('hz-as').onclick = function (e) { var b = e.target.closest('button[data-s]'); if (!b) return; adm.s = b.dataset.s; adm.n = 40; chipOn('hz-as', b); adminRender(); };
    $('hz-at2').onclick = function (e) { var b = e.target.closest('button[data-t]'); if (!b) return; adm.t = b.dataset.t; adm.n = 40; chipOn('hz-at2', b); adminRender(); };
    return o;
  }
  function chipOn(id, b) { $(id).querySelectorAll('.hz-chip').forEach(function (x) { x.classList.toggle('on', x === b); }); }
  function openAdmin() { if (!isAdmin()) return; var o = ensureAdmin(); o.classList.add('on'); adminRender(); setTimeout(function () { try { $('hz-aq').focus({ preventScroll: true }); } catch (e) {} }, 60); }
  function closeAdmin() { var o = $('hz-admin'); if (o) o.classList.remove('on'); }
  function makeRow(m) {
    var inH = isHorror(m), manual = !!(picks.add[m.id] || picks.remove[m.id]);
    var r = document.createElement('div'); r.className = 'hz-ar';
    var img = /^https?:\/\//i.test(m.poster || '') ? '<img src="' + esc(m.poster) + '" alt="" loading="lazy">' : '<img alt="">';
    r.innerHTML = img + '<div class="hz-ai"><div class="hz-an">' + esc(m.title) + '</div><div class="hz-as"><span class="hz-tag">' + typeLabel(m) + '</span>' +
      (m.year ? '<span>' + esc(m.year) + '</span>' : '') + (inH ? '<span class="hz-tag in">Dans l\'horreur</span>' : '') +
      (manual ? '<span class="hz-tag man">' + (inH ? 'Ajouté à la main' : 'Retiré à la main') + '</span>' : '') + '</div></div>' +
      '<button type="button" class="hz-ab2 ' + (inH ? 'del' : 'add') + '">' + (inH ? 'Retirer' : 'Ajouter') + '</button>';
    r.querySelector('button').onclick = function () { setPick(m, !inH); };
    return r;
  }
  function adminRender() {
    var all = db().filter(function (m) { return m.type !== 'saga'; });
    var n = all.filter(isHorror).length;
    $('hz-acount').textContent = n + ' titres dans l\'horreur · ' + all.length + ' dans le catalogue';
    var list = all.filter(function (m) {
      var inH = isHorror(m);
      if (adm.s === 'in' && !inH) return false;
      if (adm.s === 'out' && inH) return false;
      if (adm.t !== 'all' && typeOf(m) !== adm.t) return false;
      return !adm.q || norm(m.title).indexOf(adm.q) > -1;
    });
    list.sort(function (a, b) { return String(a.title).localeCompare(String(b.title), 'fr'); });
    var box = $('hz-al'), top = box.scrollTop; box.innerHTML = '';
    if (!list.length) { box.innerHTML = '<div class="hz-empty">Aucun titre.</div>'; return; }
    list.slice(0, adm.n).forEach(function (m) { box.appendChild(makeRow(m)); });
    if (list.length > adm.n) {
      var more = document.createElement('button'); more.type = 'button'; more.className = 'hz-more'; more.textContent = 'Voir plus (' + (list.length - adm.n) + ' restants)';
      more.onclick = function () { adm.n += 40; adminRender(); }; box.appendChild(more);
    }
    box.scrollTop = top;
  }

  /* ---------- Touche Retour / Échap (télécommande, clavier, tablette) ---------- */
  var OVER = ['player-overlay', 'trailer-overlay', 'settings-overlay', 'notifications-overlay', 'report-overlay', 'random-overlay', 'actor-overlay', 'admin-overlay', 'analytics-overlay', 'wb-request-modal', 'wb-details-modal', 'discord-overlay', 'lk10-tvlink', 'av-picker'];
  window.addEventListener('keydown', function (e) {
    var kc = e.keyCode, back = e.key === 'Escape' || e.key === 'GoBack' || e.key === 'BrowserBack' || kc === 4 || kc === 461 || kc === 10009 || (kc === 8 && isTV());
    if (!back || e.defaultPrevented) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { if (shown('hz-admin') && e.key === 'Escape') { closeAdmin(); e.preventDefault(); e.stopImmediatePropagation(); } return; }
    if (shown('hz-admin')) { closeAdmin(); e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (!shown('horror-page')) return;
    for (var i = 0; i < OVER.length; i++) if (shown(OVER[i])) return;      // un autre écran est ouvert : c'est lui qui se ferme
    e.preventDefault(); e.stopImmediatePropagation();
    try { showHome(); } catch (x) { hide(); }
  }, true);

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
  loadPicks();
})();
