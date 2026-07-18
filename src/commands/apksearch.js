'use strict';
const { searchApp, getPlayDetails, fmtNum } = require('../utils/apkfetch');
const { box } = require('../utils/format');

module.exports = {
  name: 'apksearch',
  aliases: ['searchapk', 'findapk', 'appfind', 'apkfind'],
  category: 'apk-download',
  description: 'Search for any app across stores. Usage: .apksearch <app name>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, {
      text: box('🔍 *APK SEARCH*',
        '❓ Provide an app name!\n\n📌 *Usage:* .apksearch <app name>\n\n💡 *Examples:*\n.apksearch WhatsApp\n.apksearch Spotify\n.apksearch VPN Master\n.apksearch com.instagram.android'
      ),
    });

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🔍 *ᴀᴘᴋ sᴇᴀʀᴄʜ*\n┠─────────────────────\n┃ _Searching for *' + query + '*..._\n┗━━━━━━━━━━━━━━━━━━━▣',
    });

    try {
      const app = await searchApp(query);
      if (!app) return sock.sendMessage(jid, { text: box('🔍 *APK SEARCH*', '❌ No app found for *' + query + '*\n\nTry:\n• Use the exact app name\n• Use package name (e.g. com.whatsapp)\n• Try *.apkfree* for open-source apps') });

      const details = await getPlayDetails(app.pkg).catch(() => ({}));

      const body =
        '📱 *' + (app.name || app.pkg) + '*\n' +
        '━━━━━━━━━━━━━━\n' +
        '📦 *Package:* ' + app.pkg + '\n' +
        '🔖 *Version:* ' + (app.version || 'latest') + '\n' +
        (details.developer  ? '👨‍💻 *Developer:* ' + details.developer + '\n' : '') +
        (details.category   ? '📂 *Category:* ' + details.category + '\n' : '') +
        (details.rating     ? '⭐ *Rating:* ' + details.rating + '/5\n' : '') +
        (details.reviews    ? '💬 *Reviews:* ' + details.reviews + '\n' : '') +
        (details.downloads  ? '⬇️ *Downloads:* ' + details.downloads + '\n' : '') +
        (details.size       ? '💾 *Size:* ' + details.size + '\n' : '') +
        (details.minAndroid ? '🤖 *Min Android:* ' + details.minAndroid + '\n' : '') +
        (details.updated    ? '📅 *Updated:* ' + details.updated + '\n' : '') +
        '━━━━━━━━━━━━━━\n' +
        (details.description ? '_' + details.description.slice(0, 180) + '..._\n\n' : '') +
        '⬇️ *To download:* .apk ' + query + '\n' +
        '🔗 *Play Store:* https://play.google.com/store/apps/details?id=' + app.pkg;

      await sock.sendMessage(jid, { text: box('🔍 *APK SEARCH*', body) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🔍 *APK SEARCH*', '❌ Search error: ' + e.message) });
    }
  },
};
