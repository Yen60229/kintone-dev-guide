/**
 * ============================================================
 * kintone 開發 Pattern Library - Jimmy 的個人工具庫
 * ============================================================
 * 
 * 使用方式：遇到新需求時，先判斷屬於哪個 Pattern，
 *          複製對應模板，填入 CONFIG 即可。
 * 
 * Pattern 清單：
 *   P1. 欄位聯動    (change event → set value)
 *   P2. 跨 App 查詢  (REST API GET → 渲染到空白欄)
 *   P3. 批量操作     (cursor → 迴圈更新)
 *   P4. 權限控制     (show event → setFieldShown)
 *   P5. 流程管理     (process.proceed → 條件判斷)
 *   P6. 表單驗證     (submit event → return false 阻擋)
 * ============================================================
 */


// =============================================================
// P1. 欄位聯動
// =============================================================
// 場景：使用者改了「數量」或「單價」，自動算出「合計」
// 適用：新增/編輯畫面的 change 事件
//
// 你之前的實際案例：
//   - 選了「恢復」動作類型 → 自動帶入特定欄位值
//   - 改了組織職稱 → 條件性修改記錄欄位

(() => {
  'use strict';

  const CONFIG = {
    TRIGGER_FIELDS: ['quantity', 'unit_price'],  // 觸發計算的欄位
    TARGET_FIELD: 'total_amount',                // 寫入結果的欄位
  };

  const calculate = (record) => {
    const qty = Number(record.quantity.value) || 0;
    const price = Number(record.unit_price.value) || 0;
    record[CONFIG.TARGET_FIELD].value = String(qty * price);
    return record;
  };

  // 同時綁定 create 和 edit 的 change 事件
  const events = CONFIG.TRIGGER_FIELDS.flatMap((field) => [
    `app.record.create.change.${field}`,
    `app.record.edit.change.${field}`,
    `mobile.app.record.create.change.${field}`,
    `mobile.app.record.edit.change.${field}`,
  ]);

  kintone.events.on(events, (event) => {
    event.record = calculate(event.record);
    return event;
  });
})();


// =============================================================
// P2. 跨 App 查詢 + 渲染
// =============================================================
// 場景：詳情頁顯示時，從另一個 App 拉取關聯資料並顯示
// 適用：detail.show 事件
//
// 你之前的實際案例：
//   - App 639 品質管理 → 從供應商 App 拉取評分並用卡片 UI 顯示
//   - 從使用者組織 App 查詢職稱來判斷流程

(() => {
  'use strict';

  const CONFIG = {
    SOURCE_APP: 450,
    LOOKUP_FIELD: 'supplier_code',      // 本 app 中用來查詢的欄位
    SOURCE_KEY_FIELD: 'sup_code',       // 來源 app 中的 key 欄位
    DISPLAY_FIELDS: ['sup_quality_score', 'sup_eval_date'],
    SPACE_ELEMENT_ID: 'related_data',   // 空白欄位 ID
  };

  const fetchRelatedRecords = async (keyValue) => {
    if (!keyValue) return [];
    const query = `${CONFIG.SOURCE_KEY_FIELD} = "${keyValue}" order by $id desc limit 100`;
    const resp = await kintone.api(
      kintone.api.url('/k/v1/records.json', true),
      'GET',
      { app: CONFIG.SOURCE_APP, query, fields: [CONFIG.SOURCE_KEY_FIELD, ...CONFIG.DISPLAY_FIELDS] }
    );
    return resp.records;
  };

  const renderToSpace = (records, spaceId) => {
    const el = kintone.app.record.getSpaceElement(spaceId);
    if (!el) return;
    if (records.length === 0) {
      el.innerHTML = '<p style="color:#999;">查無關聯資料</p>';
      return;
    }
    // --- 自訂渲染邏輯 ---
    el.innerHTML = records.map((r) => `
      <div style="padding:8px; border-bottom:1px solid #eee;">
        ${CONFIG.DISPLAY_FIELDS.map((f) => r[f]?.value || '—').join(' / ')}
      </div>
    `).join('');
  };

  kintone.events.on([
    'app.record.detail.show',
    'mobile.app.record.detail.show',
  ], async (event) => {
    const keyValue = event.record[CONFIG.LOOKUP_FIELD].value;
    const records = await fetchRelatedRecords(keyValue);
    renderToSpace(records, CONFIG.SPACE_ELEMENT_ID);
    return event;
  });
})();


// =============================================================
// P3. 批量操作（全量獲取 + 逐批更新）
// =============================================================
// 場景：需要更新大量記錄（超過 100 筆）
// 適用：管理者工具、資料遷移、定期維護
//
// 你之前的實際案例：
//   - 562 行的批量更新工具（支援範圍 ID、個別 ID、混合格式）

