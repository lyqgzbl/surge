/*
  Capture Kurobbs user_token from app requests and save it to persistentStore.
*/

const headers = $request.headers || {};
const cookie = headers.Cookie || headers.cookie || "";
const tokenHeader = headers.token || headers.Token || "";
const cookieToken = (cookie.match(/(?:^|;\s*)user_token=([^;]+)/) || [])[1];
const userToken = cookieToken || tokenHeader;

if (userToken) {
  const oldToken = $persistentStore.read("kuro_user_token");
  if (userToken !== oldToken) {
    $persistentStore.write(userToken, "kuro_user_token");
    $notification.post("库街区 Token 更新", "user_token 已更新", "", {
      "auto-dismiss": true,
      sound: false,
    });
  }
}

$done({});
