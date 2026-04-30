# Claude Code Best Practice 完全攻略
> 82 個實戰技巧｜從 Vibe Coding 進化到 Agentic Engineering  
> 整理來源：[MUKI — Claude Code Best Practice Cards](https://mukiwu.github.io/claude-code-tips/claude-code-best-practice-cards.html)

---

## 🎯 kintone 開發者必看重點

kintone JS 自訂開發的工作模式和一般應用程式開發有些不同：
- 沒有本地端執行環境，每次都要上傳到 kintone 才能測試
- 欄位代碼、App ID 都是環境相關的具體數值
- 一個 App 可能同時有多個 JS 檔案互相影響

以下標注 ⭐ 的技巧對 **kintone 開發特別有用**。

| 情境 | 最相關的技巧 |
|------|------------|
| 開始新 kintone 功能前 | #1 #2 #3（先規劃，再動手） |
| 給 Claude 說明 kintone 環境 | #10 #14（給完整 context，貼文件連結） |
| 一個功能有多個子需求 | #1 #15（拆輪次，每輪只做一件事） |
| 上傳後發現 bug | #8 #12 #69（貼 error 叫它修，卡住截圖） |
| 同時開發多個 App | #29 #31（subagent 並行，worktree 隔離） |
| 寫完想確認 code 品質 | #6（叫 Claude 自己 review 自己的 code） |
| 重複工作（每次都要上傳）| #33 #34（做成 command，搭配 customize-uploader） |
| context 越用越慢 | #11 #12 #13（compact / rewind / clear） |

---

## 目錄

- [1. Planning — 先規劃再動手](#1-planning--先規劃再動手)
- [2. Prompting — 別微管理 Claude](#2-prompting--別微管理-claude)
- [3. Context — 別讓 Claude 變笨](#3-context--別讓-claude-變笨)
- [4. Session — 工作階段管理](#4-session--工作階段管理)
- [5. CLAUDE.md — 記憶與規則（上）](#5-claudemd--記憶與規則上)
- [6. CLAUDE.md — 記憶與規則（下）](#6-claudemd--記憶與規則下)
- [7. Subagents — Claude 的分身術](#7-subagents--claude-的分身術)
- [8. Commands — 你的自訂快捷指令](#8-commands--你的自訂快捷指令)
- [9. Skills — 可重用的知識模組（上）](#9-skills--可重用的知識模組上)
- [10. Skills — 可重用的知識模組（下）](#10-skills--可重用的知識模組下)
- [11. Hooks — 你的自動化工作流](#11-hooks--你的自動化工作流)
- [12. Workflows — 開發工作流](#12-workflows--開發工作流)
- [13. Advanced — 進階工作流（上）](#13-advanced--進階工作流上)
- [14. Advanced — 進階工作流（下）](#14-advanced--進階工作流下)
- [15. Git / PR — 版控與程式碼審查](#15-git--pr--版控與程式碼審查)
- [16. Debugging — 除錯技巧](#16-debugging--除錯技巧)
- [17. Daily — 工具與日常習慣](#17-daily--工具與日常習慣)
- [kintone 開發 Prompt 模板](#kintone-開發-prompt-模板)
- [快速查詢索引](#快速查詢索引)

---

## 1. Planning — 先規劃再動手

> 很多人一開 Claude Code 就直接叫它寫程式。但真正的高手，永遠是先讓 Claude 做計畫。

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 1 | **⭐ 永遠先開 Plan Mode** | 讓 Claude 先思考架構再動手，而不是邊寫邊改邊爆炸 | 開發新 App 功能前，先讓 Claude 列出需要哪些 event、哪些 API |
| 2 | **⭐ 讓 Claude 反過來面試你** | 用 `AskUserQuestion` 工具問清需求，寫詳細 spec 消除模糊，再開新 session 執行 | 讓 Claude 問你：欄位代碼是什麼？要支援行動版嗎？資料量多大？ |
| 3 | **每階段都要有測試閘門** | Phase-wise gated plan，每階段配測試，通過才進下一階段 | kintone 沒有自動測試框架，改為「每個 event 分開驗證」 |
| 4 | **開第二個 Claude 審查計畫** | 讓另一個 Claude 扮演 Staff Engineer 來 review | 特別適合審查 submit handler 的邏輯順序是否正確 |
| 5 | **Prototype 比 PRD 更有效** | 建造成本很低，直接做 20~30 個版本比寫規格書更快找到對的方向 | 先做一個最簡版的欄位聯動，確認 event 名稱對了再擴充 |

---

## 2. Prompting — 別微管理 Claude

> Claude Code 最大的效率殺手，是你管太多。給方向，不要給步驟。讓它自己跑。

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 6 | **⭐ 挑戰它，別哄它** | 說「prove to me this works」叫 Claude diff 你的 branch | 說「這段 code 上傳後如果使用者快速點兩下會發生什麼事？」 |
| 7 | **修完不滿意？砍掉重來** | 說「knowing everything you know now, scrap this and implement the elegant solution」 | 當 Claude 給你一個巢狀 if 地獄，直接叫它重寫 |
| 8 | **⭐ Bug 就貼上去說 fix** | Claude 自己能修大多數 bug，不要微管理它怎麼修 | 把 kintone 的 console error 截圖或複製貼上，Claude 通常能直接定位 |
| 9 | **用 `ultrathink` 觸發深度推理** | 在 prompt 加上這個關鍵字，啟動 Claude 的高強度思考模式 | 遇到複雜的 process 流程判斷邏輯時使用 |

---

## 3. Context — 別讓 Claude 變笨

> 用越久，Claude 就越笨。這不是錯覺，是 context rot 在作怪。超過 300K tokens 後智力明顯下降。

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 10 | **Context rot 在 300~400K tokens 發作** | 別讓高智力需求的工作拖到那個階段 | 欄位聯動 + 驗證 + 跨 App 查詢最好在同一個 session 的前半段完成 |
| 11 | **⭐ 手動 `/compact` 比自動好** | 50% 以內就手動壓縮，加提示：`/compact focus on the auth refactor` | `/compact focus on the submit handler and field validation logic` |
| 12 | **用 `/rewind` 而不是修修補補** | 倒回失敗前的狀態重新 prompt，別讓爛 context 一直污染 | Claude 把 event 名稱搞錯後一直 patch，不如 rewind 重來 |
| 13 | **用 `/clear` 切換任務** | 要換不相關的任務時，`/clear` 整個重來比帶著舊 context 更乾淨 | App A 寫完要換 App B 時，/clear 並重新貼欄位對照表 |
| 14 | **⭐ 用 Subagent 隔離 context** | 20 次檔案讀取 + 12 次搜尋的雜訊留在子 agent，只傳回結論 | 讓 subagent 去 fetch kintone 文件，主 session 只看結論 |

---

## 4. Session — 工作階段管理

> 每一輪對話都是一個分支點。

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 15 | **⭐ 新任務 = 新 Session** | 相關任務可以共用 context，但新功能就開新的 | 每個 kintone App 的功能開一個專屬 session |
| 16 | **Rewind 前先「summarize from here」** | 讓 Claude 寫一份交接信 | 「把目前完成的 event list 和 CONFIG 結構總結一下，我要 rewind」 |
| 17 | **`/compact` vs `/clear`** | compact 有損但保持動量；`/clear` + 簡報更精準 | 同一個 App 的不同功能用 compact；換 App 用 clear |
| 18 | **用 recaps 做長 session 斷點筆記** | 離開一陣子回來，recaps 幫你快速回憶進度 | 很適合 kintone 開發，通常一個功能要跑多輪 |
| 19 | **用 `/rename` 標記重要 session** | 例如 `[TODO - refactor task]` | `[App639 品質管理 - submit handler]` |

---

## 5. CLAUDE.md — 記憶與規則（上）

> CLAUDE.md 就像是 Claude 的大腦設定檔。

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 20 | **每個檔案控制在 200 行以內** | 太長 Claude 會開始忽略指令 | kintone 相關的 CLAUDE.md 放：IIFE 規範、CONFIG 結構、命名規則 |
| 21 | **用 `<important if="...">` 包住特定規則** | 讓規則只在相關情境觸發 | `<important if="writing kintone JS">` 套上欄位代碼命名規範 |
| 22 | **Monorepo 用多層 CLAUDE.md** | 根目錄放通用規則，子目錄放專屬設定 | 每個 App 的資料夾放自己的 CLAUDE.md（含欄位代碼表） |
| 23 | **用 `.claude/rules/` 拆分大型指令** | 拆成 `api.md`、`database.md` 等多個 rule 檔案 | `kintone-events.md`、`kintone-rest-api.md`、`field-codes.md` |

---

## 6. CLAUDE.md — 記憶與規則（下）

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 24 | **memory.md 不保證任何事** | 這些檔案不是合約，是建議。別盲目信任 | 欄位代碼表寫在 CLAUDE.md 不代表 Claude 一定會用對，還是要 review |
| 25 | **任何人跑 `run the tests` 一次就過** | 如果不行，你的 CLAUDE.md 少了關鍵的 setup 指令 | kintone 沒有自動測試，改為「上傳腳本 + 手動測試流程說明」 |
| 26 | **保持 codebase 乾淨，完成遷移** | 半遷移的框架讓模型困惑 | 不要在同一個 JS 檔案混用 var 和 const，選一個貫徹到底 |
| 27 | **行為規範放 `settings.json`** | 別把 NEVER 類規則寫在 CLAUDE.md，用 settings 才是確定性的 | — |

---

## 7. Subagents — Claude 的分身術

> 一個 Claude 不夠用？那就開多個。

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 28 | **功能導向比通用角色好** | 別建「後端工程師」agent，建「auth-refactor」這種針對功能的 agent | 建「App639-submit-validator」而不是「kintone 工程師」 |
| 29 | **⭐ 說「use subagents」丟更多算力** | 把任務卸載出去，保持主 context 乾淨 | 「用 subagent 去 fetch 這三個 kintone 文件，再告訴我差異」 |
| 30 | **Test Time Compute** | 同一個模型，一個 agent 寫出 bug 另一個能找到 | 一個 agent 寫 handler，另一個 agent 只負責找 submit 覆蓋問題 |
| 31 | **搭配 Git Worktrees 並行開發** | agent teams + tmux，每個 agent 有自己的 working copy | 同時開發多個 App 的 JS 時適用 |

---

## 8. Commands — 你的自訂快捷指令

> 把常用工作流程封裝成一個快捷鍵。

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 32 | **用 Command 而不是 Subagent** | Command 注入現有 context，比開新 subagent 更輕量 | — |
| 33 | **⭐ 每個 inner loop 都做成 slash command** | 一天做很多次的流程，存 `.claude/commands/` | `/upload` = 自動跑 customize-uploader 上傳到 kintone |
| 34 | **⭐ 做超過一次就自動化** | 把日常工作變成 `/deploy`、`/validate` 等 command | `/check-events` = 掃描 JS 檔案確認沒有重複綁定同一事件 |
| 35 | **善用內建 Skill：`/compact` 和 `/rewind`** | `/compact` 壓縮 context 防溢出，`/rewind` 回到 checkpoint | — |

---

## 9. Skills — 可重用的知識模組（上）

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 36 | **用 `context: fork` 隔離 Skill 執行** | 主 context 只看到最終結果 | 讓 fetch kintone 文件的 skill 在 fork context 執行 |
| 37 | **Skills 是資料夾不是檔案** | 用 `references/`、`examples/` 子目錄做漸進式揭露 | 把本 repo 的 `docs/` 和 `examples/` 作為 skill 的 references |
| 38 | **Monorepo 用子資料夾放 Skills** | 不同子專案有不同 skill 需求 | 每個 kintone App 的資料夾放專屬 skill |
| 39 | **⭐ 每個 Skill 建一個 Gotchas 區塊** | 最高信號密度。把 Claude 踩過的坑持續記錄下來 | `docs/06-security-stability.md` 就是這個概念 |
| 40 | **description 是觸發器不是摘要** | 要寫「什麼時候該觸發」 | — |

---

## 10. Skills — 可重用的知識模組（下）

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 41 | **別寫顯而易見的東西** | 只寫那些會把 Claude 推離預設行為的內容 | 不要寫「使用 const」，要寫「kintone 事件名稱只能小寫，拼錯不報錯」 |
| 42 | **別寫步驟，給目標和約束** | 別用步驟綁死 Claude，它會自己找最佳路徑 | — |
| 43 | **⭐ Skill 裡放 scripts 和 libraries** | 讓 Claude 直接組合現有腳本 | 把 `02-pattern-library.js` 作為 pattern skill 的 reference |
| 44 | **用 `!command` 注入動態 shell 輸出** | Claude 觸發 skill 時先執行指令 | `!npx @kintone/customize-uploader --watch` 的狀態注入 |

---

## 11. Hooks — 你的自動化工作流

> Hooks 是跑在 agentic loop 之外的腳本，在特定事件觸發時自動執行。

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 45 | **on-demand hooks 做 Skill 專屬防護** | `/careful` 擋破壞性指令 | — |
| 46 | **PreToolUse hook 追蹤 Skill 使用率** | 看哪些 skill 常被觸發 | — |
| 47 | **⭐ PostToolUse hook 自動格式化** | Claude 產出程式碼後自動跑 ESLint | 搭配 `@cybozu/eslint-config` 自動修正格式 |
| 48 | **權限請求丟給 Opus 審核** | 讓 Opus 掃描是否有攻擊行為 | — |
| 49 | **Stop hook 推 Claude 繼續或自我驗證** | Claude 結束一輪時觸發，叫它驗證成果 | 「完成後自動檢查有沒有重複的 kintone.events.on 綁定」 |

---

## 12. Workflows — 開發工作流

> 所有工作流都收斂到同一個模式：**Research → Plan → Execute → Review → Ship**

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 50 | **小任務用原版就好** | 不是所有事都要套 workflow 框架 | 簡單的欄位聯動直接寫，不用開 Plan Mode |
| 51 | **⭐ Opus 做計畫、Sonnet 寫程式** | 用 `/model` 隨時切換 | 設計多個 App 聯動的架構用 Opus，寫單一 handler 用 Sonnet |
| 52 | **永遠開 thinking mode + Explanatory** | 在 `/config` 設定 | — |
| 53 | **`/focus` 隱藏中間過程** | 只看最終結果 | — |
| 54 | **adaptive thinking 調強度** | slider 五段調節 | 複雜的 process 流程邏輯用高強度 |

---

## 13. Advanced — 進階工作流（上）

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 55 | **⭐ 多用 ASCII 架構圖** | 讓 Claude 畫 ASCII diagram 理解系統架構 | 畫出多個 App 之間的資料流向圖 |
| 56 | **`/loop` 本地 + `/schedule` 雲端** | `/loop` 跑本地最多 7 天；`/schedule` 跑雲端 | — |
| 57 | **Ralph Wiggum plugin 跑自主任務** | 自動循環開發直到完成 | 適合大型 kintone App 重構 |
| 58 | **`/permissions` 用 wildcard 語法** | 設 `Bash(npm run *)` 白名單 | `Bash(npx @kintone/customize-uploader *)` |
| 59 | **`/sandbox` 減少 84% 權限提示** | 用檔案和網路隔離的沙箱 | — |

---

## 14. Advanced — 進階工作流（下）

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 60 | **投資「產品驗證」Skill** | 花一週打造驗證技能，長期回報極高 | 建立「kintone 上傳 + 基本功能測試」的驗證 skill |
| 61 | **auto mode 取代 `dangerously-skip-permissions`** | 模型自己判斷安全 | — |
| 62 | **`/fewer-permission-prompts` 精簡權限** | 掃描 session 歷史，找安全但一直跳確認的指令 | 把 customize-uploader 的指令加進白名單 |
| 63 | **打造一個 `/go` Skill** | 結合端到端測試 + `/simplify` + 自動發 PR | — |

---

## 15. Git / PR — 版控與程式碼審查

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 64 | **⭐ PR 越小越好，p50 只有 118 行** | 一個功能一個 PR | 一個 kintone App 的一個 event handler 一個 PR |
| 65 | **永遠 squash merge** | 乾淨線性歷史 | — |
| 66 | **⭐ 至少每小時 commit 一次** | 任務一完成就 commit | 每個 event 測試通過後立刻 commit |
| 67 | **`@claude` 自動產生 lint rules** | 在同事 PR 上 tag `@claude` | — |
| 68 | **用 `/code-review` 做 multi-agent PR 分析** | 自動抓 bug、安全漏洞 | 特別用於找 submit handler 重複綁定問題 |

---

## 16. Debugging — 除錯技巧

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 69 | **⭐ 卡住了就截圖給 Claude** | 遇到問題先截圖分享 | kintone 的 console error 截圖直接給 Claude |
| 70 | **MCP 讓 Claude 自己看 console** | 接 Chrome DevTools MCP | 搭配 Kintone MCP Server 直接查資料 |
| 71 | **用背景任務跑 terminal** | debug 時把 log terminal 設成背景 | customize-uploader --watch 跑背景，Claude 邊改邊看 |
| 72 | **`/doctor` 診斷問題** | 安裝、認證、設定出問題時 | — |
| 73 | **compaction 報錯？切 1M model** | 用 `/model` 換到 1M token 模型 | — |
| 74 | **cross-model 做 QA** | 用 Codex 審查 Claude 的計畫 | — |
| 75 | **Agentic Search 比 RAG 好** | `glob + grep` 更準即時 | — |

---

## 17. Daily — 工具與日常習慣

| # | 技巧 | 說明 | kintone 適用 |
|---|------|------|------------|
| 76 | **iTerm / Ghostty / tmux** | 用獨立 terminal | — |
| 77 | **`/voice` 語音輸入** | 10 倍生產力 | 口述 kintone 需求比打字快 |
| 78 | **claude-code-hooks 回饋通知** | Claude 完成任務時發出聲音 | — |
| 79 | **⭐ status line 監控 context** | 即時顯示 context 用量 | — |
| 80 | **探索 `settings.json` 隱藏功能** | 個人化開發體驗 | — |
| 81 | **每天更新 Claude Code** | 新版幾乎天天發布 | — |
| 82 | **開工前先讀 Changelog** | 知道今天多了什麼新功能 | — |

---

## kintone 開發 Prompt 模板

把這段貼在每次新 session 的開頭：

```
我在開發 kintone 自訂 JavaScript。

環境資訊：
- App ID：XXX（功能名稱）
- 欄位對照表：
  | 欄位名稱 | 欄位代碼 | 類型 |
  |---------|---------|------|
  | ...     | ...     | ...  |

開發規範（必須遵守）：
- IIFE 包裹：(() => { 'use strict'; ... })()
- CONFIG 集中管理，Object.freeze({...})
- 不使用 var，只用 const / let
- async/await 處理非同步
- 每個 submit event 只綁定一次
- 所有 async handler 包 try-catch

需求：[你的需求]
```

---

## 快速查詢索引

### 常用指令速查

| 指令 | 用途 |
|------|------|
| `/compact` | 壓縮 context，防止 context rot |
| `/rewind` | 回到之前 checkpoint 重新 prompt |
| `/clear` | 清空 context，切換新任務 |
| `/rename` | 標記重要 session 方便之後 resume |
| `/resume` | 接回之前標記的 session |
| `/doctor` | 自動診斷安裝/認證/設定問題 |
| `/model` | 切換模型（Opus 做計畫、Sonnet 寫程式） |
| `/focus` | 隱藏中間過程，只看最終結果 |
| `/voice` | 語音輸入模式 |

### 按情境查找技巧

| 情境 | 對應技巧編號 |
|------|-------------|
| 開始新 kintone 功能前 | #1, #2, #3, #4, #5 |
| Claude 越來越慢/笨 | #10, #11, #12, #13 |
| 任務很複雜，需要拆解 | #28, #29, #30, #31 |
| 重複工作想自動化 | #33, #34, #45, #47, #49 |
| Debug kintone JS 卡住了 | #69, #70, #71, #72 |
| 提升程式碼品質 | #64, #65, #66, #67, #68 |

---

> 整理自 MUKI 的 Threads Carousel Cards  
> 原始資料來源：Boris Cherny、Thariq (Anthropic)、Cat Wu、Lydia Hallie、Dex Horthy 及社群貢獻者
