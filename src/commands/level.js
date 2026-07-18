const settings = require('../utils/settings');
module.exports = {
  name: 'level', aliases: ['lvl', 'rank'], category: 'fun',
  description: 'Check your activity level in this group',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    const sender = ctx.sender || msg.key.remoteJid;
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
    const count  = settings.get('msgcount:' + jid + ':' + target) || 0;
    const level  = count < 10 ? 1 : count < 50 ? 2 : count < 100 ? 3 : count < 250 ? 4 : count < 500 ? 5 : count < 1000 ? 6 : count < 2000 ? 7 : count < 5000 ? 8 : count < 10000 ? 9 : 10;
    const labels = ['','Newbie','Regular','Active','Engaged','Veteran','Elite','Champion','Legend','Master','GOD'];
    const bar    = '█'.repeat(level) + '░'.repeat(10 - level);
    await sock.sendMessage(jid, {
      text: '🏅 *LEVEL CARD*\n━━━━━━━━━━━━━━\n' +
            '👤 @' + target.split('@')[0] + '\n' +
            '⭐ Level: *' + level + ' — ' + labels[level] + '*\n' +
            bar + ' ' + level + '/10\n' +
            '💬 Messages: *' + count + '*',
      mentions: [target]
    });
  }
};
