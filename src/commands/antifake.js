'use strict';
const settings = require('../utils/settings');
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');
module.exports = {
  name: 'antifake', category: 'anti',
  description: 'Block non-local numbers. Usage: .antifake on / .antifake off / .antifake 256',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    // If arg is a country code number (e.g. 256), set the code and enable
    if (args[0] && /^\+?\d+$/.test(args[0])) {
      const code = args[0].replace('+', '');
      settings.set('antifake:' + jid, true);
      settings.set('antifake_code:' + jid, code);
      return sock.sendMessage(jid, {
        text:
          '〔 ✧ ᴀsᴛʀᴀ-x ✧ 〕\n' +
          '┏━━━━━━━━━━━━━━━━━▣\n' +
          '┃ 🛡️ *ANTI FAKE*\n' +
          '┠───────────────────\n' +
          '┃ Status: *🟢 ENABLED*\n' +
          '┃ Country code: *+' + code + '*\n' +
          '┠───────────────────\n' +
          '┃ Only +' + code + ' numbers are allowed.\n' +
          '┗━━━━━━━━━━━━━━━━━▣',
      });
    }
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('antifake:' + jid, forceOn);
    const code    = settings.get('antifake_code:' + jid) || '??';
    await sock.sendMessage(jid, {
      text: toggleMsg('Anti Fake', '🛡️', result,
        'Only *+' + code + '* numbers allowed\n┃ _Set code: *.antifake <code>*_',
        'All numbers can join freely'
      ),
    });
  },
};
