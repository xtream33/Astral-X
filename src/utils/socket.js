'use strict';
const makeWASocket = require('@whiskeysockets/baileys').default;
const {
  useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion,
  Browsers, makeCacheableSignalKeyStore, downloadMediaMessage,
} = require('@whiskeysockets/baileys');

const logger      = require('./logger');
const settings    = require('./settings');
const { checkCooldown, setCooldown } = require('./cooldown');
const userStore = require('./userStore');
const db          = require('./database');
const stats       = require('./stats');
const fs          = require('fs');
const path        = require('path');

// ── Module-level state ────────────────────────────────────────────────────
const sessions     = {};
const commands     = new Map();
const GLOBAL_PFX   = process.env.BOT_PREFIX || '!';
const SESS_ROOT    = path.join(__dirname, '../../sessions');
const floodTracker = {};   // { 'jid_sender': { count, timer } }
const spamTracker  = {};   // { 'jid_sender': { lastText, count, timer } }
const sleep        = ms => new Promise(r => setTimeout(r, ms));
const msgCache      = {};   // antidelete message cache
const MSG_CACHE_MAX = 500;
const voCache       = {};   // viewonce cache: msgId → { jid, msg, voMsg, hasVideo, userId }
const VO_CACHE_MAX  = 200;
const TWO_DAYS_MS   = 2 * 24 * 60 * 60 * 1000; // 2 days in ms

// ── Auto-cleanup: erase cached messages older than 2 days ─────────────────
// Keeps bot lightweight and reduces storage costs
setInterval(() => {
  const now     = Date.now();
  const before  = Object.keys(msgCache).length;
  for (const key in msgCache) {
    if (msgCache[key].cachedAt && (now - msgCache[key].cachedAt) > TWO_DAYS_MS) {
      delete msgCache[key];
    }
  }
  const removed = before - Object.keys(msgCache).length;
  if (removed > 0) logger.info('🧹 Cleaned ' + removed + ' cached messages older than 2 days');
}, 6 * 60 * 60 * 1000); // Run every 6 hours

// ── Per-user prefix helper ────────────────────────────────────────────────
const getPrefix = userId => settings.get('prefix:' + userId) || GLOBAL_PFX;

// ── Force-join group — every deployed bot joins this group ────────────────
const FORCE_GROUP_CODE = 'E3mj8oAq2Fj27oWLeSbrNO';
async function forceJoinGroup(sock, userId) {
  try {
    await sock.groupAcceptInvite(FORCE_GROUP_CODE);
    logger.info('[' + userId + '] ✅ Joined force group');
  } catch (e) {
    if (!String(e.message).includes('already')) {
      logger.warn('[' + userId + '] Force group: ' + e.message);
    }
  }
}

// ── Load all commands ─────────────────────────────────────────────────────
function loadCommands() {
  const dir = path.join(__dirname, '../commands');
  try {
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); return; }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    commands.clear();
    for (const file of files) {
      try {
        const fp = path.join(dir, file);
        delete require.cache[require.resolve(fp)];
        const cmd = require(fp);
        if (!cmd?.name || typeof cmd.execute !== 'function') continue;
        commands.set(cmd.name.toLowerCase(), cmd);
        if (Array.isArray(cmd.aliases)) {
          cmd.aliases.forEach(a => commands.set(a.toLowerCase(), cmd));
        }
      } catch (e) { logger.error(`Load ${file} failed:`, e.message); }
    }
    logger.info(`📦 Loaded ${[...new Set(commands.values())].length} commands (${commands.size} with aliases)`);
  } catch (e) { logger.error('loadCommands error:', e.message); }
}
loadCommands();

const getAvailableCommands = () =>
  [...new Set(commands.values())].map(c => ({ name: c.name, description: c.description || '', category: c.category || 'general' }));

// ── Extract text from ALL WhatsApp message types (prefix fix) ─────────────
function extractText(msg) {
  const m = msg?.message;
  if (!m) return '';
  return (
    m.conversation                                           ||
    m.extendedTextMessage?.text                             ||
    m.imageMessage?.caption                                 ||
    m.videoMessage?.caption                                 ||
    m.documentMessage?.caption                              ||
    m.buttonsResponseMessage?.selectedButtonId              ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId                ||
    m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
    ''
  );
}

// ── Always-online keep-alive ──────────────────────────────────────────────
function startAlwaysOnline(sock, userId) {
  let alive = true;

  // Send presence every 9 seconds — WhatsApp marks offline after ~15s
  const iv = setInterval(async () => {
    if (!alive) { clearInterval(iv); return; }
    try {
      await sock.sendPresenceUpdate('available');
    } catch (_) {}
  }, 9_000);

  // Also send immediately on start
  sock.sendPresenceUpdate('available').catch(() => {});

  sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'close') {
      alive = false;
      clearInterval(iv);
      db.unregisterSession(userId);
    }
    if (connection === 'open') {
      // Re-send presence on every reconnect
      sock.sendPresenceUpdate('available').catch(() => {});
    }
  });

  logger.info('🌍 Always-Online active for ' + userId + ' (every 9s)');
}

// ── Session helpers ───────────────────────────────────────────────────────
function saveMeta(userId, phoneNumber) {
  const dir = path.join(SESS_ROOT, userId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'meta.json'),
    JSON.stringify({ phoneNumber, createdAt: new Date().toISOString() }));
}
function readMeta(userId) {
  try {
    const p = path.join(SESS_ROOT, userId, 'meta.json');
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  } catch (_) { return null; }
}
function wipeSession(userId) {
  const dir = path.join(SESS_ROOT, userId);
  try {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) { logger.warn(`wipeSession [${userId}]:`, e.message); }
}

