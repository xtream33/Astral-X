const lines = [
  "Are you a parking ticket? Because you've got fine written all over you.",
  "Do you have a map? I keep getting lost in your eyes.",
  "Are you a magician? Every time I look at you, everyone else disappears.",
  "Do you have a name or can I call you mine?",
  "Are you a camera? Every time I look at you I smile.",
  "If you were a vegetable, you'd be a cute-cumber.",
  "Are you made of copper and tellurium? Because you are CuTe.",
  "Is your name Google? Because you have everything I've been searching for.",
  "Are you Spotify? Because I can see myself listening to you all day.",
  "Do you believe in love at first text, or should I send another?",
];
module.exports = {
  name: 'rizz', aliases: ['pickup', 'flirt', 'pickupline', 'rizup', 'charm'],
  category: 'fun', description: 'Get a random pickup line 😏',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    const line = lines[Math.floor(Math.random() * lines.length)];
    await sock.sendMessage(jid, { text: "😏 " + line });
  },
};
