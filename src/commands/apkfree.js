'use strict';
const { fdroidSearch, httpGet, parseJSON } = require('../utils/apkfetch');
const { box } = require('../utils/format');

async function fdroidList(query) {
  const url  = 'https://f-droid.org/api/v1/search?q=' + encodeURIComponent(query) + '&limit=5';
  const res  = await httpGet(url, { timeout: 15000 });
  return parseJSON(res.body);
}

module.exports = {
  name: 'apkfree',
  aliases: ['fdroid', 'opensource', 'freeapp', 'apkopen'],
  category: 'apk-download',
  description: 'Find & download free open-source apps from F-Droid. Usage: .apkfree <app name>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, {
      text: box('🆓 *FREE APK (F-Droid)*',
        '❓ Provide an app name!\n\n📌 *Usage:* .apkfree <app name>\n\n💡 *Examples:*\n.apkfree VPN\n.apkfree browser\n.apkfree music player\n.apkfree file manager\n\n_F-Droid: 100% free & open-source apps_ 🔓'
      ),
    });

    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🆓 *ꜰʀᴇᴇ ᴀᴘᴋ*\n┠─────────────────────\n┃ _Searching F-Droid for *' + query + '*..._\n┗━━━━━━━━━━━━━━━━━━━▣' });

    try {
      const data = await fdroidList(query);
      if (!data || !data.apps || !data.apps.length) {
        return sock.sendMessage(jid, { text: box('🆓 *FREE APK (F-Droid)*', '❌ No open-source apps found for *' + query + '*\n\nTry a broader term like: browser, vpn, camera, notes') });
      }

      let body = '🔍 Results for: _' + query + '_\n━━━━━━━━━━━━━━\n\n';
      data.apps.slice(0, 5).forEach((app, i) => {
        const name = app.name || app.localized?.['en-US']?.name || app.packageName;
        const desc = app.localized?.['en-US']?.summary || '';
        const ver  = app.suggestedVersionName || 'latest';
        body +=
          (i + 1) + '. 📱 *' + name + '*\n' +
          '   📦 _' + app.packageName + '_\n' +
          '   🔖 v' + ver + '\n' +
          (desc ? '   _' + desc.slice(0, 80) + '_\n' : '') +
          '   ⬇️ https://f-droid.org/packages/' + app.packageName + '\n\n';
      });
      body += '_All apps are 100% free & open-source_ 🔓';

      await sock.sendMessage(jid, { text: box('🆓 *FREE APK (F-Droid)*', body) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🆓 *FREE APK (F-Droid)*', '❌ Error: ' + e.message) });
    }
  },
};
