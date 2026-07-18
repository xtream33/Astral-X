'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');
module.exports = {
  name: 'welcome', category: 'group', description: 'Toggle welcome messages. Usage: .welcome on / .welcome off',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('welcome:' + jid, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Welcome Messages', '👋', result,
        'New members will be greeted',
        'Welcome messages disabled'
      ) + '\n\n_Customise: *.setwelcome <message>*_',
    });
  },
};
