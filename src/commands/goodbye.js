'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');
module.exports = {
  name: 'goodbye', category: 'group', description: 'Toggle goodbye messages. Usage: .goodbye on / .goodbye off',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('goodbye:' + jid, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Goodbye Messages', '👋', result,
        'Members leaving will get a farewell',
        'Goodbye messages disabled'
      ) + '\n\n_Customise: *.setgoodbye <message>*_',
    });
  },
};