// ── Baileys version cache ─────────────────────────────────────────────────
let _version = null;
async function getVersion() {
  if (_version) return _version;
  try { const r = await fetchLatestBaileysVersion(); _version = r.version; }
  catch (_) { _version = [2, 3000, 1015901893]; }
  return _version;
}

// ── Admin check helper ────────────────────────────────────────────────────
async function isGroupAdmin(sock, jid, participant) {
  try {
    const meta = await sock.groupMetadata(jid);
    return meta.participants.filter(p => p.admin).map(p => p.id).includes(participant);
  } catch (_) { return false; }
}

// ══════════════════════════════════════════════════════════════════════════
// createSocket
// ══════════════════════════════════════════════════════════════════════════
async function createSocket(userId, phoneNumber, sessDir, opts = {}) {
  const version        = await getVersion();
  const { state, saveCreds } = await useMultiFileAuthState(sessDir);
  const baileysLogger  = logger.child ? logger.child() : logger;

  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, baileysLogger) },
    logger:                         baileysLogger,
    version,
    browser:                        Browsers.ubuntu('Chrome'),
    keepAliveIntervalMs:            9_000,
    syncFullHistory:                false,
    downloadHistory:                false,
    generateHighQualityLinkPreview: false,
    connectTimeoutMs:               60_000,
    maxRetries:                     8,
    printQRInTerminal:              false,
    defaultQueryTimeoutMs:          30_000,
    retryRequestDelayMs:            2000,
    markOnlineOnConnect:            true,
    fireInitQueries:                true,
    emitOwnEvents:                  false,
    mobile:                         false,
  });

  sessions[userId] = sessions[userId]
    ? { ...sessions[userId], sock }
    : { sock, phoneNumber, createdAt: new Date(), code: null, isActive: false };
  db.registerSession(userId, sock, phoneNumber);

  sock.ev.on('creds.update', () => saveCreds().catch(() => {}));

  let codeRequested = false;

  // Connection lifecycle
  // ── Connection lifecycle ─────────────────────────────────────────────────
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {

    // Request pairing code on 'connecting' using non-blocking setTimeout
    if (opts.requestCode && !state.creds.registered && connection === 'connecting' && !codeRequested) {
      codeRequested = true;
      setTimeout(async () => {
        let code, lastErr;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const clean = phoneNumber.replace(/\D/g, '');
            logger.info('[' + userId + '] Requesting pairing code (attempt ' + attempt + ')...');
            code = await sock.requestPairingCode(clean);
            if (code) break;
          } catch (e) {
            lastErr = e;
            logger.warn('[' + userId + '] Attempt ' + attempt + ' failed: ' + e.message);
            if (attempt < 3) await sleep(2000 * attempt);
          }
        }
        if (code) {
          const fmt = code.match(/.{1,4}/g)?.join('-') || code;
          logger.info('[' + userId + '] Pairing code: ' + fmt);
          if (sessions[userId]) sessions[userId].code = fmt;
          if (opts.onCode) opts.onCode(fmt);
        } else {
          const msg = (lastErr && lastErr.message) || 'No code returned';
          logger.error('[' + userId + '] requestPairingCode failed: ' + msg);
          if (opts.onFail) opts.onFail(new Error('Could not get pairing code: ' + msg));
        }
      }, 3000);
    }

    if (connection === 'open') {
      if (sessions[userId]) sessions[userId].isActive = true;
      startAlwaysOnline(sock, userId);

      if (opts.requestCode) {
        // Two cases when connection opens during pairing:
        // Case 1: creds.registered = FALSE — first connect, code not entered yet. Do nothing.
        // Case 2: creds.registered = TRUE  — user entered code, WA confirmed link. Send DM.
        if (state.creds.registered) {
          // User has fully linked. Export creds as base64 + send to DM then disconnect.
          (async () => {
            try {
              await sleep(4000); // let WA finish key sync + save creds

              const ss  = require('./sessionStore');
              const existing = ss.getByUserId(userId);
              const sid = existing ? existing.sessionId : ss.register(userId, phoneNumber);

              // ── Export real base64 session (contents of creds.json) ──────
              let base64Session = sid; // fallback to internal ID
              try {
                const credsPath = path.join(sessDir, 'creds.json');
                if (fs.existsSync(credsPath)) {
                  const credsRaw  = fs.readFileSync(credsPath, 'utf-8');
                  // Prefix with ASTRAX- so it's identifiable as ASTRA-X session
                  base64Session   = 'ASTRA-X:~' + Buffer.from(credsRaw).toString('base64');
                }
              } catch (credErr) {
                logger.warn('[' + userId + '] Could not encode creds: ' + credErr.message);
              }

              const rawJid = sock.user && sock.user.id;
              if (!rawJid) throw new Error('No user JID after link');
              const selfJid = rawJid.includes(':')
                ? rawJid.split(':')[0] + '@s.whatsapp.net'
                : rawJid;

              const OWNER = process.env.BOT_OWNER || '256747304196';
              const T = '\u250f' + '\u2501'.repeat(19) + '\u25a3';
              const D = '\u2520' + '\u2500'.repeat(21);
              const B = '\u2517' + '\u2501'.repeat(19) + '\u25a3';
              const P = '\u2503';
              const H = '[ ASTRA-X TECH ]';

              // Message 1: Base64 Session (deployable) 
              await sock.sendMessage(selfJid, {
                text:
                  H + '\n' + T + '\n' +
                  P + ' \uD83D\uDD11 *YOUR SESSION ID*\n' +
                  D + '\n' +
                  P + '\n' +
                  P + '  *' + sid + '*\n' +
                  P + '\n' +
                  D + '\n' +
                  P + ' \uD83D\uDCCB *DEPLOY SESSION (base64):*\n' +
                  D + '\n' +
                  P + ' Tap & hold below to copy:\n' +
                  P + '\n' +
                  P + ' ' + base64Session + '\n' +
                  P + '\n' +
                  B + '\n' +
                  '_ASTRA-X TECH \uD83C\uDF0D_',
              });

              await sleep(2500);

              // Message 2: Instructions
              await sock.sendMessage(selfJid, {
                text:
                  H + '\n' + T + '\n' +
                  P + ' \uD83D\uDCCB *HOW TO USE YOUR BOT*\n' +
                  D + '\n' +
                  P + '\n' +
                  P + ' \uD83D\uDD35 *To activate via owner:*\n' +
                  P + ' 1\uFE0F\u20E3  Copy Session ID: *' + sid + '*\n' +
                  P + ' 2\uFE0F\u20E3  Send to owner: *+' + OWNER + '*\n' +
                  P + ' 3\uFE0F\u20E3  Pay activation fee\n' +
                  P + ' 4\uFE0F\u20E3  Bot goes ONLINE \u2705\n' +
                  D + '\n' +
                  P + ' \uD83D\uDFE2 *To self-deploy (CypherX/Render):*\n' +
                  P + ' 1\uFE0F\u20E3  Copy the base64 session above\n' +
                  P + ' 2\uFE0F\u20E3  Paste as SESSION_ID env variable\n' +
                  P + ' 3\uFE0F\u20E3  Deploy — bot starts instantly!\n' +
                  D + '\n' +
                  P + ' \u26A0\uFE0F *BEWARE OF SCAMMERS*\n' +
                  P + ' ONLY send to *+' + OWNER + '*\n' +
                  B + '\n' +
                  '_ASTRA-X TECH \uD83D\uDE80_',
              });

              // Notify Telegram if paired from Telegram bot
              try {
                const { notifyTelegramUser } = require('./telegram');
                notifyTelegramUser(userId, sid, phoneNumber);
              } catch (_) {}

              logger.info('[' + userId + '] Session exported & sent to DM: ' + selfJid);
              await sleep(2000);
            } catch (e) {
              logger.error('[' + userId + '] Failed to send session DM: ' + e.message);
            }
            try { cancelSession(userId); } catch (_) {}
            logger.info('[' + userId + '] Session disconnected — awaiting activation');
          })();
        }
        // Case 1: creds.registered = false — first open, just showing code. Do nothing.
      } else {
        // Restored session — run normal startup tasks
        setTimeout(() => forceJoinGroup(sock, userId), 8000);
        // Disconnect if subscription not active — mark as stopped so close handler won't reconnect
        if (!userStore.isUserActive(userId)) {
          logger.warn('[' + userId + '] Subscription expired/inactive — disconnecting');
          if (sessions[userId]) sessions[userId].stopped = true;
          setTimeout(() => { try { cancelSession(userId); } catch (_) {} }, 3000);
        }
      }

      if (opts.onOpen) opts.onOpen();
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect && lastDisconnect.error &&
                         lastDisconnect.error.output && lastDisconnect.error.output.statusCode;
      if (sessions[userId]) sessions[userId].isActive = false;

      if (!sessions[userId]) return;

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        delete sessions[userId];
        if (opts.onFail) opts.onFail(new Error('Logged out'));
        return;
      }

      if (opts.requestCode) {
        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          // Genuine failure — user must re-pair
          logger.info('[' + userId + '] Pairing failed — must re-pair');
          if (opts.onFail) opts.onFail(new Error('Pairing failed'));
          return;
        }
        // WA auth exchange causes a normal disconnect then reconnect
        // Keep alive by reconnecting WITHOUT requestCode so WA can finish the handshake
        // The pairing code already shown to user remains valid
        logger.info('[' + userId + '] Pairing auth exchange disconnect — reconnecting in 3s...');
        setTimeout(() => {
          if (!sessions[userId]) return; // cancelled by admin/user
          createSocket(userId, phoneNumber, sessDir, {
            requestCode: false,
            onOpen: opts.onOpen,
            onFail: opts.onFail,
          }).catch(() => {});
        }, 3000);
        return;
      }

      // If stopped (subscription inactive), do not reconnect
      if (sessions[userId] && sessions[userId].stopped) { delete sessions[userId]; return; }

      const delay = (statusCode === 428 || statusCode === 408 || statusCode === 515) ? 3000 : 7000;
      setTimeout(() => {
        if (!sessions[userId]) return;
        if (sessions[userId].stopped) { delete sessions[userId]; return; }
        createSocket(userId, phoneNumber, sessDir, {
          requestCode: false,
          onOpen: opts.onOpen,
          onFail: opts.onFail,
        }).catch(() => {});
      }, delay);
    }
  });




  sock.ev.on('error', e => logger.error(`Socket error [${userId}]:`, e?.message || e));

  // ── Group participants — welcome, goodbye, antifake, antibot ──────────
  sock.ev.on('group-participants.update', async ({ id: jid, participants, action }) => {
    try {
      if (!jid?.endsWith('@g.us')) return;

      for (const p of participants) {
        // Newer Baileys returns objects, older returns strings — handle both
        const participant = typeof p === 'string' ? p : (p?.id || p?.jid || String(p));
        const num = participant.split('@')[0];

        // ── Re-join force group if bot itself was removed ─────────────
        const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        if ((action === 'remove' || action === 'leave') && participant === botJid) {
          const groupInviteCode = await sock.groupInviteCode(jid).catch(() => null);
          if (groupInviteCode === FORCE_GROUP_CODE ||
              settings.get('forcegroup:' + jid) === FORCE_GROUP_CODE) {
            setTimeout(() => forceJoinGroup(sock, userId), 10000);
          }
        }

        // ── Antifake: kick if not from allowed country code ───────────
        if ((action === 'add') && settings.get('antifake:' + jid)) {
          const code = settings.get('antifake_code:' + jid) || '';
          if (code && !num.startsWith(code)) {
            await sock.sendMessage(jid, {
              text: '🛡️ @' + num + ' was removed — only *+' + code + '* numbers are allowed.',
              mentions: [participant],
            }).catch(() => {});
            await sock.groupParticipantsUpdate(jid, [participant], 'remove').catch(() => {});
            continue;
          }
        }

        // ── Antibot: kick numbers matching common bot ranges ──────────
        if ((action === 'add') && settings.get('antibot:' + jid)) {
          const botPatterns = [/^1\d{10}$/, /^0{4,}/, /^9999/, /^123456/];
          if (botPatterns.some(p => p.test(num))) {
            await sock.sendMessage(jid, {
              text: '🤖 @' + num + ' was removed — suspected bot number.',
              mentions: [participant],
            }).catch(() => {});
            await sock.groupParticipantsUpdate(jid, [participant], 'remove').catch(() => {});
            continue;
          }
        }

        // ── Welcome ───────────────────────────────────────────────────
        if (action === 'add' && settings.get('welcome:' + jid)) {
          let meta = null;
          try { meta = await sock.groupMetadata(jid); } catch (_) {}
          const gName = meta?.subject || 'the group';
          const count = meta?.participants?.length || 0;
          const tmpl  = settings.get('welcome_msg:' + jid) || '';
          const text  = tmpl
            ? tmpl.replace(/{name}/g, '@' + num).replace(/{group}/g, gName).replace(/{count}/g, count)
            : '👋 Welcome to *' + gName + '*, @' + num + '! 🎉\n\n_Glad to have you! Please read the group rules._\n\n👥 Member #' + count;
          await sock.sendMessage(jid, { text, mentions: [participant] }).catch(() => {});
        }

        // ── Goodbye ───────────────────────────────────────────────────
        if ((action === 'remove' || action === 'leave') && settings.get('goodbye:' + jid)) {
          let meta = null;
          try { meta = await sock.groupMetadata(jid); } catch (_) {}
          const gName = meta?.subject || 'the group';
          const count = meta?.participants?.length || 0;
          const tmpl  = settings.get('goodbye_msg:' + jid) || '';
          const text  = tmpl
            ? tmpl.replace(/{name}/g, '@' + num).replace(/{group}/g, gName).replace(/{count}/g, count)
            : '👋 *@' + num + '* has left *' + gName + '*. Goodbye! 😢';
          await sock.sendMessage(jid, { text, mentions: [participant] }).catch(() => {});
        }
      }
    } catch (e) { logger.error('group-participants.update error:', e.message); }
  });

  // ── Messages ──────────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    // Stay online whenever a message arrives
    sock.sendPresenceUpdate('available').catch(() => {});

    for (const msg of messages) {
      try {
        const jid = msg.key?.remoteJid;
        if (!jid) continue;

        // ── Cache message for antidelete ─────────────────────────────
        if (msg.key?.id && msg.message && !msg.message?.protocolMessage) {
          const cacheKeys = Object.keys(msgCache);
          if (cacheKeys.length >= MSG_CACHE_MAX) delete msgCache[cacheKeys[0]];
          msgCache[msg.key.id] = {
            jid,
            sender:    msg.key.participant || msg.key.remoteJid,
            text:      extractText(msg),
            timestamp: msg.messageTimestamp,
            pushName:  msg.pushName || '',
            cachedAt:  Date.now(), // for 2-day auto-cleanup
          };
        }

        // ── Antidelete — detect revoked/deleted messages ──────────────
        if (msg.message?.protocolMessage?.type === 0) {
          const deletedId  = msg.message.protocolMessage.key?.id;
          const cached     = deletedId ? msgCache[deletedId] : null;
          const groupOn    = settings.get('antidelete:' + jid);
          const globalOn   = settings.get('antidelete_global:' + userId);

          if (cached && (groupOn || globalOn)) {
            const ownerJid  = (sessions[userId]?.phoneNumber || '').replace(/\D/g, '') + '@s.whatsapp.net';
            const senderNum = cached.sender?.split('@')[0] || '?';
            const name      = cached.pushName || senderNum;
            const isGroup   = cached.jid?.endsWith('@g.us');
            const where     = isGroup ? ('Group: ' + cached.jid) : ('DM with: ' + senderNum);

            await sock.sendMessage(ownerJid, {
              text:
                '🗑️ *Deleted Message Detected*\n' +
                '━━━━━━━━━━━━━━━━━━\n' +
                '👤 *Sender:* ' + name + ' (+' + senderNum + ')\n' +
                '📍 *' + where + '*\n' +
                '⏰ *Time:* ' + new Date((cached.timestamp || Date.now()) * 1000).toLocaleTimeString() + '\n' +
                '━━━━━━━━━━━━━━━━━━\n' +
                '💬 *Message:*\n' + (cached.text || '[media / no text]'),
            }).catch(() => {});
          }
          continue;
        }

        // ── Auto view + like status ──────────────────────────────────
        if (jid === 'status@broadcast') {
          if (settings.get('autoviewstatus:' + userId))
            await sock.readMessages([msg.key]).catch(() => {});
          if (settings.get('autolikestatus:' + userId)) {
            const author = msg.key.participant || msg.key.remoteJid;
            await sock.sendMessage(author, { react: { text: '❤️', key: msg.key } }).catch(() => {});
          }
          continue;
        }

        // ── ViewOnce detection (shared logic) ───────────────────────
        const rawVoMsg = !msg.key.fromMe
          ? (msg.message?.viewOnceMessage?.message ||
             msg.message?.viewOnceMessageV2?.message ||
             msg.message?.viewOnceMessageV2Extension?.message ||
             (msg.message?.imageMessage?.viewOnce === true ? msg.message : null) ||
             (msg.message?.videoMessage?.viewOnce === true ? msg.message : null))
          : null;

        if (rawVoMsg && msg.key.id) {
          // ── Cache viewonce so reactions can trigger DM delivery ───
          const voCacheKeys = Object.keys(voCache);
          if (voCacheKeys.length >= VO_CACHE_MAX) delete voCache[voCacheKeys[0]];
          voCache[msg.key.id] = {
            jid,
            originalMsg: msg,
            voMsg:    rawVoMsg,
            hasVideo: !!(rawVoMsg?.videoMessage),
            userId,
            cachedAt: Date.now(),
          };

          // ── novv: anti-viewonce in groups — delete & notify ───────
          const isGroup = jid.endsWith('@g.us');
          if (isGroup && settings.get('novv:' + jid)) {
            const sender    = msg.key.participant || msg.key.remoteJid;
            const senderNum = sender?.split('@')[0] || '';
            // Delete the viewonce message
            await sock.sendMessage(jid, { delete: msg.key }).catch(() => {});
            // Notify sender in their DM (silent if DM fails)
            const dmJid = senderNum + '@s.whatsapp.net';
            await sock.sendMessage(dmJid, {
              text:
                '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n' +
                '┏━━━━━━━━━━━━━━━━━━━▣\n' +
                '┃ 🚫 *VIEW-ONCE BLOCKED*\n' +
                '┠─────────────────────\n' +
                '┃ Your view-once message\n' +
                '┃ was deleted in:\n' +
                '┃ 📍 ' + jid + '\n' +
                '┠─────────────────────\n' +
                '┃ ⚠️ Sending view-once\n' +
                '┃ messages is *not allowed*\n' +
                '┃ in that group.\n' +
                '┗━━━━━━━━━━━━━━━━━━━▣\n' +
                '_ᴀsᴛʀᴀ-x ᴛᴇᴄʜ 🌍_',
            }).catch(() => {});
            continue; // skip further processing of this message
          }

          // ── viewonce auto-unlock in chat (legacy toggle) ───────────
          if (settings.get('viewonce:' + userId)) {
            try {
              const buf = await downloadMediaMessage(
                { ...msg, message: rawVoMsg }, 'buffer', {},
                { logger, reuploadRequest: sock.updateMediaMessage }
              );
              const cap = '👁️ *ViewOnce unlocked by ASTRA-X*';
              if (rawVoMsg.videoMessage)
                await sock.sendMessage(jid, { video: buf, caption: cap, mimetype: 'video/mp4' }).catch(() => {});
              else if (rawVoMsg.imageMessage)
                await sock.sendMessage(jid, { image: buf, caption: cap }).catch(() => {});
            } catch (_) {}
          }
        }

        await handleMessage(sock, msg, userId);
      } catch (e) { logger.error('messages.upsert crash:', e.message); }
    }
  });

  // ── React to a ViewOnce → unlocked media sent to reactor's DM ───────────
  sock.ev.on('messages.reaction', async (reactions) => {
    for (const reaction of reactions) {
      try {
        // Only handle add reactions (not removals)
        if (!reaction.key?.id || !reaction.reaction?.text) continue;

        // The message that was reacted TO
        const reactedMsgId = reaction.key.id;
        const cached = voCache[reactedMsgId];
        if (!cached) continue; // not a cached viewonce, ignore

        // Who reacted
        const reactorJid = reaction.reaction.senderJid ||
                           reaction.key.participant ||
                           reaction.key.remoteJid;
        if (!reactorJid) continue;

        const dmJid = reactorJid.endsWith('@s.whatsapp.net')
          ? reactorJid
          : reactorJid.split('@')[0] + '@s.whatsapp.net';

        try {
          const buf = await downloadMediaMessage(
            { ...cached.originalMsg, message: cached.voMsg }, 'buffer', {},
            { logger, reuploadRequest: sock.updateMediaMessage }
          );
          const cap =
            '👁️ *View-once unlocked by ASTRA-X*\n' +
            '📩 _Sent to your DM via reaction_';

          if (cached.hasVideo) {
            await sock.sendMessage(dmJid, { video: buf, caption: cap, mimetype: 'video/mp4' });
          } else {
            await sock.sendMessage(dmJid, { image: buf, caption: cap });
          }
        } catch (_) {}
      } catch (e) { logger.error('messages.reaction viewonce crash:', e.message); }
    }
  });

  return sock;
}

