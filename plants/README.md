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

## 班級 PK 賽（gas/）

1. 建立 Google 試算表 → 擴充功能 → Apps Script
2. 貼上 `gas/` 內四個檔案（`Code.gs`、`Index.html`、`Admin.html`、`Style.html`）
3. 執行一次 `setup()`，後台密碼會產生在「設定」分頁
4. 部署為網頁應用程式；學生用部署網址，老師後台加上 `?page=admin`
