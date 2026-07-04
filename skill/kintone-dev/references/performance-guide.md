# kintone 效能與記憶體優化指南

> 現場前提：同仁電腦多為 **8GB RAM，開 kintone 前記憶體常已用到 ~80%** → 留給分頁約 1.5GB，與單頁 OOM 崩潰門檻幾乎重疊。
> 任何「全量抓進前端、在 forEach 重算」的寫法在這些機器上不是慢，是**直接白畫面崩潰**。
> 最高原則：**純 kintone JS 前端，永遠不要做全量重算。**

本檔為自成一體的濃縮版（更完整的推導與案例在開發指南 repo 的 `docs/08-performance-memory.md`，未隨 skill 打包，已安裝環境找不到該檔屬正常）。三大思維框架：

- **分流 Offloading**：把計算搬到最充裕的資源。優先序：後端批次/Cloud Function ＞ Webhook/排程 ＞ 前端分批讓出 ＞（禁止）前端當下全量算。
- **降級 Graceful Degradation**：依資料量級決定行為，撐不住就退到更輕方案而非崩潰。
- **DAO Data Access Object**：所有 `kintone.api()` 收斂到單一存取層，統一強制欄位白名單／串流分頁／分批節流。

### 依資料量級降級

| 量級 | 策略 |
|------|------|
| < 100 | 前端直接算 |
| 100~2,000 | 前端分批 + 讓出主執行緒 + loading |
| 2,000~10,000 | 串流處理（邊抓邊算邊丟）+ 只取必要欄位 |
| > 10,000 | 降級：前端不算，觸發後端批次 / 提示改用報表 |

---

## ⚠️ 與 P3 的分工（必讀）

P3 的 `getAllRecords()` 是**全量堆積**模式，僅適用「結果集必須整批處理、且約 2,000 筆內」的情境（P3 已強制 fields 白名單）。彙總統計、或量級更大時，一律改用下方串流 DAO（邊抓邊算邊丟），在 8GB 機器上全量堆積是崩潰來源。

---

## 8 條原則（速查）

1. **重邏輯不放畫面事件**：`index.show`/`detail.show`/`change` 不跑大量計算/查詢。改成前端只標記「待處理」欄位，後端 Webhook/排程批次算完寫回。
2. **分批 + 讓出主執行緒**：
   ```javascript
   async function processInChunks(records, handler, chunkSize = 100) {
     for (let i = 0; i < records.length; i += chunkSize) {
       for (const r of records.slice(i, i + chunkSize)) handler(r);
       await new Promise((res) => setTimeout(res, 0)); // 讓出
     }
   }
   ```
   進階用 `requestIdleCallback`；降級依 `navigator.deviceMemory` 縮小 chunkSize。
3. **巢狀迴圈改 Map**：`O(n²)` → `O(n)`，投報率最高。
   ```javascript
   const bMap = new Map(listB.map((b) => [b.aId.value, b]));
   for (const a of listA) { const b = bMap.get(a.id.value); if (b) {/*...*/} }
   ```
4. **不撈全欄位**：一律指定 `fields: ['$id', ...]` 白名單，由 DAO 強制。
5. **串流分頁，不堆陣列**：邊抓邊算邊丟，用 `$id > lastId` seek（非 offset，避免錯位）。彙總時只留結果（一個 Map），不留原始記錄。
6. **大量更新分批**：每批 ≤100（PUT 上限）+ 批間 `setTimeout(200)` 節流（避 `GAIA_TM12`）。
7. **主動釋放暫存**：用完 `arr.length = 0; arr = null;`。勿掛 `window`／模組頂層 closure／DOM `dataset`／長存 handler，否則 GC 回收不掉。
8. **推薦架構**：kintone JS 瘦客戶端（輸入檢查＋少量即時計算＋送任務）→ 重型運算交後端（Cloud Function/Lambda/Node 批次）→ 結果寫回 kintone 欄位/統計 App。判準：要「一次看很多筆」就是後端的活。

---

## DAO 參考實作（收斂原則 4/5/6/7）

```javascript
const createKintoneDao = (appId) => {
  const url = (p) => kintone.api.url(p, true);
  return {
    // 串流讀取：邊抓邊交給 handler，不堆積（原則 5+7）
    async forEachRecord(handler, { fields, extraQuery = '', pageSize = 500 } = {}) {
      if (!fields?.length) throw new Error('[DAO] 必須指定 fields（原則 4）');
      if (!fields.includes('$id')) fields = ['$id', ...fields];
      let lastId = 0;
      while (true) {
        const where = extraQuery ? `(${extraQuery}) and $id > ${lastId}` : `$id > ${lastId}`;
        const resp = await kintone.api(url('/k/v1/records.json'), 'GET', {
          app: appId, query: `${where} order by $id asc limit ${pageSize}`, fields,
        });
        if (resp.records.length === 0) break;
        for (const r of resp.records) await handler(r);
        lastId = Number(resp.records[resp.records.length - 1].$id.value);
      }
    },
    // 分批節流寫入（原則 6）
    async updateInBatches(records, buildBody, { batchSize = 100, throttleMs = 200 } = {}) {
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize).map(buildBody);
        await kintone.api(url('/k/v1/records.json'), 'PUT', { app: appId, records: batch });
        if (i + batchSize < records.length) await new Promise((r) => setTimeout(r, throttleMs));
      }
    },
  };
};
```

---

## 檢查清單

**分流**
- [ ] 重計算沒放 `index.show`/`detail.show`/`change`
- [ ] 「一次看很多筆」的運算已分流到後端/排程
- [ ] 前端只做輸入檢查＋少量即時計算

**降級**
- [ ] 依資料量級決定策略，超門檻降級而非硬算
- [ ] 大量處理有 loading 提示

**DAO / 記憶體**
- [ ] 所有讀取指定 `fields` 白名單（原則 4）
- [ ] 大量資料串流分頁、不 `push` 全量（原則 5）
- [ ] 巢狀比對改 `Map`（原則 3）
- [ ] 重計算分批 + 讓出主執行緒（原則 2）
- [ ] 大量更新分批 100 + 節流（原則 6）
- [ ] 暫存用完設 `null`，沒掛 window/全域/closure/dataset（原則 7）