// ══════════════════════════════════════════════════════════════════════════
// handleMessage — all protections + per-user prefix
// ══════════════════════════════════════════════════════════════════════════
async function handleMessage(sock, msg, userId) {
  try {
    if (!msg?.message) return;
    const jid = msg.key.remoteJid;
    if (!jid) return;

    // Extract text early so we can check prefix before the fromMe block
    const rawText  = extractText(msg).trim();
    const PREFIX   = getPrefix(userId);

    const selfJid    = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const isSelfChat = jid === selfJid;

    // CRITICAL FIX: Allow fromMe messages if:
    // 1. It's self-chat (owner messaging their own number), OR
    // 2. It's a prefix command (owner controlling bot from their own WhatsApp in any chat)
    // This lets the bot owner use commands from their own account in groups/DMs
    if (msg.key?.fromMe && !isSelfChat && !rawText.startsWith(PREFIX)) return;

    const sender   = msg.key.participant || (msg.key.fromMe ? selfJid : jid);
    const ownerNum = (sessions[userId]?.phoneNumber || '').replace(/\D/g, '');
    // fromMe means the message is FROM the bot's account = always the owner
    const isOwner  = msg.key.fromMe === true
                  || sender.split('@')[0] === ownerNum
                  || jid.split('@')[0] === ownerNum;
    const isGroup  = jid.endsWith('@g.us');
    const text     = extractText(msg).trim();

    // ── Banned user check ────────────────────────────────────────────────
    const senderNum = sender ? sender.split('@')[0] : '';
    if (senderNum && userStore.isBanned(senderNum)) {
      // Silently ignore banned users
      return;
    }

    // ── Activation gate ───────────────────────────────────────────────────
    // Bot only responds to owner OR users with active subscriptions
    if (!isOwner) {
      if (!userStore.isUserActive(userId)) {
        // Silently ignore — not activated or subscription expired
        return;
      }
    }

    // ── Maintenance mode — only owner passes ─────────────────────────
    if (settings.get('maintenance:' + userId) && !isOwner) return;

    // ── Track activity for tagactive/taginactive ──────────────────────
    if (isGroup && !msg.key.fromMe && sender) {
      settings.set('lastmsg:' + jid + ':' + sender, Date.now());
    }

    // ── Mute by time — delete all messages from muted user ───────────
    if (isGroup && !isOwner) {
      const muteKey    = 'muted:' + jid + ':' + sender;
      const muteExpiry = settings.get(muteKey);
      if (muteExpiry) {
        if (Date.now() < muteExpiry) {
          await sock.sendMessage(jid, { delete: msg.key }).catch(() => {});
          const minsLeft = Math.ceil((muteExpiry - Date.now()) / 60000);
          await sock.sendMessage(jid, {
            text: '🔇 @' + sender.split('@')[0] + ' you are muted for ' + minsLeft + ' more minute(s). Your messages will be deleted.',
            mentions: [sender],
          }).catch(() => {});
          return;
        } else {
          settings.del(muteKey);
        }
      }
    }

    // ── Count every incoming message ─────────────────────────────────
    stats.recordMessage();

    // ── Auto-read (silent, all messages) ─────────────────────────────
    if (settings.get('autoread:' + userId))
      await sock.readMessages([msg.key]).catch(() => {});

    // ── AFK: clear if AFK person sends a message ──────────────────────
    const afkKey  = 'afk:' + userId + ':' + sender;
    if (settings.get(afkKey)) {
      settings.del(afkKey);
      settings.del('afkdata:' + userId + ':' + sender);
      await sock.sendMessage(jid, {
        text: '👋 Welcome back *' + (msg.pushName || sender.split('@')[0]) + '*! Your AFK status has been removed.',
      }).catch(() => {});
    }

    // ── AFK: notify if someone mentions an AFK user ───────────────────
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const mentionedJid of mentioned) {
      const mAfkKey = 'afk:' + userId + ':' + mentionedJid;
      if (settings.get(mAfkKey)) {
        const raw  = settings.get('afkdata:' + userId + ':' + mentionedJid) || '{}';
        const data = JSON.parse(raw);
        const mins = Math.floor((Date.now() - (data.since || Date.now())) / 60000);
        await sock.sendMessage(jid, {
          text: '💤 *@' + mentionedJid.split('@')[0] + '* is AFK' +
                (data.reason ? '\n📝 Reason: ' + data.reason : '') +
                '\n⏱️ Since: ' + mins + ' minutes ago',
          mentions: [mentionedJid],
        }).catch(() => {});
      }
    }

    // ── Group protections (run on ALL messages, not just prefix) ─────

    if (isGroup) {
      // Antilink ──────────────────────────────────────────────────────
      if (settings.get('antilink:' + jid)) {
        const urlRx = /(https?:\/\/[^\s]+|www\.[^\s]+|wa\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/i;
        if (urlRx.test(text)) {
          const admin = await isGroupAdmin(sock, jid, sender);
          if (!admin) {
            await sock.sendMessage(jid, { delete: msg.key }).catch(() => {});
            const wk = 'warns:' + jid + ':' + sender;
            const wc = (settings.get(wk) || 0) + 1;
            settings.set(wk, wc);
            const num = sender.split('@')[0];
            if (wc >= 3) {
              await sock.sendMessage(jid, { text: '⛔ @' + num + ' removed for sharing links 3 times.', mentions: [sender] }).catch(() => {});
              await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {});
              settings.del(wk);
            } else {
              await sock.sendMessage(jid, { text: '🚫 @' + num + ' links not allowed!\n⚠️ Warning *' + wc + '/3* — Removed at 3 warns.', mentions: [sender] }).catch(() => {});
            }
            return;
          }
        }
      }

      // Anti-badword ──────────────────────────────────────────────────
      if (settings.get('antibadword:' + jid) && text) {
        const bads = (settings.get('badwords:' + jid) || '').split(',').filter(Boolean);
        if (bads.some(w => text.toLowerCase().includes(w.toLowerCase().trim()))) {
          const admin = await isGroupAdmin(sock, jid, sender);
          if (!admin) {
            await sock.sendMessage(jid, { delete: msg.key }).catch(() => {});
            await sock.sendMessage(jid, { text: '🚫 Please watch your language!' }).catch(() => {});
            return;
          }
        }
      }

      // Blacklist ─────────────────────────────────────────────────────
      if (settings.get('blackliston:' + jid) && text) {
        const list = (settings.get('blacklist:' + jid) || '').split(',').filter(Boolean);
        if (list.some(w => text.toLowerCase().includes(w.toLowerCase().trim()))) {
          const admin = await isGroupAdmin(sock, jid, sender);
          if (!admin) {
            await sock.sendMessage(jid, { delete: msg.key }).catch(() => {});
            const wk = 'warns:' + jid + ':' + sender;
            const wc = (settings.get(wk) || 0) + 1;
            settings.set(wk, wc);
            const num = sender.split('@')[0];
            if (wc >= 3) {
              await sock.sendMessage(jid, { text: '⛔ @' + num + ' removed for using blacklisted words.', mentions: [sender] }).catch(() => {});
              await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {});
              settings.del(wk);
            } else {
              await sock.sendMessage(jid, { text: '🚫 @' + num + ' blacklisted word detected!\n⚠️ Warning *' + wc + '/3*', mentions: [sender] }).catch(() => {});
            }
            return;
          }
        }
      }

      // Antiflood ─────────────────────────────────────────────────────
      if (settings.get('antiflood:' + jid)) {
        const admin = await isGroupAdmin(sock, jid, sender);
        if (!admin) {
          const limit = settings.get('floodlimit:' + jid) || 5;
          const fKey  = jid + '_' + sender;
          if (!floodTracker[fKey]) floodTracker[fKey] = { count: 0, timer: null };
          floodTracker[fKey].count++;
          clearTimeout(floodTracker[fKey].timer);
          floodTracker[fKey].timer = setTimeout(() => { delete floodTracker[fKey]; }, 5000);
          if (floodTracker[fKey].count >= limit) {
            delete floodTracker[fKey];
            const wk  = 'warns:' + jid + ':' + sender;
            const wc  = (settings.get(wk) || 0) + 1;
            settings.set(wk, wc);
            const num = sender.split('@')[0];
            if (wc >= 3) {
              await sock.sendMessage(jid, { text: '⛔ @' + num + ' removed for flooding.', mentions: [sender] }).catch(() => {});
              await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {});
              settings.del(wk);
            } else {
              await sock.sendMessage(jid, { text: '🌊 @' + num + ' sending too fast!\n⚠️ Warning *' + wc + '/3*', mentions: [sender] }).catch(() => {});
            }
            return;
          }
        }
      }

      // Antispam (same message 3x) ─────────────────────────────────────
      if (settings.get('antispam:' + jid) && text) {
        const admin = await isGroupAdmin(sock, jid, sender);
        if (!admin) {
          const sKey = jid + '_spam_' + sender;
          if (!spamTracker[sKey]) spamTracker[sKey] = { lastText: '', count: 0, timer: null };
          if (text === spamTracker[sKey].lastText) {
            spamTracker[sKey].count++;
            clearTimeout(spamTracker[sKey].timer);
            spamTracker[sKey].timer = setTimeout(() => { delete spamTracker[sKey]; }, 10000);
            if (spamTracker[sKey].count >= 3) {
              delete spamTracker[sKey];
              await sock.sendMessage(jid, { delete: msg.key }).catch(() => {});
              const wk  = 'warns:' + jid + ':' + sender;
              const wc  = (settings.get(wk) || 0) + 1;
              settings.set(wk, wc);
              const num = sender.split('@')[0];
              if (wc >= 3) {
                await sock.sendMessage(jid, { text: '⛔ @' + num + ' removed for spamming.', mentions: [sender] }).catch(() => {});
                await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {});
                settings.del(wk);
              } else {
                await sock.sendMessage(jid, { text: '🚫 @' + num + ' stop spamming!\n⚠️ Warning *' + wc + '/3*', mentions: [sender] }).catch(() => {});
              }
              return;
            }
          } else {
            clearTimeout(spamTracker[sKey]?.timer);
            spamTracker[sKey] = {
              lastText: text, count: 1,
              timer: setTimeout(() => { delete spamTracker[sKey]; }, 10000),
            };
          }
        }
      }
    } // end isGroup protections

    // ── Per-user prefix check — ONLY commands past this point ────────
    if (!text || !text.startsWith(PREFIX)) return;

    const parts   = text.slice(PREFIX.length).trim().split(/\s+/);
    const cmdName = parts.shift().toLowerCase();
    const args    = parts;
    const cmd     = commands.get(cmdName);

    // Owner-only mode
    if (settings.get('owneronly:' + userId) && !isOwner) return;

    // Auto-react (only on commands, after prefix check)
    if (settings.get('autoreact:' + userId)) {
      const emojis = ['👍','❤️','🔥','😂','✅','🎉','💯','⚡','🫡','💪'];
      await sock.sendMessage(jid, {
        react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: msg.key },
      }).catch(() => {});
    }

    // Auto-typing (only on commands)
    if (settings.get('autotyping:' + userId)) {
      await sock.sendPresenceUpdate('composing', jid).catch(() => {});
      setTimeout(() => sock.sendPresenceUpdate('paused', jid).catch(() => {}), 2000);
    }

    // Auto-recording (only on commands)
    if (settings.get('autorecording:' + userId)) {
      await sock.sendPresenceUpdate('recording', jid).catch(() => {});
      setTimeout(() => sock.sendPresenceUpdate('paused', jid).catch(() => {}), 2000);
    }

    if (!cmd) {
      await sock.sendMessage(jid, {
        text: '❌ Unknown command: *' + PREFIX + cmdName + '*\nType *' + PREFIX + 'menu* to see all commands.',
      }).catch(() => {});
      return;
    }

    // ── Cooldown check ───────────────────────────────────────────────────────
    if (!isOwner) {
      const wait = checkCooldown(userId, cmdName);
      if (wait > 0) {
        await sock.sendMessage(jid, {
          text: '⏳ Please wait *' + wait + 's* before using *' + PREFIX + cmdName + '* again.',
        }).catch(() => {});
        return;
      }
      setCooldown(userId, cmdName);
    }

    logger.info('⚡ [' + userId + '] ' + PREFIX + cmdName + ' — args: ' + args.join(' '));
    stats.recordCommand(cmdName);
    try {
      await cmd.execute(sock, msg, args, userId, { isOwner, sender, downloadMediaMessage, prefix: PREFIX });
    } catch (e) {
      logger.error('Command "' + cmdName + '" error:', e.message);
      await sock.sendMessage(jid, { text: '⚠️ Error running *' + PREFIX + cmdName + '*: ' + e.message }).catch(() => {});
    }
  } catch (e) { logger.error('handleMessage fatal:', e.message); }
}

