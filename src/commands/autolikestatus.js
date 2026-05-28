'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'autolikestatus',
  aliases: ['likestatus','alstatus'],
  category: 'auto',
  description: 'Toggle Auto Like Status. Responds with already-on/off if no change needed.',
  execute: async (sock, msg, args, userId) => {
    const jid = msg.key.remoteJid;

    const scopeKey = 'autolikestatus:' + userId;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle(scopeKey, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Auto Like Status', '💚', result, 'All statuses auto-liked with 💚', 'Status auto-like disabled'),
    });
  },
};
