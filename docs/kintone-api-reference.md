# kintone API 完整速查手冊

> 來源：https://cybozu.dev/zh-tw/kintone/docs/  
> 整理日期：2026-03-25  
> 用途：與 Claude 協作開發 kintone 自訂功能時的參考依據

---

## 目錄

- [1. kintone API 通用](#1-kintone-api-通用)
- [2. 編碼規章](#2-編碼規章)
- [3. kintone REST API](#3-kintone-rest-api)
  - [3.1 通用規範與驗證](#31-通用規範與驗證)
  - [3.2 記錄操作](#32-記錄操作)
  - [3.3 應用程式 - 表單](#33-應用程式---表單)
  - [3.4 應用程式 - 清單](#34-應用程式---清單)
  - [3.5 應用程式 - 圖表](#35-應用程式---圖表)
  - [3.6 應用程式 - 設定](#36-應用程式---設定)
  - [3.7 應用程式 - 資訊](#37-應用程式---資訊)
  - [3.8 空間](#38-空間)
  - [3.9 檔案](#39-檔案)
  - [3.10 外掛程式](#310-外掛程式)
  - [3.11 API 資訊](#311-api-資訊)
- [4. kintone JavaScript API](#4-kintone-javascript-api)
  - [4.1 通用規範](#41-通用規範)
  - [4.2 事件一覽](#42-事件一覽)
  - [4.3 事件處理程式](#43-事件處理程式)
  - [4.4 執行 API](#44-執行-api)
  - [4.5 獲取/設定資訊](#45-獲取設定資訊)
  - [4.6 顯示/隱藏欄位](#46-顯示隱藏欄位)
  - [4.7 顯示/隱藏元素](#47-顯示隱藏元素)
  - [4.8 獲取元素](#48-獲取元素)
  - [4.9 外掛程式 JS API](#49-外掛程式-js-api)
  - [4.10 其他](#410-其他)
- [5. 拓展版（Wide Course）專用 API](#5-拓展版wide-course專用-api)

---

## 1. kintone API 通用

| 文件名稱 | URL |
|---------|-----|
| kintone API 更新與提供政策 | [連結](https://cybozu.dev/zh-tw/kintone/docs/overview/update-policy/) |
| 欄位格式 | [連結](https://cybozu.dev/zh-tw/kintone/docs/overview/field-types/) |
| 如何編寫查詢 | [連結](https://cybozu.dev/zh-tw/kintone/docs/overview/query/) |
| kintone Webhook | [連結](https://cybozu.dev/zh-tw/kintone/docs/overview/webhook/) |

---

## 2. 編碼規章

| 文件名稱 | URL |
|---------|-----|
| kintone 編碼指南 | [連結](https://cybozu.dev/zh-tw/kintone/docs/guideline/coding-guideline/) |
| kintone 安全編碼指南 | [連結](https://cybozu.dev/zh-tw/kintone/docs/guideline/secure-coding-guideline/) |

---

## 3. kintone REST API

### 3.1 通用規範與驗證

| 文件名稱 | URL |
|---------|-----|
| kintone REST API 通用規範 | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/overview/kintone-rest-api-overview/) |
| 驗證 | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/overview/authentication/) |

### 3.2 記錄操作

#### 選取/註冊/更新/刪除記錄

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 選取單個記錄 | GET | `/k/v1/record.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/get-record/) |
| 註冊單條記錄 | POST | `/k/v1/record.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/add-record/) |
| 更新單個記錄 | PUT | `/k/v1/record.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/update-record/) |
| 獲取多條記錄 | GET | `/k/v1/records.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/get-records/) |
| 註冊多條記錄 | POST | `/k/v1/records.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/add-records/) |
| 更新多條記錄 | PUT | `/k/v1/records.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/update-records/) |
| 刪除多條記錄 | DELETE | `/k/v1/records.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/delete-records/) |
| （批量獲取）建立游標 | POST | `/k/v1/records/cursor.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/create-cursor/) |
| （批量獲取）從游標中取得記錄 | GET | `/k/v1/records/cursor.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/get-cursor/) |
| （批量獲取）刪除游標 | DELETE | `/k/v1/records/cursor.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/delete-cursor/) |

#### 記錄回覆

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 取得記錄的回覆 | GET | `/k/v1/record/comments.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/get-comments/) |
| 填寫記錄回覆 | POST | `/k/v1/record/comment.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/add-comment/) |
| 刪除記錄的回覆 | DELETE | `/k/v1/record/comment.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/delete-comment/) |

#### 流程管理

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 更新記錄上的執行者 | PUT | `/k/v1/record/assignees.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/update-assignees/) |
| 更新單個記錄的狀態 | PUT | `/k/v1/record/status.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/update-status/) |
| 更新多條記錄的狀態 | PUT | `/k/v1/records/status.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/update-statuses/) |

#### 其他記錄操作

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 批量多應用記錄操作 | POST | `/k/v1/bulkRequest.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/bulk-request/) |
| 獲取執行 API 的用戶記錄存取權限 | GET | `/k/v1/records/acl/evaluate.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/records/evaluate-record-permissions/) |

### 3.3 應用程式 - 表單

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 選擇欄位 | GET | `/k/v1/app/form/fields.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/form/get-form-fields/) |
| 新增欄位 | POST | `/k/v1/preview/app/form/fields.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/form/add-form-fields/) |
| 變更欄位的設置 | PUT | `/k/v1/preview/app/form/fields.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/form/update-form-fields/) |
| 刪除欄位 | DELETE | `/k/v1/preview/app/form/fields.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/form/delete-form-fields/) |
| 獲取表單的佈局 | GET | `/k/v1/app/form/layout.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/form/get-form-layout/) |
| 獲取表單的設計資訊 | GET | `/k/v1/form.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/form/get-form/) |
| 變更表單的佈局 | PUT | `/k/v1/preview/app/form/layout.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/form/update-form-layout/) |

### 3.4 應用程式 - 清單

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 獲取清單設置 | GET | `/k/v1/app/views.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/view/get-views/) |
| 變更清單的設置 | PUT | `/k/v1/preview/app/views.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/view/update-views/) |

### 3.5 應用程式 - 圖表

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 獲取應用的圖表設定 | GET | `/k/v1/app/reports.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/report/get-graph-settings/) |
| 變更應用程式圖表的設定 | PUT | `/k/v1/preview/app/reports.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/report/update-graph-settings/) |

### 3.6 應用程式 - 設定

#### 一般設定

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 獲取應用的一般設定 | GET | `/k/v1/app/settings.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-general-settings/) |
| 變更應用程式的一般設定 | PUT | `/k/v1/preview/app/settings.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-general-settings/) |
| 獲取流程管理設置 | GET | `/k/v1/app/status.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-process-management-settings/) |
| 變更流程管理的設置 | PUT | `/k/v1/preview/app/status.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-process-management-settings/) |
| 將應用設置套用到正式環境 | POST | `/k/v1/preview/app/deploy.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/deploy-app-settings/) |
| 確認應用設置反映狀態 | GET | `/k/v1/preview/app/deploy.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-app-deploy-status/) |

#### 自訂/服務整合

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 獲取已新增到應用的外掛程式清單 | GET | `/k/v1/app/plugins.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-app-plugins/) |
| 將外掛程式添加到應用程式 | POST | `/k/v1/preview/app/plugins.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/add-app-plugins/) |
| 獲取 JavaScript/CSS 自訂設定 | GET | `/k/v1/app/customize.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-customization/) |
| 變更 JavaScript/CSS 自訂設定 | PUT | `/k/v1/preview/app/customize.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-customization/) |

#### 通知

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 獲取應用的通知條件設置 | GET | `/k/v1/app/notifications/general.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-general-notification-settings/) |
| 變更應用的通知條件設置 | PUT | `/k/v1/preview/app/notifications/general.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-general-notification-settings/) |
| 獲取記錄的通知條件設置 | GET | `/k/v1/app/notifications/perRecord.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-per-record-notification-settings/) |
| 變更記錄的通知條件設置 | PUT | `/k/v1/preview/app/notifications/perRecord.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-per-record-notification-settings/) |
| 獲取提醒的通知條件設置 | GET | `/k/v1/app/notifications/reminder.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-reminder-notification-settings/) |
| 變更提醒通知條件設置 | PUT | `/k/v1/preview/app/notifications/reminder.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-reminder-notification-settings/) |

#### 存取權限

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 獲取應用程式的存取權限設置 | GET | `/k/v1/app/acl.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-app-permissions/) |
| 變更應用存取權限的設置 | PUT | `/k/v1/app/acl.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-app-permissions/) |
| 獲取記錄的存取權限設置 | GET | `/k/v1/record/acl.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-record-permissions/) |
| 變更記錄存取權限的設置 | PUT | `/k/v1/record/acl.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-record-permissions/) |
| 獲取欄位的存取權限設置 | GET | `/k/v1/field/acl.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-field-permissions/) |
| 變更欄位的存取權限設置 | PUT | `/k/v1/field/acl.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-field-permissions/) |

#### 其他設定

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 獲取應用的動作設置 | GET | `/k/v1/app/actions.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/get-action-settings/) |
| 變更應用程式動作的設定 | PUT | `/k/v1/preview/app/actions.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/update-action-settings/) |
| 變更應用程式所屬的空間 | POST | `/k/v1/app/move.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/settings/move-app/) |

### 3.7 應用程式 - 資訊

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 選取單個應用的資訊 | GET | `/k/v1/app.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/get-app/) |
| 獲取多個應用的資訊 | GET | `/k/v1/apps.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/get-apps/) |
| 在測試環境中創建應用 | POST | `/k/v1/preview/app.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/add-app/) |
| 選取應用程式管理員用備註 | GET | `/k/v1/app/adminNotes.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/get-app-admin-notes/) |
| 變更應用程式管理員用備註 | PUT | `/k/v1/preview/app/adminNotes.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/update-app-admin-notes/) |
| 獲取應用程式管理的使用情況 | GET | `/k/v1/apps/statistics.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apps/get-apps-statistics/) |

