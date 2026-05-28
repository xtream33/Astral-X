'use strict';
const { searchApp, getPlayDetails } = require('../utils/apkfetch');
const { box } = require('../utils/format');

module.exports = {
  name: 'apkinfo',
  aliases: ['appinfo', 'apkdetails', 'appdetails', 'playinfo'],
  category: 'apk-download',
  description: 'Get full app info from Google Play. Usage: .apkinfo <app name or package>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, {
      text: box('📋 *APP INFO*',
        '❓ Provide an app name or package!\n\n📌 *Usage:* .apkinfo <app>\n\n💡 *Examples:*\n.apkinfo Netflix\n.apkinfo com.netflix.mediaclient\n.apkinfo TikTok'
      ),
    });

    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 📋 *ᴀᴘᴘ ɪɴꜰᴏ*\n┠─────────────────────\n┃ _Fetching app details..._\n┗━━━━━━━━━━━━━━━━━━━▣' });

    try {
      const app = await searchApp(query);
      if (!app) return sock.sendMessage(jid, { text: box('📋 *APP INFO*', '❌ App not found: *' + query + '*') });

      const d = await getPlayDetails(app.pkg).catch(() => ({}));

      const stars = d.rating ? '⭐'.repeat(Math.round(parseFloat(d.rating))) + ' (' + d.rating + ')' : '—';

      const body =
        '📱 *' + (app.name || app.pkg) + '*\n━━━━━━━━━━━━━━\n' +
        '📦 *Package:* _' + app.pkg + '_\n' +
        '🔖 *Version:* ' + (app.version || 'latest') + '\n' +
        '👨‍💻 *Developer:* ' + (d.developer || '—') + '\n' +
        '📂 *Category:* ' + (d.category || '—') + '\n' +
        '⭐ *Rating:* ' + stars + '\n' +
        '💬 *Reviews:* ' + (d.reviews || '—') + '\n' +
        '⬇️ *Downloads:* ' + (d.downloads || '—') + '\n' +
        '💾 *Size:* ' + (d.size || '—') + '\n' +
        '🤖 *Min Android:* ' + (d.minAndroid || '—') + '\n' +
        '📅 *Last Updated:* ' + (d.updated || '—') + '\n' +
        '━━━━━━━━━━━━━━\n' +
        (d.description ? '📝 *About:*\n_' + d.description.slice(0, 220) + '..._\n\n' : '') +
        '🔗 https://play.google.com/store/apps/details?id=' + app.pkg;

      await sock.sendMessage(jid, { text: box('📋 *APP INFO*', body) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('📋 *APP INFO*', '❌ Error: ' + e.message) });
    }
  },
};
