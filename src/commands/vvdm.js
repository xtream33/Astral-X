'use strict';
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'vvdm',
  aliases: ['savedm', 'vvsave'],
  category: 'viewonce',
  description: 'Reply to a view-once message and the bot sends it unlocked to YOUR DM privately',
  execute: async (sock, msg, args, userId) => {
    const jid = msg.key.remoteJid;
    const ctx = msg.message?.extendedTextMessage?.contextInfo;

    if (!ctx?.quotedMessage) {
      return sock.sendMessage(jid, {
        text:
          '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n' +
          '┏━━━━━━━━━━━━━━━━━━━▣\n' +
          '┃ 👁️ *VVDM — HOW TO USE*\n' +
          '┠─────────────────────\n' +
          '┃ 1. Long-press a view-once\n' +
          '┃    photo or video\n' +
          '┃ 2. Tap *Reply*\n' +
          '┃ 3. Type *.vvdm* and send\n' +
          '┠─────────────────────\n' +
          '┃ 📩 The unlocked media is\n' +
          '┃ sent to *YOUR DM* only —\n' +
          '┃ nobody else sees it!\n' +
          '┗━━━━━━━━━━━━━━━━━━━▣\n' +
          '_ᴀsᴛʀᴀ-x ᴛᴇᴄʜ 🌍_',
      });
    }

    const quoted = ctx.quotedMessage;

    // ── Detect viewonce in all possible formats ──────────────────────
    let voMsg =
      quoted?.viewOnceMessage?.message ||
      quoted?.viewOnceMessageV2?.message ||
      quoted?.viewOnceMessageV2Extension?.message;

    let isDirectViewOnce = false;

    if (!voMsg) {
      if (quoted?.imageMessage?.viewOnce === true) {
        voMsg = quoted;
        isDirectViewOnce = true;
      } else if (quoted?.videoMessage?.viewOnce === true) {
        voMsg = quoted;
        isDirectViewOnce = true;
      }
    }

    if (!voMsg && quoted?.ephemeralMessage?.message) {
      const inner = quoted.ephemeralMessage.message;
      voMsg =
        inner?.viewOnceMessage?.message ||
        inner?.viewOnceMessageV2?.message ||
        inner;
      isDirectViewOnce = !!(inner?.imageMessage || inner?.videoMessage);
    }

    if (!voMsg) {
      return sock.sendMessage(jid, {
        text:
          '❌ *No view-once detected.*\n\n' +
          'Make sure you are *directly replying* to a view-once photo/video\n' +
          '(long press it → tap Reply), then type *.vvdm*.',
      });
    }

    // Resolve the requester's personal JID
    const selfJid    = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const senderJid  = msg.key.participant || (msg.key.fromMe ? selfJid : jid);
    const dmJid      = senderJid.endsWith('@s.whatsapp.net')
      ? senderJid
      : senderJid.split('@')[0] + '@s.whatsapp.net';

    // Confirm to the chat so they know to check DM
    await sock.sendMessage(jid, {
      text: '⏳ Unlocking and sending to your DM...',
    });

    try {
      const dlMsg = {
        key: {
          remoteJid:   jid,
          id:          ctx.stanzaId || msg.key.id,
          fromMe:      false,
          participant: ctx.participant || undefined,
        },
        message: voMsg,
      };

      const buffer = await downloadMediaMessage(
        dlMsg, 'buffer', {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      const hasVideo = !!(voMsg?.videoMessage);
      const cap =
        '👁️ *View-once unlocked by ASTRA-X*\n' +
        '📩 _Sent privately to your DM_';

      if (hasVideo) {
        await sock.sendMessage(dmJid, { video: buffer, caption: cap, mimetype: 'video/mp4' });
      } else {
        await sock.sendMessage(dmJid, { image: buffer, caption: cap });
      }

      // Confirm in the original chat
      await sock.sendMessage(jid, {
        text: '✅ *Sent to your DM!* Check your private chat with the bot. 📩',
      });
    } catch (e) {
      await sock.sendMessage(jid, {
        text:
          '❌ *Failed to unlock:* ' + e.message + '\n\n' +
          '_Tip: Reply directly to the view-once message, not a forward of it._',
      });
    }
  },
};
