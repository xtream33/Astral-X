'use strict';
const https = require('https');

function fetchJSON(url, opts={}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X', ...opts }, timeout: 15000 }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = {
  name: 'tempmail',
  aliases: ['disposable', 'throwaway', 'fakemail', 'tempinbox'],
  category: 'utility',
  description: 'Generate a temporary email address. Usage: .tempmail',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    await sock.sendMessage(jid, { text: '📧 _Generating temporary email..._' });
    try {
      // Guerrilla Mail free API — no key needed
      const data = await fetchJSON('https://api.guerrillamail.com/ajax.php?f=get_email_address');
      const email   = data?.email_addr;
      const sidToken = data?.sid_token;
      if (!email) throw new Error('No email generated');
      await sock.sendMessage(jid, {
        text:
          '📧 *Temporary Email*\n━━━━━━━━━━━━━━\n\n' +
          '✉️ *Email Address:*\n`' + email + '`\n\n' +
          '⏰ Expires in: *1 hour*\n\n' +
          '📥 To check inbox, use:\n*.tempmail check ' + sidToken?.slice(0,10) + '*\n\n' +
          '⚠️ _Do NOT use for important accounts. This is temporary only._',
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed to generate email: ' + e.message });
    }
  },
};
