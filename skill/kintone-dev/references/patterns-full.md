# kintone 六大 Pattern 完整模板 + JS 基礎

## P1. 欄位聯動（change → set value）

使用者改了「數量」或「單價」→ 自動算「合計」。

```javascript
(() => {
  'use strict';

  const CONFIG = {
    TRIGGER_FIELDS: ['quantity', 'unit_price'],
    TARGET_FIELD: 'total_amount',
  };

  const calculate = (record) => {
    const qty = Number(record.quantity.value) || 0;
    const price = Number(record.unit_price.value) || 0;
    record[CONFIG.TARGET_FIELD].value = String(qty * price);
    return record;
  };

  const events = CONFIG.TRIGGER_FIELDS.flatMap((field) => [
    `app.record.create.change.${field}`,
    `app.record.edit.change.${field}`,
    `mobile.app.record.create.change.${field}`,
    `mobile.app.record.edit.change.${field}`,
  ]);

  kintone.events.on(events, (event) => {
    event.record = calculate(event.record);
    return event;
  });
})();
```

---

## P2. 跨 App 查詢 + 渲染

詳情頁顯示時，從另一個 App 拉取關聯資料並渲染到空白欄位。

```javascript
(() => {
  'use strict';

  const CONFIG = {
    SOURCE_APP: 450,
    LOOKUP_FIELD: 'supplier_code',
    SOURCE_KEY_FIELD: 'sup_code',
    DISPLAY_FIELDS: ['sup_quality_score', 'sup_eval_date'],
    SPACE_ELEMENT_ID: 'related_data',
  };

  const fetchRelatedRecords = async (keyValue) => {
    if (!keyValue) return [];
    const query = `${CONFIG.SOURCE_KEY_FIELD} = "${keyValue}" order by $id desc limit 100`;
    const resp = await kintone.api(
      kintone.api.url('/k/v1/records.json', true), 'GET',
      { app: CONFIG.SOURCE_APP, query, fields: [CONFIG.SOURCE_KEY_FIELD, ...CONFIG.DISPLAY_FIELDS] },
    );
    return resp.records;
  };

  const renderToSpace = (records, spaceId) => {
    const el = kintone.app.record.getSpaceElement(spaceId);
    if (!el) return;
    if (records.length === 0) {
      el.textContent = '查無關聯資料';
      return;
    }
    el.innerHTML = records.map((r) => `
      <div style="padding:8px; border-bottom:1px solid #eee;">
        ${CONFIG.DISPLAY_FIELDS.map((f) => r[f]?.value || '—').join(' / ')}
      </div>
    `).join('');
  };

  kintone.events.on(
    ['app.record.detail.show', 'mobile.app.record.detail.show'],
    async (event) => {
      const keyValue = event.record[CONFIG.LOOKUP_FIELD].value;
      const records = await fetchRelatedRecords(keyValue);
      renderToSpace(records, CONFIG.SPACE_ELEMENT_ID);
      return event;
    },
  );
})();
```

---

## P3. 批量操作（cursor 全量獲取 + 逐批更新）

```javascript
(() => {
  'use strict';

  const getAllRecords = async (app, query = '', fields = []) => {
    const records = [];
    const body = { app, query, size: 500 };
    if (fields.length > 0) body.fields = fields;

    const { id } = await kintone.api(
      kintone.api.url('/k/v1/records/cursor.json', true), 'POST', body,
    );

    try {
      while (true) {
        const resp = await kintone.api(
          kintone.api.url('/k/v1/records/cursor.json', true), 'GET', { id },
        );
        records.push(...resp.records);
        if (!resp.next) break;
      }
    } catch (err) {
      try {
        await kintone.api(kintone.api.url('/k/v1/records/cursor.json', true), 'DELETE', { id });
      } catch { /* ignore */ }
      throw err;
    }

    return records;
  };

  const bulkUpdate = async (app, records, buildUpdateBody) => {
    const BATCH_SIZE = 100;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await kintone.api(
        kintone.api.url('/k/v1/records.json', true), 'PUT',
        { app, records: batch.map(buildUpdateBody) },
      );
    }
  };

  // 使用範例：
  // const records = await getAllRecords(639, 'status = "未處理"');
  // await bulkUpdate(639, records, (rec) => ({
  //   id: rec.$id.value,
  //   record: { status: { value: '處理中' } },
  // }));
})();
```

---

## P4. 權限控制（show → setFieldShown）

根據登入者組織或記錄狀態控制欄位顯示/可編輯。

