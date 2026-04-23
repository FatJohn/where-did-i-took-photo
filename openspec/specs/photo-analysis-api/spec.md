# photo-analysis-api 規格

## Purpose
定義照片上傳分析的後端 contract，包含 EXIF 優先定位、AI fallback、結果正規化，以及請求限流行為。
## Requirements
### Requirement: API MUST 提供健康檢查端點

系統 MUST 提供輕量的健康檢查端點，讓本機開發與部署環境都能驗證 API 是否可用。

#### Scenario: 請求健康檢查端點
- **WHEN** 用戶端送出 `GET /health`
- **THEN** API 會回傳成功的健康狀態回應
- **AND** 不需要登入或上傳內容

### Requirement: API MUST 接受 multipart 照片分析請求

系統 MUST 將 `POST /analyze` 提供為 multipart form-data 端點，並且只接受欄位名稱為 `photo` 的上傳檔案。

#### Scenario: 合法的 multipart 上傳成功完成分析
- **WHEN** 用戶端以 `photo` 欄位提交合法圖片到 `POST /analyze`
- **THEN** API 會回傳正規化的分析 payload，包含 `searchId`、`resultType`、`source`、`primaryResult`、`candidates`、`thumbnailUrl`、`createdAt`
- **AND** API 會在 response header 內附上 `x-visitor-token`，供匿名 visitor 延續使用

#### Scenario: 錯誤的上傳欄位名稱會被拒絕
- **WHEN** 用戶端送出 multipart 請求，但沒有合法的 `photo` 檔案欄位
- **THEN** API 會拒絕請求，而不是默默分析其他欄位

### Requirement: API MUST 讓 EXIF GPS 優先於 AI 推論

系統 MUST 將合法的 EXIF/GPS metadata 視為最高可信度的位置來源；只要照片中有可用 GPS 座標，就必須略過 AI 推論。

#### Scenario: 照片包含 GPS metadata
- **WHEN** 上傳照片內含可用的 EXIF GPS metadata
- **THEN** response 會使用 `source: "exif"`
- **AND** 結果會以 metadata 裡的座標回傳精準位置

### Requirement: API MUST 將 AI fallback 結果正規化為支援的結果模式

當 EXIF GPS 不可用時，系統 MUST 呼叫設定中的 vision provider，並將結果正規化為 `precise`、`approximate`、或 `not_found`。

#### Scenario: AI 只能推測約略區域
- **WHEN** 照片沒有 GPS metadata，且 vision provider 只能推測區域級結果
- **THEN** API 會回傳 `resultType: "approximate"`
- **AND** response 可以包含排序過的候選地點與 clue

#### Scenario: AI 無法給出可信的位置判定
- **WHEN** 照片缺少足夠證據，無法形成可信推論
- **THEN** API 會回傳 `resultType: "not_found"`
- **AND** `primaryResult` 會說明無法判定的原因

### Requirement: API MUST 實施每日請求限制

系統 MUST 同時依匿名 visitor 身分與請求 IP 實施每日 rate limit。

#### Scenario: 請求超過設定限制
- **WHEN** visitor 每日次數或 IP 每日次數超過設定門檻
- **THEN** API 會以 rate limit 回應拒絕請求，而不是繼續執行分析
