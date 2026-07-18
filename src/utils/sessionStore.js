'use strict';
/**
 * ASTRA-X Session Store
 * Tracks pairing sessions and activation state
 */
const fs   = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '../../data/session_store.json');

function load() {
  try { return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}; }
  catch(_) { return {}; }
}
function save(d) {
  try { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); } catch(_) {}
}

function generateId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'ASTRAX-';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function register(userId, phoneNumber) {
  const d = load();
  // Reuse existing record for same userId
  const byUser = Object.values(d).find(r => r.userId === userId);
  if (byUser) return byUser.sessionId;
  // Also reuse if same phone number already has an INACTIVE record (prevents duplicates on re-pair)
  const byPhone = Object.values(d)
    .filter(r => r.phoneNumber === phoneNumber && !r.active && !r.activatedAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  if (byPhone) {
    // Update userId in case it changed (new browser session generates new uid)
    byPhone.userId    = userId;
    byPhone.createdAt = new Date().toISOString(); // refresh timestamp
    d[byPhone.sessionId] = byPhone;
    save(d);
    return byPhone.sessionId;
  }
  const sessionId = generateId();
  d[sessionId] = {
    sessionId,
    userId,
    phoneNumber,
    active:      false,
    createdAt:   new Date().toISOString(),
    activatedAt: null,
    note:        '',
  };
  save(d);
  return sessionId;
}

function activate(sessionId, activatedBy) {
  const d = load();
  if (!d[sessionId]) return null;
  const now = new Date();
  const exp = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  d[sessionId].active      = true;
  d[sessionId].activatedAt = now.toISOString();
  d[sessionId].expiresAt   = exp.toISOString();
  d[sessionId].activatedBy = activatedBy || 'owner';
  save(d);
  return d[sessionId];
}

/** Check and expire sessions older than 30 days */
function checkExpiry() {
  const d   = load();
  const now = Date.now();
  let changed = false;
  for (const sid in d) {
    if (d[sid].active && d[sid].expiresAt) {
      if (new Date(d[sid].expiresAt).getTime() < now) {
        d[sid].active    = false;
        d[sid].expired   = true;
        changed = true;
      }
    }
  }
  if (changed) save(d);
}

function deactivate(sessionId) {
  const d = load();
  if (!d[sessionId]) return null;
  d[sessionId].active = false;
  save(d);
  return d[sessionId];
}

function isActivated(userId) {
  const d = load();
  return Object.values(d).some(r => {
    if (r.userId !== userId || !r.active) return false;
    // Check expiry
    if (r.expiresAt && new Date(r.expiresAt) < new Date()) {
      // Auto-deactivate expired session
      r.active = false;
      save(d);
      return false;
    }
    return true;
  });
}

function getBySessionId(sid)  { return load()[sid] || null; }
function getByUserId(userId)  { const d = load(); return Object.values(d).find(r => r.userId === userId) || null; }
function getAll()             { return Object.values(load()); }
function remove(sessionId)    { const d = load(); delete d[sessionId]; save(d); }
function setNote(sid, note)   { const d = load(); if (d[sid]) { d[sid].note = note; save(d); } }

module.exports = { register, activate, deactivate, isActivated, getBySessionId, getByUserId, getAll, remove, setNote, checkExpiry };

// ── Expiry: activated bots go offline after 30 days ──────────────────────
function checkExpired() {
  const d    = load();
  const now  = Date.now();
  const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
  let changed = false;
  for (const sid in d) {
    const r = d[sid];
    if (r.active && r.activatedAt) {
      const age = now - new Date(r.activatedAt).getTime();
      if (age > ONE_MONTH) {
        d[sid].active    = false;
        d[sid].expiredAt = new Date().toISOString();
        changed = true;
      }
    }
  }
  if (changed) save(d);
  return changed;
}

// Run expiry check every hour
setInterval(checkExpired, 60 * 60 * 1000);

module.exports.checkExpired = checkExpired;

// ── Auto-cleanup: delete session RECORDS older than 2 days if still inactive ──
// This keeps data/session_store.json small and reduces disk usage
function cleanupOldInactive() {
  const d       = load();
  const now     = Date.now();
  const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
  let removed   = 0;
  for (const sid in d) {
    const r = d[sid];
    // Only delete records that were never activated AND are older than 2 days
    if (!r.active && !r.activatedAt) {
      const age = now - new Date(r.createdAt).getTime();
      if (age > TWO_DAYS) {
        delete d[sid];
        removed++;
      }
    }
  }
  if (removed > 0) {
    save(d);
    const logger = require('./logger');
    logger.info('🧹 Removed ' + removed + ' old unactivated session records (>2 days)');
  }
}
setInterval(cleanupOldInactive, 12 * 60 * 60 * 1000); // every 12 hours
module.exports.cleanupOldInactive = cleanupOldInactive;
