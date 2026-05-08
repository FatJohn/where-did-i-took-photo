# 本機測試與部署指南

本文整理目前專案要怎麼在本機測試、之後要補哪些 Docker 服務，以及 Zeabur 部署時要設定哪些服務與環境變數。

## 目前狀態

- 前端是 Vue 3 / Vite SPA，位於 `apps/web`。
- 後端是 Fastify API，位於 `apps/api`。
- AI 視覺定位 provider 是 Gemini，實作在 `apps/api/src/providers/vision/gemini-provider.ts`。
- `/analyze` 的上傳欄位名稱固定是 `photo`。
- `apps/api/src/db/schema.ts` 已經有 `visitors` 與 `searches` 的 Drizzle schema。
- 目前 runtime repository 仍是記憶體版本；Postgres 尚未接到正式 request flow。
- 目前沒有 `docker-compose.yml`、Zeabur config、migration script 或 DB init SQL。

## 本機測試目標

本機測試分成兩層：

1. 基礎健康檢查：確認 API、Web、lint、test、typecheck、build 都能跑。
2. 完整照片分析：使用 Gemini API key 與 S3 相容儲存，實際上傳照片跑 `/analyze`。

目前第一層不需要 Docker。第二層需要可用的 Gemini API key 與 S3 相容儲存；Postgres 可先作為部署等價測試的準備項目，等 repository 改成 DB-backed 後再納入必跑依賴。

## 本機驗證指令

```bash
pnpm install
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

啟動 API：

```bash
pnpm --filter @photo-location/api dev
```

啟動 Web：

```bash
pnpm --filter @photo-location/web dev
```

確認 API health check：

```bash
curl http://localhost:8787/health
```

預期回應：

```json
{"status":"ok","service":"photo-location-api"}
```

## 環境變數

後端目前直接讀取 `process.env`。如果只建立 `.env`，API dev script 不會自動載入它。正式補 Docker 或 local helper script 前，先用 shell 匯入：

```bash
set -a
source .env
set +a
pnpm --filter @photo-location/api dev
```

`.env` 建議內容：

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/photo_location
GEMINI_API_KEY=your-key
S3_ENDPOINT=http://localhost:9000
S3_REGION=auto
S3_BUCKET=photo-location-thumbnails
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
MAX_UPLOAD_BYTES=10485760
VISITOR_LIMIT_PER_DAY=20
IP_LIMIT_PER_DAY=50
```

前端建立 `apps/web/.env.local`：

```bash
VITE_API_BASE_URL=http://localhost:8787
```

## Gemini

AI 定位目前使用 Gemini，不是本機 Docker service。完整測試 `/analyze` 時需要有效的 `GEMINI_API_KEY`。

測試重點：

- 有 GPS EXIF 的照片應優先走 EXIF，不應呼叫 AI 推測。
- 沒有 GPS EXIF 的照片會走 Gemini 視覺推測。
- Gemini 回傳不足或格式不符時，結果應退回 `not_found`，不要假裝精準。

## Docker 服務規劃

晚點建立 Docker 時，建議先補這兩個服務：

1. Postgres：對齊 Zeabur PostgreSQL service，供未來 DB-backed repository 與 migration 測試使用。
2. MinIO：對齊 Zeabur Object Storage 或其他 S3 相容物件儲存，供縮圖上傳測試使用。

暫不需要把 Gemini 放進 Docker。Gemini 只需要環境變數提供 API key。

建議服務設定：

- Postgres image：`postgres:16`
- Database：`photo_location`
- User：`postgres`
- Password：`postgres`
- Host port：`5432`
- MinIO image：`minio/minio:latest`
- MinIO API port：`9000`
- MinIO console port：`9001`
- MinIO root user/password：`minioadmin` / `minioadmin`
- Bucket：`photo-location-thumbnails`

建立 Docker 時也要一起確認：

- 是否新增 `docker-compose.yml`。
- 是否新增 Postgres init SQL 或 migration runner。
- 是否要新增 npm script，例如 `dev:api:env` 或 `dev:docker`。
- MinIO 與 AWS SDK 是否需要 `forcePathStyle: true`。目前 `apps/api/src/lib/storage.ts` 尚未設定，實測 MinIO 時要特別確認。

## Postgres schema 備忘

