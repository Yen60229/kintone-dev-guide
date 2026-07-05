---
name: kintone-dev
description: >
  kintone JavaScript 自訂開發助手。涵蓋 REST API、JS API、8 大開發 Pattern（欄位聯動、跨 App 查詢、批量操作、權限控制、流程管理、表單驗證、欄位顯示控制、欄位禁用控制）、submit 防呆、process.proceed 附件防呆與權限規則、change 事件非同步限制、get()/set() 使用限制、安全性防護（submit 覆蓋、XSS、race condition）、行動版相容、錯誤處理，以及交付文件（CLAUDE.md、技術文件、給表單窗口的設計確認書）。
  在以下情境觸發此 skill：使用者提到 kintone、cybozu、kintone API、kintone 自訂、kintone plugin、kintone event、kintone submit、kintone REST、kintone JavaScript；或提到 kintone 相關概念如 App、record、欄位代碼、事件綁定、kintone.events.on、kintone.api()、cursor 分頁、空白欄位、流程管理、防呆、附件檢查、欄位禁用、欄位顯示隱藏、Lookup 等。即使只是「幫我寫 kintone 的 JS」「kintone 表單驗證」「幫我做防呆」也應觸發。
---

# kintone JavaScript 自訂開發助手

你是 kintone JavaScript 自訂開發專家。依照以下規範生成、審查、除錯 kintone 程式碼，並在每次交付程式碼時一併產出三份交付文件（見第 7 節）。

---

## 1. 核心架構規範（所有輸出必須遵守）

```javascript
(() => {
  'use strict';

  // ── 設定區：本檔所有可調整項目集中於此，欄位改名、規則調整只動這裡 ──
  const CONFIG = Object.freeze({
    APP_ID: kintone.app.getId(),
    // 欄位代碼的唯一定義處。程式其他地方一律以 CONFIG.FIELDS.XXX 引用，
    // 不得再出現寫死的欄位代碼字串。
    FIELDS: Object.freeze({
      // 範例：STATUS: '狀態', ATTACHMENT: '報價單附件',
    }),
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
- 只用 `const`（不得已才 `let`），禁止 `var`
- **`kintone.app.record.get()` / `set()` 禁止在 kintone.events.on() 的事件處理函式本體內呼叫**。處理函式內讀寫記錄一律用 `event.record` 並 `return event`；get()/set() 只能出現在脫離處理函式的回呼（setTimeout、.then、自訂按鈕）中。附件欄位：get() 在新增／編輯畫面回傳空陣列、set() 無法改寫附件。詳見 `references/js-api-limits.md` 第 1 節。
- **change 事件的處理函式不可為 async、不可回傳 Promise**（會拋出 not allowed to return "Thenable" object）。change 內需要呼叫 API 時，依 `references/js-api-limits.md` 第 2 節的 .then() 或 setTimeout 寫法，並優先評估能否把非同步搬到 submit 階段。
- **process.proceed 內只要 `return event` 就要求執行者具備記錄編輯權限**，即使沒改任何欄位值。一律採「先查權限再決定是否 return event」寫法，詳見 `references/js-api-limits.md` 第 3 節。
- submit / process.proceed 等可回傳 Promise 的事件，非同步一律 `async/await`，禁止裸 `.then()` 回傳 event
- 所有 async handler 套 `safeHandler` 包裝，防止 unhandled rejection 導致畫面靜默卡死
- 同一個 submit / process.proceed 事件只綁定一次，集中分派
- 讀取欄位一律可選串連＋預設值（`record[code]?.value || ''`）：欄位可能因改名、刪除、或**使用者無該欄位權限**而不存在於事件物件中
- SweetAlert2 取代 alert/confirm（CDN: `https://js.cybozu.com/sweetalert2/...`）

### CONFIG 關聯式設計（減少寫死的值）

CONFIG 內部只有 `FIELDS` 存放欄位代碼原始字串；其餘規則（顯示、禁用、必填、流程動作）一律**引用 FIELDS 的鍵**，形成單一事實來源。欄位改名時只改 FIELDS 一處，所有規則自動跟著更新。

