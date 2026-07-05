# kintone 流程管理「設定端」指南（status.json 結構 + API 直通 + 設計守則）

本檔處理的是**流程管理的設定本身**（狀態、動作、分歧條件的 JSON），與 `js-api-limits.md` 第 3 節的 process.proceed（JS 事件端）互補。適用情境：匯出／修改／匯入流程設定、用 AI 產生或改寫簽核流程、把流程設定納入版控。

---

## 1. 設定 JSON 的完整結構

`GET /k/v1/app/status.json?app={id}` 回傳（`PUT /k/v1/preview/app/status.json` 收同一結構）：

```jsonc
{
  "enable": true,            // 流程管理總開關
  "states": {                // 狀態集合：key = 狀態名稱（即畫面上顯示的字）
    "狀態名稱": {
      "name": "狀態名稱",     // 與 key 相同
      "index": "0",           // 字串數字；決定狀態在下拉選單/篩選器的顯示順序
      "assignee": {
        "type": "ONE",        // 處理人模式，見下表
        "entities": [
          {
            "entity": { "type": "FIELD_ENTITY", "code": "申請人" },
            "includeSubs": false   // 組織時是否含子組織
          }
        ]
      }
    }
  },
  "actions": [               // 動作（按鈕）陣列：陣列順序影響按鈕顯示順序
    {
      "name": "送審",          // 按鈕文字
      "from": "草稿",          // 來源狀態（必須存在於 states）
      "to": "審核中",          // 目標狀態（必須存在於 states）
      "filterCond": "",       // 顯示條件（query 語法）；空字串 = 永遠可用
      "type": "PRIMARY",      // PRIMARY = 主要動作；SECONDARY = 收在「⋯」選單
      "executableUser": {     // 選填：限制誰能執行；省略 = 目前狀態的處理人
        "entities": [ { "entity": { "type": "GROUP", "code": "群組代碼" }, "includeSubs": false } ]
      }
    }
  ],
  "revision": "882"          // 樂觀鎖版本號；PUT 時帶上可防止蓋掉別人的修改
}
```

### assignee.type（處理人模式）
| type | 意義 |
|---|---|
| `ONE` | 指定的一人處理（多個 entities 時由前一關處理人挑一位） |
| `ALL` | 所有人都要處理完才能推進 |
| `ANY` | 其中任何一人處理即可（群組簽核常用） |

終態（流程結束、作廢）通常 `entities` 留空陣列——**終態不需要處理人**，設了反而讓該使用者的「待處理」清單多出雜訊。

### entity.type（人的來源）
| type | 意義 | 備註 |
|---|---|---|
| `USER` | 指定使用者 | code = 登入名 |
| `GROUP` | 群組 | 建議用群組管簽核角色，人事異動只改群組成員 |
| `ORGANIZATION` | 組織 | 搭配 includeSubs |
| `FIELD_ENTITY` | 表單上的「選擇使用者」欄位 | code = 欄位代碼；動態指派的主要手段 |
| `CREATOR` | 記錄建立人 | |

### filterCond 的特殊語法
- 一般欄位條件與 REST query 相同：`欄位 in ("值")`、`廠商代號 != ""`、and/or。
- **使用者／組織選擇欄位**有特殊 token 寫法：
  `單位主管 in (" GROUP", "課長")` = 「單位主管欄位裡的人**屬於**『課長』群組」；
  `申請人 in (" ORGANIZATION", "總務部-總務課")` = 「申請人屬於該組織」。
  `" GROUP"` / `" ORGANIZATION"`（**前面有一個空格**）是類型標記，不是打錯字——手改 JSON 時千萬別「順手修掉」那個空格。

---

## 2. API 直通流程（取代 Bookmarklet 手動匯出匯入）

```
① GET  /k/v1/app/status.json?app={id}          ← 抓正式環境現況（含 revision）
② 修改 JSON（或用產生器從規格檔重新生成）
③ PUT  /k/v1/preview/app/status.json           ← 寫入「測試環境」，帶 app、revision 與新設定
④ 在 kintone 測試環境畫面上人工確認
⑤ POST /k/v1/preview/app/deploy.json           ← 部署到正式環境 { "apps": [{ "app": id }] }
⑥ GET  /k/v1/preview/app/deploy.json?apps[0]={id} ← 輪詢部署狀態（PROCESSING → SUCCESS/FAIL）
```

