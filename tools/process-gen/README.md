# process-gen — kintone 流程管理「規格檔 → 產生 → 驗證 → 套用」工具組

## 為什麼要這樣做

你原本的做法是:Bookmarklet 匯出 1,160 行 JSON → 讓 AI 手改 → 貼回匯入。問題有三個:

1. **那份 JSON 七成是樣板**——每個簽核關卡都要配一個駁回狀態、一個駁回動作、一個再申請動作;每個狀態都要掛一個作廢動作。23 個狀態、70 個動作裡,真正表達「這個表單怎麼簽」的只有 31 個動作。
2. **AI(或人)手改整份 JSON 容易漏**——加一個關卡要同時改 5~7 個地方,漏一個就是流程卡死或按鈕消失,而且匯入前沒有任何檢查。
3. **Bookmarklet 匯入直接覆蓋正式設定**,沒有備份、沒有預演。

這套工具把它拆成四層,每層只做一件事:

```
spec.example.js     你維護的規格檔(約 150 行,含註解)
    │  node generate.js        ← 自動展開駁回/再申請/作廢樣板
    ▼
out/xxx.json        完整的 status.json(1,100+ 行,不用手碰)
    │  node validate.js        ← 匯入前檢查:結構錯誤 + 反模式警告
    │  node compare.js         ← 跟線上現況比對,確認只改到想改的
    ▼
    │  node apply.js           ← 備份 → 寫入「測試環境」→ 人工確認 → 部署
    ▼
kintone 正式環境
```

**驗證過的事實**:`spec.example.js` 展開後與 `samples/vendor-flow.original.json`(App 140 的真實匯出檔)語意比對零差異——這套規格檔完整表達了你現有的流程。

## 需求

Node.js 18 以上(用到內建 fetch)。無任何 npm 相依,`node` 直接跑。

## 五分鐘上手

```bash
cd tools/process-gen

# 1. 從規格檔產生完整 JSON
node generate.js spec.example.js -o out/vendor-flow.generated.json

# 2. 匯入前檢查(❌錯誤會擋、⚠️警告要人工確認)
node validate.js out/vendor-flow.generated.json

# 3. 跟原始匯出檔(或線上現況)比對,確認改動範圍
node compare.js out/vendor-flow.generated.json samples/vendor-flow.original.json

# 4. 套用:自動備份 → 寫入測試環境(不動正式!)
set KINTONE_BASE_URL=https://your-domain.cybozu.com
set KINTONE_API_TOKEN=你的token
node apply.js --app 140 --file out/vendor-flow.generated.json

# 5. 到 kintone 畫面確認測試環境的流程管理設定沒問題後,才部署
node apply.js --app 140 --deploy --yes
```

## 規格檔怎麼寫

### states — 狀態(簽核鏈)

```js
states: [
  { name: '未處理', assignee: 'field:建立人' },
  { name: '草稿（未送出）', assignee: 'field:申請人' },
  // reject: true = 這是簽核關卡,自動生成「○○駁回」狀態+駁回+再申請動作
  { name: '申請單位主管確認', assignee: 'field:單位主管3', reject: true },
  // 群組簽核、其中一人處理即可 → type: 'ANY'
  { name: '總務課課長確認', assignee: { type: 'ANY', who: ['group:總務課_主管(1)'] }, reject: true },
  // terminal: true = 終態:不掛作廢、排在索引最後、通常 assignee: null
  { name: '流程結束', assignee: null, terminal: true },
  { name: '表單作廢', assignee: null, terminal: true },
],
```

身分簡寫:`'field:欄位代碼'`(選擇使用者欄位)、`'group:群組代碼'`、`'org:組織代碼'`、`'user:帳號'`。
處理人模式:`ONE` 一人處理(預設)、`ANY` 其中一人、`ALL` 全部的人。

### transitions — 明確的流程動作

只寫「業務邏輯」的動作,樣板(駁回/再申請/作廢)不用寫:

```js
transitions: [
  // 最簡:from 狀態的按鈕「name」,按了進 to 狀態
  { name: '點擊申請開始', from: '未處理', to: '草稿（未送出）' },

  // when = 顯示條件(filterCond 原文)。同名動作+互補條件 = OR 分歧的標準手法
  { name: '提交_申請單位主管確認', from: '草稿（未送出）', to: '申請單位主管確認',
    when: '單位主管3 in (" GROUP", "課長")' },

  // secondary = 收進「⋯」選單;onlyFor = 限定執行者;devOnly = --production 時剔除
  { name: '測試', from: '草稿（未送出）', to: '流程結束',
    secondary: true, onlyFor: ['group:開發人員'], devOnly: true },
],
```