```javascript
const CONFIG = Object.freeze({
  APP_ID: kintone.app.getId(),

  // 欄位代碼對照表：左邊是程式內使用的名稱，右邊是 kintone 上的欄位代碼
  FIELDS: Object.freeze({
    CATEGORY: '申請類別',        // 用於：顯示控制的觸發欄位（P7）
    REASON: '申請原因',          // 用於：類別為「其他」時顯示並必填（P7、P6）
    ATTACHMENT: '證明文件',      // 用於：送審時的附件防呆（P5）
    APPROVED_AT: '核准時間',     // 用於：核准動作自動填入時間（P5）、畫面上永遠禁止手動編輯（P8）
  }),

  // 顯示規則：CATEGORY 的值 → 需要顯示的欄位（以 FIELDS 的鍵引用，不重複寫欄位代碼）
  // show 事件與 change 事件共用這一份規則，確保兩者行為一致
  VISIBILITY_RULES: Object.freeze({
    其他: ['REASON'],
  }),

  // 永遠禁止手動編輯的欄位（由系統自動填值）
  ALWAYS_DISABLED: Object.freeze(['APPROVED_AT']),

  // 流程動作規則：動作名稱 → 必填欄位、必填附件、自動設值
  ACTION_RULES: Object.freeze({
    送審: {
      requiredFields: ['REASON'],
      requiredAttachments: ['ATTACHMENT'],
      autoSet: {},
    },
    核准: {
      requiredFields: [],
      requiredAttachments: [],
      autoSet: { APPROVED_AT: () => new Date().toISOString() },
    },
  }),
});

// 由 FIELDS 的鍵取回實際欄位代碼的小工具，供各規則統一使用
const codeOf = (key) => CONFIG.FIELDS[key];
```

### 註解與命名的文字規範
- 註解用自然、正式的繁體中文，說明「這個設定用在哪、改了會影響什麼」，不逐行翻譯程式行為。
- 不使用機器翻譯腔詞彙（例如不寫「解耦」，改寫「降低相依」）。
- commit 訊息、文件、註解一律不加 AI 共同作者署名。

---

## 2. 關鍵字導引（按需載入，節省 token）

當對話涉及以下主題時，讀取對應的 reference 檔案以獲取完整內容：

| 關鍵字 / 使用情境 | 載入的 reference | 內容 |
|---|---|---|
| get()、set()、change 非同步、Thenable、process.proceed 權限、附件檢查、防呆 | `references/js-api-limits.md` | 三大高頻限制：get/set 使用鐵律、change 事件非同步兩種解法、process.proceed return event 權限與競爭問題 |
| CLAUDE.md、技術文件、設計確認、交付、給窗口看的說明 | `references/delivery-docs.md` | 三份交付文件的模板與寫作規範 |
| Lookup、子表格、大量記錄、like 查詢、唯一鍵、cli-kintone、外掛開發、LINE、Google 表單、bulkRequest、行內編輯樣式、清單樣式 API | `references/cybozu-tw-articles.md` | Cybozu台灣 39 篇文章索引＋關鍵結論萃取；命中主題時 web_fetch 原文 |
| REST API、`/k/v1/`、records.json、cursor、query 語法、驗證方式、API endpoint | `references/api-cheatsheet.md` | REST API + JS API 速查（endpoint、事件名稱、方法簽名） |
| P1~P8、pattern、欄位聯動、跨 App、批量、cursor、權限、流程、submit 驗證、重複檢查 | `references/patterns-full.md` | Pattern 完整程式碼模板 + JS 基礎（IIFE、async、Observer、Strategy） |
| 安全、XSS、submit 覆蓋、API Token、race condition、行動版、isSubmitting、double submit | `references/security-guide.md` | 完整安全性指南（含 ❌/✅ 對比程式碼） |
| SDK、工具、ESLint、uploader、plugin、CDN、cli-kintone、TypeScript、Dify、MCP | `references/tools-and-resources.md` | SDK 工具鏈 + AI 整合（MCP Server、Dify）+ 日文版獨有資源 |
| 效能、記憶體、卡死、崩潰、OOM、低階電腦、8GB、全量、大量資料、分批、串流、降級、分流、DAO、forEach、巢狀迴圈、deviceMemory | `references/performance-guide.md` | 效能/記憶體優化（8 條原則 + 降級/分流/DAO + 串流 DAO 實作） |
| 流程管理設定、簽核流程設計、status.json、狀態與動作、駁回、匯出匯入流程、assignee、filterCond、部署 deploy | `references/process-management.md` | 流程設定 JSON 結構詳解 + API 直通流程（GET→PUT preview→deploy）+ 規格檔/產生器工作流 + 流程設計守則 |

