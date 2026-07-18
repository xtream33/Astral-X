module.exports = {
  name: 'jail', aliases: ['prison', 'arrest', 'lock'],
  category: 'fun', description: 'Put someone in jail. !jail @user',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const name   = target ? ('@' + target.split('@')[0]) : (args.join(' ') || 'you');
    const reasons = ['spamming', 'being too active', 'saying sus things', 'being the group villain', 'existing', 'questioning the bot'];
    const reason  = reasons[Math.floor(Math.random() * reasons.length)];
    await sock.sendMessage(jid, {
      text:
        '🚔 *ASTRA-X POLICE DEPARTMENT*\n\n' +
        '🔒 *' + name + '* has been arrested!\n\n' +
        '```\n┌─────────────────┐\n│  ░░░░░░░░░░░░░  │\n│  ░ 👮 CAUGHT ░  │\n│  ░░░░░░░░░░░░░  │\n│  Reason: ' + reason.slice(0,15) + ' │\n└─────────────────┘```\n\n' +
        '⏰ Sentence: *99 years* 😂\n🔑 Bail: *Ask the owner*',
      mentions: target ? [target] : [],
    });
  },
};
