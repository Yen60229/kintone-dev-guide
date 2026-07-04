# kintone 八大 Pattern 完整模板 + JS 基礎

> **P7(欄位顯示控制)、P8(欄位禁用控制)的完整程式碼已在 SKILL.md 第 3 節**,本檔不重複收錄;此處為 P1~P6 的完整版。
>
> 所有模板一律放進 SKILL.md 第 1 節的 IIFE 骨架內使用:`CONFIG`(含 `FIELDS`)、`codeOf()`、`safeHandler()` 皆定義於該骨架,以下程式碼不再重複宣告。
>
> 鐵律回顧(細節見 `references/js-api-limits.md`):
> - 事件處理函式本體內禁止呼叫 `kintone.app.record.get()` / `set()`,一律用 `event.record`
> - change 事件的處理函式不可 async、不可回傳 Promise
> - 欄位讀取一律可選串連+預設值:`record[code]?.value || ''`(欄位可能因改名、刪除、無權限而不存在)

## P1. 欄位聯動(change → 同步計算 event.record)

使用者改了「數量」或「單價」→ 自動算「合計」。處理函式**保持同步**。

```javascript
const CONFIG = Object.freeze({
  FIELDS: Object.freeze({
    QTY: 'quantity',
    PRICE: 'unit_price',
    TOTAL: 'total_amount',
  }),
  TRIGGER_KEYS: ['QTY', 'PRICE'],   // 這些欄位變動時重算
});

// change 處理函式必須保持同步;計算邏輯抽成共用函式,show 事件也能掛同一份
const calculate = (record) => {
  const qty = Number(record[codeOf('QTY')]?.value) || 0;
  const price = Number(record[codeOf('PRICE')]?.value) || 0;
  if (record[codeOf('TOTAL')]) record[codeOf('TOTAL')].value = String(qty * price);
};

const events = CONFIG.TRIGGER_KEYS.flatMap((key) => [
  `app.record.create.change.${codeOf(key)}`,
  `app.record.edit.change.${codeOf(key)}`,
  `mobile.app.record.create.change.${codeOf(key)}`,
  `mobile.app.record.edit.change.${codeOf(key)}`,
]);

kintone.events.on(events, (event) => {
  calculate(event.record);
  return event;
});
```

注意:
- **開啟既有記錄不會觸發 change**。若載入畫面時也要重算一次,把 `calculate` 同時掛在 `create.show` / `edit.show`(同 P7 的共用函式作法)。
- **Lookup 與計算欄位本身不觸發 change**,要監聽其複製目標欄位。
- change 內必須呼叫 API 時,依 `references/js-api-limits.md` 第 2 節的 `.then()` / `setTimeout` 寫法,且回呼內改用 get()+set()。

---

## P2. 跨 App 查詢 + 渲染(detail.show → REST API → 空白欄位)

詳情頁顯示時,從另一個 App 拉取關聯資料並渲染到空白欄位。

```javascript
const CONFIG = Object.freeze({
  SOURCE_APP: 450,
  FIELDS: Object.freeze({
    LOOKUP: 'supplier_code',
  }),
  SOURCE_KEY_FIELD: 'sup_code',
  DISPLAY_FIELDS: ['sup_quality_score', 'sup_eval_date'],
  SPACE_ELEMENT_ID: 'related_data',
});

// 進 query 的值一律跳脫雙引號,避免值本身含引號時查詢語法被破壞
const escapeQuery = (v) => String(v).replace(/"/g, '\\"');

const fetchRelatedRecords = async (keyValue) => {
  if (!keyValue) return [];
  const resp = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
    app: CONFIG.SOURCE_APP,
    query: `${CONFIG.SOURCE_KEY_FIELD} = "${escapeQuery(keyValue)}" order by $id desc limit 100`,
    fields: [CONFIG.SOURCE_KEY_FIELD, ...CONFIG.DISPLAY_FIELDS],  // 欄位白名單,不撈全欄位
  });
  return resp.records;
};

// 用 DOM API + textContent 組裝:欄位值不經過 innerHTML,從根本杜絕 XSS
const renderToSpace = (records, spaceEl) => {
  spaceEl.replaceChildren();
  if (records.length === 0) {
    spaceEl.textContent = '查無關聯資料';
    return;
  }
  records.forEach((r) => {
    const row = document.createElement('div');
    row.style.cssText = 'padding:8px; border-bottom:1px solid #eee;';
    row.textContent = CONFIG.DISPLAY_FIELDS.map((f) => r[f]?.value || '—').join(' / ');
    spaceEl.appendChild(row);
  });
};

kintone.events.on(['app.record.detail.show', 'mobile.app.record.detail.show'],
  safeHandler(async (event) => {
    // 空白欄位的取得要依裝置切換 API
    const api = event.type.startsWith('mobile.') ? kintone.mobile.app.record : kintone.app.record;
    const spaceEl = api.getSpaceElement?.(CONFIG.SPACE_ELEMENT_ID);
    if (!spaceEl) return event;   // 版面沒放空白欄位時靜默跳過

    const records = await fetchRelatedRecords(event.record[codeOf('LOOKUP')]?.value);
    renderToSpace(records, spaceEl);
    return event;
  })
);
```

