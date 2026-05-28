module.exports = {
  name: 'qr',
  aliases: ['qrcode', 'makeqr', 'genqr', 'createqr'],
  category: 'utility',
  description: 'Generate a real QR code image locally. !qr <text or URL>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const text = args.join(' ').trim();
    if (!text) return sock.sendMessage(jid, {
      text: '📱 *QR Code Generator*\n\n*Usage:* !qr <any text or URL>\n*Examples:*\n• !qr https://google.com\n• !qr My Phone: 256747304196\n• !qr Hello World',
    });

    try {
      const QRCode = require('qrcode');
      const buffer = await QRCode.toBuffer(text, {
        type:               'png',
        width:              600,
        margin:             4,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      await sock.sendMessage(jid, {
        image:   buffer,
        caption: '📱 *QR Code Generated*\n\n*Content:* ' + (text.length > 60 ? text.slice(0, 60) + '...' : text) + '\n\n_Scan with any QR reader_',
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ QR generation failed: ' + e.message + '\n\nMake sure qrcode is installed:\n```npm install qrcode```' });
    }
  },
};
