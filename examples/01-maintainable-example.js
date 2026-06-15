/**
 * ============================================================
 * [App 639] 品質管理系統 - 跨應用資料整合與卡片式 UI 顯示
 * ============================================================
 *
 * 【商業目的】
 *   品質管理記錄需要一個「總評等級 total_grade」，依供應商 App(ID:450)
 *   的歷史品質評分平均計算。本檔示範維護該欄位的三種策略 A/B/C，
 *   並在詳情頁以卡片式 UI 顯示供應商歷史評分。
 *
 * 【total_grade 的三種維護策略】
 *   A. 純顯示      ── 不存欄位，看記錄時即時算給人看。最省，但無法用於清單/報表。
 *   B. 存檔當下算  ──（本檔主程式）submit 時算好寫入，自然持久化、可報表。最標準。
 *   C. 後端批次    ── 供應商評分會變、又沒人重存這筆時，用排程重算回填。最不過期、最重。
 *   關係：B 是預設；A 與 B 互斥（見下方註解）；C 與 B 互補（B 管新存、C 管回填/刷新）。
 *
 * 【影響的欄位代碼】
 *   - 供應商代碼:    supplier_code   (文字欄位, 讀取用)
 *   - 品質評分顯示:  quality_cards   (空白欄位, 用來插入卡片)
 *   - 總評等級:      total_grade     (下拉選單 A/B/C/D, 由策略 B 或 C 寫入)
 *
 * 【依賴】
 *   - API Token: 需同時授權 App 639 (閱覽/編輯) + App 450 (閱覽)
 *   - 策略 C 需先載入 patterns/02-pattern-library.js（複用 window.KintoneUtils）
 *
 * 【注意事項】
 *   - detail.show 是唯讀畫面：改 event.record 不會存檔（doc 06 §10），
 *     所以「寫 total_grade」放在 submit（策略 B），不放在 detail.show。
 *   - 查詢只取需要的欄位（fields 白名單），降低記憶體與傳輸量。
 *
 * 【變更履歷】
 *   2026-01-15  Jimmy  初版建立
 *   2026-02-20  Jimmy  新增列印畫面的卡片縮放邏輯
 *   2026-03-10  Jimmy  修正 DATETIME 欄位 ISO 8601 格式問題
 *   2026-06-15  Jimmy  記憶體/安全強化：包進 IIFE、fields 白名單、卡片 DOM 化消除 XSS
 *   2026-06-15  Jimmy  total_grade 改由 submit 計算持久化（策略 B）、detail.show
 *                      只負責顯示；補上純顯示(A)與後端批次(C)兩種替代方案
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
    GRADE_THRESHOLDS: { A: 90, B: 70, C: 50 }, // 50 以下為 D
    GRADE_COLORS: { A: '#4CAF50', B: '#2196F3', C: '#FF9800', D: '#F44336' },
    QUERY_LIMIT: 100,
  });

  // ===== 共用錯誤包裝（doc 06 §7）=====
  const safeHandler = (fn) => async (event) => {
    try {
      return await fn(event);
    } catch (err) {
      console.error('[App639]', err);
      if (event?.type?.includes('submit')) {
        event.error = `系統錯誤，請截圖回報：${err.message}`;
      }
      return event;
    }
  };

  // ===== 共用工具 =====

  /** 根據分數計算評等 A/B/C/D */
  const calcGrade = (score) => {
    switch (true) {
      case score >= CONFIG.GRADE_THRESHOLDS.A: return 'A';
      case score >= CONFIG.GRADE_THRESHOLDS.B: return 'B';
      case score >= CONFIG.GRADE_THRESHOLDS.C: return 'C';
      default:                                 return 'D';
    }
  };

  /** 平均分數；無記錄回傳 null */
  const averageScore = (records) => {
    if (records.length === 0) return null;
    const sum = records.reduce(
      (acc, r) => acc + (Number(r[CONFIG.FIELD.SUP_SCORE].value) || 0),
      0,
    );
    return sum / records.length;
  };

  /** 抓「單一供應商」的歷史評分（策略 B 與 detail 顯示共用） */
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

  // ===== 顯示層（DOM 節點 + textContent，避免 XSS）=====

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
   * 渲染評分卡片到容器
   * @param {Array} records
   * @param {HTMLElement} container
   * @param {string} [headerText] - 選填：策略 A 純顯示時，把即時總評顯示在最上方
   */
  const renderScoreCards = (records, container, headerText) => {
    container.textContent = ''; // 先清空，避免 detail.show 重複觸發時卡片疊加（DOM 堆積）

    if (headerText) {
      const h = document.createElement('div');
      h.style.cssText = 'font-weight:bold; margin-bottom:6px;';
      h.textContent = headerText;
      container.appendChild(h);
    }

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

  // =============================================================
  // 策略 B（主程式，推薦預設）：submit 時計算 total_grade → 持久化
  // =============================================================
  // 在存檔當下算好寫入，會真正存進資料庫，可用於清單篩選與報表彙總。
  // 單一 submit 入口 + safeHandler（doc 06 §1）。符合 doc 08 原則 1：
  // 重運算放在「使用者主動存檔」這一刻，而非每次開畫面（show）都算。
  kintone.events.on(
    [
      'app.record.create.submit',
      'app.record.edit.submit',
      'mobile.app.record.create.submit',
      'mobile.app.record.edit.submit',
    ],
    safeHandler(async (event) => {
      const record = event.record;
      const scores = await fetchSupplierScores(
        record[CONFIG.FIELD.SUPPLIER_CODE].value,
      );
      const avg = averageScore(scores);
      if (avg !== null) {
        record[CONFIG.FIELD.TOTAL_GRADE].value = calcGrade(avg); // submit 寫入 → 會存檔
      }
      return event;
    }),
  );

  // =============================================================
  // detail.show（顯示用）：只渲染卡片，不寫 total_grade
  // =============================================================
  // total_grade 已由策略 B 在存檔時寫好；這裡讀現成的、不再運算寫入
  // （detail.show 改 event.record 不會存檔，硬寫只是三不管地帶）。
  kintone.events.on(
    ['app.record.detail.show', 'mobile.app.record.detail.show'],
    safeHandler(async (event) => {
      const scores = await fetchSupplierScores(
        event.record[CONFIG.FIELD.SUPPLIER_CODE].value,
      );
      const spaceEl = kintone.app.record.getSpaceElement(
        CONFIG.FIELD.QUALITY_CARDS,
      );
      if (spaceEl) renderScoreCards(scores, spaceEl);
      return event;
    }),
  );

  // =============================================================
  // 策略 A（純顯示，替代方案 — 與策略 B 互斥）
  // =============================================================
  // 若 total_grade「不需要存、不進報表」，就別用上面的 submit 寫欄位，
  // 改成在 detail.show 把即時算出的評等也渲染進空白欄（甚至可刪掉 total_grade 欄位）。
  // 改法：移除策略 B 的 submit handler，detail.show 內改成 ──
  //
  //   const scores = await fetchSupplierScores(code);
  //   const avg = averageScore(scores);
  //   const grade = avg === null ? '—' : calcGrade(avg);
  //   renderScoreCards(scores, spaceEl, `即時總評：${grade}`);
  //
  // 優點：永遠即時、不會過期、少一個欄位；缺點：清單/報表拿不到、每次看都要查一次。

  // =============================================================
  // 策略 C（後端批次，與策略 B 互補）：重算回填全部記錄的 total_grade
  // =============================================================
  // 適用：供應商評分會變動，但沒人會重新存舊的品管記錄 → 存檔時算的值會過期。
  // 由「管理員主動觸發」或排程呼叫，絕不放進互動事件（doc 08 原則 1）。
  // 正式環境建議搬到 Node/Cloud Function 跑；以下為前端版，複用 patterns/02 的串流工具。
  //
  // 記憶體做法：先串流供應商 App 建「代號→平均評等」Map（原則 3+5，只留小 Map），
  // 再串流品管 App、逐 100 筆 flush 更新（原則 5+6，不堆積整份更新）。
  const recalcAllGrades = async () => {
    const utils = window.KintoneUtils;
    if (!utils?.forEachRecord || !utils?.bulkUpdate) {
      throw new Error(
        '策略 C 需先載入 patterns/02-pattern-library.js（window.KintoneUtils）',
      );
    }

    // 1) 串流供應商 App，彙總每個代號的平均分 → 評等 Map（只留小 Map，不留原始記錄）
    const sumByCode = new Map();
    const cntByCode = new Map();
    await utils.forEachRecord(
      CONFIG.APP_ID.SUPPLIER,
      (rec) => {
        const code = rec[CONFIG.FIELD.SUP_CODE].value;
        if (!code) return;
        sumByCode.set(
          code,
          (sumByCode.get(code) || 0) + (Number(rec[CONFIG.FIELD.SUP_SCORE].value) || 0),
        );
        cntByCode.set(code, (cntByCode.get(code) || 0) + 1);
      },
      { fields: [CONFIG.FIELD.SUP_CODE, CONFIG.FIELD.SUP_SCORE] },
    );

    const gradeByCode = new Map();
    for (const [code, sum] of sumByCode) {
      gradeByCode.set(code, calcGrade(sum / cntByCode.get(code)));
    }

    // 2) 串流品管 App，湊滿 100 筆就 flush 一次更新（不一次堆積所有更新，原則 5+6+7）
    let buffer = [];
    const flush = async () => {
      if (buffer.length === 0) return;
      const batch = buffer;
      buffer = [];
      await utils.bulkUpdate(CONFIG.APP_ID.QUALITY, batch, (u) => u);
    };

    await utils.forEachRecord(
      CONFIG.APP_ID.QUALITY,
      async (rec) => {
        const grade = gradeByCode.get(rec[CONFIG.FIELD.SUPPLIER_CODE].value);
        if (!grade) return;
        buffer.push({
          id: rec.$id.value,
          record: { [CONFIG.FIELD.TOTAL_GRADE]: { value: grade } },
        });
        if (buffer.length >= 100) await flush();
      },
      { fields: [CONFIG.FIELD.SUPPLIER_CODE] },
    );

    await flush();
  };

  // 給管理員工具按鈕呼叫（不自動執行）。
  // ⚠️ 只掛「函式」，不要把抓回來的大資料掛上 window（原則 7）。
  window.App639 = window.App639 || {};
  window.App639.recalcAllGrades = recalcAllGrades;
})();
