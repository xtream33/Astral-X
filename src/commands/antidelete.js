'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'antidelete',
  aliases: ['ad','antirevoke'],
  category: 'group',
  description: 'Toggle anti-delete. Usage: .antidelete on / .antidelete off',
  execute: async (sock, msg, args, userId) => {
    const jid = msg.key.remoteJid;
    const forceOn = parseOnOff(args[0]);

    if (jid.endsWith('@g.us')) {
      const result = smartToggle('antidelete:' + jid, forceOn);
      return sock.sendMessage(jid, {
        text: toggleMsg('Anti Delete', '🗑️', result,
          'Deleted messages forwarded to the bot owner',
          'Deleted messages will no longer be tracked'
        ),
      });
    }

    const result = smartToggle('antidelete_global:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Anti Delete (Global)', '🗑️', result,
        'ALL deleted messages across all chats forwarded to you',
        'Global anti-delete is now off'
      ),
    });
  },
};
