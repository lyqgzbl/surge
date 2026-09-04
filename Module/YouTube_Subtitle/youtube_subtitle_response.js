const LANG_NAMES = {
  "zh-Hans": "Simplified Chinese",
  "zh-CN": "Simplified Chinese",
  "zh-Hant": "Traditional Chinese",
  "zh-TW": "Traditional Chinese",
  "zh-HK": "Traditional Chinese (Cantonese)",
  zh: "Simplified Chinese",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
  fr: "French",
  de: "German",
  ru: "Russian",
  it: "Italian",
  pt: "Portuguese",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  ar: "Arabic",
  hi: "Hindi",
};

const TRANSLATION_LANGUAGES = [
  { languageCode: "zh-Hans", languageName: { simpleText: "中文（简体）", runs: [{ text: "中文（简体）" }] } },
  { languageCode: "zh-Hant", languageName: { simpleText: "中文（繁體）", runs: [{ text: "中文（繁体）" }] } },
  { languageCode: "en", languageName: { simpleText: "English - 英语", runs: [{ text: "English - 英语" }] } },
  { languageCode: "ja", languageName: { simpleText: "日本語 - 日语", runs: [{ text: "日本語 - 日语" }] } },
  { languageCode: "ko", languageName: { simpleText: "한국어 - 韩语", runs: [{ text: "한국어 - 韩语" }] } },
  { languageCode: "es", languageName: { simpleText: "Español - 西班牙语", runs: [{ text: "Español - 西班牙语" }] } },
  { languageCode: "fr", languageName: { simpleText: "Français - 法语", runs: [{ text: "Français - 法语" }] } },
  { languageCode: "de", languageName: { simpleText: "Deutsch - 德语", runs: [{ text: "Deutsch - 德语" }] } },
  { languageCode: "ru", languageName: { simpleText: "Русский - 俄语", runs: [{ text: "Русский - 俄语" }] } },
  { languageCode: "it", languageName: { simpleText: "Italiano - 意大利语", runs: [{ text: "Italiano - 意大利语" }] } },
  { languageCode: "pt", languageName: { simpleText: "Português - 葡萄牙语", runs: [{ text: "Português - 葡萄牙语" }] } },
  { languageCode: "vi", languageName: { simpleText: "Tiếng Việt - 越南语", runs: [{ text: "Tiếng Việt - 越南语" }] } },
  { languageCode: "th", languageName: { simpleText: "ไทย - 泰语", runs: [{ text: "ไทย - 泰语" }] } },
  { languageCode: "id", languageName: { simpleText: "Bahasa Indonesia - 印尼语", runs: [{ text: "Bahasa Indonesia - 印尼语" }] } },
  { languageCode: "ar", languageName: { simpleText: "العربية - 阿拉伯语", runs: [{ text: "العربية - 阿拉伯语" }] } },
  { languageCode: "hi", languageName: { simpleText: "हिन्दी - 印地语", runs: [{ text: "हिन्दी - 印地语" }] } },
  { languageCode: "tr", languageName: { simpleText: "Türkçe - 土耳其语", runs: [{ text: "Türkçe - 土耳其语" }] } },
  { languageCode: "nl", languageName: { simpleText: "Nederlands - 荷兰语", runs: [{ text: "Nederlands - 荷兰语" }] } },
  { languageCode: "pl", languageName: { simpleText: "Polski - 波兰语", runs: [{ text: "Polski - 波兰语" }] } },
  { languageCode: "uk", languageName: { simpleText: "Українська - 乌克兰语", runs: [{ text: "Українська - 乌克兰语" }] } },
];

