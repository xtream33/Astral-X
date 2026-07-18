'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'weather', aliases: ['w', 'forecast', 'temp', 'climate'],
  category: 'utility', description: 'Current weather. Usage: .weather <city>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const city = args.join(' ').trim();
    if (!city) return sock.sendMessage(jid, { text: box('🌤️ *WEATHER*', '📌 *Usage:* .weather <city>\n\n💡 *Examples:*\n.weather Kampala\n.weather London\n.weather New York') });
    await sock.sendMessage(jid, { text: box('🌤️ *WEATHER*', '_Fetching weather for *' + city + '*..._') });
    try {
      const res = await fetch('https://wttr.in/' + encodeURIComponent(city) + '?format=j1', { signal: AbortSignal.timeout(10000) });
      if (!res.ok) return; // silent on city not found
      const d = await res.json();
      const c = d.current_condition?.[0], a = d.nearest_area?.[0];
      if (!c || !a) return; // silent
      const name = a.areaName?.[0]?.value + ', ' + a.country?.[0]?.value;
      const desc = c.weatherDesc?.[0]?.value || '';
      const feel = parseInt(c.FeelsLikeC);
      const feelTxt = feel < 10 ? '🥶 Very Cold' : feel < 20 ? '😐 Cool' : feel < 28 ? '😊 Comfortable' : feel < 35 ? '😓 Warm' : '🔥 Hot';
      await sock.sendMessage(jid, { text: box('🌤️ *WEATHER — ' + name.toUpperCase() + '*', '🌡️ *Temp:*      ' + c.temp_C + '°C / ' + c.temp_F + '°F\n🤔 *Feels:*     ' + c.FeelsLikeC + '°C ' + feelTxt + '\n💧 *Humidity:*  ' + c.humidity + '%\n💨 *Wind:*      ' + c.windspeedKmph + ' km/h\n☁️ *Sky:*       ' + desc + '\n👁️ *Visibility:* ' + c.visibility + ' km\n☁️ *Cloud:*     ' + c.cloudcover + '%') }, { quoted: msg });
    } catch (_) { /* silent */ }
  },
};
