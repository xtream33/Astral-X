'use strict';
const { fetchBuffer } = require('../utils/ytdlp');

module.exports = {
  name: 'screenshot',
  aliases: ['ss', 'webshot', 'capture', 'snap'],
  category: 'utility',
  description: 'Take screenshot of a website. Usage: .screenshot <url>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    let url   = args[0] || '';
    if (!url) return sock.sendMessage(jid, { text: '📸 Usage: .screenshot <url>\n💡 Example: .screenshot https://google.com' });
    if (!url.startsWith('http')) url = 'https://' + url;
    await sock.sendMessage(jid, { text: '📸 _Taking screenshot of *' + url + '*..._' });
    try {
      // thum.io — completely free, no key needed
      const ssUrl = 'https://image.thum.io/get/width/1280/crop/800/noanimate/' + url;
      const buf   = await fetchBuffer(ssUrl);
      await sock.sendMessage(jid, {
        image: buf,
        caption: '📸 *Screenshot*\n🔗 ' + url + '\n\n_Powered by ASTRA-X_',
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Screenshot failed: ' + e.message });
    }
  },
};
