# location-results-ui 規格

## Purpose
定義 SPA 在照片提交、結果呈現、地圖資訊與歷史檢視上的體驗。
## Requirements
### Requirement: 首頁 MUST 支援照片提交與結果檢視

SPA MUST 讓使用者從裝置選取照片或直接開啟相機拍照，送出分析請求，並檢視定位結果。

#### Scenario: 使用者選擇照片分析
- **WHEN** 使用者在 upload panel 選檔或拍照
- **THEN** SPA 會將選到的檔案送進分析流程

#### Scenario: 觸發既有 demo flow
- **WHEN** 使用者從首頁執行 demo action
- **THEN** SPA 會用 demo 提交流程執行同樣的分析動作

### Requirement: UI MUST 清楚呈現結果狀態

SPA MUST 明確區分 `precise`、`approximate`、`not_found` 三種結果，避免介面過度表達確定性。

#### Scenario: 顯示約略位置結果
- **WHEN** 分析結果為 approximate
- **THEN** result card 會顯示約略位置的 badge
- **AND** UI 可以顯示排序過的候選地點與 clue

#### Scenario: 找不到可信位置
- **WHEN** 分析結果為 `not_found`
- **THEN** UI 會明確顯示無法判定拍攝位置
- **AND** 不會暗示存在精準地圖座標

### Requirement: UI MUST 在有座標時呈現地圖資訊

當結果有座標時，SPA MUST 顯示站內 Leaflet 地圖，並提供 Google Maps 外部開啟連結。

#### Scenario: 有精準座標
- **WHEN** 結果包含精準座標
- **THEN** 地圖會呈現精準點位 marker
- **AND** 可在 Google Maps 中開啟該位置

#### Scenario: 只有約略座標
- **WHEN** 結果只包含約略座標
- **THEN** 地圖會以區域型態呈現，而不是暗示精準點位

#### Scenario: 沒有座標
- **WHEN** 結果沒有座標
- **THEN** UI 會顯示明確的空地圖狀態
- **AND** 不會顯示外部地圖連結

### Requirement: 歷史頁 MUST 重用已儲存的 visitor context

SPA MUST 支援 `/history/:visitorId?`，且在 route param 缺席時回退使用已儲存的 visitor context。

#### Scenario: Route param 不存在，但有已儲存的 visitor context
- **WHEN** 使用者開啟 `/history`，但 URL 中沒有 visitor id
- **THEN** SPA 會使用已儲存的 visitor identifier 載入歷史資料
- **AND** 顯示歷史摘要與縮圖
