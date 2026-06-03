'use strict';
/**
 * ASTRA-X Telegram Bot — Full Command Interface
 * Commands: /start /menu /pair /connect /help /status /cancel /about
 * Also accepts bare phone numbers at any time
 */

const TelegramBot = require('node-telegram-bot-api');

const TOKEN       = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_INV = process.env.TELEGRAM_CHANNEL_INVITE || 'https://t.me/+K4F7YgGvjRQyZmZk';
const CHANNEL_ID  = process.env.TELEGRAM_CHANNEL_ID    || null;
const OWNER_NUM   = process.env.BOT_OWNER              || '256747304196';

// SERVER_URL — resolves at runtime so .env is already loaded
function getServerUrl() {
  return (
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SELF_URL            ||
    'http://localhost:' + (process.env.PORT || 3000)
  ).replace(/\/$/, '');
}

// user states: chatId → { step, phone, userId, sessionId }
const states = {};
// active poll timers: chatId → intervalId
const polls  = {};

// ── HTTP POST JSON ────────────────────────────────────────────────────────────
function postJSON(url, data) {
  return new Promise((resolve, reject) => {
    const body   = JSON.stringify(data);
    const parsed = new URL(url);
    const lib    = url.startsWith('https') ? require('https') : require('http');
    const req    = lib.request({
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent':     'ASTRA-X-TelegramBot/1.0',
      },
      timeout: 30000,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { reject(new Error('Bad response: ' + d.slice(0,80))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout — server may be sleeping, try again')); });
    req.write(body);
    req.end();
  });
}

// ── Channel check ─────────────────────────────────────────────────────────────
async function inChannel(bot, userId) {
  if (!CHANNEL_ID) return true;
  try {
    const m = await bot.getChatMember(CHANNEL_ID, userId);
    return ['member','administrator','creator'].includes(m.status);
  } catch (_) { return false; }
}

// ── Force-join wall ───────────────────────────────────────────────────────────
async function requireChannel(bot, chatId, userId, then) {
  const ok = await inChannel(bot, userId);
  if (!ok) {
    await bot.sendMessage(chatId,
      '🚫 *Access Denied*\n\n' +
      'You must join *ASTRA X HOME* channel first.\n\n' +
      '👇 Join below then tap ✅ *I have joined*',
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '📢 Join ASTRA X HOME', url: CHANNEL_INV }],
          [{ text: '✅ I have joined',     callback_data: 'check_join' }],
        ]},
      }
    );
    return false;
  }
  if (then) await then();
  return true;
}

// ── Messages ──────────────────────────────────────────────────────────────────
async function sendMenu(bot, chatId, firstName) {
  await bot.sendMessage(chatId,
    `🌟 *ASTRA-X BOT — MENU*\n\n` +
    `👋 Hello, *${firstName || 'friend'}*!\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 *Available Commands:*\n\n` +
    `/pair — 📲 Pair your WhatsApp\n` +
    `/connect — 🔗 Connect a number\n` +
    `/status — 📊 Check your session\n` +
    `/help — ❓ How to use this bot\n` +
    `/about — ℹ️ About ASTRA-X\n` +
    `/cancel — ❌ Cancel current pairing\n` +
    `/menu — 📋 Show this menu\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💡 _Or just send your phone number directly!_\n` +
    `_Example: 256747304196_`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [
        [{ text: '📲 Pair Now',    callback_data: 'do_pair'   },
         { text: '❓ Help',        callback_data: 'do_help'   }],
        [{ text: 'ℹ️ About',       callback_data: 'do_about'  },
         { text: '📊 My Status',   callback_data: 'do_status' }],
      ]},
    }
  );
}

