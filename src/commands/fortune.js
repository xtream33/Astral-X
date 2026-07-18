const FORTUNES = [
  "A great opportunity will come your way soon. Be ready.",
  "Your kindness will be returned tenfold today.",
  "The person you help today will remember you forever.",
  "Success is not the key to happiness — happiness is the key to success.",
  "A surprise message will make your day brighter.",
  "Today is a perfect day to start something new.",
  "Someone is thinking about you right now and smiling.",
  "Your hard work will pay off sooner than you think.",
  "The best is yet to come. Keep going.",
  "You have the power to change someone's life with your words today.",
  "An unexpected meeting will lead to great things.",
  "Trust your instincts — they are rarely wrong.",
];
module.exports = {
  name: 'fortune', aliases: ['lucky', 'horoscope', 'predict', 'future'],
  category: 'fun', description: 'Get your fortune for today',
  execute: async (sock, msg) => {
    const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    await sock.sendMessage(msg.key.remoteJid, { text: '🔮 *Your Fortune*\n\n✨ ' + f });
  },
};
