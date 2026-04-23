## Context

這個 repo 實作了一個照片定位工具 monorepo，包含：

- `apps/web`：提供上傳、結果檢視、地圖顯示與匿名歷史的 Vue 3 SPA
- `apps/api`：提供 `/health`、`/analyze`、`/history/:visitorId` 的 Fastify API
- `packages/shared`：前後端共用的 Zod contract

目前實作是依 superpowers 的 design 與 plan 文件完成，但 OpenSpec main specs 先前沒有建立。這個 change 的目的是記錄目前「已實作完成」的行為，而不是重新打開產品範圍。

## Goals / Non-Goals

**Goals:**
- 將已交付的 API 與 UI 行為整理成 OpenSpec main specs
- 記錄目前結果語意：`precise`、`approximate`、`not_found`
- 記錄匿名歷史、rate limiting 與 cleanup 的預期行為
- 在同步 specs 後 archive 這個 baseline change，讓後續工作可增量進行

**Non-Goals:**
- 重新規劃產品或加入新的終端使用者功能
- 重做部署架構
- 新增新的 auth、storage 或 queueing 行為
- 在這個 change 內把既有 superpowers 文件全面改寫成更大的產品文件

## Decisions

- 將 baseline 拆成三個 capability，讓未來的 requirement 變更可以維持聚焦：
  - `photo-analysis-api`
  - `anonymous-history`
  - `location-results-ui`
- 將這個 change 視為目前實作狀態的文件化 baseline，而不是新的功能提案
- 將 cleanup 記錄為規劃層級 requirement，而不是已完成的排程 job 實作，這與目前 codebase 狀態一致
- requirements 直接對齊目前程式中已強制執行的 contract：
  - `/analyze` 使用 multipart form data，且檔案欄位名稱固定為 `photo`
  - `/history/:visitorId` 必須和 visitor token 解析出的 visitor 身分一致
  - 結果 payload 使用 shared `AnalysisResponse` / `HistoryResponse` contract

## Risks / Trade-offs

- 這份 baseline specs 是刻意以「已實作完成的行為」為主，因此可能會比先前較寬的設計稿更聚焦
- 有些為未來預留的 env 變數仍存在，但尚未完全納入目前 API env loader；這份 baseline 記錄的是現況行為，不是所有理想中的設定面
- 如果未來舊的 superpowers 文件與 OpenSpec specs 發生分歧，應以 OpenSpec 作為持續維護的 baseline，舊文件則改視為歷史參考
