# kintone 開發：效能與記憶體優化指南

> 整理日期：2026-06-15
> 適用情境：**同仁電腦多為 8GB RAM，開 kintone 前記憶體常已用到 ~80%**
> 視角：全端工程師的 **降級（Graceful Degradation）／分流（Offloading）／DAO（Data Access Object）** 三大思維

---

## 0. 先認清現場：你的記憶體預算只有約 1.5GB

| 項目 | 估算 |
|------|------|
| 實體記憶體 | 8 GB |
| 開 kintone 前已佔用 | ~80% → 約 6.4 GB |
| **留給瀏覽器分頁的空間** | **約 1.5 GB（含 OS 抖動，實際更少）** |
| 單一 Chrome 分頁 OOM 崩潰門檻 | 約 1~2 GB（依平台） |

**結論：前端可用記憶體跟「單一分頁崩潰門檻」幾乎重疊。**
這代表任何「把全量資料抓進前端、在 `forEach` 裡重算」的寫法，在我們的機器上不是「慢」，而是**直接讓分頁白畫面崩潰（Aw, Snap!）**，使用者連錯誤訊息都看不到。

所以本指南的最高原則只有一句：

> **純 kintone JS 前端，永遠不要做「全量重算」。**
> 把資料**分批**、欄位**縮小**、迴圈**降階**、計算**讓出主執行緒**，重型邏輯**分流到後端批次**。

---

## 1. 三大思維框架（先建立心智模型，再看 8 條原則）

下面 8 條原則不是 8 個獨立技巧，而是三種思維的展開。先記住框架，套用時才不會死背。

### 🅰 分流 Offloading —「這段計算該在哪裡跑？」

把工作從「最稀缺的資源」搬到「最充裕的資源」。優先順序：

```
後端批次 / Cloud Function / Lambda   ← 記憶體與 CPU 最充裕，首選
        ▲
   Webhook / 排程（非即時）
        ▲
   前端「分批 + 讓出主執行緒」（不得已才在前端）
        ▲
   前端「使用者操作當下全量算完」   ← 最糟，禁止
```

對應原則 **1（不放畫面事件）、2（分批讓出）、8（推薦架構）**。

### 🅱 降級 Graceful Degradation —「資料量大到撐不住時，怎麼退而求其次？」

不要假設資料量永遠很小。依**資料量級**決定行為，撐不住就退到更輕的方案，而不是讓分頁崩潰：

| 資料量級 | 策略 |
|---------|------|
| < 100 筆 | 前端直接算，即時回饋 |
| 100 ~ 2,000 筆 | 前端**分批 + 讓出主執行緒**（原則 2），加 loading 提示 |
| 2,000 ~ 10,000 筆 | 前端**串流處理**（原則 5，邊抓邊算邊丟），只取必要欄位（原則 4） |
| > 10,000 筆 | **降級**：前端不算，改觸發後端批次 / 顯示「資料量過大，請改用報表 App」 |

對應原則 **4（縮欄位）、5（串流分頁）、6（分批更新）**。

### 🅲 DAO Data Access Object —「所有對 kintone 的存取，只走一個門」

把所有 `kintone.api()` 呼叫**收斂到單一資料存取層**，在這一層統一強制執行：欄位白名單、cursor 分頁、批次大小、節流、降級與重試。

**好處：** 原則 4／5／6 只要在 DAO 寫對一次，全 App 自動受惠；不會散落在各事件 handler，也不會有人忘記加 `fields`。

對應原則 **4、5、6、7（釋放暫存）**。本指南第 11 節提供可直接複製的 DAO 實作。

---

## 2. ⚠️ 現有指南的矛盾點（務必修正）

`docs/06-security-stability.md` 與 Pattern P3 中的 `getAllRecords()` 目前這樣寫：

```javascript
// ⚠️ 現有寫法：把「全部」記錄 push 進同一個陣列
const getAllRecords = async (appId, query) => {
  const records = [];
  while (hasNext) {
    const result = await kintone.api('/k/v1/records/cursor', 'GET', { id });
    records.push(...result.records);  // ← 全量堆積在記憶體！
    hasNext = result.next;
  }
  return records; // 10,000 筆 × 多欄位 → 輕鬆數百 MB
};
```

