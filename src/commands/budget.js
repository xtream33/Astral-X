'use strict';
const { ask } = require('../utils/gemini');

module.exports = {
  name: 'budget',
  aliases: ['budgetplan', 'moneyplan', 'savingsplan', 'finance'],
  category: 'finance',
  description: 'Get a personal budget plan. Usage: .budget <income> <currency>',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const income = args[0];
    const curr   = args[1] || 'USD';
    if (!income || isNaN(income)) {
      return sock.sendMessage(jid, {
        text:
          '💵 *Budget Planner*\n━━━━━━━━━━━━━━\n\n' +
          'Usage: *.budget <monthly income> [currency]*\n\n' +
          'Examples:\n' +
          '• .budget 500000 UGX\n' +
          '• .budget 1000 USD\n' +
          '• .budget 50000 KES',
      });
    }
    await sock.sendMessage(jid, { text: '💵 _Planning your budget..._' });
    try {
      const reply = await ask(
        'Create a practical monthly budget plan for someone earning ' + income + ' ' + curr + ' per month.\n\n' +
        'Use the 50/30/20 rule as a guide. Format clearly:\n\n' +
        '💰 INCOME: ' + income + ' ' + curr + '\n\n' +
        '🏠 NEEDS (50%) - Essential expenses\n' +
        '🎉 WANTS (30%) - Lifestyle expenses\n' +
        '💾 SAVINGS (20%) - Savings & investments\n\n' +
        'List specific categories with amounts. Give practical tips for saving money.'
      );
      await sock.sendMessage(jid, {
        text: '💵 *Monthly Budget Plan*\n━━━━━━━━━━━━━━\n\n' + reply + '\n\n_Powered by ASTRA-X_',
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Error: ' + e.message });
    }
  },
};
