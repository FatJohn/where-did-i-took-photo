# 照片定位工具網站設計稿

日期：2026-04-22
狀態：已完成設計確認，可進入規劃

## 摘要

建立一個前後端分離的照片定位服務網站。

產品接收使用者上傳的照片或瀏覽器拍照結果，並依照以下優先順序判斷拍攝地點：

1. 若照片含有 EXIF / GPS metadata，優先使用真實座標。
2. 若沒有 GPS metadata，改用 AI 視覺推測。
3. 若圖片線索不足，應明確回傳「無法判定」，而不是過度猜測。

第一版要有明顯的產品感，不只是技術 demo；同時維持精簡、可在 Railway 上部署，並保留與真實雲端基礎設施對應的架構心智模型。

## 產品目標

- 讓使用者可以上傳單張照片或直接在瀏覽器中拍照。
- 提供可信的定位結果，並清楚表達信心與不確定性。
- 優先使用真實 metadata，而不是一開始就依賴 AI 猜測。
- 不用登入也能保留短中期歷史紀錄。
- 保持本地開發優先、部署簡單，適合 Railway。

## 非目標

- 會員帳號與跨裝置同步
- SSR
- 第一版就導入背景工作佇列或 queue system
- 長期保存原始照片
- 自建視覺模型或複雜電腦視覺流程
- 第一版就整合 Google Maps embed 或付費地圖 SDK

## 技術棧

### 前端

- Vue 3
- Vite SPA
- TypeScript
- Vue Router
- Pinia
- Leaflet 作為站內地圖元件

### 後端

- TypeScript
- REST API
- EXIF / GPS 解析
- 縮圖產生
- Gemini 整合，並透過薄薄的 provider wrapper 隔離

### 基礎設施

- Railway 作為部署平台
- Railway Postgres 儲存結構化資料
- Railway Bucket 儲存縮圖
- 本地開發優先，Railway 作為第一版部署目標

### 工程標準

- lint 與專案品質基準參考 `eat-sky` 現有前端設定。
- 採用 `@antfu/eslint-config` 風格的嚴格規則，包含較嚴格的 TypeScript 限制。
- 開發流程借用 superpowers：brainstorming -> design -> planning -> implementation。

## 使用者體驗

### 主要流程

1. 上傳單張照片。
2. 直接使用瀏覽器拍照。
3. 觀看分析進度。
4. 查看結果卡、地圖與解釋。
5. 查看最近歷史紀錄。

### 結果模式

#### 精準定位

適用情境：

- 照片中存在有效的 EXIF / GPS。
- 或 AI 有足夠把握支撐一個具體點位。

呈現方式：

- 顯示地圖 pin。
- 顯示主要結果標籤。
- 顯示信心分數。
- 提供用 Google Maps 開啟的連結。

#### 約略位置

適用情境：

- AI 只能推測到城市、行政區、景點範圍等區域級結果。

呈現方式：

- 明確標示為約略位置。
- 地圖只顯示約略中心點。
- UI 不得暗示這是精準座標。

#### 無法判定

適用情境：

- 主體太近。
- 圖片缺少可辨識地點線索。
- 圖片過於模糊、內容太弱，或本身太模稜兩可。

呈現方式：

- 不假裝精準。
- 明確說明為何無法判定。

## 系統架構

```text
Vue SPA
  -> Backend REST API
      -> Postgres
      -> Railway Bucket
      -> Gemini provider
```

Railway 專案預期包含：

- 前端 service
- 後端 service
- Postgres
- Bucket

第一版先維持同步流程，但後端模組邊界要保留未來改造成非同步 job 的空間。

## 前端設計

### 模組切分

- `app-shell`：版面配置、路由容器、全域通知
- `capture-upload`：選檔上傳、相機拍照、本地預覽
- `analysis-flow`：送出分析、顯示 loading 與錯誤
- `result-view`：主要答案、Top 3 候選、解釋與信心
- `map-view`：Leaflet 地圖、精準或約略位置呈現、Google Maps 外連
- `history-view`：最近查詢列表與結果回看

### 前端目錄方向

偏向功能導向切分：

- `views/`
- `features/upload/`
- `features/analysis/`
- `features/results/`
- `features/history/`
- `features/map/`
- `shared/`

## 後端設計

### 模組切分

- `http layer`：request validation、response formatting、error mapping
- `visitor service`：匿名 visitor token 簽發與解析
- `rate limit service`：visitor token 與 IP 的雙層限制
- `photo intake service`：檔案驗證、metadata 解析、縮圖產生
- `location analysis service`：決定 GPS 路徑或 AI 路徑，並整理最終結果
- `ai provider layer`：provider 介面與 Gemini 實作
- `history service`：建立與查詢歷史紀錄
- `cleanup job`：移除過期資料與孤兒資源

### Provider 邊界

用一層薄介面隔離 AI 供應商，例如：

```ts
interface VisionLocationProvider {
  inferLocation(input: PhotoAnalysisInput): Promise<LocationInferenceResult>
}
```

