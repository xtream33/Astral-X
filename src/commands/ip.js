'use strict';
const https = require('https');
const { box } = require('../utils/format');
module.exports = {
  name: 'ip', aliases: ['ipinfo', 'iplookup', 'ipcheck', 'geoip', 'iplocate'],
  category: 'utility', description: 'IP address lookup. Usage: .ip <address>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const ip = args[0] || '';
    if (ip && !/^[\d.:a-fA-F]+$/.test(ip)) return sock.sendMessage(jid, { text: box('🌐 *IP LOOKUP*', '❌ Invalid IP address format.\n\n📌 *Usage:* .ip <address>\n💡 *Example:* .ip 8.8.8.8') });
    await sock.sendMessage(jid, { text: box('🌐 *IP LOOKUP*', '_Looking up ' + (ip || 'your IP') + '..._') });
    https.get('https://ipapi.co/' + (ip || 'json') + '/json/', { headers: { 'User-Agent': 'ASTRA-X' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', async () => {
        try {
          const j = JSON.parse(data);
          if (j.error) throw new Error();
          await sock.sendMessage(jid, { text: box('🌐 *IP LOOKUP*', '📍 *IP:* `' + j.ip + '`\n🏙️ *City:* ' + (j.city || '—') + '\n🌍 *Country:* ' + (j.country_name || '—') + ' ' + (j.country_code || '') + '\n🏢 *ISP:* ' + (j.org || '—') + '\n🕐 *Timezone:* ' + (j.timezone || '—') + '\n📡 *Coordinates:* ' + (j.latitude || '—') + ', ' + (j.longitude || '—')) }, { quoted: msg });
        } catch (_) { /* silent */ }
      });
    }).on('error', () => { /* silent */ });
  },
};
