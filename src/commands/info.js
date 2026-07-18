module.exports = {
  name: 'info',
  category: 'info',
  description: 'Bot information',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    await sock.sendMessage(jid, {
      text: `〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ ℹ️  *ʙᴏᴛ ɪɴғᴏ*\n┠─────────────────────\n┃ 🤖 Name:     ASTRA-X Bot\n┃ 📌 Version:  v6.6.6\n┃ ⚡ Engine:   Baileys v6\n┃ 🌍 Mode:     Always Online\n┃ 🔧 Prefix:   ! (exclamation)\n┃ 👤 Owner:    +256747304196\n┃ 📢 Channel:  whatsapp.com/channel/\n┃              0029Vb7vchCCBtxK3Ria2k1i\n┗━━━━━━━━━━━━━━━━━━━▣\n_Powered by ASTRA-X Tech © 2026_`
    });
  }
};