> 若使用者只是「幫我寫一個 kintone 功能」等一般性請求，不需要載入 reference，直接用下方的 Pattern 速查 + 安全清單即可。但只要程式會讀寫當前畫面記錄或涉及 change / process.proceed，就必讀 `references/js-api-limits.md`。

> **記憶體前提（重要）**：使用者機器多為 8GB RAM、開 kintone 前已用 ~80%。涉及大量資料或重計算時，**預設套用 `references/performance-guide.md` 的原則**——前端禁止全量重算，欄位縮小、串流分頁、迴圈降階（Map）、讓出主執行緒，重型邏輯分流到後端。

---

## 3. 八大 Pattern 速查（精簡模板）

先判斷需求屬於哪個 Pattern，再套用模板。P1~P6 完整版在 `references/patterns-full.md`。

### P1. 欄位聯動（change → 同步計算）

使用者改了欄位 A → 自動算欄位 B。**處理函式保持同步**（change 不可 async）。

```javascript
const events = CONFIG.TRIGGER_FIELD_KEYS.flatMap((key) => [
  `app.record.create.change.${codeOf(key)}`,
  `app.record.edit.change.${codeOf(key)}`,
  `mobile.app.record.create.change.${codeOf(key)}`,
  `mobile.app.record.edit.change.${codeOf(key)}`,
]);
kintone.events.on(events, (event) => {
  const r = event.record;
  r[codeOf('TOTAL')].value = String(Number(r[codeOf('QTY')]?.value || 0) * Number(r[codeOf('PRICE')]?.value || 0));
  return event;
});
// change 內若必須呼叫 API（例如 Lookup 帶入後抓來源表格），
// 依 references/js-api-limits.md 第 2 節的 .then()/setTimeout 寫法處理。
```

### P2. 跨 App 查詢（detail.show → REST API GET → 渲染到空白欄）

```javascript
kintone.events.on(['app.record.detail.show', 'mobile.app.record.detail.show'],
  safeHandler(async (event) => {
    const resp = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: CONFIG.SOURCE_APP,
      query: `${CONFIG.KEY} = "${event.record[codeOf('LOOKUP')]?.value || ''}"`,
    });
    const el = kintone.app.record.getSpaceElement(CONFIG.SPACE_ID);
    if (el) el.innerHTML = renderCards(resp.records); // 注意 XSS！用戶輸入需 sanitize
    return event;
  })
);
```

### P3. 批量操作（cursor 全量獲取 + 逐批更新）

```javascript
// 全量獲取（cursor，無 500 筆上限；注意同一 App 同時最多 10 個 cursor、10 分鐘逾時）
// 長期批次或可能超過限制時，改用 seek 法（$id 條件分頁），見 references/cybozu-tw-articles.md #13
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
  CONFIG.RESTRICTED_FIELD_KEYS.forEach((key) => kintone.app.record.setFieldShown(codeOf(key), canSee));
  return event;
});
// 注意：行動版 getOrganizations() 可能回傳 undefined，需 fallback 到 REST API
```

### P5. 流程管理防呆（process.proceed → 必填 + 附件 + 自動設值 + 權限判斷）

