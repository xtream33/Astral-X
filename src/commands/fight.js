module.exports = {
  name: 'fight', aliases: ['battle', 'vs', 'war'],
  category: 'fun', description: 'Fight animation between two people. !fight @user',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid     = msg.key.remoteJid;
    const you     = (msg.pushName || 'You');
    const target  = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const opponent = target ? ('@' + target.split('@')[0]) : (args.join(' ') || 'Opponent');
    const mentions = target ? [target] : [];
    const winner   = Math.random() > 0.5 ? you : opponent;
    const scenes   = [
      '⚔️ *BATTLE STARTED!*\n' + you + ' 🆚 ' + opponent,
      '👊 ' + you + ' throws a punch!\n😤 ' + opponent + ' dodges!',
      '💥 ' + opponent + ' counters!\n😱 ' + you + ' takes damage!',
      '🔥 ' + you + ' uses *ULTIMATE MOVE*!\n💀 ' + opponent + ' is on the edge!',
      '🏆 *WINNER: ' + winner + '*\n\n🎉 GG! Battle over!',
    ];
    let m = null;
    for (const scene of scenes) {
      if (!m) m = await sock.sendMessage(jid, { text: scene, mentions });
      else await sock.sendMessage(jid, { edit: m.key, text: scene });
      await new Promise(r => setTimeout(r, 1500));
    }
  },
};