> ⚠️ `when` 條件裡的 `" GROUP"` / `" ORGANIZATION"`(**前面有一個空格**)是 kintone 的類型標記語法,
> 意思是「該使用者欄位裡的人屬於某群組/組織」,不是打錯字,千萬別把空格刪掉。

### policies — 樣板政策(宣告一次,自動套用)

```js
policies: {
  // 駁回樣板:每個 reject: true 的關卡自動生成
  //   「○○駁回」狀態(處理人=申請人) + 「駁回」動作 + 「再申請」回草稿
  reject: {
    assignee: 'field:申請人',
    actionName: '駁回',
    reapply: { name: '再申請', to: '草稿（未送出）' },
  },
  // 作廢樣板:每個非終態狀態自動掛 SECONDARY 作廢動作
  cancel: {
    name: '廠商資料作廢', to: '表單作廢',
    when: '特殊情形 in ("作廢")',
    onlyFor: ['group:總務課_修改代理人(群組)'],
    overrides: { 未處理: { onlyFor: ['group:開發人員', 'group:總務課_修改代理人(群組)'] } },
  },
},
```

## 日常工作流(改流程需求時)

1. 改 `spec` 檔(通常只動 `states` 加一行、`transitions` 加兩三行)
2. `node generate.js spec.example.js -o out/新版.json`
3. `node validate.js out/新版.json` — 逐條看警告
4. `node apply.js --app 140 --file out/新版.json` — 自動備份 + 進測試環境
5. 到 kintone 畫面點一遍流程確認
6. `node apply.js --app 140 --deploy --yes` — 部署到正式

改壞了怎麼辦:`backups/` 裡有每次套用前的正式環境完整備份,
`node apply.js --app 140 --file backups/那個備份檔.json` 就能原樣還原。

## validate.js 會抓什麼

| 等級 | 例子 |
|---|---|
| ❌ 錯誤(擋下) | 動作指向不存在的狀態、同名動作皆無條件、引號/括號不成對、index 重複 |
| ⚠️ 警告 | filterCond 用「紀錄號碼」當條件(搬移後會變)、`"GROUP"` 缺空格、開發/測試用動作(上線前清單)、駁回狀態沒有再申請回頭路、孤兒狀態、終態掛了處理人 |
| ℹ️ 提示 | 同名動作依條件分歧(正常手法)、無對外動作的狀態(終態確認) |

## FAQ

**Q:帳號有二步驟驗證(2FA),apply.js 能用嗎?**
能,但只能走 `KINTONE_API_TOKEN`。kintone 的 2FA 會擋掉 API 的密碼驗證,這是平台限制。App 管理類 API 若拒絕你的 Token(權限錯誤),表示需要具備 App 管理權限的 Token,或得用一個未啟用 2FA 的專用服務帳號。

**Q:compare 說「動作陣列排列順序不同」要緊嗎?**
不要緊,只影響同一狀態多顆按鈕的排列順序。generate 的輸出順序是「依狀態分組」,比原始檔的順序更整齊;套用一次之後,之後的 compare 就是全綠。

**Q:`--production` 做什麼?**
剔除 spec 裡標 `devOnly: true` 的動作,產出上線版 JSON。開發期與上線版共用同一份 spec,不會有兩套設定漂移的問題。

**Q:index(狀態顯示順序)可以控制嗎?**
預設「主要狀態依列出順序 → 駁回狀態 → 終態」。要固定某個狀態的編號,寫 `index: 16`(狀態)或 `reject: { index: 16 }`(駁回狀態)。

## 檔案一覽

| 檔案 | 用途 |
|---|---|
| `spec.example.js` | 規格檔範例(= App 140 現行流程的完整表達) |
| `generate.js` | spec → 完整 status.json,`--production` 剔除開發用動作 |
| `validate.js` | 匯入前檢查(結構錯誤 + 反模式) |
| `compare.js` | 兩份設定的語意比對(忽略排列順序與 revision) |
| `apply.js` | 備份 → 寫入測試環境 → `--deploy` 部署 |
| `samples/vendor-flow.original.json` | App 140 的原始匯出檔(對照組) |
| `out/`、`backups/` | 產出與備份(不入版控) |
