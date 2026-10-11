/* =====================================================================
   CINÉ LK10 — ADMIN : ORDRE DES SAISONS / ARCS D'UNE SÉRIE
   ---------------------------------------------------------------------
   - Ajoute un bouton (visible en mode admin) dans le header.
   - Ouvre un panneau où l'on classe les saisons d'une même série
     (ex : tous les "Bleach - ..."), par glisser-déposer, flèches ▲▼,
     numéro de position, ou en collant une liste ordonnée.
   - Enregistre un champ `sortOrder` sur chaque fiche (route serveur
     POST /api/admin/movies/reorder).
   - Expose window.applySeriesOrder(list) : utilisé par updateGrid() pour
     regrouper les saisons d'une même série, dans l'ordre choisi.
   ===================================================================== */
(function () {
    'use strict';

    const TOKEN_KEY = 'monBadgeCineLK10';
    const SPLIT_RE = /\s+[-–—:]\s+/;

    const strip = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const baseTitle = m => String(m.title || '').split(SPLIT_RE)[0].trim();
    const keyOf = m => (m.type || '') + '|' + strip(baseTitle(m)).replace(/[^a-z0-9]+/g, '');
    const hasOrder = m => typeof m.sortOrder === 'number' && isFinite(m.sortOrder);
    const db = () => (typeof moviesDB !== 'undefined' && Array.isArray(moviesDB)) ? moviesDB : [];
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /* ------------------------------------------------------------------
       1) HOOK POUR LA GRILLE PRINCIPALE
       Regroupe les saisons ordonnées d'une même série à l'endroit où la
       première apparaît, puis les classe selon sortOrder.
       ------------------------------------------------------------------ */
    window.applySeriesOrder = function (list) {
        if (!Array.isArray(list)) return list;
        const groups = new Map();
        list.forEach(m => {
            if (m.type === 'serie' && hasOrder(m)) {
                const k = keyOf(m);
                if (!groups.has(k)) groups.set(k, []);
                groups.get(k).push(m);
            }
        });
        if (!groups.size) return list;

        const out = [];
        const done = new Set();
        list.forEach(m => {
            if (m.type === 'serie' && hasOrder(m)) {
                const k = keyOf(m);
                if (done.has(k)) return;
                done.add(k);
                out.push(...groups.get(k).sort((a, b) => a.sortOrder - b.sortOrder));
            } else {
                out.push(m);
            }
        });
        return out;
    };

    /* ------------------------------------------------------------------
       2) STYLE
       ------------------------------------------------------------------ */
    const css = document.createElement('style');
    css.textContent = `
    #so-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.88); z-index:6500; justify-content:center; align-items:flex-start; overflow-y:auto; padding:20px 0; }
    #so-overlay.open { display:flex; }
    .so-modal { background:#1a1b26; width:720px; max-width:95%; border-radius:10px; padding:20px; border:1px solid #333; color:#ccc; box-shadow:0 0 30px rgba(0,0,0,.6); }
    .so-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
    .so-head h2 { margin:0; font-size:18px; color:#fff; }
    .so-close { background:none; border:none; color:#aaa; font-size:28px; cursor:pointer; line-height:1; }
    .so-close:hover { color:#fff; }
    .so-pick { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
    .so-pick input, .so-pick select, .so-paste textarea { background:#0f0f14; border:1px solid #333; color:#eee; border-radius:6px; padding:9px 10px; font-size:14px; font-family:inherit; }
    .so-pick input { flex:1; min-width:140px; }
    .so-pick select { flex:2; min-width:200px; }
    .so-hint { font-size:12px; color:#888; margin:0 0 10px; }
    .so-list { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
    .so-row { display:flex; align-items:center; gap:10px; background:#11121a; border:1px solid #2a2b38; border-radius:8px; padding:6px 10px 6px 6px; cursor:grab; transition:border-color .15s, opacity .15s; }
    .so-row.so-drag { opacity:.35; }
    .so-row.so-over { border-color:var(--primary,#ffde00); }
    .so-num { width:30px; text-align:center; font-weight:900; color:var(--primary,#ffde00); font-size:15px; flex:none; }
    .so-thumb { width:36px; height:52px; border-radius:4px; background:#222 center/cover no-repeat; flex:none; }
    .so-title { flex:1; min-width:0; color:#fff; font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .so-title small { display:block; color:#777; font-weight:400; font-size:11px; }
    .so-ctrl { display:flex; align-items:center; gap:4px; flex:none; }
    .so-btn { background:#252636; border:1px solid #3a3b4d; color:#ddd; border-radius:5px; width:30px; height:30px; cursor:pointer; font-size:13px; }
    .so-btn:hover:not(:disabled) { border-color:var(--primary,#ffde00); color:var(--primary,#ffde00); }
    .so-btn:disabled { opacity:.25; cursor:default; }
    .so-pos { width:46px; height:30px; text-align:center; background:#0f0f14; border:1px solid #333; color:#eee; border-radius:5px; font-size:13px; }
    .so-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
    .so-primary { background:var(--primary,#ffde00); color:#000; border:none; border-radius:6px; padding:10px 18px; font-weight:800; cursor:pointer; }
    .so-primary:disabled { opacity:.5; cursor:default; }
    .so-ghost { background:#252636; color:#ddd; border:1px solid #3a3b4d; border-radius:6px; padding:10px 14px; cursor:pointer; }
    .so-ghost:hover { border-color:var(--primary,#ffde00); }
    .so-danger { margin-left:auto; color:#e74c3c; border-color:#5b2a26; }
    .so-status { font-size:13px; margin-top:10px; min-height:18px; }
    .so-status.ok { color:#2ecc71; } .so-status.warn { color:#f1c40f; } .so-status.err { color:#e74c3c; }
    .so-paste { margin-top:16px; border-top:1px solid #2a2b38; padding-top:12px; }
    .so-paste summary { cursor:pointer; color:#aaa; font-size:13px; margin-bottom:8px; }
    .so-paste textarea { width:100%; min-height:130px; resize:vertical; box-sizing:border-box; font-family:monospace; font-size:12px; }
    .so-empty { color:#888; padding:20px; text-align:center; }
    @media (max-width:520px) { .so-modal { padding:14px; } .so-pos { display:none; } .so-thumb { display:none; } }
    `;
    document.head.appendChild(css);

    /* ------------------------------------------------------------------
       3) MARKUP
       ------------------------------------------------------------------ */
    const overlay = document.createElement('div');
    overlay.id = 'so-overlay';
    overlay.innerHTML = `
      <div class="so-modal">
        <div class="so-head">
          <h2><i class="fas fa-list-ol"></i> Ordre des saisons / arcs</h2>
          <button class="so-close" id="so-close" title="Fermer">×</button>
        </div>
        <div class="so-pick">
          <input type="text" id="so-search" placeholder="Filtrer les séries...">
          <select id="so-select"></select>
        </div>
        <p class="so-hint">Glisse les lignes, utilise ▲ ▼ ou tape un numéro de position. ⚠ = pas encore classée, ✓ = déjà classée.</p>
        <div class="so-list" id="so-list"></div>
        <div class="so-actions">
          <button class="so-primary" id="so-save">Enregistrer l'ordre</button>
          <button class="so-ghost" id="so-reset-local">Annuler les changements</button>
          <button class="so-ghost so-danger" id="so-clear">Retirer l'ordre</button>
        </div>
        <div class="so-status" id="so-status"></div>
        <details class="so-paste">
          <summary>Coller une liste ordonnée (un nom d'arc par ligne, ou la liste Python avec "name")</summary>
          <textarea id="so-paste-text" placeholder='Arc Shinigami remplaçant&#10;Arc Soul Society : 1ère Partie&#10;...&#10;ou : {"season_number": 1, "name": "Arc Shinigami remplaçant", ...}'></textarea>
          <div class="so-actions" style="margin-top:8px"><button class="so-ghost" id="so-apply-paste">Appliquer cet ordre</button></div>
        </details>
      </div>`;
    document.body.appendChild(overlay);

    const $ = id => document.getElementById(id);
    const elSelect = $('so-select'), elSearch = $('so-search'), elList = $('so-list'), elStatus = $('so-status');

    /* ------------------------------------------------------------------
       4) ÉTAT
       ------------------------------------------------------------------ */
    let groups = [];
    let current = null;   // groupe sélectionné
    let cur = [];         // fiches du groupe, dans l'ordre affiché
    let dirty = false;
    let dragIdx = -1;

    function buildGroups() {
        const map = new Map();
        db().forEach(m => {
            if (m.type !== 'serie') return;
            const k = keyOf(m);
            if (k === 'serie|') return;
            if (!map.has(k)) map.set(k, { key: k, label: baseTitle(m), items: [] });
            map.get(k).items.push(m);
        });
        groups = [...map.values()]
            .filter(g => g.items.length > 1)
            .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    }

    const groupDone = g => g.items.every(hasOrder);

    function initialOrder(g) {
        const ordered = g.items.filter(hasOrder).sort((a, b) => a.sortOrder - b.sortOrder);
        const rest = g.items.filter(m => !hasOrder(m)).sort((a, b) =>
            (parseInt(a.year) || 0) - (parseInt(b.year) || 0) ||
            String(a.title || '').localeCompare(String(b.title || ''), 'fr', { numeric: true }));
        return [...ordered, ...rest];
    }

    function status(msg, cls) { elStatus.textContent = msg || ''; elStatus.className = 'so-status ' + (cls || ''); }

    function fillSelect(keepKey) {
        const q = strip(elSearch.value).trim();
        elSelect.innerHTML = '';
        const shown = groups.filter(g => !q || strip(g.label).includes(q));
        shown.forEach(g => {
            const o = document.createElement('option');
            o.value = g.key;
            o.textContent = `${groupDone(g) ? '✓' : '⚠'} ${g.label} (${g.items.length})`;
            elSelect.appendChild(o);
        });
        if (!shown.length) {
            const o = document.createElement('option');
            o.textContent = 'Aucune série avec plusieurs saisons';
            o.disabled = true;
            elSelect.appendChild(o);
            current = null; cur = []; render();
            return;
        }
        const target = shown.find(g => g.key === keepKey) || shown.find(g => !groupDone(g)) || shown[0];
        elSelect.value = target.key;
        selectGroup(target.key, true);
    }

    function selectGroup(key, force) {
        if (!force && dirty && !confirm('Des changements ne sont pas enregistrés. Les abandonner ?')) {
            if (current) elSelect.value = current.key;
            return;
        }
        current = groups.find(g => g.key === key) || null;
        cur = current ? initialOrder(current) : [];
        dirty = false;
        status('');
        render();
    }

    function move(from, to) {
        if (from === to || from < 0 || to < 0 || from >= cur.length || to >= cur.length) return;
        const [it] = cur.splice(from, 1);
        cur.splice(to, 0, it);
        dirty = true;
        status('Modifications non enregistrées.', 'warn');
        render();
    }

    function render() {
        elList.innerHTML = '';
        if (!current || !cur.length) {
            elList.innerHTML = '<div class="so-empty">Aucune série à classer.</div>';
            return;
        }
        cur.forEach((m, i) => {
            const row = document.createElement('div');
            row.className = 'so-row';
            row.draggable = true;
            const poster = String(m.poster || '').split('|||')[0];
            row.innerHTML = `
                <div class="so-num">${i + 1}</div>
                <div class="so-thumb" style="background-image:url('${esc(poster)}')"></div>
                <div class="so-title">${esc(m.title)}<small>${esc(m.year || '')}${hasOrder(m) ? '' : ' · non classée'}</small></div>
                <div class="so-ctrl">
                    <input class="so-pos" type="number" min="1" max="${cur.length}" value="${i + 1}" title="Position">
                    <button class="so-btn" data-a="up" ${i === 0 ? 'disabled' : ''} title="Monter">▲</button>
                    <button class="so-btn" data-a="down" ${i === cur.length - 1 ? 'disabled' : ''} title="Descendre">▼</button>
                </div>`;
            row.querySelector('[data-a="up"]').onclick = () => move(i, i - 1);
            row.querySelector('[data-a="down"]').onclick = () => move(i, i + 1);
            const pos = row.querySelector('.so-pos');
            pos.draggable = false;
            pos.addEventListener('change', () => {
                const n = Math.min(cur.length, Math.max(1, parseInt(pos.value) || i + 1));
                move(i, n - 1);
            });
            row.addEventListener('dragstart', e => {
                dragIdx = i;
                e.dataTransfer.effectAllowed = 'move';
                try { e.dataTransfer.setData('text/plain', String(i)); } catch (_) {}
                row.classList.add('so-drag');
            });
            row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('so-over'); });
            row.addEventListener('dragleave', () => row.classList.remove('so-over'));
            row.addEventListener('drop', e => { e.preventDefault(); const from = dragIdx; dragIdx = -1; move(from, i); });
            row.addEventListener('dragend', () => { dragIdx = -1; render(); });
            elList.appendChild(row);
        });
    }

    /* ------------------------------------------------------------------
       5) SAUVEGARDE
       ------------------------------------------------------------------ */
    async function sendOrders(orders) {
        const apiBase = (typeof API_URL !== 'undefined') ? API_URL : '';
        const res = await fetch(`${apiBase}/api/admin/movies/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': localStorage.getItem(TOKEN_KEY) },
            body: JSON.stringify({ orders })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || ('Erreur ' + res.status));
        return data;
    }

    function refreshGrid() {
        try {
            const grid = document.getElementById('grid');
            if (typeof updateGrid === 'function' && grid && grid.offsetParent !== null) {
                updateGrid(typeof lastGridWasSpecial !== 'undefined' ? lastGridWasSpecial : false);
            }
        } catch (e) { console.warn('refresh grille :', e); }
    }

    $('so-save').onclick = async () => {
        if (!current || !cur.length) return;
        const btn = $('so-save');
        btn.disabled = true; status('Enregistrement...', '');
        try {
            const orders = cur.map((m, i) => ({ id: m.id, sortOrder: i + 1 }));
            await sendOrders(orders);
            cur.forEach((m, i) => { m.sortOrder = i + 1; });
            dirty = false;
            status('✅ Ordre enregistré (' + cur.length + ' saisons).', 'ok');
            fillSelect(current.key);
            status('✅ Ordre enregistré (' + cur.length + ' saisons).', 'ok');
            refreshGrid();
        } catch (e) { status('❌ ' + e.message, 'err'); }
        btn.disabled = false;
    };

    $('so-reset-local').onclick = () => {
        if (!current) return;
        cur = initialOrder(current); dirty = false; status(''); render();
    };

    $('so-clear').onclick = async () => {
        if (!current) return;
        if (!confirm('Retirer l\'ordre manuel de « ' + current.label + ' » ?')) return;
        try {
            await sendOrders(current.items.map(m => ({ id: m.id, sortOrder: null })));
            current.items.forEach(m => { delete m.sortOrder; });
            const k = current.key;
            dirty = false;
            fillSelect(k);
            status('Ordre retiré.', 'ok');
            refreshGrid();
        } catch (e) { status('❌ ' + e.message, 'err'); }
    };

    /* ------------------------------------------------------------------
       6) COLLER UNE LISTE ORDONNÉE
       ------------------------------------------------------------------ */
    const normArc = s => strip(s)
        .replace(/(\d+)\s*(?:ere|er|eme|e|re)\s+partie/g, 'partie $1')
        .replace(/partie\s*(\d+)/g, 'p$1')
        .replace(/[^a-z0-9]+/g, '');

    function parseNames(text) {
        const names = [];
        const re = /["'“]name["'”]\s*:\s*"([^"]+)"/g;
        let m;
        while ((m = re.exec(text))) names.push(m[1].trim());
        if (names.length) return names;
        return text.split(/\r?\n/).map(l => l.replace(/^\s*[\d.)\-–]+\s+/, '').trim()).filter(Boolean);
    }

    $('so-apply-paste').onclick = () => {
        if (!current) return;
        const names = parseNames($('so-paste-text').value);
        if (!names.length) return status('Rien à appliquer : colle une liste.', 'warn');
        const pool = [...cur];
        const placed = [];
        const missing = [];
        names.forEach(name => {
            const n = normArc(name);
            if (!n) return;
            let idx = pool.findIndex(m => normArc(m.title).endsWith(n));
            if (idx < 0) idx = pool.findIndex(m => normArc(m.title).includes(n));
            if (idx < 0) missing.push(name);
            else placed.push(pool.splice(idx, 1)[0]);
        });
        cur = [...placed, ...pool];
        dirty = true;
        render();
        let msg = `${placed.length}/${names.length} arcs reconnus.`;
        if (missing.length) msg += ' Introuvables : ' + missing.join(' · ') + '.';
        if (pool.length) msg += ` ${pool.length} fiche(s) non citée(s) ajoutée(s) à la fin.`;
        msg += ' Vérifie puis clique sur « Enregistrer l\'ordre ».';
        status(msg, missing.length || pool.length ? 'warn' : 'ok');
    };

    /* ------------------------------------------------------------------
       7) OUVERTURE / FERMETURE + BOUTON HEADER
       ------------------------------------------------------------------ */
    function close() {
        if (dirty && !confirm('Des changements ne sont pas enregistrés. Fermer quand même ?')) return;
        overlay.classList.remove('open');
        dirty = false;
    }

    window.openSeriesOrder = function (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        buildGroups();
        elSearch.value = '';
        overlay.classList.add('open');
        fillSelect(current && current.key);
    };

    $('so-close').onclick = close;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
    elSelect.onchange = () => selectGroup(elSelect.value);
    elSearch.oninput = () => { if (dirty) return; fillSelect(current && current.key); };

    function injectButton() {
        if (document.getElementById('so-header-btn')) return;
        const ref = document.querySelector('.add-btn-header.admin-btn');
        if (!ref) return false;
        const b = document.createElement('button');
        b.id = 'so-header-btn';
        b.className = 'add-btn-header admin-btn';
        b.title = 'Ordre des saisons';
        b.innerHTML = '<i class="fas fa-list-ol"></i>';
        b.onclick = window.openSeriesOrder;
        ref.parentNode.insertBefore(b, ref);
        return true;
    }
    if (!injectButton()) document.addEventListener('DOMContentLoaded', injectButton);
})();
