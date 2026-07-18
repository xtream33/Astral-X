'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'nosave',
  aliases: ['antinosave','nosavemedia','blocksave'],
  category: 'privacy',
  description: 'Toggle view-once mode: all media sent by bot becomes view-once.',
  execute: async (sock, msg, args, userId) => {
    const jid    = msg.key.remoteJid;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('nosave:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('No-Save Mode (View Once)', '👁️', result,
        'Bot media sent as view-once (cannot be saved)',
        'Bot media sent normally'
      ),
    });
  },
};
