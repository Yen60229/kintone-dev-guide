# Cybozu台灣 iT邦幫忙文章索引（共 39 篇）

作者：Cybozu台灣（cybozu_tw），https://ithelp.ithome.com.tw/users/20170470/articles
這是官方在地團隊的第一手內容，遇到對應主題時，優先以 web_fetch 讀取原文再生成程式碼（文章含完整可用的範例程式與截圖）。索引整理於 2026-07，之後可能有新文章，必要時重新抓取作者文章列表頁。

## 使用方式
1. 先比對下表「主題關鍵字」欄，命中就 fetch 該篇原文。
2. 標註 ★ 的篇目重點已萃取進本 skill 其他檔案（js-api-limits.md 等），一般情況不必重抓。

## 文章索引（新 → 舊）

| # | 標題 | URL | 主題關鍵字 | 何時讀 |
|---|---|---|---|---|
| 1 | 出勤管理模板組的設計思路：原生功能、免費外掛、用群組管權限 | https://ithelp.ithome.com.tw/articles/10400289 | 出勤、打卡、模板、群組權限 | 設計出勤／請假類 App 時 |
| 2 | 用官方 MCP Server 讓 AI 直接讀寫 kintone：安裝設定到實操 | https://ithelp.ithome.com.tw/articles/10400248 | MCP、AI 整合 | 使用者想讓 Claude 直接連 kintone 時 |
| 3 | 用 app.record.index.edit.finish 解決清單行內編輯後樣式消失 | https://ithelp.ithome.com.tw/articles/10400050 | 行內編輯、樣式消失、index.edit.finish | 清單頁自訂樣式在行內編輯後不見時 |
| 4 | cli-kintone 搭配 Mac 捷徑／Windows 工作排程器自動備份記錄 | https://ithelp.ithome.com.tw/articles/10399846 | 備份、排程、cli-kintone | 需要定期備份記錄時 |
| 5 | 2026-04-12 新增 API：取得／設定清單列表畫面樣式 | https://ithelp.ithome.com.tw/articles/10399699 | setRecordListStyle、清單樣式 | 要改清單表格樣式時（取代直接改 DOM） |
| 6 | API 應用範例：顯示或隱藏清單選單的選項 | https://ithelp.ithome.com.tw/articles/10399616 | showViewSelectorItems、隱藏清單選項 | 要依角色隱藏特定清單時 |
| 7 | 透過 Bookmarklet 匯出／匯入應用程式流程管理設定 | https://ithelp.ithome.com.tw/articles/10399515 | 流程設定搬移、Bookmarklet | 跨環境搬流程設定時 |
| 8 | kintone 開發工具整合：從 js-sdk 遷移至 cli-kintone | https://ithelp.ithome.com.tw/articles/10399390 | js-sdk 淘汰、customize-uploader | 上傳客製化檔案的工具鏈 |
| 9 | 新增記錄時於 LINE 群組發送通知 | https://ithelp.ithome.com.tw/articles/10399314 | LINE、Webhook、外部串接 | LINE 通知需求 |
| 10 | 欄位值變動時發通知提醒 | https://ithelp.ithome.com.tw/articles/10399136 | 通知、欄位變動偵測 | 值變動要通知相關人時 |
| 11 | 利用 bulkRequest 同時更新多個應用程式記錄（庫存、預約） | https://ithelp.ithome.com.tw/articles/10399051 | bulkRequest、交易一致性、庫存 | 一次動作要同時寫多個 App 且需一起成功／一起失敗時 |
| 12 | Google 表單自動登錄至 kintone | https://ithelp.ithome.com.tw/articles/10398949 | Google 表單、GAS 串接 | 外部表單匯入需求 |
| 13 | 取得大量記錄：三種實作方法的限制與比較 | https://ithelp.ithome.com.tw/articles/10398845 | offset 上限 1 萬、cursor、seek（$id 條件法）| 大量資料抓取的方法選型（cursor 有同時 10 個上限；seek 法無上限） |
| 14 ★ | 使用 REST API 與 event.record 更新子表格資料時的注意事項 | https://ithelp.ithome.com.tw/articles/10398737 | 子表格、row id、整表覆寫 | 動子表格前必讀：REST API 更新子表格是整表覆寫，要保留既有列需帶回原 row id |
| 15 | 2025 秋季更新：4 個全新 UI 操作 API 整合介紹 | https://ithelp.ithome.com.tw/articles/10398608 | showEditRecordButton 等 UI API | 要隱藏編輯／重複利用等按鈕時（取代 DOM 操作） |
| 16 | 進階 Lookup 外掛做台灣縣市道路階層選擇 | https://ithelp.ithome.com.tw/articles/10398323 | 階層下拉、免費外掛 | 縣市→區→路這類連動選單需求 |
| 17 | 更新流程狀態 API 的注意事項 | https://ithelp.ithome.com.tw/articles/10397979 | /record/status.json、動作名稱、執行者 | 用 REST API 推進流程狀態時 |
| 18 | 透過 REST API 上傳檔案的注意事項 | https://ithelp.ithome.com.tw/articles/10391174 | file.json、fileKey、附件寫入 | 程式上傳附件時（先傳 file.json 取 fileKey 再掛到記錄） |
| 19 | Lookup 欄位的行為以及資料設計上應注意的事 | https://ithelp.ithome.com.tw/articles/10378527 | Lookup 複製欄位不同步、鍵欄位設計 | 設計 Lookup 結構前必讀（來源改了複製值不會自動更新） |
| 20 | 如何透過指定網址列 Query 篩選記錄 | https://ithelp.ithome.com.tw/articles/10376092 | URL query 參數、預設篩選 | 要做「點連結直接看到篩選後清單」時 |
| 21 | 外掛開發⑦ 透過外掛 proxy 執行外部請求：實作範例篇 | https://ithelp.ithome.com.tw/articles/10374084 | plugin.app.proxy、金鑰保護 | 外掛要呼叫外部 API 時 |
| 22 | 外掛開發⑥ 透過外掛 proxy 執行外部請求：入門概述篇 | https://ithelp.ithome.com.tw/articles/10373173 | proxy 概念、setProxyConfig | 同上，先讀概念 |
| 23 | 為什麼不建議使用「記錄號碼」作為唯一鍵 | https://ithelp.ithome.com.tw/articles/10372980 | 唯一鍵設計、記錄號碼陷阱 | 設計跨 App 關聯鍵時必讀（匯入搬移後記錄號碼會變） |
| 24 ★ | Change 事件介紹與使用時的注意事項 | https://ithelp.ithome.com.tw/articles/10371119 | change、Thenable、非同步限制 | 重點已完整收錄於 references/js-api-limits.md 第 2 節 |
| 25 | 多語言對應：用物件變數管理下拉選單選項文字 | https://ithelp.ithome.com.tw/articles/10371118 | 多語言、選項文字集中管理 | 多語系環境的選項比對（也是 CONFIG 關聯式設計的官方示範） |
| 26 | 外掛開發⑤ plugin API 保存／取得外掛設定資料 | https://ithelp.ithome.com.tw/articles/10370439 | setConfig、getConfig | 外掛設定存取 |
| 27 | 外掛開發④ 製作外掛設定畫面 | https://ithelp.ithome.com.tw/articles/10370225 | config.html | 外掛設定畫面 |
| 28 | 外掛開發③ webpack-plugin-kintone-plugin | https://ithelp.ithome.com.tw/articles/10370094 | 外掛打包工具 | 外掛建置流程 |
| 29 | 外掛開發② 動手打包第一個外掛 | https://ithelp.ithome.com.tw/articles/10370030 | plugin-packer、manifest | 外掛入門 |
| 30 | 外掛開發① kintone 外掛的基本架構 | https://ithelp.ithome.com.tw/articles/10369915 | 外掛結構、manifest.json | 外掛入門 |
| 31 | Query string 的 "like" 運算子搜尋規則 | https://ithelp.ithome.com.tw/articles/10369868 | like、部分一致、分詞規則 | like 查不到預期結果時必讀（like 是以「詞」為單位比對，不是子字串） |
| 32 | 使用 REST API 更新記錄流程狀態時的權限問題 | https://ithelp.ithome.com.tw/articles/10369670 | status API 權限、執行者限制 | status.json 回權限錯誤時 |
| 33 | 客製化程式碼的錯誤處理 | https://ithelp.ithome.com.tw/articles/10369619 | try-catch、錯誤訊息設計 | 錯誤處理規範的參考來源 |
| 34 | cli-kintone 操作指南 | https://ithelp.ithome.com.tw/articles/10369575 | 匯入匯出指令 | cli-kintone 用法 |
| 35 | 工具安裝攻略：cli-kintone 的安裝 | https://ithelp.ithome.com.tw/articles/10369570 | 安裝步驟 | cli-kintone 安裝 |
| 36 | 客製化入門：電腦版／行動版 API 的差異與使用小訣竅 | https://ithelp.ithome.com.tw/articles/10369523 | mobile 前綴、共用 helper | 行動版相容寫法（用 kintone.app 與 kintone.mobile.app 判斷切換） |
| 37 ★ | 客製化入門：透過 Event Object 操作欄位時的注意事項 | https://ithelp.ithome.com.tw/articles/10369448 | 可選串連、欄位不存在、權限缺欄位 | 重點已收錄於下方摘要與 SKILL.md 強制規則 |
| 38 ★ | process.proceed 的編輯權限問題 | https://ithelp.ithome.com.tw/articles/10369396 | return event 權限、多程式競爭 | 重點已完整收錄於 references/js-api-limits.md 第 3 節 |
| 39 | CORS 問題與 kintone.proxy 的使用 | https://ithelp.ithome.com.tw/articles/10369181 | CORS、kintone.proxy | 前端直呼外部 API 被擋時 |

