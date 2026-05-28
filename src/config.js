module.exports = {
  PORT: process.env.PORT || 3000,
  // Admin credentials — env vars must match what admin.js reads (ADMIN_USER, ADMIN_PASS)
  ADMIN_USER:     process.env.ADMIN_USER     || 'admin',
  ADMIN_USERNAME: process.env.ADMIN_USER     || 'admin', // legacy alias
  ADMIN_PASS:     process.env.ADMIN_PASS     || 'astrax2024',
  ADMIN_PASSWORD: process.env.ADMIN_PASS     || 'astrax2024', // legacy alias
  ADMIN_AUTH_KEY: process.env.ADMIN_AUTH_KEY || 'NOOR7',
  SESSION_SECRET: process.env.SESSION_SECRET || 'astrax_secret_key_2024',
  // Channel JID — .env uses WHATSAPP_CHANNEL_JID, fallback to old name
  WHATSAPP_CHANNEL_ID: process.env.WHATSAPP_CHANNEL_JID || process.env.WHATSAPP_CHANNEL_ID || '',
  // CHANNEL_CHECK_INTERVAL in .env is in hours; convert to ms
  CHANNEL_CHECK_INTERVAL: (parseInt(process.env.CHANNEL_CHECK_INTERVAL) || 10) * 60 * 60 * 1000,
  PAIRING_TIMEOUT:      2 * 60 * 1000, // 2 minutes
  PAIRING_CODE_TIMEOUT: 5 * 60 * 1000, // 5 minutes for code validity
  NODE_ENV: process.env.NODE_ENV || 'production',
};
