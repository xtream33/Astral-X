'use strict';
const { searchApp, getPlayDetails } = require('../utils/apkfetch');
const { box } = require('../utils/format');

module.exports = {
  name: 'apkupdate',
  aliases: ['appupdate', 'apkversion', 'latestapk', 'appversion'],
  category: 'apk-download',
  description: 'Check latest version of any app. Usage: .apkupdate <app name>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, {
      text: box('🔄 *APK VERSION CHECK*',
        '❓ Provide an app name!\n\n📌 *Usage:* .apkupdate <app name>\n\n💡 *Examples:*\n.apkupdate WhatsApp\n.apkupdate Instagram\n.apkupdate Chrome\n.apkupdate Telegram'
      ),
    });

    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🔄 *ᴠᴇʀsɪᴏɴ ᴄʜᴇᴄᴋ*\n┠─────────────────────\n┃ _Checking latest version..._\n┗━━━━━━━━━━━━━━━━━━━▣' });

    try {
      const app = await searchApp(query);
      if (!app) return sock.sendMessage(jid, { text: box('🔄 *APK VERSION CHECK*', '❌ App not found: *' + query + '*') });

      const d = await getPlayDetails(app.pkg).catch(() => ({}));

      const body =
        '📱 *' + (app.name || app.pkg) + '*\n' +
        '📦 _' + app.pkg + '_\n━━━━━━━━━━━━━━\n\n' +
        '🔖 *Latest Version:* ' + (app.version || 'latest') + '\n' +
        '📅 *Last Updated:* ' + (d.updated || '—') + '\n' +
        '💾 *Size:* ' + (d.size || '—') + '\n' +
        '🤖 *Min Android:* ' + (d.minAndroid || '—') + '\n' +
        '⬇️ *Downloads:* ' + (d.downloads || '—') + '\n' +
        '⭐ *Rating:* ' + (d.rating ? d.rating + '/5' : '—') + '\n' +
        '━━━━━━━━━━━━━━\n' +
        '⬇️ *Download latest:*\nhttps://apkpure.com/download/' + app.pkg + '\n\n' +
        '🔗 *Play Store:*\nhttps://play.google.com/store/apps/details?id=' + app.pkg;

      await sock.sendMessage(jid, { text: box('🔄 *APK VERSION CHECK*', body) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🔄 *APK VERSION CHECK*', '❌ Error: ' + e.message) });
    }
  },
};
