'use strict';
const { searchApp, getPlayDetails } = require('../utils/apkfetch');
const { box } = require('../utils/format');

module.exports = {
  name: 'apklink',
  aliases: ['apkurl', 'applink', 'apkget', 'getlink'],
  category: 'apk-download',
  description: 'Get direct download links for any app. Usage: .apklink <app name>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, {
      text: box('🔗 *APK LINKS*', '❓ Provide an app name!\n\n📌 *Usage:* .apklink <app name>\n\n💡 *Examples:*\n.apklink WhatsApp\n.apklink Telegram\n.apklink com.spotify.music'),
    });

    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🔗 *ᴀᴘᴋ ʟɪɴᴋs*\n┠─────────────────────\n┃ _Fetching links for *' + query + '*..._\n┗━━━━━━━━━━━━━━━━━━━▣' });

    try {
      const app = await searchApp(query);
      if (!app) return sock.sendMessage(jid, { text: box('🔗 *APK LINKS*', '❌ App not found: *' + query + '*') });

      const pkg  = app.pkg;
      const name = app.name || pkg;

      const body =
        '📱 *' + name + '*\n' +
        '📦 _' + pkg + '_\n' +
        '━━━━━━━━━━━━━━\n' +
        '🔗 *Download Links:*\n\n' +
        '1️⃣ *APKPure:*\nhttps://apkpure.com/' + pkg + '/' + pkg + '/download\n\n' +
        '2️⃣ *APKCombo:*\nhttps://apkcombo.com/apk-downloader/?package_id=' + pkg + '\n\n' +
        '3️⃣ *APKMirror:*\nhttps://www.apkmirror.com/?s=' + encodeURIComponent(name) + '\n\n' +
        '4️⃣ *Google Play:*\nhttps://play.google.com/store/apps/details?id=' + pkg + '\n\n' +
        '5️⃣ *Uptodown:*\nhttps://en.uptodown.com/android/search/' + encodeURIComponent(name);

      await sock.sendMessage(jid, { text: box('🔗 *APK LINKS*', body) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🔗 *APK LINKS*', '❌ Error: ' + e.message) });
    }
  },
};
