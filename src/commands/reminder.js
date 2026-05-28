function parseTime(str) {
  const m = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!m) return null;
  const n = parseInt(m[1]);
  return { s: n*1000, m: n*60000, h: n*3600000, d: n*86400000 }[m[2].toLowerCase()];
}
module.exports = {
  name: 'reminder', aliases: ['remind', 'remindme'], category: 'utility',
  description: 'Set a reminder. !reminder 30m buy groceries',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (args.length < 2) return sock.sendMessage(jid, { text: '\u274c Usage: !reminder <time> <message>\nTime: 30s, 5m, 2h, 1d\nExample: !reminder 1h call mom' });
    const ms = parseTime(args[0]);
    if (!ms) return sock.sendMessage(jid, { text: '\u274c Invalid time. Use: 30s, 5m, 2h, 1d' });
    const note = args.slice(1).join(' ');
    const sender = ctx.sender || msg.key.remoteJid;
    await sock.sendMessage(jid, { text: '\u23f0 Reminder set! I will ping you in *' + args[0] + '*.' });
    setTimeout(async () => {
      await sock.sendMessage(jid, { text: '\u23f0 *REMINDER!*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n' + note + '\n\u2014 @' + sender.split('@')[0], mentions: [sender] }).catch(() => {});
    }, ms);
  }
};