(async () => {
  const url = new URL($request.url);
  const pathname = url.pathname;

  if (pathname.includes("/youtubei/v1/player")) {
    try {
      if ($response.body && typeof $response.body === "string") {
        let body = JSON.parse($response.body);
        if (body?.captions?.playerCaptionsTracklistRenderer) {
          enhanceCaptions(body.captions.playerCaptionsTracklistRenderer);
          $response.body = JSON.stringify(body);
        }
      }
    } catch (e) {
      console.log(`[YT_Sub_Resp] Enhance captions failed: ${e}`);
    }
    $done({ body: $response.body });
    return;
  }

  if (pathname.includes("/api/timedtext")) {
    const targetLang = url.searchParams.get("_ai_tlang") || url.searchParams.get("tlang");
    if (!targetLang) {
      $done({});
      return;
    }

    const config = getConfigs();
    if (!config.apiKey) {
      console.log("[YT_Sub_Resp] Error: api_key is not configured. Please provide api_key in module arguments or persistentStore.");
      $done({});
      return;
    }

    try {
      const rawBody = $response.body;
      if (!rawBody || typeof rawBody !== "string") {
        $done({});
        return;
      }

      const isJson = rawBody.trim().startsWith("{");
      let translatedBody = rawBody;

      if (isJson) {
        translatedBody = await processJsonSubtitles(rawBody, targetLang, config);
      } else {
        translatedBody = await processXmlSubtitles(rawBody, targetLang, config);
      }

      delete $response.headers?.["Content-Length"];
      delete $response.headers?.["content-length"];
      delete $response.headers?.["Content-Encoding"];
      delete $response.headers?.["content-encoding"];

      $done({
        status: $response.status || 200,
        headers: $response.headers,
        body: translatedBody,
      });
      return;
    } catch (e) {
      console.log(`[YT_Sub_Resp] Translation pipeline error: ${e?.message || e}`);
      $done({});
      return;
    }
  }

  $done({});
})();


function enhanceCaptions(tracklist) {
  if (Array.isArray(tracklist.captionTracks)) {
    tracklist.captionTracks = tracklist.captionTracks.map(caption => {
      caption.isTranslatable = true;
      return caption;
    });
  }

  if (Array.isArray(tracklist.audioTracks)) {
    tracklist.audioTracks = tracklist.audioTracks.map(audio => {
      audio.visibility = 2; // ON
      audio.hasDefaultTrack = true;
      audio.captionsInitialState = 3; // RECOMMENDED
      return audio;
    });
  }

  tracklist.translationLanguages = TRANSLATION_LANGUAGES;

  if (typeof tracklist.defaultCaptionTrackIndex !== "number") {
    tracklist.defaultCaptionTrackIndex = 0;
  }
}


async function processJsonSubtitles(rawJson, targetLang, config) {
  const json = JSON.parse(rawJson);
  if (!json.events || !Array.isArray(json.events)) return rawJson;

  const items = [];
  json.events.forEach((event, idx) => {
    if (!event.segs || !event.segs.length) return;
    const text = event.segs.map(s => s.utf8 || "").join("").trim();
    if (text && text !== "\n") {
      items.push({
        id: idx,
        text: text,
      });
    }
  });

  if (!items.length) return rawJson;

  const translationsMap = await batchTranslate(items, targetLang, config);

  for (const item of items) {
    const orig = item.text;
    const trans = translationsMap.get(item.id) || "";
    const combined = assembleText(orig, trans, config.layout);
    json.events[item.id].segs = [{ utf8: combined }];
  }

  return JSON.stringify(json);
}


async function processXmlSubtitles(rawXml, targetLang, config) {
  const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  const items = [];
  const matches = [];

  let match;
  let count = 0;
  while ((match = pRegex.exec(rawXml)) !== null) {
    const attrs = match[1];
    const rawContent = match[2];
    const pureText = decodeXml(rawContent.replace(/<[^>]+>/g, "")).trim();
    
    matches.push({
      id: count,
      fullMatch: match[0],
      attrs: attrs,
      origContent: pureText,
    });

    if (pureText && pureText !== "\n") {
      items.push({
        id: count,
        text: pureText,
      });
    }
    count++;
  }

  if (!items.length) return rawXml;

  const translationsMap = await batchTranslate(items, targetLang, config);

  let lastIndex = 0;
  let newXml = "";

  pRegex.lastIndex = 0;
  let mIdx = 0;
  while ((match = pRegex.exec(rawXml)) !== null) {
    newXml += rawXml.slice(lastIndex, match.index);
    const m = matches[mIdx++];
    const orig = m.origContent;
    const trans = translationsMap.get(m.id) || "";
    const combined = assembleText(orig, trans, config.layout);
    newXml += `<p${m.attrs}>${escapeXml(combined)}</p>`;
    lastIndex = pRegex.lastIndex;
  }
  newXml += rawXml.slice(lastIndex);

  return newXml;
}

function assembleText(orig, trans, layout) {
  if (!trans || trans === orig) return orig;
  switch (layout) {
    case "Reverse": // 上方译文 / 下方原文
      return `${trans}\n${orig}`;
    case "Only": // 仅译文
      return trans;
    case "Forward": // 上方原文 / 下方译文
    default:
      return `${orig}\n${trans}`;
  }
}


