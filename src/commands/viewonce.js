'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');
module.exports = {
  name: 'viewonce',
  aliases: ['vo'],
  category: 'viewonce',
  description: 'Toggle ViewOnce unlock. Usage: .viewonce on / .viewonce off',
  execute: async (sock, msg, args, userId) => {
    const jid     = msg.key.remoteJid;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('viewonce:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('ViewOnce Unlock', '👁️', result,
        'View-once photos & videos will be re-sent for all to see',
        'View-once messages will stay private'
      ),
    });
  },
};