重點：
- **PUT 寫的是 preview（測試環境），不會直接動到正式**——這是比 Bookmarklet 直接覆蓋安全的原因。部署（⑤）才是不可逆的一步。
- PUT 帶 `revision` 可防併發衝突：若有人在你抓取後從 UI 改過設定，PUT 會失敗而不是蓋掉對方（帶 `-1` 可略過檢查，不建議）。
- 修改前先把 ① 的結果存檔備份，出錯可原樣 PUT 回去。
- 驗證方式：App 管理類 API 對 API Token 的支援有版本差異，若 Token 被拒（權限錯誤），改用密碼驗證；**帳號啟用 2FA 時密碼驗證會失敗**（見 tools-and-resources.md 第 4 節），此時需要一個未啟用 2FA 的專用服務帳號。

---

## 3. 規格檔 → 產生器工作流（大型流程的推薦做法）

超過 10 個狀態的簽核流，JSON 會有 60~70% 是重複樣板（每關的駁回、每個狀態的作廢、駁回後的再申請）。直接手改或讓 AI 手改整份 JSON，漏改風險高。推薦分層：

```
spec（精簡規格檔：簽核鏈 + 分歧條件 + 樣板政策，約 100 行）
  → generate（展開樣板，產生完整 status.json）
  → validate（結構檢查 + 反模式檢查，見下節清單）
  → compare（與線上現況做語意比對，確認只改到想改的）
  → apply（PUT preview → 人工確認 → deploy）
```

樣板政策指的是「宣告一次、自動套用到所有該套用的地方」的規則，例如：
- **駁回樣板**：每個標記 `reject: true` 的簽核關卡，自動生成「○○駁回」狀態（處理人=申請人）＋「駁回」動作＋「再申請」回草稿的動作。
- **作廢樣板**：除終態外的每個狀態，自動加掛「作廢」SECONDARY 動作（限定執行群組）。

> 開發指南 repo 的 `tools/process-gen/` 有一套零相依 Node 實作（spec.example.js、generate/validate/compare/apply 四支腳本）可直接參考；該目錄未隨 skill 打包，已安裝環境找不到屬正常。沒有現成工具時，依上述分層現寫一套也不難——重點是**規格與樣板分離**這個結構。

---

## 4. 流程設計守則（生成或審查流程設定時逐條檢查）

- [ ] **分歧條件不用「紀錄號碼」**（匯入搬移後號碼會變，見 cybozu-tw-articles.md #23）；測試路由用專門的測試欄位或 executableUser 群組把關
- [ ] 簽核角色用 GROUP 或 FIELD_ENTITY，不寫死 USER（人事異動就壞）
- [ ] 終態（流程結束／作廢）assignee.entities 留空
- [ ] 每個簽核關卡都有駁回（或退回）路徑；每個駁回狀態都有再申請回頭路
- [ ] 非終態狀態都至少有一條出路（不會卡死）
- [ ] 所有 action.from / action.to 指向存在的狀態（改狀態名時最容易斷）
- [ ] 同一 from 的同名動作：允許，且是做 OR 分歧的標準手法（兩條同名 PRIMARY、互補 filterCond），但**兩條的 filterCond 不可同時為空**（按鈕行為不可預期）
- [ ] 開發／測試用動作（直達終態、倒回等）以 executableUser 限定開發群組，並維護一張「上線前移除清單」
- [ ] filterCond 的 `" GROUP"` / `" ORGANIZATION"` token 空格未被誤刪
- [ ] PUT 前先 GET 備份 + 帶 revision

---

## 5. 常見錯誤

| 症狀 | 原因 |
|---|---|
| PUT 回 400，訊息指向某 action | from/to 指到不存在的狀態名（常見於改名後） |
| PUT 回 409 / revision 錯誤 | 設定在你抓取後被別人改過；重新 GET 再改 |
| 匯入後按鈕消失 | filterCond 語法錯（引號、括號、token 空格） |
| 某關卡「無權限」 | 執行者非該狀態處理人，且 action 沒設 executableUser；或 JS 端 process.proceed return event 的權限問題（見 js-api-limits.md 第 3 節） |
| 部署卡在 PROCESSING | 其他設定變更排隊中；輪詢等待，勿重複 POST |
