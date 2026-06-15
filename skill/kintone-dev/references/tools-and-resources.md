# kintone SDK、工具、AI 整合、日文資源

---

## 1. SDK（多語言 REST API 客戶端）

| SDK | 語言 | GitHub |
|---|---|---|
| kintone JavaScript Client | JS/Node.js | [kintone/js-sdk](https://github.com/kintone/js-sdk/tree/main/packages/rest-api-client) |
| kintone Java Client | Java | [kintone/kintone-java-client](https://github.com/kintone/kintone-java-client) |
| kintone Ruby SDK | Ruby（第三方） | [SonicGarden/kintone_rb](https://github.com/SonicGarden/kintone_rb) |

---

## 2. 開發工具鏈

### 開發階段
| 工具 | npm | 用途 |
|---|---|---|
| ESLint Config | `@cybozu/eslint-config` | kintone 用 ESLint 設定 |
| customize-uploader | `@kintone/customize-uploader` | 自動上傳 JS/CSS 到 kintone App |
| kintone-dts-gen | `@kintone/dts-gen` | 自動生成 TypeScript 類型定義 |

### 外掛程式開發
| 工具 | npm | 用途 |
|---|---|---|
| create-plugin | `@kintone/create-plugin` | 建立外掛程式專案骨架 |
| plugin-packer | `@kintone/plugin-packer` | 打包成 .zip |
| plugin-uploader | `@kintone/plugin-uploader` | 上傳到 kintone |
| webpack-plugin | `@kintone/webpack-plugin-kintone-plugin` | webpack 打包外掛程式 |

### 維運
| 工具 | 用途 |
|---|---|
| cli-kintone | 命令列備份/匯出/匯入（CSV） |
| HTTP Client Tool | 瀏覽器內測試 REST API |

### 外掛程式開發完整流程

```
1. npx @kintone/create-plugin my-plugin     # 建立骨架
2. 開發 src/js/desktop.js、config.js 等
3. npx eslint src/ --config @cybozu/eslint-config  # 檢查
4. npx @kintone/plugin-packer src/           # 打包
5. npx @kintone/plugin-uploader my-plugin.zip # 上傳
```

---

## 3. 程式庫（Library）

| 程式庫 | CDN / npm | 用途 |
|---|---|---|
| Cybozu CDN | `https://js.cybozu.com/` | 分發 jQuery、SweetAlert2、Moment.js 等 |
| kintone UI Component v1 | `kintone-ui-component` | kintone 風格 UI 元件（按鈕、下拉等） |
| 51-modern-default | CSS 檔案 | 外掛程式設定頁統一樣式 |
| DOMPurify | `https://js.cybozu.com/dompurify/3.0.6/purify.min.js` | HTML sanitize（防 XSS） |

---

## 4. Kintone MCP Server（AI 直接操作 kintone）

Cybozu 官方的 MCP Server，讓 Claude Desktop 直接操作 kintone。

### 支援操作
| 分類 | 功能 |
|---|---|
| 記錄管理 | 取得、新增、更新、刪除記錄 |
| 狀態管理 | 更新工作流程狀態 |
| 表單設定 | 取得/更新表單欄位 |
| 欄位管理 | 新增/刪除/更新欄位 |
| 部署 | 檢查狀態、部署到正式環境 |
| 附件 | 下載附件 |

### 安裝（Claude Desktop）
1. 下載 .mcpb 檔案
2. 在 Claude Desktop 安裝 MCP 擴充
3. 輸入：子域 `your-domain.cybozu.com`、帳號、密碼
4. 重新啟動 Claude Desktop

### 限制
- 用帳號密碼驗證（不支援 API Token）
- 操作以你的帳號身份執行
- 受 REST API 速率限制
- 不受官方 API 支援服務台支援（用 GitHub Issues）

### 安全提醒
- 不要連到含機密資料的正式環境
- 建立專用「AI 操作帳號」
- 定期審查操作記錄

---

## 5. Dify Plugin 整合

kintone Dify Plugin（Dify Marketplace 上架）支援 4 個操作：

| 操作 | 說明 |
|---|---|
| Get a record | 依 ID 取得單筆 |
| Add a record | 新增記錄 |
| Update a record | 更新記錄 |
| Get multiple records | 依 query 取得多筆 |

### 嵌入 Chatbot 到 kintone

```javascript
(() => {
  'use strict';
  kintone.events.on('app.record.index.show', () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://your-dify-app-url/chatbot/your-token';
    iframe.style.cssText = 'width:400px;height:600px;border:none;position:fixed;bottom:20px;right:20px;z-index:9999;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);';
    document.body.appendChild(iframe);
  });
})();
```

### 使用案例
- 內部 Help Desk Chatbot（AI 從 kintone FAQ App 回答問題）
- AI 翻譯會議記錄 → 寫回 kintone
- Email 摘要 → 自動存檔
- 詢問分類 + 知識庫建立
- OCR 發票處理 → 寫入 kintone

---

## 6. 日文版獨有開發資源

以下為 cybozu.dev/ja 才有的內容（繁中版沒有）：

### 開發 Tips（含大量 Sample Code）

| 分類 | URL |
|---|---|
| 輸入控制/輔助 | https://cybozu.dev/ja/kintone/tips/development/customize/validation-and-assistance/ |
| 日期操作 | https://cybozu.dev/ja/kintone/tips/development/customize/date-format/ |
| 子表格 | https://cybozu.dev/ja/kintone/tips/development/customize/table/ |
| 記錄 CRUD | https://cybozu.dev/ja/kintone/tips/development/customize/update-records/ |
| 清單頁自訂 | https://cybozu.dev/ja/kintone/tips/development/customize/record-list-customize/ |
| 流程管理 | https://cybozu.dev/ja/kintone/tips/development/customize/process-management/ |
| 檔案操作 | https://cybozu.dev/ja/kintone/tips/development/customize/file/ |
| 圖表/甘特圖 | https://cybozu.dev/ja/kintone/tips/development/customize/chart/ |

### 外部服務整合

| 服務 | 說明 | URL |
|---|---|---|
| ChatGPT | AI FAQ 系統 | https://cybozu.dev/ja/id/3ab6c428e67cacd6424bf70d/ |
| Gemini API | 手寫問卷辨識 | https://cybozu.dev/ja/id/c54070d73967618a693a126c/ |
| Google Apps Script | OAuth 2.0 串接 | https://cybozu.dev/ja/id/cad9c1f3fbe86742b53faffc/ |
| Power Automate | HTTP Action 呼叫 API | https://cybozu.dev/ja/id/59b1deec764f5ed08c0677a1/ |
| Power BI | 自訂連接器 | https://cybozu.dev/ja/id/90125c111898e77ad9a26618/ |
| Slack | kintone → Slack 通知 | https://cybozu.dev/ja/id/4ba01b31272dec7bf2a02090/ |
| AWS Lambda | 定期資料同步 | https://cybozu.dev/ja/id/3e607a57c041d57197f2faee/ |

### 教程

| 教程 | URL |
|---|---|
| JavaScript 入門 | https://cybozu.dev/ja/tutorials/hello-js/ |
| kintone API 入門 | https://cybozu.dev/ja/tutorials/hello-kinapi/ |
| cli-kintone 入門 | https://cybozu.dev/ja/tutorials/hello-cli-kintone/ |
| 外掛程式入門 | https://cybozu.dev/ja/tutorials/hello-kinplugin/ |

### 建構營運

| 分類 | URL |
|---|---|
| 效能優化 | https://cybozu.dev/ja/kintone/tips/best-practices/performance/ |
| 安全管理 | https://cybozu.dev/ja/kintone/tips/best-practices/security/ |
| 外部系統連攜注意事項 | https://cybozu.dev/ja/id/3f3784e287c00c48ef3472bf/ |

---

## 7. 參考文件來源

| 資源 | URL |
|---|---|
| cybozu.dev 繁體中文 | https://cybozu.dev/zh-tw/kintone/docs/ |
| cybozu.dev 日文版 | https://cybozu.dev/ja/kintone/ |
| kintone.dev 英文 | https://kintone.dev/en/docs/ |
| kintone SDK | https://kintone.dev/en/sdk/ |
| kintone AI 整合 | https://kintone.dev/en/ai/ |
| 開發者社群 | https://community.cybozu.dev |
