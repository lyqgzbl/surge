/*
 * Surge Script: 強制觸發 Arcaea 網頁的 CN APK 下載連結 (終極版)
 *
 * v5.0 更新日誌:
 * 1. 強制將國家偽裝成 "CN"。
 * 2. 強制將設備類型偽裝成 "非蘋果設備" (t=false)。
 * 3. 確保 e==="CN" && !t 條件永遠成立，以觸發 loadChinaApk。
 */

try {
  if ($response && $response.body) {
    let body = $response.body;
    let modified = false;

    // --- 規則一：偽裝國家為 "CN" ---
    const countryRegex = /\(await Rg\.getCountry\(\)\)\.catch\(a\s*=>\s*"JP"\)/;
    const countryReplace = '"CN"'; // 強制設定國家為 CN

    if (countryRegex.test(body)) {
      body = body.replace(countryRegex, countryReplace);
      modified = true;
      console.log("✅ [Arcaea Mod] 步驟一：成功偽裝國家為 CN。");
    }

    // --- 規則二：偽裝設備為「非蘋果設備」---
    // 這個正規表示式匹配從 ",t=" 開始，到設備判斷結束的整段程式碼
    const deviceRegex = /,t=\[.*?\]\.includes\(navigator\.platform\)\|\|navigator\.userAgent\.includes\("Mac"\)&&"ontouchend"in document/;
    const deviceReplace = ',t=false'; // 強制設定 t 為 false

    if (deviceRegex.test(body)) {
      body = body.replace(deviceRegex, deviceReplace);
      modified = true;
      console.log("✅ [Arcaea Mod] 步驟二：成功偽裝設備為非蘋果設備。");
    }

    if (modified) {
      $done({ body });
    } else {
      console.log("ℹ️ [Arcaea Mod] 腳本執行完畢，但未找到需修改的程式碼。");
      $done({});
    }

  } else {
    console.log("⚠️ [Arcaea Mod] $response.body 為空，腳本略過執行。");
    $done({});
  }
} catch (error) {
  console.log(`❌ [Arcaea Mod] 腳本執行時發生嚴重錯誤: ${error}`);
  $done({});
}
