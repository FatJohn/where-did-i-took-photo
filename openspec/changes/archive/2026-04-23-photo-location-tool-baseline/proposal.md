## Why

這個專案已依原本的 superpowers 設計與 implementation plan 完成實作，但 repo 內還沒有一份能代表已交付行為的正式 OpenSpec 紀錄。我們需要建立可長期維護的 OpenSpec baseline，讓後續變更能建立在目前需求之上，而不是依賴 handoff 筆記或一次性的規劃文件。

## What Changes

把目前已完成的照片定位工具整理成 OpenSpec 的 requirements、design context 與已完成 tasks，接著 archive 這個 change，讓 `openspec/specs/` 下的 main specs 成為未來工作的正式 baseline。

## Capabilities

### New Capabilities
- `photo-analysis-api`：定義 multipart 照片分析、EXIF 優先定位、AI fallback、結果正規化與請求限流。
- `anonymous-history`：定義匿名 visitor 範圍內的歷史查詢、保留規則與 cleanup 規劃。
- `location-results-ui`：定義 SPA 上傳、結果呈現、地圖顯示與歷史檢視體驗。

### Modified Capabilities

## Impact

- 以 OpenSpec 記錄現有 Vue SPA、Fastify API 與 shared contract 的行為
- 用可長期維護的 baseline specs 取代臨時 handoff context
- 讓後續 OpenSpec change 有穩定的 main-spec baseline 可供比對
