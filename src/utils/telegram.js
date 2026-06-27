'use strict';
const TelegramBot = require('node-telegram-bot-api');

const TOKEN       = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_INV = process.env.TELEGRAM_CHANNEL_INVITE || 'https://t.me/+K4F7YgGvjRQyZmZk';
const CHANNEL_ID  = process.env.TELEGRAM_CHANNEL_ID    || null;
const OWNER_NUM   = process.env.BOT_OWNER              || '256747304196';
const WA_CHANNEL  = 'https://whatsapp.com/channel/0029Vb8BaxaBFLgMYofBAC3I';

function getServerUrl() {
  return (
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SELF_URL            ||
    'http://localhost:' + (process.env.PORT || 3000)
  ).replace(/\/$/, '');
}

const states = {};
const polls  = {};
let bot      = null;

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
    req.on('timeout', () => { req.destroy(); reject(new Error('Server timeout — try again in a moment')); });
    req.write(body);
    req.end();
  });
}

async function inChannel(userId) {
  if (!CHANNEL_ID) return true;
  try {
    const m = await bot.getChatMember(CHANNEL_ID, userId);
    return ['member','administrator','creator'].includes(m.status);
  } catch (_) { return false; }
}

function extractPhone(text) {
  const digits = (text || '').replace(/[^\d]/g, '');
  if (digits.length >= 7 && digits.length <= 15) return digits;
  return null;
}

// Escape for MarkdownV2
function esc(s) {
  return String(s || '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

async function sendJoinWall(chatId) {
  await bot.sendMessage(chatId,
    '🚫 *Access Denied*\n\nJoin *ASTRA X HOME* channel first\\.\n\n👇 Tap *Join* then tap *I have joined*',
    {
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [
        [{ text: '📢 Join ASTRA X HOME', url: CHANNEL_INV }],
        [{ text: '✅ I have joined',     callback_data: 'check_join' }],
      ]},
    }
  );
}

async function guard(chatId, userId, fn) {
  const ok = await inChannel(userId);
  if (!ok) return sendJoinWall(chatId);
  return fn();
}

async function sendMenu(chatId, firstName) {
  await bot.sendMessage(chatId,
    '🌟 *ASTRA\\-X BOT \\— MENU*\n\n' +
    '👋 Hello *' + esc(firstName || 'friend') + '*\\!\n\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '📋 *Commands:*\n\n' +
    '/pair \\— 📲 Pair your WhatsApp\n' +
    '/connect \\— 🔗 Connect a number\n' +
    '/link \\— 🔗 Link WhatsApp\n' +
    '/status \\— 📊 Check pairing status\n' +
    '/help \\— ❓ How to use\n' +
    '/about \\— ℹ️ About ASTRA\\-X\n' +
    '/cancel \\— ❌ Cancel pairing\n' +
    '/menu \\— 📋 This menu\n\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '💡 _Or just send your phone number\\!_\n' +
    '_Example: 256747304196_\n\n' +
    WA_CHANNEL,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [
        [{ text: '📲 Pair My WhatsApp', callback_data: 'do_pair'   },
         { text: '❓ Help',             callback_data: 'do_help'   }],
        [{ text: 'ℹ️ About ASTRA-X',    callback_data: 'do_about'  },
         { text: '📊 My Status',        callback_data: 'do_status' }],
      ]},
    }
  );
}

async function sendHelp(chatId) {
  await bot.sendMessage(chatId,
    '❓ *HOW TO USE ASTRA\\-X BOT*\n\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '*Step 1:* Send /pair or your phone number\n' +
    '*Step 2:* Get an 8\\-digit pairing code\n' +
    '*Step 3:* Open WhatsApp → ⋮ Menu\n' +
    '*Step 4:* Linked Devices → Link with phone number\n' +
    '*Step 5:* Enter the pairing code\n' +
    '*Step 6:* Session ID sent here automatically\n' +
    '*Step 7:* Send Session ID to owner to activate\n\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '📞 *Owner:* \\+' + esc(OWNER_NUM) + '\n\n' +
    '⚠️ _Bot is INACTIVE until owner activates it_\n\n' +
    WA_CHANNEL,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [
        [{ text: '📲 Pair Now', callback_data: 'do_pair' }],
      ]},
    }
  );
}

