'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'calc', aliases: ['calculator', 'compute', 'evaluate', 'expr'],
  category: 'utility', description: 'Calculator. Usage: .calc <expression>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: box('🧮 *CALCULATOR*', '📌 *Usage:* .calc <expression>\n\n💡 *Examples:*\n.calc 10 * 5 + 3\n.calc (100 / 4) * 2\n.calc 15 % 4') });
    const expr = args.join(' ').replace(/[^0-9\s\+\-\*\/\(\)\.%]/g, '');
    if (!expr.trim()) return sock.sendMessage(jid, { text: box('🧮 *CALCULATOR*', '❌ Only numbers and *+ - * / ( ) %* allowed.') });
    try {
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict";return(' + expr + ')')();
      if (!isFinite(result)) return sock.sendMessage(jid, { text: box('🧮 *CALCULATOR*', '❌ Result is not a valid number.') });
      await sock.sendMessage(jid, { text: box('🧮 *CALCULATOR*', '📥 *Expression:*\n_' + expr + '_\n━━━━━━━━━━━━━━\n📤 *Result:*\n*' + result + '*') }, { quoted: msg });
    } catch { await sock.sendMessage(jid, { text: box('🧮 *CALCULATOR*', '❌ Invalid expression. Check your syntax.') }); }
  },
};
