'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'antispam',
  aliases: ['nospam','stopspam'],
  category: 'anti',
  description: 'Toggle anti-spam in groups. Usage: .antispam on / .antispam off',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, { text: '❌ This command only works inside groups. 🙏' });
    }
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('antispam:' + jid, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Anti Spam', '🚫', result,
        'Detects & warns repeat spammers',
        'Spam detection disabled'
      ),
    });
  },
};