async function sendAbout(chatId) {
  await bot.sendMessage(chatId,
    'ℹ️ *ABOUT ASTRA\\-X*\n\n' +
    '🤖 Advanced WhatsApp AI Bot with 100\\+ commands:\n\n' +
    '🎵 Music & Video Downloads\n' +
    '🤖 AI Chat & Image Generation\n' +
    '👥 Group Management\n' +
    '🔒 Privacy & Anti\\-spam\n' +
    '📦 APK Downloads\n' +
    '🌍 Translation & News\n' +
    '🎲 Fun & Games\n' +
    '⚽ Live Sports Scores\n\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '🔖 *Version:* v6\\.6\\.6\n' +
    '👨\u200d💻 *By:* Xtream Noor\n' +
    '📞 *Contact:* \\+' + esc(OWNER_NUM) + '\n\n' +
    WA_CHANNEL,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [
        [{ text: '📲 Pair My WhatsApp', callback_data: 'do_pair' }],
      ]},
    }
  );
}

async function sendPairPrompt(chatId) {
  states[chatId] = { step: 'awaiting_number' };
  await bot.sendMessage(chatId,
    '📲 *PAIR YOUR WHATSAPP*\n\n' +
    'Send your WhatsApp number with country code:\n\n' +
    '🇺🇬 *Uganda:* `256747304196`\n' +
    '🇰🇪 *Kenya:* `254712345678`\n' +
    '🇳🇬 *Nigeria:* `2348012345678`\n' +
    '🌍 *Other:* `[countrycode][number]`\n\n' +
    '_No \\+ or spaces needed_',
    {
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [
        [{ text: '❌ Cancel', callback_data: 'do_cancel' }],
      ]},
    }
  );
}

async function sendStatus(chatId) {
  const st = states[chatId];
  if (!st || st.step === 'awaiting_number') {
    return bot.sendMessage(chatId,
      '📊 *Session Status*\n\n_No active pairing\\._\n\nUse /pair to start\\.',
      { parse_mode: 'MarkdownV2' }
    );
  }
  if (st.step === 'awaiting_whatsapp') {
    return bot.sendMessage(chatId,
      '📊 *Session Status*\n\n📱 Number: \\+' + esc(st.phone) + '\n⏳ _Waiting for WhatsApp confirmation_\n\nEnter the code in WhatsApp\\.',
      { parse_mode: 'MarkdownV2' }
    );
  }
}

async function doPair(chatId, phone, firstName) {
  const userId  = 'tg_' + chatId + '_' + Date.now();
  const waitMsg = await bot.sendMessage(chatId,
    '⚡ _Generating pairing code\\.\\.\\._',
    { parse_mode: 'MarkdownV2' }
  );

  try {
    const result = await postJSON(getServerUrl() + '/api/pair', { userId, phoneNumber: phone });

    if (!result.success) {
      await bot.editMessageText(
        '❌ *Failed*\n\n' + esc(result.message || 'Could not generate code. Try again.'),
        { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'MarkdownV2' }
      );
      states[chatId] = { step: 'awaiting_number' };
      return;
    }

    const code      = result.code.toUpperCase();
    const sessionId = result.sessionId;
    states[chatId]  = { step: 'awaiting_whatsapp', phone, userId, sessionId };

    await bot.editMessageText(
      '✅ *Pairing Code Ready\\!*\n\n' +
      '📱 *Number:* \\+' + esc(phone) + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '🔑 *Your Code:*\n\n' +
      '`' + code + '`\n\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '📲 *Steps:*\n' +
      '1️⃣ Open WhatsApp \\(\\+' + esc(phone) + '\\)\n' +
      '2️⃣ Tap ⋮ → *Linked Devices*\n' +
      '3️⃣ Tap *Link with phone number*\n' +
      '4️⃣ Enter the code above\n\n' +
      '⏳ _Waiting for confirmation\\.\\.\\._',
      {
        chat_id:    chatId,
        message_id: waitMsg.message_id,
        parse_mode: 'MarkdownV2',
        reply_markup: { inline_keyboard: [
          [{ text: '📋 Show Code Again', callback_data: 'copy_' + code },
           { text: '❌ Cancel',          callback_data: 'do_cancel'    }],
        ]},
      }
    );

    startPoll(chatId, sessionId, phone);
  } catch(e) {
    await bot.editMessageText(
      '❌ *Error:* ' + esc(e.message),
      { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'MarkdownV2' }
    ).catch(() => bot.sendMessage(chatId, '❌ Error: ' + e.message));
    states[chatId] = { step: 'awaiting_number' };
  }
}

