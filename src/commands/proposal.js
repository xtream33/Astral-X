'use strict';
const { ask } = require('../utils/gemini');

module.exports = {
  name: 'proposal',
  aliases: ['businessplan', 'bizplan', 'pitchdeck', 'businessproposal'],
  category: 'finance',
  description: 'Write a business proposal. Usage: .proposal <business idea>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const idea = args.join(' ').trim();
    if (!idea) return sock.sendMessage(jid, { text: '💼 Usage: *.proposal <your business idea>*\n\nExamples:\n• .proposal online food delivery in Kampala\n• .proposal car wash business\n• .proposal social media marketing agency' });
    await sock.sendMessage(jid, { text: '💼 _Writing your business proposal..._' });
    try {
      const reply = await ask(
        'Write a professional business proposal for: ' + idea + '\n\n' +
        'Include:\n' +
        '📋 Executive Summary\n' +
        '🎯 Business Objectives\n' +
        '🎁 Products/Services Offered\n' +
        '👥 Target Market\n' +
        '💰 Revenue Model\n' +
        '📊 Basic Financial Projection\n' +
        '🏆 Competitive Advantage\n' +
        '🚀 Next Steps\n\n' +
        'Keep it concise, professional and compelling.'
      );
      await sock.sendMessage(jid, {
        text: '💼 *Business Proposal: ' + idea + '*\n━━━━━━━━━━━━━━\n\n' + reply + '\n\n_Powered by ASTRA-X_',
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Error: ' + e.message });
    }
  },
};