async function sendHelp(bot, chatId) {
  await bot.sendMessage(chatId,
    `❓ *HOW TO USE ASTRA-X BOT*\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `*Step 1:* Send /pair or your phone number\n` +
    `*Step 2:* You'll get an 8-digit pairing code\n` +
    `*Step 3:* Open WhatsApp → ⋮ Menu\n` +
    `*Step 4:* Linked Devices → Link with phone number\n` +
    `*Step 5:* Enter the code\n` +
    `*Step 6:* Your Session ID is sent here\n` +
    `*Step 7:* Send Session ID to owner to activate\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📞 *Owner:* +${OWNER_NUM}\n` +
    `📢 *Channel:* ${CHANNEL_INV}\n\n` +
    `⚠️ _Your bot is INACTIVE until owner activates it_`,
    { parse_mode: 'Markdown' }
  );
}

async function sendAbout(bot, chatId) {
  await bot.sendMessage(chatId,
    `ℹ️ *ABOUT ASTRA-X*\n\n` +
    `🤖 *ASTRA-X* is an advanced WhatsApp AI bot\n` +
    `with 100+ commands including:\n\n` +
    `🎵 Music & Video Downloads\n` +
    `🤖 AI Chat & Image Generation\n` +
    `👥 Group Management\n` +
    `🔒 Privacy & Anti-spam\n` +
    `📦 APK Downloads\n` +
    `🌍 Translation & News\n` +
    `🎲 Fun & Games\n` +
    `⚽ Live Sports Scores\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🔖 *Version:* v6.6.6\n` +
    `👨‍💻 *By:* Xtream Noor\n` +
    `📞 *Contact:* +${OWNER_NUM}\n` +
    `📢 *Channel:* ${CHANNEL_INV}`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [
        [{ text: '📲 Pair My WhatsApp', callback_data: 'do_pair' }],
      ]},
    }
  );
}

async function sendPairPrompt(bot, chatId) {
  states[chatId] = { step: 'awaiting_number' };
  await bot.sendMessage(chatId,
    `📲 *PAIR YOUR WHATSAPP*\n\n` +
    `Send your WhatsApp number with country code:\n\n` +
    `🇺🇬 Uganda: \`256747304196\`\n` +
    `🇰🇪 Kenya:  \`254712345678\`\n` +
    `🇳🇬 Nigeria: \`2348012345678\`\n` +
    `🌍 Other:   \`[code][number]\`\n\n` +
    `_No + or spaces needed_`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [
        [{ text: '❌ Cancel', callback_data: 'do_cancel' }],
      ]},
    }
  );
}

async function sendStatus(bot, chatId) {
  const st = states[chatId];
  if (!st || st.step === 'awaiting_number') {
    return bot.sendMessage(chatId,
      '📊 *Session Status*\n\n_No active pairing session._\n\nUse /pair to start.',
      { parse_mode: 'Markdown' }
    );
  }
  if (st.step === 'awaiting_whatsapp') {
    return bot.sendMessage(chatId,
      `📊 *Session Status*\n\n` +
      `📱 Number: +${st.phone}\n` +
      `⏳ Status: _Waiting for WhatsApp confirmation_\n\n` +
      `Enter the pairing code in WhatsApp to continue.`,
      { parse_mode: 'Markdown' }
    );
  }
}