若必須渲染 HTML(例如富文本內容),先用 `DOMPurify.sanitize()` 過濾再 `innerHTML`,見 `references/security-guide.md` 第 3 節。

---

## P3. 批量操作(cursor 全量獲取 + 逐批更新)

> **適用前提**:結果集必須「整批拿到才能處理」且量級可控(約 2,000 筆內)。
> 只是彙總統計、或量級更大時,**不要全量堆積**——改用 `references/performance-guide.md` 的串流 DAO(邊抓邊算邊丟)。8GB 機器上全量 `push` 是白畫面崩潰的主因。

```javascript
// 全量獲取(cursor,無 500 筆上限)
// 限制:同一 App 同時最多 10 個 cursor、10 分鐘逾時,建立後要立即讀完。
// 長期批次或可能超限時,改用 seek 法($id 條件分頁),見 cybozu-tw-articles.md #13。
const getAllRecords = async (app, query = '', fields = []) => {
  if (!fields.length) throw new Error('請指定 fields 白名單,避免撈全欄位吃光記憶體');
  const { id } = await kintone.api(
    kintone.api.url('/k/v1/records/cursor.json', true), 'POST',
    { app, query, size: 500, fields },
  );

  const records = [];
  try {
    while (true) {
      const resp = await kintone.api(
        kintone.api.url('/k/v1/records/cursor.json', true), 'GET', { id },
      );
      records.push(...resp.records);
      if (!resp.next) break;
    }
  } catch (err) {
    // 中途失敗要主動刪 cursor,不然占用 10 個上限的名額直到逾時
    try {
      await kintone.api(kintone.api.url('/k/v1/records/cursor.json', true), 'DELETE', { id });
    } catch { /* cursor 可能已自動刪除 */ }
    throw err;
  }
  return records;
};

// 逐批更新(REST API PUT 單次上限 100 筆;批間節流避免 GAIA_TM12 速率限制)
const bulkUpdate = async (app, records, buildUpdateBody, { throttleMs = 200 } = {}) => {
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await kintone.api(
      kintone.api.url('/k/v1/records.json', true), 'PUT',
      { app, records: batch.map(buildUpdateBody) },
    );
    if (i + BATCH_SIZE < records.length) await new Promise((r) => setTimeout(r, throttleMs));
  }
};

// 使用範例:
// const records = await getAllRecords(639, 'status = "未處理"', ['$id', 'status']);
// await bulkUpdate(639, records, (rec) => ({
//   id: rec.$id.value,
//   record: { status: { value: '處理中' } },
// }));
```

---

## P4. 權限控制(show → setFieldShown)

根據登入者組織或記錄狀態控制欄位顯示/可編輯。