第一版只實作一個 provider：

- `GeminiVisionLocationProvider`

這樣可以保留未來更換模型或供應商的空間，但不會把第一版做得太重。

## 資料流

```text
上傳照片
  -> 驗證檔案
  -> 解析 EXIF/GPS
  -> 若有 GPS：直接回傳精準結果
  -> 否則：呼叫 Gemini 做視覺推測
  -> 正規化 AI 結果
  -> 分類為 precise / approximate / not_found
  -> 產生縮圖
  -> 寫入歷史
  -> 回傳前端
```

### 判定規則

1. EXIF / GPS 永遠優先於 AI。
2. AI 不可假裝有精準度。
3. 「無法判定」是正式產品結果，不是錯誤。
4. Top 3 候選只適用於 AI 推測路徑。

### 結果資料形狀

核心 response 需支援：

- `result_type`：`precise | approximate | not_found`
- `primary_result`
- `candidates[]`
- `source`：`exif | ai`

建議 `primary_result` 內容：

- label
- latitude / longitude（僅在合理時提供）
- confidence
- reason summary
- source

建議 candidate 內容：

- label
- 可選的 latitude / longitude
- confidence
- clue list

## 地圖策略

### 站內地圖

- 使用 Leaflet。
- tile provider 必須可替換。
- 第一版先採低成本的 OSM-based 方案。

### 外部導航

- 提供「用 Google Maps 開啟」按鈕。
- 第一版不嵌入 Google Maps SDK。

### 精度策略

- 只有在真的合理時才顯示精準 pin。
- 若只能判斷到區域級，就退回約略位置顯示。
- 如果結果不可信，就不要用地圖 pin 假裝很準。

## 匿名歷史模型

### Visitor 身分

- 第一次進站時，由後端簽發匿名 visitor token。
- 瀏覽器保存該 token。
- 後端以此 token 作為歷史與限流的主要關聯依據。

### 歷史保留策略

- 每個 visitor token 最多保留 10 筆搜尋紀錄。
- 第 11 筆進來時，刪除該 token 最舊的一筆。
- 另設 180 天的最大保存期限。

### 儲存規則

- 不持久保存原始照片。
- 持久保存的資料只包含：
  - 縮圖
  - 分析結果
  - 候選地點
  - 最小必要的 visitor 關聯資料

## Rate Limit 策略

採用雙層限制：

1. 匿名 visitor token 限制
2. IP-based 限制

任一層超過上限都可以擋下請求。

系統應能支援幾種前端可呈現狀態：

- allowed
- warning-near-limit
- blocked

前端歷史紀錄不是安全邊界，真正限制必須在後端執行。

## 資料儲存

### Postgres

建議的概念性資料表：

- `visitors`
- `searches`
- `search_results`
- `candidate_locations`
- `rate_limit_events` 或等價的聚合限制資料

### Railway Bucket

- 只存縮圖
- 第一版不持久保存原圖

## 清理策略

使用週期性 cleanup job，而不是把清理邏輯塞進每次 request。

清理工作包含：

- 刪除過期縮圖
- 刪除超過 180 天的歷史
- 維持每個 visitor 最多 10 筆歷史
- 刪除可能出現的孤兒 storage 物件

## 錯誤處理

預期的使用者可見狀態：

- invalid file
- unsupported media type
- file too large
- rate limited
- analysis failed
- unable to determine location

需要特別區分：

- `unable to determine location` 是正常產品結果
- `analysis failed` 是技術失敗

## 測試策略

### 必要品質關卡

- lint
- typecheck
- frontend unit tests
- backend unit tests

### 高價值測試點

- 合法與不合法圖片上傳
- EXIF / GPS happy path
- 無效 GPS metadata 的處理
- AI response normalization
- AI precise / approximate / not_found 分類
- malformed AI output 的 fallback
- 歷史最多 10 筆的保留規則
- 180 天過期資料清理
- visitor token 與 IP 的 rate limit 行為

## 交付方向

第一版建議採用：

- 同步 request flow
- 清楚的 service 邊界
- 先不引入 queue
- 只在真正能降低未來重寫成本的地方做抽象

這也就是前面確認過的方案 B：

- 簡單到能快速推出
- 但結構足夠清楚，未來要演進成 async worker、登入制或多 AI provider 都不會太痛

## 已確認的關鍵決策

- 前端使用 Vue，不做 SSR。
- 第一版部署平台為 Railway。
- 第一版 AI provider 為 Gemini。
- Gemini API key 初期由 Google AI Studio 取得。
- 站內地圖優先低成本方案，外部導圖使用 Google Maps URL。

## 可進入規劃的範圍

這份設計已經收斂到可以往下拆 implementation plan，範圍包含：

- 專案初始化與目錄規劃
- 前端架構
- 後端 API 設計
- DB schema
- bucket / storage 整合
- Gemini 整合
- cleanup job
- 測試與部署流程