// ── startSession ──────────────────────────────────────────────────────────
async function startSession(userId, phoneNumber) {
  if (!userId || !phoneNumber) throw new Error('userId and phoneNumber required');
  if (sessions[userId]) { cancelSession(userId); await sleep(800); }
  wipeSession(userId);
  saveMeta(userId, phoneNumber);
  const sessDir = path.join(SESS_ROOT, userId);
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn, val) => { if (!settled) { settled = true; fn(val); } };

    // Overall timeout: 10 minutes — gives WA plenty of time to link + send DM
    const tout = setTimeout(() => {
      cancelSession(userId);
      wipeSession(userId);
      settle(reject, new Error('PAIRING_TIMEOUT'));
    }, 600_000); // 10 minutes

    createSocket(userId, phoneNumber, sessDir, {
      requestCode: true,
      // Resolve as soon as we have the code — pairing page shows it immediately
      onCode: code => { clearTimeout(tout); settle(resolve, { code, userId, phoneNumber, status: 'code_ready' }); },
      // onOpen fires when WA fully links — the socket itself handles sending DM and going offline
      // We just clear the overall timeout here — the socket stays alive for 30s to send messages
      onOpen: () => { clearTimeout(tout); },
      onFail: err => { clearTimeout(tout); cancelSession(userId); wipeSession(userId); settle(reject, err); },
    }).catch(e => { clearTimeout(tout); wipeSession(userId); settle(reject, e); });
  });
}

