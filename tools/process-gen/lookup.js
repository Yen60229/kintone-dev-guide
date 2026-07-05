#!/usr/bin/env node
'use strict';
/**
 * lookup.js — 查詢某個 App 可用的「處理人代碼」，設計流程前先跑這支
 *
 * 用法：
 *   node lookup.js --app 140
 *
 * 環境變數同 apply.js：
 *   KINTONE_BASE_URL=https://your-domain.cybozu.com
 *   KINTONE_API_TOKEN=xxx                       ← 只能查到欄位（App 層級权限即可）
 *   KINTONE_USERNAME=xxx KINTONE_PASSWORD=xxx   ← 要查群組/組織清單需要系統管理權限
 *
 * 輸出三張表，對應 spec.js 裡 assignee / onlyFor 要填的代碼：
 *   ① 這個 App 「選擇使用者/群組/組織」型欄位 → 可用 field:欄位代碼
 *   ② 系統的群組清單 → 可用 group:群組代碼（需要系統管理權限，查不到會提示改用畫面查）
 *   ③ 系統的組織清單 → 可用 org:組織代碼（同上）
 */
const BASE = process.env.KINTONE_BASE_URL;
const TOKEN = process.env.KINTONE_API_TOKEN;
const USER = process.env.KINTONE_USERNAME;
const PASS = process.env.KINTONE_PASSWORD;

function headers() {
  const h = {};
  if (USER && PASS) {
    h['X-Cybozu-Authorization'] = Buffer.from(`${USER}:${PASS}`).toString('base64');
  } else if (TOKEN) {
    h['X-Cybozu-API-Token'] = TOKEN;
  }
  return h;
}

async function api(base, apiPath, query) {
  const url = new URL(apiPath, base);
  Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const resp = await fetch(url, { headers: headers() });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    const err = new Error(json.message || text);
    err.code = json.code;
    err.status = resp.status;
    throw err;
  }
  return json;
}

const ENTITY_FIELD_TYPES = new Set([
  'USER_SELECT', 'ORGANIZATION_SELECT', 'GROUP_SELECT', 'CREATOR', 'MODIFIER',
]);

async function main() {
  const args = process.argv.slice(2);
  const appIdx = args.indexOf('--app');
  const app = appIdx >= 0 ? args[appIdx + 1] : null;

  if (!BASE) { console.error('請設定環境變數 KINTONE_BASE_URL'); process.exit(1); }
  if (!TOKEN && !(USER && PASS)) { console.error('請設定 KINTONE_API_TOKEN 或 KINTONE_USERNAME/KINTONE_PASSWORD'); process.exit(1); }
  if (!app) { console.error('用法：node lookup.js --app <App ID>'); process.exit(1); }

  console.log(`\n① App ${app} 可當處理人的欄位（可用 field:欄位代碼）\n${'─'.repeat(60)}`);
  try {
    const { properties } = await api(BASE, '/k/v1/app/form/fields.json', { app });
    const rows = Object.values(properties).filter((f) => ENTITY_FIELD_TYPES.has(f.type));
    if (!rows.length) {
      console.log('（這個 App 沒有「選擇使用者/組織/群組」型欄位）');
    } else {
      rows.forEach((f) => {
        console.log(`  field:${f.code}`.padEnd(34) + `${f.label}（${f.type}）`);
      });
    }
    console.log('\n  另外任何 App 都能用：field:建立人 = CREATOR、field:更新人 = MODIFIER（系統內建，不會出現在上表）');
  } catch (e) {
    console.log(`  查詢失敗：${e.message}（確認 App ID 與驗證權限）`);
  }

  console.log(`\n② 系統群組清單（可用 group:群組代碼）\n${'─'.repeat(60)}`);
  try {
    const { groupList } = await api(BASE.replace(/\/k\/?$/, ''), '/v1/groups.json', {});
    if (!groupList || !groupList.length) {
      console.log('（查無群組，或帳號沒有系統管理權限）');
    } else {
      groupList.forEach((g) => console.log(`  group:${g.code}`.padEnd(34) + `${g.name}`));
    }
  } catch (e) {
    console.log(`  查詢失敗：${e.message}`);
    console.log('  這支 API 需要系統管理員權限（帳號密碼或系統管理用 Token，一般 App 專用 Token 查不到）。');
    console.log('  查不到時改用畫面：kintone「系統管理 → 使用者與系統管理 → 群組」，代碼欄就是 group: 後面要填的值。');
  }

  console.log(`\n③ 系統組織清單（可用 org:組織代碼）\n${'─'.repeat(60)}`);
  try {
    const resp = await api(BASE.replace(/\/k\/?$/, ''), '/v1/organizations.json', { size: 100 });
    const orgs = resp.organizationTitleList || resp.organizations || [];
    if (!orgs.length) {
      console.log('（查無組織，或帳號沒有系統管理權限；或此環境回應結構與預期不同，請改用畫面查詢）');
    } else {
      orgs.forEach((o) => console.log(`  org:${o.code}`.padEnd(34) + `${o.name}`));
    }
  } catch (e) {
    console.log(`  查詢失敗：${e.message}`);
    console.log('  查不到時改用畫面：kintone「系統管理 → 使用者與系統管理 → 組織」，代碼欄就是 org: 後面要填的值。');
  }

  console.log(`\n提示：user:帳號 直接用該使用者的登入名即可，不需要查詢，但盡量少用（人事異動就失效）。\n`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
