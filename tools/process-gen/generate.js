#!/usr/bin/env node
'use strict';
/**
 * generate.js — 從規格檔（spec）展開成 kintone 流程管理設定 JSON
 *
 * 用法：
 *   node generate.js <spec檔.js> [-o 輸出.json] [--production]
 *
 *   --production  移除 spec 中標記 devOnly: true 的動作（上線版）
 *
 * 規格檔格式見 spec.example.js 與 README.md。
 */
const fs = require('fs');
const path = require('path');

// ── 身分簡寫解析：'field:欄位代碼' | 'group:群組代碼' | 'org:組織代碼' | 'user:帳號' | 'creator' ──
function parseWho(str) {
  if (str === 'creator') return { type: 'CREATOR', code: '' };
  const i = str.indexOf(':');
  if (i < 0) throw new Error(`無法解析的身分寫法：「${str}」（應為 field:/group:/org:/user: 開頭）`);
  const kind = str.slice(0, i);
  const code = str.slice(i + 1);
  const map = { field: 'FIELD_ENTITY', group: 'GROUP', org: 'ORGANIZATION', user: 'USER' };
  if (!map[kind]) throw new Error(`無法解析的身分寫法：「${str}」`);
  return { type: map[kind], code };
}

// assignee 簡寫 → kintone 結構。
// null → 無處理人（終態用）；'field:X' → ONE；{ type:'ANY', who:[...] } → 指定模式
function buildAssignee(a) {
  if (a == null) return { type: 'ONE', entities: [] };
  if (typeof a === 'string') a = { type: 'ONE', who: [a] };
  return {
    type: a.type || 'ONE',
    entities: (a.who || []).map((w) => ({ entity: parseWho(w), includeSubs: !!a.includeSubs })),
  };
}

function buildExecutableUser(onlyFor) {
  if (!onlyFor || !onlyFor.length) return undefined;
  return { entities: onlyFor.map((w) => ({ entity: parseWho(w), includeSubs: false })) };
}

// 駁回狀態的預設名稱：結尾「確認」換成「駁回」，否則直接加「駁回」
function defaultRejectName(stateName) {
  return stateName.endsWith('確認') ? stateName.slice(0, -2) + '駁回' : stateName + '駁回';
}

