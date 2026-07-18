'use strict';
const { searchApp } = require('../utils/apkfetch');
const { box } = require('../utils/format');

module.exports = {
  name: 'apkmod',
  aliases: ['modapk', 'apkpremium', 'modapp', 'apkhack'],
  category: 'apk-download',
  description: 'Find modded/premium APK sources. Usage: .apkmod <app name>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, {
      text: box('🔓 *MOD APK FINDER*',
        '❓ Provide an app name!\n\n📌 *Usage:* .apkmod <app name>\n\n💡 *Examples:*\n.apkmod Spotify\n.apkmod Minecraft\n.apkmod YouTube\n\n⚠️ _For educational/personal use only_'
      ),
    });

    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🔓 *ᴍᴏᴅ ᴀᴘᴋ ꜰɪɴᴅᴇʀ*\n┠─────────────────────\n┃ _Finding mod sources for *' + query + '*..._\n┗━━━━━━━━━━━━━━━━━━━▣' });

    try {
      const app  = await searchApp(query).catch(() => null);
      const name = app ? (app.name || app.pkg) : query;
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const enc  = encodeURIComponent(name);

      const body =
        '🔓 *Mod Sources for: ' + name + '*\n━━━━━━━━━━━━━━\n\n' +
        '1️⃣ *HappyMod:*\nhttps://www.happymod.com/search.html?q=' + enc + '\n\n' +
        '2️⃣ *ModCombo:*\nhttps://modcombo.com/search?q=' + enc + '\n\n' +
        '3️⃣ *APKDone:*\nhttps://apkdone.com/?s=' + enc + '\n\n' +
        '4️⃣ *Modyolo:*\nhttps://modyolo.com/?s=' + enc + '\n\n' +
        '5️⃣ *RevDL:*\nhttps://www.revdl.com/?s=' + enc + '\n\n' +
        '━━━━━━━━━━━━━━\n' +
        '⚠️ _Mod APKs are for personal/educational use only. Always scan with antivirus before installing._';

      await sock.sendMessage(jid, { text: box('🔓 *MOD APK FINDER*', body) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🔓 *MOD APK FINDER*', '❌ Error: ' + e.message) });
    }
  },
};
