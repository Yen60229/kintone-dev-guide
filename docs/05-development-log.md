# kintone 自訂開發日誌 - 模板與範例

## 使用說明

每次完成一個 kintone 自訂功能後，花 10 分鐘填寫以下模板。
這份日誌的作用：
1. 三個月後你自己回來維護時，5 分鐘就能回憶起全貌
2. 跟 Claude 協作時，直接貼相關段落作為 context
3. 累積到一定程度後，就是你的個人知識庫

---

## 模板

```markdown
### [日期] App XXX - 功能名稱

**需求摘要**：一句話描述這個功能做什麼

**使用的 Pattern**：P1 欄位聯動 / P2 跨 App 查詢 / P3 批量操作 / P4 權限控制 / P5 流程管理 / P6 表單驗證

**關鍵 API**：
- `app.record.edit.change.欄位代碼`（欄位聯動觸發）
- `GET /k/v1/records.json`（查詢供應商資料）

**踩過的坑**：
- （描述問題 → 原因 → 解法）

**相關文件連結**：
- https://cybozu.dev/zh-tw/kintone/docs/...

**檔案位置**：app639-quality-cards.js
```

---

## 實際範例

---

### [2026-01-15] App 639 - 品質管理跨應用卡片 UI

**需求摘要**：在品質管理記錄的詳情頁，自動從供應商 App 拉取歷史評分並以卡片 UI 顯示

**使用的 Pattern**：P2 跨 App 查詢 + P4 權限控制

**關鍵 API**：
- `app.record.detail.show`（詳情頁顯示時觸發）
- `kintone.app.record.getSpaceElement()`（取得空白欄位 DOM 元素）
- `GET /k/v1/records.json`（查詢 App 450 供應商評分）

**踩過的坑**：
1. **列印頁面卡片跑版** → 原因：列印時 `@media print` 的寬度不同 → 解法：加了 `app.record.print.show` 事件，針對列印頁面調整卡片的 `max-width` 和 `font-size`
2. **空白欄位在行動版取不到** → 原因：行動版要用 `kintone.mobile.app.record.getSpaceElement()` → 解法：做了一個 helper function 自動判斷電腦版/行動版

**相關文件連結**：
- 空白欄位元素：https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-space-element/
- 列印事件：https://cybozu.dev/zh-tw/kintone/docs/js-api/events/print-show-event/

**檔案位置**：app639-quality-cards.js

---

### [2026-02-20] App 100 - 供應商重複驗證

**需求摘要**：新增或編輯供應商記錄時，根據動作類型（恢復 vs 年度更新）執行不同的重複驗證邏輯

**使用的 Pattern**：P6 表單驗證 + Strategy Pattern

**關鍵 API**：
- `app.record.create.submit` / `app.record.edit.submit`
- `GET /k/v1/records.json`（查重複）
- `kintone.app.record.getId()`（編輯模式排除自身）

**踩過的坑**：
1. **「恢復」和「年度定期更新」的驗證規則不同** → 最初用 if-else 寫很亂 → 重構成 Strategy Pattern，每個動作類型一個規則物件
2. **totalCount 回傳的是字串不是數字** → `resp.totalCount` 是 `"3"` 而不是 `3` → 比較時用 `!== '0'` 而非 `!== 0`
3. **編輯模式漏排除自身** → 第一版忘了加 `$id != "自己"` 的條件 → 每次編輯都報重複

**相關文件連結**：
- 取得記錄（含 totalCount 參數說明）：https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/get-records/

**檔案位置**：app100-supplier-validation.js

---

### [2026-03-10] App 639 - 流程管理 DATETIME 格式修正

**需求摘要**：流程管理自動寫入的時間戳欄位格式不符 kintone 要求

**使用的 Pattern**：P5 流程管理

**關鍵 API**：
- `app.record.detail.process.proceed`

**踩過的坑**：
1. **DATETIME 欄位格式必須是 ISO 8601** → 用 `new Date().toLocaleString()` 會產生 `2026/3/10 15:30:00` 這種格式，kintone 不認 → 解法：改用 `new Date().toISOString()` 產生 `2026-03-10T07:30:00.000Z`
2. **時區問題** → `toISOString()` 回傳 UTC 時間 → 但 kintone 會根據使用者時區設定自動轉換顯示，所以直接用 UTC 就好，不需要手動加 +08:00

**相關文件連結**：
- 欄位格式（DATETIME 章節）：https://cybozu.dev/zh-tw/kintone/docs/overview/field-types/

**檔案位置**：app639-process-automation.js

---

## 累積出來的「kintone 踩坑大全」

隨著日誌越寫越多，把重複出現的坑整理到這裡：

| # | 坑 | 原因 | 解法 |
|---|-----|------|------|
| 1 | DATETIME 欄位寫入失敗 | 格式不是 ISO 8601 | 用 `new Date().toISOString()` |
| 2 | totalCount 比較永遠 false | 回傳值是字串 | 用 `!== '0'` 或 `Number()` 轉換 |
| 3 | 行動版 getSpaceElement 回傳 null | 行動版用 `kintone.mobile.app.record` | 寫一個 helper 自動判斷版本 |
| 4 | change event 沒有觸發 | 欄位代碼拼錯（kintone 不報錯） | 開發時先 console.log 確認事件有被呼叫 |
| 5 | submit event 的 async 修改沒生效 | handler 沒有加 async/await | 確保 handler 是 async function 且 return event 在 await 之後 |
| 6 | 同一個 app 多個 JS 檔的全域變數衝突 | 沒有用 IIFE 包裹 | 每個檔案都用 `(() => { ... })()` |
| 7 | 跨 app 查詢權限不足 | 使用者的帳號沒有目標 app 的權限 | 改用 API Token 驗證（需加 header） |
| 8 | 批量更新超過 100 筆時部分失敗 | kintone 單次 PUT 最多 100 筆 | 分批處理，每批 100 筆 |
| 9 | cursor 逾時 | 建立 cursor 後超過 10 分鐘沒使用 | 建立後立即開始讀取，不要在中間做耗時操作 |
| 10 | detail.show 的 event.record 修改不生效 | detail 畫面是唯讀的，不能用 event.record 改值 | 只能用 DOM 操作或 CSS 來改顯示 |
| 11 | 在 create.show 事件中 lookup/關聯記錄有殘留值 | 複製記錄時 kintone 會帶入原始值 | 在 create.show 中手動清空這些欄位 |
| 12 | event.record.欄位.disabled = true 沒效果 | 只有特定事件支援 disabled | 改用 CSS `pointer-events:none` + `opacity:0.6` |
