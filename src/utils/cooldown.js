/**
 * ASTRA-X Cooldown System
 * Prevents command spam by tracking the last time each user ran each command.
 * All data lives in memory — resets on bot restart (intentional).
 *
 * Usage:
 *   const { checkCooldown, setCooldown, DEFAULT_COOLDOWNS } = require('./cooldown');
 *   const wait = checkCooldown(userId, 'joke');  // returns seconds remaining, or 0
 *   if (wait > 0) return sock.sendMessage(jid, { text: `⏳ Wait ${wait}s` });
 *   setCooldown(userId, 'joke');
 */

// Per-command cooldown in seconds (override here or in individual commands)
const DEFAULT_COOLDOWNS = {
  // Info / utility — short
  ping: 3, alive: 5, stats: 5, time: 3, info: 5, owner: 5, menu: 5,

  // Fun — medium
  joke: 10, quote: 10, '8ball': 5, dice: 5, flip: 5, rps: 5,
  roast: 15, compliment: 10, rate: 8, truth: 10, dare: 10,
  fact: 10, riddle: 20, ship: 10, choose: 5,

  // Tools — short
  calc: 3, reverse: 3, upper: 3, lower: 3, count: 3,
  repeat: 5, base64: 5, hash: 5, uuid: 5,
  password: 8,

  // Group — medium (prevents admin spam)
  everyone: 30, kick: 5, promote: 5, demote: 5,
  mute: 10, unmute: 10, ginfo: 10, link: 15,
  warn: 5, warnings: 5, clearwarn: 5,

  // Anti toggles
  antilink: 5, antibadword: 5,

  // Auto toggles
  autoread: 5, autoreact: 5, autotyping: 5, autorecording: 5,

  // Downloads — long (heavy operations)
  ytmp3: 30, ytmp4: 30, tiktok: 25, igdl: 25, twitter: 25, mediafire: 20,

  // Default fallback for any unlisted command
  _default: 5,
};

// Map: `userId:cmdName` → timestamp (ms) when cooldown expires
const cooldowns = new Map();

/**
 * Returns seconds remaining on cooldown, or 0 if ready.
 * @param {string} userId  - session userId
 * @param {string} cmdName - command name (lowercase)
 * @param {number} [override] - custom seconds (overrides DEFAULT_COOLDOWNS)
 */
function checkCooldown(userId, cmdName, override) {
  const key     = `${userId}:${cmdName}`;
  const expires = cooldowns.get(key);
  if (!expires) return 0;
  const remaining = Math.ceil((expires - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

/**
 * Stamps the cooldown for a user+command.
 * @param {string} userId
 * @param {string} cmdName
 * @param {number} [override] - custom duration in seconds
 */
function setCooldown(userId, cmdName, override) {
  const secs = override ?? DEFAULT_COOLDOWNS[cmdName] ?? DEFAULT_COOLDOWNS._default;
  const key  = `${userId}:${cmdName}`;
  cooldowns.set(key, Date.now() + secs * 1000);
  // Auto-clean after expiry so the Map doesn't grow forever
  setTimeout(() => cooldowns.delete(key), (secs + 1) * 1000);
}

/** Clears all cooldowns for a user (e.g. for owner/admin bypass). */
function clearUserCooldowns(userId) {
  for (const key of cooldowns.keys()) {
    if (key.startsWith(`${userId}:`)) cooldowns.delete(key);
  }
}

module.exports = { checkCooldown, setCooldown, clearUserCooldowns, DEFAULT_COOLDOWNS };
