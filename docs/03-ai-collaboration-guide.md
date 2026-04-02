# 與 Claude 協作開發 kintone 的最佳實踐

## ❌ 低效的問法

```
幫我寫一個 kintone 的 JavaScript，
要在編輯記錄的時候自動算合計，
然後還要驗證一些欄位，
另外詳情頁面要顯示關聯資料，
對了還要根據使用者權限隱藏某些欄位。
```

問題：
- 一次丟了 4 個需求，Claude 只能猜你的欄位代碼
- 沒有 app ID、沒有欄位對照表
- 沒說驗證規則是什麼
- 結果：Claude 生出一大坨 code，跟你的實際環境對不上，要改很多


## ✅ 高效的問法（拆成多輪對話）

### 第 1 輪：給 Context + 單一需求

```
我在 kintone App 639（品質管理系統）做自訂開發。

欄位代碼對照：
- 供應商代碼: supplier_code (文字欄位)
- 檢查數量:   check_qty     (數值欄位)
- 不良數量:   defect_qty    (數值欄位)  
- 不良率:     defect_rate   (數值欄位，要自動算)

需求：使用者在新增或編輯畫面修改 check_qty 或 defect_qty 時，
自動計算 defect_rate = defect_qty / check_qty * 100（百分比，取小數 2 位）。
check_qty 為 0 時 defect_rate 顯示 0。

請用 const + async/await，不要用 var。
請參考這個 API 文件確認 change event 的用法：
https://cybozu.dev/zh-tw/kintone/docs/js-api/events/create/create-change-event/
```

### 第 2 輪：確認沒問題後，加下一個需求

```
上面的欄位聯動沒問題，謝謝。

接下來加一個驗證：
存檔時（submit event），如果 defect_rate > 30，
要跳 error 訊息「不良率超過 30%，請確認是否正確」阻擋存檔。
但如果使用者的組織包含「品管部」，則不擋（品管部有權限提交高不良率）。

請加在同一個檔案裡，維持 CONFIG 結構。
```

### 第 3 輪：需要修 bug 時

```
上面的 code 在行動版跑的時候，
kintone.user.getOrganizations() 回傳 undefined。
幫我查一下行動版是不是用不同的 API？
參考：https://cybozu.dev/zh-tw/kintone/docs/js-api/kintone/get-organizations/

如果行動版不支援，幫我改成用 REST API 查詢。
```


## ✅ 關鍵原則

1. 【一次一個需求】
   每輪只做一件事，確認沒問題再繼續。
   這樣出 bug 也容易定位是哪一輪的改動。

2. 【給完整的欄位對照表】
   開發前先整理一份你這個 app 的欄位代碼表貼給 Claude，
   可以用這個格式：
   
   | 欄位名稱 | 欄位代碼 | 類型 | 備註 |
   |---------|---------|------|------|
   | 供應商代碼 | supplier_code | 文字 | 唯一鍵 |
   | 檢查數量 | check_qty | 數值 | |
   
   Claude 有了這張表就不需要猜，生出的 code 可以直接用。

3. 【明確說出約束條件】
   - 驗證方式：API Token 還是使用者登入？
   - 裝置範圍：要不要支援行動版？
   - 資料量級：這個 app 有多少筆記錄？（影響是否需要 cursor）
   - 現有 code：如果是修改既有功能，把現在的 code 貼過來

4. 【貼文件連結而非靠記憶】
   你有速查表了，找到相關 API 的連結直接貼給 Claude。
   Claude 會即時 fetch 最新版文件來寫 code，
   比靠訓練資料的記憶準確得多。

5. 【Code Review 的心態】
   不要無條件信任 Claude 生的 code。
   重點檢查：
   - event 名稱有沒有拼錯（kintone 不會報錯，只是靜默失效）
   - API 呼叫的 method 對不對（GET/POST/PUT）
   - 欄位代碼有沒有打錯
   - 有沒有處理 error case