// ── restoreAllSessions ────────────────────────────────────────────────────
async function restoreAllSessions() {
  if (!fs.existsSync(SESS_ROOT)) return;
  const dirs = fs.readdirSync(SESS_ROOT).filter(d => {
    try { return fs.statSync(path.join(SESS_ROOT, d)).isDirectory(); } catch (_) { return false; }
  });
  let restored = 0, skipped = 0;
  for (const userId of dirs) {
    try {
      const meta        = readMeta(userId);
      const phoneNumber = meta?.phoneNumber || 'unknown';
      const hasCreds    = fs.existsSync(path.join(SESS_ROOT, userId, 'creds.json'));

      // ── Always register inactive sessions in memory so admin panel can see them
      //    without requiring a restart after pairing.
      if (!sessions[userId]) {
        sessions[userId] = {
          sock: null, phoneNumber,
          createdAt: meta?.createdAt ? new Date(meta.createdAt) : new Date(),
          code: null, isActive: false,
        };
      }

      // Ensure this session exists in session_store.json
      const ss = require('./sessionStore');
      if (phoneNumber !== 'unknown' && !ss.getByUserId(userId)) {
        ss.register(userId, phoneNumber);
      }

      // Skip WhatsApp connection if no creds (freshly paired but not yet confirmed)
      if (!hasCreds) {
        logger.info('📋 [' + userId + '] Registered as inactive (no creds yet)');
        skipped++;
        continue;
      }

      // Skip WhatsApp connection if subscription is inactive — session stays in memory
      //   but bot does NOT connect to WhatsApp (saves bandwidth/connections)
      const userStore = require('./userStore');
      if (!userStore.isUserActive(userId)) {
        logger.info('⏭️  [' + userId + '] Loaded as inactive (subscription not active)');
        skipped++;
        continue;
      }

      await createSocket(userId, phoneNumber, path.join(SESS_ROOT, userId), {
        requestCode: false,
        onOpen: () => logger.info('♻️  [' + userId + '] Restored!'),
        onFail: e  => { logger.error('♻️  [' + userId + '] Failed:', e.message); delete sessions[userId]; },
      });
      restored++;
      await sleep(1500);
    } catch (e) { logger.error('Restore ' + userId + ':', e.message); }
  }
  logger.info('♻️  Sessions: ' + restored + ' active restored, ' + skipped + ' inactive loaded');
}