function startPoll(chatId, sessionId, phone) {
  if (polls[chatId]) clearInterval(polls[chatId]);
  let attempts = 0;
  polls[chatId] = setInterval(async () => {
    attempts++;
    if (attempts > 40) {
      clearInterval(polls[chatId]); delete polls[chatId];
      await deliverSessionId(chatId, sessionId, phone, false);
      return;
    }
    try {
      const res = await postJSON(getServerUrl() + '/api/session-status', { sessionId });
      if (res.registered) {
        clearInterval(polls[chatId]); delete polls[chatId];
        await deliverSessionId(chatId, sessionId, phone, true);
      }
    } catch(_) {}
  }, 5000);
}

async function deliverSessionId(chatId, sessionId, phone, confirmed) {
  const title = confirmed ? '🎉 *WhatsApp Linked Successfully\\!*' : '✅ *Pairing Complete\\!*';
  await bot.sendMessage(chatId,
    title + '\n\n' +
    '📱 *Number:* \\+' + esc(phone) + '\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '🔑 *Your Session ID:*\n\n' +
    '`' + sessionId + '`\n\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '📌 *Next steps:*\n' +
    '1️⃣ Copy Session ID above\n' +
    '2️⃣ Send it to: *\\+' + esc(OWNER_NUM) + '*\n' +
    '3️⃣ Pay activation fee\n' +
    '4️⃣ Bot goes ONLINE ✅\n\n' +
    '⚠️ _Keep this ID safe\\!_\n\n' +
    WA_CHANNEL,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [
        [{ text: '🔄 Pair Another Number', callback_data: 'do_pair' },
         { text: '📋 Menu',               callback_data: 'do_menu' }],
      ]},
    }
  );
  delete states[chatId];
}

function addStatusEndpoint(app, ss) {
  app.post('/api/session-status', (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.json({ registered: false });
      const all    = ss.getAll ? ss.getAll() : {};
      const record = Array.isArray(all)
        ? all.find(r => r.sessionId === sessionId)
        : Object.values(all).find(r => r.sessionId === sessionId);
      if (record) {
        const fs   = require('fs');
        const path = require('path');
        const fp   = path.join(__dirname, '../../sessions', record.userId, 'creds.json');
        return res.json({ registered: fs.existsSync(fp), active: record.active });
      }
      res.json({ registered: false });
    } catch(_) { res.json({ registered: false }); }
  });
}

function getInlinePhone(text, command) {
  const re = new RegExp('^\/' + command + '(?:@\\S+)?\\s*(\\d{7,15})?', 'i');
  const m  = (text || '').match(re);
  return m?.[1] || null;
}