這在「資料量保證很小」時可以用，但**直接違反本指南原則 4 與 5**。在 8GB 機器上跑全量就是崩潰來源。
→ 第 11 節提供 **串流版 `forEachRecord()`**：邊抓邊處理邊丟，記憶體恆定，請優先使用。

---

## 3. 原則 1：重邏輯不要放在畫面事件裡

`show` / `change` 是使用者**正在等畫面**的當下，主執行緒一卡，整頁就凍結。

**避免放重計算的事件：**
`app.record.index.show`、`app.record.detail.show`、`app.record.{create|edit}.change.xxx`

```javascript
// ❌ 在 change 事件裡跑大量計算 / 大量查詢
kintone.events.on('app.record.edit.change.code', async (event) => {
  const all = await getAllRecords(APP);      // 全量抓
  event.record.result.value = heavyCalc(all); // 當場重算 → 畫面凍結
  return event;
});
```

**改成（分流）：前端只觸發，重算交給後端／排程**

```javascript
// ✅ 前端只負責「標記待處理」，不在當下算
kintone.events.on('app.record.edit.change.code', (event) => {
  event.record.calc_status.value = '待計算'; // 寫入「待處理」欄位
  return event;
});
// 後端 Webhook / 排程批次掃描「待計算」記錄 → 算完寫回 → 改為「已完成」
```

> 若**只能**用純 JS（無後端），至少不要在使用者操作當下全部算完 —— 改用原則 2 的分批，並在 `submit.success` 或背景非同步進行。

---

## 4. 原則 2：用分批 + 讓出主執行緒（Time-slicing）

```javascript
// ❌ 一次跑完，主執行緒被佔滿，瀏覽器判定「無回應」
records.forEach((record) => heavyCalc(record));
```

```javascript
// ✅ 每處理一批就 await 一次，把主執行緒還給瀏覽器渲染
async function processInChunks(records, handler, chunkSize = 100) {
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    for (const record of chunk) handler(record);
    await new Promise((resolve) => setTimeout(resolve, 0)); // 讓出主執行緒
  }
}
```

> **進階：** 若環境支援，用 `requestIdleCallback` 取代 `setTimeout(0)`，只在瀏覽器空檔做事，對低階機器更友善。
> **降級：** 可用 `navigator.deviceMemory`（單位 GB）動態縮小 `chunkSize`——記憶體少的機器跑更小批、讓出更頻繁。

---

## 5. 原則 3：避免巢狀迴圈，改用 Map

`O(n²)` 巢狀比對是**最常見的爆 RAM／卡死來源**，也是投報率最高的優化。

```javascript
// ❌ O(n²)：listA × listB 兩層迴圈
for (const a of listA) {
  for (const b of listB) {
    if (a.id.value === b.aId.value) { /* ... */ }
  }
}
```

```javascript
// ✅ O(n)：先用 Map 建索引，再單層查找
const bMap = new Map();
for (const b of listB) bMap.set(b.aId.value, b);

for (const a of listA) {
  const b = bMap.get(a.id.value);
  if (b) { /* ... */ }
}
```

> listA、listB 各 5,000 筆時，巢狀是 2,500 萬次比對；改 Map 後是 1 萬次。這通常帶來**最大幅度**的改善。

---

## 6. 原則 4：kintone API 不要一次撈所有欄位

回傳的 JSON 大小 ≈ 筆數 × 欄位數。欄位越少，網路、解析、記憶體全部省。

```javascript
// ❌ query 空字串 + 不指定 fields → 撈回每筆的所有欄位（含附件、長文字）
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', { app: appId, query: '' });
```

```javascript
// ✅ 只取這次真正會用到的欄位
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
  app: appId,
  query: 'order by $id asc limit 500',
  fields: ['$id', '客戶代號', '金額', '狀態'], // 白名單
});
```

> 這應該由 **DAO 層強制**（第 11 節）：任何讀取都必須傳 `fields`，否則拒絕。避免有人圖方便撈全欄位。

---

## 7. 原則 5：分頁取得資料，不要一次堆在陣列（串流處理）

這是與第 2 節矛盾點直接對應的原則。**邊抓邊算邊丟**，記憶體用量恆定，不隨資料量成長。

