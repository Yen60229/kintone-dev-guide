# kintone API 完整速查

> 來源：https://cybozu.dev/zh-tw/kintone/docs/
> 需要最新 API 規格時，貼文件連結給 Claude 讓它即時 fetch。

---

## REST API Endpoint 總表

### 記錄操作

| 操作 | Method | Path | 備註 |
|---|---|---|---|
| 取得單筆記錄 | GET | `/k/v1/record.json` | params: `app`, `id` |
| 取得多筆記錄 | GET | `/k/v1/records.json` | params: `app`, `query`, `fields[]`, `totalCount` |
| 新增單筆 | POST | `/k/v1/record.json` | |
| 新增多筆 | POST | `/k/v1/records.json` | 上限 100 筆 |
| 更新單筆 | PUT | `/k/v1/record.json` | 可用 `id` 或 `updateKey` |
| 更新多筆 | PUT | `/k/v1/records.json` | 上限 100 筆 |
| 刪除多筆 | DELETE | `/k/v1/records.json` | |
| 建立 cursor | POST | `/k/v1/records/cursor.json` | `size` 最大 500 |
| 讀取 cursor | GET | `/k/v1/records/cursor.json` | params: `id` |
| 刪除 cursor | DELETE | `/k/v1/records/cursor.json` | |
| 批量操作 | POST | `/k/v1/bulkRequest.json` | 多個操作一次送出 |

### 記錄回覆

| 操作 | Method | Path |
|---|---|---|
| 取得回覆 | GET | `/k/v1/record/comments.json` |
| 新增回覆 | POST | `/k/v1/record/comment.json` |
| 刪除回覆 | DELETE | `/k/v1/record/comment.json` |

### 流程管理

| 操作 | Method | Path |
|---|---|---|
| 更新執行者 | PUT | `/k/v1/record/assignees.json` |
| 更新單筆狀態 | PUT | `/k/v1/record/status.json` |
| 更新多筆狀態 | PUT | `/k/v1/records/status.json` |

### 應用程式 - 表單

| 操作 | Method | Path |
|---|---|---|
| 取得欄位設定 | GET | `/k/v1/app/form/fields.json` |
| 新增欄位 | POST | `/k/v1/preview/app/form/fields.json` |
| 更新欄位 | PUT | `/k/v1/preview/app/form/fields.json` |
| 刪除欄位 | DELETE | `/k/v1/preview/app/form/fields.json` |
| 取得表單佈局 | GET | `/k/v1/app/form/layout.json` |

### 應用程式 - 設定

| 操作 | Method | Path |
|---|---|---|
| 取得一般設定 | GET | `/k/v1/app/settings.json` |
| 更新一般設定 | PUT | `/k/v1/preview/app/settings.json` |
| 取得流程管理 | GET | `/k/v1/app/status.json` |
| 更新流程管理 | PUT | `/k/v1/preview/app/status.json` |
| 部署到正式環境 | POST | `/k/v1/preview/app/deploy.json` |
| 確認部署狀態 | GET | `/k/v1/preview/app/deploy.json` |
| 取得 JS/CSS 設定 | GET | `/k/v1/app/customize.json` |
| 更新 JS/CSS 設定 | PUT | `/k/v1/preview/app/customize.json` |

### 應用程式 - 權限

| 操作 | Method | Path |
|---|---|---|
| App 存取權限 | GET/PUT | `/k/v1/app/acl.json` |
| 記錄存取權限 | GET/PUT | `/k/v1/record/acl.json` |
| 欄位存取權限 | GET/PUT | `/k/v1/field/acl.json` |

### 應用程式 - 資訊

| 操作 | Method | Path |
|---|---|---|
| 取得單個 App 資訊 | GET | `/k/v1/app.json` |
| 取得多個 App 資訊 | GET | `/k/v1/apps.json` |
| 建立 App（測試環境） | POST | `/k/v1/preview/app.json` |

### 空間

| 操作 | Method | Path |
|---|---|---|
| 取得空間資訊 | GET | `/k/v1/space.json` |
| 更新空間 | PUT | `/k/v1/space.json` |
| 建立空間 | POST | `/k/v1/template/space.json` |
| 取得空間成員 | GET | `/k/v1/space/members.json` |

### 檔案

