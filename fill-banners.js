/* Ciné LK10 — remplit automatiquement les "banner" vides de avatars-data.js (images TMDB).
   Usage (Node 18+), dans le dossier qui contient avatars-data.js :  node fill-banners.js
   ⚠ La clé est écrite dans ce fichier : ne le mets JAMAIS sur GitHub / GitHub Pages.
   Résultat : avatars-data.js est mis à jour (sauvegarde dans avatars-data.backup.js). */
const fs = require('fs'), vm = require('vm');
const KEY = process.env.TMDB_KEY || '614de682d771260cd012aec43f52b4ee'; // clé API TMDB (v3)
if (!KEY) { console.error('Il manque la clé TMDB.'); process.exit(1); }

const FILE = 'avatars-data.js';
const SKIP = ['divers', 'the classics', 'animaux', "international women's day"]; // pas de bannière automatique
// Nom du thème -> texte à chercher sur TMDB quand le nom seul ne suffit pas
const QUERY = {
  'WWE': 'WWE Raw', 'BTS': 'BTS', 'Bubble': 'Bubble 2022', 'Frankenstein': 'Frankenstein 2025 Guillermo del Toro',
  'Dark': 'Dark 2017', 'Lupin': 'Lupin 2021', 'Vivo': 'Vivo 2021', 'Pokémon': 'Pokémon',
  'Twilight of the Gods': 'Twilight of the Gods', 'Wednesday': 'Wednesday 2022', 'The Gentlemen': 'The Gentlemen 2024',
  'Outer Banks': 'Outer Banks', 'Over the Moon': 'Over the Moon 2020', 'Heeramandi': 'Heeramandi',
  'Money Heist': 'La Casa de Papel', 'My Melody & Kuromi': 'Onegai My Melody Kuromi', 'Black Mirror': 'Black Mirror',
};
const SIZE = 'w1280'; // taille de l'image (w780 = plus léger, original = max)

const src = fs.readFileSync(FILE, 'utf8');
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(src, ctx);
const pack = ctx.window.AVATAR_PACK;

async function find(q) {
  const u = 'https://api.themoviedb.org/3/search/multi?include_adult=false&language=fr-FR&query=' + encodeURIComponent(q) + '&api_key=' + KEY;
  const r = await fetch(u); if (!r.ok) throw new Error('TMDB ' + r.status);
  const d = await r.json();
  const hit = (d.results || []).filter(x => x.backdrop_path && (x.media_type === 'tv' || x.media_type === 'movie'))
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0];
  return hit ? 'https://image.tmdb.org/t/p/' + SIZE + hit.backdrop_path : '';
}

(async () => {
  fs.writeFileSync('avatars-data.backup.js', src);
  let ok = 0, miss = [];
  for (const t of pack) {
    if (t.banner || SKIP.includes(String(t.name).toLowerCase())) continue;
    try {
      const b = await find(QUERY[t.name] || t.name);
      if (b) { t.banner = b; ok++; console.log('✔', t.name); } else { miss.push(t.name); console.log('✘', t.name); }
    } catch (e) { miss.push(t.name); console.log('✘', t.name, e.message); }
    await new Promise(r => setTimeout(r, 120));
  }
  fs.writeFileSync(FILE, 'window.AVATAR_PACK = ' + JSON.stringify(pack, null, 1) + ';\n');
  console.log('\n' + ok + ' bannières ajoutées.' + (miss.length ? ' Sans résultat : ' + miss.join(', ') : ''));
})();
