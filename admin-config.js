// Local Admin Supabase connection.
// Use the same Project URL as the public website.
// Get both values from Supabase Dashboard > Project Settings > API.
const _anipastaAdminKeyParts = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.',
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Y3VvY3BycWJiamtpcHRqZXJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIs',
  'ImlhdCI6MTc4Njk1ODc1OSwiZXhwIjoyMTAyNTM0NzU5fQ.',
  'ITt1u14ic51gY82psWLabJpDUBqno46niHMzU5V8Xew'
];
window.ANIPASTA_ADMIN_CONFIG = {
  url: 'https://ctcuocprqbbjkiptjerm.supabase.co',
  // Keep this file on your PC. Never share the admin key.
  key: _anipastaAdminKeyParts.join('')
};

authorizeDownloadAdmin();

function authorizeDownloadAdmin() {
  window.addEventListener('load', () => {
    if (document.querySelector('script[data-anipasta-download-admin]')) return;
    const script = document.createElement('script');
    script.src = 'download-admin.js';
    script.async = false;
    script.dataset.anipastaDownloadAdmin = 'true';
    document.body.appendChild(script);
  });
}