### 3.8 空間

#### 空間操作

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 獲取有關空間的資訊 | GET | `/k/v1/space.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/get-space/) |
| 變更空間的設定 | PUT | `/k/v1/space.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/update-space/) |
| 透過範本建立空間 | POST | `/k/v1/template/space.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/add-space-from-template/) |
| 刪除空間 | DELETE | `/k/v1/space.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/delete-space/) |
| 更新空間的內文 | PUT | `/k/v1/space/body.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/update-space-body/) |
| 獲取空間成員和管理員資訊 | GET | `/k/v1/space/members.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/get-space-members/) |
| 更新空間的成員 | PUT | `/k/v1/space/members.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/update-space-members/) |
| 獲取空間使用情況 | GET | `/k/v1/space/statistics.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/get-spaces-statistics/) |

#### 主題

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 建立空間的主題 | POST | `/k/v1/space/thread.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/add-thread/) |
| 更新空間中的主題 | PUT | `/k/v1/space/thread.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/update-thread/) |
| 向主題貼文回覆 | POST | `/k/v1/space/thread/comment.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/add-thread-comment/) |

#### 訪客用戶和訪客空間

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 新增訪客 | POST | `/k/v1/guests.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/add-guests/) |
| 刪除訪客 | DELETE | `/k/v1/guests.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/delete-guests/) |
| 更新訪客空間的訪客 | PUT | `/k/guest/GUEST_SPACE_ID/v1/space/guests.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/spaces/update-guest-members/) |

