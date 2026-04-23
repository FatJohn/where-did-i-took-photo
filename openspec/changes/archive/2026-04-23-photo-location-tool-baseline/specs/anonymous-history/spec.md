## ADDED Requirements

### Requirement: 系統 MUST 保留匿名 visitor 延續性

系統 MUST 簽發並重用匿名 visitor context，讓回訪使用者不需要完整帳號登入，也能讀取自己的近期分析歷史。

#### Scenario: 新訪客完成一次分析
- **WHEN** 使用者在沒有可重用 visitor token 的情況下分析照片
- **THEN** 系統會建立新的匿名 visitor 身分
- **AND** 回傳後續查歷史所需的 visitor token 與 visitor identifier

### Requirement: 歷史存取 MUST 僅限對應 visitor

系統 MUST 提供 `GET /history/:visitorId`，且只有在提供的 visitor token 解析後與該 visitor identifier 相符時，才可回傳歷史資料。

#### Scenario: Visitor 查詢自己的歷史
- **WHEN** request path 中的 visitor id 與 `x-visitor-token` 解析出的 visitor 身分一致
- **THEN** API 會回傳該 visitor 的歷史分析項目

#### Scenario: Visitor 查詢其他人的歷史
- **WHEN** request path 中的 visitor id 與解析出的 visitor 身分不一致
- **THEN** API 會拒絕請求，而不是洩漏其他 visitor 的歷史資料

### Requirement: 歷史保留 MUST 有上限

系統 MUST 透過最新項目裁切與依資料年齡的 cleanup 規劃，限制匿名歷史的保留範圍。

#### Scenario: 單一 visitor 儲存超過十筆資料
- **WHEN** 某個 visitor 已有十筆資料，且又新增一筆分析結果
- **THEN** 系統只會保留該 visitor 最新的十筆資料

#### Scenario: Cleanup 規劃評估過期歷史
- **WHEN** cleanup 規劃對既有 searches 進行評估
- **THEN** 超過 180 天的 searches 會被標記為待刪除
- **AND** 剛好落在 180 天 cutoff 的 searches 不視為過期
