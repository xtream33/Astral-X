'use strict';
const { box } = require('../utils/format');
const settings = require('../utils/settings');
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');
module.exports = {
  name: 'antiflood', aliases: ['floodcontrol', 'ratelimit'],
  category: 'anti', description: 'Limit message speed in groups. Usage: .antiflood [on/off/limit]',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('🌊 *ANTI FLOOD*', '❌ This command only works in groups.') });
    if (args.length && !isNaN(parseInt(args[0]))) {
      const limit = parseInt(args[0]);
      if (limit < 1) return sock.sendMessage(jid, { text: box('🌊 *ANTI FLOOD*', '❌ Limit must be 1 or more.\n\n📌 *Usage:* .antiflood <number>') });
      settings.set('antiflood:' + jid, true);
      settings.set('floodlimit:' + jid, limit);
      return sock.sendMessage(jid, { text: box('🌊 *ANTI FLOOD*', '✅ Anti-flood *enabled*\n\n⚡ Limit: *' + limit + ' messages / 5 seconds*\n\n_Members exceeding limit will be warned._') });
    }
    const result = smartToggle('antiflood:' + jid, parseOnOff(args[0]));
    const lim    = settings.get('floodlimit:' + jid) || 5;
    await sock.sendMessage(jid, {
      text: toggleMsg('Anti Flood', '🌊', result,
        'Limit: ' + lim + ' msgs/5sec\n┃ • Members exceeding limit get warned',
        'Members can now send freely'
      ) + '\n\n_Set limit: *.antiflood <number>*_',
    });
  },
};