// ── Core pairing logic ────────────────────────────────────────────────────────
async function doPair(bot, chatId, phone, firstName) {
  const userId = 'tg_' + chatId + '_' + Date.now();

  const waitMsg = await bot.sendMessage(chatId,
    '⚡ _Generating pairing code..._\n_Please wait_',
    { parse_mode: 'Markdown' }
  );

  try {
    const result = await postJSON(getServerUrl() + '/api/pair', {
      userId,
      phoneNumber: phone,
    });

    if (!result.success) {
      await bot.editMessageText(
        '❌ *Failed*\n\n' + (result.message || 'Could not generate code. Try again.'),
        { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' }
      );
      states[chatId] = { step: 'awaiting_number' };
      return;
    }

    const code      = result.code;
    const sessionId = result.sessionId;

    states[chatId] = { step: 'awaiting_whatsapp', phone, userId, sessionId };

    await bot.editMessageText(
      `✅ *Pairing Code Generated!*\n\n` +
      `📱 *Number:* +${phone}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🔑 *Your Pairing Code:*\n\n` +
      `\`${code.toUpperCase()}\`\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📲 *How to enter:*\n` +
      `1️⃣ Open WhatsApp (+${phone})\n` +
      `2️⃣ Tap ⋮ → *Linked Devices*\n` +
      `3️⃣ Tap *Link with phone number*\n` +
      `4️⃣ Enter the code above\n\n` +
      `⏳ _Waiting for you to link..._`,
      {
        chat_id:    chatId,
        message_id: waitMsg.message_id,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '📋 Copy Code',  callback_data: 'copy_' + code  },
           { text: '❌ Cancel',     callback_data: 'do_cancel'      }],
        ]},
      }
    );

    // Start polling for WhatsApp confirmation
    startPoll(bot, chatId, sessionId, phone);

  } catch (e) {
    await bot.editMessageText(
      '❌ *Error:* ' + e.message,
      { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' }
    );
    states[chatId] = { step: 'awaiting_number' };
  }
}

// ── Session poll ──────────────────────────────────────────────────────────────
function startPoll(bot, chatId, sessionId, phone) {
  if (polls[chatId]) clearInterval(polls[chatId]);
  let attempts = 0;

  polls[chatId] = setInterval(async () => {
    attempts++;
    if (attempts > 40) { // 40 × 5s = 200s
      clearInterval(polls[chatId]);
      delete polls[chatId];
      await deliverSessionId(bot, chatId, sessionId, phone, false);
      return;
    }
    try {
      const res = await postJSON(getServerUrl() + '/api/session-status', { sessionId });
      if (res.registered) {
        clearInterval(polls[chatId]);
        delete polls[chatId];
        await deliverSessionId(bot, chatId, sessionId, phone, true);
      }
    } catch (_) {}
  }, 5000);
}

