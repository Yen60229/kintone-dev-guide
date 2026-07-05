'use strict';
/**
 * spec.example.js — 流程管理規格檔（以「一般供應商資料申請」App 140 為例）
 *
 * 這份規格檔展開後 = samples/vendor-flow.original.json（23 狀態、70 動作）。
 * 之後要改流程：只改這份檔，跑 generate → validate → compare → apply，
 * 不要再直接編輯完整 JSON。
 *
 * ── 身分簡寫 ──
 *   'field:欄位代碼'  表單上的「選擇使用者」欄位（動態指派）
 *   'group:群組代碼'  群組
 *   'org:組織代碼'    組織
 *   'user:帳號'       指定使用者（盡量避免，人事異動就壞）
 *
 * ── 狀態索引規則 ──
 *   主要流程狀態（依下方列出順序）→ 駁回狀態 → 終態，自動編號；
 *   需要固定順序時可用 index / reject.index 指定。
 */

// 常用群組集中定義，改群組代碼只動這裡
const G = {
  DEV: 'group:開發人員',
  CANCEL_AGENT: 'group:總務課_修改代理人(群組)',
  ACC_STAFF: 'group:總務會計課_一般供應商資料經辦(1)',
  GA_STAFF: 'group:總務課_經辦人(1)',
  GA_CHIEF: 'group:總務課_主管(1)',
  GA_MANAGER: 'group:總務部_主管(1)',
};

