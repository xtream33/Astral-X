'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'paranoid',
  aliases: ['ultrastealth','maxprivacy','fullprivacy','lockdown'],
  category: 'privacy',
  description: 'Paranoid mode — activates ALL privacy features. Usage: .paranoid on / .paranoid off',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 Owner only command. 🙏' });
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('paranoid:' + userId, forceOn);
    const feats   = ['ghost','noforward','nosave','antitrace','silentmode','incognito'];
    if (result.state) {
      feats.forEach(f => require('../utils/settings').set(f + ':' + userId, true));
      try {
        await sock.sendPresenceUpdate('unavailable');
        await sock.updateReadReceiptsPrivacy('none').catch(() => {});
        await sock.updateLastSeenPrivacy('none').catch(() => {});
        await sock.updateOnlinePrivacy('match_last_seen').catch(() => {});
        await sock.updateGroupsAddPrivacy('contacts').catch(() => {});
      } catch (_) {}
    } else {
      feats.forEach(f => require('../utils/settings').set(f + ':' + userId, false));
      try {
        await sock.sendPresenceUpdate('available');
        await sock.updateReadReceiptsPrivacy('all').catch(() => {});
        await sock.updateLastSeenPrivacy('contacts').catch(() => {});
        await sock.updateOnlinePrivacy('all').catch(() => {});
      } catch (_) {}
    }
    await sock.sendMessage(jid, {
      text: toggleMsg('Paranoid Mode 🔐', '🔒', result,
        'ALL privacy features activated:\n┃ • Ghost mode ON\n┃ • Anti-forward ON\n┃ • No-save ON\n┃ • Anti-trace ON\n┃ • Silent mode ON\n┃ • Read receipts hidden\n┃ • Last seen hidden',
        'All privacy features deactivated\n┃ • Back to normal operation 🎉'
      ),
    });
  },
};
