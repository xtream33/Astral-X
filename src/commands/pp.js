'use strict';
const { fetchBuffer } = require('../utils/ytdlp');

module.exports = {
  name: 'pp',
  aliases: ['pfp','profilephoto','avatar','userpic','dpic','dp'],
  category: 'privacy',
  description: 'Download a WhatsApp profile photo. Reply to or mention a user.',
  execute: async (sock, msg, args) => {
    const jid       = msg.key.remoteJid;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const quoted    = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const target    = mentioned || quoted || (jid.endsWith('@g.us') ? (msg.key.participant || jid) : jid);
    const num       = target.split('@')[0];

    await sock.sendMessage(jid, { text: '🖼️ Fetching profile photo, please wait...' });

    try {
      const ppUrl = await sock.profilePictureUrl(target, 'image');
      const buf   = await fetchBuffer(ppUrl);
      await sock.sendMessage(jid, {
        image: buf,
        caption:
          '🖼️ *Profile Photo*\n' +
          '━━━━━━━━━━━━━━\n' +
          '📱 *Number:* +' + num + '\n' +
          '_Tap & hold to save_ 💾',
        mentions: [target],
      });
    } catch (_) {
      await sock.sendMessage(jid, {
        text:
          '❌ *Profile photo not available.*\n\n' +
          '_This person may have set their profile photo to private, or they haven\'t set one yet._\n\n' +
          '🙏 Nothing we can do in that case!',
      });
    }
  },
};
