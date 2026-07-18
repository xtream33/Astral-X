module.exports = {
  name: 'love', aliases: ['lovematch', 'compatibility', 'crush'],
  category: 'fun', description: 'Check love compatibility with someone',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const you    = msg.pushName || 'You';
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const name   = target ? ('@' + target.split('@')[0]) : (args.join(' ') || '???');
    const pct    = Math.floor(Math.random() * 101);
    const filled = Math.round(pct / 10);
    const bar    = '❤️'.repeat(filled) + '🖤'.repeat(10 - filled);
    const msgs   = pct >= 90 ? 'PERFECT MATCH! 🎉' : pct >= 70 ? 'Very compatible! 😍' : pct >= 50 ? 'Worth a shot! 😊' : pct >= 30 ? 'It\'s complicated 😅' : 'Not meant to be 💔';
    await sock.sendMessage(jid, {
      text: '💘 *Love Compatibility*\n\n' + you + ' + ' + name + '\n\n' + bar + '\n\n💯 *' + pct + '%* — ' + msgs,
      mentions: target ? [target] : [],
    });
  },
};
