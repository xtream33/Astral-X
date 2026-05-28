'use strict';
const { box } = require('../utils/format');
const settings = require('../utils/settings');
module.exports = {
  name: 'warn', aliases: ['warning', 'strike'],
  category: 'group', description: 'Warn a user. Usage: .warn @user [reason]',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('⚠️ *WARN*', '❌ This command only works in groups.') });
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                || msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!target) return sock.sendMessage(jid, { text: box('⚠️ *WARN*', '📌 *Usage:* .warn @user [reason]\n\n_Tag the member you want to warn._') });
    const reason = args.slice(1).join(' ') || 'No reason given';
    const key    = 'warns:' + jid + ':' + target;
    const count  = (settings.get(key) || 0) + 1;
    settings.set(key, count);
    const num = target.split('@')[0];
    if (count >= 3) {
      await sock.sendMessage(jid, { text: box('⛔ *REMOVED — 3/3 WARNS*', '👤 @' + num + '\n🚫 *Removed from group*\n📝 Reason: _' + reason + '_'), mentions: [target] });
      await sock.groupParticipantsUpdate(jid, [target], 'remove').catch(() => {});
      settings.del(key);
    } else {
      await sock.sendMessage(jid, { text: box('⚠️ *WARNING ' + count + '/3*', '👤 @' + num + '\n📝 Reason: _' + reason + '_\n\n_' + (3 - count) + ' more warning(s) = removed from group._'), mentions: [target] });
    }
  },
};
