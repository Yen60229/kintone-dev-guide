/**
 * ============================================================
 * [App 639] 品質管理系統 - 跨應用資料整合與卡片式 UI 顯示
 * ============================================================
 *
 * 【商業目的】
 *   在品質管理記錄的詳情頁面，自動從供應商 App(ID:450) 拉取
 *   該供應商的歷史品質評分，並以卡片式 UI 顯示在空白欄位中。
 *
 * 【影響的欄位代碼】
 *   - 供應商代碼:    supplier_code   (文字欄位, 讀取用)
 *   - 品質評分顯示:  quality_cards   (空白欄位, 用來插入 HTML)
 *   - 總評等級:      total_grade     (下拉選單, 自動設值)
 *
 * 【依賴】
 *   - API Token: 需同時授權 App 639 (閱覽) + App 450 (閱覽)
 *   - 外部 CSS: 無
 *   - 外部 Library: 無
 *
 * 【注意事項】
 *   - App 450 記錄數約 3000 筆，使用 query 篩選，不需 cursor
 *   - 供應商代碼為空時不執行查詢（避免全量拉取）
 *
 * 【變更履歷】
 *   2026-01-15  Jimmy  初版建立
 *   2026-02-20  Jimmy  新增列印畫面的卡片縮放邏輯
 *   2026-03-10  Jimmy  修正 DATETIME 欄位 ISO 8601 格式問題
 * ============================================================
 */

// ===== CONFIG：集中管理所有可能變動的值 =====
const CONFIG = Object.freeze({
  APP_ID: {
    QUALITY: 639,       // 本應用
    SUPPLIER: 450,      // 供應商主檔
  },
  FIELD: {
    SUPPLIER_CODE: 'supplier_code',
    QUALITY_CARDS: 'quality_cards',   // 空白欄位 ID
    TOTAL_GRADE: 'total_grade',
    // --- App 450 的欄位 ---
    SUP_CODE: 'sup_code',
    SUP_SCORE: 'sup_quality_score',
    SUP_DATE: 'sup_eval_date',
  },
  GRADE_THRESHOLDS: {
    A: 90,
    B: 70,
    C: 50,
    // 50 以下為 D
  },
  QUERY_LIMIT: 100,
});

// ===== 工具函式 =====

/**
 * 根據分數計算評等
 * @param {number} score - 品質評分 (0-100)
 * @returns {string} 評等 A/B/C/D
 */
const calcGrade = (score) => {
  if (score >= CONFIG.GRADE_THRESHOLDS.A) return 'A';
  if (score >= CONFIG.GRADE_THRESHOLDS.B) return 'B';
  if (score >= CONFIG.GRADE_THRESHOLDS.C) return 'C';
  return 'D';
};

/**
 * 從供應商 App 獲取歷史品質評分
 * @param {string} supplierCode - 供應商代碼
 * @returns {Promise<Array>} 評分記錄陣列
 */
const fetchSupplierScores = async (supplierCode) => {
  if (!supplierCode) return [];

  const query = `${CONFIG.FIELD.SUP_CODE} = "${supplierCode}" order by ${CONFIG.FIELD.SUP_DATE} desc limit ${CONFIG.QUERY_LIMIT}`;
  const resp = await kintone.api(
    kintone.api.url('/k/v1/records.json', true),
    'GET',
    { app: CONFIG.APP_ID.SUPPLIER, query }
  );
  return resp.records;
};

/**
 * 將評分記錄渲染成卡片式 HTML
 * @param {Array} records - kintone 記錄陣列
 * @returns {string} HTML 字串
 */
const renderScoreCards = (records) => {
  if (records.length === 0) {
    return '<p style="color:#888;">尚無歷史評分記錄</p>';
  }

  return records.map((rec) => {
    const score = Number(rec[CONFIG.FIELD.SUP_SCORE].value) || 0;
    const date = rec[CONFIG.FIELD.SUP_DATE].value || '—';
    const grade = calcGrade(score);
    const color = { A: '#4CAF50', B: '#2196F3', C: '#FF9800', D: '#F44336' }[grade];

    return `
      <div style="display:inline-block; width:160px; margin:4px; padding:12px;
                  border-radius:8px; border:1px solid #ddd; text-align:center;">
        <div style="font-size:28px; font-weight:bold; color:${color};">${grade}</div>
        <div style="font-size:14px; margin-top:4px;">${score} 分</div>
        <div style="font-size:12px; color:#888; margin-top:4px;">${date}</div>
      </div>
    `;
  }).join('');
};

// ===== 事件處理 =====

kintone.events.on([
  'app.record.detail.show',
  'mobile.app.record.detail.show',
], async (event) => {
  const record = event.record;
  const supplierCode = record[CONFIG.FIELD.SUPPLIER_CODE].value;

  // 1. 獲取歷史評分
  const scores = await fetchSupplierScores(supplierCode);

  // 2. 渲染卡片到空白欄位
  const spaceEl = kintone.app.record.getSpaceElement(CONFIG.FIELD.QUALITY_CARDS);
  if (spaceEl) {
    spaceEl.innerHTML = renderScoreCards(scores);
  }

  // 3. 計算總評並設值（僅在有記錄時）
  if (scores.length > 0) {
    const avgScore = scores.reduce((sum, r) =>
      sum + (Number(r[CONFIG.FIELD.SUP_SCORE].value) || 0), 0
    ) / scores.length;
    record[CONFIG.FIELD.TOTAL_GRADE].value = calcGrade(avgScore);
  }

  return event;
});