### 3.9 檔案

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 下載檔案 | GET | `/k/v1/file.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/files/download-file/) |
| 上傳檔案 | POST | `/k/v1/file.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/files/upload-file/) |

### 3.10 外掛程式

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 獲取已安裝外掛程式的清單 | GET | `/k/v1/plugins.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/plugins/get-plugins/) |
| 獲取需要安裝的外掛程式清單 | GET | `/k/v1/plugins/required.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/plugins/get-required-plugins/) |
| 獲取已新增到應用的外掛程式清單 | GET | `/k/v1/plugin/apps.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/plugins/get-plugin-apps/) |
| 匯入外掛程式 | POST | `/k/v1/plugin.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/plugins/add-plugin/) |
| 更新外掛程式 | PUT | `/k/v1/plugin.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/plugins/update-plugin/) |
| 移除外掛程式 | DELETE | `/k/v1/plugin.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/plugins/delete-plugin/) |

### 3.11 API 資訊

| 操作 | HTTP 方法 | URL | 文件連結 |
|------|----------|-----|---------|
| 獲取 kintone REST API 清單 | GET | `/k/v1/apis.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apis/get-apis/) |
| 獲取 kintone REST API 的 Schema 資訊 | GET | `/k/v1/apis/*.json` | [連結](https://cybozu.dev/zh-tw/kintone/docs/rest-api/apis/get-api-schema/) |

---

## 4. kintone JavaScript API

### 4.1 通用規範

| 文件名稱 | URL |
|---------|-----|
| kintone JavaScript API 通用規範 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/overview/kintone-js-api-overview/) |
| 如何編寫事件處理 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/event-handling/) |
| 可以用事件物件執行的操作 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/event-object-actions/) |

### 4.2 事件一覽

#### 記錄清單畫面

| 事件觸發時機 | 電腦版事件名稱 | 行動裝置版 | 文件連結 |
|------------|--------------|----------|---------|
| 顯示清單畫面後 | `app.record.index.show` | `mobile.app.record.index.show` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/idx/index-show-event/) |
| 開始內聯編輯時 | `app.record.index.edit.show` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/idx/index-edit-show-event/) |
| 內聯編輯變更欄位值時 | `app.record.index.edit.change.欄位代碼` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/idx/index-edit-change-event/) |
| 內聯編輯後存儲時 | `app.record.index.edit.submit` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/idx/index-edit-submit-event/) |
| 內聯編輯成功時 | `app.record.index.edit.submit.success` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/idx/index-edit-submit-success-event/) |
| 刪除記錄之前 | `app.record.index.delete.submit` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/idx/index-delete-submit-event/) |

#### 記錄詳情畫面

| 事件觸發時機 | 電腦版事件名稱 | 行動裝置版 | 文件連結 |
|------------|--------------|----------|---------|
| 顯示記錄詳情畫面後 | `app.record.detail.show` | `mobile.app.record.detail.show` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/detail/detail-show-event/) |
| 刪除記錄之前 | `app.record.detail.delete.submit` | `mobile.app.record.detail.delete.submit` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/detail/detail-delete-submit-event/) |
| 執行流程管理操作時 | `app.record.detail.process.proceed` | `mobile.app.record.detail.process.proceed` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/detail/detail-process-proceed-event/) |

#### 新增記錄畫面

| 事件觸發時機 | 電腦版事件名稱 | 行動裝置版 | 文件連結 |
|------------|--------------|----------|---------|
| 顯示新增記錄畫面後 | `app.record.create.show` | `mobile.app.record.create.show` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/create/create-show-event/) |
| 變更欄位的值時 | `app.record.create.change.欄位代碼` | `mobile.app.record.create.change.欄位代碼` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/create/create-change-event/) |
| 儲存時 | `app.record.create.submit` | `mobile.app.record.create.submit` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/create/create-submit-event/) |
| 儲存成功後 | `app.record.create.submit.success` | `mobile.app.record.create.submit.success` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/create/create-submit-success-event/) |

#### 編輯記錄畫面

| 事件觸發時機 | 電腦版事件名稱 | 行動裝置版 | 文件連結 |
|------------|--------------|----------|---------|
| 顯示記錄編輯畫面後 | `app.record.edit.show` | `mobile.app.record.edit.show` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/edit/edit-show-event/) |
| 變更欄位的值時 | `app.record.edit.change.欄位代碼` | `mobile.app.record.edit.change.欄位代碼` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/edit/edit-change-event/) |
| 儲存時 | `app.record.edit.submit` | `mobile.app.record.edit.submit` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/edit/edit-submit-event/) |
| 儲存成功後 | `app.record.edit.submit.success` | `mobile.app.record.edit.submit.success` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/edit/edit-submit-success-event/) |

#### 其他畫面事件

| 事件觸發時機 | 電腦版事件名稱 | 行動裝置版 | 文件連結 |
|------------|--------------|----------|---------|
| 顯示圖表畫面後 | `app.report.show` | `mobile.app.report.show` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/graph-show-event/) |
| 顯示記錄列印畫面後 | `app.record.print.show` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/print-show-event/) |
| 顯示入口網站畫面後 | `portal.show` | `mobile.portal.show` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/portal-show-event/) |
| 顯示空間入口網站畫面後 | `space.portal.show` | `mobile.space.portal.show` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/space-show-event/) |

### 4.3 事件處理程式

| API | 方法 | 文件連結 |
|-----|------|---------|
| 註冊事件處理程式 | `kintone.events.on()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/event-handling/#register-event-handlers) |
| 刪除事件處理程式 | `kintone.events.off()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/events/event-handling/#remove-event-handlers) |

### 4.4 執行 API

#### 執行 kintone REST API

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 傳送 REST API 請求 | `kintone.api()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/api/kintone-rest-api-request/) |
| 獲取 API 的 URL | `kintone.api.url()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/api/get-url/) |
| 使用查詢字串獲取 API 的 URL | `kintone.api.urlForGet()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/api/get-url-including-query/) |
| 獲取 CSRF 權杖 | `kintone.getRequestToken()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/api/get-csrf-token/) |
| 獲取 REST API 的併發連接數 | `kintone.api.getConcurrencyLimit()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/api/get-concurrency-limit/) |

#### 執行外部 API

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 執行外部 API | `kintone.proxy()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/proxy/kintone-proxy/) |
| 將檔案上傳到外部 | `kintone.proxy.upload()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/proxy/kintone-proxy-upload/) |

### 4.5 獲取/設定資訊

#### 記錄相關

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 獲取記錄 ID | `kintone.app.record.getId()` | `kintone.mobile.app.record.getId()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-record-id/) |
| 獲取記錄的值 | `kintone.app.record.get()` | `kintone.mobile.app.record.get()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-record/) |
| 給記錄設置值 | `kintone.app.record.set()` | `kintone.mobile.app.record.set()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/set-record-value/) |
| 獲取記錄存取權限 | `kintone.app.record.getPermissions()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-record-permissions/) |
| 獲取記錄欄位存取權限 | `kintone.app.record.getFieldPermissions()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-record-field-permissions/) |
| 獲取記錄狀態的歷史記錄 | `kintone.app.record.getStatusHistory()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-status-history/) |
| 取得可執行的動作清單 | `kintone.app.record.getStatusActions()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-record-actions/) |

#### 應用程式相關

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 獲取應用程式的資訊 | `kintone.app.get()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-app/) |
| 獲取應用程式的 ID | `kintone.app.getId()` | `kintone.mobile.app.getId()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-app-id/) |
| 大量獲取欄位資訊 | `kintone.app.getFormFields()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-form-fields/) |
| 獲取表單佈局 | `kintone.app.getFormLayout()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-form-layout/) |
| 獲取是否為測試環境 | `kintone.app.isTestEnvironment()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/is-test-environment/) |
| 獲取是否處於維護模式 | `kintone.app.isMaintenanceMode()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/is-maintenance-mode/) |
| 獲取應用程式圖示 URL | `kintone.app.getIcons()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-app-icon-urls/) |
| 取得記錄清單設定 | `kintone.app.getView()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-record-list-view/) |
| 取得記錄清單 | `kintone.app.getViews()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-record-list-views/) |
| 獲取記錄清單查詢字串 | `kintone.app.getQueryCondition()` | `kintone.mobile.app.getQueryCondition()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-record-list-query/) |
| 獲取記錄清單查詢字串（帶選項） | `kintone.app.getQuery()` | `kintone.mobile.app.getQuery()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-record-list-query-with-order-by-limit-offset/) |
| 取得圖表的清單 | `kintone.app.getReports()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-reports/) |
| 獲取 Lookup 參照源應用 ID | `kintone.app.getLookupTargetAppId()` | `kintone.mobile.app.getLookupTargetAppId()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-lookup-target/) |
| 獲取相關記錄參照源應用 ID | `kintone.app.getRelatedRecordsTargetAppId()` | `kintone.mobile.app.getRelatedRecordsTargetAppId()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-related-records-target/) |
| 獲取流程管理設置 | `kintone.app.getStatus()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-status/) |
| 取得可執行的動作清單 | `kintone.app.record.getStatusActions()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-status-actions/) |
| 獲取流程管理目前執行者 | `kintone.app.record.getAssignees()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-status-assignees/) |
| 獲取類別設定資訊 | `kintone.app.getCategories()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-categories/) |
| 獲取應用程式存取權限 | `kintone.app.getPermissions()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-app-permissions/) |

#### 整體 / 使用者相關

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 獲取登入使用者資訊 | `kintone.getLoginUser()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-login-user/) |
| 獲取使用者偏好 | `kintone.getUserPreference()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-user-preference/) |
| 獲取使用者所屬組織 | `kintone.user.getOrganizations()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-organizations/) |
| 使用者所屬的群組（角色） | `kintone.user.getGroups()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-groups/) |
| 取得使用者自訂項目 | `kintone.user.getCustomFields()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-custom-fields/) |
| 是否為共通管理員 | `kintone.isUsersAndSystemAdministrator()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/is-user-and-system-administrator/) |
| 取得使用者圖示 | `kintone.user.getIcons()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-user-icons/) |
| 獲取設計版本 | `kintone.getUiVersion()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-design/) |
| 獲取可用的其他服務 | `kintone.getAvailableServices()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-available-services/) |
| 獲取域名資訊 | `kintone.getDomain()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-domains/) |
| 獲取可用的 API 類型 | `kintone.getAvailableApiTypes()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-available-api-types/) |
| 是否啟用 SecureAccess | `kintone.isAccessWithClientCertificateAuthentication()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/is-access-with-client-certificate-authentication/) |
| 是否透過行動裝置存取 | `kintone.isMobileApp()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/is-mobile-app/) |
| 是否為行動裝置版畫面 | `kintone.isMobilePage()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/is-mobile-page/) |
| 是否為前端框架改造後畫面 | `kintone.isRevampedUI()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/is-revamped-ui/) |
| 獲取目前顯示的畫面 | `kintone.getPageType()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-page-type/) |

#### UI 操作

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 顯示確認對話框 | `kintone.showConfirmDialog()` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/show-confirm-dialog/) |
| 建立對話框 | `kintone.createDialog()` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/create-dialog/) |
| 在畫面頂端顯示訊息 | `kintone.showNotification()` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/show-notification/) |
| 顯示載入圖示 | `kintone.showLoading()` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/show-loading/) |
| 組建 kintone 畫面的 URL | `kintone.buildUrl()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/build-page-url/) |
| 啟用或停用快捷鍵 | `kintone.setKeyboardShortcuts()` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/set-keyboard-shortcuts/) |
| 取得快捷鍵狀態 | `kintone.getKeyboardShortcuts()` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-keyboard-shortcuts/) |

#### 空間相關

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 獲取空間的資訊 | `kintone.space.get()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/space/get-space/) |
| 獲取空間存取權限 | `kintone.space.getPermissions()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/space/get-space-permissions/) |

#### 系統相關

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 獲取功能的啟用狀態 | `kintone.system.getAvailableFeatures()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/system/get-available-features/) |
| 獲取使用者的系統存取權限 | `kintone.system.getPermissions()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/system/get-system-permissions/) |

#### 授權相關

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 是否為試用環境 | `kintone.license.isTrial()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/license/is-trial/) |
| 獲取合約方案 | `kintone.license.getSubscriptionPlan()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/license/get-course/) |

### 4.6 顯示/隱藏欄位

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 顯示或隱藏欄位 | `kintone.app.record.setFieldShown()` | `kintone.mobile.app.record.setFieldShown()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-a-field/) |
| 取得欄位的顯示/隱藏狀態 | `kintone.app.record.isFieldVisible()` | `kintone.mobile.app.record.isFieldVisible()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/is-field-visible/) |
| 打開和關閉組群欄位 | `kintone.app.record.setGroupFieldOpen()` | `kintone.mobile.app.record.setGroupFieldOpen()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/open-field-group/) |
| 取得群組欄位的展開/摺疊狀態 | `kintone.app.record.isGroupFieldOpen()` | `kintone.mobile.app.record.isGroupFieldOpen()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/is-group-field-open/) |

### 4.7 顯示/隱藏元素

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 開啟或關閉應用程式說明 | `kintone.app.showDescription()` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/show-or-hide-app-description/) |
| 取得說明的顯示狀態 | `kintone.app.getDescriptionVisibility()` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-display-state-app-description/) |
| 顯示/隱藏新增記錄按鈕 | `kintone.app.record.showAddRecordButton()` | `kintone.mobile.app.record.showAddRecordButton()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-add-record-button/) |
| 顯示/隱藏編輯按鈕 | `kintone.app.record.showEditButton()` | `kintone.mobile.app.record.showEditButton()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-edit-record-button/) |
| 顯示/隱藏重複利用按鈕 | `kintone.app.record.showDuplicateButton()` | `kintone.mobile.app.record.showDuplicateButton()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-duplicate-record-button/) |
| 顯示/隱藏設定按鈕 | `kintone.app.record.showSettingsButton()` | `kintone.mobile.app.record.showSettingsButton()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-app-settings-button/) |
| 顯示/隱藏選項按鈕 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-option-button/) |
| 顯示/隱藏上一/下一筆按鈕 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-record-nav-button/) |
| 顯示/隱藏側邊欄 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-side-bar/) |
| 顯示/隱藏篩選按鈕 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-filter-button/) |
| 顯示/隱藏匯總按鈕 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-report-button/) |
| 顯示/隱藏清單和圖表下拉選單 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-view-and-report-selector/) |
| 顯示/隱藏清單選單（行動版） | 無 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-mobile-view-selector/) |
| 顯示/隱藏清單選單選項 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-view-selector-items/) |
| 顯示/隱藏圖表下拉選單（行動版） | 無 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-mobile-report-selector/) |
| 顯示/隱藏圖表選單選項 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-report-selctor-items/) |
| 顯示/隱藏動作按鈕 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-action-button/) |
| 顯示/隱藏流程管理動作按鈕 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-status-action-button/) |
| 顯示/隱藏變更執行者按鈕 | 有 | 有 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/show-or-hide-change-assignee-button/) |

> 💡 每個「顯示/隱藏」API 都有對應的「取得顯示狀態」API（`get-display-state-*`），文件連結在同一分類路徑下。

### 4.8 獲取元素

| API | 電腦版 | 行動裝置版 | 文件連結 |
|-----|--------|----------|---------|
| 獲取欄位元素 | `kintone.app.record.getFieldElement()` | `kintone.mobile.app.record.getFieldElement()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-record-field-element/) |
| 獲取空白欄欄位元素 | `kintone.app.record.getSpaceElement()` | `kintone.mobile.app.record.getSpaceElement()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-space-element/) |
| 獲取功能表上部元素 | `kintone.app.record.getHeaderMenuSpaceElement()` | `kintone.mobile.app.record.getHeaderMenuSpaceElement()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/record/get-record-header-menu-element/) |
| 獲取記錄清單功能表右側元素 | `kintone.app.getHeaderMenuSpaceElement()` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-record-list-header-menu-element/) |
| 獲取記錄清單欄位元素 | `kintone.app.getFieldElements()` | `kintone.mobile.app.getFieldElements()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-record-list-field-elements/) |
| 獲取記錄清單功能表下部元素 | `kintone.app.getHeaderSpaceElement()` | 無 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-record-list-header-element/) |
| 獲取標頭下部元素（行動版） | 無 | `kintone.mobile.app.getHeaderSpaceElement()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/get-mobile-header-element/) |
| 取得空間入口網站上方元素 | `kintone.space.portal.getContentSpaceElement()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/space/get-content-space-element/) |
| 獲取入口網站上部元素 | `kintone.portal.getContentSpaceElement()` | 同左 | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/portal/get-content-portal-element/) |

### 4.9 外掛程式 JS API

| API | 方法 | 文件連結 |
|-----|------|---------|
| 獲取外掛程式的設定資訊 | `kintone.plugin.app.getConfig()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/plugins/get-config/) |
| 存儲外掛程式設置資訊 | `kintone.plugin.app.setConfig()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/plugins/set-config/) |
| 獲取執行外部 API 所需的資訊 | `kintone.plugin.app.getProxyConfig()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/plugins/get-config-for-proxy/) |
| 儲存執行外部 API 所需的資訊 | `kintone.plugin.app.setProxyConfig()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/plugins/set-config-for-proxy/) |
| 從外掛程式執行外部 API | `kintone.plugin.app.proxy()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/plugins/kintone-plug-in-proxy/) |
| 從外掛程式上傳檔案到外部 | `kintone.plugin.app.proxy.upload()` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/plugins/kintone-plug-in-proxy-upload/) |

### 4.10 其他

| API | 方法 | 文件連結 |
|-----|------|---------|
| 使用 kintone.Promises（已棄用） | `kintone.Promise` | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/other/kintone-promise/) |
| URL 查詢指定記錄條件 | — | [連結](https://cybozu.dev/zh-tw/kintone/docs/js-api/app/specify-record-list-via-query-string/) |

---

## 5. 拓展版（Wide Course）專用 API

| 文件名稱 | URL |
|---------|-----|
| 什麼是拓展版（Wide Course）專用 API？ | [連結](https://cybozu.dev/zh-tw/kintone/docs/wide-api/about-wide-api/) |

---

## 附錄：常用開發參考連結

| 資源 | URL |
|------|-----|
| kintone API 入門教程 | https://cybozu.dev/zh-tw/id/46b0f210829099e8fb07b198/ |
| 欄位格式（REST API 請求/回應格式） | https://cybozu.dev/zh-tw/kintone/docs/overview/field-types/ |
| 查詢語法 | https://cybozu.dev/zh-tw/kintone/docs/overview/query/ |
| REST API 驗證方式 | https://cybozu.dev/zh-tw/kintone/docs/rest-api/overview/authentication/ |
| kintone 編碼指南 | https://cybozu.dev/zh-tw/kintone/docs/guideline/coding-guideline/ |
| SDK & Tools | https://cybozu.dev/zh-tw/kintone/sdk/ |
| 開發者許可證（開發環境） | https://cybozu.dev/zh-tw/kintone/developer-license/ |

---

> **使用提示**：在與 Claude 協作開發時，可以將特定 API 的文件連結貼給 Claude，讓 Claude 直接 fetch 最新版的詳細規格來寫 code，確保參數和回傳格式都是最新的。
