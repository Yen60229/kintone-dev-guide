---
name: kintone-dev
description: >
  kintone JavaScript 自訂開發助手。涵蓋 REST API、JS API、6 大開發 Pattern（欄位聯動、跨 App 查詢、批量操作、權限控制、流程管理、表單驗證）、安全性防護（submit 覆蓋、XSS、race condition）、行動版相容、錯誤處理。
  在以下情境觸發此 skill：使用者提到 kintone、cybozu、kintone API、kintone 自訂、kintone plugin、kintone event、kintone submit、kintone REST、kintone JavaScript；或提到 kintone 相關概念如 App、record、欄位代碼、事件綁定、kintone.events.on、kintone.api()、cursor 分頁、空白欄位、流程管理等。即使只是「幫我寫 kintone 的 JS」或「kintone 表單驗證」也應觸發。
---

# kintone JavaScript 自訂開發助手

你是 kintone JavaScript 自訂開發專家。依照以下規範生成、審查、除錯 kintone 程式碼。

---

## 1. 核心架構規範（所有輸出必須遵守）

```javascript
(() => {
  'use strict';

  const CONFIG = Object.freeze({
    APP_ID: kintone.app.getId(),
    // 所有可變參數集中在此
  });

  const safeHandler = (fn) => async (event) => {
    try {
      return await fn(event);
    } catch (err) {
      console.error('[kintone-custom]', err);
      if (event?.type?.includes('submit') || event?.type?.includes('process')) {
        event.error = `系統錯誤：${err.message}`;
      }
      return event;
    }
  };

  kintone.events.on('事件名稱', safeHandler(async (event) => {
    // 邏輯放這裡
    return event;
  }));
})();
```

**強制規則：**
- IIFE 包裹 `(() => { 'use strict'; ... })()`，防止多 JS 檔全域變數互相覆蓋
- `const CONFIG = Object.freeze({...})` 集中管理所有可變參數（App ID、欄位代碼、閾值）
- 只用 `const`，禁止 `var`
- 非同步一律 `async/await`，禁止裸 `.then()` 回傳 event（event 會在 .then 之前被 kintone 消費）
- 所有 async handler 套 `safeHandler` 包裝，防止 unhandled rejection 導致畫面靜默卡死
- 同一個 submit / process.proceed 事件只綁定一次，集中分派（見 Pattern P6）
- SweetAlert2 取代 alert/confirm（CDN: `https://js.cybozu.com/sweetalert2/...`）

---

## 2. 關鍵字導引（按需載入，節省 token）

當對話涉及以下主題時，讀取對應的 reference 檔案以獲取完整內容：

| 關鍵字 / 使用情境 | 載入的 reference | 內容 |
|---|---|---|
| REST API、`/k/v1/`、records.json、cursor、query 語法、驗證方式、API endpoint | `references/api-cheatsheet.md` | REST API + JS API 速查（endpoint、事件名稱、方法簽名） |
| P1~P6、pattern、欄位聯動、跨 App、批量、cursor、權限、流程、submit 驗證、重複檢查 | `references/patterns-full.md` | 6 大 Pattern 完整程式碼模板 + JS 基礎（IIFE、async、Observer、Strategy） |
| 安全、XSS、submit 覆蓋、API Token、race condition、行動版、isSubmitting、double submit | `references/security-guide.md` | 完整安全性指南（含 ❌/✅ 對比程式碼） |
| SDK、工具、ESLint、uploader、plugin、CDN、cli-kintone、TypeScript、Dify、MCP | `references/tools-and-resources.md` | SDK 工具鏈 + AI 整合（MCP Server、Dify）+ 日文版獨有資源 |
| 效能、記憶體、卡死、崩潰、OOM、低階電腦、8GB、全量、大量資料、分批、串流、降級、分流、DAO、forEach、巢狀迴圈、deviceMemory | `references/performance-guide.md` | 效能/記憶體優化（8 條原則 + 降級/分流/DAO + 串流 DAO 實作） |

> 若使用者只是「幫我寫一個 kintone 功能」等一般性請求，不需要載入 reference，直接用下方的 Pattern 速查 + 安全清單即可。

> **記憶體前提（重要）**：使用者機器多為 8GB RAM、開 kintone 前已用 ~80%。涉及大量資料或重計算時，**預設套用 `references/performance-guide.md` 的原則**——前端禁止全量重算，欄位縮小、串流分頁、迴圈降階（Map）、讓出主執行緒，重型邏輯分流到後端。

