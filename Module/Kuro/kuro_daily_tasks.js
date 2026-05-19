/*
  Kurobbs daily gold tasks for Surge.
  Tasks: community sign-in, view 3 posts, like 5 posts, share 1 post.
*/

const API_HOST = "https://api.kurobbs.com";
const WUWA_GAME_ID = "3";
const WUWA_FORUM_ID = "9";
const token = $persistentStore.read("kuro_user_token");

if (!token) {
  notify("库街区每日任务失败", "未找到 user_token", "请先打开库街区 App 触发抓取");
  $done({});
} else {
  run();
}

async function run() {
  const messages = [];

  try {
    const userId = await getUserId();
    const before = await getTaskProcess(userId);
    const initialGold = getDailyGold(before);

    if (isDailyGoldFull(before)) {
      notify("库街区每日任务", "今日库洛币已拿满：" + initialGold, await totalGoldText());
      $done({});
      return;
    }

    const tasks = Array.isArray(before.data && before.data.dailyTask) ? before.data.dailyTask : [];
    for (const task of tasks) {
      if (isTaskDone(task)) continue;

      const remark = task.remark || "未知任务";
      if (remark === "用户签到") {
        messages.push(await captureResult(communitySignIn, remark));
      } else if (remark === "浏览3篇帖子") {
        messages.push(await captureResult(() => viewPosts(needCount(task, 3)), remark));
      } else if (remark === "点赞5次") {
        messages.push(await captureResult(() => likePosts(needCount(task, 5)), remark));
      } else if (remark === "分享1次帖子") {
        messages.push(await captureResult(sharePost, remark));
      }

      await sleep(800);
    }

    const after = await getTaskProcess(userId);
    const finalGold = getDailyGold(after);
    const summary = "今日库洛币：" + finalGold + "/" + ((after.data && after.data.maxDailyGold) || "?");
    const total = await totalGoldText();
    notify("库街区每日任务完成", [summary].concat(messages.filter(Boolean)).join("\n"), total);
  } catch (error) {
    console.log("[Kurobbs] 每日任务失败: " + stringifyError(error));
    notify("库街区每日任务失败", error.message || "未知错误", "");
  } finally {
    $done({});
  }
}

async function getUserId() {
  const mine = await postForm("/user/mineV2", "type=1", appHeaders(true));
  if (isSuccess(mine) && mine.data && mine.data.mine && mine.data.mine.userId) {
    return mine.data.mine.userId;
  }
  const tokenUserId = decodeTokenUserId(token);
  if (tokenUserId) return tokenUserId;
  throw apiError("获取用户信息", mine);
}

async function getTaskProcess(userId) {
  const body = userId ? formEncode({ gameId: 0, userId }) : "gameId=0";
  const json = await postForm("/encourage/level/getTaskProcess", body, appHeaders());
  if (!isSuccess(json)) throw apiError("获取任务进度", json);
  return json;
}

async function communitySignIn() {
  let json = await postForm("/user/signIn", "gameId=" + WUWA_GAME_ID, appHeaders());
  if (json && json.msg === "参数错误") {
    json = await postForm("/user/signIn", "gameId=2", appHeaders());
  }
  if (isSuccess(json)) return "签到成功";
  if (json.code === 1511) return "今日已签到";
  throw apiError("用户签到", json);
}

async function viewPosts(count) {
  const posts = await getForumPosts(Math.max(count, 3));
  let done = 0;
  for (const post of posts) {
    if (done >= count) break;
    const json = await postForm(
      "/forum/getPostDetail",
      formEncode({ isOnlyPublisher: 0, postId: post.postId, showOrderType: 2 }),
      appHeaders()
    );
    if (isSuccess(json)) done += 1;
    await sleep(700);
  }
  return "已浏览 " + done + "/" + count + " 篇";
}

async function likePosts(count) {
  const posts = await getForumPosts(Math.max(count + 5, 10));
  let done = 0;

  for (const post of posts) {
    if (done >= count) break;
    if (String(post.isLike) === "1" || String(post.isPublisher) === "1") continue;

    const json = await postForm(
      "/forum/like",
      formEncode({
        forumId: post.gameForumId || WUWA_FORUM_ID,
        gameId: WUWA_GAME_ID,
        likeType: 1,
        operateType: 1,
        postCommentId: 0,
        postCommentReplyId: 0,
        postId: post.postId,
        postType: post.postType || 1,
        toUserId: post.userId,
      }),
      appHeaders()
    );
    if (isSuccess(json)) done += 1;
    await sleep(700);
  }

  return "已点赞 " + done + "/" + count + " 次";
}

async function sharePost() {
  const json = await postForm("/encourage/level/shareTask", "gameId=" + WUWA_GAME_ID, appHeaders());
  if (isSuccess(json)) return "分享成功";
  throw apiError("分享帖子", json);
}

async function getForumPosts(pageSize) {
  const json = await postForm(
    "/forum/list",
    formEncode({
      forumId: WUWA_FORUM_ID,
      gameId: WUWA_GAME_ID,
      pageIndex: 1,
      pageSize,
      searchType: 3,
      timeType: 0,
      topicId: 0,
    }),
    appHeaders()
  );

  if (!isSuccess(json)) throw apiError("获取帖子列表", json);
  return (json.data && Array.isArray(json.data.postList)) ? json.data.postList : [];
}

async function totalGoldText() {
  try {
    const json = await postForm("/encourage/gold/getTotalGold", "", appHeaders(true));
    if (isSuccess(json) && json.data && typeof json.data.goldNum !== "undefined") {
      return "库洛币余额：" + json.data.goldNum;
    }
  } catch (error) {
    console.log("[Kurobbs] 获取库洛币余额失败: " + stringifyError(error));
  }
  return "";
}

async function captureResult(task, name) {
  try {
    return name + "：" + await task();
  } catch (error) {
    console.log("[Kurobbs] " + name + "失败: " + stringifyError(error));
    return name + "失败：" + (error.message || "未知错误");
  }
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

function isSuccess(json) {
  return json && json.code === 200 && json.success === true;
}

function isTaskDone(task) {
  return Number(task.process) >= 1 || Number(task.completeTimes) >= Number(task.needActionTimes || 1);
}

function needCount(task, fallback) {
  const need = Number(task.needActionTimes || fallback);
  const complete = Number(task.completeTimes || 0);
  return Math.max(need - complete, 0) || fallback;
}

function isDailyGoldFull(json) {
  const data = json && json.data;
  return data && Number(data.currentDailyGold) >= Number(data.maxDailyGold || 80);
}

function getDailyGold(json) {
  const data = json && json.data;
  return data ? Number(data.currentDailyGold || 0) : 0;
}

function apiError(action, json) {
  if (json && json.code === 220) {
    return new Error(action + "失败: user_token 已失效，请重新打开库街区 App 抓取");
  }
  return new Error(action + "失败: " + (json && json.msg ? json.msg : JSON.stringify(json)));
}

function formEncode(data) {
  return Object.keys(data)
    .filter((key) => typeof data[key] !== "undefined" && data[key] !== null)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
}

function decodeTokenUserId(jwt) {
  try {
    const payload = jwt.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse($utils.b64decode(normalized));
    return decoded.userId || decoded.uid || "";
  } catch (_) {
    return "";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
