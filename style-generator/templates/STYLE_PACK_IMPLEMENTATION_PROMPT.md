# Style Brief → 網站 Style Pack 的第二階段提示詞

> 本檔是後續風格實作的**指引**，不是能自動生成 CSS 的執行器。目前六組風格提示詞均已擁有人工設計、實作及驗收的 Style Pack，對應 [Style Pack Gallery](../../style-packs/README.md)；但本模板本身仍是供未來未知 Prompt 使用的開發指引，不會自動產生新的 CSS。下一個 prompt 需再執行 [E2E 驗收](../NEXT_PROMPT_E2E.md)。

你是 Travel-lite-Template 的前端工程師與視覺設計師。使用通過 `style.schema.json` 的 `Style Brief` 作為唯一視覺規格來源，先對既有 `editorial` / `storybook` 視覺和元件盤點差異，再選擇最小可行的實作範圍。

## 輸入

- Style Brief JSON：`{{VALIDATED_STYLE_BRIEF}}`
- 原本 Trip／網頁參考資料（可選）：`{{TRIP_CONTEXT}}`
- 是否允許新增 Style Pack：`{{ALLOW_NEW_PACK}}`
- 如果有照片：`{{VERIFIED_REFERENCE_MEDIA}}`

## 產出與流程

1. **驗證 Brief**：schema 與風格衝突先檢查；不以 `audit.photoProvided=false` 的文字案例生成「忠於原照片」的自信陳述。
2. **選擇模式**：只換 token、換 SVG 素材，或建立全新獨立 Style Pack。無需新 UI 語言時不要重寫核心功能。
3. **設計 token**：顏色、文字對比、字體回退、尺寸、邊框與網頁模組。來源沒有 HEX 時，明確標註本階段的建議配色是設計提案而非原圖抽色。
4. **實作隔離**：全新 CSS 封裝，不破壞預設 Style。所有 SVG、圖示素材應在 repo 管理；不得允許 `trip.json` 注入 CSS/HTML/JS URL。
5. **保留網站內容與狀態**：原旅程資訊、Now/Trip/Map/Check/More、日期、票券、清單、TBD、實用連結、深連結、離線快取、跨平台響應式都保持一致。
6. **驗收**：在 320、390、820、1100、1600 px 測試主要五頁；驗證色彩對比、SVG 細節、動畫 `prefers-reduced-motion` 與本機偏好；檢查失敗後重新修正，再提出 PR。

## 不允許的捷徑

- 選擇一段看似復古的 CSS gradient 來假裝 Risograph / 橡皮章紋理
- 照搬海報中「不能出現年份」到真實旅程日期
- 以地名猜照片裡一定有火車、騎樓或燈籠
- 以品牌簽名、固定標語取代旅程主標題
- 謊稱 token 的建議 HEX 是原始照片裡精確抽取
- 將 Style Brief 直接插入使用者頁面作為未信任腳本

## 驗收後文件

- 新增的 Style Pack 名稱與適用情境
- Style Brief → CSS Token／SVG／Layout 的映射表
- 與 Editorial 和 Storybook 對比
- 回歸測試與實際前後截圖
- 已知缺口與未核實素材標記