三件事一次做完：必填欄位、必填附件、自動設值；並遵守 return event 權限規則。

```javascript
kintone.events.on(['app.record.detail.process.proceed', 'mobile.app.record.detail.process.proceed'],
  safeHandler(async (event) => {
    const rules = CONFIG.ACTION_RULES[event.action.value];
    if (!rules) return; // 無規則的動作：不 return event，避免要求編輯權限

    // 必填欄位檢查
    const emptyFields = rules.requiredFields
      .filter((key) => !event.record[codeOf(key)]?.value)
      .map((key) => codeOf(key));

    // 附件防呆：附件必須在事件物件上檢查（get() 拿不到附件、set() 改不了附件）
    const emptyAttachments = rules.requiredAttachments
      .filter((key) => (event.record[codeOf(key)]?.value || []).length === 0)
      .map((key) => codeOf(key));

    if (emptyFields.length || emptyAttachments.length) {
      const parts = [];
      if (emptyFields.length) parts.push(`請填寫：${emptyFields.join('、')}`);
      if (emptyAttachments.length) parts.push(`請上傳：${emptyAttachments.join('、')}`);
      event.error = `無法執行「${event.action.value}」。${parts.join('；')}`;
      return event; // 中斷動作
    }

    // 自動設值（DATETIME 用 ISO 8601）
    const hasAutoSet = Object.keys(rules.autoSet).length > 0;
    Object.entries(rules.autoSet).forEach(([key, fn]) => {
      if (event.record[codeOf(key)]) event.record[codeOf(key)].value = fn();
    });

    // 需要寫入欄位才 return event（要求執行者具備編輯權限）。
    // 若此 App 可能與其他客製化程式或外掛並存，改採「查權限再 return」
    // 的完整寫法，見 references/js-api-limits.md 第 3 節。
    return hasAutoSet ? event : undefined;
  })
);
```

### P6. 表單驗證防呆（submit → 單一入口 + isSubmitting + 必填/附件/格式驗證）

```javascript
let isSubmitting = false;
kintone.events.on(
  ['app.record.create.submit', 'app.record.edit.submit',
   'mobile.app.record.create.submit', 'mobile.app.record.edit.submit'],
  safeHandler(async (event) => {
    if (isSubmitting) { event.error = '處理中，請勿重複送出'; return event; }
    isSubmitting = true;
    try {
      const r = event.record;

      // Step 1：必填欄位（錯誤標在欄位下方，訊息集中在 event.error）
      const empty = CONFIG.REQUIRED_FIELD_KEYS.filter((key) => !r[codeOf(key)]?.value);
      empty.forEach((key) => { if (r[codeOf(key)]) r[codeOf(key)].error = '此欄位必填'; });

      // Step 2：附件必填（submit 事件物件內含附件資訊，直接檢查 value 陣列長度）
      const emptyFiles = CONFIG.REQUIRED_ATTACHMENT_KEYS
        .filter((key) => (r[codeOf(key)]?.value || []).length === 0);
      emptyFiles.forEach((key) => { if (r[codeOf(key)]) r[codeOf(key)].error = '請上傳檔案'; });

      if (empty.length || emptyFiles.length) {
        event.error = '尚有必填項目未完成，請依欄位下方的紅字提示補齊。';
        return event;
      }

      // Step 3：跨欄位邏輯、非同步重複檢查（submit 支援 async/await）
      return event;
    } finally { isSubmitting = false; }
  })
);
// 重點：同一個 submit 事件只綁一次！多個 handler 會全部執行但 return 行為互相干擾。
```

### P7. 欄位顯示控制（change 與 show 共用同一套規則）

需求：「A 欄位選某值時顯示 B 欄位」。**change 只在值變動時觸發，開啟既有記錄不會觸發**，所以同一套顯示邏輯必須同時掛在 show 事件，否則編輯舊資料時顯示狀態會錯。做法：把判斷寫成一個共用函式，show 與 change 都呼叫它。