| 操作 | Method | Path |
|---|---|---|
| 下載檔案 | GET | `/k/v1/file.json` |
| 上傳檔案 | POST | `/k/v1/file.json` |

### 外掛程式

| 操作 | Method | Path |
|---|---|---|
| 取得已安裝外掛程式 | GET | `/k/v1/plugins.json` |
| 匯入外掛程式 | POST | `/k/v1/plugin.json` |
| 更新外掛程式 | PUT | `/k/v1/plugin.json` |
| 取得 App 已加入外掛程式 | GET | `/k/v1/app/plugins.json` |

---

## JavaScript API 完整速查

### 事件一覽

#### 記錄清單畫面
| 時機 | 電腦版 | 行動版 |
|---|---|---|
| 顯示清單 | `app.record.index.show` | `mobile.app.record.index.show` |
| 內聯編輯開始 | `app.record.index.edit.show` | 無 |
| 內聯編輯變更 | `app.record.index.edit.change.欄位代碼` | 無 |
| 內聯編輯存檔 | `app.record.index.edit.submit` | 無 |
| 刪除記錄前 | `app.record.index.delete.submit` | 無 |

#### 記錄詳情畫面
| 時機 | 電腦版 | 行動版 |
|---|---|---|
| 顯示詳情 | `app.record.detail.show` | `mobile.app.record.detail.show` |
| 刪除前 | `app.record.detail.delete.submit` | `mobile.app.record.detail.delete.submit` |
| 流程動作 | `app.record.detail.process.proceed` | `mobile.app.record.detail.process.proceed` |

#### 新增記錄畫面
| 時機 | 電腦版 | 行動版 |
|---|---|---|
| 顯示新增 | `app.record.create.show` | `mobile.app.record.create.show` |
| 欄位變更 | `app.record.create.change.欄位代碼` | `mobile.app.record.create.change.欄位代碼` |
| 存檔前 | `app.record.create.submit` | `mobile.app.record.create.submit` |
| 存檔成功 | `app.record.create.submit.success` | `mobile.app.record.create.submit.success` |

#### 編輯記錄畫面
| 時機 | 電腦版 | 行動版 |
|---|---|---|
| 顯示編輯 | `app.record.edit.show` | `mobile.app.record.edit.show` |
| 欄位變更 | `app.record.edit.change.欄位代碼` | `mobile.app.record.edit.change.欄位代碼` |
| 存檔前 | `app.record.edit.submit` | `mobile.app.record.edit.submit` |
| 存檔成功 | `app.record.edit.submit.success` | `mobile.app.record.edit.submit.success` |

#### 其他
| 時機 | 電腦版 | 行動版 |
|---|---|---|
| 圖表頁 | `app.report.show` | `mobile.app.report.show` |
| 列印頁 | `app.record.print.show` | 無 |
| 入口網站 | `portal.show` | `mobile.portal.show` |
| 空間入口 | `space.portal.show` | `mobile.space.portal.show` |

### JS API 方法總表

#### 事件處理
| 方法 | 說明 |
|---|---|
| `kintone.events.on(events, handler)` | 註冊事件處理器 |
| `kintone.events.off(events, handler)` | 移除事件處理器 |

#### REST API 呼叫
| 方法 | 說明 |
|---|---|
| `kintone.api(url, method, params)` | 送出 REST API 請求（回傳 Promise） |
| `kintone.api.url(path, detectGuestSpace)` | 取得 API URL（自動處理 Guest Space） |
| `kintone.api.urlForGet(path, params, detectGuestSpace)` | 取得含 query string 的 URL |
| `kintone.getRequestToken()` | 取得 CSRF Token |
| `kintone.api.getConcurrencyLimit()` | 取得 API 併發連接數限制 |

#### 外部 API
| 方法 | 說明 |
|---|---|
| `kintone.proxy(url, method, headers, body)` | 透過 kintone proxy 呼叫外部 API |
| `kintone.proxy.upload(url, method, headers, data)` | 上傳檔案到外部 |

#### 記錄操作
| 方法 | 電腦版 | 行動版 |
|---|---|---|
| 取得記錄 ID | `kintone.app.record.getId()` | `kintone.mobile.app.record.getId()` |
| 取得記錄值 | `kintone.app.record.get()` | `kintone.mobile.app.record.get()` |
| 設定記錄值 | `kintone.app.record.set(obj)` | `kintone.mobile.app.record.set(obj)` |

