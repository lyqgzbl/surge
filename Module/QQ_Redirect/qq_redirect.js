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

function shouldNotify() {
  if (typeof $argument === "undefined" || $argument === null || $argument === "") {
    return true;
  }
  if ($argument === "false" || $argument === false) {
    return false;
  }
  try {
    var arg = typeof $argument === "string" ? JSON.parse($argument) : $argument;
    if (typeof arg === "boolean") {
      return arg;
    }
    if (typeof arg === "object" && arg !== null && typeof arg.notify !== "undefined") {
      return arg.notify === true || arg.notify === "true";
    }
  } catch (e) {}
  return true;
}

if (targetUrl) {
  if (shouldNotify() && typeof $notification !== "undefined") {
    try {
      $notification.post(
        "QQ 链接已解锁",
        "点击在 Safari 中打开",
        targetUrl,
        {
          "action": "open-url",
          "url": targetUrl,
          "auto-dismiss": true,
          "sound": true,
        }
      );
    } catch (err) {
      console.log("QQ Redirect Notification Error: " + err);
    }
  }

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