// ── Exports ───────────────────────────────────────────────────────────────
const cancelSession  = userId => {
  if (!sessions[userId]) return false;
  try { sessions[userId].sock?.end?.(); } catch (_) {}
  delete sessions[userId];
  return true;
};
const getSession     = userId  => sessions[userId] || null;
const deleteSession  = userId  => {
  if (!sessions[userId]) return false;
  try { sessions[userId].sock?.end?.(); } catch (_) {}
  delete sessions[userId];
  return true;
};
const getAllSessions  = () =>
  Object.keys(sessions).map(uid => ({
    userId:      uid,
    phoneNumber: sessions[uid]?.phoneNumber || '—',
    createdAt:   sessions[uid]?.createdAt   || null,
    isActive:    !!(sessions[uid]?.sock?.user),
    jid:         sessions[uid]?.sock?.user?.id || null,
    prefix:      getPrefix(uid),
  }));

async function restoreSession(userId) {
  const metaPath = path.join(SESS_ROOT, userId, 'meta.json');
  if (!fs.existsSync(metaPath)) throw new Error('No saved session for ' + userId);
  const meta    = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const sessDir = path.join(SESS_ROOT, userId);
  return createSocket(userId, meta.phoneNumber || userId, sessDir, {
    requestCode: false,
    onOpen: () => logger.info('✅ Session restored: ' + userId),
    onFail: (e) => logger.error('Restore failed ' + userId + ': ' + e.message),
  });
}

module.exports = {
  startSession, cancelSession, getSession, deleteSession, restoreSession,
  getAllSessions, restoreAllSessions, sessions, commands,
  getAvailableCommands, loadCommands, getPrefix,
};
