# 照片定位工具

這是一個照片定位網站的 monorepo：

- `apps/web`：提供上傳、結果檢視與匿名歷史紀錄的 Vue 3 SPA
- `apps/api`：提供 `/health`、`/analyze`、`/history/:visitorId` 的 Fastify API
- `packages/shared`：前後端共用的 Zod contract

## 本機開發

### 前置需求

- Node.js 22 以上
- `pnpm` 10
- API 可連線的 Postgres 資料庫
- Gemini API key
- 可相容 S3 的縮圖儲存設定

### 安裝

```bash
pnpm install
cp .env.example .env
```

請依你的本機環境填入 `.env`：

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/photo_location
GEMINI_API_KEY=your-key
S3_ENDPOINT=https://your-bucket-endpoint
S3_REGION=auto
S3_BUCKET=photo-location-thumbnails
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
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

先啟動 API：

```bash
pnpm --filter @photo-location/api dev
```

再用另一個 terminal 啟動前端：

```bash
pnpm --filter @photo-location/web dev
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

## Railway 部署

目前這個 workspace 最適合部署成兩個 Railway service 加上託管資料資源：

- 一個 `apps/api` service
- 一個 `apps/web` 靜態網站
- 一個 Railway Postgres
- 一個 Railway Bucket，或其他相容 S3 的物件儲存

### API Service

以 repo root 作為 Railway source，並設定：

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
- `MAX_UPLOAD_BYTES`
- `PORT`

### Web Service

建置 SPA 後發布靜態檔：

- Build command：`pnpm install --frozen-lockfile && pnpm --filter @photo-location/web build`
- Publish directory：`apps/web/dist`

另外設定：

- `VITE_API_BASE_URL=https://<your-api-service>.up.railway.app`

### 部署注意事項

- API 目前必須維持 multipart upload 設定，上傳欄位名稱固定是 `photo`。
- SPA 的 `/history/:visitorId?` 仍依賴瀏覽器在成功分析後儲存的 visitor token 與 visitor id。
- 如果你更換 bucket 或 API 網域，記得同步更新 `VITE_API_BASE_URL` 並重新部署前端。