```javascript
const CONFIG = Object.freeze({
  FIELDS: Object.freeze({
    STATUS: 'Status',
    UNIT_COST: 'unit_cost',
    TOTAL_COST: 'total_cost',
    MARGIN: 'margin_rate',
    QTY: 'quantity',
    PRICE: 'unit_price',
    DELIVERY: 'delivery_date',
  }),
  COST_VISIBLE_ORGS: ['財務部', '經營企劃部'],
  COST_FIELD_KEYS: ['UNIT_COST', 'TOTAL_COST', 'MARGIN'],
  LOCK_AFTER_APPROVED_KEYS: ['QTY', 'PRICE', 'DELIVERY'],
  APPROVED_STATUS: '已核准',
});

kintone.events.on(
  ['app.record.detail.show', 'app.record.edit.show',
   'mobile.app.record.detail.show', 'mobile.app.record.edit.show'],
  (event) => {
    // 綁了 mobile 事件,API 也要跟著切換,否則行動版整段靜默失效
    const isMobile = event.type.startsWith('mobile.');
    const api = isMobile ? kintone.mobile.app.record : kintone.app.record;

    // 組織判斷:行動版 getOrganizations 可能不存在或回 undefined,需 fallback
    const userOrgs = (kintone.user?.getOrganizations?.() || []).map((o) => o.name);
    const canSeeCost = CONFIG.COST_VISIBLE_ORGS.some((org) => userOrgs.includes(org));
    CONFIG.COST_FIELD_KEYS.forEach((key) => api.setFieldShown(codeOf(key), canSeeCost));

    // 狀態鎖定:已核准後鎖住關鍵欄位(disabled 只在可編輯的畫面有意義)
    if (event.record[codeOf('STATUS')]?.value === CONFIG.APPROVED_STATUS) {
      CONFIG.LOCK_AFTER_APPROVED_KEYS.forEach((key) => {
        if (event.record[codeOf(key)]) event.record[codeOf(key)].disabled = true;
      });
    }
    return event;
  },
);
```

注意:
- **前端隱藏只是「看不到」**,資料仍可經 API 或列印畫面取得。真正的存取控制要用 kintone 原生的「欄位存取權限」設定;JS 隱藏只當使用體驗的補強。
- 禁用要覆蓋所有編輯入口(含清單行內編輯),完整作法見 SKILL.md 第 3 節 P8。

---

## P5. 流程管理(process.proceed → 條件判斷 + 自動設值)

```javascript
const CONFIG = Object.freeze({
  FIELDS: Object.freeze({
    QTY: 'quantity',
    PRICE: 'unit_price',
    DELIVERY: 'delivery_date',
    SUBMIT_AT: 'submit_datetime',
    APPROVE_COMMENT: 'approver_comment',
    APPROVED_AT: 'approved_datetime',
    REJECT_REASON: 'reject_reason',
  }),
  ACTION_RULES: Object.freeze({
    提交審核: {
      requiredKeys: ['QTY', 'PRICE', 'DELIVERY'],
      autoSet: { SUBMIT_AT: () => new Date().toISOString() },
    },
    核准: {
      requiredKeys: ['APPROVE_COMMENT'],
      autoSet: { APPROVED_AT: () => new Date().toISOString() },
      allowedOrgs: ['部長', '課長'],
    },
    退回: {
      requiredKeys: ['REJECT_REASON'],
      autoSet: {},
    },
  }),
});

kintone.events.on(
  ['app.record.detail.process.proceed', 'mobile.app.record.detail.process.proceed'],
  safeHandler(async (event) => {
    const rules = CONFIG.ACTION_RULES[event.action.value];
    // 無規則的動作不 return event:一 return 就要求執行者具備編輯權限(js-api-limits.md 第 3 節)
    if (!rules) return;

    // 必填驗證(設 event.error 並 return event 會中斷動作;執行者需編輯權限,流程設計時要確認)
    const empty = rules.requiredKeys
      .filter((key) => !event.record[codeOf(key)]?.value)
      .map((key) => codeOf(key));
    if (empty.length) {
      event.error = `無法執行「${event.action.value}」,請先填寫:${empty.join('、')}`;
      return event;
    }

    // 組織權限驗證
    if (rules.allowedOrgs) {
      const orgs = (kintone.user?.getOrganizations?.() || []).map((o) => o.name);
      if (!rules.allowedOrgs.some((t) => orgs.includes(t))) {
        event.error = '您沒有權限執行此動作';
        return event;
      }
    }

    // 自動設值(DATETIME 用 ISO 8601)
    const hasAutoSet = Object.keys(rules.autoSet).length > 0;
    Object.entries(rules.autoSet).forEach(([key, fn]) => {
      if (event.record[codeOf(key)]) event.record[codeOf(key)].value = fn();
    });

    // 需要寫值才 return event。若此 App 可能與其他客製化程式或外掛並存,
    // 改採「先查權限再決定是否 return」的完整寫法,見 js-api-limits.md 第 3 節。
    return hasAutoSet ? event : undefined;
  }),
);
```