```javascript
// ❌ 全量堆積：資料越多，陣列越大，直到 OOM
const allRecords = [];
while (true) { /* 一直 push */ }
```

```javascript
// ✅ 串流：每批算完立刻丟棄，不保留整份資料
async function fetchAndProcess(appId, handler) {
  let lastId = 0;
  while (true) {
    const resp = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: appId,
      query: `$id > ${lastId} order by $id asc limit 500`, // seek 分頁，不用 offset
      fields: ['$id', '客戶代號', '金額'],
    });
    if (resp.records.length === 0) break;

    await processInChunks(resp.records, handler, 100); // 這批算完
    lastId = Number(resp.records[resp.records.length - 1].$id.value);
    // resp.records 在這裡就可被 GC 回收，記憶體不累積
  }
}
```

> **為何用 `$id > lastId`（seek）而非 `offset`？** offset 在資料同時被新增/刪除時會錯位漏抓；`$id` 遞增 seek 穩定且不需維護 cursor 逾時。
> 需要彙總（如加總金額）時，只保留**彙總結果**（一個數字／一個小 Map），不要保留原始記錄。

---

## 8. 原則 6：大量更新也要分批（含節流）

```javascript
// ✅ 每批最多 100 筆（REST API 上限），批間稍微節流，避開速率限制 GAIA_TM12
async function updateInBatches(appId, records, batchSize = 100) {
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', {
      app: appId,
      records: batch,
    });
    await new Promise((resolve) => setTimeout(resolve, 200)); // 節流，順便讓出主執行緒
  }
}
```

> 大量寫入本身就是「重邏輯」，**最好整段分流到後端**（原則 1、8）。前端分批只是「不得已純 JS」時的下限。

---

## 9. 原則 7：前端暫存資料要主動釋放

JS 的 GC 只回收「沒有任何參照」的物件。大資料只要還被某處掛著，就永遠回收不掉。

```javascript
// ✅ 用完主動斷開參照
let records = await getRecords();
await processInChunks(records, handler);
records.length = 0; // 清空陣列內容
records = null;      // 斷開參照，允許 GC 回收
```

**最容易造成記憶體洩漏（GC 無法回收）的四個地方：**

| 反模式 | 為什麼洩漏 | 改法 |
|--------|-----------|------|
| `window.bigData = [...]` | 全域物件存活整個分頁生命週期 | 不要掛全域；用區域變數 |
| 模組頂層 `let cache = [...]` | closure 長期持有 | 用完設 `null`；或改 `WeakMap` |
| `element.dataset.json = JSON.stringify(big)` | DOM 存活就回收不掉 | 別把大資料塞進 DOM dataset |
| 事件 handler 捕獲大陣列 | 只要 handler 在，陣列就在 | handler 用完 `kintone.events.off` / 不捕獲大物件 |

---

## 10. 原則 8：最推薦架構（分流的完整形態）

```
┌─────────────────────────────────────────────┐
│ kintone JS（前端，瘦客戶端 Thin Client）        │
│  · 輸入檢查、少量即時計算                        │
│  · 送出「任務」、標記待處理                        │
└───────────────────┬─────────────────────────┘
                    │ Webhook / API / 排程觸發
                    ▼
┌─────────────────────────────────────────────┐
│ 重型運算（後端）                                 │
│  Cloud Function / Lambda / Node.js 批次程式      │
│  · 全量抓取、彙總、跨 App join、產報表             │
└───────────────────┬─────────────────────────┘
                    │ 寫回
                    ▼
┌─────────────────────────────────────────────┐
│ 結果 → 寫回 kintone 結果欄位 / 統計 App           │
└─────────────────────────────────────────────┘
```

**判斷準則：** 只要運算需要「一次看到很多筆」（彙總、排名、跨 App 比對、產報表），就是後端的活。前端只做「一次看一筆」的即時回饋。

---

## 11. DAO 參考實作（把原則 4／5／6／7 收斂到一處）

把所有 kintone 存取藏在這一層後面，事件 handler 只呼叫 DAO，不直接碰 `kintone.api()`。

