(function () {
  const url = new URL($request.url);
  const pathname = url.pathname;

  if (pathname.includes("/youtubei/v1/player")) {
    try {
      if ($request.body && typeof $request.body === "string") {
        const body = JSON.parse($request.body);
        if (body?.playbackContext?.contentPlaybackContext) {
          body.playbackContext.contentPlaybackContext.autoCaptionsDefaultOn = true;
          $request.body = JSON.stringify(body);
        }
      }
    } catch (e) {
      console.log(`[YT_Sub_Req] Player body parse error: ${e}`);
    }
    $done({ body: $request.body });
    return;
  }

  if (pathname.includes("/api/timedtext")) {
    const config = getConfigs();
    const v = url.searchParams.get("v");
    const lang = url.searchParams.get("lang") || "";
    const tlang = url.searchParams.get("tlang") || "";

    let targetLang = "";
    if (tlang) {
      targetLang = tlang;
    } else if (config.autoTranslate) {
      const isTarget = lang.toLowerCase() === config.targetLang.toLowerCase() ||
        lang.toLowerCase().startsWith(config.targetLang.toLowerCase().split("-")[0]);
      if (!isTarget) {
        targetLang = config.targetLang;
      }
    }

    if (targetLang) {
      url.searchParams.delete("tlang");
      url.searchParams.set("_ai_tlang", targetLang);
      
      if (typeof $persistentStore !== "undefined") {
        $persistentStore.write(targetLang, "YT_SUB_LAST_TLANG");
      }
    }

    $done({ url: url.toString() });
    return;
  }

  $done({});
})();


function getConfigs() {
  const defaults = {
    autoTranslate: true,
    targetLang: "zh-Hans",
  };

  let argStr = typeof $argument !== "undefined" ? $argument : "";
  let configs = { ...defaults };

  if (argStr) {
    if (argStr.startsWith("{") && argStr.endsWith("}")) {
      try {
        Object.assign(configs, JSON.parse(argStr));
      } catch (e) {}
    } else {
      const pairs = argStr.split(/[,&]/);
      for (const pair of pairs) {
        const [k, ...v] = pair.split(/[=:]/);
        if (k && v.length) {
          const key = k.trim();
          const val = v.join("=").trim();
          if (key === "auto_translate" || key === "autoTranslate") {
            configs.autoTranslate = val === "true" || val === "1";
          } else if (key === "target_lang" || key === "targetLang") {
            configs.targetLang = val;
          }
        }
      }
    }
  }

  return configs;
}