async function batchTranslate(items, targetLang, config) {
  const batchSize = config.batchSize || 60;
  const chunks = [];
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize));
  }

  const translationsMap = new Map();
  const targetLangName = LANG_NAMES[targetLang] || targetLang;

  const tasks = chunks.map((chunk, index) =>
    callOpenAICompletion(chunk, targetLangName, config)
      .then(res => {
        if (res && Array.isArray(res)) {
          for (const item of res) {
            if (typeof item.id !== "undefined" && typeof item.text === "string") {
              translationsMap.set(item.id, item.text.trim());
            }
          }
        }
      })
      .catch(err => {
        console.log(`[YT_Sub_Resp] Chunk ${index + 1}/${chunks.length} translate failed: ${err?.message || err}`);
      })
  );

  await Promise.all(tasks);
  return translationsMap;
}

async function callOpenAICompletion(lines, targetLangName, config) {
  const endpoint = config.apiBase.replace(/\/+$/, "").endsWith("/chat/completions")
    ? config.apiBase.replace(/\/+$/, "")
    : `${config.apiBase.replace(/\/+$/, "")}/chat/completions`;

  const systemPrompt =
    config.systemPrompt ||
    `You are a professional subtitle translator. Translate the given subtitle lines into ${targetLangName} accurately, idiomatically, and concisely. Keep the translations aligned 1-to-1 with input IDs. You MUST output ONLY a valid JSON object matching this schema: {"translations": [{"id": 0, "text": "..."}]}. Do not include markdown code block fences, and do not merge or drop any lines.`;

  const payload = {
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          target_language: targetLangName,
          lines: lines.map(l => ({ id: l.id, text: l.text })),
        }),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };

  if (endpoint.includes("generativelanguage.googleapis.com")) {
    headers["x-goog-api-key"] = config.apiKey;
  }

  const response = await httpRequest({
    url: endpoint,
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
    timeout: 30,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}: ${response.body}`);
  }

  let resData;
  try {
    resData = typeof response.body === "string" ? JSON.parse(response.body) : response.body;
  } catch (e) {
    throw new Error(`Parse API response error: ${e.message}`);
  }

  let content = resData?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`API returned no content: ${JSON.stringify(resData)}`);
  }

  content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(content);
  return parsed.translations || (Array.isArray(parsed) ? parsed : []);
}

function httpRequest(options) {
  return new Promise((resolve, reject) => {
    if (typeof $httpClient !== "undefined") {
      $httpClient.post(options, (err, resp, body) => {
        if (err) {
          reject(err);
        } else {
          resolve({ status: resp.status, headers: resp.headers, body });
        }
      });
    } else if (typeof fetch !== "undefined") {
      fetch(options.url, {
        method: options.method || "POST",
        headers: options.headers,
        body: options.body,
      })
        .then(async res => {
          resolve({
            status: res.status,
            headers: Object.fromEntries(res.headers.entries()),
            body: await res.text(),
          });
        })
        .catch(reject);
    } else {
      reject(new Error("No HTTP client available in this runtime"));
    }
  });
}


function decodeXml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x000A;/g, "\n");
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getConfigs() {
  const defaults = {
    apiKey: "",
    apiBase: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.1-flash-lite",
    layout: "Forward",
    batchSize: 60,
    systemPrompt: "",
  };

  let configs = { ...defaults };

  if (typeof $persistentStore !== "undefined") {
    const pKey = $persistentStore.read("YT_SUB_API_KEY");
    if (pKey) configs.apiKey = pKey;
    const pBase = $persistentStore.read("YT_SUB_API_BASE");
    if (pBase) configs.apiBase = pBase;
    const pModel = $persistentStore.read("YT_SUB_MODEL");
    if (pModel) configs.model = pModel;
  }

  let argStr = typeof $argument !== "undefined" ? $argument : "";
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
          if (key === "api_key" || key === "apiKey") configs.apiKey = val;
          else if (key === "api_base" || key === "apiBase") configs.apiBase = val;
          else if (key === "model") configs.model = val;
          else if (key === "layout") configs.layout = val;
          else if (key === "batch_size" || key === "batchSize") configs.batchSize = Number(val) || 60;
          else if (key === "system_prompt" || key === "systemPrompt") configs.systemPrompt = val;
        }
      }
    }
  }

  return configs;
}
