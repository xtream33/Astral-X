const normal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const aes    = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９';
module.exports = {
  name: 'aesthetic', aliases: ['vaporwave', 'wide', 'fullwidth', 'aes'],
  category: 'fun', description: 'Ｃｏｎｖｅｒｔ ｔｅｘｔ ｔｏ ａｅｓｔｈｅｔｉｃ. !aesthetic hello',
  execute: async (sock, msg, args) => {
    if (!args.length) return sock.sendMessage(msg.key.remoteJid, { text: '❌ !aesthetic your text here' });
    const out = args.join(' ').split('').map(c => {
      const i = normal.indexOf(c);
      return i !== -1 ? aes[i] : c;
    }).join('');
    await sock.sendMessage(msg.key.remoteJid, { text: out });
  },
};