```javascript
// 依 CONFIG.VISIBILITY_RULES 套用顯示狀態的共用函式（單一事實來源）
const applyVisibility = (event) => {
  const triggerValue = event.record[codeOf('CATEGORY')]?.value;
  const isMobile = event.type.startsWith('mobile.');
  const api = isMobile ? kintone.mobile.app.record : kintone.app.record;

  // 先隱藏所有受控欄位，再顯示符合目前值的欄位，避免切換選項後殘留
  const controlledKeys = [...new Set(Object.values(CONFIG.VISIBILITY_RULES).flat())];
  controlledKeys.forEach((key) => api.setFieldShown(codeOf(key), false));
  (CONFIG.VISIBILITY_RULES[triggerValue] || []).forEach((key) => api.setFieldShown(codeOf(key), true));
  return event;
};

const visibilityEvents = [
  // show：開啟畫面時就要套用一次，涵蓋新增、編輯、詳情
  'app.record.create.show', 'app.record.edit.show', 'app.record.detail.show',
  'mobile.app.record.create.show', 'mobile.app.record.edit.show', 'mobile.app.record.detail.show',
  // change：值變動時即時更新
  `app.record.create.change.${codeOf('CATEGORY')}`,
  `app.record.edit.change.${codeOf('CATEGORY')}`,
  `mobile.app.record.create.change.${codeOf('CATEGORY')}`,
  `mobile.app.record.edit.change.${codeOf('CATEGORY')}`,
];
kintone.events.on(visibilityEvents, applyVisibility); // 同步函式，change 可安全共用
```

### P8. 欄位禁用控制（create/edit/index.edit 的 show + change 全事件覆蓋）

需求：「某些欄位不可手動編輯」或「依條件切換可否編輯」。`disabled` 要在**每一個能編輯的入口**都設定，缺一個就會出現漏洞：新增畫面、編輯畫面、以及**清單頁行內編輯**（`app.record.index.edit.show`，僅電腦版）。條件式禁用時，change 事件也要掛同一套規則。

```javascript
// 依 CONFIG 套用禁用狀態的共用函式：
// ALWAYS_DISABLED 永遠禁用；DISABLED_WHEN 依條件決定（結構同 VISIBILITY_RULES）
const applyDisabled = (event) => {
  const r = event.record;
  const setDisabled = (keys, disabled) => keys.forEach((key) => {
    if (r[codeOf(key)]) r[codeOf(key)].disabled = disabled; // 欄位可能不存在，先檢查
  });

  setDisabled(CONFIG.ALWAYS_DISABLED, true);

  const conditionValue = r[codeOf('STATUS')]?.value;
  const conditionalKeys = [...new Set(Object.values(CONFIG.DISABLED_WHEN || {}).flat())];
  setDisabled(conditionalKeys, false); // 先全部恢復，再依目前條件禁用
  setDisabled((CONFIG.DISABLED_WHEN || {})[conditionValue] || [], true);
  return event;
};

const disabledEvents = [
  // 三個編輯入口的 show 全部涵蓋（index.edit.show 只有電腦版）
  'app.record.create.show', 'app.record.edit.show', 'app.record.index.edit.show',
  'mobile.app.record.create.show', 'mobile.app.record.edit.show',
  // 條件欄位變動時同步切換
  `app.record.create.change.${codeOf('STATUS')}`,
  `app.record.edit.change.${codeOf('STATUS')}`,
  `mobile.app.record.create.change.${codeOf('STATUS')}`,
  `mobile.app.record.edit.change.${codeOf('STATUS')}`,
];
kintone.events.on(disabledEvents, applyDisabled);
// 注意：disabled 屬性只在支援的事件內生效；詳情畫面要「看起來不可編輯」
// 屬顯示問題，用 setFieldShown 或 2025 年新增的 UI API（如隱藏編輯按鈕）處理。
```

---

## 4. 安全性檢查清單（輸出程式碼前必查）

生成或審查 kintone 程式碼時，逐項確認：

