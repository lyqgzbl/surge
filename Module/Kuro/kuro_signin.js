/*
  Kurobbs daily sign-in for Surge.
  - Community sign-in: POST /user/signIn
  - Wuthering Waves game reward sign-in: POST /encourage/signIn/v2
*/

const API_HOST = "https://api.kurobbs.com";
const WUWA_GAME_ID = "3";
const WUWA_SERVER_ID = "76402e5b20be2c39f095a152090afddc";
const WEBVIEW_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) KuroGameBox/2.2.0";
const token = $persistentStore.read("kuro_user_token");

if (!token) {
  notify("库街区签到失败", "未找到 user_token", "请先打开库街区 App 触发抓取");
  $done({});
} else {
  run();
}

async function run() {
  const messages = [];

  try {
    messages.push(await captureResult(communitySignIn, "社区签到"));
    messages.push(await captureResult(wuwaGameSignIn, "鸣潮奖励签到"));
    notify("库街区签到完成", messages.filter(Boolean).join("\n"), "");
  } catch (error) {
    console.log("[Kurobbs] 签到失败: " + stringifyError(error));
    notify("库街区签到失败", error.message || "未知错误", "");
  } finally {
    $done({});
  }
}

async function communitySignIn() {
  let json = await postForm("/user/signIn", "gameId=" + WUWA_GAME_ID, appHeaders());

  // The community sign-in API signs the account once regardless of gameId, but
  // some server versions reject gameId=3 with "参数错误". Keep 2 as a fallback.
  if (json && json.msg === "参数错误") {
    json = await postForm("/user/signIn", "gameId=2", appHeaders());
  }

  if (isSuccess(json)) {
    const day = json.data && json.data.continueDays ? json.data.continueDays : "?";
    const gain = json.data && json.data.gainVoList && json.data.gainVoList[0]
      ? json.data.gainVoList[0].gainValue
      : "?";
    return "社区签到成功：连续 " + day + " 天，库洛币 +" + gain;
  }

  if (json.code === 1511) return "社区签到：今日已签到";
  throw apiError("社区签到", json);
}

async function captureResult(task, name) {
  try {
    return await task();
  } catch (error) {
    console.log("[Kurobbs] " + name + "失败: " + stringifyError(error));
    return name + "失败：" + (error.message || "未知错误");
  }
}

async function wuwaGameSignIn() {
  const roleJson = await postForm("/user/role/findRoleList", "gameId=" + WUWA_GAME_ID, appHeaders(true));
  if (!isSuccess(roleJson)) throw apiError("获取鸣潮角色", roleJson);

  const roles = Array.isArray(roleJson.data) ? roleJson.data : [];
  const role = roles.find((item) => String(item.gameId) === WUWA_GAME_ID && item.isDefault) ||
    roles.find((item) => String(item.gameId) === WUWA_GAME_ID);

  if (!role) return "鸣潮奖励签到：未找到绑定角色";

  const reqMonth = pad2(new Date().getMonth() + 1);
  const body = gameSignBody(role, reqMonth);
  const initJson = await postForm("/encourage/signIn/initSignInV2", gameSignBody(role), gameHeaders());

  if (isSuccess(initJson) && initJson.data && initJson.data.isSigIn === true) {
    return "鸣潮奖励签到：今日已签到（" + formatRole(role) + "）";
  }
  if (!isSuccess(initJson)) {
    throw apiError("获取鸣潮签到状态", initJson);
  }

  const signJson = await postForm("/encourage/signIn/v2", body, gameHeaders());

  if (isSuccess(signJson)) {
    return "鸣潮奖励签到成功：" + formatRole(role) + formatGameReward(signJson);
  }

  if (signJson.code === 1511) return "鸣潮奖励签到：今日已签到（" + formatRole(role) + "）";
  throw apiError("鸣潮奖励签到", signJson);
}

function gameSignBody(role, reqMonth) {
  const data = {
    gameId: WUWA_GAME_ID,
    serverId: role.serverId || WUWA_SERVER_ID,
    roleId: role.roleId,
    userId: role.userId,
  };
  if (reqMonth) {
    data.reqMonth = reqMonth;
  }
  return formEncode(data);
}

function postForm(path, body, headers) {
  return new Promise((resolve, reject) => {
    $httpClient.post(
      {
        url: API_HOST + path,
        headers,
        body,
        timeout: 15,
        "auto-cookie": false,
      },
      (error, response, data) => {
        if (error) {
          reject(new Error("请求失败: " + stringifyError(error)));
          return;
        }
        if (!response || response.status < 200 || response.status >= 300) {
          reject(new Error("HTTP " + (response ? response.status : "未知状态")));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("响应解析失败: " + stringifyError(e)));
        }
      }
    );
  });
}

function appHeaders(withCharset) {
  return {
    osVersion: "Android",
    devCode: "2fba3859fe9bfe9099f2696b8648c2c6",
    distinct_id: "765485e7-30ce-4496-9a9c-a2ac1c03c02c",
    countryCode: "CN",
    ip: "10.0.2.233",
    model: "2211133C",
    source: "android",
    lang: "zh-Hans",
    version: "1.0.9",
    versionCode: "1090",
    token,
    Cookie: "user_token=" + token,
    "Content-Type": withCharset
      ? "application/x-www-form-urlencoded; charset=utf-8"
      : "application/x-www-form-urlencoded",
    "Accept-Encoding": "gzip",
    "User-Agent": "okhttp/3.10.0",
    Host: "api.kurobbs.com",
  };
}

function gameHeaders() {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh-Hans;q=0.9",
    Connection: "keep-alive",
    Host: "api.kurobbs.com",
    Origin: "https://web-static.kurobbs.com",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": WEBVIEW_UA,
    "Content-Type": "application/x-www-form-urlencoded",
    devCode: "10.0.2.233, " + WEBVIEW_UA,
    source: "android",
    token,
  };
}

function isSuccess(json) {
  return json && json.code === 200 && json.success === true;
}

function apiError(action, json) {
  if (json && json.code === 220) {
    return new Error(action + "失败: user_token 已失效，请重新打开库街区 App 抓取");
  }
  return new Error(action + "失败: " + (json && json.msg ? json.msg : JSON.stringify(json)));
}

function formEncode(data) {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
}

function formatRole(role) {
  const name = role.roleName || role.roleId || "未知角色";
  const server = role.serverName || "未知服务器";
  return name + " / " + server;
}

function formatGameReward(json) {
  const today = json && json.data && json.data.todayList;
  if (today && today.goodsName) {
    return "，获得 " + today.goodsName + " x" + today.goodsNum;
  }
  return "";
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function notify(title, subtitle, body) {
  $notification.post(title, subtitle || "", body || "", {
    "auto-dismiss": true,
  });
}

function stringifyError(error) {
  if (typeof error === "string") return error;
  if (error && error.message) return error.message;
  try {
    return JSON.stringify(error);
  } catch (_) {
    return String(error);
  }
}
