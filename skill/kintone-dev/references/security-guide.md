# kintone 安全性與穩定性完整指南

---

## 1. Submit Handler 覆蓋問題（最常見隱性 bug）

多個 JS 檔對同一個 submit 事件註冊 handler 時，**全部都會執行**（不是覆蓋），但 return 值行為互相干擾。

```javascript
// ❌ 危險：兩個 handler 同時存在
kintone.events.on('app.record.edit.submit', (event) => {
  event.record.total.value = calculate();
  return event; // ← 先 return，下面的驗證可能失效
});
kintone.events.on('app.record.edit.submit', (event) => {
  if (!validate(event.record)) {
    event.error = '驗證失敗';
    return event; // ← 可能被上面的 return 覆蓋
  }
  return event;
});

// ✅ 正確：只綁一次，內部分工
kintone.events.on(
  ['app.record.edit.submit', 'app.record.create.submit'],
  async (event) => {
    const record = event.record;
    // Step 1: 計算
    record.total.value = String(Number(record.qty.value) * Number(record.price.value));
    // Step 2: 驗證（失敗直接 return）
    const error = validateRecord(record);
    if (error) { event.error = error; return event; }
    // Step 3: 非同步操作
    try { await enrichRecord(record); }
    catch (err) { event.error = `查詢失敗：${err.message}`; return event; }
    return event;
  }
);
```

### 防止重複提交（Double Submit）

```javascript
let isSubmitting = false;
kintone.events.on('app.record.edit.submit', async (event) => {
  if (isSubmitting) { event.error = '處理中...'; return event; }
  isSubmitting = true;
  try {
    // 邏輯...
    return event;
  } finally {
    isSubmitting = false;
  }
});
```

---

## 2. 事件處理器的穩定性陷阱

### 事件名稱拼錯（靜默失效）

kintone 不報錯，什麼都不發生：

```javascript
// ❌ 都會靜默失效
kintone.events.on('app.record.edit.Save', handler);    // 大小寫錯
kintone.events.on('record.edit.submit', handler);       // 少了 app
kintone.events.on('app.record.edit.submit.success', handler); // 有些人混淆事件名
```

### 在不適合的事件修改 record

```javascript
// ❌ detail.show 修改 record 不會被存檔
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

```javascript
// ❌ XSS 漏洞：使用者輸入直接插入 DOM
el.innerHTML = event.record.user_note.value;

// ✅ 方法 1：textContent（純文字）
el.textContent = event.record.user_note.value;

// ✅ 方法 2：DOMPurify（需要 HTML 格式時）
// CDN: https://js.cybozu.com/dompurify/3.0.6/purify.min.js
el.innerHTML = DOMPurify.sanitize(event.record.user_note.value);
```

### URL 欄位安全

```javascript
// ❌ 可能被填入 javascript:alert(1)
link.href = record.external_url.value;

// ✅ 驗證 scheme
const safeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? url : '#';
  } catch { return '#'; }
};
link.href = safeUrl(record.external_url.value);
```

---

## 4. API Token 安全

```javascript
// ❌ 絕對不能把 Token 寫在前端 JS
headers: { 'X-Cybozu-API-Token': 'AbCdEfGhIjKlMn...' }

// ✅ 在 kintone 內用 kintone.api()（自動帶 session）
const resp = await kintone.api('/k/v1/records', 'GET', { app: 100, query: '...' });

// ✅ 外部系統呼叫：Token 放後端 proxy
// 前端 → 你的 Server → kintone API

// ✅ Plugin：用 kintone.plugin.app.setConfig / getConfig
// config.js
kintone.plugin.app.setConfig({ apiToken: document.getElementById('token').value });
// desktop.js
const config = kintone.plugin.app.getConfig(PLUGIN_ID);
```

---

## 5. Race Condition（非同步競爭）

### 欄位聯動的競爭

```javascript
// ❌ 快速連續修改，第二次結果可能比第一次早回來
kintone.events.on('app.record.edit.change.supplier_code', async (event) => {
  const data = await kintone.api('/k/v1/records', 'GET', { ... });
  event.record.supplier_name.value = data.records[0]?.name?.value ?? '';
  return event;
});

// ✅ 版本號確保只用最新結果
let requestVersion = 0;
kintone.events.on('app.record.edit.change.supplier_code', async (event) => {
  const current = ++requestVersion;
  const data = await kintone.api('/k/v1/records', 'GET', { ... });
  if (current !== requestVersion) return event; // 已被新請求取代
  event.record.supplier_name.value = data.records[0]?.name?.value ?? '';
  return event;
});
```

### Cursor 分頁穩定性

大量資料必須用 cursor，不能用 offset（資料更新時 offset 會錯位）。
cursor 建立後 10 分鐘內必須讀取完，建立後立即開始讀取。

---

## 6. 行動版相容性

### 行動版不支援的 API

| API | 電腦版 | 行動版 |
|---|---|---|
| `kintone.user.getOrganizations()` | ✅ | ❌ 回傳 undefined |
| `kintone.app.getHeaderSpaceElement()` | ✅ | ❌ 回傳 null |
| `kintone.app.record.getSpaceElement()` | ✅ | 需用 `kintone.mobile.app.record.getSpaceElement()` |

```javascript
// ✅ 判斷行動版，分別處理
const isMobile = () => location.pathname.startsWith('/m/');

kintone.events.on(
  ['app.record.edit.show', 'mobile.app.record.edit.show'],
  async (event) => {
    if (isMobile()) {
      // REST API fallback
      const user = kintone.getLoginUser();
      const orgs = await kintone.api('/k/v1/user/organizations', 'GET', { code: user.code });
    } else {
      const orgs = kintone.user.getOrganizations();
    }
  }
);
```

---

## 7. 錯誤處理模式

### 統一 safeHandler

```javascript
const safeHandler = (fn) => async (event) => {
  try {
    return await fn(event);
  } catch (err) {
    console.error('[kintone custom]', err);
    if (event?.error !== undefined) {
      event.error = `系統錯誤，請截圖回報：${err.message}`;
      return event;
    }
    return event;
  }
};
```

### REST API 錯誤分類

```javascript
const apiCall = async (path, method, params) => {
  try {
    return await kintone.api(path, method, params);
  } catch (err) {
    if (err.code === 'GAIA_RE01') throw new Error('記錄不存在或無權限');
    if (err.code === 'CB_AU01') throw new Error('Session 過期，請重新登入');
    if (err.code === 'GAIA_TM12') throw new Error('API 速率限制，請稍後');
    throw err;
  }
};
```

---

## 8. 快速檢查清單

### 安全性
- [ ] API Token 沒寫在前端 JS
- [ ] DOM 插入用 `textContent` 或 `DOMPurify.sanitize()`
- [ ] URL 欄位驗證 scheme（http/https）
- [ ] Plugin 敏感設定用 `setConfig` 儲存

### 穩定性
- [ ] 同一 submit 事件只綁一次
- [ ] 有 `isSubmitting` flag
- [ ] async handler 有 try-catch
- [ ] 事件名稱拼寫正確

### 大量資料
- [ ] 超過 500 筆用 cursor
- [ ] 批量更新每批 100 筆
- [ ] API 速率限制有 retry 或提示

### 行動版
- [ ] 事件名加 `mobile.` 前綴
- [ ] 不支援的 API 有 fallback