(() => {
  'use strict';

  // --- 全量獲取（使用 cursor，無 500 筆限制）---
  const getAllRecords = async (app, query = '', fields = []) => {
    const records = [];
    const body = { app, query, size: 500 };
    if (fields.length > 0) body.fields = fields;

    const { id } = await kintone.api(
      kintone.api.url('/k/v1/records/cursor.json', true),
      'POST', body
    );

    try {
      while (true) {
        const resp = await kintone.api(
          kintone.api.url('/k/v1/records/cursor.json', true),
          'GET', { id }
        );
        records.push(...resp.records);
        if (!resp.next) break;
      }
    } catch (err) {
      // cursor 逾時或異常時，嘗試清理
      try {
        await kintone.api(
          kintone.api.url('/k/v1/records/cursor.json', true),
          'DELETE', { id }
        );
      } catch { /* ignore */ }
      throw err;
    }

    return records;
  };

  // --- 逐批更新（每次最多 100 筆）---
  const bulkUpdate = async (app, records, buildUpdateBody) => {
    const BATCH_SIZE = 100;
    const results = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const body = {
        app,
        records: batch.map(buildUpdateBody),
      };
      const resp = await kintone.api(
        kintone.api.url('/k/v1/records.json', true),
        'PUT', body
      );
      results.push(...resp.records);
    }

    return results;
  };

  // --- 使用範例 ---
  // const records = await getAllRecords(639, 'status = "未處理"');
  // await bulkUpdate(639, records, (rec) => ({
  //   id: rec.$id.value,
  //   record: { status: { value: '處理中' } },
  // }));

  // 如果要在其他檔案使用，掛到全域
  window.KintoneUtils = window.KintoneUtils || {};
  window.KintoneUtils.getAllRecords = getAllRecords;
  window.KintoneUtils.bulkUpdate = bulkUpdate;
})();


// =============================================================
// P4. 權限控制（欄位顯示/隱藏 + 停用）
// =============================================================
// 場景：根據登入者身份或記錄狀態，控制哪些欄位可見/可編輯
// 適用：show 事件（create/edit/detail）
//
// 你之前的實際案例：
//   - 根據使用者組織職稱決定欄位顯示
//   - 根據頁面模式 (create/edit/detail) 用 CSS 控制 visibility

(() => {
  'use strict';

  const CONFIG = {
    // 只有這些組織的人才能看到成本欄位
    COST_VISIBLE_ORGS: ['財務部', '經營企劃部'],
    COST_FIELDS: ['unit_cost', 'total_cost', 'margin_rate'],
    // 狀態為「已核准」時，這些欄位要鎖定（灰色 + disabled 感）
    LOCK_AFTER_APPROVED: ['quantity', 'unit_price', 'delivery_date'],
    APPROVED_STATUS: '已核准',
  };

  // 方法一：用 JS API 控制（推薦，原生支援）
  const controlFieldVisibility = (record, orgs) => {
    const userOrgs = kintone.user.getOrganizations().map((o) => o.name);
    const canSeeCost = CONFIG.COST_VISIBLE_ORGS.some((org) => userOrgs.includes(org));

    CONFIG.COST_FIELDS.forEach((field) => {
      kintone.app.record.setFieldShown(field, canSeeCost);
    });
  };

  // 方法二：用 CSS 控制（當 JS API 不夠用時的備案）
  // 例如：detail 頁面想讓欄位看起來像 disabled
  const lockFieldsByCSS = (fieldCodes) => {
    fieldCodes.forEach((code) => {
      const el = kintone.app.record.getFieldElement(code);
      if (el) {
        el.style.pointerEvents = 'none';
        el.style.opacity = '0.6';
      }
    });
  };

  kintone.events.on([
    'app.record.detail.show',
    'app.record.edit.show',
    'mobile.app.record.detail.show',
    'mobile.app.record.edit.show',
  ], (event) => {
    controlFieldVisibility(event.record);

    // 已核准的記錄，鎖定關鍵欄位
    if (event.record.Status?.value === CONFIG.APPROVED_STATUS) {
      // edit 畫面：用 disabled 屬性
      CONFIG.LOCK_AFTER_APPROVED.forEach((field) => {
        event.record[field].disabled = true;
      });
      // detail 畫面：用 CSS 輔助
      if (event.type.includes('detail')) {
        lockFieldsByCSS(CONFIG.LOCK_AFTER_APPROVED);
      }
    }

    return event;
  });
})();


// =============================================================
// P5. 流程管理（狀態遷移前的驗證 + 自動處理）
// =============================================================
// 場景：使用者按下流程按鈕時，先驗證條件，再自動更新欄位
// 適用：process.proceed 事件
//
// 你之前的實際案例：
//   - 查詢使用者組織職稱，條件性修改記錄欄位
//   - DATETIME 欄位需要 ISO 8601 格式