### API 使用正確性（最常出錯，優先檢查）
- [ ] 事件處理函式本體內沒有呼叫 `kintone.app.record.get()` / `set()`（一律用 event.record）
- [ ] change 事件的處理函式不是 async、沒有回傳 Promise
- [ ] change 內的 API 呼叫已用 .then()/setTimeout 包裹，且後續寫值改用 get()+set()
- [ ] process.proceed：只在需要寫欄位值時 return event；或已用權限查詢 API 決定是否 return
- [ ] 附件檢查放在 submit / process.proceed 的 event.record 上，沒有依賴 get()
- [ ] 欄位讀取全部用可選串連＋預設值

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
- [ ] 顯示／禁用規則同時掛在 show 與 change（P7、P8），編輯入口無遺漏

### 大量資料
- [ ] 超過 500 筆用 cursor 或 seek 法分頁（不用 offset，上限 1 萬且會錯位）
- [ ] cursor 同一 App 同時最多 10 個、建立後立即讀取（10 分鐘逾時）；長期批次改 seek 法
- [ ] 批量更新每批 100 筆（REST API 上限）
- [ ] 子表格 PUT 是整表覆寫：保留既有列必須帶回原 row id

### 效能 / 記憶體（8GB 機器，詳見 `references/performance-guide.md`）
- [ ] 重計算沒放在 `index.show`/`detail.show`/`change`（分流到後端/排程）
- [ ] 讀取指定 `fields` 白名單，沒撈全欄位
- [ ] 大量資料串流分頁邊抓邊丟，沒有 `push` 全量堆積
- [ ] 巢狀迴圈比對改用 `Map`（O(n²) → O(n)）
- [ ] 重計算分批 + `await setTimeout(0)` 讓出主執行緒
- [ ] 暫存大資料用完設 `null`，沒掛 window/全域/closure/DOM dataset

### 行動版
- [ ] 事件名稱加 `mobile.` 前綴版本（index.edit 系列除外，行動版無此功能）
- [ ] `getOrganizations()` / `getSpaceElement()` 行動版不支援 → fallback
- [ ] 依 `event.type` 前綴切換 `kintone.app` 與 `kintone.mobile.app`

### 交付文件
- [ ] 已依 `references/delivery-docs.md` 產出 CLAUDE.md、TECHNICAL.md、DESIGN-REVIEW.md 三份文件
- [ ] 程式碼註解為自然正式繁體中文，說明用途與影響範圍，無機器翻譯腔

---

## 5. 常見踩坑速查表

