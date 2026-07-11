(function(){
var _0x1a2b=["Y29uc3QgeyBkb3dubG9hZE1lZGlhTWVzc2FnZSB9ID0gcmVxdWlyZSgnQHdoaXNrZXlzb2NrZXRzL2Jh",
    "aWxleXMnKTsKY29uc3QgeyBleGVjIH0gPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJyk7CmNvbnN0IGZz",
    "ID0gcmVxdWlyZSgnZnMnKSwgb3MgPSByZXF1aXJlKCdvcycpLCBwYXRoID0gcmVxdWlyZSgncGF0aCcp",
    "OwoKbW9kdWxlLmV4cG9ydHMgPSB7CiAgbmFtZTogJ3RvbXAzJywKICBhbGlhc2VzOiBbJ21wMycsICdh",
    "dWRpbycsICd0b2F1ZGlvJ10sCiAgY2F0ZWdvcnk6ICdtZWRpYScsCiAgZGVzY3JpcHRpb246ICdDb252",
    "ZXJ0IGEgcmVwbGllZCB2aWRlbyB0byBNUDMgYXVkaW8nLAogIGV4ZWN1dGU6IGFzeW5jIChzb2NrLCBt",
    "c2cpID0+IHsKICAgIGNvbnN0IGppZCAgICA9IG1zZy5rZXkucmVtb3RlSmlkOwogICAgY29uc3QgcXVv",
    "dGVkID0gbXNnLm1lc3NhZ2U/LmV4dGVuZGVkVGV4dE1lc3NhZ2U/LmNvbnRleHRJbmZvPy5xdW90ZWRN",
    "ZXNzYWdlOwogICAgY29uc3QgdGFyZ2V0ID0gcXVvdGVkIHx8IG1zZy5tZXNzYWdlOwoKICAgIGlmICgh",
    "dGFyZ2V0Py52aWRlb01lc3NhZ2UgJiYgIXRhcmdldD8uYXVkaW9NZXNzYWdlKQogICAgICByZXR1cm4g",
    "c29jay5zZW5kTWVzc2FnZShqaWQsIHsgdGV4dDogJ+KdjCBSZXBseSB0byBhICp2aWRlbyBvciBhdWRp",
    "byogd2l0aCAhdG9tcDNcblxuUmVxdWlyZXMgZmZtcGVnOlxuYGBgcGtnIGluc3RhbGwgZmZtcGVnYGBg",
    "JyB9KTsKCiAgICBhd2FpdCBzb2NrLnNlbmRNZXNzYWdlKGppZCwgeyB0ZXh0OiAn8J+OtSBDb252ZXJ0",
    "aW5nIHRvIE1QMy4uLicgfSk7CgogICAgY29uc3QgdGFyZ2V0TXNnID0gcXVvdGVkID8geyAuLi5tc2cs",
    "IG1lc3NhZ2U6IHF1b3RlZCB9IDogbXNnOwoKICAgIHRyeSB7CiAgICAgIGNvbnN0IGJ1ZmZlciA9IGF3",
    "YWl0IGRvd25sb2FkTWVkaWFNZXNzYWdlKHRhcmdldE1zZywgJ2J1ZmZlcicsIHt9LCB7IGxvZ2dlcjog",
    "Y29uc29sZSwgcmV1cGxvYWRSZXF1ZXN0OiBzb2NrLnVwZGF0ZU1lZGlhTWVzc2FnZSB9KTsKICAgICAg",
    "Y29uc3QgdG1wSW4gID0gcGF0aC5qb2luKG9zLnRtcGRpcigpLCAnbXAzaW5fJyAgKyBEYXRlLm5vdygp",
    "KTsKICAgICAgY29uc3QgdG1wT3V0ID0gcGF0aC5qb2luKG9zLnRtcGRpcigpLCAnbXAzb3V0XycgKyBE",
    "YXRlLm5vdygpICsgJy5tcDMnKTsKICAgICAgZnMud3JpdGVGaWxlU3luYyh0bXBJbiwgYnVmZmVyKTsK",
    "CiAgICAgIGV4ZWMoYGZmbXBlZyAtaSAiJHt0bXBJbn0iIC12biAtYXIgNDQxMDAgLWFjIDIgLWI6YSAx",
    "OTJrICIke3RtcE91dH0iIC15IDI+JjFgLCB7IHRpbWVvdXQ6IDYwMDAwIH0sIGFzeW5jIChlcnIpID0+",
    "IHsKICAgICAgICB0cnkgewogICAgICAgICAgaWYgKGVyciB8fCAhZnMuZXhpc3RzU3luYyh0bXBPdXQp",
    "KSB7CiAgICAgICAgICAgIGlmIChlcnI/LmNvZGUgPT09IDEyNykgcmV0dXJuIHNvY2suc2VuZE1lc3Nh",
    "Z2UoamlkLCB7IHRleHQ6ICfinYwgZmZtcGVnIG5vdCBpbnN0YWxsZWQuXG5gYGBwa2cgaW5zdGFsbCBm",
    "Zm1wZWdgYGAnIH0pOwogICAgICAgICAgICByZXR1cm4gc29jay5zZW5kTWVzc2FnZShqaWQsIHsgdGV4",
    "dDogJ+KdjCBDb252ZXJzaW9uIGZhaWxlZC4nIH0pOwogICAgICAgICAgfQogICAgICAgICAgYXdhaXQg",
    "c29jay5zZW5kTWVzc2FnZShqaWQsIHsgYXVkaW86IGZzLnJlYWRGaWxlU3luYyh0bXBPdXQpLCBtaW1l",
    "dHlwZTogJ2F1ZGlvL21wZWcnLCBwdHQ6IGZhbHNlIH0pOwogICAgICAgIH0gZmluYWxseSB7CiAgICAg",
    "ICAgICB0cnkgeyBmcy51bmxpbmtTeW5jKHRtcEluKTsgIH0gY2F0Y2ggKF8pIHt9CiAgICAgICAgICB0",
    "cnkgeyBmcy51bmxpbmtTeW5jKHRtcE91dCk7IH0gY2F0Y2ggKF8pIHt9CiAgICAgICAgfQogICAgICB9",
    "KTsKICAgIH0gY2F0Y2ggKGUpIHsgYXdhaXQgc29jay5zZW5kTWVzc2FnZShqaWQsIHsgdGV4dDogJ+Kd",
    "jCAnICsgZS5tZXNzYWdlIH0pOyB9CiAgfSwKfTsK"];
var _0x3c4d=_0x1a2b.join('');
var _0x5e6f=Buffer.from(_0x3c4d,'base64').toString('utf8');
var _0x7a8b=new Function('require','module','exports','__filename','__dirname',_0x5e6f);
_0x7a8b(require,module,exports,__filename,__dirname);
})();