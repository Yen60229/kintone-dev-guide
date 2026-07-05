#!/usr/bin/env node
'use strict';
/**
 * apply.js — 把流程管理設定套用到 kintone（先測試環境，確認後才部署）
 *
 * 用法：
 *   node apply.js --app 140 --file out/vendor-flow.generated.json          # 備份 + 寫入測試環境
 *   node apply.js --app 140 --deploy --yes                                 # 把測試環境部署到正式
 *
 * 環境變數（擇一組）：
 *   KINTONE_BASE_URL=https://your-domain.cybozu.com
 *   KINTONE_API_TOKEN=token1,token2           ← 推薦；帳號有 2FA 時唯一可行的路
 *   KINTONE_USERNAME=xxx KINTONE_PASSWORD=xxx ← 帳號啟用 2FA 時會失敗（kintone 2FA 限制）
 *
 * 安全設計：
 *   - 寫入前自動備份正式環境現況到 backups/
 *   - PUT 只進「測試環境」（preview），畫面確認後才用 --deploy 部署
 *   - PUT 帶 revision，若設定已被別人改過會失敗而不是蓋掉
 *   - 檔案先過 validate，有錯誤（❌）直接中止
 */
const fs = require('fs');
const path = require('path');
const { validate } = require('./validate');

const BASE = process.env.KINTONE_BASE_URL;
const TOKEN = process.env.KINTONE_API_TOKEN;
const USER = process.env.KINTONE_USERNAME;
const PASS = process.env.KINTONE_PASSWORD;

function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (USER && PASS) {
    // 注意：帳號啟用 2FA 時，API 的密碼驗證會被 kintone 拒絕，請改用 API Token
    h['X-Cybozu-Authorization'] = Buffer.from(`${USER}:${PASS}`).toString('base64');
  } else if (TOKEN) {
    h['X-Cybozu-API-Token'] = TOKEN;
  }
  return h;
}

async function api(method, apiPath, body) {
  const url = new URL(apiPath, BASE);
  const opts = { method, headers: headers() };
  if (method === 'GET' && body) {
    Object.entries(body).forEach(([k, v]) => url.searchParams.set(k, v));
  } else if (body) {
    opts.body = JSON.stringify(body);
  }
  const resp = await fetch(url, opts);
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    const hint = json.code === 'CB_AU01'
      ? '（Session/驗證失敗——帳號若啟用 2FA，密碼驗證不可用，請改設 KINTONE_API_TOKEN）'
      : json.code === 'GAIA_CO02' || /revision/i.test(json.message || '')
        ? '(revision 衝突——設定在你抓取後被改過，請重新執行以取得最新狀態）'
        : '';
    throw new Error(`${method} ${apiPath} 失敗 [${resp.status}] ${json.code || ''} ${json.message || text} ${hint}`);
  }
  return json;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : null;
  };
  return {
    app: get('--app'),
    file: get('--file'),
    deploy: args.includes('--deploy'),
    yes: args.includes('--yes'),
    force: args.includes('--force'),
  };
}

async function main() {
  const { app, file, deploy, yes, force } = parseArgs();
  if (!BASE) { console.error('請設定 KINTONE_BASE_URL'); process.exit(1); }
  if (!TOKEN && !(USER && PASS)) { console.error('請設定 KINTONE_API_TOKEN 或 KINTONE_USERNAME/KINTONE_PASSWORD'); process.exit(1); }
  if (!app) { console.error('請指定 --app <App ID>'); process.exit(1); }

  // ── 部署模式：把測試環境設定推上正式 ──
  if (deploy) {
    if (!yes) {
      console.error('部署會把測試環境設定覆蓋到正式環境（不可逆）。確認無誤請加 --yes');
      process.exit(1);
    }
    console.log(`開始部署 App ${app} ...`);
    await api('POST', '/k/v1/preview/app/deploy.json', { apps: [{ app: Number(app) }] });
    for (let i = 0; i < 60; i += 1) {
      await new Promise((r) => setTimeout(r, 2000));
      const st = await api('GET', '/k/v1/preview/app/deploy.json', { 'apps[0]': app });
      const status = st.apps[0].status;
      if (status === 'SUCCESS') { console.log('✅ 部署完成'); return; }
      if (status === 'FAIL' || status === 'CANCEL') throw new Error(`部署結果：${status}`);
      process.stdout.write('.');
    }
    throw new Error('部署逾時（仍在 PROCESSING），請稍後到 kintone 畫面確認');
  }

  // ── 寫入模式：驗證 → 備份 → PUT 測試環境 ──
  if (!file) { console.error('請指定 --file <設定.json>'); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));

  const { errors, warnings } = validate(data);
  errors.forEach((m) => console.log(`❌ ${m}`));
  if (errors.length && !force) { console.error(`\n驗證有 ${errors.length} 個錯誤，中止（確定要硬上可加 --force）`); process.exit(1); }
  if (warnings.length) console.log(`（validate 有 ${warnings.length} 個警告，建議先跑 node validate.js ${file} 逐條確認）\n`);

  console.log('① 備份正式環境現況 ...');
  const live = await api('GET', '/k/v1/app/status.json', { app });
  const backupDir = path.join(__dirname, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `status-app${app}-rev${live.revision}-${ts}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(live, null, 2), 'utf8');
  console.log(`   已備份：${backupFile}`);

  console.log('② 取得測試環境 revision ...');
  const preview = await api('GET', '/k/v1/preview/app/status.json', { app });

  console.log('③ 寫入測試環境（preview）...');
  await api('PUT', '/k/v1/preview/app/status.json', {
    app: Number(app),
    enable: data.enable,
    states: data.states,
    actions: data.actions,
    revision: preview.revision,
  });
  console.log(`✅ 已寫入測試環境。請到 kintone「App 設定 → 流程管理」確認畫面無誤，
   然後執行：node apply.js --app ${app} --deploy --yes`);
}

main().catch((e) => { console.error(`\n${e.message}`); process.exit(1); });
