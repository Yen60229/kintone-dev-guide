#!/usr/bin/env node
'use strict';
/**
 * compare.js — 語意比對兩份流程管理設定 JSON
 *
 * 用法：node compare.js <A.json> <B.json>
 *
 * 「語意差異」：狀態集合、處理人、動作（名稱/來源/目標/條件/類型/執行者）不同 → exit 1
 * 「外觀差異」：索引順序、動作陣列排列順序不同（只影響畫面排列）→ 僅提示，exit 0
 * revision 一律忽略。用途：generate 產物 vs 線上現況、匯入前確認只改到想改的。
 */
const fs = require('fs');
const path = require('path');

function load(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

// 處理人正規化：entities 排序後序列化，排除排列順序造成的假差異
function canonAssignee(a) {
  if (!a) return 'null';
  const entities = (a.entities || [])
    .map((e) => `${e.entity.type}:${e.entity.code || ''}:${e.includeSubs ? 1 : 0}`)
    .sort();
  return `${a.type}|${entities.join(',')}`;
}

function canonExec(e) {
  if (!e) return '';
  return (e.entities || [])
    .map((x) => `${x.entity.type}:${x.entity.code || ''}`)
    .sort()
    .join(',');
}

// 動作的語意鍵：同鍵視為同一顆按鈕
function actionKey(a) {
  return [a.from, a.name, a.to, a.filterCond || '', a.type || 'PRIMARY', canonExec(a.executableUser)].join('§');
}

function main() {
  const [fileA, fileB] = process.argv.slice(2);
  if (!fileA || !fileB) {
    console.error('用法：node compare.js <A.json> <B.json>');
    process.exit(1);
  }
  const A = load(fileA);
  const B = load(fileB);
  let semantic = 0;
  let cosmetic = 0;

  if (!!A.enable !== !!B.enable) {
    console.log(`❌ enable 不同：A=${A.enable} B=${B.enable}`);
    semantic += 1;
  }

  // ── 狀態 ──
  const aStates = A.states || {};
  const bStates = B.states || {};
  for (const name of Object.keys(aStates)) {
    if (!bStates[name]) { console.log(`❌ 狀態「${name}」只存在於 A`); semantic += 1; }
  }
  for (const name of Object.keys(bStates)) {
    if (!aStates[name]) { console.log(`❌ 狀態「${name}」只存在於 B`); semantic += 1; }
  }
  for (const name of Object.keys(aStates)) {
    const sa = aStates[name];
    const sb = bStates[name];
    if (!sb) continue;
    if (canonAssignee(sa.assignee) !== canonAssignee(sb.assignee)) {
      console.log(`❌ 狀態「${name}」處理人不同：\n   A: ${canonAssignee(sa.assignee)}\n   B: ${canonAssignee(sb.assignee)}`);
      semantic += 1;
    }
    if (String(sa.index) !== String(sb.index)) {
      console.log(`◽ 狀態「${name}」索引不同（僅影響顯示順序）：A=${sa.index} B=${sb.index}`);
      cosmetic += 1;
    }
  }

  // ── 動作（多重集合比對）──
  const countByKey = (list) => {
    const m = new Map();
    for (const a of list || []) m.set(actionKey(a), (m.get(actionKey(a)) || 0) + 1);
    return m;
  };
  const ma = countByKey(A.actions);
  const mb = countByKey(B.actions);
  const describe = (key) => {
    const [from, name, to, cond, type] = key.split('§');
    return `${from} →「${name}」→ ${to}${cond ? `（條件：${cond}）` : ''}［${type}］`;
  };
  for (const [key, n] of ma) {
    const d = n - (mb.get(key) || 0);
    if (d > 0) { console.log(`❌ 動作只在 A（×${d}）：${describe(key)}`); semantic += d; }
  }
  for (const [key, n] of mb) {
    const d = n - (ma.get(key) || 0);
    if (d > 0) { console.log(`❌ 動作只在 B（×${d}）：${describe(key)}`); semantic += d; }
  }

  // 陣列排列順序（語意相同時才提）
  if (semantic === 0) {
    const seqA = (A.actions || []).map(actionKey).join('\n');
    const seqB = (B.actions || []).map(actionKey).join('\n');
    if (seqA !== seqB) {
      console.log('◽ 動作內容相同，但陣列排列順序不同（僅影響按鈕顯示順序）');
      cosmetic += 1;
    }
  }

  console.log(`\n語意差異：${semantic}　外觀差異：${cosmetic}`);
  if (semantic === 0) {
    console.log('✅ 兩份設定語意等價');
  }
  process.exit(semantic === 0 ? 0 : 1);
}

main();
