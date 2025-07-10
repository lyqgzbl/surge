/*
 * Surge Script: 強制觸發 Arcaea 新版網站的 CN APK 下載連結
 *
 * v6.0 更新日誌 (2025-07-10):
 * 1. 適應網站前端程式碼重構。
 * 2. 新的目標邏輯位於 "initialiseDownload" action 中。
 * 3. 採用直接替換策略，將複雜的條件判斷直接替換為目標 action "loadChinaApk"。
 */

try {
  if ($response && $response.body) {
    let body = $response.body;

    // 匹配新版程式碼中，從國家判斷到設備判斷的整段複雜邏輯
    // n&&["zh","zh-hant"].includes(s)&&(ch()?a("setIosCn"):a("loadChinaApk"))
    const complexLogicRegex = /n&&\["zh","zh-hant"\]\.includes\(s\)&&\s*\(ch\(\)\s*\?\s*\w\("setIosCn"\)\s*:\s*\w\("loadChinaApk"\)\)/;

    // 直接替換為我們想要的最終目標
    // 變數 a 是 dispatch 的縮寫，我們直接呼叫它
    const finalAction = 'a("loadChinaApk")';

    // 使用正規表示式 .test() 方法來檢查是否存在匹配
    if (complexLogicRegex.test(body)) {
      // 使用正規表示式進行替換
      body = body.replace(complexLogicRegex, finalAction);
      console.log("✅ [Arcaea Mod v6] 成功修改新版邏輯，強制觸發 APK 下載！");
      $done({ body });
    } else {
      console.log("ℹ️ [Arcaea Mod v6] 腳本執行完畢，但未找到需修改的程式碼。");
      $done({});
    }
  } else {
    console.log("⚠️ [Arcaea Mod v6] $response.body 為空，腳本略過執行。");
    $done({});
  }
} catch (error) {
  console.log(`❌ [Arcaea Mod v6] 腳本執行時發生嚴重錯誤: ${error}`);
  $done({});
}
