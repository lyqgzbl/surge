# Bilibili 空降助手 (SponsorBlock)

这是一个专用于 **Surge** 的哔哩哔哩空降助手独立模块。从 [Sparkle](https://github.com/kokoryh/Sparkle) 中抽取出 **纯净的 SponsorBlock / 空降助手** 功能，**不包含** 原版模块中的任何去广告、动态流过滤、置顶评论过滤或界面修改。

---

## ✨ 核心特性

- **纯粹专注**：仅保留空降助手（SponsorBlock）功能，无任何多余的去广告与界面篡改逻辑。
- **全版本适配**：
  - ✅ **最新版官方客户端**（支持 `viewunite.v1.View/ViewProgress` 新架构）
  - ✅ **iPad HD / 国际版 / 旧版客户端**（支持 `view.v1.View/ViewProgress`）
- **性能极佳**：
  - 仅精准拦截 `DmSegMobile` 与 `ViewProgress` 两个接口，无额外网络开销。
  - 请求阶段并发拉取 SponsorBlock 跳过片段与真实弹幕，降低首屏播放延迟。

---

## ⚙️ 参数配置

| 参数 | 可选值 / 格式 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| **空降助手** | `bilibili.airborne` / `#` | `bilibili.airborne` | 默认开启，配置为 `#` 时关闭 |
| **空降助手策略** | Surge 策略名 | `DIRECT` | 默认直连；若 `bsbsb.top` 连接不稳定可配置为代理策略 |
| **日志等级** | `1` / `2` / `3` / `4` / `5` | `4` | `1`: DEBUG; `2`: INFO; `3`: WARN; `4`: ERROR; `5`: OFF |

---

## 📦 安装地址

```text
https://raw.githubusercontent.com/lyqgzbl/surge/refs/heads/main/Module/Bilibili_Airborne/bilibili.sgmodule
```

---

## 🧬 原理说明

1. **响应阶段（Chronos 补丁注入）**：
   - 拦截 `ViewProgress` 接口，将播放器 `chronos` 替换为带有空降助手能力的播放器补丁（源自 `kokoryh/chronos`）。
2. **请求阶段（弹幕指令注入）**：
   - 拦截 `DmSegMobile` 弹幕段请求，向 `bsbsb.top` 查询当前视频/分P的 SponsorBlock 标记。
   - 当存在跳过片段（`skip` 且长度 $\ge$ 8 秒）时，将特殊空降指令弹幕（`airborne:${end}`）合并入分段弹幕列表中供 Chronos 播放器触发精准跳转。

---

## 鸣谢

- 上游项目：[Sparkle](https://github.com/kokoryh/Sparkle) by [@kokoryh](https://github.com/kokoryh)
- 跳过数据库：[bsbsb.top](https://bsbsb.top)
