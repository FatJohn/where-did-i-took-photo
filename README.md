# Photo Location Tool

Monorepo for a photo location lookup app:

- `apps/web`: Vue 3 SPA for upload, result review, and anonymous history
- `apps/api`: Fastify API for `/health`, `/analyze`, and `/history/:visitorId`
- `packages/shared`: shared Zod contracts used by both apps

## Local Development

### Prerequisites

- Node.js 22+
- `pnpm` 10
- A reachable Postgres database for the API
- Gemini API key
- S3-compatible bucket credentials for thumbnail upload

### Install

```bash
pnpm install
cp .env.example .env
```

Fill in `.env` with values from your local setup:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/photo_location
GEMINI_API_KEY=your-key
S3_ENDPOINT=https://your-bucket-endpoint
S3_REGION=auto
S3_BUCKET=photo-location-thumbnails
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
MAX_UPLOAD_BYTES=10485760
```

For the SPA, point the browser app at the API by creating `apps/web/.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8787
```

### Run

Start the API:

```bash
pnpm --filter @photo-location/api dev
```

Start the web app in a second terminal:

```bash
pnpm --filter @photo-location/web dev
```

### Checks

```bash
pnpm --filter @photo-location/api test
pnpm --filter @photo-location/web test
pnpm typecheck
```

## Railway Deployment

The current workspace is easiest to deploy as two Railway services plus managed data resources:

- one service for `apps/api`
- one static site for `apps/web`
- one Railway Postgres instance
- one Railway Bucket or another S3-compatible object store

### API Service

Use the repo root as the Railway source and configure:

- Build command: `pnpm install --frozen-lockfile && pnpm --filter @photo-location/api build`
- Start command: `node apps/api/dist/server.js`

Set these variables on the API service:

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

Build the SPA and publish the generated static files:

- Build command: `pnpm install --frozen-lockfile && pnpm --filter @photo-location/web build`
- Publish directory: `apps/web/dist`

Set:

- `VITE_API_BASE_URL=https://<your-api-service>.up.railway.app`

### Deploy Notes

- The API must stay configured for multipart uploads. The file field name remains `photo`.
- `/history/:visitorId?` in the SPA still depends on visitor token and visitor id values persisted by the browser after a successful analyze request.
- If you rotate bucket or API domains, update `VITE_API_BASE_URL` and redeploy the web service.