```javascript
(() => {
  'use strict';

  const CONFIG = {
    COST_VISIBLE_ORGS: ['財務部', '經營企劃部'],
    COST_FIELDS: ['unit_cost', 'total_cost', 'margin_rate'],
    LOCK_AFTER_APPROVED: ['quantity', 'unit_price', 'delivery_date'],
    APPROVED_STATUS: '已核准',
  };

  kintone.events.on(
    ['app.record.detail.show', 'app.record.edit.show',
     'mobile.app.record.detail.show', 'mobile.app.record.edit.show'],
    (event) => {
      // 組織判斷（行動版 getOrganizations 可能 undefined）
      const userOrgs = (kintone.user.getOrganizations?.() || []).map((o) => o.name);
      const canSeeCost = CONFIG.COST_VISIBLE_ORGS.some((org) => userOrgs.includes(org));
      CONFIG.COST_FIELDS.forEach((field) => {
        kintone.app.record.setFieldShown(field, canSeeCost);
      });

      // 狀態鎖定
      if (event.record.Status?.value === CONFIG.APPROVED_STATUS) {
        CONFIG.LOCK_AFTER_APPROVED.forEach((field) => {
          event.record[field].disabled = true;
        });
        if (event.type.includes('detail')) {
          CONFIG.LOCK_AFTER_APPROVED.forEach((code) => {
            const el = kintone.app.record.getFieldElement(code);
            if (el) { el.style.pointerEvents = 'none'; el.style.opacity = '0.6'; }
          });
        }
      }
      return event;
    },
  );
})();
```

---

## P5. 流程管理（process.proceed → 條件判斷 + 自動設值）

```javascript
(() => {
  'use strict';

  const CONFIG = {
    ACTION_RULES: {
      '提交審核': {
        requiredFields: ['quantity', 'unit_price', 'delivery_date'],
        autoSet: { submit_datetime: () => new Date().toISOString() },
      },
      '核准': {
        requiredFields: ['approver_comment'],
        autoSet: { approved_datetime: () => new Date().toISOString() },
        allowedOrgs: ['部長', '課長'],
      },
      '退回': {
        requiredFields: ['reject_reason'],
        autoSet: {},
      },
    },
  };

  const safeHandler = (fn) => async (event) => {
    try { return await fn(event); }
    catch (err) { console.error('[process]', err); event.error = `錯誤：${err.message}`; return event; }
  };

  kintone.events.on(
    ['app.record.detail.process.proceed', 'mobile.app.record.detail.process.proceed'],
    safeHandler(async (event) => {
      const rules = CONFIG.ACTION_RULES[event.action.value];
      if (!rules) return event;

      // 驗證必填
      const empty = rules.requiredFields.filter((f) => !event.record[f]?.value);
      if (empty.length) { event.error = `必填：${empty.join(', ')}`; return event; }

      // 驗證組織權限
      if (rules.allowedOrgs) {
        const orgs = (kintone.user.getOrganizations?.() || []).map((o) => o.name);
        if (!rules.allowedOrgs.some((t) => orgs.includes(t))) {
          event.error = '您的職稱沒有權限執行此操作';
          return event;
        }
      }

      // 自動設值（DATETIME 用 ISO 8601）
      Object.entries(rules.autoSet).forEach(([field, fn]) => {
        if (event.record[field]) event.record[field].value = fn();
      });

      return event;
    }),
  );
})();
```

---

## P6. 表單驗證（submit → 單一入口 + 重複檢查）

```javascript
(() => {
  'use strict';

  const CONFIG = Object.freeze({
    APP_ID: kintone.app.getId(),
    REQUIRED_FIELDS: ['supplier_code', 'check_qty', 'defect_qty'],
    MAX_DEFECT_RATE: 30,
    SUPPLIER_APP_ID: 100,
    DUPLICATE_CHECK: {
      KEY_FIELD: 'supplier_code',
      RULES: {
        '年度定期更新': {
          additionalQuery: () => ` and update_year = "${new Date().getFullYear()}"`,
          errorMessage: '該供應商本年度已有更新記錄',
        },
        '恢復': {
          additionalQuery: () => ' and status = "有效"',
          errorMessage: '該供應商目前狀態為有效，無需恢復',
        },
      },
    },
  });

  let isSubmitting = false;

  const safeHandler = (fn) => async (event) => {
    try { return await fn(event); }
    catch (err) { console.error('[submit]', err); event.error = `系統錯誤：${err.message}`; return event; }
  };

  kintone.events.on(
    ['app.record.create.submit', 'app.record.edit.submit',
     'mobile.app.record.create.submit', 'mobile.app.record.edit.submit'],
    safeHandler(async (event) => {
      if (isSubmitting) { event.error = '處理中...'; return event; }
      isSubmitting = true;

      try {
        const record = event.record;

        // Step 1: 必填驗證
        for (const field of CONFIG.REQUIRED_FIELDS) {
          if (!record[field]?.value) {
            event.error = `「${field}」為必填`;
            return event;
          }
        }

        // Step 2: 數值驗證
        const checkQty = Number(record.check_qty.value) || 0;
        const defectQty = Number(record.defect_qty.value) || 0;
        const defectRate = checkQty === 0 ? 0 : (defectQty / checkQty) * 100;
        record.defect_rate.value = defectRate.toFixed(2);

        if (defectRate > CONFIG.MAX_DEFECT_RATE) {
          event.error = `不良率 ${defectRate.toFixed(2)}% 超過上限 ${CONFIG.MAX_DEFECT_RATE}%`;
          return event;
        }

        // Step 3: 重複檢查（Strategy Pattern）
        const actionType = record.action_type?.value;
        const rule = CONFIG.DUPLICATE_CHECK.RULES[actionType];
        if (rule) {
          const keyValue = record[CONFIG.DUPLICATE_CHECK.KEY_FIELD]?.value;
          if (keyValue) {
            let query = `${CONFIG.DUPLICATE_CHECK.KEY_FIELD} = "${keyValue}"${rule.additionalQuery()}`;
            const recordId = kintone.app.record.getId();
            if (recordId) query += ` and $id != "${recordId}"`;

            const resp = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
              app: CONFIG.APP_ID, query, fields: ['$id'], totalCount: true,
            });
            if (resp.totalCount !== '0') {
              event.error = rule.errorMessage;
              return event;
            }
          }
        }

        return event;
      } finally {
        isSubmitting = false;
      }
    }),
  );
})();
```

