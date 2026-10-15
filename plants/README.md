# 植物大考驗（plants/）

國小自然科的題目與練習網頁。

- **線上練習**：https://lamp4615-design.github.io/science-unit1/plants/
- **班級 PK 賽**：https://script.google.com/macros/s/AKfycbwPUDAzfXpJ4mUsxx5PQJ0u74fDB7oXAHhl2bkBlnB-j_CvBTaZGTELhITW6orEgiFo/exec
- 目前題庫：植物大考驗 30 題（根、莖、葉、受刺激的反應、果實與種子傳播）

## 結構

| 路徑 | 說明 |
| --- | --- |
| `questions.json` | 題庫（網頁的資料來源，新增題目改這裡） |
| `template.html` / `build.js` | 網頁範本與建置腳本 |
| `index.html` | 建置後的練習網頁（GitHub Pages 直接發佈） |
| `gas/` | 班級 PK 賽版本（Google Apps Script + 試算表），需自行部署 |

## 更新題庫

編輯 `questions.json` 後執行：

```
node build.js
```

每題格式：`id`、`topic`（單元）、`page`（課本頁碼）、`text`、`opts`（四個選項）、`ans`（正解索引 0–3）、`exp`（解說）。

## 班級 PK 賽

流程：**個人賽 → 依名次 S 型分組 → 團體賽**。題庫前 15 題（後台可調）是個人賽，其餘是團體賽。

- 學生端：Apps Script 網頁（見上方連結），程式在 `gas/`
- 老師後台：[admin.html](https://lamp4615-design.github.io/science-unit1/plants/admin.html)，畫面在 GitHub，資料與密碼驗證在 Apps Script
- 資料：Google 試算表（設定／班級／名單／作答紀錄／題庫）

S 型分組：名次 1→N 依序進第 1→N 組，下一輪反過來 N→1，如此往返，讓各組實力平均。

上課流程：

1. 後台按「開放作答」，學生做個人賽（每人題目、選項順序都不同）
2. 到後台「分組」頁：會列出沒作答／沒做完的同學，並依個人賽名次排好 S 型分組
3. 需要的話改組數、用選單手動換組（黃底是手動換過的人），按「確定分組，進入團體賽」→ 自動暫停作答
4. 按「開放作答」開始團體賽；分組頁可切「大螢幕模式」投影各組名單
5. 團體賽中也能換組（按「儲存組別調整」），各組平均只算團體賽有作答的同學

### 部署 gas/

1. 建立 Google 試算表 → 擴充功能 → Apps Script
2. 貼上 `gas/` 內三個檔案：`Code.gs`、`Index.html`、`Style.html`（HTML 檔名不用加副檔名）
3. 執行一次 `setup()`，後台密碼會產生在「設定」分頁
4. 部署為網頁應用程式（執行身分：我；存取：所有人）
5. 每次修改程式後，要「管理部署作業 → 編輯 → 新版本」才會生效

`Code.gs` 裡的 `ADMIN_URL`、`admin.html` 裡的 `API` 是彼此的網址，換部署或換 repo 時記得同步修改。
