// Local Admin Supabase connection.
// The privileged key is kept in this browser only, not in the GitHub repository.
const ANIPASTA_ADMIN_URL = 'https://ctcuocprqbbjkiptjerm.supabase.co';
const ANIPASTA_ADMIN_KEY_STORAGE = 'anipasta_admin_supabase_key';

function getAniPastaAdminKey() {
  let key = '';
  try { key = (localStorage.getItem(ANIPASTA_ADMIN_KEY_STORAGE) || '').trim(); } catch {}
  if (!key) {
    key = (window.prompt('Enter your Supabase admin key. It will be stored only in this browser.') || '').trim();
    if (key) {
      try { localStorage.setItem(ANIPASTA_ADMIN_KEY_STORAGE, key); } catch {}
    }
  }
  return key;
}

window.ANIPASTA_ADMIN_CONFIG = {
  url: ANIPASTA_ADMIN_URL,
  key: getAniPastaAdminKey()
};

window.addEventListener('load', () => {
  if (!window.ANIPASTA_ADMIN_CONFIG.key) return;
  if (!document.querySelector('script[data-anipasta-download-admin]')) {
    const script = document.createElement('script');
    script.src = 'download-admin.js';
    script.async = false;
    script.dataset.anipastaDownloadAdmin = 'true';
    document.body.appendChild(script);
  }
});
