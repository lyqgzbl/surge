var redirectRules = [
  /^https:\/\/c\.pc\.qq\.com\/middlem\.html\?pfurl=(http.*)(&pfuin=.*)/,
  /^https:\/\/c\.pc\.qq\.com\/middlect\.html\?pfuin=.*&pfurl=(http.*)(&gjsublevel=.*)/,
  /^https:\/\/c\.pc\.qq\.com\/middlect\.html\?iscontinue=.*pfurl=(http.*)(&pfuin=.*)/,
  /^https:\/\/pingtas\.qq\.com\/webview\/pingd\?dm=c\.pc\.qq\.com&pvi=\d+&si=s\d+&url=\/middlem\.html\?pfurl%3d(http.*)(%26pfuin%3d.*%26pfuin%3d.*)/,
  /^https:\/\/cgi\.connect\.qq\.com\/qqconnectopen\/get_urlinfoForQQV2\?url=(http.*)/,
  /^https:\/\/c\.pc\.qq\.com\/index\.html\?pfurl=(http.*)(&pfuin=.*)/,
  /^https:\/\/c\.pc\.qq\.com\/ios\.html\?url=(http.*)(&level=.*)/,
  /^https:\/\/pingtas\.qq\.com\/webview\/pingd\?dm=c\.pc\.qq\.com&pvi=\d+&si=s\d+&url=\/ios\.html\?url%3d(http.*)(%26level.*%26level.*)/,
];

var targetUrl = null;

for (var i = 0; i < redirectRules.length; i++) {
  var matched = $request.url.match(redirectRules[i]);
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
