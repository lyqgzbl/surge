function getOptions() {
  const options = {
    cleanPendant: true,
    cleanFollowGuide: true,
    cleanShopping: true,
  };

  const argStr = typeof $argument !== "undefined" ? $argument : "";
  if (!argStr) return options;

  if (argStr.startsWith("{") && argStr.endsWith("}")) {
    try {
      const parsed = JSON.parse(argStr);
      if (typeof parsed.clean_pendant !== "undefined") options.cleanPendant = parsed.clean_pendant === true || parsed.clean_pendant === "true";
      if (typeof parsed.clean_follow_guide !== "undefined") options.cleanFollowGuide = parsed.clean_follow_guide === true || parsed.clean_follow_guide === "true";
      if (typeof parsed.clean_shopping !== "undefined") options.cleanShopping = parsed.clean_shopping === true || parsed.clean_shopping === "true";
    } catch (e) {}
    return options;
  }

  const pairs = argStr.split(/[,&]/);
  for (const pair of pairs) {
    const [k, ...v] = pair.split(/[=:]/);
    if (k && v.length) {
      const key = k.trim();
      const val = v.join("=").trim().toLowerCase();
      const boolVal = val === "true" || val === "1";
      if (key === "clean_pendant" || key === "cleanPendant") options.cleanPendant = boolVal;
      else if (key === "clean_follow_guide" || key === "cleanFollowGuide") options.cleanFollowGuide = boolVal;
      else if (key === "clean_shopping" || key === "cleanShopping") options.cleanShopping = boolVal;
    }
  }

  return options;
}

function processResponse() {
  const url = typeof $request !== "undefined" && $request.url ? $request.url : "";
  const rawBody = typeof $response !== "undefined" && $response.body ? $response.body : "";

  if (!url || !rawBody) {
    $done({});
    return;
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    $done({});
    return;
  }

  if (!body || typeof body !== "object") {
    $done({});
    return;
  }

  const opts = getOptions();

  // 1. 直播间核心配置：/xlive/app-room/v1/index/getInfoByRoom
  if (url.includes("/xlive/app-room/v1/index/getInfoByRoom")) {
    const data = body.data;
    if (data && typeof data === "object") {
      // 移除大卡片广告与游戏广告触发
      data.big_card_info = null;
      if (data.ad_livegame_info && typeof data.ad_livegame_info === "object") {
        data.ad_livegame_info.is_ad = 0;
        data.ad_livegame_info.hide_component = 1;
      }

      // 移除悬浮活动横幅与挂件
      if (opts.cleanPendant) {
        if (data.activity_banner_info && typeof data.activity_banner_info === "object") {
          const ab = data.activity_banner_info;
          ab.top = [];
          ab.bottom = [];
          ab.inputBanner = [];
          ab.pendant_banner = [];
          ab.normal_banner = [];
          ab.superBanner = null;
          ab.lol_activity = null;
          ab.gift_banner = null;
          if (ab.revenue_banner && typeof ab.revenue_banner === "object") ab.revenue_banner.list = [];
          if (ab.proactive_banner && typeof ab.proactive_banner === "object") ab.proactive_banner.list = [];
        }
        data.activity_score_info = null;
        data.cny_26_activity = null;
        data.cny_26_info = null;
        if (data.long_room_activity_info && typeof data.long_room_activity_info === "object") {
          data.long_room_activity_info.entry_info = null;
          data.long_room_activity_info.tab_jump_info = null;
        }
        if (data.game_drop_info && typeof data.game_drop_info === "object") {
          data.game_drop_info.has_drop = false;
        }
        // 移除礼物星球与心愿挂件
        if (data.progress_for_widget && typeof data.progress_for_widget === "object") {
          data.progress_for_widget.gift_star_process = null;
          data.progress_for_widget.gift_star_process_v2 = null;
          data.progress_for_widget.wish_process = null;
          data.progress_for_widget.star_knight = null;
        }
        data.gift_star = null;
      }

      // 移除强关注卡片与引导
      if (opts.cleanFollowGuide) {
        if (data.function_card && typeof data.function_card === "object") {
          data.function_card.follow_card = null;
          data.function_card.match_card = null;
          data.function_card.forecast_card = null;
          data.function_card.wish_list_card = null;
        }
        if (data.tip_card && typeof data.tip_card === "object") {
          data.tip_card.biz_id = 0;
          data.tip_card.extra = "";
        }
      }

      // 移除购物小黄车
      if (opts.cleanShopping) {
        if (data.shopping_info && typeof data.shopping_info === "object") {
          data.shopping_info.is_show = 0;
        }
      }
    }
  }

  // 2. 直播间用户信息与引导：/xlive/app-room/v1/index/getInfoByUser
  else if (url.includes("/xlive/app-room/v1/index/getInfoByUser")) {
    const data = body.data;
    if (data && typeof data === "object") {
      if (opts.cleanFollowGuide) {
        data.function_card = null;
        data.notice_card = null;
        data.popular_rank_guide_card = null;
        data.fans_club_poke_gift_notice = null;
        data.gift_popup_guide = null;
        if (data.follow && typeof data.follow === "object") {
          data.follow.breathing = 0;
        }
        if (data.ai_suggestion_dm && typeof data.ai_suggestion_dm === "object") {
          data.ai_suggestion_dm.status = 0;
        }
      }
      if (data.guard_shop_info && typeof data.guard_shop_info === "object") {
        data.guard_shop_info.pop_card = null;
      }
      if (data.notice && typeof data.notice === "object" && data.notice.banner_red_notice) {
        data.notice.banner_red_notice.revenue_banner = [];
      }
    }
  }

  // 3. 直播间活动挂件列表：/xlive/play-interface/widgetService/GetWidgetBannerList
  else if (url.includes("/xlive/play-interface/widgetService/GetWidgetBannerList")) {
    if (opts.cleanPendant && body.data && typeof body.data === "object") {
      body.data.list = {};
    }
  }

  // 4. 直播主页推荐信息流：/xlive/app-interface/v2/index/feed
  else if (url.includes("/xlive/app-interface/v2/index/feed")) {
    if (body.data && Array.isArray(body.data.card_list)) {
      body.data.card_list = body.data.card_list.filter((card) => {
        if (!card || typeof card !== "object") return true;
        const ctype = card.card_type || "";
        if (ctype.includes("banner")) return false;
        const cdata = card.card_data && card.card_data[ctype];
        if (cdata && typeof cdata === "object") {
          if (cdata.is_ad === true || cdata.show_ad_icon === true) return false;
        }
        return true;
      });
    }
  }

  // 5. 直播间上下滑动推荐：/xlive/app-interface/v2/room/recList
  else if (url.includes("/xlive/app-interface/v2/room/recList")) {
    if (body.data && Array.isArray(body.data.list)) {
      body.data.list = body.data.list.filter((item) => {
        if (!item || typeof item !== "object") return true;
        if (item.is_ad === true) return false;
        const ctype = String(item.card_type || "");
        if (ctype.includes("banner") || ctype.includes("ad")) return false;
        return true;
      });
    }
  }

  // 6. 直播间专属电商优惠券弹窗：/get_room_exclusive_coupon_info
  else if (url.includes("/get_room_exclusive_coupon_info")) {
    if (opts.cleanShopping && body.data && typeof body.data === "object") {
      body.data.coupon_show = 0;
      body.data.coupon_count = 0;
      body.data.coupon_ids = null;
      body.data.entry_standard_attr = null;
    }
  }

  $done({ body: JSON.stringify(body) });
}

processResponse();
