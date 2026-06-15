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
 *   - 品質評分顯示:  quality_cards   (空白欄位, 用來插入卡片)
 *   - 總評等級:      total_grade     (下拉選單, 自動設值)
 *
 * 【依賴】
 *   - API Token: 需同時授權 App 639 (閱覽) + App 450 (閱覽)
 *   - 外部 CSS: 無
 *   - 外部 Library: 無
 *
 * 【注意事項】
 *   - App 450 記錄數約 3000 筆，使用 query 篩選 + limit，不需 cursor
 *   - 供應商代碼為空時不執行查詢（避免全量拉取）
 *   - 查詢只取需要的欄位（fields 白名單），降低記憶體與傳輸量
 *
 * 【變更履歷】
 *   2026-01-15  Jimmy  初版建立
 *   2026-02-20  Jimmy  新增列印畫面的卡片縮放邏輯
 *   2026-03-10  Jimmy  修正 DATETIME 欄位 ISO 8601 格式問題
 *   2026-06-15  Jimmy  記憶體/安全強化：包進 IIFE、查詢加 fields 白名單、
 *                      卡片改用 DOM 建立（textContent）消除 XSS
 * ============================================================
 */

(() => {
  'use strict';

  // ===== CONFIG：集中管理所有可能變動的值 =====
  const CONFIG = Object.freeze({
    APP_ID: {
      QUALITY: 639, // 本應用
      SUPPLIER: 450, // 供應商主檔
    },
    FIELD: {
      SUPPLIER_CODE: 'supplier_code',
      QUALITY_CARDS: 'quality_cards', // 空白欄位 ID
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
    GRADE_COLORS: { A: '#4CAF50', B: '#2196F3', C: '#FF9800', D: '#F44336' },
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
      {
        app: CONFIG.APP_ID.SUPPLIER,
        query,
        // fields 白名單：只取渲染與計算會用到的欄位（記憶體原則 4）
        fields: [CONFIG.FIELD.SUP_SCORE, CONFIG.FIELD.SUP_DATE],
      },
    );
    return resp.records;
  };

  /**
   * 建立單張評分卡片（用 DOM 節點 + textContent，避免 XSS）
   * @param {Object} rec - kintone 記錄
   * @returns {HTMLElement}
   */
  const buildScoreCard = (rec) => {
    const score = Number(rec[CONFIG.FIELD.SUP_SCORE].value) || 0;
    const date = rec[CONFIG.FIELD.SUP_DATE].value || '—';
    const grade = calcGrade(score);
    // 顏色來自固定對照表（key 只會是 A/B/C/D），插入 style 安全
    const color = CONFIG.GRADE_COLORS[grade];

    const card = document.createElement('div');
    card.style.cssText =
      'display:inline-block; width:160px; margin:4px; padding:12px;' +
      'border-radius:8px; border:1px solid #ddd; text-align:center;';

    const gradeEl = document.createElement('div');
    gradeEl.style.cssText = `font-size:28px; font-weight:bold; color:${color};`;
    gradeEl.textContent = grade; // textContent：使用者資料不會被當 HTML 解析

    const scoreEl = document.createElement('div');
    scoreEl.style.cssText = 'font-size:14px; margin-top:4px;';
    scoreEl.textContent = `${score} 分`;

    const dateEl = document.createElement('div');
    dateEl.style.cssText = 'font-size:12px; color:#888; margin-top:4px;';
    dateEl.textContent = date;

    card.append(gradeEl, scoreEl, dateEl);
    return card;
  };

  /**
   * 將評分記錄渲染進指定容器
   * @param {Array} records - kintone 記錄陣列
   * @param {HTMLElement} container - 空白欄位的 DOM 容器
   */
  const renderScoreCards = (records, container) => {
    container.textContent = ''; // 先清空，避免 detail.show 重複觸發時卡片疊加（DOM 堆積）

    if (records.length === 0) {
      const empty = document.createElement('p');
      empty.style.color = '#888';
      empty.textContent = '尚無歷史評分記錄';
      container.appendChild(empty);
      return;
    }

    // 用 DocumentFragment 一次掛載，減少 reflow
    const frag = document.createDocumentFragment();
    for (const rec of records) frag.appendChild(buildScoreCard(rec));
    container.appendChild(frag);
  };

  // ===== 事件處理 =====

  kintone.events.on(
    ['app.record.detail.show', 'mobile.app.record.detail.show'],
    async (event) => {
      const record = event.record;
      const supplierCode = record[CONFIG.FIELD.SUPPLIER_CODE].value;

      // 1. 獲取歷史評分
      const scores = await fetchSupplierScores(supplierCode);

      // 2. 渲染卡片到空白欄位
      const spaceEl = kintone.app.record.getSpaceElement(
        CONFIG.FIELD.QUALITY_CARDS,
      );
      if (spaceEl) {
        renderScoreCards(scores, spaceEl);
      }

      // 3. 計算總評並設值（僅在有記錄時）
      if (scores.length > 0) {
        const avgScore =
          scores.reduce(
            (sum, r) => sum + (Number(r[CONFIG.FIELD.SUP_SCORE].value) || 0),
            0,
          ) / scores.length;
        record[CONFIG.FIELD.TOTAL_GRADE].value = calcGrade(avgScore);
      }

      return event;
    },
  );
})();
