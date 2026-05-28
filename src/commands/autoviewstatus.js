'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'autoviewstatus',
  aliases: ['viewstatus','avstatus'],
  category: 'auto',
  description: 'Toggle auto view status. Usage: .autoviewstatus on / .autoviewstatus off',
  execute: async (sock, msg, args, userId) => {
    const jid     = msg.key.remoteJid;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('autoviewstatus:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Auto View Status', '👀', result,
        'All statuses auto-viewed silently',
        'Status auto-view disabled'
      ),
    });
  },
};