附件防呆(必填附件)要在 `event.record` 上檢查,完整範例見 SKILL.md 第 3 節 P5 與 `references/js-api-limits.md` 第 3 節。

---

## P6. 表單驗證(submit → 單一入口 + 重複檢查)

```javascript
const CONFIG = Object.freeze({
  APP_ID: kintone.app.getId(),
  FIELDS: Object.freeze({
    SUPPLIER: 'supplier_code',
    CHECK_QTY: 'check_qty',
    DEFECT_QTY: 'defect_qty',
    DEFECT_RATE: 'defect_rate',
    ACTION_TYPE: 'action_type',
  }),
  REQUIRED_KEYS: ['SUPPLIER', 'CHECK_QTY', 'DEFECT_QTY'],
  MAX_DEFECT_RATE: 30,
  // 重複檢查規則(Strategy:依動作類型切換查詢條件)
  DUPLICATE_RULES: Object.freeze({
    年度定期更新: {
      additionalQuery: () => ` and update_year = "${new Date().getFullYear()}"`,
      errorMessage: '該供應商本年度已有更新記錄',
    },
    恢復: {
      additionalQuery: () => ' and status = "有效"',
      errorMessage: '該供應商目前狀態為有效,無需恢復',
    },
  }),
});

const escapeQuery = (v) => String(v).replace(/"/g, '\\"');

let isSubmitting = false;

kintone.events.on(
  ['app.record.create.submit', 'app.record.edit.submit',
   'mobile.app.record.create.submit', 'mobile.app.record.edit.submit'],
  safeHandler(async (event) => {
    if (isSubmitting) { event.error = '處理中,請勿重複送出'; return event; }
    isSubmitting = true;
    try {
      const r = event.record;

      // Step 1:必填驗證(錯誤標在欄位下方,總訊息集中在 event.error)
      const empty = CONFIG.REQUIRED_KEYS.filter((key) => !r[codeOf(key)]?.value);
      empty.forEach((key) => { if (r[codeOf(key)]) r[codeOf(key)].error = '此欄位必填'; });
      if (empty.length) {
        event.error = '尚有必填項目未完成,請依欄位下方的紅字提示補齊。';
        return event;
      }

      // Step 2:跨欄位數值驗證
      const checkQty = Number(r[codeOf('CHECK_QTY')]?.value) || 0;
      const defectQty = Number(r[codeOf('DEFECT_QTY')]?.value) || 0;
      const defectRate = checkQty === 0 ? 0 : (defectQty / checkQty) * 100;
      if (r[codeOf('DEFECT_RATE')]) r[codeOf('DEFECT_RATE')].value = defectRate.toFixed(2);
      if (defectRate > CONFIG.MAX_DEFECT_RATE) {
        event.error = `不良率 ${defectRate.toFixed(2)}% 超過上限 ${CONFIG.MAX_DEFECT_RATE}%`;
        return event;
      }

      // Step 3:非同步重複檢查(submit 支援 async/await;totalCount 回傳是字串)
      const rule = CONFIG.DUPLICATE_RULES[r[codeOf('ACTION_TYPE')]?.value];
      const keyValue = r[codeOf('SUPPLIER')]?.value;
      if (rule && keyValue) {
        const isMobile = event.type.startsWith('mobile.');
        const recordId = isMobile ? kintone.mobile.app.record.getId() : kintone.app.record.getId();
        let query = `${codeOf('SUPPLIER')} = "${escapeQuery(keyValue)}"${rule.additionalQuery()}`;
        if (recordId) query += ` and $id != "${recordId}"`;   // 編輯既有記錄時排除自己

        const resp = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
          app: CONFIG.APP_ID, query, fields: ['$id'], totalCount: true,
        });
        if (resp.totalCount !== '0') {
          event.error = rule.errorMessage;
          return event;
        }
      }

      return event;
    } finally {
      isSubmitting = false;
    }
  }),
);
```