(() => {
  'use strict';

  const CONFIG = {
    // 動作名稱 → 需要的驗證規則
    ACTION_RULES: {
      '提交審核': {
        requiredFields: ['quantity', 'unit_price', 'delivery_date'],
        autoSet: {
          submit_datetime: () => new Date().toISOString(),  // ISO 8601!
        },
      },
      '核准': {
        requiredFields: ['approver_comment'],
        autoSet: {
          approved_datetime: () => new Date().toISOString(),
        },
        // 只有特定職稱才能執行
        allowedTitles: ['部長', '課長'],
      },
      '退回': {
        requiredFields: ['reject_reason'],
        autoSet: {},
      },
    },
  };

  // 驗證必填欄位
  const validateRequired = (record, fieldCodes) => {
    const empty = fieldCodes.filter((code) => {
      const val = record[code]?.value;
      return val === undefined || val === null || val === '';
    });
    return empty;
  };

  // 驗證使用者職稱（利用你常用的組織查詢）
  const checkUserTitle = async (allowedTitles) => {
    if (!allowedTitles || allowedTitles.length === 0) return true;
    const orgs = kintone.user.getOrganizations();
    // 注意：getOrganizations() 回傳的物件包含 name 和 code
    // 如果需要查「職稱」，可能要另外用 REST API 查使用者資訊
    // 這裡簡化為檢查組織名稱
    return orgs.some((org) => allowedTitles.includes(org.name));
  };

  kintone.events.on([
    'app.record.detail.process.proceed',
    'mobile.app.record.detail.process.proceed',
  ], async (event) => {
    const action = event.action.value;
    const rules = CONFIG.ACTION_RULES[action];

    if (!rules) return event;  // 沒有定義規則的動作，直接放行

    // 1. 驗證必填
    const emptyFields = validateRequired(event.record, rules.requiredFields);
    if (emptyFields.length > 0) {
      event.error = `以下欄位為必填：${emptyFields.join(', ')}`;
      return event;
    }

    // 2. 驗證權限
    if (rules.allowedTitles) {
      const allowed = await checkUserTitle(rules.allowedTitles);
      if (!allowed) {
        event.error = '您的職稱沒有權限執行此操作';
        return event;
      }
    }

    // 3. 自動設值
    Object.entries(rules.autoSet).forEach(([field, valueFn]) => {
      if (event.record[field]) {
        event.record[field].value = valueFn();
      }
    });

    return event;
  });
})();


// =============================================================
// P6. 表單驗證（存檔前攔截）
// =============================================================
// 場景：使用者按儲存時，檢查商業邏輯是否正確
// 適用：submit 事件
//
// 你之前的實際案例：
//   - 供應商記錄的重複驗證（區分「恢復」vs「年度更新」的不同規則）

(() => {
  'use strict';

  const CONFIG = {
    // 重複檢查設定
    DUPLICATE_CHECK: {
      APP_ID: 100,
      KEY_FIELD: 'supplier_code',
      // 不同動作類型有不同的驗證規則
      RULES: {
        '年度定期更新': {
          // 同一供應商 + 同年度不能重複
          additionalQuery: (record) => {
            const year = new Date().getFullYear();
            return ` and update_year = "${year}"`;
          },
          errorMessage: '該供應商本年度已有更新記錄',
        },
        '恢復': {
          // 恢復不檢查年度，但檢查狀態
          additionalQuery: () => ' and status = "有效"',
          errorMessage: '該供應商目前狀態為有效，無需恢復',
        },
      },
    },
  };

  const checkDuplicate = async (record) => {
    const actionType = record.action_type?.value;
    const keyValue = record[CONFIG.DUPLICATE_CHECK.KEY_FIELD]?.value;

    if (!keyValue) return null;  // 沒填 key 就不檢查

    const rule = CONFIG.DUPLICATE_CHECK.RULES[actionType];
    if (!rule) return null;  // 沒有定義規則的動作類型，不檢查

    let query = `${CONFIG.DUPLICATE_CHECK.KEY_FIELD} = "${keyValue}"`;
    query += rule.additionalQuery(record);

    // 如果是編輯模式，排除自身
    const recordId = kintone.app.record.getId();
    if (recordId) {
      query += ` and $id != "${recordId}"`;
    }

    const resp = await kintone.api(
      kintone.api.url('/k/v1/records.json', true),
      'GET',
      { app: CONFIG.DUPLICATE_CHECK.APP_ID, query, fields: ['$id'], totalCount: true }
    );

    if (resp.totalCount !== '0') {
      return rule.errorMessage;
    }
    return null;
  };

  kintone.events.on([
    'app.record.create.submit',
    'app.record.edit.submit',
    'mobile.app.record.create.submit',
    'mobile.app.record.edit.submit',
  ], async (event) => {
    const error = await checkDuplicate(event.record);
    if (error) {
      event.error = error;
    }
    return event;
  });
})();