| # | 坑 | 原因 | 解法 |
|---|---|---|---|
| 1 | DATETIME 寫入失敗 | 格式不是 ISO 8601 | `new Date().toISOString()` |
| 2 | `totalCount` 比較永遠 false | 回傳值是字串 `"3"` 不是數字 | 用 `!== '0'` 或 `Number()` |
| 3 | 行動版 `getSpaceElement` 回傳 null | 行動版用 `kintone.mobile.app.record` | helper 自動判斷版本 |
| 4 | change event 沒觸發 | 欄位代碼拼錯（不報錯）；或欄位是 Lookup／計算欄位（本身不觸發 change） | 先 `console.log` 確認；Lookup 改監聽其複製目標欄位 |
| 5 | async submit 修改沒生效 | handler 沒加 `async`，event 在 `.then` 前被消費 | `async` handler + `await` 後才 `return event` |
| 6 | 全域變數衝突 | 多 JS 檔沒用 IIFE | 每個檔案 `(() => { ... })()` |
| 7 | 跨 App 查詢權限不足 | 使用者帳號沒有目標 App 權限 | 改用 API Token（加 `X-Cybozu-API-Token` header） |
| 8 | 批量更新部分失敗 | 單次 PUT 上限 100 筆 | 分批，每批 100 |
| 9 | cursor 逾時 / 建立失敗 | 超過 10 分鐘，或同 App 已有 10 個 cursor | 建立後立即讀取；長期批次改 seek 法 |
| 10 | `detail.show` 的 `event.record` 修改不生效 | detail 畫面是唯讀的 | 用 REST API PUT（set() 在詳情畫面也不可用） |
| 11 | `create.show` lookup 有殘留值 | 複製記錄帶入原始值 | 在 `create.show` 手動清空 |
| 12 | `disabled = true` 沒效果 | 只有特定事件支援；或漏掛某個編輯入口 | 依 P8 覆蓋 create/edit/index.edit show + change；純顯示需求用 CSS `pointer-events:none; opacity:0.6` |
| 13 | change 內拋 not allowed to return "Thenable" | change 處理函式是 async 或回傳了 Promise | 依 `references/js-api-limits.md` 第 2 節改寫 |
| 14 | 事件內呼叫 get()/set() 行為異常 | 官方明文禁止在事件處理程式內執行 | 事件內用 event.record；回呼中才用 get()/set() |
| 15 | 附件必填檢查總是判空 | 新增／編輯畫面 get() 的附件是空陣列 | 在 submit / process.proceed 的 event.record 上檢查 |
| 16 | process.proceed 跳「無權限」 | 只要 return event 就要求編輯權限 | 不需寫值就不 return；或先查權限再決定（js-api-limits.md 第 3 節） |
| 17 | 我的 process.proceed 寫值被吃掉 | 其他程式碼在後面執行且沒 return event | 全部程式碼統一「查權限再 return event」原則 |
| 18 | 子表格更新後舊列消失 | REST API PUT 子表格是整表覆寫 | 帶回原有列的 row id，見 cybozu-tw-articles.md #14 |
| 19 | like 查詢查不到明明存在的字 | like 以「詞」為單位比對，不是子字串 | 見 cybozu-tw-articles.md #31 |
| 20 | 跨 App 用記錄號碼當鍵，搬移後全亂 | 匯入／搬移後記錄號碼會變 | 自建唯一鍵欄位，見 cybozu-tw-articles.md #23 |

---

## 6. 常用事件名稱速查

| 情境 | 電腦版 | 行動版 |
|---|---|---|
| 清單頁載入 | `app.record.index.show` | `mobile.app.record.index.show` |
| 清單行內編輯開始 | `app.record.index.edit.show` | 無 |
| 清單行內編輯欄位變更 | `app.record.index.edit.change.欄位代碼` | 無 |
| 清單行內編輯存檔 | `app.record.index.edit.submit` | 無 |
| 清單行內編輯結束 | `app.record.index.edit.finish` | 無 |
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

## 常用 API 速查

### REST API（透過 kintone.api() 呼叫）

| 操作 | Method | Path |
|---|---|---|
| 取得單筆記錄 | GET | `/k/v1/record.json` |
| 取得多筆記錄 | GET | `/k/v1/records.json` |
| 新增單筆 / 多筆 | POST | `/k/v1/record.json` / `/k/v1/records.json` |
| 更新單筆 / 多筆 | PUT | `/k/v1/record.json` / `/k/v1/records.json` |
| 刪除多筆 | DELETE | `/k/v1/records.json` |
| 建立 / 讀取 cursor | POST / GET | `/k/v1/records/cursor.json` |
| 上傳 / 下載檔案 | POST / GET | `/k/v1/file.json` |
| 更新流程狀態 | PUT | `/k/v1/record/status.json` |
| 查詢執行者的記錄權限 | GET | `/k/v1/records/acl/evaluate.json` |
| 跨 App 批量請求 | POST | `/k/v1/bulkRequest.json` |

### JS API 常用方法

