const crypto = require('crypto');
module.exports = {
  name: 'password', aliases: ['genpass', 'generatepassword', 'passwd', 'strongpass', 'makepass'],
  category: 'utility', description: 'Generate a strong random password. !password [length]',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const len  = Math.min(Math.max(parseInt(args[0]) || 16, 8), 64);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}';
    const bytes = crypto.randomBytes(len);
    const pass  = Array.from(bytes).map(b => chars[b % chars.length]).join('');
    await sock.sendMessage(jid, {
      text: '🔐 *Generated Password*\n\n```' + pass + '```\n\n📏 Length: ' + len + ' characters\n_Save it somewhere safe!_',
    });
  },
};
