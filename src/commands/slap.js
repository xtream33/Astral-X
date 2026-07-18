module.exports = {
  name: 'slap', aliases: ['smack', 'hit', 'punch'],
  category: 'fun', description: 'Slap someone. !slap @user',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const you    = msg.pushName || 'Someone';
    const name   = target ? ('@' + target.split('@')[0]) : (args.join(' ') || 'nobody');
    const emojis = ['🤚', '👋', '🖐️', '✋'];
    const e = emojis[Math.floor(Math.random() * emojis.length)];
    await sock.sendMessage(jid, {
      text: e + ' *' + you + '* slapped *' + name + '* so hard they flew to the moon! 🌕😂',
      mentions: target ? [target] : [],
    });
  },
};