function generate(spec, { production = false } = {}) {
  const policies = spec.policies || {};
  const rejectPolicy = policies.reject || {};
  const cancelPolicy = policies.cancel || null;

  const mains = spec.states.filter((s) => !s.terminal);
  const terminals = spec.states.filter((s) => s.terminal);

  // ── 索引配置規則：主要流程狀態（依列出順序）→ 駁回狀態 → 終態 ──
  // 任一狀態可用 index / reject.index 明確指定；未指定者依序補上未使用的號碼。
  const used = new Set();
  const takeExplicit = (n) => { used.add(n); return n; };
  let cursor = 0;
  const nextFree = () => { while (used.has(cursor)) cursor += 1; used.add(cursor); return cursor; };

  const stateEntries = []; // { name, index, assignee }

  for (const s of mains) {
    const idx = Number.isInteger(s.index) ? takeExplicit(s.index) : nextFree();
    stateEntries.push({ name: s.name, index: idx, assignee: buildAssignee(s.assignee) });
  }

  // 駁回狀態：先放明確指定 index 的，再依父關卡順序補位
  const rejectStates = []; // { name, parent }
  for (const s of mains) {
    if (!s.reject) continue;
    const conf = s.reject === true ? {} : s.reject;
    const name = conf.name || defaultRejectName(s.name);
    rejectStates.push({ name, parent: s.name, index: conf.index });
  }
  for (const r of rejectStates) {
    if (Number.isInteger(r.index)) takeExplicit(r.index);
  }
  for (const r of rejectStates) {
    if (!Number.isInteger(r.index)) r.index = nextFree();
    stateEntries.push({
      name: r.name,
      index: r.index,
      assignee: buildAssignee(rejectPolicy.assignee || null),
    });
  }

  for (const s of terminals) {
    const idx = Number.isInteger(s.index) ? takeExplicit(s.index) : nextFree();
    stateEntries.push({ name: s.name, index: idx, assignee: buildAssignee(s.assignee) });
  }

  const states = {};
  for (const e of stateEntries.sort((a, b) => a.index - b.index)) {
    states[e.name] = { name: e.name, index: String(e.index), assignee: e.assignee };
  }

  // ── 動作展開 ──
  const actions = [];
  const stripped = [];
  const pushAction = (a) => actions.push(a);

  const transitionsFrom = (stateName) =>
    (spec.transitions || []).filter((t) => t.from === stateName);

  const buildTransition = (t) => {
    if (production && t.devOnly) { stripped.push(`${t.from} →「${t.name}」→ ${t.to}`); return null; }
    const action = {
      name: t.name,
      from: t.from,
      to: t.to,
      filterCond: t.when || '',
      type: t.secondary ? 'SECONDARY' : 'PRIMARY',
    };
    const exec = buildExecutableUser(t.onlyFor);
    if (exec) action.executableUser = exec;
    return action;
  };

  const cancelActionFor = (stateName) => {
    if (!cancelPolicy) return null;
    if ((cancelPolicy.excludeFrom || []).includes(stateName)) return null;
    const override = (cancelPolicy.overrides || {})[stateName] || {};
    return {
      name: cancelPolicy.name,
      from: stateName,
      to: cancelPolicy.to,
      filterCond: cancelPolicy.when || '',
      type: 'SECONDARY',
      executableUser: buildExecutableUser(override.onlyFor || cancelPolicy.onlyFor),
    };
  };

  // 主要流程狀態：明確 transitions（依 spec 順序）→ 自動駁回 → 作廢
  for (const s of mains) {
    for (const t of transitionsFrom(s.name)) {
      const a = buildTransition(t);
      if (a) pushAction(a);
    }
    if (s.reject) {
      const conf = s.reject === true ? {} : s.reject;
      pushAction({
        name: rejectPolicy.actionName || '駁回',
        from: s.name,
        to: conf.name || defaultRejectName(s.name),
        filterCond: '',
        type: 'PRIMARY',
      });
    }
    const cancel = cancelActionFor(s.name);
    if (cancel) pushAction(cancel);
  }

  // 駁回狀態：再申請 → 作廢
  for (const r of rejectStates) {
    const reapply = rejectPolicy.reapply || {};
    pushAction({
      name: reapply.name || '再申請',
      from: r.name,
      to: reapply.to || (mains[1] && mains[1].name),
      filterCond: '',
      type: 'PRIMARY',
    });
    const cancel = cancelActionFor(r.name);
    if (cancel) pushAction(cancel);
  }

  // 終態的對外動作（少見，通常是測試用倒轉）
  for (const s of terminals) {
    for (const t of transitionsFrom(s.name)) {
      const a = buildTransition(t);
      if (a) pushAction(a);
    }
  }

  return {
    result: { enable: spec.enable !== false, states, actions },
    stripped,
  };
}

// ── CLI ──
if (require.main === module) {
  const args = process.argv.slice(2);
  const production = args.includes('--production');
  const oIdx = args.indexOf('-o');
  const outFile = oIdx >= 0 ? args[oIdx + 1] : null;
  const specFile = args.find((a) => !a.startsWith('-') && a !== outFile);

  if (!specFile) {
    console.error('用法：node generate.js <spec檔.js> [-o 輸出.json] [--production]');
    process.exit(1);
  }

  const spec = require(path.resolve(specFile));
  const { result, stripped } = generate(spec, { production });
  const json = JSON.stringify(result, null, 2);

  if (outFile) {
    fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
    fs.writeFileSync(path.resolve(outFile), json + '\n', 'utf8');
    console.log(`已產生：${outFile}`);
  } else {
    console.log(json);
  }
  console.log(`狀態 ${Object.keys(result.states).length} 個、動作 ${result.actions.length} 個`);
  if (stripped.length) {
    console.log(`\n--production 已移除 ${stripped.length} 個開發用動作：`);
    stripped.forEach((s) => console.log(`  - ${s}`));
  }
}

module.exports = { generate };
