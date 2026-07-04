# kintone JS API 高頻踩雷限制（生成程式碼前必讀）

本檔整理三個最常讓生成程式碼出錯的限制：`kintone.app.record.get()` / `set()`、change 事件的非同步限制、`process.proceed` 的 return event 權限問題。生成任何涉及「讀寫當前畫面記錄」的程式碼前，先用本檔逐條核對。

依據來源：
- 官方文件「獲取記錄的值」 https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-record/
- 官方文件「給記錄設置值」 https://cybozu.dev/zh-tw/kintone/docs/js-api/record/set-record-value/
- Cybozu台灣〈Change 事件介紹與使用時的注意事項〉 https://ithelp.ithome.com.tw/articles/10371119
- Cybozu台灣〈process.proceed 的編輯權限問題〉 https://ithelp.ithome.com.tw/articles/10369396

---

## 1. kintone.app.record.get() / set() 的鐵律

### 決策表：現在該用 event.record 還是 get()/set()？

| 目前程式碼位置 | 讀取記錄 | 寫入記錄 |
|---|---|---|
| kintone.events.on() 的事件處理函式「本體」內 | 用 `event.record`（**禁止呼叫 get()**） | 改 `event.record.欄位.value` 後 `return event`（**禁止呼叫 set()**） |
| 事件處理函式以外的非同步回呼（setTimeout、.then、自訂按鈕 onclick） | `kintone.app.record.get()` | `kintone.app.record.set({ record })` |

> 官方明文：get() 與 set() **不可在 kintone.events.on() 的事件處理程式中執行**。在事件處理程式中要讀寫記錄，一律透過事件物件。這是本 skill 觸發後仍最常犯的錯，生成程式碼時務必自我檢查。

### get() 的可用畫面與限制
- 可用畫面（電腦版）：詳情、新增、編輯、列印。行動版：詳情、新增、編輯。
- **新增／編輯畫面中，附件欄位一律回傳空陣列**。要在存檔前檢查附件，只能用 `event.record.附件欄位.value`（submit／process.proceed 事件物件內有附件資訊），不能靠 get()。
- 在可用畫面以外執行（例如清單頁 index.show），行為未定義，不要依賴。

### set() 的可用畫面與限制
- 只能在**新增與編輯畫面**使用（電腦版與行動版皆同）。詳情畫面不能用 set() 改值，要改已存檔的值請走 REST API PUT。
- **附件欄位無法透過 set() 改寫**。
- set() 能做的事：改寫欄位值、切換欄位可否編輯（disabled）、設定欄位錯誤訊息（error）、觸發 Lookup 自動取得、清空 Lookup 複製目標欄位。
- 呼叫 set() 前建議先 `const { record } = kintone.app.record.get()` 取得最新畫面資料再修改，減少覆蓋掉其他處理程式寫入內容的風險。

---

## 2. change 事件的非同步限制（不允許回傳 Thenable）

change 事件（`app.record.{create|edit}.change.欄位代碼`、`app.record.index.edit.change.欄位代碼`）的事件處理函式**不能是 async 函式，也不能回傳 Promise**，否則會拋出：

> `Uncaught Error: app.record.edit.change.欄位代碼 is not allowed to return "Thenable" object.`

### 支援 change 事件的欄位類型
單行文字、數值、選項按鈕、核取方塊、複選、下拉選單、日期、時間、日期與時間、選擇使用者／組織／群組、表格（表格不支援清單行內編輯）。

**Lookup 與計算欄位本身不會觸發 change**。要偵測 Lookup 帶入，改監聽 Lookup 複製目標中的某個欄位（例如來源記錄編號）。

表格相關：
- `change.表格內欄位代碼` → 表格中某欄位值變動時觸發。
- `change.表格本身欄位代碼` → 表格新增或刪除列時觸發。

### change 內需要呼叫 API 時的兩種寫法

共同原則：非同步邏輯脫離了事件處理函式本體，之後就**不能再靠 event.record 改值**，必須改用 get() + set()（此時已在回呼中，get/set 是合法的）。

寫法一：setTimeout 包裹（可用 async/await，屬 macrotask，時機稍晚）

```javascript
kintone.events.on(`app.record.edit.change.${CONFIG.FIELDS.SOURCE_RECORD_ID}`, (event) => {
  const recordId = event.record[CONFIG.FIELDS.SOURCE_RECORD_ID].value;

  setTimeout(async () => {
    if (!recordId) return;
    try {
      const resp = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
        app: CONFIG.SOURCE_APP_ID,
        id: recordId,
      });
      const { record } = kintone.app.record.get(); // 先取最新畫面資料
      record[CONFIG.FIELDS.DETAIL_TABLE].value = resp.record[CONFIG.FIELDS.SOURCE_TABLE].value;
      kintone.app.record.set({ record });
    } catch (err) {
      console.error('取得來源資料失敗', err);
    }
  }, 0);

  return event; // 處理函式本體保持同步
});
```

