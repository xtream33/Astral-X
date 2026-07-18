const settings = require('../utils/settings');

module.exports = {
  name: 'setprefix',
  aliases: ['prefix', 'changeprefix'],
  category: 'owner',
  description: 'Change your bot prefix. Owner only. !setprefix ! or !setprefix reset',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ Only the bot owner can change the prefix.' });

    const currentPrefix = settings.get('prefix:' + userId) || process.env.BOT_PREFIX || '!';

    // Show current if no args
    if (!args[0]) {
      return sock.sendMessage(jid, {
        text:
          '〔 ✧ ᴀsᴛʀᴀ-x ✧ 〕\n' +
          '┏━━━━━━━━━━━━━━━━━▣\n' +
          '┃ ⚙️ *ᴘʀᴇғɪx sᴇᴛᴛɪɴɢs*\n' +
          '┠───────────────────\n' +
          '┃ Current: *' + currentPrefix + '*\n' +
          '┠───────────────────\n' +
          '┃ *Change:*  !setprefix #\n' +
          '┃ *Reset:*   !setprefix reset\n' +
          '┃ *Examples:* . / # / $ / ? / ~\n' +
          '┗━━━━━━━━━━━━━━━━━▣',
      });
    }

    // Reset to default
    if (args[0].toLowerCase() === 'reset') {
      settings.del('prefix:' + userId);
      const def = process.env.BOT_PREFIX || '!';
      return sock.sendMessage(jid, { text: '✅ Prefix reset to default: *' + def + '*' });
    }

    const newPrefix = args[0];
    if (newPrefix.length > 3) return sock.sendMessage(jid, { text: '❌ Prefix must be 1-3 characters. Example: ! . # $' });
    if (/[a-zA-Z0-9]/.test(newPrefix)) return sock.sendMessage(jid, { text: '❌ Prefix cannot be a letter or number. Use symbols like: ! . # $ ~ ?' });

    // Save per-user prefix
    settings.set('prefix:' + userId, newPrefix);

    await sock.sendMessage(jid, {
      text:
        '〔 ✧ ᴀsᴛʀᴀ-x ✧ 〕\n' +
        '┏━━━━━━━━━━━━━━━━━▣\n' +
        '┃ ✅ *ᴘʀᴇғɪx ᴄʜᴀɴɢᴇᴅ*\n' +
        '┠───────────────────\n' +
        '┃ Old: *' + currentPrefix + '*\n' +
        '┃ New: *' + newPrefix + '*\n' +
        '┠───────────────────\n' +
        '┃ Use: *' + newPrefix + 'menu*\n' +
        '┃ Saved permanently ✅\n' +
        '┗━━━━━━━━━━━━━━━━━▣',
    });
  },
};
