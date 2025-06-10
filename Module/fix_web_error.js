/*
 * Surge Script: 用於修正特定網頁的 JavaScript 錯誤 (正規表示式終極版)
 *
 * v3.0 更新日誌:
 * 1. 改用正規表示式進行匹配，解決因程式碼壓縮導致的空格不一致問題。
 * 2. 提升了腳本的健壯性和未來適用性。
 */

try {
  if ($response && $response.body) {
    let body = $response.body;

    // 錯誤程式碼的「正規表示式」
    // \s* 代表匹配零個或多個空格，可以適應 a=>"JP" 和 a => "JP" 等各種情況
    // 我們需要對原始程式碼中的特殊字元進行轉義，例如 ( ) .
    const wrongCodeRegex = /\(await Rg\.getCountry\(\)\)\.catch\(a\s*=>\s*"JP"\)/;

    // 正確的程式碼字串
    const correctCode = 'await Rg.getCountry().catch(a=>"JP")';

    // 使用正規表示式的 .test() 方法來檢查是否存在匹配
    if (wrongCodeRegex.test(body)) {
      // 使用正規表示式進行替換
      body = body.replace(wrongCodeRegex, correctCode);
      console.log("✅ [fix_web_error.js] 成功透過「正規表示式」修復 JS 錯誤！");
      $done({ body });
    } else {
      console.log("ℹ️ [fix_web_error.js] 腳本執行完畢，但未找到需修復的程式碼。");
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
