# Claude Code Best Practice 完全攻略
> 82 個實戰技巧｜從 Vibe Coding 進化到 Agentic Engineering  
> 整理來源：[MUKI — Claude Code Best Practice Cards](https://mukiwu.github.io/claude-code-tips/claude-code-best-practice-cards.html)

---

## 目錄

- [Claude Code Best Practice 完全攻略](#claude-code-best-practice-完全攻略)
  - [目錄](#目錄)
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
  - [快速查詢索引](#快速查詢索引)
    - [常用指令速查](#常用指令速查)
    - [按情境查找技巧](#按情境查找技巧)

---

## 1. Planning — 先規劃再動手

> 很多人一開 Claude Code 就直接叫它寫程式。但真正的高手，永遠是先讓 Claude 做計畫。

| # | 技巧 | 說明 |
|---|------|------|
| 1 | **永遠先開 Plan Mode** | 讓 Claude 先思考架構再動手，而不是邊寫邊改邊爆炸 |
| 2 | **讓 Claude 反過來面試你** | 用 `AskUserQuestion` 工具問清需求，寫詳細 spec 消除模糊，再開新 session 執行 |
| 3 | **每階段都要有測試閘門** | Phase-wise gated plan，每階段配 unit / automation / integration test，通過才進下一階段 |
| 4 | **開第二個 Claude 審查計畫** | 讓另一個 Claude 扮演 Staff Engineer 來 review，或用 cross-model 做審查 |
| 5 | **Prototype 比 PRD 更有效** | 建造成本很低，直接做 20~30 個版本比寫規格書更快找到對的方向 |

---

## 2. Prompting — 別微管理 Claude

> Claude Code 最大的效率殺手，是你管太多。給方向，不要給步驟。讓它自己跑。

| # | 技巧 | 說明 |
|---|------|------|
| 6 | **挑戰它，別哄它** | 說「prove to me this works」叫 Claude diff 你的 branch，不通過就別發 PR |
| 7 | **修完不滿意？砍掉重來** | 說「knowing everything you know now, scrap this and implement the elegant solution」 |
| 8 | **Bug 就貼上去說 fix** | Claude 自己能修大多數 bug，不要微管理它怎麼修 |
| 9 | **用 `ultrathink` 觸發深度推理** | 在 prompt 加上這個關鍵字，啟動 Claude 的高強度思考模式 |

---

## 3. Context — 別讓 Claude 變笨

> 用越久，Claude 就越笨。這不是錯覺，是 context rot 在作怪。超過 300K tokens 後智力明顯下降。

| # | 技巧 | 說明 |
|---|------|------|
| 10 | **Context rot 在 300~400K tokens 發作** | 別讓高智力需求的工作拖到那個階段 |
| 11 | **手動 `/compact` 比自動好** | 50% 以內就手動壓縮，加提示：`/compact focus on the auth refactor` |
| 12 | **用 `/rewind` 而不是修修補補** | 倒回失敗前的狀態重新 prompt，別讓爛 context 一直污染 |
| 13 | **用 `/clear` 切換任務** | 要換不相關的任務時，`/clear` 整個重來比帶著舊 context 更乾淨 |
| 14 | **用 Subagent 隔離 context** | 20 次檔案讀取 + 12 次搜尋的雜訊留在子 agent，只傳回結論 |

---

## 4. Session — 工作階段管理

> 每一輪對話都是一個分支點。Claude 結束一輪後，你要主動選擇 Continue、`/rewind`、`/clear`、`/compact` 還是 Subagent。

| # | 技巧 | 說明 |
|---|------|------|
| 15 | **新任務 = 新 Session** | 相關任務可以共用 context，但新功能就開新的，別讓雜訊拖累 |
| 16 | **Rewind 前先「summarize from here」** | 讓 Claude 寫一份交接信，像是未來的自己留給過去的筆記 |
| 17 | **`/compact` vs `/clear`** | compact 有損但保持動量；`/clear` + 簡報更精準但要自己決定帶什麼走 |
| 18 | **用 recaps 做長 session 斷點筆記** | 離開一陣子回來，recaps 幫你快速回憶進度。不需要可在 `/config` 關掉 |
| 19 | **用 `/rename` 標記重要 session** | 例如 `[TODO - refactor task]`，之後用 `/resume` 隨時接回來 |

---

## 5. CLAUDE.md — 記憶與規則（上）

> CLAUDE.md 就像是 Claude 的大腦設定檔。寫好了，它每次啟動都知道你的專案怎麼跑。

| # | 技巧 | 說明 |
|---|------|------|
| 20 | **每個檔案控制在 200 行以內** | 太長 Claude 會開始忽略指令，即使你寫了 MUST 也沒用 |
| 21 | **用 `<important if="...">` 包住特定規則** | 讓規則只在相關情境觸發，大幅提高遵守率 |
| 22 | **Monorepo 用多層 CLAUDE.md** | 根目錄放通用規則，子目錄放專屬設定，自動繼承載入 |
| 23 | **用 `.claude/rules/` 拆分大型指令** | 拆成 `api.md`、`database.md` 等多個 rule 檔案，比全塞在一個檔好管理 |

---

## 6. CLAUDE.md — 記憶與規則（下）

> 不是寫了 Claude 就一定會照做。理解它的限制，才能設計出真正有效的規則。

| # | 技巧 | 說明 |
|---|------|------|
| 24 | **memory.md / constitution.md 不保證任何事** | 這些檔案不是合約，是建議。別盲目信任 |
| 25 | **任何人跑 `run the tests` 一次就過** | 如果不行，你的 CLAUDE.md 少了關鍵的 setup / build / test 指令 |
| 26 | **保持 codebase 乾淨，完成遷移** | 半遷移的框架讓模型困惑，可能會選到舊 pattern。遷完比不遷更重要 |
| 27 | **行為規範放 `settings.json`** | 別把「NEVER add Co-Authored-By」寫在 CLAUDE.md，用 settings 才是確定性的 |

---

## 7. Subagents — Claude 的分身術

> 一個 Claude 不夠用？那就開多個。Subagent 能讓你同時處理多件事，還能互相 review。

| # | 技巧 | 說明 |
|---|------|------|
| 28 | **功能導向比通用角色好** | 別建「後端工程師」agent，建「auth-refactor」這種針對功能的 agent |
| 29 | **說「use subagents」丟更多算力** | 把任務卸載出去，保持主 context 乾淨 |
| 30 | **Test Time Compute** | 同一個模型，一個 agent 寫出 bug 另一個能找到，分開 context 就是比較強 |
| 31 | **搭配 Git Worktrees 並行開發** | agent teams + tmux，每個 agent 有自己的 working copy，不會互相打架 |

---

## 8. Commands — 你的自訂快捷指令

> 把常用工作流程封裝成一個快捷鍵，之後有相同需求就不用重新手打輸入。

| # | 技巧 | 說明 |
|---|------|------|
| 32 | **用 Command 而不是 Subagent** | Command 注入現有 context，比開新 subagent 更輕量，更適合日常流程 |
| 33 | **每個 inner loop 都做成 slash command** | 一天做很多次的流程（跑測試、deploy），存 `.claude/commands/` 並 check into git |
| 34 | **做超過一次就自動化** | 把日常工作變成 `/techdebt`、`/deploy`、`/analytics` 等 command |
| 35 | **善用內建 Skill：`/compact` 和 `/rewind`** | `/compact` 壓縮 context 防溢出，`/rewind` 回到之前的 checkpoint 重新來過 |

---

## 9. Skills — 可重用的知識模組（上）

> Skills 是可設定、可自動發現、可預載的知識包。比 Command 更強大，支援 context fork 和漸進式揭露。

| # | 技巧 | 說明 |
|---|------|------|
| 36 | **用 `context: fork` 隔離 Skill 執行** | 主 context 只看到最終結果，看不到中間 tool call 雜訊 |
| 37 | **Skills 是資料夾不是檔案** | 用 `references/`、`scripts/`、`examples/` 子目錄做漸進式揭露 |
| 38 | **Monorepo 用子資料夾放 Skills** | 不同子專案有不同 skill 需求，放在對應子目錄下自動載入 |
| 39 | **每個 Skill 建一個 Gotchas 區塊** | 最高信號密度。把 Claude 踩過的坑持續記錄下來 |
| 40 | **description 是觸發器不是摘要** | 要寫「什麼時候該觸發」，是給模型看的 trigger |

---

## 10. Skills — 可重用的知識模組（下）

> 寫好 Skill 的關鍵：少寫顯而易見的東西，多放 Claude 會搞錯的東西。

| # | 技巧 | 說明 |
|---|------|------|
| 41 | **別寫顯而易見的東西** | 只寫那些會把 Claude 推離預設行為的內容，它本來就會做的不用寫 |
| 42 | **別寫步驟，給目標和約束** | 別用步驟綁死 Claude，它會自己找最佳路徑 |
| 43 | **Skill 裡放 scripts 和 libraries** | 讓 Claude 直接組合現有腳本，而不是每次從零重建 boilerplate |
| 44 | **用 `!command` 注入動態 shell 輸出** | Claude 觸發 skill 時先執行指令，模型只看到結果不看指令本身 |

---

## 11. Hooks — 你的自動化工作流

> Hooks 是跑在 agentic loop 之外的腳本，在特定事件觸發時自動執行，不需要 Claude 介入。

| # | 技巧 | 說明 |
|---|------|------|
| 45 | **on-demand hooks 做 Skill 專屬防護** | `/careful` 擋破壞性指令、`/freeze` 擋目錄外的編輯 |
| 46 | **PreToolUse hook 追蹤 Skill 使用率** | 看哪些 skill 常被觸發、哪些觸發不足，幫你調整 description |
| 47 | **PostToolUse hook 自動格式化** | Claude 產出的程式碼品質已經很好，hook 處理最後 10% 避免 CI 失敗 |
| 48 | **權限請求丟給 Opus 審核** | 讓 Opus 掃描是否有攻擊行為，安全就自動放行 |
| 49 | **Stop hook 推 Claude 繼續或自我驗證** | Claude 結束一輪時觸發，叫它繼續做或驗證成果 |

---

## 12. Workflows — 開發工作流

> 所有工作流都收斂到同一個模式：**Research → Plan → Execute → Review → Ship**

| # | 技巧 | 說明 |
|---|------|------|
| 50 | **小任務用原版就好** | 不是所有事都要套 workflow 框架，簡單任務直接對話反而更快 |
| 51 | **Opus 做計畫、Sonnet 寫程式** | 用 `/model` 隨時切換，`/context` 看用量，`/usage` 查額度 |
| 52 | **永遠開 thinking mode + Explanatory** | 在 `/config` 設定，看到 Claude 的推理過程和 Insight boxes |
| 53 | **`/focus` 隱藏中間過程** | 信任模型去跑正確指令，只看最終結果。用 `/focus` 切換 |
| 54 | **adaptive thinking 調強度** | Opus 4.7 從 low（快速省 token）到 max（最高智力），slider 五段調節 |

---

## 13. Advanced — 進階工作流（上）

> 掌握基本工作流後，這些進階技巧能讓你從「會用」到「用得很兇」。

| # | 技巧 | 說明 |
|---|------|------|
| 55 | **多用 ASCII 架構圖** | 讓 Claude 畫 ASCII diagram 理解系統架構，比文字描述清楚得多 |
| 56 | **`/loop` 本地 + `/schedule` 雲端** | `/loop` 跑本地最多 7 天；`/schedule` 跑雲端，電腦關了也會執行 |
| 57 | **Ralph Wiggum plugin 跑自主任務** | 自動循環開發直到完成，適合大型 refactor 或 migration |
| 58 | **`/permissions` 用 wildcard 語法** | 設 `Bash(npm run *)`、`Edit(/docs/**)` 白名單，別用 `dangerously-skip-permissions` |
| 59 | **`/sandbox` 減少 84% 權限提示** | 用檔案和網路隔離的沙箱，Anthropic 內部實測效果 |

---

## 14. Advanced — 進階工作流（下）

> 自動化到極致，就是讓 Claude 自己判斷安全性、自己跑測試、自己發 PR。

| # | 技巧 | 說明 |
|---|------|------|
| 60 | **投資「產品驗證」Skill** | 花一週打造 `signup-flow-driver`、`checkout-verifier` 等驗證技能，長期回報極高 |
| 61 | **auto mode 取代 `dangerously-skip-permissions`** | 模型自己判斷安全，安全就放行，有風險暫停。Shift+Tab 切換模式 |
| 62 | **`/fewer-permission-prompts` 精簡權限** | 掃描 session 歷史，找安全但一直跳確認的指令，產出建議白名單 |
| 63 | **打造一個 `/go` Skill** | 結合端到端測試 + `/simplify` + 自動發 PR，回來後就知道程式碼能動 |

---

## 15. Git / PR — 版控與程式碼審查

> Boris 一天發 141 個 PR、改了 45K 行程式碼。秘訣不是寫得快，是每個 PR 都夠小夠專注。

| # | 技巧 | 說明 |
|---|------|------|
| 64 | **PR 越小越好，p50 只有 118 行** | 一個功能一個 PR，方便 review 也方便 revert |
| 65 | **永遠 squash merge** | 乾淨線性歷史，一個 commit 對應一個功能，`git bisect` 不再痛苦 |
| 66 | **至少每小時 commit 一次** | 任務一完成就 commit，不要累積大量改動 |
| 67 | **`@claude` 自動產生 lint rules** | 在同事 PR 上 tag `@claude`，把重複的 review feedback 變成自動化規則 |
| 68 | **用 `/code-review` 做 multi-agent PR 分析** | 自動抓 bug、安全漏洞、regression |

---

## 16. Debugging — 除錯技巧

> 讓 Claude 自己看到錯誤、自己跑 log、自己排查，你只要看結果。

| # | 技巧 | 說明 |
|---|------|------|
| 69 | **卡住了就截圖給 Claude** | 遇到問題先截圖分享，Claude 能直接看懂畫面上的錯誤 |
| 70 | **MCP 讓 Claude 自己看 console** | 接 Claude in Chrome、Playwright、Chrome DevTools MCP |
| 71 | **用背景任務跑 terminal** | debug 時把 log terminal 設成背景，Claude 邊跑邊看輸出 |
| 72 | **`/doctor` 診斷問題** | 安裝、認證、設定出問題時，先跑 `/doctor` 自動排查 |
| 73 | **compaction 報錯？切 1M model** | 用 `/model` 換到 1M token 模型再跑 `/compact` |
| 74 | **cross-model 做 QA** | 用 Codex 審查 Claude 的計畫和實作，不同模型有不同盲點 |
| 75 | **Agentic Search 比 RAG 好** | Claude Code 試過向量資料庫但放棄了，`glob + grep` 更準即時 |

---

## 17. Daily — 工具與日常習慣

> 最強的技巧不是花式操作，是每天都做的小事。持續做，差距會越拉越大。

| # | 技巧 | 說明 |
|---|------|------|
| 76 | **iTerm / Ghostty / tmux** | 用獨立 terminal 而不是 VS Code / Cursor 內建的，體驗更好 |
| 77 | **`/voice` 語音輸入** | 10 倍生產力不是開玩笑，語音 prompt 比打字快太多 |
| 78 | **claude-code-hooks 回饋通知** | Claude 完成任務時發出聲音或通知，不用一直盯螢幕 |
| 79 | **status line 監控 context** | 即時顯示 context 用量、模型、花費，知道什麼時候該 compact |
| 80 | **探索 `settings.json` 隱藏功能** | Plans Directory、Spinner Verbs 等，個人化開發體驗 |
| 81 | **每天更新 Claude Code** | 新版幾乎天天發布，功能和效能持續進化 |
| 82 | **開工前先讀 Changelog** | 知道今天多了什麼新功能，才能馬上用上 |

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
| `/loop` | 本地循環執行（最多 7 天） |
| `/schedule` | 雲端排程執行 |
| `/sandbox` | 沙箱模式，減少 84% 權限提示 |
| `/permissions` | 用 wildcard 設定白名單 |
| `/code-review` | Multi-agent PR 分析 |

### 按情境查找技巧

| 情境 | 對應技巧編號 |
|------|-------------|
| 開始新專案前 | #1, #2, #3, #4, #5 |
| Claude 越來越慢/笨 | #10, #11, #12, #13 |
| 任務很複雜，需要拆解 | #28, #29, #30, #31 |
| 重複工作想自動化 | #33, #34, #45, #47, #49 |
| Debug 卡住了 | #69, #70, #71, #72 |
| 提升程式碼品質 | #64, #65, #66, #67, #68 |
| 每天工作效率提升 | #76, #77, #78, #79, #82 |

---

> 整理自 MUKI 的 Threads Carousel Cards  
> 原始資料來源：Boris Cherny、Thariq (Anthropic)、Cat Wu、Lydia Hallie、Dex Horthy 及社群貢獻者