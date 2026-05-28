'use strict';
const settings = require('../utils/settings');

module.exports = {
  name: 'privacy',
  aliases: ['privacymode','privset','privacydash','myprivacy'],
  category: 'privacy',
  description: 'View and manage all your privacy settings.',
  execute: async (sock, msg, args, userId) => {
    const jid = msg.key.remoteJid;
    const g   = k => settings.get(k + ':' + userId) ? '🟢 ON ' : '🔴 OFF';

    await sock.sendMessage(jid, {
      text:
        '〔 ✧ ᴀsᴛʀᴀ-x ᴘʀɪᴠᴀᴄʏ ✧ 〕\n' +
        '┏━━━━━━━━━━━━━━━━━▣\n' +
        '┃ 🔒 *Privacy Dashboard*\n' +
        '┗━━━━━━━━━━━━━━━━━▣\n\n' +

        '┏━━━━━━━━━━━━━━━━━▣\n' +
        '┃ *🕵️ Stealth & Identity*\n' +
        '┃ 👻 Ghost Mode:       ' + g('ghost')      + '\n' +
        '┃ 🕵️ Incognito:        ' + g('incognito')  + '\n' +
        '┃ 🔒 Paranoid Mode:    ' + g('paranoid')   + '\n' +
        '┃ 🤫 Silent Mode:      ' + g('silentmode') + '\n' +
        '┗━━━━━━━━━━━━━━━━━▣\n\n' +

        '┏━━━━━━━━━━━━━━━━━▣\n' +
        '┃ *📤 Message Privacy*\n' +
        '┃ 🚫 Anti Forward:     ' + g('noforward')  + '\n' +
        '┃ 👁️ No Save (View1):  ' + g('nosave')     + '\n' +
        '┃ 🕵️ Anti Trace:       ' + g('antitrace')  + '\n' +
        '┃ 🫥 Cover Track:      ' + g('covertrack') + '\n' +
        '┗━━━━━━━━━━━━━━━━━▣\n\n' +

        '┏━━━━━━━━━━━━━━━━━▣\n' +
        '┃ *⚙️ WhatsApp Settings*\n' +
        '┃ ✅ Read Receipts:    !readreceipts\n' +
        '┃ 🕐 Last Seen:        !lastseen\n' +
        '┃ 🟢 Online Status:    !online\n' +
        '┃ 🖼️ Profile Photo:    !profileprivacy\n' +
        '┃ 👁️ Status Viewers:   !statusview\n' +
        '┃ 👥 Groups Add:       !groupsprivacy\n' +
        '┗━━━━━━━━━━━━━━━━━▣\n\n' +

        '┏━━━━━━━━━━━━━━━━━▣\n' +
        '┃ *🤖 Bot-Level Privacy*\n' +
        '┃ 🔧 Maintenance:      ' + g('maintenance')       + '\n' +
        '┃ 🗑️ Anti Delete:      ' + g('antidelete_global') + '\n' +
        '┃ 📖 Auto Read:        ' + g('autoread')          + '\n' +
        '┗━━━━━━━━━━━━━━━━━▣\n\n' +

        '┏━━━━━━━━━━━━━━━━━▣\n' +
        '┃ *🔧 Quick Commands*\n' +
        '┃ !ghost • !incognito • !paranoid\n' +
        '┃ !silentmode • !noforward • !nosave\n' +
        '┃ !antitrace • !covertrack • !pp @user\n' +
        '┃ !blockuser @user • !myblacklist\n' +
        '┃ !lastseen • !online • !readreceipts\n' +
        '┃ !statusview • !profileprivacy\n' +
        '┃ !groupsprivacy • !hideonline\n' +
        '┗━━━━━━━━━━━━━━━━━▣\n\n' +
        '_Tap any command to toggle or configure it._ 😊',
    });
  },
};
