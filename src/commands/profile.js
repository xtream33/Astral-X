const settings = require('../utils/settings');
module.exports = {
  name: 'profile', category: 'user',
  description: 'View your bot profile card',
  execute: async (sock, msg, args, userId) => {
    const jid = msg.key.remoteJid;
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const who = target || (msg.key.participant || msg.key.remoteJid);
    const num = who.split('@')[0];
    const bio   = settings.get(`bio:${userId}:${num}`) || 'No bio set';
    const level = settings.get(`level:${userId}:${num}`) || 0;
    const rank  = level > 500 ? '👑 Legend' : level > 200 ? '💎 Diamond' : level > 100 ? '🥇 Gold' : level > 50 ? '🥈 Silver' : '🥉 Bronze';
    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴘʀᴏғɪʟᴇ ✧ 〕\n┏━━━━━━━━━━━━━━━━━▣\n┃ 👤 *@' + num + '*\n┠───────────────────\n┃ 📝 Bio: ' + bio + '\n┃ 💬 Messages: ' + level + '\n┃ 🏅 Rank: ' + rank + '\n┃ 📱 Number: +' + num + '\n┗━━━━━━━━━━━━━━━━━▣',
      mentions: target ? [target] : []
    });
  }
};
