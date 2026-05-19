function safeDecode(value) {
  var decoded = value;

  for (var i = 0; i < 3; i++) {
    try {
      var next = decodeURIComponent(decoded);
      if (next === decoded) {
        break;
      }
      decoded = next;
    } catch (e) {
      break;
    }
  }

  return decoded;
}

var decodedUrl = safeDecode($request.url);
var redirectRules = [
  /^https:\/\/c\.pc\.qq\.com\/middlem\.html\?pfurl=(https?:\/\/.*)(&pfuin=.*)/,
  /^https:\/\/c\.pc\.qq\.com\/middlect\.html\?pfuin=.*&pfurl=(https?:\/\/.*)(&gjsublevel=.*)/,
  /^https:\/\/c\.pc\.qq\.com\/middlect\.html\?iscontinue=.*pfurl=(https?:\/\/.*)(&pfuin=.*)/,
  /^https:\/\/pingtas\.qq\.com\/webview\/pingd\?dm=c\.pc\.qq\.com&pvi=\d+&si=s\d+&url=\/middlem\.html\?pfurl=(https?:\/\/.*)(&pfuin=.*&pfuin=.*)/,
  /^https:\/\/cgi\.connect\.qq\.com\/qqconnectopen\/get_urlinfoForQQV2\?url=(https?:\/\/.*)/,
  /^https:\/\/c\.pc\.qq\.com\/index\.html\?pfurl=(https?:\/\/.*)(&pfuin=.*)/,
  /^https:\/\/c\.pc\.qq\.com\/ios\.html\?url=(https?:\/\/.*)(&level=.*)/,
  /^https:\/\/pingtas\.qq\.com\/webview\/pingd\?dm=c\.pc\.qq\.com&pvi=\d+&si=s\d+&url=\/ios\.html\?url=(https?:\/\/.*)(&level.*&level.*)/,
];
var targetUrl = null;

for (var i = 0; i < redirectRules.length; i++) {
  var matched = decodedUrl.match(redirectRules[i]);
  if (matched) {
    targetUrl = matched[1];
    break;
  }
}

if (targetUrl) {
  $done({
    response: {
      status: 307,
      headers: {
        Location: targetUrl,
      },
    },
  });
} else {
  $done({});
}
