'use strict';
const logger  = require('../utils/logger');
const config  = require('../config');
// Use socket.js sessions (source of truth for active connections)
// db.getConnectedUsers() is unreliable because socket.js may not call db.addUser()
let _getAll, _getSession;
function lazyLoad() {
  if (!_getAll) {
    const s = require('../utils/socket');
    _getAll    = s.getAllSessions;
    _getSession = s.getSession;
  }
}

async function checkChannelMembership() {
  lazyLoad();
  logger.info('🔄 Starting channel membership check...');

  const channelId = config.WHATSAPP_CHANNEL_ID;
  if (!channelId || channelId.startsWith('http')) {
    // URL was accidentally set — skip silently; user needs to set a proper JID in .env
    logger.warn('⚠️  WHATSAPP_CHANNEL_JID not set or is a URL — skipping channel check.' +
      ' Set it to the newsletter JID (ends with @newsletter) in your .env file.');
    return;
  }

  const allSessions = _getAll();
  const activeSessions = allSessions.filter(s => s.isActive);

  if (activeSessions.length === 0) {
    logger.info('ℹ️  No active sessions to check');
    return;
  }

  let checked = 0, readded = 0, failed = 0;

  for (const s of activeSessions) {
    try {
      const sess = _getSession(s.userId);
      if (!sess?.sock?.user) {
        logger.warn(`No active socket for ${s.userId} — skipping`);
        continue;
      }

      // For newsletter/channel JIDs, use newsletterMetadata if available, else groupMetadata
      let isMember = false;
      try {
        if (typeof sess.sock.newsletterMetadata === 'function') {
          await sess.sock.newsletterMetadata('invite', channelId);
          isMember = true;
        } else {
          await sess.sock.groupMetadata(channelId);
          isMember = true;
        }
      } catch (_) {
        isMember = false;
      }
      checked++;

      if (!isMember) {
        logger.info(`📢 ${s.phoneNumber} not in channel — attempting to join...`);
        try {
          if (typeof sess.sock.newsletterFollow === 'function') {
            await sess.sock.newsletterFollow(channelId);
          } else if (typeof sess.sock.groupAcceptInvite === 'function') {
            await sess.sock.groupAcceptInvite(channelId);
          }
          logger.info(`✅ ${s.phoneNumber} joined channel`);
          readded++;
        } catch (addErr) {
          logger.error(`Failed to add ${s.phoneNumber} to channel:`, addErr.message);
          failed++;
        }
      } else {
        logger.info(`✅ ${s.phoneNumber} is in channel`);
      }
    } catch (err) {
      logger.error(`Error checking ${s.userId}:`, err.message);
      failed++;
    }
  }

  logger.info(`✅ Channel check done — checked: ${checked}, re-added: ${readded}, failed: ${failed}`);
}

function startChannelCheck() {
  const interval = config.CHANNEL_CHECK_INTERVAL || 10 * 60 * 60 * 1000;
  logger.info(`⏰ Channel check scheduled (every ${interval / 3600000}h)`);
  // Delay initial check by 30s to let sessions restore first
  setTimeout(() => {
    checkChannelMembership().catch(err => logger.error('Initial channel check failed:', err.message));
  }, 30_000);
  setInterval(() => {
    checkChannelMembership().catch(err => logger.error('Scheduled channel check failed:', err.message));
  }, interval);
}

module.exports = { checkChannelMembership, startChannelCheck };
