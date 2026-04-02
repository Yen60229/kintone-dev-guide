/**
 * ============================================================
 * JavaScript 基礎深化 - kintone 開發者最需要的部分
 * ============================================================
 */


// =============================================================
// 4-A. Closure - 為什麼 IIFE 很重要
// =============================================================

// ❌ 危險：全域變數污染
// 如果 App 裝了 3 個 JS 檔，它們的全域變數會互相覆蓋
var CONFIG = { APP_ID: 100 };  // 檔案 A
var CONFIG = { APP_ID: 200 };  // 檔案 B → 檔案 A 的 CONFIG 被覆蓋了！

// ✅ 安全：每個檔案用 IIFE 包起來
// 檔案 A
(() => {
  const CONFIG = { APP_ID: 100 };
  // 這裡的 CONFIG 只在這個 closure 內有效
  kintone.events.on('app.record.detail.show', (event) => {
    console.log(CONFIG.APP_ID);  // 100 ✓
    return event;
  });
})();

// 檔案 B
(() => {
  const CONFIG = { APP_ID: 200 };
  // 完全不衝突
  kintone.events.on('app.record.index.show', (event) => {
    console.log(CONFIG.APP_ID);  // 200 ✓
    return event;
  });
})();


// =============================================================
// 4-B. Event Loop - 為什麼 async/await 順序很重要
// =============================================================

// ❌ 常見的 bug：以為 API 呼叫是同步的
kintone.events.on('app.record.create.submit', (event) => {
  // 這個 API 呼叫是非同步的，但 event handler 不是 async
  kintone.api('/k/v1/records.json', 'GET', { app: 100 })
    .then((resp) => {
      // 到這裡的時候，submit 早就完成了
      // 你塞進 event 的東西不會生效！
      event.record.some_field.value = resp.records[0].value;
    });
  return event;  // ← 這比 .then() 先執行
});

// ✅ 正確：事件處理函式標記為 async，回傳 event 在 await 之後
kintone.events.on('app.record.create.submit', async (event) => {
  const resp = await kintone.api(
    kintone.api.url('/k/v1/records.json', true),
    'GET',
    { app: 100, query: 'order by $id desc limit 1' }
  );
  // await 之後才設值，這時 event 還沒被 kintone 消費
  if (resp.records.length > 0) {
    event.record.some_field.value = resp.records[0].some_field.value;
  }
  return event;  // ← 等 API 回來之後才 return
});


// =============================================================
// 4-C. Error Handling - kintone API 的錯誤不會自動顯示
// =============================================================

// ❌ 危險：沒有 try-catch，API 失敗時畫面靜默失效
kintone.events.on('app.record.detail.show', async (event) => {
  const resp = await kintone.api(
    kintone.api.url('/k/v1/records.json', true),
    'GET',
    { app: 99999, query: '' }  // app 不存在 → 拋錯 → 整個 handler 中斷
  );
  // 下面的 code 永遠不會執行，但使用者看不到任何錯誤訊息
  renderCards(resp.records);
  return event;
});

// ✅ 安全：wrap 一個通用的 error handler
const safeHandler = (fn) => async (event) => {
  try {
    return await fn(event);
  } catch (err) {
    // kintone.api() 的錯誤格式：{ message: string, id: string, code: string }
    const msg = err?.message || err?.toString() || '未知錯誤';
    console.error('[kintone-custom]', msg, err);

    // 在畫面上顯示錯誤（detail/edit 畫面可用 event.error）
    if (event.type?.includes('submit') || event.type?.includes('process')) {
      event.error = `系統錯誤：${msg}`;
    }
    // index.show / detail.show 無法用 event.error，用其他方式通知
    // kintone.showNotification() 只在電腦版有效
    return event;
  }
};

// 使用方式：
kintone.events.on('app.record.detail.show', safeHandler(async (event) => {
  const resp = await kintone.api(
    kintone.api.url('/k/v1/records.json', true),
    'GET',
    { app: 450, query: `code = "${event.record.supplier_code.value}"` }
  );
  renderCards(resp.records);
  return event;
}));


// =============================================================
// 4-D. Design Pattern: Observer（對應 kintone 事件系統）
// =============================================================
// 
// kintone.events.on() 本身就是 Observer pattern。
// 但你可以更進一步，建立自己的事件系統來解耦模組之間的依賴。

// 場景：一個 app 有 3 個獨立功能模組，都需要在 detail.show 時初始化，
//        但模組之間不應該互相知道對方的存在。

const AppEventBus = (() => {
  const listeners = {};

  return {
    on(eventName, callback) {
      if (!listeners[eventName]) listeners[eventName] = [];
      listeners[eventName].push(callback);
    },
    async emit(eventName, data) {
      const callbacks = listeners[eventName] || [];
      // 並行執行所有 listener（互不阻塞）
      await Promise.all(callbacks.map((cb) => cb(data)));
    },
  };
})();

// 模組 A：渲染評分卡片（不知道模組 B、C 的存在）
AppEventBus.on('detail-ready', async ({ record }) => {
  const scores = await fetchSupplierScores(record.supplier_code.value);
  renderScoreCards(scores);
});

// 模組 B：權限控制
AppEventBus.on('detail-ready', async ({ record }) => {
  controlFieldVisibility(record);
});

// 模組 C：操作日誌
AppEventBus.on('detail-ready', async ({ record }) => {
  logPageView(record.$id.value);
});

// 統一入口
kintone.events.on('app.record.detail.show', safeHandler(async (event) => {
  await AppEventBus.emit('detail-ready', { record: event.record });
  return event;
}));


// =============================================================
// 4-E. Design Pattern: Strategy（對應 CONFIG 驅動架構）
// =============================================================
//
// 你之前做的 CONFIG 驅動結構，本質上就是 Strategy Pattern。
// 更進一步的用法：讓不同的「動作類型」有完全不同的處理邏輯，
// 而不是用一堆 if-else。

const strategies = {
  '年度定期更新': {
    validate: (record) => {
      if (!record.inspection_date.value) return '請填寫檢查日期';
      return null;
    },
    transform: (record) => {
      record.update_year.value = String(new Date().getFullYear());
      return record;
    },
  },
  '恢復': {
    validate: (record) => {
      if (!record.restore_reason.value) return '請填寫恢復原因';
      return null;
    },
    transform: (record) => {
      record.status.value = '有效';
      record.restored_at.value = new Date().toISOString();
      return record;
    },
  },
  // 新增動作類型時，只要加一個物件，不用改任何邏輯
};

kintone.events.on('app.record.create.submit', safeHandler(async (event) => {
  const actionType = event.record.action_type.value;
  const strategy = strategies[actionType];

  if (!strategy) return event;  // 沒定義的類型就放行

  // 驗證
  const error = strategy.validate(event.record);
  if (error) {
    event.error = error;
    return event;
  }

  // 轉換
  event.record = strategy.transform(event.record);
  return event;
}));
