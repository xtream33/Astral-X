/**
 * ASTRA-X Startup Environment Validator
 * Checks for required/recommended env vars at boot.
 */
const logger = require('./logger');

const CHECKS = [
  {
    key: 'SESSION_SECRET',
    required: false,
    dangerous_default: ['astrax-key-2024', 'astrax_secret_key_2024', 'order', 'REPLACE_WITH_64_RANDOM_CHARS'],
    message: '⚠️  SESSION_SECRET is using the default value. Set a long random string in .env to protect admin sessions.',
  },
  {
    key: 'ADMIN_PASS',
    required: false,
    dangerous_default: ['astrax2024', 'change_this_password'],
    message: '🔴 ADMIN_PASS is using a default/example value. Change it in .env immediately — anyone can access your admin panel!',
  },
  {
    key: 'ADMIN_AUTH_KEY',
    required: false,
    dangerous_default: ['NOOR7', 'change_this_key'],
    message: '🔴 ADMIN_AUTH_KEY is using a default/example value. Change it in .env immediately!',
  },
  {
    key: 'BOT_OWNER',
    required: false,
    message: '💡 BOT_OWNER is not set. Set it to your phone number (e.g. 256747304196) to enable owner-only features.',
  },
  {
    key: 'WHATSAPP_CHANNEL_JID',
    required: false,
    message: '💡 WHATSAPP_CHANNEL_JID is not set. Channel membership checks are disabled.',
  },
  {
    key: 'HOST',
    required: false,
    dangerous_default: ['localhost'],
    message: '⚠️  HOST is set to "localhost". Bot will not be accessible externally. Change to 0.0.0.0 if deploying to a server.',
  },
];

function validateEnv() {
  let warnings = 0;
  for (const check of CHECKS) {
    const val = process.env[check.key];
    if (!val) {
      if (check.message) { logger.warn(`ENV: ${check.message}`); warnings++; }
    } else if (check.dangerous_default?.includes(val)) {
      logger.warn(`ENV: ${check.message}`);
      warnings++;
    }
  }
  if (warnings > 0) {
    logger.warn(`ENV: ${warnings} warning(s) above. Edit your .env file to fix them.`);
  } else {
    logger.info('ENV: ✅ All environment checks passed.');
  }
}

module.exports = { validateEnv };
