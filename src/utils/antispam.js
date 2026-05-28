/**
 * ASTRA-X Anti-Spam System
 *
 * FIX: Previous version counted every message including normal conversation,
 * so a fast group chat would trigger spam warnings on innocent users.
 *
 * Now tracks COMMAND invocations only (called after PREFIX check in socket.js).
 * Regular messages are counted separately with a much higher, more lenient threshold.
 *
 * Thresholds:
 *   Commands:  6 in 10s → warn | 10 in 10s → mute 45s
 *   Messages:  20 in 6s → warn | 30 in 6s → mute 30s  (only for non-command spam)
 */

const CMD_MAX    = 10;    // commands before mute
const CMD_WARN   = 6;     // commands before warn
const CMD_WIN    = 10000; // 10 second window for commands
const CMD_MUTE   = 45000; // 45 second mute for command spam

const MSG_MAX    = 30;    // messages before mute
const MSG_WARN   = 20;    // messages before warn
const MSG_WIN    = 6000;  // 6 second window for raw messages
const MSG_MUTE   = 30000; // 30 second mute

// Map: key → { cmdMsgs: number[], msgMsgs: number[], mutedUntil: number, mutedFor: string }
const tracker = new Map();

function _state(key) {
  if (!tracker.has(key)) tracker.set(key, { cmdMsgs: [], msgMsgs: [], mutedUntil: 0 });
  return tracker.get(key);
}

/**
 * Check a command invocation (called once per !command).
 * @returns {'ok'|'warned'|'muted'}
 */
function checkCommand(senderId, jid) {
  const key  = `${senderId}::${jid}`;
  const now  = Date.now();
  const s    = _state(key);

  if (s.mutedUntil > now) return 'muted';

  s.cmdMsgs = s.cmdMsgs.filter(t => now - t < CMD_WIN);
  s.cmdMsgs.push(now);

  if (s.cmdMsgs.length > CMD_MAX) {
    s.mutedUntil = now + CMD_MUTE;
    s.mutedFor   = 'commands';
    s.cmdMsgs    = [];
    return 'muted';
  }
  return s.cmdMsgs.length >= CMD_WARN ? 'warned' : 'ok';
}

/**
 * Check a raw (non-command) message — much more lenient.
 * @returns {'ok'|'warned'|'muted'}
 */
function checkMessage(senderId, jid) {
  const key  = `${senderId}::${jid}`;
  const now  = Date.now();
  const s    = _state(key);

  if (s.mutedUntil > now) return 'muted';

  s.msgMsgs = s.msgMsgs.filter(t => now - t < MSG_WIN);
  s.msgMsgs.push(now);

  if (s.msgMsgs.length > MSG_MAX) {
    s.mutedUntil = now + MSG_MUTE;
    s.mutedFor   = 'messages';
    s.msgMsgs    = [];
    return 'muted';
  }
  return s.msgMsgs.length >= MSG_WARN ? 'warned' : 'ok';
}

function reset(senderId, jid) { tracker.delete(`${senderId}::${jid}`); }

function muteSecondsLeft(senderId, jid) {
  const s = tracker.get(`${senderId}::${jid}`);
  return s?.mutedUntil ? Math.max(0, Math.ceil((s.mutedUntil - Date.now()) / 1000)) : 0;
}

module.exports = { checkCommand, checkMessage, reset, muteSecondsLeft };
