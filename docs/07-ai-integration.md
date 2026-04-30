# kintone × AI 整合指南

> 來源：https://kintone.dev/en/ai/  
> 整理日期：2026-04-30  
> 用途：使用 AI 工具（Claude、Dify）自動化 kintone 操作的完整參考

---

## 目錄

- [1. Kintone MCP Server](#1-kintone-mcp-server)
  - [1.1 什麼是 MCP Server](#11-什麼是-mcp-server)
  - [1.2 支援的操作（Tools）](#12-支援的操作tools)
  - [1.3 安裝與設定（Claude Desktop）](#13-安裝與設定claude-desktop)
  - [1.4 實際使用範例](#14-實際使用範例)
  - [1.5 限制與注意事項](#15-限制與注意事項)
- [2. Dify Plugin 整合](#2-dify-plugin-整合)
  - [2.1 什麼是 Dify](#21-什麼是-dify)
  - [2.2 支援的操作](#22-支援的操作)
  - [2.3 嵌入 Chatbot 到 kintone](#23-嵌入-chatbot-到-kintone)
  - [2.4 使用案例](#24-使用案例)
- [3. AI 協作開發注意事項](#3-ai-協作開發注意事項)

---

## 1. Kintone MCP Server

### 1.1 什麼是 MCP Server

**Kintone MCP Server** 是 Cybozu 官方發布的本地 MCP（Model Context Protocol）伺服器，讓 AI 代理（如 Claude Desktop）能直接存取和操作 kintone 的資料與設定。

| 項目 | 內容 |
|------|------|
| 來源 | 官方（Cybozu） |
| 授權 | Apache License 2.0 |
| 文件 | [kintone.dev/en/ai/kintone-mcp-server-intro/](https://kintone.dev/en/ai/kintone-mcp-server-intro/) |
| 支援管道 | GitHub Issues（**不受 API 支援服務台支援**） |

---

### 1.2 支援的操作（Tools）

MCP Server 提供以下操作，AI 可透過自然語言觸發：

| 操作分類 | 功能 |
|---------|------|
| **記錄管理** | 取得記錄、新增記錄、更新記錄、刪除記錄 |
| **狀態管理** | 更新記錄的工作流程狀態（process status） |
| **表單設定** | 取得表單欄位設定、更新表單欄位設定 |
| **應用程式設定** | 取得/更新應用程式一般設定 |
| **欄位管理** | 新增欄位、刪除欄位、更新欄位設定 |
| **部署** | 檢查部署狀態、部署設定到正式環境 |
| **測試環境** | 在測試環境建立應用程式 |
| **附件** | 下載附件（檔案欄位） |
| **應用程式資訊** | 取得應用程式資訊與設定 |

> 完整工具列表與最新版本：請參考 GitHub Repository 的 README

---

### 1.3 安裝與設定（Claude Desktop）

**需求：**
- Claude Desktop（需付費方案）
- kintone 子域網址
- kintone 使用者名稱與密碼

**安裝步驟：**

```
1. 前往 GitHub 下載 Kintone MCP Server（.mcpb 檔案）
2. 在 Claude Desktop 安裝該 MCP 擴充
3. 輸入以下資訊完成設定：
   - kintone 子域：your-domain.cybozu.com
   - 使用者名稱
   - 密碼
4. 重新啟動 Claude Desktop
5. 在聊天框的「連接器」面板確認 Kintone MCP 顯示藍色狀態指示器
```

**設定確認：**

在 Claude Desktop 中輸入以下 prompt 測試連線：

```
請列出我的 kintone 中所有應用程式名稱。
```

---

### 1.4 實際使用範例

**場景：每日任務確認**

```
使用 kintone 的任務管理應用，
顯示所有今天截止的任務，按優先度排序。
逾期未完成的也一起列出來，並標示幾天了。
```

**場景：批量更新記錄狀態**

```
在 App 1234（進度管理）中，
把所有「進行中」且負責人是「山田太郎」的記錄，
狀態更新為「待審核」。
```

**場景：表單欄位查詢**

```
告訴我 App 639（品質管理）的所有欄位代碼和欄位類型。
```

---

### 1.5 限制與注意事項

| 項目 | 說明 |
|------|------|
| **支援管道** | 不受 API 支援服務台支援，問題請到 GitHub Issues 回報 |
| **驗證方式** | 目前使用帳號密碼，**不支援 API Token 驗證** |
| **操作記錄** | AI 的所有操作都以你的帳號身份執行，會留在 kintone 操作記錄中 |
| **批量操作限制** | 受 kintone REST API 的速率限制影響（每次最多 100 筆） |
| **首次使用** | Claude 第一次存取 kintone 時會請求確認授權 |

> **安全提醒**：不要把 MCP Server 設定在含有機密資料的正式環境中測試，建議先用開發環境。

---

## 2. Dify Plugin 整合

### 2.1 什麼是 Dify

[Dify](https://dify.ai) 是開源的 AI 應用開發平台（LangGenius 開發），支援：
- 無代碼/低代碼 AI 應用建構
- 多種 LLM 模型（GPT、Claude、開源模型）
- 第三方工具整合（包含 kintone）
- 彈性的部署選項

文件來源：[kintone.dev/en/ai/kintone-dify-plugin/](https://kintone.dev/en/ai/kintone-dify-plugin/)

---

### 2.2 支援的操作

kintone Dify Plugin 在 Dify Marketplace 上提供，支援以下 4 個核心操作：

| 操作 | 說明 |
|------|------|
| **Get a record** | 依記錄 ID 取得單筆記錄 |
| **Add a record** | 新增一筆記錄到指定 app |
| **Update a record** | 更新指定記錄的欄位值 |
| **Get multiple records** | 依查詢條件取得多筆記錄 |

---

### 2.3 嵌入 Chatbot 到 kintone

**步驟：**

```
1. 在 Dify 建立好你的 AI 應用程式
2. 點選 Dify 的「Publish」→「Embed」取得嵌入代碼
3. 複製提供的 <script> 源碼
4. 進入 kintone 應用程式的「JS / CSS 自訂設定」
5. 將代碼貼入自訂 JavaScript 或 HTML 欄位
```

**kintone 側的 JS 範例（在記錄清單頁顯示 chatbot）：**

```javascript
(() => {
  'use strict';

  kintone.events.on('app.record.index.show', () => {
    // Dify 提供的嵌入代碼貼在這裡
    // 通常是在 kintone.app.getHeaderSpaceElement() 插入 iframe 或 script
    const header = kintone.app.getHeaderSpaceElement();
    if (!header) return;

    const iframe = document.createElement('iframe');
    iframe.src = 'https://your-dify-app-url/chatbot/your-token';
    iframe.style.cssText = 'width:400px;height:600px;border:none;position:fixed;bottom:20px;right:20px;z-index:9999;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);';
    document.body.appendChild(iframe);
  });
})();
```

---

### 2.4 使用案例

| 場景 | 說明 |
|------|------|
| **內部 Help Desk Chatbot** | 讓 AI 從 kintone FAQ 應用取資料，回答員工問題 |
| **AI 翻譯會議記錄** | 自動翻譯並寫回 kintone 記錄欄位 |
| **Email 摘要 → 自動存檔** | AI 摘要 Email 內容後新增到 kintone 記錄 |
| **詢問分類 + 知識庫建立** | 自動分類客戶詢問並累積到 kintone 知識庫應用 |
| **OCR 發票處理** | 從雲端儲存取得發票圖片，OCR 後寫入 kintone |

---

## 3. AI 協作開發注意事項

使用 AI（Claude、Dify）操作 kintone 時，需要特別注意以下事項：

### 權限控制

```
❌ 不要把 MCP Server 連到有機密資料的正式 App
✅ 建立專用的「AI 操作帳號」並限制其能存取的 App 範圍
✅ 定期審查 kintone 的「操作記錄」確認 AI 執行了什麼動作
```

### 資料驗證

```
❌ 不要讓 AI 直接把使用者的自然語言輸入寫進記錄
✅ AI 產生的資料寫入前要經過驗證（欄位格式、值域範圍）
✅ 批量操作前先用 GET 確認範圍，避免大量誤操作
```

### API 使用量

```
✅ AI 的每次對話可能觸發多次 kintone REST API 呼叫
✅ 注意 kintone 的 API 速率限制（每分鐘上限）
✅ 使用 cursor 分頁取大量資料，不要一次撈全部
```
