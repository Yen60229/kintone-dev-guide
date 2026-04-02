# kintone 開發資源速查手冊（日文版獨有內容）

> 來源：https://cybozu.dev/ja/kintone/  
> 整理日期：2026-03-25  
> 說明：以下為日文版 cybozu.dev 才有的開發資源，所有標題已翻譯為繁體中文

---

## 目錄

- [1. 入門指南](#1-入門指南)
- [2. 開發 Tips — 自訂開發範例](#2-開發-tips--自訂開發範例)
  - [2.1 自訂 Tips](#21-自訂-tips)
  - [2.2 自訂開發的實用知識](#22-自訂開發的實用知識)
  - [2.3 外部服務整合 Tips](#23-外部服務整合-tips)
  - [2.4 外掛程式 Tips](#24-外掛程式-tips)
- [3. 建構營運 Tips](#3-建構營運-tips)
- [4. AI](#4-ai)
- [5. 教程](#5-教程)
- [6. 其他資源](#6-其他資源)

---

## 1. 入門指南

| 標題 | 說明 | URL |
|------|------|-----|
| 什麼是 kintone 自訂 | kintone 自訂的概要說明 | [連結](https://cybozu.dev/ja/kintone/getting-started/what-is-kintone-customize/) |
| 快速入門 | 4 步驟入門：JS API 的 UI 自訂 + REST API 資料取得 | [連結](https://cybozu.dev/ja/kintone/getting-started/quickstart/) |
| kintone 作為開發平台 | kintone 作為開發平台的特性與定位 | [連結](https://cybozu.dev/ja/kintone/getting-started/development-platform/) |
| kintone 自訂能做到的事 | 自訂的優勢與具體應用範例 | [連結](https://cybozu.dev/ja/kintone/getting-started/kintone-customization-capabilities/) |
| kintone 外部連攜自訂能做到的事 | 與外部服務整合的自訂範例 | [連結](https://cybozu.dev/ja/kintone/getting-started/kintone-integration-customization-capabilities/) |
| 開發前常見問題 | 開發前的 FAQ | [連結](https://cybozu.dev/ja/kintone/getting-started/kintone-frequently-asked-questions/) |

---

## 2. 開發 Tips — 自訂開發範例

入口頁面：[開發 Tips 首頁](https://cybozu.dev/ja/kintone/tips/development/)

### 2.1 自訂 Tips

包含輸入控制、子表格、流程管理等大量實戰 Sample Code。

| 分類 | 說明 | URL |
|------|------|-----|
| 開發 Know-How | 自訂開發的實務經驗與最佳實踐 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/development-know-how/) |
| 輸入控制 / 輸入輔助 | 表單欄位的輸入驗證、自動補完、條件控制等 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/validation-and-assistance/) |
| 日期與時間操作 | 日期欄位格式化、計算、比較等 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/date-format/) |
| 子表格 | 子表格的新增列、計算、驗證等自訂 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/table/) |
| 關聯記錄 | 關聯記錄欄位的自訂操作 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/related-records/) |
| 記錄新增與更新 | 記錄 CRUD 操作相關的自訂範例 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/update-records/) |
| 清單畫面自訂 | 記錄清單頁面的 UI 改造範例 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/record-list-customize/) |
| 流程管理 | 狀態遷移、執行者、動作按鈕等自訂 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/process-management/) |
| 空間 / 訪客空間 | 空間入口頁面、成員管理等自訂 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/space/) |
| 檔案操作 | 上傳、下載、檔案欄位操作等 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/file/) |
| 訊息顯示 / 圖示裝飾 | 自訂訊息、圖示、欄位樣式等 UI 裝飾 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/styling/) |
| 圖表 / 甘特圖 | 在 kintone 中嵌入圖表和甘特圖 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/chart/) |
| 入口網站 | kintone Portal 頁面的自訂範例 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/portal/) |
| kintone SDK 應用 | 使用官方 SDK 操作 REST API 的範例 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/tools/) |
| 營運 / 遷移 | 環境遷移、資料搬移、維運自動化 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/operations-and-migration/) |
| 專欄 | kintone 自訂開發相關的技術文章 | [連結](https://cybozu.dev/ja/kintone/tips/development/customize/columns/) |

### 2.2 自訂開發的實用知識

| 標題 | 說明 | URL |
|------|------|-----|
| 開發中知道的話很方便的事 | curl 的 REST API 測試方法、瀏覽器 DevTools Debug 技巧等 | [連結](https://cybozu.dev/ja/kintone/tips/development/development-productivity/) |

### 2.3 外部服務整合 Tips

入口頁面：[外部連攜 Tips](https://cybozu.dev/ja/kintone/tips/development/3rd-party-services/)

#### AI / LLM 相關

| 外部服務 | 整合範例 | URL |
|---------|---------|-----|
| ChatGPT | AI 聊天機器人型 FAQ 系統 | [連結](https://cybozu.dev/ja/id/3ab6c428e67cacd6424bf70d/) |
| ChatGPT | 報價單異常值自動檢查 | [連結](https://cybozu.dev/ja/id/db0ae75ba2f5eb9c28e0d4d3/) |
| Gemini API | 手寫問卷圖片辨識 → 分析 → 存入 kintone | [連結](https://cybozu.dev/ja/id/c54070d73967618a693a126c/) |
| Gemini + GAS | Gmail 內容摘要 → 客戶清單 App 連動 | [連結](https://cybozu.dev/ja/id/dab9721052fb6676b80c1bec/) |
| Azure OpenAI | kintone 摘要外掛程式開發 | [連結](https://cybozu.dev/ja/id/cfe170e8c494fa8ce76bc20a/) |

#### Google 系列

| 外部服務 | 整合範例 | URL |
|---------|---------|-----|
| Google Apps Script | OAuth 2.0 串接 kintone API | [連結](https://cybozu.dev/ja/id/cad9c1f3fbe86742b53faffc/) |
| Google 表單 | Google Form → kintone 自動建立記錄 | [連結](https://cybozu.dev/ja/id/43d0f921f0c1a754784ed16f/) |
| Google 地圖 | 客戶訪問清單地圖 Pin 顯示 | [連結](https://cybozu.dev/ja/id/187aa4efeb3f4a2f71520a5c/) |
| Google 日曆 | kintone 活動排程同步到 Google Calendar | [連結](https://cybozu.dev/ja/id/1486cfdaa23301781096929a/) |
| Google Analytics | GA + Tag Manager 做 kintone 存取分析 | [連結](https://cybozu.dev/ja/id/d381742fd6d46a0831ffa470/) |
| Google 文件 | GAS + OAuth 2.0 串接 | [連結](https://cybozu.dev/ja/id/cad9c1f3fbe86742b53faffc/) |
| Google Workspace | SAML 認證 SSO | [連結](https://cybozu.dev/ja/id/d94032f6eec5ef649eb98678/) |
| Gmail | Webhook → Zapier → Gmail 通知 | [連結](https://cybozu.dev/ja/id/a2bb00587656af6775136f20/) |

#### Microsoft 系列

| 外部服務 | 整合範例 | URL |
|---------|---------|-----|
| Power Automate | kintone 連接器使用前須知 | [連結](https://cybozu.dev/ja/id/34de833402036d76d3c833ba/) |
| Power Automate | Webhook → Slack 投稿 | [連結](https://cybozu.dev/ja/id/3f66b2b54543aea9ef4921a9/) |
| Power Automate | kintone 資料 → Outlook 行事曆 | [連結](https://cybozu.dev/ja/id/947649e0008c20f81a56876c/) |
| Power Automate | kintone 資料 → 地端資料庫寫入 | [連結](https://cybozu.dev/ja/id/beb129aad10e5b9bd47564b5/) |
| Power Automate | HTTP Action 執行任意 kintone REST API | [連結](https://cybozu.dev/ja/id/59b1deec764f5ed08c0677a1/) |
| Power BI | Power BI × kintone 自訂連接器指南 | [連結](https://cybozu.dev/ja/id/90125c111898e77ad9a26618/) |
| Entra ID (Azure AD) | SSO 單一登入設定 | [連結](https://cybozu.dev/ja/id/945cd23374ba72897798dd60/) |
| Entra ID | 使用者資訊定期同步到 cybozu.com | [連結](https://cybozu.dev/ja/id/6de47b1a28248f27c3750ee5/) |
| Entra ID | User Provisioning → cybozu.com | [連結](https://cybozu.dev/ja/id/e2783690278e175e3c48aca9/) |
| Outlook | kintone 收發 Outlook 郵件 | [連結](https://cybozu.dev/ja/id/646a041ee3885e8dc000230b/) |
| Excel | kintone → 直接匯出 Excel 檔案 | [連結](https://cybozu.dev/ja/id/48a67adf9a1ac6bf9bcb72c9/) |

#### 通訊 / 協作

| 外部服務 | 整合範例 | URL |
|---------|---------|-----|
| Slack | kintone → Slack 通知 | [連結](https://cybozu.dev/ja/id/4ba01b31272dec7bf2a02090/) |
| Discord | 聊天 → kintone 登錄午餐候選 | [連結](https://cybozu.dev/ja/id/3725c576b135b397d7a28e68/) |
| Discord | 聊天 → 查詢 kintone 午餐候選清單 | [連結](https://cybozu.dev/ja/id/9da90cfb8c163f0d6f0f3cb2/) |
| Notion | Notion × kintone JS 自訂資料同步 | [連結](https://cybozu.dev/ja/id/e39afba254d2d588618c54f0/) |
| Cisco Webex | Webex Messaging × cybozu.com 使用者連結 | [連結](https://cybozu.dev/ja/id/e56e9ade7e374209b30d5528/) |
| direct | direct × cybozu.com 透過 Entra ID SSO | [連結](https://cybozu.dev/ja/id/1d62849a4976fa4be97d4704/) |
| X（Twitter） | 核准後自動發推文 | [連結](https://cybozu.dev/ja/id/9046cecc823f8ecef3dc8d67/) |

#### 自動化 / 整合平台

| 外部服務 | 整合範例 | URL |
|---------|---------|-----|
| Zapier | Zapier × kintone 功能介紹 | [連結](https://cybozu.dev/ja/id/9b53a85c8cf11b6eacf2c835/) |
| BizteX Connect | 定期處理 kintone 資料 | [連結](https://cybozu.dev/ja/id/4eeffd30e266fc54cfc00d4e/) |
| Qanat 2.0 | GUI 方式實現 kintone 與外部系統連攜 | [連結](https://cybozu.dev/ja/id/b33b321b8252e45b7c4314a0/) |
| AWS Lambda | 定期資料同步（第 2 篇） | [連結](https://cybozu.dev/ja/id/3e607a57c041d57197f2faee/) |

#### 身份認證 / 目錄服務

| 外部服務 | 整合範例 | URL |
|---------|---------|-----|
| Active Directory | kintone App → 自動建立 AD 使用者帳號 | [連結](https://cybozu.dev/ja/id/13c641bf9216c37bf7840202/) |
| Okta | SSO SAML 認證設定 | [連結](https://cybozu.dev/ja/id/e98dd2e6886b4a66b21fb7b3/) |
| Okta | User Provisioning → cybozu.com | [連結](https://cybozu.dev/ja/id/1edd8e16f8971cfc2a2060e1/) |

#### 其他

| 外部服務 | 整合範例 | URL |
|---------|---------|-----|
| Dropbox | Dropbox for kintone 2.0 | [連結](https://cybozu.dev/ja/id/dc9f30c7cca6c6c811508297/) |
| Flutter | iOS App 顯示 kintone 記錄清單 | [連結](https://cybozu.dev/ja/id/c2dfddf749b4d3ef466c672a/) |
| Marketo | Marketo × kintone 整合 | [連結](https://cybozu.dev/ja/id/3b1aa4cf75954f2084b1a548/) |
| RPA | kintone + RPA 帳號盤點自動化 | [連結](https://cybozu.dev/ja/id/70c10dc814d692f8cc6b756a/) |

#### 整合前必讀

| 標題 | 說明 | URL |
|------|------|-----|
| kintone 外部系統連攜應考量的要點 | 連攜前的注意事項整理 | [連結](https://cybozu.dev/ja/id/3f3784e287c00c48ef3472bf/) |
| 連攜模式別：kintone 與外部系統的連攜方法與選擇要點 | 各種連攜模式的比較與選擇建議 | [連結](https://cybozu.dev/ja/id/8177ecfa5ba3c787768482ac/) |
| kintone 連攜服務開發前確認清單 | 給連攜服務開發者的 checklist | [連結](https://cybozu.dev/ja/id/eea07e0553a94f25e88fc9db/) |

### 2.4 外掛程式 Tips

| 標題 | 說明 | URL |
|------|------|-----|
| 外掛程式開發 Tips | 外掛程式開發的 know-how 與範例外掛程式 | [連結](https://cybozu.dev/ja/kintone/tips/development/plugins/) |

---

## 3. 建構營運 Tips

入口頁面：[建構營運 Tips](https://cybozu.dev/ja/kintone/tips/best-practices/)

| 分類 | 說明 | URL |
|------|------|-----|
| 外部系統連攜 | 連攜服務企劃/開發者的確認事項、認證取得的必要對應 | [連結](https://cybozu.dev/ja/kintone/tips/best-practices/external-system-integration/) |
| 資料取得 / 操作 | 資料取得與操作的注意事項與解決方案 | [連結](https://cybozu.dev/ja/kintone/tips/best-practices/data-acquisition-operation/) |
| 效能 | 讓 kintone 順暢運作的考量事項與改善對策 | [連結](https://cybozu.dev/ja/kintone/tips/best-practices/performance/) |
| 安全性 | App 存取權限、外部服務連攜的注意事項等安全管理指南 | [連結](https://cybozu.dev/ja/kintone/tips/best-practices/security/) |
| 專欄 | 備品管理、庫存管理等用 kintone 提升效率的方法 | [連結](https://cybozu.dev/ja/kintone/tips/best-practices/colum/) |

---

## 4. AI

入口頁面：[AI](https://cybozu.dev/ja/kintone/ai/)

| 標題 | 說明 | URL |
|------|------|-----|
| kintone MCP Server | kintone 官方 Local MCP Server 的功能與使用方法 | [連結](https://cybozu.dev/ja/kintone/ai/kintone-mcp-server/) |
| 試用 kintone 與 Garoon 的 MCP Server | 使用 Local MCP Server 讓生成式 AI 呼叫 kintone / Garoon API 的活用場景 | [連結](https://cybozu.dev/ja/kintone/ai/local-mcp-kintone-garoon-integration/) |
| 低程式碼 AI × kintone 連攜！Dify 外掛程式介紹 | 在 Dify Marketplace 公開的 kintone 連攜外掛程式 | [連結](https://cybozu.dev/ja/kintone/ai/kintone-dify-plugin/) |

---

## 5. 教程

入口頁面：[教程首頁](https://cybozu.dev/ja/tutorials/)

| 教程名稱 | 說明 | URL |
|---------|------|-----|
| 開始學 JavaScript | 從零開始的 JavaScript 基礎教程 | [連結](https://cybozu.dev/ja/tutorials/hello-js/) |
| 開始學 kintone API | 從零開始的 kintone API 入門教程 | [連結](https://cybozu.dev/ja/tutorials/hello-kinapi/) |
| 開始學 cli-kintone | 從零開始的 cli-kintone 命令列工具教程 | [連結](https://cybozu.dev/ja/tutorials/hello-cli-kintone/) |
| 開始學 kintone 外掛程式 | 從零開始的外掛程式開發教程 | [連結](https://cybozu.dev/ja/tutorials/hello-kinplugin/) |

---

## 6. 其他資源

| 資源 | 說明 | URL |
|------|------|-----|
| 影片學習 / 讀書會 | 官方影片教學與活動資訊 | [連結](https://cybozu.dev/ja/kintone/news/event-updates/) |
| devCamp | Cybozu 官方開發者活動 | [連結](https://page.cybozu.co.jp/-/devcamp/) |
| 開發者社群 | cybozu developer community 論壇 | [連結](https://community.cybozu.dev) |
| 最新消息 Feed | 最新文章與更新的 Feed | [連結](https://cybozu.dev/ja/feed/) |
