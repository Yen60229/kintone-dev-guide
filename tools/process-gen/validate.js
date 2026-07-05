#!/usr/bin/env node
'use strict';
/**
 * validate.js — 流程管理設定 JSON 的匯入前檢查
 *
 * 用法：node validate.js <status.json>
 *
 * ❌ 錯誤（exit 1）：結構壞掉，匯入必失敗或行為不可預期
 * ⚠️ 警告：能匯入，但屬反模式或上線前該處理的項目
 * ℹ️ 提示：請人工確認的設計事實
 */
const fs = require('fs');
const path = require('path');

function validate(data) {
  const errors = [];
  const warnings = [];
  const infos = [];

  const states = data.states || {};
  const actions = data.actions || [];
  const stateNames = new Set(Object.keys(states));

  if (typeof data.enable !== 'boolean') errors.push('缺少 enable（布林值）');
  if (!stateNames.size) errors.push('states 為空');

  // ── 狀態檢查 ──
  const indexSeen = new Map();
  for (const [key, s] of Object.entries(states)) {
    if (s.name !== key) errors.push(`狀態「${key}」的 name（${s.name}）與 key 不一致`);
    if (!/^\d+$/.test(String(s.index))) errors.push(`狀態「${key}」的 index 不是字串數字：${s.index}`);
    if (indexSeen.has(String(s.index))) {
      errors.push(`狀態「${key}」與「${indexSeen.get(String(s.index))}」index 重複：${s.index}`);
    }
    indexSeen.set(String(s.index), key);
  }

  // ── 動作結構檢查 ──
  const outgoing = new Map();
  const incoming = new Map();
  for (const [i, a] of actions.entries()) {
    const label = `第 ${i + 1} 個動作「${a.name || '(無名稱)'}」`;
    if (!a.name) errors.push(`${label}沒有名稱`);
    if (!stateNames.has(a.from)) errors.push(`${label}的 from「${a.from}」不存在於 states`);
    if (!stateNames.has(a.to)) errors.push(`${label}的 to「${a.to}」不存在於 states`);
    if (a.type && !['PRIMARY', 'SECONDARY'].includes(a.type)) errors.push(`${label}的 type 無效：${a.type}`);
    outgoing.set(a.from, (outgoing.get(a.from) || []).concat([a]));
    incoming.set(a.to, (incoming.get(a.to) || []).concat([a]));
  }

  // 同一 from 的同名動作：允許（OR 分歧的標準手法），但條件不可同時為空
  const byFromName = new Map();
  for (const a of actions) {
    const k = `${a.from}§${a.name}`;
    byFromName.set(k, (byFromName.get(k) || []).concat([a]));
  }
  for (const [k, list] of byFromName) {
    if (list.length < 2) continue;
    const empties = list.filter((a) => !(a.filterCond || '').trim());
    const [from, name] = k.split('§');
    if (empties.length >= 2) {
      errors.push(`狀態「${from}」有 ${empties.length} 個同名且皆無條件的動作「${name}」，按鈕行為不可預期`);
    } else {
      infos.push(`狀態「${from}」的同名動作「${name}」×${list.length}（依條件分歧，屬正常手法）`);
    }
  }

  // ── filterCond 檢查 ──
  for (const a of actions) {
    const cond = a.filterCond || '';
    if (!cond) continue;
    const label = `動作「${a.name}」（${a.from}）的條件`;
    if ((cond.match(/"/g) || []).length % 2 !== 0) errors.push(`${label}引號不成對：${cond}`);
    const open = (cond.match(/\(/g) || []).length;
    const close = (cond.match(/\)/g) || []).length;
    if (open !== close) errors.push(`${label}括號不成對：${cond}`);
    if (/紀錄號碼|レコード番号|\$id/.test(cond)) {
      warnings.push(`${label}使用「紀錄號碼」判斷——匯入搬移後號碼會變（反模式），上線前應改掉：${cond}`);
    }
    if (/\("GROUP"|\("ORGANIZATION"/.test(cond)) {
      warnings.push(`${label}的 "GROUP"/"ORGANIZATION" token 前疑似缺少空格（正確為 " GROUP"）：${cond}`);
    }
  }

  // ── 圖形檢查 ──
  const entryIndex = [...Object.values(states)].sort((x, y) => Number(x.index) - Number(y.index))[0];
  for (const name of stateNames) {
    const out = outgoing.get(name) || [];
    const inn = incoming.get(name) || [];
    if (!out.length) infos.push(`狀態「${name}」沒有對外動作（終態？請確認是否符合預期）`);
    if (!inn.length && entryIndex && name !== entryIndex.name) {
      warnings.push(`狀態「${name}」沒有任何動作指向它（除入口狀態外，這通常是改名後的孤兒）`);
    }
  }

  // 簽核關卡應有駁回路徑；駁回狀態應有回頭路
  for (const name of stateNames) {
    const out = (outgoing.get(name) || []).map((a) => a.name).join('/');
    if (/確認$/.test(name) && out && !/駁回|退回|返回/.test(out)) {
      infos.push(`簽核關卡「${name}」沒有駁回類動作，請確認是否刻意`);
    }
    if (/駁回$/.test(name) && (outgoing.get(name) || []).every((a) => !/再申請|重新/.test(a.name))) {
      warnings.push(`駁回狀態「${name}」沒有「再申請」類的回頭動作，記錄會卡死在此`);
    }
  }

  // ── 上線前清單：測試／開發殘留 ──
  for (const a of actions) {
    const execGroups = ((a.executableUser || {}).entities || [])
      .map((e) => e.entity.code || '')
      .join(',');
    if (/開發|測試/.test(execGroups) || /^測試/.test(a.name)) {
      warnings.push(`疑似開發/測試用動作（上線前清單）：${a.from} →「${a.name}」→ ${a.to}`);
    }
  }
  for (const [name, s] of Object.entries(states)) {
    const isTerminalLike = !(outgoing.get(name) || []).some((a) => !/^測試/.test(a.name));
    const hasAssignee = ((s.assignee || {}).entities || []).length > 0;
    if (isTerminalLike && hasAssignee && /結束|作廢|完成/.test(name)) {
      warnings.push(`終態「${name}」設有處理人（${canonEntities(s.assignee)}）——終態通常不需要處理人`);
    }
  }

  return { errors, warnings, infos };
}

function canonEntities(a) {
  return ((a || {}).entities || []).map((e) => `${e.entity.type}:${e.entity.code}`).join('、');
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('用法：node validate.js <status.json>');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const { errors, warnings, infos } = validate(data);

  errors.forEach((m) => console.log(`❌ ${m}`));
  warnings.forEach((m) => console.log(`⚠️ ${m}`));
  infos.forEach((m) => console.log(`ℹ️ ${m}`));
  console.log(`\n錯誤 ${errors.length}、警告 ${warnings.length}、提示 ${infos.length}`);
  if (!errors.length) console.log(warnings.length ? '可匯入，但請逐條確認上面的警告。' : '✅ 檢查通過');
  process.exit(errors.length ? 1 : 0);
}

module.exports = { validate };