// ── Deliver session ID ────────────────────────────────────────────────────────
async function deliverSessionId(bot, chatId, sessionId, phone, confirmed) {
  const label = confirmed ? '🎉 *WhatsApp Linked Successfully!*' : '✅ *Pairing Complete!*';
  await bot.sendMessage(chatId,
    `${label}\n\n` +
    `📱 *Number:* +${phone}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🔑 *Your Session ID:*\n\n` +
    `\`${sessionId}\`\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📌 *Next steps:*\n` +
    `1️⃣ Copy the Session ID above\n` +
    `2️⃣ Send it to owner: *+${OWNER_NUM}*\n` +
    `3️⃣ Pay activation fee\n` +
    `4️⃣ Bot goes ONLINE ✅\n\n` +
    `⚠️ _Keep this ID safe!_\n` +
    `_© ASTRA-X TECH v6.6.6_ 🌍`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [
        [{ text: '🔄 Pair Another Number', callback_data: 'do_pair'  },
         { text: '📋 Menu',               callback_data: 'do_menu'  }],
      ]},
    }
  );
  delete states[chatId];
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initTelegramBot(app, ss, logger) {
  if (!TOKEN) {
    logger.warn('⚠️  TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
    return null;
  }

  bot = new TelegramBot(TOKEN, { polling: true });

  // Register /api/session-status endpoint
  app.post('/api/session-status', (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.json({ registered: false });
      const record = ss.getBySessionId ? ss.getBySessionId(sessionId)
                   : Object.values(ss.getAll ? ss.getAll() : {}).find(r => r.sessionId === sessionId);
      if (record) {
        const fs   = require('fs');
        const path = require('path');
        const dir  = path.join(__dirname, '../../sessions', record.userId, 'creds.json');
        return res.json({ registered: fs.existsSync(dir), active: record.active });
      }
      res.json({ registered: false });
    } catch(_) { res.json({ registered: false }); }
  });

  logger.info('🤖 Telegram bot started — polling');

  // ── Guard: check channel on every interaction ───────────────────────────
  async function guard(chatId, userId, fn) {
    const ok = await inChannel(bot, userId);
    if (!ok) return sendJoinWall(bot, chatId);
    return fn();
  }

  async function sendJoinWall(bot, chatId) {
    await bot.sendMessage(chatId,
      '🚫 *Access Denied*\n\nJoin *ASTRA X HOME* channel first.\n\n👇 Tap below to join',
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '📢 Join ASTRA X HOME', url: CHANNEL_INV }],
          [{ text: '✅ I have joined',     callback_data: 'check_join' }],
        ]},
      }
    );
  }

  // ── /start ──────────────────────────────────────────────────────────────
  bot.onText(/^\/start(@\S+)?$/, async msg => {
    const { id: chatId } = msg.chat;
    const firstName = msg.from?.first_name || '';
    await guard(chatId, msg.from.id, () => sendMenu(bot, chatId, firstName));
  });

  // ── /menu ───────────────────────────────────────────────────────────────
  bot.onText(/^\/menu(@\S+)?$/, async msg => {
    const { id: chatId } = msg.chat;
    await guard(chatId, msg.from.id, () => sendMenu(bot, chatId, msg.from?.first_name));
  });

  // ── /pair ───────────────────────────────────────────────────────────────
  bot.onText(/^\/pair(@\S+)?$/, async msg => {
    const { id: chatId } = msg.chat;
    await guard(chatId, msg.from.id, () => sendPairPrompt(bot, chatId));
  });

  // ── /connect (alias for /pair) ──────────────────────────────────────────
  bot.onText(/^\/connect(@\S+)?$/, async msg => {
    const { id: chatId } = msg.chat;
    await guard(chatId, msg.from.id, () => sendPairPrompt(bot, chatId));
  });

  // ── /help ───────────────────────────────────────────────────────────────
  bot.onText(/^\/help(@\S+)?$/, async msg => {
    const { id: chatId } = msg.chat;
    await guard(chatId, msg.from.id, () => sendHelp(bot, chatId));
  });

  // ── /about ──────────────────────────────────────────────────────────────
  bot.onText(/^\/about(@\S+)?$/, async msg => {
    const { id: chatId } = msg.chat;
    await guard(chatId, msg.from.id, () => sendAbout(bot, chatId));
  });

  // ── /status ─────────────────────────────────────────────────────────────
  bot.onText(/^\/status(@\S+)?$/, async msg => {
    const { id: chatId } = msg.chat;
    await guard(chatId, msg.from.id, () => sendStatus(bot, chatId));
  });

  // ── /cancel ─────────────────────────────────────────────────────────────
  bot.onText(/^\/cancel(@\S+)?$/, async msg => {
    const { id: chatId } = msg.chat;
    if (polls[chatId])  { clearInterval(polls[chatId]); delete polls[chatId]; }
    if (states[chatId]) { delete states[chatId]; }
    await bot.sendMessage(chatId,
      '❌ *Pairing cancelled.*\n\nUse /pair to start again.',
      { parse_mode: 'Markdown' }
    );
  });

  // ── Any message (number or unknown) ─────────────────────────────────────
  bot.on('message', async msg => {
    if (msg.chat.type !== 'private') return;
    const chatId = msg.chat.id;
    const text   = (msg.text || '').trim();

    // Skip all commands — already handled above
    if (text.startsWith('/')) return;

    await guard(chatId, msg.from.id, async () => {
      const st    = states[chatId];
      const phone = text.replace(/[^\d]/g, '');
      const looksLikePhone = phone.length >= 7 && phone.length <= 15 && /^\d+$/.test(phone);

      // If currently awaiting a number
      if (st?.step === 'awaiting_number') {
        if (!looksLikePhone) {
          return bot.sendMessage(chatId,
            '❌ That doesn\'t look like a phone number.\n\n_Send digits only, with country code._\n_Example: 256747304196_',
            { parse_mode: 'Markdown' }
          );
        }
        return doPair(bot, chatId, phone, msg.from?.first_name);
      }

      // Already pairing
      if (st?.step === 'awaiting_whatsapp') {
        return bot.sendMessage(chatId,
          '⏳ _Already pairing +' + st.phone + '_\n\nEnter the code in WhatsApp and wait.\n\nUse /cancel to stop.',
          { parse_mode: 'Markdown' }
        );
      }

      // No state but looks like a number — auto start pairing
      if (looksLikePhone) {
        states[chatId] = { step: 'awaiting_number' };
        return doPair(bot, chatId, phone, msg.from?.first_name);
      }

      // Unknown text
      await bot.sendMessage(chatId,
        '🤖 Use /menu to see commands, or send your phone number to pair.',
        { parse_mode: 'Markdown' }
      );
    });
  });

  // ── Inline buttons ───────────────────────────────────────────────────────
  bot.on('callback_query', async query => {
    const chatId = query.message.chat.id;
    const data   = query.data;
    await bot.answerCallbackQuery(query.id).catch(() => {});

    const fn = async () => {
      if (data === 'check_join') {
        const ok = await inChannel(bot, query.from.id);
        if (ok) return sendMenu(bot, chatId, query.from?.first_name);
        return bot.sendMessage(chatId,
          '❌ Still not in channel. Join first then tap *I have joined*.',
          { parse_mode: 'Markdown' }
        );
      }
      if (data === 'do_pair'   || data === 'pair_again') return sendPairPrompt(bot, chatId);
      if (data === 'do_menu')   return sendMenu(bot, chatId, query.from?.first_name);
      if (data === 'do_help')   return sendHelp(bot, chatId);
      if (data === 'do_about')  return sendAbout(bot, chatId);
      if (data === 'do_status') return sendStatus(bot, chatId);
      if (data === 'do_cancel') {
        if (polls[chatId])  { clearInterval(polls[chatId]); delete polls[chatId]; }
        if (states[chatId]) { delete states[chatId]; }
        return bot.sendMessage(chatId, '❌ *Pairing cancelled.* Use /pair to start again.', { parse_mode: 'Markdown' });
      }
      if (data.startsWith('copy_')) {
        const code = data.replace('copy_', '').toUpperCase();
        return bot.sendMessage(chatId,
          `📋 *Pairing Code:*\n\n\`${code}\`\n\n_Tap the code to copy_`,
          { parse_mode: 'Markdown' }
        );
      }
    };

    // Channel check for all button presses except the join check itself
    if (data === 'check_join') return fn();
    const ok = await inChannel(bot, query.from.id);
    if (!ok) return bot.sendMessage(chatId, '🚫 Join the channel first.', {
      reply_markup: { inline_keyboard: [
        [{ text: '📢 Join ASTRA X HOME', url: CHANNEL_INV }],
        [{ text: '✅ I have joined',     callback_data: 'check_join' }],
      ]},
    });
    return fn();
  });

  bot.on('polling_error', err => logger.error('TG polling:', err.message));
  bot.on('error',         err => logger.error('TG error:',   err.message));

  return bot;
}

// ── Called by socket.js when WhatsApp confirms pairing ───────────────────────
let bot = null;
function notifyTelegramUser(userId, sessionId, phoneNumber) {
  if (!bot) return;
  const m = userId.match(/^tg_(\d+)_/);
  if (!m) return;
  deliverSessionId(bot, m[1], sessionId, phoneNumber, true).catch(() => {});
}

// Re-declare bot at module level so initTelegramBot can set it
let _botRef = null;
const origInit = initTelegramBot;
function initTelegramBotWrapped(app, ss, logger) {
  _botRef = origInit(app, ss, logger);
  bot = _botRef;
  return _botRef;
}

module.exports = { initTelegramBot: initTelegramBotWrapped, notifyTelegramUser };
