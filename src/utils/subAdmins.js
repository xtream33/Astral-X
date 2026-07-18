'use strict';
/**
 * Sub-Admin Manager
 * Owner creates sub-admins with limited session slots and expiry
 */
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, '../../data/sub_admins.json');

function load() {
  try { return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE,'utf8')) : {}; }
  catch(_) { return {}; }
}
function save(d) {
  try { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); } catch(_) {}
}

function hashPass(password) {
  return crypto.createHash('sha256').update(password + 'astrax_salt_2026').digest('hex');
}

/** Owner creates a sub-admin */
function create({ username, email, password, maxSessions }) {
  const d   = load();
  const id  = 'sub_' + Date.now();
  d[id] = {
    id,
    username:    username.trim(),
    email:       email.trim().toLowerCase(),
    password:    hashPass(password),
    maxSessions: parseInt(maxSessions) || 1,
    activatedSessions: [], // session IDs they activated
    createdAt:   new Date().toISOString(),
    active:      true,
  };
  save(d);
  return d[id];
}

/** Verify login credentials */
function verify(username, password) {
  const d = load();
  return Object.values(d).find(a =>
    (a.username === username || a.email === username.toLowerCase()) &&
    a.password === hashPass(password) &&
    a.active
  ) || null;
}

/** Get sub-admin by id */
function getById(id)   { return load()[id] || null; }
function getAll()      { return Object.values(load()); }

/** Check if sub-admin can activate more sessions */
function canActivate(subAdminId) {
  const d = load();
  const a = d[subAdminId];
  if (!a) return false;
  // Remove expired (30-day) sessions from their count
  const ss = require('./sessionStore');
  const now = Date.now();
  a.activatedSessions = a.activatedSessions.filter(sid => {
    const rec = ss.getBySessionId(sid);
    if (!rec) return false;
    if (!rec.activatedAt) return true;
    const age = now - new Date(rec.activatedAt).getTime();
    return age < 30 * 24 * 60 * 60 * 1000; // 30 days
  });
  save(d);
  return a.activatedSessions.length < a.maxSessions;
}

/** Record a session activated by sub-admin */
function recordActivation(subAdminId, sessionId) {
  const d = load();
  if (!d[subAdminId]) return;
  if (!d[subAdminId].activatedSessions.includes(sessionId)) {
    d[subAdminId].activatedSessions.push(sessionId);
  }
  save(d);
}

/** Remove a session from sub-admin's list */
function removeSession(subAdminId, sessionId) {
  const d = load();
  if (!d[subAdminId]) return;
  d[subAdminId].activatedSessions = d[subAdminId].activatedSessions.filter(s => s !== sessionId);
  save(d);
}

/** Get sessions belonging to a sub-admin */
function getMySessions(subAdminId) {
  const d = load();
  return d[subAdminId]?.activatedSessions || [];
}

/** Delete sub-admin */
function remove(id) { const d = load(); delete d[id]; save(d); }

/** Toggle active */
function toggle(id) {
  const d = load();
  if (d[id]) { d[id].active = !d[id].active; save(d); }
  return d[id];
}

/** Update max sessions */
function setMax(id, max) {
  const d = load();
  if (d[id]) { d[id].maxSessions = parseInt(max); save(d); }
}

module.exports = { create, verify, getById, getAll, canActivate, recordActivation, removeSession, getMySessions, remove, toggle, setMax, hashPass };
