// Local Admin Supabase connection.
// Keep the privileged key only in your local copy of this file.
window.ANIPASTA_ADMIN_CONFIG = {
  url: 'https://ctcuocprqbbjkiptjerm.supabase.co',
  key: ''
};

// Compatibility guard: prevent a missing legacy control from stopping the
// existing admin script before database initialization runs.
(function(){
  const originalGetById = document.getElementById.bind(document);
  const inputIds = new Set(['librarySearch','aniSearch','episodeOld','episodeNew','movieOld','movieNew']);
  const fileIds = new Set(['upload']);
  const selectIds = new Set(['pageType']);
  const buttonIds = new Set([
    'refreshLibrary','aniSearchBtn','refreshStats','checkEpisode','replaceEpisode','checkMovie','replaceMovie',
    'refreshEpisodes','save','cancel','toggle','deleteAnime','download',
    'pageSaveMovie','pageToggle','pageDelete','pageRefreshEpisodes','pageSaveEpisode','pageCancelEpisode'
  ]);
  const requiredIds = new Set([
    'librarySearch','libraryFilters','refreshLibrary','library','aniSearch','aniSearchBtn','aniResults','refreshStats',
    'checkEpisode','replaceEpisode','checkMovie','replaceMovie','seasons','refreshEpisodes','episodeList','save','cancel',
    'toggle','deleteAnime','download','upload','pageType','pageSaveMovie','pageToggle','pageDelete','pageRefreshEpisodes',
    'pageSaveEpisode','pageCancelEpisode','pageSeasons','pageEpisodeList'
  ]);

  document.getElementById = function(id){
    const existing = originalGetById(id);
    if (existing || !requiredIds.has(String(id))) return existing;

    let el;
    if (fileIds.has(id)) {
      el = document.createElement('input');
      el.type = 'file';
    } else if (selectIds.has(id)) {
      el = document.createElement('select');
    } else if (buttonIds.has(id)) {
      el = document.createElement('button');
      el.type = 'button';
    } else if (inputIds.has(id)) {
      el = document.createElement('input');
      el.type = 'text';
    } else {
      el = document.createElement('div');
    }
    el.id = id;
    el.hidden = true;
    (document.body || document.documentElement).appendChild(el);
    return el;
  };
})();

window.addEventListener('load', () => {
  if (document.querySelector('script[data-anipasta-download-admin]')) return;
  const script = document.createElement('script');
  script.src = 'download-admin.js';
  script.async = false;
  script.dataset.anipastaDownloadAdmin = 'true';
  document.body.appendChild(script);
});
