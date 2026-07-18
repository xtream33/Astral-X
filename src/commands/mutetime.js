const settings = require('../utils/settings');

module.exports = {
  name: 'mutetime',
  aliases: ['tempmute', 'tm'],
  category: 'group',
  description: 'Mute a user for X minutes — deletes all their messages. Usage: !mutetime @user 30',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us'))
      return sock.sendMessage(jid, { text: '❌ This command only works in groups.' });

    const target  = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const minutes = parseInt(args.find(a => !isNaN(parseInt(a))) || '60');

    if (!target)
      return sock.sendMessage(jid, {
        text: '❌ *Usage:* !mutetime @user 30\n\n• Reply to a message or mention the user\n• Minutes: how long to mute (default 60)',
      });

    if (minutes < 1 || minutes > 1440)
      return sock.sendMessage(jid, { text: '❌ Minutes must be between 1 and 1440 (24 hours).' });

    const expiry = Date.now() + minutes * 60_000;
    settings.set('muted:' + jid + ':' + target, expiry);

    const num     = target.split('@')[0];
    const h       = Math.floor(minutes / 60);
    const m       = minutes % 60;
    const timeStr = h > 0 ? h + 'h ' + (m > 0 ? m + 'm' : '') : m + ' minutes';

    await sock.sendMessage(jid, {
      text:
        '🔇 *@' + num + ' has been muted for ' + timeStr + '*\n\n' +
        '• All their messages will be deleted\n' +
        '• Mute expires automatically\n' +
        '• Use !unmutetime @user to unmute early',
      mentions: [target],
    });
  },
};