---

## 3. 六大 Pattern 速查（精簡模板）

先判斷需求屬於哪個 Pattern，再套用模板。需要完整版本請載入 `references/patterns-full.md`。

### P1. 欄位聯動（change → set value）

使用者改了欄位 A → 自動算欄位 B。

```javascript
const events = CONFIG.TRIGGER_FIELDS.flatMap(f => [
  `app.record.create.change.${f}`,
  `app.record.edit.change.${f}`,
  `mobile.app.record.create.change.${f}`,
  `mobile.app.record.edit.change.${f}`,
]);
kintone.events.on(events, (event) => {
  const r = event.record;
  r[CONFIG.TARGET].value = String(Number(r.qty.value) * Number(r.price.value));
  return event;
});
```

### P2. 跨 App 查詢（detail.show → REST API GET → 渲染到空白欄）

```javascript
kintone.events.on(['app.record.detail.show', 'mobile.app.record.detail.show'],
  safeHandler(async (event) => {
    const resp = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: CONFIG.SOURCE_APP,
      query: `${CONFIG.KEY} = "${event.record[CONFIG.LOOKUP].value}"`,
    });
    const el = kintone.app.record.getSpaceElement(CONFIG.SPACE_ID);
    if (el) el.innerHTML = renderCards(resp.records); // 注意 XSS！用戶輸入需 sanitize
    return event;
  })
);
```

### P3. 批量操作（cursor 全量獲取 + 逐批更新）

```javascript
// 全量獲取（cursor，無 500 筆上限）
const getAllRecords = async (app, query = '') => {
  const { id } = await kintone.api(kintone.api.url('/k/v1/records/cursor.json', true), 'POST', { app, query, size: 500 });
  const records = [];
  try {
    while (true) {
      const r = await kintone.api(kintone.api.url('/k/v1/records/cursor.json', true), 'GET', { id });
      records.push(...r.records);
      if (!r.next) break;
    }
  } catch (e) { try { await kintone.api(kintone.api.url('/k/v1/records/cursor.json', true), 'DELETE', { id }); } catch {} throw e; }
  return records;
};

// 逐批更新（每次最多 100 筆）
const bulkUpdate = async (app, records, buildBody) => {
  for (let i = 0; i < records.length; i += 100) {
    await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', {
      app, records: records.slice(i, i + 100).map(buildBody),
    });
  }
};
```

### P4. 權限控制（show → setFieldShown）

```javascript
kintone.events.on(['app.record.edit.show', 'mobile.app.record.edit.show'], (event) => {
  const userOrgs = kintone.user.getOrganizations().map(o => o.name);
  const canSee = CONFIG.ALLOWED_ORGS.some(org => userOrgs.includes(org));
  CONFIG.RESTRICTED_FIELDS.forEach(f => kintone.app.record.setFieldShown(f, canSee));
  return event;
});
// 注意：行動版 getOrganizations() 可能回傳 undefined，需 fallback 到 REST API
```

### P5. 流程管理（process.proceed → 驗證 + 自動設值）

```javascript
kintone.events.on(['app.record.detail.process.proceed', 'mobile.app.record.detail.process.proceed'],
  safeHandler(async (event) => {
    const rules = CONFIG.ACTION_RULES[event.action.value];
    if (!rules) return event;
    // 驗證必填
    const empty = rules.required.filter(f => !event.record[f]?.value);
    if (empty.length) { event.error = `必填：${empty.join(', ')}`; return event; }
    // 自動設值（DATETIME 用 ISO 8601！）
    Object.entries(rules.autoSet).forEach(([f, fn]) => { event.record[f].value = fn(); });
    return event;
  })
);
```

### P6. 表單驗證（submit → 單一入口 + isSubmitting + 驗證）

```javascript
let isSubmitting = false;
kintone.events.on(
  ['app.record.create.submit', 'app.record.edit.submit'],
  safeHandler(async (event) => {
    if (isSubmitting) { event.error = '處理中...'; return event; }
    isSubmitting = true;
    try {
      // Step 1: 計算
      // Step 2: 驗證 → if (error) { event.error = msg; return event; }
      // Step 3: 非同步查詢
      return event;
    } finally { isSubmitting = false; }
  })
);
// 重點：同一個 submit 事件只綁一次！多個 handler 會全部執行但 return 行為互相干擾。
```

---

## 4. 安全性檢查清單（輸出程式碼前必查）

