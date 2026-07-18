'use strict';
const { box } = require('../utils/format');

module.exports = {
  name: 'apkmenu',
  aliases: ['apkhelp', 'apklist', 'apkcommands', 'apkcat'],
  category: 'apk-download',
  description: 'Show all APK download commands.',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    const p   = process.env.BOT_PREFIX || '.';
    const body =
      '📦 *All APK Commands*\n━━━━━━━━━━━━━━\n\n' +
      p + 'apk <name>         — Download APK directly\n' +
      p + 'apksearch <name>   — Search & show app info\n' +
      p + 'apkinfo <name>     — Full app details\n' +
      p + 'apklink <name>     — Get 5 download links\n' +
      p + 'apkfree <name>     — Free open-source apps\n' +
      p + 'apkmod <name>      — Find modded APK sources\n' +
      p + 'apkcheck <name>    — Safety & permission scan\n' +
      p + 'apkupdate <name>   — Check latest version\n' +
      p + 'apktop [category]  — Top trending apps\n\n' +
      '📂 *apktop categories:*\n' +
      'all • games • social • music • tools • education\n\n' +
      '━━━━━━━━━━━━━━\n' +
      '_All powered by free services — no API key needed_ 🌍';

    await sock.sendMessage(jid, { text: box('📦 *APK DOWNLOAD*', body) }, { quoted: msg });
  },
};
