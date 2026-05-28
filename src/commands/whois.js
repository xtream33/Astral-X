'use strict';
const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = {
  name: 'whois',
  aliases: ['domaininfo', 'domainlookup'],
  category: 'utility',
  description: 'WHOIS lookup for a domain. Usage: .whois <domain>',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const domain = (args[0] || '').replace(/https?:\/\//,'').split('/')[0];
    if (!domain) return sock.sendMessage(jid, { text: '🔍 Usage: .whois <domain>\n💡 Example: .whois google.com' });
    await sock.sendMessage(jid, { text: '🔍 _Looking up *' + domain + '*..._' });
    try {
      const data = await fetchJSON('https://api.whoisfreaks.com/v1.0/whois?whois=live&domainName=' + domain + '&apiKey=free');
      // fallback to whois.vu free API
      throw new Error('try fallback');
    } catch(_) {
      try {
        const data = await fetchJSON('https://api.domainsdb.info/v1/domains/search?domain=' + domain + '&zone=com');
        const d = data?.domains?.[0];
        if (!d) throw new Error('No data');
        await sock.sendMessage(jid, {
          text: '🔍 *WHOIS: ' + domain + '*\n━━━━━━━━━━━━━━\n\n' +
                '🌐 Domain: *' + d.domain + '*\n' +
                '📅 Created: ' + (d.create_date || '—') + '\n' +
                '📅 Updated: ' + (d.update_date || '—') + '\n' +
                '🔒 Country: ' + (d.country || '—') + '\n' +
                '📡 A Record: ' + (d.A?.join(', ') || '—') + '\n' +
                '✅ Active: ' + (d.isDead === 'False' ? 'Yes' : 'No'),
        }, { quoted: msg });
      } catch(e) {
        await sock.sendMessage(jid, { text: '❌ WHOIS lookup failed for *' + domain + '*\n' + e.message });
      }
    }
  },
};