function initTelegramBot(app, ss, logger) {
  if (!TOKEN) {
    logger.warn('⚠️  TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
    return null;
  }

  bot = new TelegramBot(TOKEN, { polling: true });
  addStatusEndpoint(app, ss);
  logger.info('🤖 Telegram bot started');

  // /start
  bot.onText(/^\/start/i, async msg => {
    await guard(msg.chat.id, msg.from.id, () => sendMenu(msg.chat.id, msg.from?.first_name));
  });

  // /menu
  bot.onText(/^\/menu/i, async msg => {
    await guard(msg.chat.id, msg.from.id, () => sendMenu(msg.chat.id, msg.from?.first_name));
  });

  // /pair [number]
  bot.onText(/^\/pair/i, async msg => {
    const phone = getInlinePhone(msg.text, 'pair');
    await guard(msg.chat.id, msg.from.id, () =>
      phone ? doPair(msg.chat.id, phone, msg.from?.first_name) : sendPairPrompt(msg.chat.id)
    );
  });

  // /connect [number]
  bot.onText(/^\/connect/i, async msg => {
    const phone = getInlinePhone(msg.text, 'connect');
    await guard(msg.chat.id, msg.from.id, () =>
      phone ? doPair(msg.chat.id, phone, msg.from?.first_name) : sendPairPrompt(msg.chat.id)
    );
  });

  // /link [number]
  bot.onText(/^\/link/i, async msg => {
    const phone = getInlinePhone(msg.text, 'link');
    await guard(msg.chat.id, msg.from.id, () =>
      phone ? doPair(msg.chat.id, phone, msg.from?.first_name) : sendPairPrompt(msg.chat.id)
    );
  });

  // /help
  bot.onText(/^\/help/i, async msg => {
    await guard(msg.chat.id, msg.from.id, () => sendHelp(msg.chat.id));
  });

  // /about
  bot.onText(/^\/about/i, async msg => {
    await guard(msg.chat.id, msg.from.id, () => sendAbout(msg.chat.id));
  });

  // /status
  bot.onText(/^\/status/i, async msg => {
    await guard(msg.chat.id, msg.from.id, () => sendStatus(msg.chat.id));
  });

  // /cancel
  bot.onText(/^\/cancel/i, async msg => {
    const chatId = msg.chat.id;
    if (polls[chatId])  { clearInterval(polls[chatId]); delete polls[chatId]; }
    if (states[chatId]) delete states[chatId];
    bot.sendMessage(chatId, '❌ *Pairing cancelled\\.* Use /pair to start again\\.', { parse_mode: 'MarkdownV2' });
  });

  // plain messages
  bot.on('message', async msg => {
    if (msg.chat.type !== 'private') return;
    const chatId = msg.chat.id;
    const text   = (msg.text || '').trim();
    if (text.startsWith('/')) return;

    await guard(chatId, msg.from.id, async () => {
      const st    = states[chatId];
      const phone = extractPhone(text);

      if (st?.step === 'awaiting_number') {
        if (!phone) return bot.sendMessage(chatId, '❌ Invalid number\\. Send digits with country code\\.\n_Example: 256747304196_', { parse_mode: 'MarkdownV2' });
        return doPair(chatId, phone, msg.from?.first_name);
      }
      if (st?.step === 'awaiting_whatsapp') {
        if (phone) { if (polls[chatId]) { clearInterval(polls[chatId]); delete polls[chatId]; } return doPair(chatId, phone, msg.from?.first_name); }
        return bot.sendMessage(chatId, '⏳ _Still pairing \\+' + esc(st.phone) + '_\n\nEnter code in WhatsApp or /cancel\\.', { parse_mode: 'MarkdownV2' });
      }
      if (phone) return doPair(chatId, phone, msg.from?.first_name);
      bot.sendMessage(chatId, '🤖 Use /menu for commands, or send your phone number\\.', { parse_mode: 'MarkdownV2' });
    });
  });

  // callbacks
  bot.on('callback_query', async query => {
    const chatId = query.message.chat.id;
    const data   = query.data;
    await bot.answerCallbackQuery(query.id).catch(() => {});

    if (data === 'check_join') {
      const ok = await inChannel(query.from.id);
      return ok ? sendMenu(chatId, query.from?.first_name)
                : bot.sendMessage(chatId, '❌ Still not in channel\\. Join first\\.', { parse_mode: 'MarkdownV2' });
    }

    await guard(chatId, query.from.id, async () => {
      if (data === 'do_pair' || data === 'pair_again') return sendPairPrompt(chatId);
      if (data === 'do_menu')   return sendMenu(chatId, query.from?.first_name);
      if (data === 'do_help')   return sendHelp(chatId);
      if (data === 'do_about')  return sendAbout(chatId);
      if (data === 'do_status') return sendStatus(chatId);
      if (data === 'do_cancel') {
        if (polls[chatId])  { clearInterval(polls[chatId]); delete polls[chatId]; }
        if (states[chatId]) delete states[chatId];
        return bot.sendMessage(chatId, '❌ *Pairing cancelled\\.* Use /pair to start again\\.', { parse_mode: 'MarkdownV2' });
      }
      if (data.startsWith('copy_')) {
        return bot.sendMessage(chatId, '📋 *Your Code:*\n\n`' + data.replace('copy_','') + '`\n\n_Tap to copy_', { parse_mode: 'MarkdownV2' });
      }
    });
  });

  bot.on('polling_error', err => logger.error('TG polling:', err.message));
  bot.on('error',         err => logger.error('TG error:',   err.message));
  return bot;
}

function notifyTelegramUser(userId, sessionId, phoneNumber) {
  if (!bot) return;
  const m = userId.match(/^tg_(\d+)_/);
  if (!m) return;
  deliverSessionId(m[1], sessionId, phoneNumber, true).catch(() => {});
}

module.exports = { initTelegramBot, notifyTelegramUser };
