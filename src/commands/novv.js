'use strict';
const settings = require('../utils/settings');
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'novv',
  aliases: ['antiviewonce', 'antivo', 'noviewonce'],
  category: 'viewonce',
  description: 'Toggle anti-viewonce in groups. Blocks and deletes view-once messages. Usage: .novv on / .novv off',
  execute: async (sock, msg, args, userId) => {
    const jid = msg.key.remoteJid;

    // ── Group-only command ───────────────────────────────────────────
    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, {
        text:
          '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n' +
          '┏━━━━━━━━━━━━━━━━━━━▣\n' +
          '┃ 🚫 *NOVV — GROUP ONLY*\n' +
          '┠─────────────────────\n' +
          '┃ This command only works\n' +
          '┃ inside a group chat.\n' +
          '┗━━━━━━━━━━━━━━━━━━━▣\n' +
          '_ᴀsᴛʀᴀ-x ᴛᴇᴄʜ 🌍_',
      });
    }

    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('novv:' + jid, forceOn);

    await sock.sendMessage(jid, {
      text:
        toggleMsg(
          'Anti ViewOnce', '🚫',
          result,
          '• View-once messages are *blocked*\n' +
          '┃ • They will be auto-deleted\n' +
          '┃ • Sender gets notified privately\n' +
          '┃ • Admins are also blocked',
          '• Members can now send view-once\n' +
          '┃   messages in this group'
        ) +
        '\n\n_Toggle: *.novv on* / *.novv off*_',
    });
  },
};