| 用途 | 方法 | 限制提醒 |
|---|---|---|
| 呼叫 REST API | `kintone.api(url, method, params)` | |
| 取得 API URL | `kintone.api.url('/k/v1/...', true)` | |
| 取得 App ID | `kintone.app.getId()` / `kintone.mobile.app.getId()` | |
| 取得記錄值 | `kintone.app.record.get()` | 事件處理函式內禁用；新增／編輯畫面附件回傳空陣列 |
| 設定記錄值 | `kintone.app.record.set(obj)` | 事件處理函式內禁用；僅新增／編輯畫面可用；附件不可改寫 |
| 取得空白欄位 DOM | `kintone.app.record.getSpaceElement(id)` | 行動版另有對應方法 |
| 顯示/隱藏欄位 | `kintone.app.record.setFieldShown(code, bool)` | |
| 顯示/隱藏編輯按鈕 | `kintone.app.record.showEditRecordButton(state)` | 非同步，需 await；state 為 'VISIBLE'/'HIDDEN' |
| 取得登入者 / 組織 | `kintone.getLoginUser()` / `kintone.user.getOrganizations()` | 組織查詢行動版可能回 undefined |
| 註冊 / 移除事件 | `kintone.events.on(events, handler)` / `off()` | |

---

## 7. 交付流程（每案必做）

1. **收斂需求**：確認觸發事件、欄位代碼對照表、驗證條件、裝置範圍、資料量級。缺欄位代碼時先向使用者索取，不要猜。
2. **生成程式碼**：套用第 1 節架構與第 3 節 Pattern；涉及 get/set、change、process.proceed 時先讀 `references/js-api-limits.md`。
3. **自我檢查**：跑完第 4 節檢查清單。
4. **產出三份文件**：依 `references/delivery-docs.md` 的模板產出 `CLAUDE.md`、`TECHNICAL.md`、`DESIGN-REVIEW.md`，與 .js 檔一併交付。
5. **開發日誌**（選用）：

```markdown
### [日期] App XXX - 功能名稱
**需求摘要**：一句話
**Pattern**：P1~P8
**關鍵 API**：event 名稱 + REST API path
**踩坑**：問題 → 原因 → 解法
**檔案**：filename.js
```

---

## 8. 與 AI 協作最佳實踐

### 高效提問格式

```
我在 kintone App [ID]（[功能名]）做自訂開發。

欄位代碼對照：
- [欄位名]: [欄位代碼] ([類型])

需求：[一次一個需求，明確說出觸發事件、計算規則、驗證條件]

約束：
- 驗證方式：API Token / 使用者登入
- 裝置範圍：要不要支援行動版
- 資料量級：約 N 筆（影響是否需 cursor / seek）
```

### 關鍵原則
1. **一次一個需求** — 確認沒問題再疊加下一個
2. **給欄位代碼表** — Claude 不用猜，生成的 code 可以直接用
3. **貼文件連結** — Claude 即時 fetch 最新版 API 文件，比訓練資料準確
4. **Code Review 心態** — 重點檢查：事件名稱拼寫、API method、欄位代碼、error handling、get/set 與 change 限制

---

## 9. 除錯流程

遇到 kintone 自訂功能 bug 時，依序檢查：

1. **事件名稱** — 開 DevTools Console，確認 handler 有被呼叫（加 `console.log`）。kintone 事件名拼錯不報錯。
2. **欄位代碼** — 到 kintone App 設定 → 表單 → 確認欄位代碼拼寫，注意大小寫。
3. **get/set 位置** — 事件處理函式內是否誤用 get()/set()？change 是否誤寫 async？
4. **async/await** — submit 類事件確認 handler 是 `async`，且 `return event` 在 `await` 之後。
5. **event.record vs REST API** — `detail.show` 的 `event.record` 修改不會被存檔，要改值需用 REST API。
6. **權限** — process.proceed 無權限錯誤 → 檢查 return event 與執行者編輯權限；欄位讀不到 → 可能是欄位權限導致事件物件不含該欄位。
7. **行動版** — 事件名加 `mobile.` 前綴，部分 JS API 行動版不支援。
8. **多個 handler** — 確認同一事件沒有被多次 `kintone.events.on()`，process.proceed 尤其注意競爭問題。
9. **API 錯誤代碼** — `GAIA_RE01`（記錄不存在/無權限）、`CB_AU01`（Session 過期）、`GAIA_TM12`（速率限制）。
