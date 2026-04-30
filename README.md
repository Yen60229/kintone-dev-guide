# kintone 自訂開發指南 (kintone Custom Development Guide)

> Jimmy 的 kintone JavaScript 自訂開發個人知識庫  
> 用於與 AI 協作開發時提供準確的 Context

---

## 📁 目錄結構

```
kintone-dev-guide/
├── README.md
├── docs/                                  # 參考文件
│   ├── kintone-api-reference.md           # kintone API 完整速查手冊（繁中）
│   ├── kintone-jp-only-reference.md       # 日文版獨有開發資源速查
│   ├── kintone-sdk-tools-reference.md     # SDK & Tools 完整速查手冊（含 GitHub 連結）
│   ├── 03-ai-collaboration-guide.md       # 與 Claude 協作開發最佳實踐
│   ├── 05-development-log.md              # 開發日誌模板與踩坑紀錄
│   ├── 06-security-stability.md          # 安全性 & 穩定性指南（submit 覆蓋、XSS、race condition）
│   └── 07-ai-integration.md              # kintone × AI 整合（MCP Server、Dify）
├── examples/                              # 完整範例
│   ├── 01-maintainable-example.js         # App 639 品質管理 - 可維護架構範例
│   └── 02-submit-handler-safe.js          # 安全的 Submit Handler 設計範例
├── patterns/                              # 開發 Pattern & 基礎知識
│   ├── 02-pattern-library.js              # 6 大 Pattern 模板庫
│   └── 04-js-fundamentals.js              # JavaScript 基礎深化（IIFE, async/await, Error Handling）
└── tools/                                 # AI 開發工具指南
    └── claude-code-best-practices.md      # Claude Code 82 個技巧（標注 kintone 適用重點）
```

## 🎯 用途

### 1. AI 協作開發
將相關文件貼給 Claude / ChatGPT 作為 Context，讓 AI 生成的 kintone 程式碼更精確：
- **欄位代碼不用猜** — 有完整 API 參考
- **Pattern 直接套用** — 6 大常見場景的模板
- **避免踩坑** — `docs/06-security-stability.md` 記錄了 submit 覆蓋、XSS、race condition 等常見問題

### 2. AI 自動化操作 kintone
- **Kintone MCP Server** — 讓 Claude Desktop 直接操作 kintone 記錄、欄位、部署（`docs/07-ai-integration.md`）
- **Dify Plugin** — 低代碼 AI 整合，可嵌入 chatbot 到 kintone App

### 3. 個人知識庫
每次完成新功能後，依照 `docs/05-development-log.md` 的模板記錄，持續累積。

### 4. 團隊分享
新成員可以快速了解 kintone 自訂開發的架構規範和踩坑經驗。

## 🏗️ 核心架構規範

所有 kintone JS 自訂開發遵循以下原則：

- **IIFE 包裹** — `(() => { 'use strict'; ... })()` 避免全域污染
- **CONFIG 集中管理** — `Object.freeze({...})` 凍結設定物件
- **const 取代 var** — 不使用 `var`
- **async/await** — 非同步操作一律使用 async/await
- **safeHandler** — 通用 try-catch 錯誤處理包裝
- **單一 submit handler** — 同一事件只綁定一次，避免覆蓋問題（詳見 `docs/06-security-stability.md`）
- **SweetAlert2** — 使用者互動提示（取代 alert/confirm）

## 📚 六大 Pattern

| # | Pattern | 場景 | 對應事件 |
|---|---------|------|---------|
| P1 | 欄位聯動 | 修改欄位 A → 自動算欄位 B | `change` |
| P2 | 跨 App 查詢 | 從其他 App 拉資料顯示 | `detail.show` |
| P3 | 批量操作 | cursor 全量獲取 + 逐批更新 | 自訂觸發 |
| P4 | 權限控制 | 根據身份控制欄位顯示/編輯 | `show` |
| P5 | 流程管理 | 狀態遷移前的驗證 + 自動處理 | `process.proceed` |
| P6 | 表單驗證 | 存檔前的商業邏輯檢查 | `submit` |

## ⚠️ 常見陷阱速查

| 問題 | 原因 | 文件 |
|------|------|------|
| Submit 驗證失效，資料還是被存入 | 多個地方綁定同一個 submit 事件 | [06-security-stability.md](docs/06-security-stability.md#1-submit-handler-覆蓋問題) |
| 欄位聯動結果錯亂 | 快速連續修改造成 race condition | [06-security-stability.md](docs/06-security-stability.md#5-race-condition非同步競爭) |
| 行動版 API 回傳 undefined | 部分 JS API 行動版不支援 | [06-security-stability.md](docs/06-security-stability.md#6-行動版相容性) |
| 事件綁定了但完全沒反應 | 事件名稱拼錯（靜默失效） | [06-security-stability.md](docs/06-security-stability.md#2-事件處理器的穩定性陷阱) |
| 大量資料查詢結果不完整 | 沒有用 cursor 分頁 | [06-security-stability.md](docs/06-security-stability.md#5-race-condition非同步競爭) |

## 🤖 AI 整合

| 工具 | 用途 | 文件 |
|------|------|------|
| **Kintone MCP Server** | 讓 Claude Desktop 直接操作 kintone | [07-ai-integration.md](docs/07-ai-integration.md#1-kintone-mcp-server) |
| **Dify Plugin** | 低代碼 AI + kintone 整合 | [07-ai-integration.md](docs/07-ai-integration.md#2-dify-plugin-整合) |
| **Claude Code** | AI 協作開發最佳實踐 | [claude-code-best-practices.md](tools/claude-code-best-practices.md) |

## 📖 參考文件來源

- [cybozu.dev 繁體中文](https://cybozu.dev/zh-tw/kintone/docs/)
- [cybozu.dev 日文版](https://cybozu.dev/ja/kintone/)
- [kintone.dev 英文開發者平台](https://kintone.dev/en/docs/)
- [kintone.dev SDK 工具](https://kintone.dev/en/sdk/)
- [kintone.dev AI 整合](https://kintone.dev/en/ai/)

---

## License

MIT
