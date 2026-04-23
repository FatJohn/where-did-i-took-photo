## 1. Workspace 與後端 baseline

- [x] 1.1 建立 pnpm workspace 與 shared Zod contracts
- [x] 1.2 建立 Fastify API 骨架與 health endpoint
- [x] 1.3 實作匿名 visitor 解析與 visitor 範圍內的歷史基礎
- [x] 1.4 實作照片 intake、EXIF 解析、縮圖產生與儲存上傳支援
- [x] 1.5 實作以 Gemini 為基礎、且遵守 EXIF 優先的定位分析與結果正規化
- [x] 1.6 實作 `/analyze` route，整合 multipart `photo` 上傳、storage 與 rate limiting

## 2. 前端體驗 baseline

- [x] 2.1 建立 Vue SPA、router、stores，並對齊 API client contract
- [x] 2.2 在前端整合 upload、result card、map 與 history
- [x] 2.3 加入以 Leaflet 為基礎的地圖呈現與 Google Maps 外部導覽

## 3. 保留規則與文件 baseline

- [x] 3.1 實作超過 180 天 searches 的 cleanup 規劃
- [x] 3.2 文件化本機開發、驗證與部署預期
- [x] 3.3 將這份 baseline archive 成 OpenSpec main specs