## 已萃取的關鍵結論（★ 篇目精華）

### #37 Event Object 操作欄位（10369448）
- `event.record.欄位代碼` 可能是 undefined：欄位代碼被改名、欄位被刪除、或**登入者沒有該欄位的存取權限（事件物件內直接不含該欄位）**。
- 一律用可選串連＋預設值讀取：`const value = record.fieldA?.value || ''`。
- 批次驗證與批次 disabled 都應寫成「欄位陣列 + 迴圈 + 存在性檢查」的共用函式，欄位不存在時靜默跳過而不是中斷：

```javascript
const setDisabled = (record, fieldCodes, disabled) => {
  fieldCodes.forEach((code) => {
    if (record[code]) record[code].disabled = disabled;
  });
};

const setRequiredError = (record, fieldCodes, message) => {
  fieldCodes.forEach((code) => {
    if (record[code]?.value === '' || record[code]?.value === '-') {
      record[code].error = message; // 錯誤訊息顯示在欄位下方
    }
  });
};
```
- 選項按鈕沒有「未選」預設值可用，必填檢查要自訂一個代表未填的值（如 '-'）再比對。

### #14 子表格更新（10398737）
- REST API PUT 子表格是**整張表覆寫**：只送新列會把舊列全部洗掉；要保留既有列，必須把原有列連同其 `id` 一起帶回。
- 事件內用 event.record 增列時，新列不要帶 id（kintone 會自動配發）；列物件結構是 `{ value: { 欄位代碼: { type, value } } }`。

### #13 大量記錄三方法（10398845）
- offset 法：上限 10,000，且資料更動時會漏抓／重抓，僅小量資料可用。
- cursor 法：無筆數上限，但**同一 App 同時最多 10 個 cursor**、10 分鐘逾時、建立後要儘速讀完，讀完自動刪除。
- seek 法（`$id > 上次最大id order by $id asc limit 500`）：無上限、無 cursor 數量限制，是長期批次的首選。
