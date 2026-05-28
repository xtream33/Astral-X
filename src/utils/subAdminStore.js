'use strict';
/**
 * Sub-Admin Store
 * Manages sub-admin accounts created by owner
 */
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const FILE = path.join(__dirname, '../../data/sub_admins.json');

function load() {
  try { return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}; }
  catch(_) { return {}; }
}
function save(d) {
  try { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); } catch(_) {}
}

// Simple hash — no bcrypt dependency needed
function hashPass(pass) {
  return crypto.createHash('sha256').update(pass + 'astrax_salt_2026').digest('hex');
}

function createAdmin(username, email, password, sessionQuota) {
  const d   = load();
  const id  = 'sub_' + Date.now();
  d[id] = {
    id, username, email,
    passwordHash: hashPass(password),
    sessionQuota: parseInt(sessionQuota) || 5,
    activatedSessions: [], // array of sessionIds they activated
    createdAt: new Date().toISOString(),
    active: true,
  };
  save(d);
  return d[id];
}

function verifyLogin(username, email, password) {
  const d = load();
  return Object.values(d).find(a =>
    a.active &&
    a.username === username &&
    a.email === email &&
    a.passwordHash === hashPass(password)
  ) || null;
}

function getAll()        { return Object.values(load()); }
function getById(id)     { return load()[id] || null; }
function deleteAdmin(id) { const d = load(); delete d[id]; save(d); }

function updateQuota(id, quota) {
  const d = load();
  if (d[id]) { d[id].sessionQuota = parseInt(quota); save(d); }
}

// Track which sessions a sub-admin activated
function addSession(adminId, sessionId) {
  const d = load();
  if (!d[adminId]) return;
  if (!d[adminId].activatedSessions.includes(sessionId)) {
    d[adminId].activatedSessions.push(sessionId);
  }
  save(d);
}

function removeSession(adminId, sessionId) {
  const d = load();
  if (!d[adminId]) return;
  d[adminId].activatedSessions = d[adminId].activatedSessions.filter(s => s !== sessionId);
  save(d);
}

function getAdminBySession(sessionId) {
  const d = load();
  return Object.values(d).find(a => a.activatedSessions.includes(sessionId)) || null;
}

function canActivate(adminId) {
  const d = load();
  const a = d[adminId];
  if (!a) return false;
  return a.activatedSessions.length < a.sessionQuota;
}

module.exports = {
  createAdmin, verifyLogin, getAll, getById,
  deleteAdmin, updateQuota, addSession, removeSession,
  getAdminBySession, canActivate, hashPass,
};