寫法二：.then() 鏈（屬 microtask，時機比 setTimeout 早；錯誤要用 .catch 明確捕捉）

```javascript
kintone.events.on(`app.record.edit.change.${CONFIG.FIELDS.SOURCE_RECORD_ID}`, (event) => {
  const recordId = event.record[CONFIG.FIELDS.SOURCE_RECORD_ID].value;
  if (!recordId) return event;

  kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
    app: CONFIG.SOURCE_APP_ID,
    id: recordId,
  }).then((resp) => {
    const { record } = kintone.app.record.get();
    record[CONFIG.FIELDS.DETAIL_TABLE].value = resp.record[CONFIG.FIELDS.SOURCE_TABLE].value;
    kintone.app.record.set({ record });
  }).catch((err) => {
    console.error('取得來源資料失敗', err);
  });

  return event;
});
```

### 設計層級的建議（優先於上面兩招）
延遲處理本質上有風險：多支程式碼操作同一欄位時，容易互相覆蓋、寫入時機錯亂。原文結論是：**能把資料處理延後到 submit 階段就延後**（submit 支援 async/await），或集中在單一事件處理函式內執行。生成程式碼時的優先順序：
1. 這個 API 呼叫能不能搬到 submit？能 → 搬。
2. 不能（使用者體驗需要即時帶入）→ 用 .then() 或 setTimeout，並在文件中註明延遲寫入的風險。

---

## 3. process.proceed 的 return event 權限規則

事件：`app.record.detail.process.proceed`（行動版加 `mobile.` 前綴），發生在使用者點擊流程動作之後、狀態正式更新之前。

核心規則：
- 執行流程動作本身**只需要記錄的查看權限**，不需要編輯權限。
- 但事件處理函式中只要 `return event`，就被視為編輯動作 → **執行者需要記錄與欄位的編輯權限**，即使你根本沒改任何欄位值。這是「明明有閱覽權限卻跳無權限」的最常見原因。
- 取消動作：`return false`、回傳無效值，或設定 `event.error`（畫面頂部顯示錯誤並中斷，狀態不更新）。
- 不 return 任何東西 → 流程正常進行，不需編輯權限。

### 多支程式碼並存時的競爭問題
若程式碼 A `return event`（要寫入欄位）、程式碼 B 不 return，且 B 排在 A 之後執行，A 的寫入會失效。建議所有 process.proceed 處理一律採用「先查權限再決定是否 return event」的寫法：

```javascript
kintone.events.on(['app.record.detail.process.proceed', 'mobile.app.record.detail.process.proceed'],
  async (event) => {
    // 用「獲取執行 API 的用戶記錄存取權限」確認執行者是否有編輯權限
    let isEditable = false;
    try {
      const resp = await kintone.api(kintone.api.url('/k/v1/records/acl/evaluate.json', true), 'GET', {
        app: kintone.app.getId(),
        ids: [kintone.app.record.getId()],
      });
      isEditable = resp.rights[0]?.record?.editable || false;
    } catch (err) {
      console.error('權限查詢失敗', err);
    }

    // ……此處放各動作的驗證與自動設值邏輯……
    // 驗證失敗時 return false 或設定 event.error 後 return event（若有編輯權限）

    return isEditable ? event : undefined; // 有編輯權限才 return event，避免與其他程式碼衝突
  }
);
```

補充（2025 年 8 月更新的替代做法）：若困擾點是「要保留編輯權限給程式碼寫值，但不想讓使用者手動編輯」，可保留權限並在 `detail.show` 用 `kintone.app.record.showEditRecordButton('HIDDEN')` 隱藏編輯按鈕（此 API 為非同步，需 await）。

### process.proceed 的附件防呆
附件必填檢查要在 process.proceed 的 `event.record` 上做（詳情畫面事件物件內含附件資訊；get() 在新增／編輯畫面反而拿不到附件）：

```javascript
const attachments = event.record[CONFIG.FIELDS.ATTACHMENT]?.value || [];
if (attachments.length === 0) {
  event.error = `執行「${event.action.value}」前，請先上傳${CONFIG.LABELS[CONFIG.FIELDS.ATTACHMENT]}`;
  return event; // 設 event.error 需 return event；執行者需編輯權限，流程設計時要確認
}
```
