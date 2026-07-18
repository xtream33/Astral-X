const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'vv',
  aliases: ['viewonce', 'reveal'],
  category: 'viewonce',
  description: 'Reply to any view-once photo or video with !vv to unlock it',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    const ctx = msg.message?.extendedTextMessage?.contextInfo;

    if (!ctx?.quotedMessage) {
      return sock.sendMessage(jid, {
        text: '👁️ *How to use !vv:*\n\n1. Someone sends a view-once photo/video\n2. Long press it → tap Reply\n3. Type *!vv* and send\n\nThe bot will unlock it for everyone.',
      });
    }

    const quoted = ctx.quotedMessage;

    // ── Detect viewonce in ALL possible Baileys/WA formats ──────────
    // Format 1: Wrapped in viewOnceMessage (old Baileys)
    let voMsg = quoted?.viewOnceMessage?.message
             || quoted?.viewOnceMessageV2?.message
             || quoted?.viewOnceMessageV2Extension?.message;

    let isDirectViewOnce = false;

    // Format 2: imageMessage/videoMessage with viewOnce flag (newer WA)
    if (!voMsg) {
      if (quoted?.imageMessage?.viewOnce === true) {
        voMsg = quoted;
        isDirectViewOnce = true;
      } else if (quoted?.videoMessage?.viewOnce === true) {
        voMsg = quoted;
        isDirectViewOnce = true;
      }
    }

    // Format 3: ephemeralMessage wrapper
    if (!voMsg && quoted?.ephemeralMessage?.message) {
      const inner = quoted.ephemeralMessage.message;
      voMsg = inner?.viewOnceMessage?.message
           || inner?.viewOnceMessageV2?.message
           || inner;
      isDirectViewOnce = !!(inner?.imageMessage || inner?.videoMessage);
    }

    if (!voMsg) {
      return sock.sendMessage(jid, {
        text: '❌ Could not detect a view-once message in your reply.\n\nMake sure you are *directly replying* to the view-once photo or video (long press → Reply).',
      });
    }

    await sock.sendMessage(jid, { text: '⏳ Unlocking...' });

    try {
      // Build download target
      const dlMsg = {
        key: {
          remoteJid: jid,
          id:        ctx.stanzaId || msg.key.id,
          fromMe:    false,
          participant: ctx.participant || undefined,
        },
        message: voMsg,
      };

      const buffer  = await downloadMediaMessage(
        dlMsg, 'buffer', {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      const caption = '👁️ *View-once unlocked by ASTRA-X*';

      const hasVideo = isDirectViewOnce
        ? !!(voMsg?.videoMessage)
        : !!(voMsg?.videoMessage);

      if (hasVideo) {
        await sock.sendMessage(jid, { video: buffer, caption, mimetype: 'video/mp4' });
      } else {
        await sock.sendMessage(jid, { image: buffer, caption });
      }
    } catch (e) {
      await sock.sendMessage(jid, {
        text: '❌ Unlock failed: ' + e.message + '\n\nTip: Reply directly to the view-once message, not a forward of it.',
      });
    }
  },
};
