/*
 * Surge Script: 用於修正特定網頁的 JavaScript 錯誤
 * 錯誤程式碼: const e = (await Rg.getCountry()).catch(a => "JP")
 * 正確程式碼: const e = await Rg.getCountry().catch(a => "JP")
 */

// 取得回應的主體 (response body)
let body = $response.body;

// 要尋找的錯誤程式碼片段
// 為了精準匹配，我們多包含一些上下文
// 注意：(await Rg.getCountry()) 前後的空格和逗號需要和原始腳本一致
const wrongCode = '(await Rg.getCountry()).catch(a => "JP")';

// 要替換成的正確程式碼片段
const correctCode = 'await Rg.getCountry().catch(a => "JP")';

// 檢查回應內容中是否包含錯誤的程式碼
if (body.includes(wrongCode)) {
  // 如果找到，就執行替換
  body = body.replace(wrongCode, correctCode);
  console.log("成功修復網頁 JS 錯誤！");
  
  // 完成腳本，回傳修改後的主體
  $done({body});
} else {
  // 如果沒找到，不做任何修改，直接回傳原始主體
  console.log("未在腳本中找到目標錯誤程式碼，無需修復。");
  $done({});
}
