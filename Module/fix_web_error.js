/*
 * Surge Script: 用於修正 Arcaea 網頁 JS 錯誤並移除系統限制 (終極版)
 *
 * v4.0 更新日誌:
 * 1. 修改替換邏輯，直接將國家獲取函式替換為固定值 "JP"。
 * 2. 此修改可以從根本上繞過基於國家地區 (e.g., "CN") 的判斷限制。
 */

try {
  if ($response && $response.body) {
    let body = $response.body;

    // 匹配獲取國家/地區的那段程式碼
    const wrongCodeRegex = /\(await Rg\.getCountry\(\)\)\.catch\(a\s*=>\s*"JP"\)/;

    // 將其直接替換為一個固定的字串 "JP"
    // 這樣變數 e 的值就永遠是 "JP"，後續的 e === "CN" 判斷便不會成立
    const correctCode = '"JP"';

    // 使用正規表示式的 .test() 方法來檢查是否存在匹配
    if (wrongCodeRegex.test(body)) {
      // 使用正規表示式進行替換
      body = body.replace(wrongCodeRegex, correctCode);
      console.log("✅ [fix_web_error.js] 成功繞過系統限制！");
      $done({ body });
    } else {
      console.log("ℹ️ [fix_web_error.js] 腳本執行完畢，但未找到需修改的程式碼。");
      $done({});
    }
  } else {
    console.log("⚠️ [fix_web_error.js] $response.body 為空，腳本略過執行。");
    $done({});
  }
} catch (error) {
  console.log(`❌ [fix_web_error.js] 腳本執行時發生嚴重錯誤: ${error}`);
  $done({});
}
