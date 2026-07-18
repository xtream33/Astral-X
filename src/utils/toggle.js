'use strict';
const settings = require('./settings');

const H   = '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕';
const TOP = '┏━━━━━━━━━━━━━━━━━━━▣';
const DIV = '┠─────────────────────';
const BOT = '┗━━━━━━━━━━━━━━━━━━━▣';
const FTR = '_ᴀsᴛʀᴀ-x ᴛᴇᴄʜ 🌍_';

function parseOnOff(arg) {
  const a = (arg || '').toLowerCase()
    .replace(/[\u200b-\u200d\ufeff\u00a0\u2060]/g, '')
    .trim();
  if (!a) return null;
  if (['on','yes','enable','enabled','1','true','start','activate'].includes(a))    return true;
  if (['off','no','disable','disabled','0','false','stop','deactivate'].includes(a)) return false;
  return null;
}

function smartToggle(key, forceOn) {
  const current = settings.get(key);
  if (forceOn === null || forceOn === undefined) {
    return { state: current, changed: false, wasAlready: false, statusOnly: true };
  }
  if (current === forceOn) {
    return { state: current, changed: false, wasAlready: true, statusOnly: false };
  }
  settings.set(key, forceOn);
  return { state: forceOn, changed: true, wasAlready: false, statusOnly: false };
}

function toggleMsg(label, emoji, result, onMsg = '', offMsg = '') {
  const se = result.state ? '🟢' : '🔴';
  const sw = result.state ? 'ENABLED' : 'DISABLED';

  if (result.statusOnly) {
    return (
      H + '\n' + TOP + '\n' +
      '┃ ' + emoji + ' *' + label.toUpperCase() + '*\n' +
      DIV + '\n' +
      '┃ Status:  *' + se + ' ' + sw + '*\n' +
      DIV + '\n' +
      '┃ • Send *on*  to enable\n' +
      '┃ • Send *off* to disable\n' +
      BOT + '\n' + FTR
    );
  }

  if (result.wasAlready) {
    return (
      H + '\n' + TOP + '\n' +
      '┃ ' + emoji + ' *' + label.toUpperCase() + '*\n' +
      DIV + '\n' +
      '┃ Status:  *' + se + ' ALREADY ' + sw + '*\n' +
      BOT + '\n' + FTR
    );
  }

  return (
    H + '\n' + TOP + '\n' +
    '┃ ' + emoji + ' *' + label.toUpperCase() + '*\n' +
    DIV + '\n' +
    '┃ Status:  *' + se + ' ' + sw + '*\n' +
    ((result.state  && onMsg)  ? DIV + '\n┃ ' + onMsg  + '\n' : '') +
    ((!result.state && offMsg) ? DIV + '\n┃ ' + offMsg + '\n' : '') +
    BOT + '\n' + FTR
  );
}

module.exports = { smartToggle, toggleMsg, parseOnOff };
