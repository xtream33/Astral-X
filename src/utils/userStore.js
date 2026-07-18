'use strict';
/**
 * ASTRA-X User Store
 * Tracks activated users, banned numbers, and 1-month connection expiry
 */
const fs   = require('fs');
const path = require('path');
const logger = require('./logger');

const ACTIVATED_FILE = path.join(__dirname, '../../data/activated_users.json');
const BANNED_FILE    = path.join(__dirname, '../../data/banned_users.json');
const ONE_MONTH      = 30 * 24 * 60 * 60 * 1000;

function loadActivated() {
  try { return fs.existsSync(ACTIVATED_FILE) ? JSON.parse(fs.readFileSync(ACTIVATED_FILE,'utf8')) : {}; }
  catch(_) { return {}; }
}
function saveActivated(d) {
  try { fs.writeFileSync(ACTIVATED_FILE, JSON.stringify(d, null, 2)); } catch(_) {}
}
function loadBanned() {
  try { return fs.existsSync(BANNED_FILE) ? JSON.parse(fs.readFileSync(BANNED_FILE,'utf8')) : {}; }
  catch(_) { return {}; }
}
function saveBanned(d) {
  try { fs.writeFileSync(BANNED_FILE, JSON.stringify(d, null, 2)); } catch(_) {}
}

/** Activate a user — bot responds to them for 1 month */
function activateUser(userId, phoneNumber, activatedBy) {
  const d = loadActivated();
  d[userId] = {
    userId, phoneNumber,
    activatedBy:  activatedBy || 'owner',
    activatedAt:  new Date().toISOString(),
    expiresAt:    new Date(Date.now() + ONE_MONTH).toISOString(),
    active:       true,
  };
  saveActivated(d);
  return d[userId];
}

/** Check if a userId is active and not expired */
function isUserActive(userId) {
  const d = loadActivated();
  const u = d[userId];
  if (!u || !u.active) return false;
  if (Date.now() > new Date(u.expiresAt).getTime()) {
    // Expired — deactivate
    d[userId].active = false;
    saveActivated(d);
    return false;
  }
  return true;
}

/** Deactivate a user */
function deactivateUser(userId) {
  const d = loadActivated();
  if (d[userId]) { d[userId].active = false; saveActivated(d); }
}

/** Get all activated users */
function getAllActivated() { return Object.values(loadActivated()); }

/** Get user record */
function getUser(userId) { return loadActivated()[userId] || null; }

/** Ban a phone number */
function banUser(phoneNumber, reason, bannedBy) {
  const d = loadBanned();
  const clean = phoneNumber.replace(/\D/g, '');
  d[clean] = {
    phoneNumber: clean,
    reason:      reason || 'Banned by admin',
    bannedBy:    bannedBy || 'owner',
    bannedAt:    new Date().toISOString(),
  };
  saveBanned(d);
  return d[clean];
}

/** Unban a phone number */
function unbanUser(phoneNumber) {
  const d    = loadBanned();
  const clean = phoneNumber.replace(/\D/g, '');
  delete d[clean];
  saveBanned(d);
}

/** Check if a phone number is banned */
function isBanned(phoneNumber) {
  const d     = loadBanned();
  const clean = phoneNumber.replace(/\D/g, '');
  return !!d[clean];
}

/** Get all banned users */
function getAllBanned() { return Object.values(loadBanned()); }

/** Get ban record */
function getBan(phoneNumber) {
  const d = loadBanned();
  return d[phoneNumber.replace(/\D/g, '')] || null;
}

/** Run expiry check — called on startup and every hour */
function checkExpired() {
  const d = loadActivated();
  let expired = 0;
  const now = Date.now();
  for (const uid in d) {
    if (d[uid].active && new Date(d[uid].expiresAt).getTime() < now) {
      d[uid].active = false;
      expired++;
    }
  }
  if (expired > 0) {
    saveActivated(d);
    logger.info('🕐 Expired ' + expired + ' user subscription(s)');
  }
}

// Check every hour
setInterval(checkExpired, 60 * 60 * 1000);

module.exports = {
  activateUser, isUserActive, deactivateUser,
  getAllActivated, getUser,
  banUser, unbanUser, isBanned, getAllBanned, getBan,
  checkExpired,
};
