module.exports = {
  name: 'hack', aliases: ['hacker', 'hackuser'],
  category: 'fun', description: 'Fake hack animation on a user',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const name   = target ? ('@' + target.split('@')[0]) : (args.join(' ') || 'the target');
    const steps  = [
      '```[ASTRA-X HACKER v6.6.6]```\n🔍 Locating *' + name + '*...',
      '```[ASTRA-X HACKER v6.6.6]```\n✅ Target found!\n📡 Connecting to device...',
      '```[ASTRA-X HACKER v6.6.6]```\n🔓 Bypassing firewall...\n[████░░░░░░] 40%',
      '```[ASTRA-X HACKER v6.6.6]```\n💾 Accessing files...\n[████████░░] 80%',
      '```[ASTRA-X HACKER v6.6.6]```\n📂 Extracting data...\n[██████████] 100%\n\n✅ *Hack complete!*\n😂 _Just kidding, relax!_',
    ];
    let m = null;
    for (let i = 0; i < steps.length; i++) {
      if (!m) {
        m = await sock.sendMessage(jid, { text: steps[i], mentions: target ? [target] : [] });
      } else {
        await sock.sendMessage(jid, { edit: m.key, text: steps[i] });
      }
      if (i < steps.length - 1) await new Promise(r => setTimeout(r, 1500));
    }
  },
};
