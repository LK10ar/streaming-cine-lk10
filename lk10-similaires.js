/* ============================================================
   Ciné LK10 — « Titres similaires » : algorithme + carrousel
   - Remplace l'ancien bloc « Titres similaires » de la fiche (il est masqué)
   - Carrousel : flèches (PC), glisser avec la souris (PC), balayage (mobile),
     accroche aux cartes, barre de progression, clavier ← →
   - Algorithme : genres pondérés par rareté, synopsis (TF-IDF), même saga,
     même réalisateur, acteurs communs, proximité d'année, note, diversité
   - v5 : 1 série = 1 carte (« Les Simpson · 37 saisons »), 1 saga de films = 1 carte,
     plus aucune autre saison de la série regardée, « affinités » (Simpson → Futurama,
     Family Guy, American Dad…), garde-fous animation / famille / documentaire,
     synonymes de genres, rafraîchissement instantané, plus de fuite d'écouteurs
   Chargement : <script src="lk10-similaires.js"></script> après les autres scripts.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------------------------------------------------- *
   *  1. ALGORITHME (fonctions pures, testables hors navigateur) *
   * ---------------------------------------------------------- */
  var STOP = {};
  ('dans avec pour cette leur leurs mais plus tout tous toute toutes elle elles sont etre avoir fait faire comme apres avant entre sous sans ainsi alors dont quand aussi celui celle ceux chez vers tres bien autre autres meme nous vous ils ses ces une des les qui que quoi lorsque depuis pendant donc encore votre notre cela cest ont est ete etait sera peut leurs son sur par aux the and with from that this will have they their into about film serie saison episode jeune nouvelle nouveau vie monde'
  ).split(' ').forEach(function (w) { STOP[w] = 1; });
  var TITLE_STOP = { le: 1, la: 1, les: 1, l: 1, un: 1, une: 1, des: 1, de: 1, du: 1, d: 1, the: 1, of: 1, a: 1, an: 1, et: 1, and: 1 };
  /* Les studios / plateformes sont rangés dans « genre » sur le site : ce ne sont pas des genres */
  var STUDIOS = {};
  ['marvel', 'dc', 'disney', 'pixar', 'dreamworks', 'apple tv', 'apple tv+', 'paramount', 'mgm+', 'mgm', 'mtv', '20th century fox', 'netflix', 'warner bros', 'universal', 'sony', 'lucasfilm', 'hbo']
    .forEach(function (s) { STUDIOS[s] = 1; });
  var SAME_FRANCHISE_MAX = 3;      /* films : au plus 3 titres de la saga regardée (suites, préquelles) */
  var SAME_UNIVERSE_SHOWS_MAX = 2; /* séries : au plus 2 séries dérivées du même univers (ex. spin-offs) */
  /* genres écrits différemment selon la source -> un seul vocabulaire */
  var GENRE_SYN = {
    'sci-fi': ['science-fiction'], 'science fiction': ['science-fiction'], 'sci-fi & fantasy': ['science-fiction', 'fantastique'],
    'action & adventure': ['action', 'aventure'], 'action et aventure': ['action', 'aventure'],
    'fantasy': ['fantastique'], 'fantaisie': ['fantastique'], 'comedy': ['comedie'], 'horror': ['horreur'],
    'drama': ['drame'], 'mystery': ['mystere'], 'kids': ['famille'], 'family': ['famille'], 'enfants': ['famille'],
    'war & politics': ['guerre'], 'documentary': ['documentaire']
  };
  /* « Affinités » : des séries/films qui se ressemblent même si les genres du catalogue sont maigres.
     Complète cette liste à volonté (mots en minuscules, sans accents). */
  var AFFINITY = [
    { label: 'Même humour', keys: ['simpson', 'futurama', 'family guy', 'les griffin', 'american dad', 'south park', 'rick et morty', 'rick and morty', 'bob s burgers', 'king of the hill', 'archer', 'big mouth', 'solar opposites', 'bojack horseman', 'disenchantment', 'cleveland show', 'duncanville', 'f is for family', 'paradise pd', 'brickleberry'] },
    { label: 'Même humour', keys: ['friends', 'how i met your mother', 'the big bang theory', 'modern family', 'brooklyn nine nine', 'the office', 'parks and recreation', 'young sheldon', 'two and a half men', 'new girl', 'scrubs'] },
    { label: 'Même style', keys: ['naruto', 'bleach', 'one piece', 'dragon ball', 'hunter x hunter', 'my hero academia', 'demon slayer', 'jujutsu kaisen', 'fairy tail', 'black clover', 'fullmetal alchemist', 'attack on titan', 'l attaque des titans'] },
    { label: 'Même ambiance', keys: ['breaking bad', 'better call saul', 'ozark', 'narcos', 'peaky blinders', 'sons of anarchy', 'the wire', 'money heist', 'la casa de papel'] },
    { label: 'Même ambiance', keys: ['game of thrones', 'house of the dragon', 'the witcher', 'the rings of power', 'les anneaux de pouvoir', 'le seigneur des anneaux', 'vikings', 'the last kingdom'] }
  ];

  function norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    return s;
  }
  function fam(t) {
    t = String(t || '').toLowerCase();
    if (t === 'film' || t === 'movie') return 'film';
    if (t === 'serie' || t === 'tv') return 'serie';
    if (t === 'anime') return 'anime';
    return 'other';
  }
  var FAM_FACTOR = {
    'film|film': 1, 'serie|serie': 1, 'anime|anime': 1,
    'film|serie': 0.92, 'serie|film': 0.92,
    'anime|serie': 0.9, 'serie|anime': 0.9,
    'film|anime': 0.75, 'anime|film': 0.75
  };
  function famFactor(a, b) { return FAM_FACTOR[a + '|' + b] || 0.5; }

  function rawGenres(m) { return String(m.genre || '').split(',').map(function (g) { return g.trim(); }).filter(Boolean); }
  function genreList(m) {          /* genres normalisés (synonymes fusionnés), sans studios */
    var out = [], seen = {};
    rawGenres(m).forEach(function (g) {
      var k = norm(g).trim(); if (!k || k === 'non classe' || STUDIOS[k]) return;
      (GENRE_SYN[k] || [k]).forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } });
    });
    return out;
  }
  function studioList(m) {
    return rawGenres(m).map(norm).map(function (g) { return g.trim(); }).filter(function (g) { return STUDIOS[g]; });
  }
  function genreLabels(m) {        /* genres à afficher (casse d'origine), sans studios ni doublons */
    var seen = {};
    return rawGenres(m).filter(function (g) {
      var k = norm(g).trim(); if (!k || k === 'non classe' || STUDIOS[k] || seen[k]) return false; seen[k] = 1; return true;
    });
  }
  function nameList(s) {
    return String(s || '').split(',').map(function (x) { return norm(x).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); })
      .filter(Boolean);
  }
  function descTokens(m) {
    var out = [];
    norm(m.desc).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).forEach(function (w) {
      if (w.length < 4 || STOP[w]) return;
      w = w.replace(/(s|x)$/, '');
      if (w.length < 4) return;
      out.push(w);
    });
    return out;
  }
  /* clé de « saga » : début du titre sans numéro / saison / sous-titre */
  function titleKey(m) {
    var t = norm(m.title).split(/\s*[:\-–—]\s*/)[0];
    t = t.replace(/\b(partie|part|saison|season|chapitre|chapter|episode|vol|volume)\b.*$/, '')
      .replace(/\b([ivx]{1,5}|\d{1,2})\s*$/, '')
      .replace(/[^a-z0-9 ]/g, ' ');
    return t.split(/\s+/).filter(function (w) { return w && !TITLE_STOP[w]; });
  }
  function sameFranchise(ka, kb) {
    if (!ka.length || !kb.length) return false;
    var n = Math.min(ka.length, kb.length), i;
    for (i = 0; i < n; i++) if (ka[i] !== kb[i]) break;
    if (i === 0) return false;
    if (i === n) return n >= 2 || ka[0].length >= 5;   // « evil dead » ⊂ « evil dead rise »
    return i >= 2;
  }

  /* « Les Simpson - Saison 37 » -> « Les Simpson » ; numéro de saison -> 37 */
  var SEASON_RE = /(?:^|[\s\-\u2013\u2014:,(])(?:saisons?|seasons?|s)\s*0*(\d{1,3})\b.*$/i;
  function baseTitle(t) {
    t = String(t || '').trim();
    var r = t.replace(SEASON_RE, '').replace(/[\s\-\u2013\u2014:,(]+$/, '').trim();
    return r || t;
  }
  function seasonNum(t) { var mm = SEASON_RE.exec(String(t || '')); return mm ? parseInt(mm[1], 10) : 0; }
  function plain(s) { return norm(s).replace(/[^a-z0-9]+/g, ' ').trim(); }
  AFFINITY.forEach(function (a) { a.keys = a.keys.map(plain); });
  function affinityIds(m) {
    var pad = ' ' + plain(baseTitle(m.title)) + ' ', out = [];
    AFFINITY.forEach(function (a, i) {
      for (var k = 0; k < a.keys.length; k++) {
        var key = a.keys[k], at = pad.indexOf(' ' + key);
        if (at < 0) continue;
        if (key.length >= 6 || pad.charAt(at + 1 + key.length) === ' ') { out.push(i); return; }
      }
    });
    return out;
  }

  var _cache = { db: null, len: -1, idx: null };
  function buildIndex(db) {
    var items = db.filter(function (m) { return m && m.id && fam(m.type) !== 'other' && m.title; });
    var N = items.length || 1, gdf = {}, tdf = {};
    items.forEach(function (m) {
      var gs = {}, ts = {};
      genreList(m).forEach(function (g) { gs[g] = 1; });
      descTokens(m).forEach(function (w) { ts[w] = 1; });
      Object.keys(gs).forEach(function (g) { gdf[g] = (gdf[g] || 0) + 1; });
      Object.keys(ts).forEach(function (w) { tdf[w] = (tdf[w] || 0) + 1; });
    });
    var info = {};
    items.forEach(function (m) {
      var gv = {}, gn = 0, tv = {}, tn = 0, counts = {};
      genreList(m).forEach(function (g) { var w = Math.log(1 + N / (1 + (gdf[g] || 0))); gv[g] = w; gn += w * w; });
      descTokens(m).forEach(function (w) { counts[w] = (counts[w] || 0) + 1; });
      Object.keys(counts).forEach(function (w) { var x = (1 + Math.log(counts[w])) * Math.log(1 + N / (1 + (tdf[w] || 0))); tv[w] = x; tn += x * x; });
      info[m.id] = {
        m: m, fam: fam(m.type), gv: gv, gk: Object.keys(gv), gn: Math.sqrt(gn) || 1,
        gs: Object.keys(gv).reduce(function (t, g) { return t + gv[g]; }, 0) || 1,
        tv: tv, tk: Object.keys(tv), tn: Math.sqrt(tn) || 1, studios: studioList(m),
        dirs: nameList(m.dir), cast: nameList(m.cast), key: titleKey(m),
        show: plain(baseTitle(m.title)), season: seasonNum(m.title), aff: affinityIds(m),
        year: parseInt(m.year, 10) || 0, rating: parseFloat(m.rating) || 0
      };
    });
    return { items: items, info: info };
  }
  function getIndex(db) {          /* l'index n'est recalculé que si le catalogue change */
    if (_cache.db === db && _cache.len === db.length && _cache.idx) return _cache.idx;
    _cache = { db: db, len: db.length, idx: buildIndex(db) };
    return _cache.idx;
  }
  function cosineK(ak, a, an, bk, b, bn) {
    var s = 0, i;
    if (ak.length > bk.length) { var t = a; a = b; b = t; t = ak; ak = bk; bk = t; }
    for (i = 0; i < ak.length; i++) { var w = b[ak[i]]; if (w) s += a[ak[i]] * w; }
    return s / (an * bn);
  }

  function score(c, x) {
    var gCos = cosineK(c.gk, c.gv, c.gn, x.gk, x.gv, x.gn);
    var dCos = cosineK(c.tk, c.tv, c.tn, x.tk, x.tv, x.tn);
    var inter = 0, i;
    for (i = 0; i < c.gk.length; i++) if (x.gv[c.gk[i]]) inter++;
    var uni = c.gk.length + x.gk.length - inter, jac = uni ? inter / uni : 0;   // même « combinaison » de genres
    var cov = 0;                                                                  // part (pondérée) des genres du titre regardé que x possède aussi
    for (i = 0; i < c.gk.length; i++) if (x.gv[c.gk[i]]) cov += c.gv[c.gk[i]];
    cov /= c.gs;
    var sameShow = c.fam !== 'film' && x.fam !== 'film' && !!c.show && c.show === x.show;   // autre saison de la même série
    var franchise = sameShow || sameFranchise(c.key, x.key);
    var affIdx = -1;
    for (i = 0; i < c.aff.length; i++) if (x.aff.indexOf(c.aff[i]) >= 0) { affIdx = c.aff[i]; break; }
    var sameDir = c.dirs.some(function (d) { return x.dirs.indexOf(d) >= 0; });
    var castHits = 0;
    c.cast.forEach(function (a, k) { if (x.cast.indexOf(a) >= 0) castHits += k < 3 ? 1.5 : 1; });
    var studio = c.studios.some(function (st) { return x.studios.indexOf(st) >= 0; });

    var s = 30 * gCos + 12 * jac + 16 * cov + 22 * Math.min(1, dCos * 2.2);
    if (franchise) s += 32;
    if (affIdx >= 0) s += 26;
    if (sameDir) s += 16;
    s += Math.min(18, castHits * 6);
    if (studio) s += 7;
    if (c.year && x.year) s += 8 * Math.exp(-Math.abs(c.year - x.year) / 10);
    if (x.rating >= 7) s += 3; else if (x.rating >= 5) s += 1.5; else if (x.rating > 0 && x.rating < 4) s -= 3;
    s *= famFactor(c.fam, x.fam);
    /* garde-fous : un dessin animé adulte ne ressemble pas à une série live, ni un doc à une fiction */
    if (!franchise && affIdx < 0) {
      var ca = c.gv.animation ? 1 : 0, xa = x.gv.animation ? 1 : 0;
      if (ca !== xa) s *= 0.55;
      else if (ca && (c.gv.famille ? 1 : 0) !== (x.gv.famille ? 1 : 0)) s *= 0.8;   // animation famille vs animation adulte
      if ((c.gv.documentaire ? 1 : 0) !== (x.gv.documentaire ? 1 : 0)) s *= 0.6;
    }

    var reason = franchise ? 'Même univers' : affIdx >= 0 ? AFFINITY[affIdx].label : sameDir ? 'Même réalisateur' : castHits >= 1.5 ? 'Même casting'
      : (studio && gCos > 0.6) ? 'Même studio' : (jac > 0.99 && c.gk.length >= 2 && c.fam === x.fam) ? 'Même style' : '';
    return { s: s, franchise: franchise, sameShow: sameShow, reason: reason };
  }

  function similar(db, current, limit) {
    limit = limit || 18;
    var idx = getIndex(db), c = idx.info[current.id];
    if (!c) c = buildIndex(db.concat([current])).info[current.id];
    if (!c) return [];
    var cands = [];
    idx.items.forEach(function (m) {
      if (m.id === current.id || !m.poster) return;
      var x = idx.info[m.id], r = score(c, x);
      if (r.sameShow) return;                 // les autres saisons de la série regardée ne sont pas des « similaires »
      if (r.s > 6) cands.push({ m: m, x: x, r: r });
    });
    cands.sort(function (a, b) { return b.r.s - a.r.s; });
    cands = cands.slice(0, 400);

    /* 1 série = 1 carte (toutes ses saisons repliées), 1 saga de films = 1 carte.
       Exceptions : les suites/préquelles du film regardé restent des cartes séparées (max 3),
       et on limite les séries dérivées du même univers (max 2). */
    var groups = [], showMap = {}, ownFilms = 0, ownShows = 0;
    function newGroup(cd) { var g = { best: cd, members: [cd], solo: false, fkey: cd.x.key }; groups.push(g); return g; }
    cands.forEach(function (cd) {
      var x = cd.x, g;
      if (x.fam === 'film') {
        if (cd.r.franchise) { if (ownFilms >= SAME_FRANCHISE_MAX) return; ownFilms++; newGroup(cd).solo = true; return; }
        if (x.key.length) for (var k = 0; k < groups.length; k++) {
          var gg = groups[k];
          if (!gg.solo && gg.best.x.fam === 'film' && gg.fkey.length && sameFranchise(gg.fkey, x.key)) { g = gg; break; }
        }
        if (g) g.members.push(cd); else newGroup(cd);
      } else {
        var sk = x.show || ('id' + cd.m.id);
        if (showMap[sk]) { showMap[sk].members.push(cd); return; }
        if (cd.r.franchise) { if (ownShows >= SAME_UNIVERSE_SHOWS_MAX) return; ownShows++; }
        showMap[sk] = newGroup(cd);
      }
    });
    cands = groups.map(function (g) {
      var best = g.best, n = g.members.length, target = best.m, isShow = best.x.fam !== 'film', rating = 0;
      g.members.forEach(function (cd) { rating = Math.max(rating, cd.x.rating || 0); });
      if (isShow && n > 1) {                  // on ouvre la première saison : c'est la porte d'entrée de la série
        g.members.forEach(function (cd) {
          var sn = cd.x.season || 999, tn = seasonNum(target.title) || 999;
          if (sn < tn) target = cd.m;
        });
      }
      var shown = isShow ? baseTitle(target.title) : target.title;
      var unit = isShow ? (best.x.fam === 'anime' ? 'saison' : 'saison') : 'film';
      return {
        m: target, x: best.x, r: best.r, title: shown, count: n, rating: rating,
        countLabel: n > 1 ? (n + ' ' + unit + 's') : ''
      };
    });

    /* diversité (MMR) : on évite une rangée de titres quasi identiques entre eux */
    var out = [];
    while (out.length < limit && cands.length) {
      var best = -1, bestV = -1e9;
      for (var a = 0; a < cands.length; a++) {
        var pen = 0;
        for (var j = 0; j < out.length; j++) {
          if (cands[a].r.franchise && out[j].r.franchise) continue;
          pen = Math.max(pen, cosineK(cands[a].x.gk, cands[a].x.gv, cands[a].x.gn, out[j].x.gk, out[j].x.gv, out[j].x.gn));
        }
        var v = cands[a].r.s - 14 * pen;
        if (v > bestV) { bestV = v; best = a; }
      }
      out.push(cands.splice(best, 1)[0]);
    }
    return out.map(function (o) { return { m: o.m, title: o.title, count: o.count, countLabel: o.countLabel, rating: o.rating, reason: o.r.reason, score: o.r.s, fr: o.r.franchise }; });
  }

  function group(m) { return fam(m.type) === 'film' ? 'film' : 'serie'; }
  /* choisit n titres : ~30 % de l'autre catégorie (séries si on regarde un film, et inversement),
     mais seulement des titres vraiment pertinents (>= 60 % du meilleur score) */
  function mix(pool, curGroup, n) {
    var maxS = 0; pool.forEach(function (it) { if (it.score > maxS) maxS = it.score; });
    var other = pool.filter(function (it) { return group(it.m) !== curGroup && it.score >= 0.6 * maxS; });
    var reserve = other.slice(0, Math.min(other.length, Math.round(n * 0.3)));
    var rest = pool.filter(function (it) { return reserve.indexOf(it) < 0; }).slice(0, n - reserve.length);
    return reserve.concat(rest).sort(function (a, b) { return b.score - a.score; });
  }

  if (typeof document === 'undefined') { module.exports = { similar: similar, mix: mix, group: group, genreLabels: genreLabels, titleKey: titleKey, sameFranchise: sameFranchise, baseTitle: baseTitle, seasonNum: seasonNum }; return; }

  /* ---------------------------------------------------------- *
   *  2. STYLES                                                  *
   * ---------------------------------------------------------- */
  var css = '\
#lk10-sim{display:block;width:100%;max-width:100%;margin:26px auto 8px;padding:0 20px;position:relative;box-sizing:border-box;overflow:hidden;align-self:center;flex:0 0 auto}\
@media (max-width:600px){#lk10-sim{padding:0 12px}}\
#lk10-sim *{box-sizing:border-box}\
#lk10-sim .ls-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}\
#lk10-sim .ls-title{margin:0;font-size:18px;font-weight:700;color:#fff;display:flex;align-items:center;gap:9px}\
#lk10-sim .ls-title i{color:var(--primary,#ffde00)}\
#lk10-sim .ls-nav{display:none;gap:8px}\
#lk10-sim .ls-btn{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:#161616;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:.18s}\
#lk10-sim .ls-btn:hover:not(:disabled){background:var(--primary,#ffde00);color:#000;border-color:var(--primary,#ffde00)}\
#lk10-sim .ls-btn:disabled{opacity:.3;cursor:default}\
#lk10-sim .ls-wrap{position:relative;width:100%;min-width:0}\
#lk10-sim .ls-wrap:before,#lk10-sim .ls-wrap:after{content:"";position:absolute;top:0;bottom:30px;width:26px;z-index:2;pointer-events:none;opacity:0;transition:opacity .2s}\
#lk10-sim .ls-wrap:before{left:0;background:linear-gradient(90deg,rgba(11,11,11,.9),transparent)}\
#lk10-sim .ls-wrap:after{right:0;background:linear-gradient(270deg,rgba(11,11,11,.9),transparent)}\
#lk10-sim .ls-wrap.can-left:before,#lk10-sim .ls-wrap.can-right:after{opacity:1}\
#lk10-sim .ls-track{width:100%;min-width:0;max-width:100%;display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:none;padding:2px 2px 6px;outline:none;touch-action:pan-x pan-y}\
#lk10-sim .ls-track::-webkit-scrollbar{display:none;height:0}\
#lk10-sim .ls-track.dragging{scroll-snap-type:none;scroll-behavior:auto;cursor:grabbing}\
#lk10-sim .ls-card{flex:0 0 var(--ls-w,150px);width:var(--ls-w,150px);min-width:0;scroll-snap-align:start;cursor:pointer;user-select:none;-webkit-user-select:none;outline:none;color:#ddd}\
#lk10-sim .ls-poster{position:relative;aspect-ratio:2/3;border-radius:10px;overflow:hidden;background:#1b1b1b;border:1px solid rgba(255,255,255,.08);transition:transform .2s,border-color .2s,box-shadow .2s}\
#lk10-sim .ls-poster img{width:100%;height:100%;object-fit:cover;display:block;-webkit-user-drag:none;pointer-events:none}\
#lk10-sim .ls-card:hover .ls-poster,#lk10-sim .ls-card:focus-visible .ls-poster{transform:translateY(-3px);border-color:var(--primary,#ffde00);box-shadow:0 8px 20px rgba(0,0,0,.6)}\
#lk10-sim .ls-rate{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.78);color:var(--primary,#ffde00);font-size:11px;font-weight:700;padding:2px 6px;border-radius:12px;border:1px solid rgba(255,222,0,.45)}\
#lk10-sim .ls-count{position:absolute;top:6px;left:6px;background:rgba(0,0,0,.78);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:12px;border:1px solid rgba(255,255,255,.25)}\
#lk10-sim .ls-why{position:absolute;left:6px;bottom:6px;right:6px;background:rgba(255,222,0,.95);color:#000;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\
#lk10-sim .ls-name{margin-top:7px;font-size:13px;font-weight:600;color:#eee;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\
#lk10-sim .ls-sub{font-size:11px;color:#8a8a8a;margin-top:2px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\
#lk10-sim .ls-prog{height:3px;border-radius:3px;background:rgba(255,255,255,.1);margin-top:8px;overflow:hidden}\
#lk10-sim .ls-prog span{display:block;height:100%;width:30%;background:var(--primary,#ffde00);border-radius:3px;transform-origin:left;transition:margin-left .12s linear,width .2s}\
#lk10-sim .ls-left{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;min-width:0}\
#lk10-sim .ls-chips{display:flex;gap:6px;flex-wrap:wrap}\
#lk10-sim .ls-chip{border:1px solid rgba(255,222,0,.55);background:rgba(255,222,0,.08);color:var(--primary,#ffde00);border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;line-height:1.2;white-space:nowrap;cursor:default}\
@media (max-width:600px){#lk10-sim .ls-head{flex-wrap:wrap}#lk10-sim .ls-left{flex:1 1 100%;flex-direction:column;align-items:flex-start;gap:9px}#lk10-sim .ls-chips{flex-wrap:nowrap;overflow-x:auto;width:100%;scrollbar-width:none;-webkit-overflow-scrolling:touch}#lk10-sim .ls-chips::-webkit-scrollbar{display:none}}\
@media (hover:hover) and (pointer:fine){#lk10-sim .ls-nav{display:flex}#lk10-sim .ls-track{cursor:grab}}\
@media (prefers-reduced-motion:reduce){#lk10-sim .ls-track{scroll-behavior:auto}}';
  var st = document.createElement('style'); st.id = 'lk10-sim-css'; st.textContent = css; document.head.appendChild(st);

  /* ---------------------------------------------------------- *
   *  3. CARROUSEL                                               *
   * ---------------------------------------------------------- */
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  var TYPE_LABEL = { film: 'Film', movie: 'Film', serie: 'Série', tv: 'Série', anime: 'Animé' };

  function scrollContainerTop() {
    var node = document.getElementById('lk10-sim'), done = false;
    while (node && node !== document.body) {
      node = node.parentElement; if (!node) break;
      var oy = getComputedStyle(node).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 4) { node.scrollTo({ top: 0, behavior: 'smooth' }); done = true; }
    }
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }
  function openTitle(id) {
    if (typeof openP === 'function') { openP(id); setTimeout(scrollContainerTop, 30); }
  }

  function build(pool, cur) {
    var SHOW = 18;
    var box = el('section'); box.id = 'lk10-sim'; box.setAttribute('aria-label', 'Titres similaires');
    var head = el('div', 'ls-head'), title = el('h3', 'ls-title');
    title.innerHTML = '<i class="fas fa-clone"></i>'; title.appendChild(document.createTextNode('Titres similaires'));
    var nav = el('div', 'ls-nav'), prev = el('button', 'ls-btn'), next = el('button', 'ls-btn');
    prev.type = next.type = 'button'; prev.setAttribute('aria-label', 'Précédent'); next.setAttribute('aria-label', 'Suivant');
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>'; next.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nav.appendChild(prev); nav.appendChild(next);
    var left = el('div', 'ls-left'); left.appendChild(title);
    var genres = genreLabels(cur);
    if (genres.length) {
      var chips = el('div', 'ls-chips');
      genres.slice(0, 4).forEach(function (g) { chips.appendChild(el('span', 'ls-chip', g)); });
      left.appendChild(chips);
    }
    head.appendChild(left); head.appendChild(nav);

    var wrap = el('div', 'ls-wrap'), track = el('div', 'ls-track'); track.tabIndex = 0; track.setAttribute('role', 'list');
    function fillCards(items) {
      track.innerHTML = '';
      items.forEach(function (it) {
      var m = it.m, card = el('div', 'ls-card'); card.setAttribute('role', 'listitem'); card.tabIndex = 0; card.dataset.id = m.id;
      var p = el('div', 'ls-poster'), img = document.createElement('img');
      img.loading = 'lazy'; img.decoding = 'async'; img.alt = it.title || m.title; img.draggable = false; img.src = m.poster;
      img.onerror = function () { img.style.display = 'none'; };
      p.appendChild(img);
      var rt = it.rating || parseFloat(m.rating) || 0;
      if (rt) p.appendChild(el('span', 'ls-rate', '★ ' + rt.toFixed(1)));
      if (it.count > 1) p.appendChild(el('span', 'ls-count', it.countLabel));
      if (it.reason) p.appendChild(el('span', 'ls-why', it.reason));
      var gl = genreLabels(m).slice(0, 3);
      var sub = [TYPE_LABEL[String(m.type).toLowerCase()] || '', it.count > 1 && it.countLabel ? it.countLabel : (m.year || '')].concat(gl).filter(Boolean).join(' · ');
      card.appendChild(p); card.appendChild(el('div', 'ls-name', it.title || m.title)); card.appendChild(el('div', 'ls-sub', sub));
      card._id = m.id; track.appendChild(card);
      });
    }
    fillCards(mix(pool, group(cur), SHOW));
    wrap.appendChild(track);
    var prog = el('div', 'ls-prog'), bar = el('span'); prog.appendChild(bar);
    box.appendChild(head); box.appendChild(wrap); box.appendChild(prog);

    function update() {
      var max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft >= max - 2;
      wrap.classList.toggle('can-left', track.scrollLeft > 2); wrap.classList.toggle('can-right', track.scrollLeft < max - 2);
      var ratio = track.scrollWidth ? track.clientWidth / track.scrollWidth : 1;
      var w = Math.max(12, Math.min(100, ratio * 100));
      bar.style.width = w + '%'; bar.style.marginLeft = (max > 0 ? (track.scrollLeft / max) * (100 - w) : 0) + '%';
      prog.style.visibility = max > 2 ? 'visible' : 'hidden';
    }
    function align() {              /* même largeur que la fiche, centré */
      var da = document.querySelector('.details-area'), w = da ? da.getBoundingClientRect().width : 0;
      if (w > 120) { box.style.width = w + 'px'; } else { box.style.width = '100%'; }
    }
    function layout() {             /* nombre de cartes visibles selon la largeur disponible */
      var tw = track.clientWidth; if (tw < 50) return;
      var n = tw < 420 ? 2.4 : tw < 620 ? 3.4 : tw < 820 ? 4.4 : tw < 1000 ? 5.4 : 6.4, gap = 12;
      box.style.setProperty('--ls-w', Math.floor((tw - gap * Math.floor(n)) / n) + 'px');
    }
    function relayout() { align(); layout(); update(); }
    box._layout = relayout;
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { relayout(); });
      var da0 = document.querySelector('.details-area'); if (da0) ro.observe(da0);
      ro.observe(track);
    }
    var raf = 0;
    track.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); }); }, { passive: true });
    window.addEventListener('resize', relayout);
    function page(dir) { track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: 'smooth' }); }
    prev.onclick = function () { page(-1); }; next.onclick = function () { page(1); };
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); page(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); page(-1); }
      else if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('ls-card')) { e.preventDefault(); openTitle(e.target._id); }
    });

    /* glisser à la souris (PC) ; le tactile utilise le défilement natif */
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = track.scrollLeft;
    });
    function onMove(e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('dragging'); }
      if (moved) track.scrollLeft = sl - dx;
    }
    function onUp() {
      if (!down) return; down = false;
      if (moved) { track.classList.remove('dragging'); setTimeout(function () { moved = false; }, 0); }
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    box._destroy = function () {     /* évite d'empiler des écouteurs à chaque changement de fiche */
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', relayout); if (ro) ro.disconnect();
    };
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); return; }
      var c = e.target.closest ? e.target.closest('.ls-card') : null;
      if (c) openTitle(c._id);
    });
    box._update = update;
    return box;
  }

  /* ---------------------------------------------------------- *
   *  4. BRANCHEMENT SUR LA FICHE                                *
   * ---------------------------------------------------------- */
  var lastKey = '', timer = 0, observer = null;

  function detailRoot() {
    var t = document.getElementById('dp-title'), c = document.getElementById('comments-list');
    if (!t) return null;
    var n = t.parentElement;
    while (n && n !== document.body) { if (c && n.contains(c)) return n; n = n.parentElement; }
    return t.closest('.details-area') ? t.closest('.details-area').parentElement : null;
  }
  /* masque l'ancien bloc « Titres similaires » et renvoie son conteneur */
  function hideOld(root) {
    var title = document.getElementById('dp-title'), comments = document.getElementById('comments-list'), found = null;
    var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      if (!/^\s*titres?\s+similaires?\s*$/i.test(n.nodeValue)) continue;
      var h = n.parentElement;
      if (!h || h.closest('#lk10-sim')) continue;
      var top = h;
      while (top.parentElement && top.parentElement !== document.body &&
             !top.parentElement.contains(title) && !(comments && top.parentElement.contains(comments))) top = top.parentElement;
      if (top.id === 'lk10-sim' || top.contains(title)) continue;
      if (top.style.display !== 'none') top.style.display = 'none';
      top.setAttribute('data-lk10-old-similar', '1');
      found = top;
    }
    return found;
  }
  function place(box, root) {
    var old = hideOld(root) || document.querySelector('[data-lk10-old-similar]');
    if (old && old.parentNode) { old.parentNode.insertBefore(box, old); return; }
    var cs = document.querySelector('.comments-section');
    if (cs && cs.parentNode) cs.parentNode.insertBefore(box, cs);
  }
  function render() {
    var m = (typeof currentMovie !== 'undefined') ? currentMovie : null;
    var title = document.getElementById('dp-title');
    if (!m || !title || !title.offsetParent || typeof moviesDB === 'undefined' || !moviesDB.length) return;
    if (String(title.textContent).trim() !== String(m.title).trim()) return;     // la fiche n'a pas fini de se remplir
    var root = detailRoot(), key = m.id + '|' + moviesDB.length, mine = document.getElementById('lk10-sim');
    if (mine && lastKey === key) return;
    var list = [];
    try { list = similar(moviesDB, m, 60); } catch (e) { console.error('[similaires]', e); }
    if (mine) { if (mine._destroy) mine._destroy(); mine.remove(); }
    lastKey = key;
    if (!list.length) return;
    var box = build(list, m);
    place(box, root);
    requestAnimationFrame(function () { box._layout(); setTimeout(box._layout, 120); });
    if (root && window.MutationObserver) {
      if (observer) observer.disconnect();
      var pending = 0;
      observer = new MutationObserver(function () {
        if (pending) return;
        pending = setTimeout(function () { pending = 0; hideOld(root); }, 150);
      });
      observer.observe(root, { childList: true, subtree: true });
    }
  }
  /* on se branche sur openP() : la rangée se met à jour dès qu'une fiche s'ouvre (le minuteur n'est qu'un filet de sécurité) */
  if (typeof window.openP === 'function' && !window.openP._lk10) {
    var _openP = window.openP;
    window.openP = function () {
      var r = _openP.apply(this, arguments);
      setTimeout(render, 60); setTimeout(render, 350);
      return r;
    };
    window.openP._lk10 = true;
  }
  timer = setInterval(render, 1200);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
})();