目前 Drizzle schema 宣告了兩張表：

- `visitors`
- `searches`

但正式 runtime flow 尚未使用 `createDb()` 或這兩張表。之後如果要把本機 Docker 測試做完整，應先補其中一種初始化方式：

1. Drizzle migration script。
2. Docker Postgres init SQL。
3. API 啟動前的明確 migration command。

在 repository 改成 DB-backed 以前，Postgres 主要是部署準備與未來整合測試用途。

## MinIO 測試流程

建立 Docker 後，MinIO console 預計在：

```text
http://localhost:9001
```

登入後建立 bucket：

```text
photo-location-thumbnails
```

接著用 `.env` 指向：

```bash
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=photo-location-thumbnails
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

完整 `/analyze` 測試時，預期 API 會把縮圖寫入 bucket，並在回應中回傳 `thumbnailUrl`。

## Zeabur 部署指南

Zeabur 目標維持兩個 application service 加託管資源：

1. API service：Fastify API。
2. Web service：Vite build 後的靜態網站。
3. Zeabur PostgreSQL service。
4. Zeabur Object Storage，或其他 S3 相容物件儲存。

Zeabur 官方文件的重點：

- 可以從 GitHub 建立 service，Zeabur 會分析 repo 並部署。
- pnpm workspace / monorepo 可用 `ZBPACK_APP_DIR` 或 `zbpack.json` 指定 app directory。
- Node service 可用 `ZBPACK_BUILD_COMMAND` / `ZBPACK_START_COMMAND` 或 `zbpack.[service name].json` 自訂 build/start command。
- 靜態網站可用 `ZBPACK_OUTPUT_DIR` 或 `zbpack.json` 的 `output_dir` 指定輸出目錄。
- Node server 應監聽 `process.env.PORT`。

官方參考：

- Zeabur Node.js / monorepo / static output：https://zeabur.com/docs/en-US/guides/nodejs
- Zeabur create service / GitHub / database service：https://zeabur.com/docs/en-US/deploy/create/create-service
- Zeabur Railway migration notes：https://zeabur.com/docs/en-US/get-started/migration/railway

API service：

建議設定：

```bash
ZBPACK_APP_DIR=apps/api
ZBPACK_BUILD_COMMAND=pnpm build
ZBPACK_START_COMMAND=node dist/server.js
```

若選擇從 repo root 執行自訂命令，也可以使用：

```bash
pnpm install --frozen-lockfile && pnpm --filter @photo-location/api build
```

Start command：

```bash
node apps/api/dist/server.js
```

API 環境變數：

```bash
DATABASE_URL=
GEMINI_API_KEY=
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
MAX_UPLOAD_BYTES=10485760
VISITOR_LIMIT_PER_DAY=20
IP_LIMIT_PER_DAY=50
PORT=
```

Web service：

建議設定：

```bash
ZBPACK_APP_DIR=apps/web
ZBPACK_BUILD_COMMAND=pnpm build
ZBPACK_OUTPUT_DIR=dist
```

若選擇從 repo root 執行自訂命令，也可以使用：

```bash
pnpm install --frozen-lockfile && pnpm --filter @photo-location/web build
```

Publish directory：

```text
apps/web/dist
```

Web 環境變數：

```bash
VITE_API_BASE_URL=https://<your-api-service>.zeabur.app
```

## 部署前檢查清單

本機 Docker 補完後，先確認：

- `pnpm lint` 通過。
- `pnpm test` 通過。
- `pnpm typecheck` 通過。
- `pnpm build` 通過。
- API `/health` 可用。
- Web 可以連到本機 API。
- MinIO bucket 可以收到縮圖。
- 至少用一張有 GPS EXIF 的照片測過。
- 至少用一張沒有 GPS EXIF 的照片測過 Gemini 路徑。
- Zeabur API service 的 `PORT` 有正確使用。
- Zeabur Web 的 `VITE_API_BASE_URL` 指向已部署 API。

## 待辦

- 建立 `docker-compose.yml`。
- 決定 Postgres 初始化方式。
- 實測 MinIO 上傳，必要時調整 S3 client。
- 視需要補 API dev script，讓本機 `.env` 載入更直覺。
- 本機完整流程穩定後，再建立 Zeabur service 與託管資源。