#### App 相關
| 方法 | 說明 |
|---|---|
| `kintone.app.getId()` | 取得 App ID |
| `kintone.app.getFormFields()` | 取得欄位設定 |
| `kintone.app.getFormLayout()` | 取得表單佈局 |
| `kintone.app.getQueryCondition()` | 取得清單頁查詢條件 |
| `kintone.app.getQuery()` | 取得完整查詢（含排序/分頁） |
| `kintone.app.getLookupTargetAppId(fieldCode)` | 取得 Lookup 參照源 App ID |

#### 欄位 / DOM 操作
| 方法 | 電腦版 | 行動版 |
|---|---|---|
| 顯示/隱藏欄位 | `kintone.app.record.setFieldShown(code, bool)` | `kintone.mobile.app.record.setFieldShown(code, bool)` |
| 取得欄位 DOM | `kintone.app.record.getFieldElement(code)` | `kintone.mobile.app.record.getFieldElement(code)` |
| 取得空白欄位 DOM | `kintone.app.record.getSpaceElement(id)` | `kintone.mobile.app.record.getSpaceElement(id)` |
| 取得 Header Menu | `kintone.app.record.getHeaderMenuSpaceElement()` | `kintone.mobile.app.record.getHeaderMenuSpaceElement()` |
| 清單頁 Header | `kintone.app.getHeaderMenuSpaceElement()` | 無 |
| 清單頁欄位 DOM | `kintone.app.getFieldElements(code)` | `kintone.mobile.app.getFieldElements(code)` |

#### 使用者 / 系統
| 方法 | 說明 |
|---|---|
| `kintone.getLoginUser()` | 取得登入者資訊 |
| `kintone.user.getOrganizations()` | 取得使用者組織（行動版可能不支援） |
| `kintone.user.getGroups()` | 取得使用者群組 |
| `kintone.isMobileApp()` | 是否為行動裝置 App |
| `kintone.isMobilePage()` | 是否為行動版頁面 |

#### Plugin API
| 方法 | 說明 |
|---|---|
| `kintone.plugin.app.getConfig(PLUGIN_ID)` | 取得 Plugin 設定 |
| `kintone.plugin.app.setConfig(config, callback)` | 儲存 Plugin 設定 |
| `kintone.plugin.app.getProxyConfig(url, method)` | 取得外部 API 設定 |
| `kintone.plugin.app.setProxyConfig(url, method, headers, data, callback)` | 儲存外部 API 設定 |
| `kintone.plugin.app.proxy(PLUGIN_ID, url, method, headers, body)` | Plugin 呼叫外部 API |

---

## 查詢語法

kintone query 支援的運算子：

| 運算子 | 範例 |
|---|---|
| `=`, `!=` | `status = "進行中"` |
| `>`, `<`, `>=`, `<=` | `amount > 1000` |
| `in`, `not in` | `status in ("待審核", "進行中")` |
| `like`, `not like` | `name like "田中"` |
| `or` | `status = "A" or status = "B"` |
| `and` | 預設，多個條件用空白分隔 |
| `order by` | `order by $id desc` |
| `limit` | `limit 100`（最大 500） |
| `offset` | `offset 0`（cursor 時不需要） |

特殊欄位：`$id`、`$revision`、`作成者`（`Creator`）、`更新者`（`Modifier`）、`作成日時`（`Created_datetime`）、`更新日時`（`Updated_datetime`）

---

## 參考文件來源

| 資源 | URL |
|---|---|
| API 入門教程 | https://cybozu.dev/zh-tw/id/46b0f210829099e8fb07b198/ |
| 欄位格式 | https://cybozu.dev/zh-tw/kintone/docs/overview/field-types/ |
| 查詢語法 | https://cybozu.dev/zh-tw/kintone/docs/overview/query/ |
| REST API 驗證 | https://cybozu.dev/zh-tw/kintone/docs/rest-api/overview/authentication/ |
| 編碼指南 | https://cybozu.dev/zh-tw/kintone/docs/guideline/coding-guideline/ |
| 安全編碼指南 | https://cybozu.dev/zh-tw/kintone/docs/guideline/secure-coding-guideline/ |
