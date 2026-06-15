/**
 * ============================================================
 * 安全的 Submit Handler 設計範例
 * ============================================================
 *
 * 這個檔案示範三個常見問題的正確解法：
 *   1. 多個 handler 覆蓋問題 → 單一入口 + 集中分派
 *   2. 重複提交問題         → isSubmitting flag
 *   3. 非同步 handler 的錯誤處理
 *
 * 對應文件：docs/06-security-stability.md § 1
 * ============================================================
 */

(() => {
  'use strict';

  // ─────────────────────────────────────────────
  // CONFIG：所有可變動的參數集中在這裡
  // ─────────────────────────────────────────────
  const CONFIG = Object.freeze({
    APP_ID: kintone.app.getId(),
    REQUIRED_FIELDS: ['supplier_code', 'check_qty', 'defect_qty'],
    MAX_DEFECT_RATE: 30,
    SUPPLIER_APP_ID: 100, // 供應商主檔 App
  });

  // ─────────────────────────────────────────────
  // 重複提交防護 flag
  // ─────────────────────────────────────────────
  let isSubmitting = false;

  // ─────────────────────────────────────────────
  // 通用錯誤包裝：所有 async handler 都套這個
  // ─────────────────────────────────────────────
  const safeHandler = (fn) => async (event) => {
    try {
      return await fn(event);
    } catch (err) {
      console.error('[submit-handler]', err);
      event.error = `系統錯誤，請截圖聯絡系統管理員：${err.message}`;
      return event;
    }
  };

  // ─────────────────────────────────────────────
  // ❌ 錯誤示範（不要這樣寫）
  // ─────────────────────────────────────────────
  //
  // 以下兩個 handler 同時存在時，第二個「不會覆蓋」第一個，
  // 兩個都會執行，且 return 順序不確定。
  //
  // kintone.events.on('app.record.edit.submit', (event) => {
  //   event.record.total.value = calc(event.record);
  //   return event; // ← 這個先 return，下面的驗證可能就沒用了
  // });
  //
  // kintone.events.on('app.record.edit.submit', (event) => {
  //   if (!validate(event.record)) {
  //     event.error = '驗證失敗'; // ← 可能被上面的 return 覆蓋而無效
  //   }
  //   return event;
  // });

  // ─────────────────────────────────────────────
  // ✅ 正確做法：只綁一次，所有邏輯集中在一個 handler 裡
  // ─────────────────────────────────────────────
  kintone.events.on(
    ['app.record.create.submit', 'app.record.edit.submit'],
    safeHandler(async (event) => {
      // 防止重複提交
      if (isSubmitting) {
        event.error = '正在處理中，請稍候...';
        return event;
      }
      isSubmitting = true;

      try {
        const record = event.record;

        // ── Step 1：計算（同步，不會失敗）──
        record.defect_rate.value = calcDefectRate(record);

        // ── Step 2：驗證（有問題就提早 return）──
        const validationError = validate(record);
        if (validationError) {
          event.error = validationError;
          return event;
        }

        // ── Step 3：非同步查詢（可能失敗，但 safeHandler 會接住）──
        const supplierName = await fetchSupplierName(record.supplier_code.value);
        record.supplier_name.value = supplierName;

        return event;
      } finally {
        // 無論成功或失敗，都要重置 flag
        isSubmitting = false;
      }
    })
  );

  // ─────────────────────────────────────────────
  // 計算：不良率
  // ─────────────────────────────────────────────
  const calcDefectRate = (record) => {
    const checkQty = Number(record.check_qty.value) || 0;
    const defectQty = Number(record.defect_qty.value) || 0;
    if (checkQty === 0) return '0';
    return ((defectQty / checkQty) * 100).toFixed(2);
  };

  // ─────────────────────────────────────────────
  // 驗證：回傳錯誤訊息字串，通過時回傳 null
  // ─────────────────────────────────────────────
  const validate = (record) => {
    // 必填欄位檢查
    for (const field of CONFIG.REQUIRED_FIELDS) {
      const value = record[field]?.value;
      if (value === null || value === undefined || value === '') {
        return `「${field}」為必填欄位，請填寫後再存檔。`;
      }
    }

    // 數值範圍檢查
    const defectRate = Number(record.defect_rate.value);
    if (defectRate > CONFIG.MAX_DEFECT_RATE) {
      return `不良率（${defectRate}%）超過上限 ${CONFIG.MAX_DEFECT_RATE}%，請確認數據是否正確。`;
    }

    return null; // 通過所有驗證
  };

  // ─────────────────────────────────────────────
  // 跨 App 查詢：從供應商主檔取得供應商名稱
  // ─────────────────────────────────────────────
  const fetchSupplierName = async (supplierCode) => {
    if (!supplierCode) return '';

    const resp = await kintone.api('/k/v1/records', 'GET', {
      app: CONFIG.SUPPLIER_APP_ID,
      query: `supplier_code = "${supplierCode}" limit 1`,
      fields: ['supplier_name'],
    });

    if (resp.records.length === 0) {
      throw new Error(`找不到供應商代碼：${supplierCode}`);
    }

    return resp.records[0].supplier_name.value;
  };
})();


// ============================================================
// 補充範例：多個功能需要共用 submit 時的模組化寫法
// ============================================================
// 當邏輯很複雜時，可以把每個「關切點」拆成獨立函式，
// 再在單一 handler 裡依序呼叫。

(() => {
  'use strict';

  // 各功能模組（純函式，易於單元測試）
  const Modules = {
    // 計算模組
    calculate: (record) => {
      record.total.value = String(
        Number(record.qty.value) * Number(record.price.value)
      );
    },

    // 驗證模組
    validate: (record) => {
      switch (true) {
        case !record.item_code.value:        return '品項代碼必填';
        case Number(record.qty.value) <= 0:  return '數量必須大於 0';
        default:                             return null;
      }
    },

    // 權限檢查模組
    checkPermission: async () => {
      const user = kintone.getLoginUser();
      const orgs = kintone.user.getOrganizations
        ? kintone.user.getOrganizations()
        : [];
      const isSupervisor = orgs.some((o) => o.code === 'SUPERVISOR');
      return isSupervisor;
    },
  };

  let isSubmitting = false;

  kintone.events.on('app.record.edit.submit', async (event) => {
    if (isSubmitting) {
      event.error = '正在處理中...';
      return event;
    }
    isSubmitting = true;

    try {
      // 依序執行各模組
      Modules.calculate(event.record);

      const error = Modules.validate(event.record);
      if (error) {
        event.error = error;
        return event;
      }

      const isSupervisor = await Modules.checkPermission();
      if (!isSupervisor && Number(event.record.amount.value) > 100000) {
        event.error = '金額超過 10 萬時，需要主管帳號才能存檔。';
        return event;
      }

      return event;
    } catch (err) {
      event.error = `系統錯誤：${err.message}`;
      return event;
    } finally {
      isSubmitting = false;
    }
  });
})();