重點:**同一個 submit 事件只綁一次**,多個 handler 會全部執行且 return 行為互相干擾(見 security-guide 第 1 節)。

---

## JavaScript 基礎深化

### A. Closure & IIFE

多個 JS 檔的全域變數會互相覆蓋。IIFE 建立獨立作用域:

```javascript
// ❌ 危險:var CONFIG 在全域,檔案 B 會覆蓋檔案 A
var CONFIG = { APP_ID: 100 }; // 檔案 A
var CONFIG = { APP_ID: 200 }; // 檔案 B → 覆蓋!

// ✅ 安全:每個檔案獨立 scope
(() => { const CONFIG = { APP_ID: 100 }; /* ... */ })();
(() => { const CONFIG = { APP_ID: 200 }; /* 不衝突 */ })();
```

### B. Event Loop & async/await

```javascript
// ❌ Bug:.then() 裡的修改在 return event 之後才執行
kintone.events.on('app.record.create.submit', (event) => {
  kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', { app: 100 })
    .then((resp) => { event.record.field.value = resp.records[0]?.field?.value; });
  return event; // ← 比 .then() 先執行!
});

// ✅ 正確:async handler + await(僅限 submit / process.proceed 等支援 Promise 的事件;change 不可)
kintone.events.on('app.record.create.submit', async (event) => {
  const resp = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', { app: 100 });
  event.record.field.value = resp.records[0]?.field?.value || '';
  return event; // ← await 之後才 return
});
```

### C. Error Handling

```javascript
// ❌ 沒有 try-catch → API 失敗時整個 handler 中斷,使用者看不到錯誤
// ✅ safeHandler 包裝(見 SKILL.md 第 1 節核心架構規範)

// REST API 常見錯誤代碼:
// GAIA_RE01 → 記錄不存在或無權限
// CB_AU01   → Session 過期,需重新登入
// GAIA_TM12 → API 速率限制
```

### D. Observer Pattern(降低多模組相依)

一個 App 有多個獨立功能模組時,用自訂 EventBus 讓模組互不相識:

```javascript
const AppEventBus = (() => {
  const listeners = {};
  return {
    on(name, cb) { (listeners[name] ??= []).push(cb); },
    async emit(name, data) { await Promise.all((listeners[name] || []).map(cb => cb(data))); },
  };
})();

// 模組 A(不知道模組 B 的存在)
AppEventBus.on('detail-ready', async ({ record }) => { renderScoreCards(record); });
// 模組 B
AppEventBus.on('detail-ready', async ({ record }) => { controlFieldVisibility(record); });

// 統一入口
kintone.events.on('app.record.detail.show', safeHandler(async (event) => {
  await AppEventBus.emit('detail-ready', { record: event.record });
  return event;
}));
```

### E. Strategy Pattern(CONFIG 驅動)

不同「動作類型」有不同處理邏輯時,用 Strategy 取代連續 if-else:

```javascript
const strategies = {
  '年度定期更新': {
    validate: (r) => r[codeOf('INSPECTION_DATE')]?.value ? null : '請填寫檢查日期',
    transform: (r) => { r[codeOf('UPDATE_YEAR')].value = String(new Date().getFullYear()); return r; },
  },
  '恢復': {
    validate: (r) => r[codeOf('RESTORE_REASON')]?.value ? null : '請填寫恢復原因',
    transform: (r) => { r[codeOf('STATUS')].value = '有效'; r[codeOf('RESTORED_AT')].value = new Date().toISOString(); return r; },
  },
};

kintone.events.on('app.record.create.submit', safeHandler(async (event) => {
  const strategy = strategies[event.record[codeOf('ACTION_TYPE')]?.value];
  if (!strategy) return event;
  const error = strategy.validate(event.record);
  if (error) { event.error = error; return event; }
  event.record = strategy.transform(event.record);
  return event;
}));
```