module.exports = {
  enable: true,

  // ── 狀態（主要簽核鏈，依畫面顯示順序）──
  // reject: true  → 自動生成「○○駁回」狀態（處理人=申請人）＋「駁回」＋「再申請」動作
  // terminal: true → 終態：不掛作廢動作、排在索引最後
  states: [
    { name: '未處理', assignee: 'field:建立人' },
    { name: '草稿（未送出）', assignee: 'field:申請人' },
    { name: '申請單位主管確認', assignee: 'field:單位主管3', reject: true },
    { name: '總務部會計課經辦確認', assignee: { type: 'ANY', who: [G.ACC_STAFF] }, reject: true },
    { name: '總務部總務課經辦確認', assignee: { type: 'ANY', who: [G.GA_STAFF] }, reject: true },
    { name: '總務課課長確認', assignee: { type: 'ONE', who: [G.GA_CHIEF] }, reject: true },
    { name: '申請單位次長1確認', assignee: 'field:單位次長', reject: { index: 17 } },
    { name: '申請單位次長2確認', assignee: 'field:單位次長1', reject: { index: 18 } },
    { name: '申請單位部長確認', assignee: 'field:單位部長_支店長', reject: { index: 19 } },
    { name: '總務部主管確認', assignee: { type: 'ONE', who: [G.GA_MANAGER] }, reject: { index: 16 } },
    { name: '總務部部長確認', assignee: { type: 'ANY', who: ['field:總務部部長'] }, reject: true },
    { name: '總務部會計課經辦登錄廠商代號', assignee: { type: 'ANY', who: [G.ACC_STAFF] } },

    // ⚠️ 「流程結束」的處理人設成「測試人員」欄位是測試殘留；終態通常 assignee: null
    { name: '流程結束', assignee: { type: 'ANY', who: ['field:測試人員'] }, terminal: true },
    { name: '表單作廢', assignee: null, terminal: true },
  ],

  // ── 明確的流程動作（樣板動作不用寫，policies 會自動展開）──
  // when      = 顯示條件（filterCond 原文；" GROUP"/" ORGANIZATION" 的空格是語法，勿刪）
  // secondary = 收進「⋯」選單；onlyFor = 限定執行者；devOnly = --production 時移除
  transitions: [
    { name: '點擊申請開始', from: '未處理', to: '草稿（未送出）' },

    // 草稿 → 三向分歧：主管在課長群組且非總務課 → 主管確認；其餘直送會計課
    { name: '提交_申請單位主管確認', from: '草稿（未送出）', to: '申請單位主管確認',
      when: '單位主管3 in (" GROUP", "課長") and 申請人 not in (" ORGANIZATION", "總務部-總務課")' },
    { name: '提交_總務部會計課確認', from: '草稿（未送出）', to: '總務部會計課經辦確認',
      when: '單位主管3 in (" GROUP", "課長") and 申請人 in (" ORGANIZATION", "總務部-總務課")' },
    { name: '提交_總務部會計課確認', from: '草稿（未送出）', to: '總務部會計課經辦確認',
      when: '單位主管3 not in (" GROUP", "課長")' },

    // 開發用捷徑（上線前用 --production 移除）
    { name: '測試', from: '草稿（未送出）', to: '流程結束', secondary: true, onlyFor: [G.DEV], devOnly: true },
    { name: '提交總務部長確認', from: '草稿（未送出）', to: '總務部部長確認', secondary: true, onlyFor: [G.DEV], devOnly: true },
    { name: '提交_總務部總務課確認', from: '草稿（未送出）', to: '總務部總務課經辦確認', secondary: true, onlyFor: [G.DEV], devOnly: true },

    // ⚠️⚠️ 測試殘留：用「紀錄號碼」寫死路由（validate 會告警）。
    // 上線前應改成單一無條件動作「提交_總務部會計課確認」，刪掉這兩條的條件。
    { name: '提交_總務部會計課確認', from: '申請單位主管確認', to: '總務部會計課經辦確認',
      when: '紀錄號碼 != "1346"' },
    { name: '提交_總務課課長確認', from: '申請單位主管確認', to: '總務課課長確認',
      when: '紀錄號碼 = "1346"' },

    { name: '提交_總務部總務課確認', from: '總務部會計課經辦確認', to: '總務部總務課經辦確認' },
    { name: '提交_總務課課長確認', from: '總務部會計課經辦確認', to: '總務課課長確認',
      secondary: true, onlyFor: [G.DEV], devOnly: true },

    // 總務課經辦 → 依「是否簽核至總務部長」與「廠商代號」三向分歧
    { name: '提交_總務課課長確認', from: '總務部總務課經辦確認', to: '總務課課長確認',
      when: '是否簽核至總務部長 in ("是")' },
    { name: '確認完成', from: '總務部總務課經辦確認', to: '流程結束',
      when: '是否簽核至總務部長 in ("否") and 廠商代號 != ""' },
    { name: '提交_總務部會計課確認', from: '總務部總務課經辦確認', to: '總務部會計課經辦登錄廠商代號',
      when: '是否簽核至總務部長 in ("否") and 廠商代號 = ""' },

    // 課長 → 依次長人數與部長身分四向分歧
    { name: '提交_申請單位部長確認', from: '總務課課長確認', to: '申請單位部長確認',
      when: '部門次長簽核人數 in ("0人") and 單位部長_支店長 in (" GROUP", "部長")' },
    { name: '提交_總務部主管確認', from: '總務課課長確認', to: '總務部主管確認',
      when: '部門次長簽核人數 in ("0人") and 單位部長_支店長 not in (" GROUP", "部長")' },
    { name: '提交_申請單位次長1確認', from: '總務課課長確認', to: '申請單位次長1確認',
      when: '部門次長簽核人數 in ("2人")' },
    { name: '提交_申請單位次長2確認', from: '總務課課長確認', to: '申請單位次長2確認',
      when: '部門次長簽核人數 in ("1人") and 申請人 not in (" ORGANIZATION", "總務部-總務課")' },
    { name: '提交_總務部主管確認', from: '總務課課長確認', to: '總務部主管確認',
      when: '申請人 in (" ORGANIZATION", "總務部-總務課")' },
    { name: '返回至單位主管', from: '總務課課長確認', to: '申請單位主管確認',
      secondary: true, onlyFor: [G.DEV], devOnly: true },

    { name: '提交_申請單位次長2確認', from: '申請單位次長1確認', to: '申請單位次長2確認' },

    // 次長2 → 三向分歧＋特定使用者的轉件捷徑
    { name: '提交_總務部主管確認', from: '申請單位次長2確認', to: '總務部主管確認',
      when: '單位部長_支店長 not in (" GROUP", "部長")' },
    { name: '提交_總務部長確認', from: '申請單位次長2確認', to: '總務部部長確認',
      when: '單位部長_支店長 not in (" GROUP", "部長") and 申請單位 in (" ORGANIZATION", "總務部-總務課")' },
    { name: '提交_申請單位部長確認', from: '申請單位次長2確認', to: '申請單位部長確認',
      when: '單位部長_支店長 in (" GROUP", "部長")' },
    // 指定單一使用者的例外通道：人事異動會失效，建議改群組
    { name: '轉至單位主管', from: '申請單位次長2確認', to: '申請單位主管確認',
      secondary: true, onlyFor: ['user:24136'] },

    { name: '提交_總務部主管確認', from: '申請單位部長確認', to: '總務部主管確認' },
    { name: '提交_總務部長確認', from: '總務部主管確認', to: '總務部部長確認' },

    // 總務部部長 → 有廠商代號直接結案；沒有先去登錄
    { name: '同意', from: '總務部部長確認', to: '流程結束', when: '廠商代號 != ""' },
    { name: '提交_總務部會計課確認', from: '總務部部長確認', to: '總務部會計課經辦登錄廠商代號',
      when: '廠商代號 = ""' },

    { name: '廠商代號登錄完成', from: '總務部會計課經辦登錄廠商代號', to: '流程結束',
      when: '廠商代號 != ""' },

    // 測試用倒轉（從終態倒回登錄關卡）
    { name: '測試廠商代號', from: '流程結束', to: '總務部會計課經辦登錄廠商代號',
      when: '測試人員 in (" ORGANIZATION", "NX臺灣國際物流", " ORGANIZATION", "聯海通運股份有限公司")',
      devOnly: true },
  ],

  // ── 樣板政策：宣告一次，自動套用 ──
  policies: {
    // 每個 reject: true 的關卡 → 生成駁回狀態（處理人=申請人）＋駁回動作＋再申請動作
    reject: {
      assignee: 'field:申請人',
      actionName: '駁回',
      reapply: { name: '再申請', to: '草稿（未送出）' },
    },
    // 每個非終態狀態自動掛「作廢」SECONDARY 動作（限定執行群組）
    cancel: {
      name: '廠商資料作廢',
      to: '表單作廢',
      when: '特殊情形 in ("作廢")',
      onlyFor: [G.CANCEL_AGENT],
      // 個別狀態的執行者例外
      overrides: {
        未處理: { onlyFor: [G.DEV, G.CANCEL_AGENT] },
      },
    },
  },
};
