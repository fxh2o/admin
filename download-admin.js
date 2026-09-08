(() => {
  'use strict';

  const QUALITY_KEYS = ['480p', '720p', '1080p'];
  const config = window.ANIPASTA_ADMIN_CONFIG || {};
  if (!config.url || !config.key || !window.supabase?.createClient) return;

  const db = window.supabase.createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const state = { animeId: null, links: {}, loaded: false };

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function setMessage(text, type = '') {
    const el = $('downloadAdminMsg');
    if (!el) return;
    el.textContent = text || '';
    el.className = `msg ${type}`;
  }

  function injectStyles() {
    if ($('downloadAdminStyles')) return;
    const style = document.createElement('style');
    style.id = 'downloadAdminStyles';
    style.textContent = `
      .downloadAdminGrid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px;align-items:start}
      .downloadAdminForm{display:grid;grid-template-columns:120px 1fr;gap:9px}
      .downloadAdminActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .downloadAdminSeasons{display:flex;flex-direction:column;gap:8px;margin-top:12px}
      .downloadAdminSeason{padding:10px;border:1px solid var(--line);background:#0a0f16;border-radius:3px}
      .downloadAdminSeasonHead{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px}
      .downloadAdminSeasonTitle{color:var(--green);font-weight:800}
      .downloadAdminQualityGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
      .downloadAdminQuality{width:100%}
      .downloadAdminLink{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:11px;margin-top:5px}
      @media(max-width:900px){.downloadAdminGrid{grid-template-columns:1fr}}
      @media(max-width:560px){.downloadAdminForm{grid-template-columns:1fr}.downloadAdminQualityGrid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    if ($('downloadAdminPanel')) return $('downloadAdminPanel');
    const panel = document.createElement('section');
    panel.id = 'downloadAdminPanel';
    panel.className = 'detailCard';
    panel.innerHTML = `
      <div class="title">DOWNLOAD LINKS <small>PER SEASON · 480P / 720P / 1080P</small></div>
      <div class="downloadAdminGrid">
        <div>
          <div class="downloadAdminForm">
            <div><label class="label" for="downloadAdminSeason">SEASON</label><input id="downloadAdminSeason" class="input" type="number" min="1" value="1"></div>
            <div><label class="label" for="downloadAdmin480">480P LINK</label><input id="downloadAdmin480" class="input" placeholder="https://..."></div>
            <div></div>
            <div><label class="label" for="downloadAdmin720">720P LINK</label><input id="downloadAdmin720" class="input" placeholder="https://..."></div>
            <div></div>
            <div><label class="label" for="downloadAdmin1080">1080P LINK</label><input id="downloadAdmin1080" class="input" placeholder="https://..."></div>
          </div>
          <div class="downloadAdminActions">
            <button id="downloadAdminSave" type="button" class="btn primary">SAVE SEASON</button>
            <button id="downloadAdminClear" type="button" class="btn">CLEAR FORM</button>
          </div>
          <div id="downloadAdminMsg" class="msg"></div>
        </div>
        <div>
          <div class="label">CURRENT DOWNLOAD SEASONS</div>
          <div id="downloadAdminSeasons" class="downloadAdminSeasons"><div class="empty">Loading...</div></div>
        </div>
      </div>
    `;

    const host = $('pageSeriesPanel');
    if (host?.parentElement) host.parentElement.insertBefore(panel, host);
    else document.body.appendChild(panel);

    $('downloadAdminSave').addEventListener('click', saveSeason);
    $('downloadAdminClear').addEventListener('click', clearForm);
    $('downloadAdminSeasons').addEventListener('click', event => {
      const edit = event.target.closest('[data-download-edit]');
      const del = event.target.closest('[data-download-delete]');
      if (edit) fillForm(edit.dataset.downloadEdit);
      if (del) deleteSeason(del.dataset.downloadDelete);
    });
    return panel;
  }

  function normalizeLinks(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function seasonNumbers() {
    return Object.keys(state.links)
      .filter(key => /^\d+$/.test(String(key)))
      .sort((a, b) => Number(a) - Number(b));
  }

  function renderSeasons() {
    const box = $('downloadAdminSeasons');
    if (!box) return;
    const seasons = seasonNumbers();
    box.innerHTML = seasons.length ? seasons.map(season => {
      const row = state.links[season] && typeof state.links[season] === 'object' ? state.links[season] : {};
      return `<div class="downloadAdminSeason">
        <div class="downloadAdminSeasonHead"><span class="downloadAdminSeasonTitle">Season ${esc(season)}</span><span><button type="button" class="btn" data-download-edit="${esc(season)}">EDIT</button> <button type="button" class="btn danger" data-download-delete="${esc(season)}">DELETE</button></span></div>
        ${QUALITY_KEYS.map(q => `<div><b>${q}</b><div class="downloadAdminLink" title="${esc(row[q] || '')}">${esc(row[q] || 'Not added')}</div></div>`).join('')}
      </div>`;
    }).join('') : '<div class="empty">No download links added yet.</div>';
  }

  function fillForm(season) {
    const row = state.links[season] && typeof state.links[season] === 'object' ? state.links[season] : {};
    $('downloadAdminSeason').value = season;
    $('downloadAdmin480').value = row['480p'] || '';
    $('downloadAdmin720').value = row['720p'] || '';
    $('downloadAdmin1080').value = row['1080p'] || '';
    window.scrollTo({ top: $('downloadAdminPanel').offsetTop - 20, behavior: 'smooth' });
    setMessage(`Editing Season ${season}.`, 'ok');
  }

  function clearForm() {
    $('downloadAdminSeason').value = '1';
    QUALITY_KEYS.forEach(q => { $(`downloadAdmin${q.replace('p', '')}`).value = ''; });
    setMessage('');
  }

  async function loadAnime(id) {
    state.animeId = String(id);
    state.loaded = false;
    ensurePanel();
    setMessage('Loading download links...');
    try {
      const result = await db.from('anime').select('id,title,download_links').eq('id', id).single();
      if (result.error) throw result.error;
      state.links = normalizeLinks(result.data?.download_links);
      state.loaded = true;
      renderSeasons();
      setMessage(`Download links loaded for ${result.data?.title || 'anime'}.`, 'ok');
    } catch (error) {
      state.links = {};
      renderSeasons();
      setMessage(error?.message || 'Unable to load download links.', 'error');
    }
  }

  async function saveSeason() {
    if (!state.animeId || !state.loaded) return setMessage('Anime is still loading.', 'error');
    const season = Number($('downloadAdminSeason').value);
    if (!Number.isInteger(season) || season < 1) return setMessage('Season must be 1 or greater.', 'error');

    const values = {
      '480p': $('downloadAdmin480').value.trim(),
      '720p': $('downloadAdmin720').value.trim(),
      '1080p': $('downloadAdmin1080').value.trim()
    };
    const hasLink = QUALITY_KEYS.some(key => values[key]);
    if (!hasLink) return setMessage('Add at least one download link for this season.', 'error');

    const button = $('downloadAdminSave');
    button.disabled = true;
    button.textContent = 'SAVING...';
    try {
      const next = { ...state.links };
      next[String(season)] = values;
      const result = await db.from('anime').update({ download_links: next }).eq('id', state.animeId).select('id,download_links').single();
      if (result.error) throw result.error;
      state.links = normalizeLinks(result.data?.download_links);
      renderSeasons();
      setMessage(`Season ${season} download links saved.`, 'ok');
    } catch (error) {
      setMessage(error?.message || 'Failed to save download links.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'SAVE SEASON';
    }
  }

  async function deleteSeason(season) {
    if (!state.animeId || !state.loaded) return;
    if (!confirm(`Delete all download links for Season ${season}?`)) return;
    try {
      const next = { ...state.links };
      delete next[String(season)];
      const result = await db.from('anime').update({ download_links: next }).eq('id', state.animeId).select('id,download_links').single();
      if (result.error) throw result.error;
      state.links = normalizeLinks(result.data?.download_links);
      renderSeasons();
      clearForm();
      setMessage(`Season ${season} download links deleted.`, 'ok');
    } catch (error) {
      setMessage(error?.message || 'Failed to delete season links.', 'error');
    }
  }

  function currentIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function syncRoute() {
    const id = currentIdFromUrl();
    const panel = ensurePanel();
    panel.classList.toggle('pageHidden', !id);
    if (id && String(id) !== String(state.animeId)) loadAnime(id);
    else if (!id) setMessage('');
  }

  injectStyles();
  window.addEventListener('load', syncRoute);
  window.addEventListener('popstate', syncRoute);
  window.addEventListener('pageshow', syncRoute);
  setTimeout(syncRoute, 200);
})();
