'use strict';
const { box } = require('../utils/format');
const settings = require('../utils/settings');
module.exports = {
  name: 'rules', aliases: ['grouprules', 'showrules'],
  category: 'group', description: 'Show group rules. Usage: .rules',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('📋 *GROUP RULES*', '❌ This command only works in groups.') });
    const r = settings.get('rules:' + jid);
    if (!r) return sock.sendMessage(jid, { text: box('📋 *GROUP RULES*', '❌ No rules set yet.\n\n_Admins can set rules with:_\n*.setrules <rules text>*') });
    await sock.sendMessage(jid, { text: box('📋 *GROUP RULES*', r) });
  },
};
