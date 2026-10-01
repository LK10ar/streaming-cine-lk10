/* Ciné LK10 — Suggestions : lien de menu + carte dans le Tableau de bord analytique.
   À ajouter dans index.html, juste avant </body> :  <script src="suggestions-admin.js"></script> */
(function () {
  const ST = ['Nouveau', 'Vu', 'Retenu', 'Fait', 'Refusé'], PER = 5;
  let all = [], page = 1;
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tok = () => localStorage.getItem('monBadgeCineLK10') || '';
  const api = (p, o = {}) => fetch(API_URL + p, { ...o, headers: { authorization: tok(), 'Content-Type': 'application/json' } }).then(r => r.json());
  const copy = async (t, b) => { try { await navigator.clipboard.writeText(t); } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } const o = b.textContent; b.textContent = 'Copié ✔'; setTimeout(() => b.textContent = o, 1500); };

  function addCard() {
    const m = document.querySelector('#analytics-overlay .analytics-modal'); if (!m || $('sg-card')) return;
    const c = document.createElement('div');
    c.id = 'sg-card'; c.className = 'users-list-container';
    c.style.cssText = 'margin:20px 0;border:1px solid var(--primary)';
    c.innerHTML = `<h3><i class="fas fa-lightbulb" style="color:var(--primary)"></i> Suggestions & évaluations du site <span id="sg-badge" style="background:var(--danger);color:#fff;border-radius:10px;padding:1px 8px;font-size:11px;margin-left:6px;display:none"></span></h3>
      <div id="sg-stats" style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#aaa;margin:8px 0"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="sg-q" class="analytics-search-input" style="flex:2;min-width:160px" placeholder="Rechercher (idée, pseudo, texte)...">
        <select id="sg-f" class="analytics-search-input" style="flex:1;min-width:110px"><option value="">Tous statuts</option>${ST.map(s => `<option>${s}</option>`).join('')}</select>
        <button id="sg-global" class="analytics-btn-header" style="margin-top:10px">Prompt global</button>
      </div>
      <div class="users-list-box" id="sg-list" style="max-height:none"></div><div class="analytics-pagination" id="sg-pg"></div>`;
    const grid = m.querySelector('.charts-grid'); grid ? m.insertBefore(c, grid) : m.appendChild(c);
    $('sg-q').oninput = () => { page = 1; render(); }; $('sg-f').onchange = () => { page = 1; render(); };
    $('sg-global').onclick = e => copy(globalPrompt(), e.target);
  }

  function globalPrompt() {
    const n = all.length, cnt = {}, rs = {}, rc = {};
    all.forEach(s => { (s.wants || []).forEach(w => cnt[w] = (cnt[w] || 0) + 1); (s.priorities || []).forEach(w => cnt[w] = (cnt[w] || 0) + 2);
      Object.entries(s.ratings || {}).forEach(([k, v]) => { rs[k] = (rs[k] || 0) + v; rc[k] = (rc[k] || 0) + 1; }); });
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `- ${k} (score ${v})`).join('\n');
    const avg = Object.keys(rs).map(k => `- ${k} : ${(rs[k] / rc[k]).toFixed(1)}/5`).join('\n');
    const pains = all.map(s => s.pain).filter(Boolean).slice(0, 15).map(p => '- ' + p).join('\n');
    const nps = n ? (all.reduce((a, s) => a + (s.nps || 0), 0) / n).toFixed(1) : '?';
    return `Tu es mon développeur full-stack senior. Voici la synthèse de ${n} évaluations de mon site de streaming "Ciné LK10" (front index.html vanilla sur GitHub Pages, back Node/Express/MongoDB sur Render, thème sombre + jaune #ffde00). Je te joins index.html et server.js ; ne supprime aucune fonctionnalité existante.

Déjà présent (ne pas recréer, seulement améliorer) : Accueil : carrousel héros, « Continuer à regarder », tendances du jour, rangées films / séries / animés (tendance, récents, populaires), Top 10, sagas incontournables, plateformes de streaming. Navigation : menus Films et Séries avec genres et années, tri (récents, anciens, mieux notés, A-Z), masquage des animés, page Nouveautés avec badge « Nouveau », recherche et fiches acteurs. Fiche : bande-annonce, lecteurs VF / VOSTFR multi-sources, liste d'épisodes avec recherche, partage par lien, commentaires, signalement de problème. Compte : favoris, à voir plus tard, Mon Top, historique, photo de profil, changement de mot de passe, notifications (cloche), accès VIP. Communauté : Wishboard (demandes + votes), Discord, mode Aléatoire. Admin : création de contenu et tableau de bord analytique.

Recommandation moyenne : ${nps}/10
Notes moyennes :
${avg}

Idées les plus demandées (priorité = x2) :
${top}

Problèmes cités :
${pains || '- (aucun)'}

Mission : vérifie dans mon index.html ce qui existe déjà avant tout ajout. 1) analyse et classe les chantiers par impact/effort, 2) implémente les quick wins et les 5 idées les plus demandées avec le code complet à coller, 3) termine par une checklist de tests.`;
  }

  function render() {
    const q = $('sg-q').value.toLowerCase(), f = $('sg-f').value;
    const list = all.filter(s => (!f || s.status === f) && (!q || JSON.stringify([s.pseudo, s.email, s.wants, s.pain, s.idea, s.extra]).toLowerCase().includes(q)));
    const nw = all.filter(s => s.status === 'Nouveau').length, b = $('sg-badge'); b.style.display = nw ? 'inline' : 'none'; b.textContent = nw + ' nouvelle' + (nw > 1 ? 's' : '');
    const nps = all.length ? (all.reduce((a, s) => a + (s.nps || 0), 0) / all.length).toFixed(1) : '-';
    $('sg-stats').innerHTML = `<span><b style="color:#fff">${all.length}</b> réponses</span><span>Recommandation moyenne <b style="color:var(--primary)">${nps}/10</b></span>`;
    const pages = Math.max(1, Math.ceil(list.length / PER)); page = Math.min(page, pages);
    $('sg-list').innerHTML = list.slice((page - 1) * PER, page * PER).map(s => `
      <div style="border-bottom:1px solid #2a2b36;padding:12px 0" data-id="${s._id}">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
          <b style="color:#fff">${esc(s.pseudo || 'Anonyme')}</b><span style="font-size:11px;color:#888">${new Date(s.date).toLocaleString('fr-FR')} · ${s.nps}/10</span></div>
        <div style="font-size:12px;color:#ccc;margin:6px 0">Top 3 : ${esc((s.priorities || []).join(' | ') || '-')}</div>
        ${s.pain ? `<div style="font-size:12px;color:#ff9a8f;margin-bottom:4px">Agacé par : ${esc(s.pain)}</div>` : ''}
        ${s.idea ? `<div style="font-size:12px;color:#9be7a8;margin-bottom:4px">Idée folle : ${esc(s.idea)}</div>` : ''}
        ${s.email ? `<div style="font-size:11px;color:#888">${esc(s.email)}</div>` : ''}
        <details style="margin:6px 0"><summary style="cursor:pointer;font-size:12px;color:var(--primary)">Voir le prompt Claude</summary>
          <pre style="white-space:pre-wrap;font-size:11px;background:#0d0e14;padding:10px;border-radius:6px;margin-top:6px;color:#bbb">${esc(s.claudePrompt)}</pre></details>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="analytics-page-btn sg-copy" style="padding:0 10px;width:auto;background:var(--primary);color:#000">Copier le prompt</button>
          <select class="analytics-search-input sg-st" style="width:auto;margin:0;padding:4px">${ST.map(x => `<option${x === s.status ? ' selected' : ''}>${x}</option>`).join('')}</select>
          <button class="analytics-page-btn sg-del" style="padding:0 10px;width:auto;color:#ff6b5e">Supprimer</button></div></div>`).join('') || '<div style="color:#aaa;text-align:center;padding:10px">Aucune suggestion pour le moment.</div>';
    $('sg-list').querySelectorAll('[data-id]').forEach(el => {
      const s = all.find(x => x._id === el.dataset.id);
      el.querySelector('.sg-copy').onclick = e => copy(s.claudePrompt, e.target);
      el.querySelector('.sg-st').onchange = async e => { await api('/api/admin/suggestions/' + s._id + '/status', { method: 'POST', body: JSON.stringify({ status: e.target.value }) }); s.status = e.target.value; render(); };
      el.querySelector('.sg-del').onclick = async () => { if (!confirm('Supprimer cette suggestion ?')) return; await api('/api/admin/suggestions/' + s._id, { method: 'DELETE' }); all = all.filter(x => x !== s); render(); };
    });
    $('sg-pg').innerHTML = pages > 1 ? Array.from({ length: pages }, (_, i) => `<button class="analytics-page-btn${i + 1 === page ? ' active' : ''}" data-p="${i + 1}">${i + 1}</button>`).join('') : '';
    $('sg-pg').querySelectorAll('button').forEach(b => b.onclick = () => { page = +b.dataset.p; render(); });
  }

  async function load() {
    addCard(); if (!$('sg-list')) return;
    $('sg-list').innerHTML = '<div style="color:#aaa;text-align:center;padding:10px">Chargement...</div>';
    try { const r = await api('/api/admin/suggestions'); all = r.success ? r.suggestions : []; if (!r.success) $('sg-list').innerHTML = '<div style="color:#ff6b5e;text-align:center;padding:10px">' + esc(r.message || 'Erreur') + (r.message === 'Admin uniquement' ? '<br><small>Le compte connecté n\'est pas celui de ADMIN_EMAIL sur Render.</small>' : '') + '</div>'; else render(); }
    catch (e) { $('sg-list').innerHTML = '<div style="color:#ff6b5e;text-align:center">Erreur de chargement.</div>'; }
  }

  function init() {
    addCard();
    if (typeof window.openAnalytics === 'function') { const o = window.openAnalytics; window.openAnalytics = async function () { const r = o.apply(this, arguments); load(); return r; }; }
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