---

## JavaScript 基礎深化

### A. Closure & IIFE

多個 JS 檔的全域變數會互相覆蓋。IIFE 建立獨立作用域：

```javascript
// ❌ 危險：var CONFIG 在全域，檔案 B 會覆蓋檔案 A
var CONFIG = { APP_ID: 100 }; // 檔案 A
var CONFIG = { APP_ID: 200 }; // 檔案 B → 覆蓋！

// ✅ 安全：每個檔案獨立 scope
(() => { const CONFIG = { APP_ID: 100 }; /* ... */ })();
(() => { const CONFIG = { APP_ID: 200 }; /* 不衝突 */ })();
```

### B. Event Loop & async/await

```javascript
// ❌ Bug：.then() 裡的修改在 return event 之後才執行
kintone.events.on('app.record.create.submit', (event) => {
  kintone.api('/k/v1/records.json', 'GET', { app: 100 })
    .then((resp) => { event.record.field.value = resp.records[0].value; });
  return event; // ← 比 .then() 先執行！
});

// ✅ 正確：async handler + await
kintone.events.on('app.record.create.submit', async (event) => {
  const resp = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', { app: 100 });
  event.record.field.value = resp.records[0]?.field?.value;
  return event; // ← await 之後才 return
});
```

### C. Error Handling

```javascript
// ❌ 沒有 try-catch → API 失敗時整個 handler 中斷，使用者看不到錯誤
// ✅ safeHandler 包裝（見核心架構規範）

// REST API 常見錯誤代碼：
// GAIA_RE01 → 記錄不存在或無權限
// CB_AU01   → Session 過期，需重新登入
// GAIA_TM12 → API 速率限制
```

### D. Observer Pattern（解耦多模組）

一個 App 有多個獨立功能模組時，用自訂 EventBus 解耦：

```javascript
const AppEventBus = (() => {
  const listeners = {};
  return {
    on(name, cb) { (listeners[name] ??= []).push(cb); },
    async emit(name, data) { await Promise.all((listeners[name] || []).map(cb => cb(data))); },
  };
})();

// 模組 A（不知道模組 B 的存在）
AppEventBus.on('detail-ready', async ({ record }) => { renderScoreCards(record); });
// 模組 B
AppEventBus.on('detail-ready', async ({ record }) => { controlFieldVisibility(record); });

// 統一入口
kintone.events.on('app.record.detail.show', safeHandler(async (event) => {
  await AppEventBus.emit('detail-ready', { record: event.record });
  return event;
}));
```

### E. Strategy Pattern（CONFIG 驅動）

不同「動作類型」有不同處理邏輯時，用 Strategy 取代 if-else：

```javascript
const strategies = {
  '年度定期更新': {
    validate: (r) => r.inspection_date.value ? null : '請填寫檢查日期',
    transform: (r) => { r.update_year.value = String(new Date().getFullYear()); return r; },
  },
  '恢復': {
    validate: (r) => r.restore_reason.value ? null : '請填寫恢復原因',
    transform: (r) => { r.status.value = '有效'; r.restored_at.value = new Date().toISOString(); return r; },
  },
};

kintone.events.on('app.record.create.submit', safeHandler(async (event) => {
  const strategy = strategies[event.record.action_type.value];
  if (!strategy) return event;
  const error = strategy.validate(event.record);
  if (error) { event.error = error; return event; }
  event.record = strategy.transform(event.record);
  return event;
}));
```
