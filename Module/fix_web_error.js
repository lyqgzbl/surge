/*
 * Surge Script: 用於修正特定網頁的 JavaScript 錯誤 (穩健版)
 *
 * v2.0 更新日誌:
 * 1. 增加對 $response.body 的安全檢查，防止因 body 為空導致錯誤。
 * 2. 使用 try-catch 包裹核心邏輯，捕捉未知錯誤並印出日誌，防止腳本崩潰。
 * 3. 優化日誌輸出，方便排查問題。
 */

// 使用 try-catch 包裹所有程式碼，捕捉任何潛在的錯誤
try {
  // 安全檢查：確認 $response 和 $response.body 都存在
  if ($response && $response.body) {
    let body = $response.body;

    // 要尋找的錯誤程式碼片段
    const wrongCode = '(await Rg.getCountry()).catch(a => "JP")';
    // 要替換成的正確程式碼片段
    const correctCode = 'await Rg.getCountry().catch(a => "JP")';

    if (body.includes(wrongCode)) {
      body = body.replace(wrongCode, correctCode);
      console.log("✅ [fix_web_error.js] 成功修復 JS 錯誤！");
      $done({ body });
    } else {
      console.log("ℹ️ [fix_web_error.js] 腳本執行完畢，但未找到需修復的程式碼。");
      $done({});
    }
  } else {
    // 如果 $response.body 不存在，印出日誌並安全退出
    console.log("⚠️ [fix_web_error.js] $response.body 為空，腳本略過執行。");
    $done({});
  }
} catch (error) {
  // 如果 try 區塊中的任何程式碼出錯，捕捉錯誤並印出詳細資訊
  console.log(`❌ [fix_web_error.js] 腳本執行時發生嚴重錯誤: ${error}`);
  // 安全退出，不做任何修改
  $done({});
}
