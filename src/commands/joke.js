'use strict';
const { box } = require('../utils/format');
const JOKES = [
  ['Why don\'t scientists trust atoms?', 'Because they make up everything!'],
  ['Why did the scarecrow win an award?', 'He was outstanding in his field!'],
  ['I told my wife she was drawing her eyebrows too high.', 'She looked surprised.'],
  ['Why don\'t eggs tell jokes?', 'They\'d crack each other up.'],
  ['What do you call a fake noodle?', 'An impasta!'],
  ['Why can\'t you give Elsa a balloon?', 'She\'ll let it go.'],
  ['I\'m reading a book about anti-gravity.', 'It\'s impossible to put down!'],
  ['What do you call cheese that isn\'t yours?', 'Nacho cheese!'],
  ['I would tell you a construction joke...', 'But I\'m still working on it.'],
  ['What do you call a sleeping dinosaur?', 'A dino-snore!'],
  ['Why do cows wear bells?', 'Because their horns don\'t work!'],
  ['What do you call a bear with no teeth?', 'A gummy bear!'],
  ['I asked my dog what 2 minus 2 is.', 'He said nothing.'],
  ['Why did the math book look sad?', 'It had too many problems.'],
  ['What do you call a fish without eyes?', 'A fsh!'],
];
module.exports = {
  name: 'joke', aliases: ['jokes', 'funny', 'lol', 'haha'],
  category: 'fun', description: 'Get a random joke. Usage: .joke',
  execute: async (sock, msg) => {
    const [setup, punchline] = JOKES[Math.floor(Math.random() * JOKES.length)];
    await sock.sendMessage(msg.key.remoteJid, { text: box('😂 *JOKE TIME*', '🗣️ ' + setup + '\n━━━━━━━━━━━━━━\n\n🥁 _..._ *' + punchline + '*') }, { quoted: msg });
  },
};
