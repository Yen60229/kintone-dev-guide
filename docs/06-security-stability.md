# kintone 開發：安全性與穩定性指南

> 整理日期：2026-04-30  
> 涵蓋：真實開發中踩過的坑、FAANG 等級的防禦性設計原則、kintone 特有的陷阱  

---

## 目錄

- [1. Submit Handler 覆蓋問題](#1-submit-handler-覆蓋問題)
- [2. 事件處理器的穩定性陷阱](#2-事件處理器的穩定性陷阱)
- [3. XSS 防護](#3-xss-防護)
- [4. API Token 安全](#4-api-token-安全)
- [5. Race Condition（非同步競爭）](#5-race-condition非同步競爭)
- [6. 行動版相容性](#6-行動版相容性)
- [7. 錯誤處理模式](#7-錯誤處理模式)
- [8. 快速檢查清單](#8-快速檢查清單)

---

## 1. Submit Handler 覆蓋問題

### 問題描述

這是 kintone 開發中最常見的隱性 bug。當多個 JS 檔案（或同一個檔案的多個地方）都對同一個 submit 事件註冊 handler 時，**後面的 handler 不會覆蓋前面的，而是全部都會執行**，但 return 值的行為可能互相干擾。

```javascript
// ❌ 危險：在多個地方分別綁定同一個 submit 事件

// 第一個 handler（可能在某個 if 條件裡）
kintone.events.on('app.record.edit.submit', (event) => {
  event.record.total.value = calculate();
  return event;
});

// 第二個 handler（可能在同一個 IIFE 的另一段）
kintone.events.on('app.record.edit.submit', (event) => {
  if (!validateRequired(event.record)) {
    event.error = '必填欄位未填寫';
    return event;  // ← 這個 return false / error 可能被第一個 handler 的 return 覆蓋
  }
  return event;
});
```

**實際發生的問題：**
- 驗證失敗時，record 仍被存檔（第一個 handler 先 return 了正常的 event）
- 計算邏輯跑了兩次
- 不確定哪個 handler 的 return 值生效

### 正確做法：單一入口，集中分派

```javascript
// ✅ 正確：只綁一次，內部分工

(() => {
  'use strict';

  const CONFIG = {
    REQUIRED_FIELDS: ['supplier_code', 'check_qty'],
    MAX_DEFECT_RATE: 30,
  };

  // 唯一的 submit handler
  kintone.events.on(
    ['app.record.edit.submit', 'app.record.create.submit'],
    async (event) => {
      const record = event.record;

      // Step 1: 計算
      record.total.value = String(
        Number(record.qty.value) * Number(record.price.value)
      );

      // Step 2: 驗證（驗證失敗直接 return，不繼續）
      const validationError = validateRecord(record);
      if (validationError) {
        event.error = validationError;
        return event;
      }

      // Step 3: 非同步查詢（如有需要）
      try {
        await enrichRecord(record);
      } catch (err) {
        event.error = `資料查詢失敗：${err.message}`;
        return event;
      }

      return event;
    }
  );

  const validateRecord = (record) => {
    for (const field of CONFIG.REQUIRED_FIELDS) {
      if (!record[field]?.value) {
        return `「${field}」為必填欄位`;
      }
    }
    if (Number(record.defect_rate?.value) > CONFIG.MAX_DEFECT_RATE) {
      return `不良率超過 ${CONFIG.MAX_DEFECT_RATE}%，請確認是否正確`;
    }
    return null; // 驗證通過
  };

  const enrichRecord = async (record) => {
    // 跨 App 查詢等非同步操作
  };
})();
```

### 防止重複提交（Double Submit）

```javascript
// ✅ 用 flag 防止使用者連點導致重複送出

(() => {
  'use strict';

  let isSubmitting = false;

  kintone.events.on('app.record.edit.submit', async (event) => {
    if (isSubmitting) {
      event.error = '正在處理中，請稍候...';
      return event;
    }

    isSubmitting = true;
    try {
      // 你的邏輯...
      return event;
    } finally {
      isSubmitting = false;
    }
  });
})();
```

---

## 2. 事件處理器的穩定性陷阱

### 事件名稱拼錯（靜默失效）

kintone **不會報錯**，只是什麼都不發生。

```javascript
// ❌ 這些都會靜默失效（不報錯）
kintone.events.on('app.record.edit.Save', handler);   // 大小寫錯
kintone.events.on('record.edit.submit', handler);      // 少了 app
kintone.events.on('app.record.edit.submit.success', handler); // 多了 .success
```

**正確的事件名稱：**

| 情境 | 事件名稱 |
|------|---------|
| 新增畫面存檔前 | `app.record.create.submit` |
| 新增畫面存檔成功後 | `app.record.create.submit.success` |
| 編輯畫面存檔前 | `app.record.edit.submit` |
| 編輯畫面存檔成功後 | `app.record.edit.submit.success` |
| 欄位變更 | `app.record.edit.change.欄位代碼` |
| 流程動作前 | `app.record.detail.process.proceed` |

### 在不適合的事件修改 record

```javascript
// ❌ 在 detail.show 修改 record 的值不會被存檔
kintone.events.on('app.record.detail.show', (event) => {
  event.record.status.value = 'done'; // 不會存到 kintone
  return event;
});

// ✅ 要存檔必須用 REST API
kintone.events.on('app.record.detail.show', async (event) => {
  await kintone.api('/k/v1/record', 'PUT', {
    app: kintone.app.getId(),
    id: kintone.app.record.getId(),
    record: { status: { value: 'done' } },
  });
});
```

---

## 3. XSS 防護

### 禁止直接插入 innerHTML

```javascript
// ❌ XSS 漏洞：使用者輸入直接插入 DOM
kintone.events.on('app.record.detail.show', (event) => {
  const el = kintone.app.record.getSpaceElement('memo_space');
  el.innerHTML = event.record.user_note.value; // 危險！
});

// ✅ 使用 textContent 或先 sanitize
kintone.events.on('app.record.detail.show', (event) => {
  const el = kintone.app.record.getSpaceElement('memo_space');
  el.textContent = event.record.user_note.value; // 安全
});

// ✅ 需要 HTML 格式時，使用 DOMPurify（Cybozu CDN 有提供）
// 先在 kintone 的 JS 設定中載入：
// https://js.cybozu.com/dompurify/3.0.6/purify.min.js
kintone.events.on('app.record.detail.show', (event) => {
  const el = kintone.app.record.getSpaceElement('memo_space');
  el.innerHTML = DOMPurify.sanitize(event.record.user_note.value);
});
```

### URL 欄位的安全處理

```javascript
// ❌ 危險：可能被填入 javascript:alert(1)
const link = document.createElement('a');
link.href = record.external_url.value;

// ✅ 驗證 scheme 只允許 http/https
const safeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? url : '#';
  } catch {
    return '#';
  }
};
link.href = safeUrl(record.external_url.value);
```

---

## 4. API Token 安全

### 絕對不能做的事

```javascript
// ❌ 把 API Token 寫在前端 JS（任何人開 DevTools 都看得到）
const response = await fetch('/k/v1/records.json', {
  headers: { 'X-Cybozu-API-Token': 'AbCdEfGhIjKlMnOpQrSt1234' }, // 危險！
});
```

### 正確做法

```javascript
// ✅ 在 kintone 系統內，用 kintone.api() 直接呼叫（自動帶登入 Session）
const response = await kintone.api('/k/v1/records', 'GET', {
  app: 100,
  query: 'status = "進行中"',
});

// ✅ 如果必須用 API Token（如從外部系統呼叫），放在後端 Proxy
// 前端 → 你的 Server → kintone API（Token 只在後端）
```

### Plugin 開發時的 Token 處理

```javascript
// ✅ Plugin 的敏感設定用 kintone.plugin.app.setConfig / getConfig
// Config 頁面存儲時加密，不會在前端 JS 中明文出現

// config.js（設定頁面）
document.getElementById('save').addEventListener('click', () => {
  kintone.plugin.app.setConfig({
    apiToken: document.getElementById('api-token').value,
    appId: document.getElementById('app-id').value,
  });
});

// desktop.js（主邏輯）
const config = kintone.plugin.app.getConfig(PLUGIN_ID);
// config.apiToken 在這裡才能安全使用
```

---

## 5. Race Condition（非同步競爭）

### 欄位聯動的競爭問題

```javascript
// ❌ 使用者快速連續修改欄位，多個非同步呼叫同時進行
kintone.events.on('app.record.edit.change.supplier_code', async (event) => {
  const data = await kintone.api('/k/v1/records', 'GET', {
    app: SUPPLIER_APP_ID,
    query: `code = "${event.record.supplier_code.value}"`,
  });
  // 如果使用者改了兩次，第二次的結果可能比第一次早回來
  event.record.supplier_name.value = data.records[0]?.name?.value ?? '';
  return event;
});

// ✅ 用 AbortController 或版本號確保只用最新的結果
let requestVersion = 0;

kintone.events.on('app.record.edit.change.supplier_code', async (event) => {
  const currentVersion = ++requestVersion;

  const data = await kintone.api('/k/v1/records', 'GET', {
    app: SUPPLIER_APP_ID,
    query: `code = "${event.record.supplier_code.value}"`,
  });

  if (currentVersion !== requestVersion) return event; // 已被新請求取代

  event.record.supplier_name.value = data.records[0]?.name?.value ?? '';
  return event;
});
```

### Cursor 分頁的穩定性

```javascript
// ✅ 大量資料必須用 cursor，不能用 offset（資料更新時 offset 會錯位）
const getAllRecords = async (appId, query) => {
  const cursor = await kintone.api('/k/v1/records/cursor', 'POST', {
    app: appId,
    query,
    size: 500, // 最大 500
  });

  const records = [];
  let hasNext = true;

  while (hasNext) {
    const result = await kintone.api('/k/v1/records/cursor', 'GET', {
      id: cursor.id,
    });
    records.push(...result.records);
    hasNext = result.next;
  }

  return records;
};
```

> ⚠️ **記憶體警告**：上面的 `getAllRecords` 會把**全部**記錄 `push` 進同一個陣列。資料量大時（數千～數萬筆）會吃掉數百 MB，在 8GB／已用 80% 的機器上足以讓分頁崩潰。
> 只在「資料量保證很小」時用這個版本；需要處理大量資料時，請改用 [08-performance-memory.md](08-performance-memory.md#11-dao-參考實作把原則-4567-收斂到一處) 的**串流版 `forEachRecord()`**（邊抓邊算邊丟，記憶體恆定），並務必指定 `fields` 白名單。

---

## 6. 行動版相容性

### 行動版不支援的 API

| API | 電腦版 | 行動版 |
|-----|--------|--------|
| `kintone.user.getOrganizations()` | ✅ | ❌ 回傳 undefined |
| `kintone.app.getHeaderSpaceElement()` | ✅ | ❌ 回傳 null |
| `kintone.app.record.getSpaceElement()` | ✅ | ❌ 部分不支援 |
| `kintone.app.getRelatedRecordsTargetAppId()` | ✅ | ❌ |

```javascript
// ✅ 判斷是否為行動版，分別處理
const isMobile = () => location.pathname.startsWith('/m/');

kintone.events.on(
  ['app.record.edit.show', 'mobile.app.record.edit.show'],
  async (event) => {
    if (isMobile()) {
      // 行動版用 REST API 查組織
      const user = kintone.getLoginUser();
      const orgs = await kintone.api('/k/v1/user/organizations', 'GET', {
        code: user.code,
      });
      // orgs.organizationTitles
    } else {
      // 電腦版用 JS API
      const orgs = kintone.user.getOrganizations();
    }
  }
);
```

---

## 7. 錯誤處理模式

### 統一的 safeHandler 包裝

```javascript
(() => {
  'use strict';

  // 所有事件 handler 都用這個包裝，避免 unhandled rejection 讓畫面卡住
  const safeHandler = (fn) => async (event) => {
    try {
      return await fn(event);
    } catch (err) {
      console.error('[kintone custom]', err);
      // submit 事件：用 event.error 阻擋存檔並顯示訊息
      if (event?.error !== undefined) {
        event.error = `系統錯誤，請截圖回報：${err.message}`;
        return event;
      }
      // 其他事件：用 alert 或 SweetAlert2 通知使用者
      // await Swal.fire({ icon: 'error', title: '錯誤', text: err.message });
      return event;
    }
  };

  kintone.events.on(
    'app.record.edit.submit',
    safeHandler(async (event) => {
      // 你的邏輯，放心 throw，外層會接住
      const result = await someAsyncOperation();
      event.record.result_field.value = result;
      return event;
    })
  );
})();
```

### REST API 錯誤的分類處理

```javascript
const apiCall = async (path, method, params) => {
  try {
    return await kintone.api(path, method, params);
  } catch (err) {
    if (err.code === 'GAIA_RE01') {
      throw new Error('記錄不存在或無存取權限');
    }
    if (err.code === 'CB_AU01') {
      throw new Error('Session 已過期，請重新登入');
    }
    if (err.code === 'GAIA_TM12') {
      throw new Error('超過 API 速率限制，請稍後再試');
    }
    throw err; // 未知錯誤向上拋
  }
};
```

---

## 8. 快速檢查清單

開發完成後，用以下清單做最後確認：

### 安全性

- [ ] 沒有把 API Token 寫在前端 JS 中
- [ ] 插入 DOM 的內容用了 `textContent` 或 `DOMPurify.sanitize()`
- [ ] URL 欄位的值有驗證 scheme（只允許 http/https）
- [ ] Plugin 的敏感設定透過 `kintone.plugin.app.setConfig` 儲存

### 穩定性

- [ ] 同一個 submit 事件只綁定一次（沒有多個 `kintone.events.on('...submit', ...)` 分散在各處）
- [ ] 有防止重複提交的 flag（isSubmitting）
- [ ] 非同步 handler 有 try-catch，不會讓 Promise rejection 靜默失敗
- [ ] 事件名稱有對照官方文件確認拼寫正確
- [ ] 行動版不支援的 API 有做 fallback

### 大量資料

- [ ] 記錄數可能超過 500 筆的查詢用了 cursor 分頁
- [ ] 批量更新用了 `/k/v1/records`（PUT 一次最多 100 筆），沒有用迴圈逐筆更新
- [ ] 有處理 API 速率限制的 retry 邏輯（或至少有錯誤提示）

### 使用者體驗

- [ ] 非同步操作期間有 loading 提示（`kintone.app.record.setFieldShown` 或 SweetAlert loading）
- [ ] 錯誤訊息對使用者有意義，不是直接顯示系統 error code