生成或審查 kintone 程式碼時，逐項確認：

### 安全性
- [ ] API Token 沒有寫在前端 JS（用 `kintone.api()` 自動帶 session，或 Token 放後端 proxy）
- [ ] DOM 插入用 `textContent`；需要 HTML 時用 `DOMPurify.sanitize()`
- [ ] URL 欄位驗證 scheme（只允許 `http:` / `https:`）
- [ ] Plugin 敏感設定用 `kintone.plugin.app.setConfig()` 儲存

### 穩定性
- [ ] 同一個 submit/process 事件只綁一次（單一入口 + 集中分派）
- [ ] 有 `isSubmitting` flag 防重複提交
- [ ] async handler 有 try-catch（`safeHandler` 包裝）
- [ ] 事件名稱對照官方文件確認拼寫（kintone 拼錯不報錯，靜默失效）

### 大量資料
- [ ] 超過 500 筆用 cursor 分頁（不用 offset，資料更新時 offset 會錯位）
- [ ] 批量更新每批 100 筆（REST API 上限）
- [ ] cursor 建立後立即讀取（10 分鐘逾時）

### 效能 / 記憶體（8GB 機器，詳見 `references/performance-guide.md`）
- [ ] 重計算沒放在 `index.show`/`detail.show`/`change`（分流到後端/排程）
- [ ] 讀取指定 `fields` 白名單，沒撈全欄位
- [ ] 大量資料串流分頁邊抓邊丟，沒有 `push` 全量堆積
- [ ] 巢狀迴圈比對改用 `Map`（O(n²) → O(n)）
- [ ] 重計算分批 + `await setTimeout(0)` 讓出主執行緒
- [ ] 暫存大資料用完設 `null`，沒掛 window/全域/closure/DOM dataset

### 行動版
- [ ] 事件名稱加 `mobile.` 前綴版本
- [ ] `getOrganizations()` / `getSpaceElement()` 行動版不支援 → fallback

---

## 5. 常見踩坑速查表

| # | 坑 | 原因 | 解法 |
|---|---|---|---|
| 1 | DATETIME 寫入失敗 | 格式不是 ISO 8601 | `new Date().toISOString()` |
| 2 | `totalCount` 比較永遠 false | 回傳值是字串 `"3"` 不是數字 | 用 `!== '0'` 或 `Number()` |
| 3 | 行動版 `getSpaceElement` 回傳 null | 行動版用 `kintone.mobile.app.record` | helper 自動判斷版本 |
| 4 | change event 沒觸發 | 欄位代碼拼錯（不報錯） | 先 `console.log` 確認事件被呼叫 |
| 5 | async submit 修改沒生效 | handler 沒加 `async`，event 在 `.then` 前被消費 | `async` handler + `await` 後才 `return event` |
| 6 | 全域變數衝突 | 多 JS 檔沒用 IIFE | 每個檔案 `(() => { ... })()` |
| 7 | 跨 App 查詢權限不足 | 使用者帳號沒有目標 App 權限 | 改用 API Token（加 `X-Cybozu-API-Token` header） |
| 8 | 批量更新部分失敗 | 單次 PUT 上限 100 筆 | 分批，每批 100 |
| 9 | cursor 逾時 | 建立後超過 10 分鐘 | 建立後立即讀取，中間不做耗時操作 |
| 10 | `detail.show` 的 `event.record` 修改不生效 | detail 畫面是唯讀的 | 用 DOM 操作或 REST API PUT |
| 11 | `create.show` lookup 有殘留值 | 複製記錄帶入原始值 | 在 `create.show` 手動清空 |
| 12 | `disabled = true` 沒效果 | 只有特定事件支援 | CSS `pointer-events:none; opacity:0.6` |

---

## 6. 與 AI 協作最佳實踐

### 高效提問格式

```
我在 kintone App [ID]（[功能名]）做自訂開發。

欄位代碼對照：
- [欄位名]: [欄位代碼] ([類型])

需求：[一次一個需求，明確說出觸發事件、計算規則、驗證條件]

約束：
- 驗證方式：API Token / 使用者登入
- 裝置範圍：要不要支援行動版
- 資料量級：約 N 筆（影響是否需 cursor）
```

### 關鍵原則
1. **一次一個需求** — 確認沒問題再疊加下一個
2. **給欄位代碼表** — Claude 不用猜，生成的 code 可以直接用
3. **貼文件連結** — Claude 即時 fetch 最新版 API 文件，比訓練資料準確
4. **Code Review 心態** — 重點檢查：事件名稱拼寫、API method、欄位代碼、error handling

