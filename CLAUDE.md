# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概覽

`where-did-i-took-photo` 是一個照片定位工具的 pnpm monorepo：使用者上傳照片，後端優先解析 EXIF GPS，否則交由 Gemini Vision provider 推論可能地點，再把縮圖存到 S3-compatible 物件儲存，並讓匿名訪客以 visitor token 查詢個人歷史紀錄。

- `apps/api` — Fastify (Node 22+, ESM, TypeScript) 後端，提供 `/health`、`/analyze`、`/history/:visitorId`
- `apps/web` — Vue 3 + Pinia + Vue Router + Leaflet SPA（Vite）
- `packages/shared` — 前後端共用的 Zod contracts（`@photo-location/shared`），由 `tsconfig.base.json` 的 paths 對應到原始碼
- `openspec/specs/` 與 `docs/superpowers/specs/` — 規格文件，是這個 repo 的主要交接依據

## 常用指令

從 repo root 執行（`pnpm@10`）：

```bash
pnpm install                 # 安裝 workspace 依賴
pnpm dev:services            # 起動 docker-compose（MinIO + 自動建立 photo-location-thumbnails bucket）
pnpm dev:api:env             # 載入 .env 後啟動 API（tsx watch）
pnpm dev:web                 # 啟動 SPA dev server
pnpm lint                    # 全 workspace ESLint
pnpm test                    # 全 workspace vitest run
pnpm typecheck               # 全 workspace tsc/vue-tsc --noEmit
pnpm build                   # 全 workspace build
```

針對單一 package：

```bash
pnpm --filter @photo-location/api test
pnpm --filter @photo-location/web typecheck
```

跑單一測試檔或單一測試：

```bash
pnpm --filter @photo-location/api exec vitest run src/routes/analyze.test.ts
pnpm --filter @photo-location/api exec vitest run -t "rate limit"
```

注意：`pnpm dev:api:env` 會 `set -a; . ./.env; set +a` 把 `.env` 內容注入後再啟動，所以實作上 API 直接讀 `process.env`（見 `S3_*`、`GEMINI_API_KEY`），而不是只靠 `loadEnv`；新增環境變數時兩條路徑都要考慮。

## 架構重點

### API（apps/api/src）

依序分層 `routes → services → repositories | providers | lib`，每一層都用 factory function（`createXxxService` / `createXxxRepository`）回傳純 object，方便測試替換。

- `server.ts` 只負責 `loadEnv` + 啟動；`app.ts` 是可重用的 `buildApp(options)`，註冊 `cors`、`sensible`、`multipart`（檔案欄位固定 `photo`，size 由 `MAX_UPLOAD_BYTES` 控制）與三條 route。
- `routes/analyze.ts` 是核心流程：multipart 解析 → `visitorService.resolve(token)` → `rateLimitService.checkOrThrow` → `photoIntakeService.process`（mime 驗證、`exifr` 讀 GPS、`sharp` 產縮圖）→ `locationAnalysisService.analyze`（有 GPS 走 EXIF，否則呼叫 vision provider）→ `uploadThumbnail` → `historyService.save`，回應在 `x-visitor-token` header 帶回新/既有 token。
- `providers/vision/provider.ts` 定義 `VisionLocationProvider` 介面，`gemini-provider.ts` 是 `@google/genai` 實作。要換模型或加新 provider，照這個介面實作再從 route 注入即可。
- `repositories/*.ts` 目前都是**記憶體版**（`Map`），上線重啟會清空。`db/schema.ts` 已用 drizzle 定義 `visitors` / `searches` 兩張 Postgres 表，但**還沒接進 request flow**——導入 Postgres 時要替換 repository 實作而不是改 schema。
- `lib/storage.ts` 透過 `@aws-sdk/client-s3` 寫入縮圖。`S3_FORCE_PATH_STYLE` 沒設時會自動依 endpoint hostname 判斷 localhost；改 endpoint 時記得確認這個推斷仍然正確。
- `lib/token.ts` 用 hash 後的 token 配對訪客；`.env.example` 的 `VISITOR_TOKEN_SECRET` 目前 runtime 沒實際使用。

### Web（apps/web/src）

- 進入點 `main.ts` → 註冊 Pinia + router；路由設定在 `router/index.ts`，主要對應 `views/HomeView.vue`（上傳/結果）與 `HistoryView.vue`。
- 採 feature-folder：`features/{upload,analysis,results,map,history}/{components,stores}/`，跨 feature 共用的 API client / types 放 `shared/`。
- `shared/api/client.ts` 用 `import.meta.env.VITE_API_BASE_URL` 對 API；前端在分析成功後會把後端回傳的 `x-visitor-token` 與 `visitorId` 存進 localStorage，用來呼叫 `/history`。
- 地圖使用 Leaflet，`main.ts` 直接 import `leaflet/dist/leaflet.css`，新地圖元件不必再次引入。

### 共用 Contracts

- `packages/shared/src/contracts/{analysis,history}.ts` 是 Zod schema 的單一真相來源；前後端的請求/回應型別都從這裡推導。
- 改 contract 時請同步更新 API route handler 與 web store/components，並跑全 workspace `pnpm typecheck` + `pnpm test`。

## Zeabur 部署

- Project: `where-did-i-took-photo` (`69fe9e545aa21e4719e6bb8e`)，region 為 Tencent Tokyo dedicated server
- Services
  - `minio` (`69fe9e77e6a21fff4d95b639`)：MinIO 模板（Code `TLJ3RL`），預設 bucket `zeabur`，access key `minio`，password 在 `MINIO_ROOT_PASSWORD` 變數
  - `api` (`69fea1d84a961c814e9e979b`)：依 `Dockerfile.api`（runtime tsx，PORT 8080）建構，service env 設 `ZBPACK_DOCKERFILE_NAME=Dockerfile.api`
  - `web` (`69fea2854a961c814e9e97bc`)：依 `Dockerfile.web`（pnpm build → nginx），service env 設 `ZBPACK_DOCKERFILE_NAME=Dockerfile.web`；前端走 same-origin reverse proxy 到 `api.zeabur.internal:8080`，故不需要 build-time `VITE_API_BASE_URL`
- Redeploy 一律帶 `--service-id`，避免 zeabur deploy 重複建 service
- `GEMINI_API_KEY` 部署後需到 Zeabur Dashboard 手動填入真值

## 開發紀律

- 預設所有對話、commit message 都用**繁體中文台灣用語**（見 [agent.md](agent.md)）。技術名詞可保留英文。
- 動程式前先比對 `README.md`、[`docs/local-test-and-deploy-guide.md`](docs/local-test-and-deploy-guide.md)、`openspec/specs/` 是否與現況一致；若衝突，先指出再處理，不要任意重開規劃。
- ESLint 用 `@antfu/eslint-config`（每個 package 各自有 `eslint.config.js`），不要手動覆寫風格。
- 完成工作前跑 `pnpm lint && pnpm test && pnpm typecheck`；若只動單一 package，可改用 `--filter` 版本加快。
