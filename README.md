# 照片定位工具

這是一個照片定位網站的 monorepo：

- `apps/web`：提供上傳、結果檢視與匿名歷史紀錄的 Vue 3 SPA
- `apps/api`：提供 `/health`、`/analyze`、`/history/:visitorId` 的 Fastify API
- `packages/shared`：前後端共用的 Zod contract

## 本機開發

更完整的本機測試、Docker 服務規劃與 Zeabur 部署指南請看
[`docs/local-test-and-deploy-guide.md`](docs/local-test-and-deploy-guide.md)。

### 前置需求

- Node.js 22 以上
- `pnpm` 10
- Gemini API key
- 可相容 S3 的縮圖儲存設定

補充：

- 目前 runtime repository 仍是記憶體版本，Postgres schema 已存在但尚未接進正式 request flow。
- 若要做部署等價測試，之後可用 Docker Postgres 對齊 Zeabur PostgreSQL service。
- AI 視覺定位目前使用 Gemini，需要 `GEMINI_API_KEY`。

### 安裝

```bash
pnpm install
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
```

請依你的本機環境填入 `.env`，至少補上 `GEMINI_API_KEY`：

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/photo_location
GEMINI_API_KEY=your-key
S3_ENDPOINT=http://localhost:9000
S3_REGION=auto
S3_BUCKET=photo-location-thumbnails
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
MAX_UPLOAD_BYTES=10485760
VISITOR_LIMIT_PER_DAY=20
IP_LIMIT_PER_DAY=50
```

說明：

- 如果你要在本機真的跑 `/analyze` 完整流程，就需要設定 `GEMINI_API_KEY`、`S3_ENDPOINT`、`S3_BUCKET`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`。
- `VISITOR_LIMIT_PER_DAY` 與 `IP_LIMIT_PER_DAY` 用來控制目前的行程內 rate limiting 行為。
- `.env.example` 裡也有 `VISITOR_TOKEN_SECRET`，但目前實作還沒有在 runtime 使用這個值。

前端 SPA 需要透過 `apps/web/.env.local` 指到本機 API：

```bash
VITE_API_BASE_URL=http://localhost:8787
```

### 啟動

先啟動本機 MinIO，這會自動建立 `photo-location-thumbnails` bucket 並開放本機讀取縮圖：

```bash
pnpm dev:services
```

再啟動 API：

```bash
pnpm dev:api:env
```

再用另一個 terminal 啟動前端：

```bash
pnpm dev:web
```

### 本機驗證

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

如果你想分開跑各 package 檢查，可以使用：

```bash
pnpm --filter @photo-location/api test
pnpm --filter @photo-location/web test
pnpm --filter @photo-location/api typecheck
pnpm --filter @photo-location/web typecheck
```

## Zeabur 部署

這裡是快速摘要；完整檢查清單請看
[`docs/local-test-and-deploy-guide.md`](docs/local-test-and-deploy-guide.md)。

目前這個 workspace 最適合在 Zeabur 建成兩個 application service 加上託管資料資源：

- 一個 `apps/api` service
- 一個 `apps/web` 靜態網站
- 一個 Zeabur PostgreSQL service
- 一個 Zeabur Object Storage，或其他相容 S3 的物件儲存

### API Service

以 GitHub repo 作為 Zeabur source。因為這是 pnpm workspace，API service 需指定 app directory 或等價設定：

- App directory / `ZBPACK_APP_DIR`：`apps/api`
- Build command：`pnpm build`
- Start command：`node dist/server.js`

若選擇從 repo root 執行自訂命令，也可以設定：

- Build command：`pnpm install --frozen-lockfile && pnpm --filter @photo-location/api build`
- Start command：`node apps/api/dist/server.js`

API service 需要設定這些環境變數：

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE`：本機 MinIO 設為 `true`；一般 Zeabur/S3 相容服務依供應商需求設定，未設定時遠端 endpoint 預設不強制 path-style。
- `MAX_UPLOAD_BYTES`
- `PORT`

### Web Service

以 GitHub repo 作為 Zeabur source，建置 SPA 後發布靜態檔：

- App directory / `ZBPACK_APP_DIR`：`apps/web`
- Build command：`pnpm build`
- Output directory / `ZBPACK_OUTPUT_DIR`：`dist`

若選擇從 repo root 執行自訂命令，也可以設定：

- Build command：`pnpm install --frozen-lockfile && pnpm --filter @photo-location/web build`
- Publish directory：`apps/web/dist`

另外設定：

- `VITE_API_BASE_URL=https://<your-api-service>.zeabur.app`

### 部署注意事項

- API 目前必須維持 multipart upload 設定，上傳欄位名稱固定是 `photo`。
- SPA 的 `/history/:visitorId?` 仍依賴瀏覽器在成功分析後儲存的 visitor token 與 visitor id。
- 如果你更換 bucket 或 API 網域，記得同步更新 `VITE_API_BASE_URL` 並重新部署前端。