---

## 7. 常用事件名稱速查

| 情境 | 電腦版 | 行動版 |
|---|---|---|
| 清單頁載入 | `app.record.index.show` | `mobile.app.record.index.show` |
| 詳情頁載入 | `app.record.detail.show` | `mobile.app.record.detail.show` |
| 新增頁載入 | `app.record.create.show` | `mobile.app.record.create.show` |
| 編輯頁載入 | `app.record.edit.show` | `mobile.app.record.edit.show` |
| 新增存檔前 | `app.record.create.submit` | `mobile.app.record.create.submit` |
| 編輯存檔前 | `app.record.edit.submit` | `mobile.app.record.edit.submit` |
| 存檔成功後 | `*.submit.success` | `mobile.*.submit.success` |
| 欄位變更 | `app.record.{create\|edit}.change.欄位代碼` | `mobile.app.record.{create\|edit}.change.欄位代碼` |
| 流程動作 | `app.record.detail.process.proceed` | `mobile.app.record.detail.process.proceed` |
| 列印頁 | `app.record.print.show` | 無 |
| 入口網站 | `portal.show` | `mobile.portal.show` |

---

## 8. 常用 API 速查

### REST API（透過 kintone.api() 呼叫）

| 操作 | Method | Path |
|---|---|---|
| 取得單筆記錄 | GET | `/k/v1/record.json` |
| 取得多筆記錄 | GET | `/k/v1/records.json` |
| 新增單筆 | POST | `/k/v1/record.json` |
| 新增多筆 | POST | `/k/v1/records.json` |
| 更新單筆 | PUT | `/k/v1/record.json` |
| 更新多筆 | PUT | `/k/v1/records.json` |
| 刪除多筆 | DELETE | `/k/v1/records.json` |
| 建立 cursor | POST | `/k/v1/records/cursor.json` |
| 讀取 cursor | GET | `/k/v1/records/cursor.json` |
| 上傳檔案 | POST | `/k/v1/file.json` |
| 下載檔案 | GET | `/k/v1/file.json` |

### JS API 常用方法

| 用途 | 方法 |
|---|---|
| 呼叫 REST API | `kintone.api(url, method, params)` |
| 取得 API URL | `kintone.api.url('/k/v1/...', true)` |
| 取得 App ID | `kintone.app.getId()` / `kintone.mobile.app.getId()` |
| 取得記錄值 | `kintone.app.record.get()` |
| 設定記錄值 | `kintone.app.record.set(obj)` |
| 取得空白欄位 DOM | `kintone.app.record.getSpaceElement(id)` |
| 顯示/隱藏欄位 | `kintone.app.record.setFieldShown(code, bool)` |
| 取得登入者 | `kintone.getLoginUser()` |
| 取得使用者組織 | `kintone.user.getOrganizations()` |
| 註冊事件 | `kintone.events.on(events, handler)` |
| 移除事件 | `kintone.events.off(events, handler)` |

---

## 9. 除錯流程

遇到 kintone 自訂功能 bug 時，依序檢查：

1. **事件名稱** — 開 DevTools Console，確認 handler 有被呼叫（加 `console.log`）。kintone 事件名拼錯不報錯。
2. **欄位代碼** — 到 kintone App 設定 → 表單 → 確認欄位代碼拼寫，注意大小寫。
3. **async/await** — 確認 handler 是 `async`，且 `return event` 在 `await` 之後。
4. **event.record vs REST API** — `detail.show` 的 `event.record` 修改不會被存檔，要改值需用 REST API。
5. **行動版** — 事件名加 `mobile.` 前綴，部分 JS API 行動版不支援（`getOrganizations`、`getSpaceElement` 等）。
6. **多個 handler** — 確認同一事件沒有被多次 `kintone.events.on()`。
7. **API 錯誤代碼** — `GAIA_RE01`（記錄不存在/無權限）、`CB_AU01`（Session 過期）、`GAIA_TM12`（速率限制）。

---

## 10. 開發日誌模板

完成功能後，建議用此模板記錄：

```markdown
### [日期] App XXX - 功能名稱
**需求摘要**：一句話
**Pattern**：P1/P2/P3/P4/P5/P6
**關鍵 API**：event 名稱 + REST API path
**踩坑**：問題 → 原因 → 解法
**檔案**：filename.js
```
