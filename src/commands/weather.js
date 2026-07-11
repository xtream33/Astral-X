(function(){
var _0x1a2b=["J3VzZSBzdHJpY3QnOwpjb25zdCB7IGJveCB9ID0gcmVxdWlyZSgnLi4vdXRpbHMvZm9ybWF0Jyk7Cm1v",
    "ZHVsZS5leHBvcnRzID0gewogIG5hbWU6ICd3ZWF0aGVyJywgYWxpYXNlczogWyd3JywgJ2ZvcmVjYXN0",
    "JywgJ3RlbXAnLCAnY2xpbWF0ZSddLAogIGNhdGVnb3J5OiAndXRpbGl0eScsIGRlc2NyaXB0aW9uOiAn",
    "Q3VycmVudCB3ZWF0aGVyLiBVc2FnZTogLndlYXRoZXIgPGNpdHk+JywKICBleGVjdXRlOiBhc3luYyAo",
    "c29jaywgbXNnLCBhcmdzKSA9PiB7CiAgICBjb25zdCBqaWQgID0gbXNnLmtleS5yZW1vdGVKaWQ7CiAg",
    "ICBjb25zdCBjaXR5ID0gYXJncy5qb2luKCcgJykudHJpbSgpOwogICAgaWYgKCFjaXR5KSByZXR1cm4g",
    "c29jay5zZW5kTWVzc2FnZShqaWQsIHsgdGV4dDogYm94KCfwn4yk77iPICpXRUFUSEVSKicsICfwn5OM",
    "ICpVc2FnZToqIC53ZWF0aGVyIDxjaXR5PlxuXG7wn5KhICpFeGFtcGxlczoqXG4ud2VhdGhlciBLYW1w",
    "YWxhXG4ud2VhdGhlciBMb25kb25cbi53ZWF0aGVyIE5ldyBZb3JrJykgfSk7CiAgICBhd2FpdCBzb2Nr",
    "LnNlbmRNZXNzYWdlKGppZCwgeyB0ZXh0OiBib3goJ/CfjKTvuI8gKldFQVRIRVIqJywgJ19GZXRjaGlu",
    "ZyB3ZWF0aGVyIGZvciAqJyArIGNpdHkgKyAnKi4uLl8nKSB9KTsKICAgIHRyeSB7CiAgICAgIGNvbnN0",
    "IHJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL3d0dHIuaW4vJyArIGVuY29kZVVSSUNvbXBvbmVudChj",
    "aXR5KSArICc/Zm9ybWF0PWoxJywgeyBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoMTAwMDApIH0p",
    "OwogICAgICBpZiAoIXJlcy5vaykgcmV0dXJuOyAvLyBzaWxlbnQgb24gY2l0eSBub3QgZm91bmQKICAg",
    "ICAgY29uc3QgZCA9IGF3YWl0IHJlcy5qc29uKCk7CiAgICAgIGNvbnN0IGMgPSBkLmN1cnJlbnRfY29u",
    "ZGl0aW9uPy5bMF0sIGEgPSBkLm5lYXJlc3RfYXJlYT8uWzBdOwogICAgICBpZiAoIWMgfHwgIWEpIHJl",
    "dHVybjsgLy8gc2lsZW50CiAgICAgIGNvbnN0IG5hbWUgPSBhLmFyZWFOYW1lPy5bMF0/LnZhbHVlICsg",
    "JywgJyArIGEuY291bnRyeT8uWzBdPy52YWx1ZTsKICAgICAgY29uc3QgZGVzYyA9IGMud2VhdGhlckRl",
    "c2M/LlswXT8udmFsdWUgfHwgJyc7CiAgICAgIGNvbnN0IGZlZWwgPSBwYXJzZUludChjLkZlZWxzTGlr",
    "ZUMpOwogICAgICBjb25zdCBmZWVsVHh0ID0gZmVlbCA8IDEwID8gJ/CfpbYgVmVyeSBDb2xkJyA6IGZl",
    "ZWwgPCAyMCA/ICfwn5iQIENvb2wnIDogZmVlbCA8IDI4ID8gJ/CfmIogQ29tZm9ydGFibGUnIDogZmVl",
    "bCA8IDM1ID8gJ/CfmJMgV2FybScgOiAn8J+UpSBIb3QnOwogICAgICBhd2FpdCBzb2NrLnNlbmRNZXNz",
    "YWdlKGppZCwgeyB0ZXh0OiBib3goJ/CfjKTvuI8gKldFQVRIRVIg4oCUICcgKyBuYW1lLnRvVXBwZXJD",
    "YXNlKCkgKyAnKicsICfwn4yh77iPICpUZW1wOiogICAgICAnICsgYy50ZW1wX0MgKyAnwrBDIC8gJyAr",
    "IGMudGVtcF9GICsgJ8KwRlxu8J+klCAqRmVlbHM6KiAgICAgJyArIGMuRmVlbHNMaWtlQyArICfCsEMg",
    "JyArIGZlZWxUeHQgKyAnXG7wn5KnICpIdW1pZGl0eToqICAnICsgYy5odW1pZGl0eSArICclXG7wn5Ko",
    "ICpXaW5kOiogICAgICAnICsgYy53aW5kc3BlZWRLbXBoICsgJyBrbS9oXG7imIHvuI8gKlNreToqICAg",
    "ICAgICcgKyBkZXNjICsgJ1xu8J+Rge+4jyAqVmlzaWJpbGl0eToqICcgKyBjLnZpc2liaWxpdHkgKyAn",
    "IGttXG7imIHvuI8gKkNsb3VkOiogICAgICcgKyBjLmNsb3VkY292ZXIgKyAnJScpIH0sIHsgcXVvdGVk",
    "OiBtc2cgfSk7CiAgICB9IGNhdGNoIChfKSB7IC8qIHNpbGVudCAqLyB9CiAgfSwKfTsK"];
var _0x3c4d=_0x1a2b.join('');
var _0x5e6f=Buffer.from(_0x3c4d,'base64').toString('utf8');
var _0x7a8b=new Function('require','module','exports','__filename','__dirname',_0x5e6f);
_0x7a8b(require,module,exports,__filename,__dirname);
})();