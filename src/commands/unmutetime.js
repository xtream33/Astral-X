const settings = require('../utils/settings');

module.exports = {
  name: 'unmutetime',
  aliases: ['untm', 'unmutetemp'],
  category: 'group',
  description: 'Remove a time-mute from a user early. Usage: !unmutetime @user',
  execute: async (sock, msg) => {
    const jid    = msg.key.remoteJid;
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    if (!target)
      return sock.sendMessage(jid, { text: '❌ Mention the user to unmute: !unmutetime @user' });

    settings.del('muted:' + jid + ':' + target);
    const num = target.split('@')[0];

    await sock.sendMessage(jid, {
      text: '🔊 *@' + num + ' has been unmuted.*',
      mentions: [target],
    });
  },
};
