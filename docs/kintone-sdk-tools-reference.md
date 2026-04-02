# kintone SDK & Tools 完整速查手冊

> 來源：https://cybozu.dev/zh-tw/kintone/sdk/  
> 整理日期：2026-03-25  
> 用途：與 Claude 協作開發 kintone 自訂功能時的工具鏈參考

---

## 目錄

- [1. Microsoft Power BI × kintone 自訂連接器](#1-microsoft-power-bi--kintone-自訂連接器)
- [2. REST API 用戶端（多語言 SDK）](#2-rest-api-用戶端多語言-sdk)
- [3. 開發環境工具](#3-開發環境工具)
  - [3.1 ESLint 代碼檢查器](#31-eslint-代碼檢查器)
  - [3.2 customize-uploader](#32-customize-uploader)
  - [3.3 create-plugin](#33-create-plugin)
  - [3.4 plugin-packer](#34-plugin-packer)
  - [3.5 plugin-uploader](#35-plugin-uploader)
  - [3.6 webpack-plugin-kintone-plugin](#36-webpack-plugin-kintone-plugin)
- [4. 文件庫 / Library](#4-文件庫--library)
  - [4.1 Cybozu CDN](#41-cybozu-cdn)
  - [4.2 kintone UI Component v1](#42-kintone-ui-component-v1)
  - [4.3 51-modern-default（外掛程式樣式表）](#43-51-modern-default外掛程式樣式表)
  - [4.4 kintone-dts-gen（TypeScript 類型定義）](#44-kintone-dts-gen-typescript-類型定義)
- [5. 資料備份工具](#5-資料備份工具)
  - [5.1 cli-kintone 命令列工具](#51-cli-kintone-命令列工具)
  - [5.2 cli-kintone 查詢語法](#52-cli-kintone-查詢語法)
- [6. 演示與測試環境](#6-演示與測試環境)
  - [6.1 cybozu developer network 演示環境](#61-cybozu-developer-network-演示環境)
  - [6.2 HTTP Client Tool for kintone](#62-http-client-tool-for-kintone)
- [附錄 A：工具速查表（按開發階段分類）](#附錄-a工具速查表按開發階段分類)
- [附錄 B：與 API 文件的交叉對照](#附錄-b與-api-文件的交叉對照)

---

## 1. Microsoft Power BI × kintone 自訂連接器

| 項目 | 內容 |
|------|------|
| 用途 | 使用 Power BI 自訂連接器獲取並視覺化 kintone 資料 |
| 適用場景 | BI 報表、資料分析、Dashboard |
| 文件連結 | [使用指南](https://cybozu.dev/zh-tw/kintone/sdk/power-bi-custom-connector-for-kintone/) |

---

## 2. REST API 用戶端（多語言 SDK）

提供開源的 API 用戶端，可使用多種程式語言執行 kintone REST API。

| SDK 名稱 | 語言 | 說明 | 文件連結 |
|---------|------|------|---------|
| kintone JavaScript Client | JavaScript / Node.js | 匯總了 JavaScript 中呼叫 kintone REST API 所需的處理的函數庫 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/rest-api-client/kintone-javascript-client/) |
| kintone Java Client | Java | 匯總了 Java 中處理 kintone REST API 所需的處理方法 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/rest-api-client/kintone-java-client/) |

**支援政策**：由 Cybozu 開發並提供，可用於正式環境。原始碼的修改、再分發和商業使用受各自的許可約束。

---

## 3. 開發環境工具

### 3.1 ESLint 代碼檢查器

| 項目 | 內容 |
|------|------|
| 工具名稱 | `@cybozu/eslint-config` |
| 用途 | JavaScript 靜態語法檢查，針對 kintone 自訂開發環境的 ESLint 設定 |
| 適用場景 | 開發階段的代碼品質檢查、團隊規範統一 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/development-environment/eslint-config/) |

### 3.2 customize-uploader

| 項目 | 內容 |
|------|------|
| 工具名稱 | `@kintone/customize-uploader` |
| 用途 | 自動上傳 kintone 自訂的 CSS 和 JavaScript 檔案 |
| 適用場景 | 開發時自動部署 JS/CSS 到 kintone app，避免手動操作 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/development-environment/customize-uploader/) |

### 3.3 create-plugin

| 項目 | 內容 |
|------|------|
| 工具名稱 | `@kintone/create-plugin` |
| 用途 | 建立 kintone 外掛程式的專案範本（scaffolding） |
| 適用場景 | 從零開始建立新的 kintone 外掛程式專案 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/development-environment/create-plugin/) |

### 3.4 plugin-packer

| 項目 | 內容 |
|------|------|
| 工具名稱 | `@kintone/plugin-packer` |
| 用途 | 將外掛程式原始碼打包成 kintone 外掛程式檔（.zip） |
| 適用場景 | 開發完成後的外掛程式封裝 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/development-environment/plugin-packer/) |

### 3.5 plugin-uploader

| 項目 | 內容 |
|------|------|
| 工具名稱 | `@kintone/plugin-uploader` |
| 用途 | 透過命令列將打包好的外掛程式檔上傳到 kintone |
| 適用場景 | 外掛程式的自動部署 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/development-environment/plugin-uploader/) |

### 3.6 webpack-plugin-kintone-plugin

| 項目 | 內容 |
|------|------|
| 工具名稱 | `@kintone/webpack-plugin-kintone-plugin` |
| 用途 | 使用 webpack 建構 kintone 外掛程式的 webpack 外掛 |
| 適用場景 | 需要模組化打包（import/export）的外掛程式開發 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/development-environment/webpack-plugin-kintone-plugin/) |

---

## 4. 文件庫 / Library

### 4.1 Cybozu CDN

| 項目 | 內容 |
|------|------|
| 用途 | 分發可用於 kintone 和 Garoon 自訂的外部 JavaScript 和 CSS 庫 |
| 適用場景 | 在 kintone 自訂 JS/CSS 設定中引用第三方程式庫（如 jQuery、SweetAlert、Moment.js 等） |
| CDN 基底 URL | `https://js.cybozu.com/` |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/library/cybozu-cdn/) |

### 4.2 kintone UI Component v1

| 項目 | 內容 |
|------|------|
| 用途 | 方便地建立與 kintone 設計風格一致的 UI 元件（按鈕、下拉選單、表格等） |
| 適用場景 | 在空白欄位或自訂頁面中插入 kintone 風格的 UI |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/library/kintone-ui-component-v1/) |

### 4.3 51-modern-default（外掛程式樣式表）

| 項目 | 內容 |
|------|------|
| 用途 | 提供與 kintone 設計相協調的樣式表，讓外掛程式的設定頁面風格一致 |
| 適用場景 | 外掛程式的設定畫面（config.html）CSS 統一 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/library/plugin-stylesheet-guide/) |

### 4.4 kintone-dts-gen（TypeScript 類型定義）

| 項目 | 內容 |
|------|------|
| 工具名稱 | `@kintone/dts-gen` |
| 用途 | 自動生成 kintone 應用的 TypeScript 類型定義檔（`.d.ts`） |
| 適用場景 | 使用 TypeScript 開發 kintone 自訂功能時，取得欄位代碼的型別提示 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/library/dts-gen/) |

---

## 5. 資料備份工具

### 5.1 cli-kintone 命令列工具

| 項目 | 內容 |
|------|------|
| 工具名稱 | `cli-kintone` |
| 用途 | 從命令列備份和匯入 kintone 資料（CSV 格式） |
| 適用場景 | 定期備份、資料遷移、批量匯入匯出 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/backup/cli-kintone/) |

### 5.2 cli-kintone 查詢語法

| 項目 | 內容 |
|------|------|
| 用途 | 在 cli-kintone 中使用查詢語法篩選要匯出的記錄 |
| 適用場景 | 匯出特定條件的記錄子集（如特定日期範圍、特定狀態） |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/backup/cli-kintone-query/) |

---

## 6. 演示與測試環境

### 6.1 cybozu developer network 演示環境

| 項目 | 內容 |
|------|------|
| 用途 | 提供可實際體驗 kintone 自訂功能的演示應用程式 |
| 適用場景 | 學習 kintone API、測試自訂功能概念 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/demonstration/kintone-demo/) |

### 6.2 HTTP Client Tool for kintone

| 項目 | 內容 |
|------|------|
| 用途 | 在瀏覽器中直接測試 kintone REST API 的 HTTP 用戶端工具 |
| 適用場景 | 快速驗證 API 請求/回應、Debug API 呼叫 |
| 文件連結 | [連結](https://cybozu.dev/zh-tw/kintone/sdk/demonstration/http-client-tool-for-kintone/) |

---

## 附錄 A：工具速查表（按開發階段分類）

### 🔧 開發階段

| 你想做什麼 | 使用工具 | npm 套件名 |
|-----------|---------|-----------|
| 建立外掛程式專案骨架 | create-plugin | `@kintone/create-plugin` |
| 代碼品質檢查 | ESLint + cybozu config | `@cybozu/eslint-config` |
| 引用第三方 JS/CSS 庫 | Cybozu CDN | （CDN URL，非 npm） |
| 使用 kintone 風格 UI 元件 | kintone UI Component v1 | `kintone-ui-component` |
| 外掛程式設定頁的 CSS | 51-modern-default | （CSS 檔案） |
| TypeScript 類型自動生成 | kintone-dts-gen | `@kintone/dts-gen` |
| 模組打包（webpack） | webpack-plugin-kintone-plugin | `@kintone/webpack-plugin-kintone-plugin` |

### 🚀 部署階段

| 你想做什麼 | 使用工具 | npm 套件名 |
|-----------|---------|-----------|
| 自動上傳 JS/CSS 到 app | customize-uploader | `@kintone/customize-uploader` |
| 打包外掛程式為 .zip | plugin-packer | `@kintone/plugin-packer` |
| 上傳外掛程式到 kintone | plugin-uploader | `@kintone/plugin-uploader` |

### 🔌 整合階段

| 你想做什麼 | 使用工具 |
|-----------|---------|
| 從 Node.js/瀏覽器呼叫 REST API | kintone JavaScript Client |
| 從 Java 呼叫 REST API | kintone Java Client |
| 用 Power BI 視覺化 kintone 資料 | Power BI 自訂連接器 |

### 📦 維運階段

| 你想做什麼 | 使用工具 |
|-----------|---------|
| 命令列備份/匯出/匯入資料 | cli-kintone |
| 快速測試 REST API | HTTP Client Tool for kintone |
| 體驗自訂範例 | 演示環境 |

---

## 附錄 B：與 API 文件的交叉對照

| SDK / Tool | 對應的 API 文件章節 | 文件連結 |
|-----------|-------------------|---------|
| kintone JavaScript Client | REST API 全部（記錄、應用、空間等） | [REST API 文件](https://cybozu.dev/zh-tw/kintone/docs/rest-api/) |
| customize-uploader | 獲取/變更 JavaScript/CSS 自訂設定 | [GET](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-customization/) / [PUT](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-customization/) |
| plugin-packer / uploader | 匯入外掛程式 / 更新外掛程式 | [POST](https://cybozu.dev/zh-tw/kintone/docs/rest-api/plugins/add-plugin/) / [PUT](https://cybozu.dev/zh-tw/kintone/docs/rest-api/plugins/update-plugin/) |
| cli-kintone | 選取多條記錄（含查詢語法） | [GET records](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/get-records/) / [查詢語法](https://cybozu.dev/zh-tw/kintone/docs/overview/query/) |
| kintone UI Component | JavaScript API — 獲取空白欄位元素 | [getSpaceElement](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-space-element/) |
| kintone-dts-gen | 選擇欄位（取得欄位定義） | [GET form fields](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/form/get-form-fields/) |
| HTTP Client Tool | REST API 驗證 | [驗證](https://cybozu.dev/zh-tw/kintone/docs/rest-api/overview/authentication/) |

---

## 附錄 C：外掛程式開發完整工作流

```
1. 建立專案骨架
   $ npx @kintone/create-plugin my-plugin

2. 開發
   ├── src/js/desktop.js     ← 電腦版自訂邏輯
   ├── src/js/mobile.js      ← 行動版自訂邏輯
   ├── src/js/config.js      ← 外掛程式設定頁邏輯
   ├── src/css/config.css    ← 使用 51-modern-default
   └── src/html/config.html  ← 外掛程式設定頁 UI（可用 kintone UI Component）

3. 代碼檢查
   $ npx eslint src/ --config @cybozu/eslint-config

4. （可選）模組打包
   $ npx webpack  ← 使用 webpack-plugin-kintone-plugin

5. 打包成外掛程式檔
   $ npx @kintone/plugin-packer src/
   → 產出 my-plugin.zip

6. 上傳到 kintone
   $ npx @kintone/plugin-uploader my-plugin.zip
   → 需要提供 kintone 域名和帳號

7. 測試
   ← 在 kintone 的應用中啟用外掛程式並測試
   ← 可用 HTTP Client Tool 驗證 REST API 行為
```

---

> **使用提示**：
> - 一般的 kintone JS 自訂開發（非外掛程式），最常用的是 **customize-uploader**（自動部署）+ **Cybozu CDN**（引用第三方庫）+ **ESLint**（代碼檢查）。
> - 外掛程式開發則需要完整的 create → pack → upload 工具鏈。
> - 跟 Claude 協作時，貼上工具的文件連結讓 Claude fetch 最新版使用說明，比靠記憶更準確。
