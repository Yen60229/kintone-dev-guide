# kintone 自訂開發指南 (kintone Custom Development Guide)

> Jimmy 的 kintone JavaScript 自訂開發個人知識庫  
> 用於與 AI 協作開發時提供準確的 Context

---

## 📁 目錄結構

```
kintone-dev-guide/
├── README.md
├── docs/                              # 參考文件
│   ├── kintone-api-reference.md       # kintone API 完整速查手冊（繁中）
│   ├── kintone-jp-only-reference.md   # 日文版獨有開發資源速查
│   ├── kintone-sdk-tools-reference.md # SDK & Tools 完整速查手冊
│   ├── 03-ai-collaboration-guide.md   # 與 Claude 協作開發最佳實踐
│   └── 05-development-log.md          # 開發日誌模板與踩坑紀錄
├── examples/                          # 完整範例
│   └── 01-maintainable-example.js     # App 639 品質管理 - 可維護架構範例
└── patterns/                          # 開發 Pattern & 基礎知識
    ├── 02-pattern-library.js          # 6 大 Pattern 模板庫
    └── 04-js-fundamentals.js          # JavaScript 基礎深化（IIFE, async/await, Error Handling）
```

## 🎯 用途

### 1. AI 協作開發
將相關文件貼給 Claude / ChatGPT 作為 Context，讓 AI 生成的 kintone 程式碼更精確：
- **欄位代碼不用猜** — 有完整 API 參考
- **Pattern 直接套用** — 6 大常見場景的模板
- **避免踩坑** — 開發日誌記錄了 12+ 個常見問題與解法

### 2. 個人知識庫
每次完成新功能後，依照 `05-development-log.md` 的模板記錄，持續累積。

### 3. 團隊分享
新成員可以快速了解 kintone 自訂開發的架構規範和踩坑經驗。

## 🏗️ 核心架構規範

所有 kintone JS 自訂開發遵循以下原則：

- **IIFE 包裹** — `(() => { 'use strict'; ... })()` 避免全域污染
- **CONFIG 集中管理** — `Object.freeze({...})` 凍結設定物件
- **const 取代 var** — 不使用 `var`
- **async/await** — 非同步操作一律使用 async/await
- **safeHandler** — 通用 try-catch 錯誤處理包裝
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

## 📖 參考文件來源

- [cybozu.dev 繁體中文](https://cybozu.dev/zh-tw/kintone/docs/)
- [cybozu.dev 日文版](https://cybozu.dev/ja/kintone/)

---

## License

MIT