```javascript
(() => {
  'use strict';

  /**
   * kintone 資料存取層（DAO）
   * 統一強制：欄位白名單(原則4)、串流分頁(原則5)、分批節流寫入(原則6)
   */
  const createKintoneDao = (appId) => {
    const url = (path) => kintone.api.url(path, true);

    return {
      /** 串流讀取：邊抓邊交給 handler，全程不堆積（原則 5 + 7） */
      async forEachRecord(handler, { fields, extraQuery = '', pageSize = 500 } = {}) {
        if (!fields || fields.length === 0) {
          throw new Error('[DAO] 讀取必須指定 fields（原則 4：禁止全欄位撈取）');
        }
        if (!fields.includes('$id')) fields = ['$id', ...fields];

        let lastId = 0;
        while (true) {
          const where = extraQuery ? `(${extraQuery}) and $id > ${lastId}` : `$id > ${lastId}`;
          const resp = await kintone.api(url('/k/v1/records.json'), 'GET', {
            app: appId,
            query: `${where} order by $id asc limit ${pageSize}`,
            fields,
          });
          if (resp.records.length === 0) break;

          for (const record of resp.records) await handler(record);
          lastId = Number(resp.records[resp.records.length - 1].$id.value);
        } // 每輪 resp 出 scope 即可被 GC
      },

      /** 分批節流寫入（原則 6） */
      async updateInBatches(records, buildBody, { batchSize = 100, throttleMs = 200 } = {}) {
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize).map(buildBody);
          await kintone.api(url('/k/v1/records.json'), 'PUT', { app: appId, records: batch });
          if (i + batchSize < records.length) {
            await new Promise((r) => setTimeout(r, throttleMs));
          }
        }
      },
    };
  };

  // ── 使用範例：彙總每個客戶的金額（只保留彙總結果，不保留原始記錄）──
  // const dao = createKintoneDao(639);
  // const totalByCustomer = new Map();
  // await dao.forEachRecord((rec) => {
  //   const key = rec['客戶代號'].value;
  //   totalByCustomer.set(key, (totalByCustomer.get(key) || 0) + Number(rec['金額'].value));
  // }, { fields: ['客戶代號', '金額'], extraQuery: '狀態 = "有效"' });

  window.KintoneDao = { create: createKintoneDao }; // 視需要暴露（注意：別在這上面掛大資料）
})();
```

---

## 12. 效能／記憶體檢查清單（輸出程式碼前必查）

### 分流（運算放對地方）
- [ ] 重計算**沒有**放在 `index.show` / `detail.show` / `change` 事件裡
- [ ] 需要「一次看很多筆」的運算（彙總、排名、跨 App join）已分流到後端 / 排程
- [ ] 前端只做輸入檢查與少量即時計算（瘦客戶端）

### 降級（撐不住時退而求其次）
- [ ] 有依資料量級決定策略，超過門檻時降級而非硬算（參考第 1 節表）
- [ ] 大量處理時有 loading 提示，使用者知道系統在運作
- [ ] （加分）依 `navigator.deviceMemory` 動態調整 `chunkSize`

### DAO / 記憶體
- [ ] 所有讀取都指定 `fields` 白名單，沒有撈全欄位（原則 4）
- [ ] 大量資料用**串流分頁**邊抓邊丟，沒有 `push` 全量堆積（原則 5）
- [ ] 巢狀比對已改用 `Map` 建索引（原則 3）
- [ ] 重計算有**分批 + 讓出主執行緒**（原則 2）
- [ ] 大量更新分批 100 筆 + 批間節流（原則 6）
- [ ] 暫存大資料用完設 `null`；沒有掛在 `window` / 全域 / closure / DOM dataset（原則 7）

---

## 13. 一句話總結

> **純 kintone JS 的最大原則：前端不要做全量重算。**
> 資料**分批**、欄位**縮小**、迴圈**降階（Map）**、計算**讓出主執行緒**，重型邏輯**分流到後端批次**——在 8GB／已用 80% 的機器上，這不是優化，是「不崩潰」的底線。

---

## 相關文件

- 大量資料的 cursor／批次基礎 → [06-security-stability.md](06-security-stability.md#5-race-condition非同步競爭)
- 批量操作 Pattern P3 → `patterns/02-pattern-library.js`（注意：其 `getAllRecords` 為全量版，大量資料請改用本文第 11 節串流 DAO）
- 分流到後端 / AI → [07-ai-integration.md](07-ai-integration.md)
