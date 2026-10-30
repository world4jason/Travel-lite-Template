# Style Prompt Lab — 提示詞 → 可重用風格規格

> **Status: extraction prototype / brief-only.** 這一層已實際整理兩批不同用途的自然語言風格提示詞、總計十二份去重後的 Style Brief，並可用 Node.js 零額外套件驗證結果；**不是已自動生成六套可直接部署的 CSS**。

Travel Lite 已有 **Functional Template**（行程、地圖、清單、Now 等）及 15 個內建 Style IDs（Editorial 加 14 套選用風格，含 Vintage Watercolor），共 16 種外觀。兩批文字提示詞的 12 份 Style Brief 是規格來源，而不是直接注入程式的 CSS。

## Frame & Ornament Grammar（新抽取必填）

新 Style Brief 使用 schemaVersion 1.1.0，必須獨立描述框線、四角、內外層次、章節飾章、標籤框，以及 mobile/desktop/print 的保留規則。既有 1.0.0 的十二份案例保持相容；缺少框線欄位代表尚未抽取，不等於設計上不需要框線。詳見 [Style Pack 框線稽核](../docs/STYLE_FRAME_GRAMMAR_AUDIT.md)。

本實驗補的是中間一層：

```text
相片重繪／海報／明信片／印刷／網站風格提示詞
             │
             ▼
   LLM + STYLE_EXTRACTOR_PROMPT.md
             │     [風格 / 來源照片資產 / 輸出格式 / 網站功能]
             ▼
        Style Brief JSON       ← 本次已實作、已測試
             │
             ├── style.schema.json + validate-style.mjs
             │
             ▼
   人類確認衝突、不確定與歸因
             │
             ▼
   新 Style Pack 實作與視覺 QA   ← 下一階段，尚未自動化
             │
             ▼
Travel-lite-Template 網站（不改真實行程和共用狀態）
```

## 簡單使用

1. 開啟 [使用者填空版](./templates/STYLE_REQUEST.md)，把原始設計提示詞整段貼入。
2. 一起提供 [LLM 抽取工作指令](./STYLE_EXTRACTOR_PROMPT.md) 及 [JSON Schema](./style.schema.json) 給 ChatGPT（或其他能理解指令並輸出 JSON 的 LLM）。
3. 將 LLM 產生的 JSON 存檔，例如 `style-generator/examples/my-new-style.json`。
4. 在 repo 執行：

```bash
npm run validate:styles
npm run test:styles
npm run render:style-prompts    # 將十二個標準案例轉成可再填空的 Markdown Prompt
# 驗證／渲染單一新 Style Brief：
node style-generator/validate-style.mjs ./my-style-brief.json
node style-generator/render-style-prompt.mjs ./my-style-brief.json ./my-output-dir
```

**注意：** `validate:styles` 只檢查範例資料夾，個別新檔案要用最後一行命令。驗證器檢查 Schema 中本專案使用的核心子集，加上固定色數／圖片佐證等跨欄位規則；不是通用完整 JSON Schema 引擎。由 LLM 產生 JSON 的步驟發生在聊天／LLM 工具中，Node 指令本身**不會呼叫 LLM**，不會憑空把一句話編譯成 CSS；`render:style-prompts` 只會把已驗證 JSON 確定性地轉成可填空 Markdown。

## 第一批六組跨用途挑戰：實際抽出的風格

| 來源提示詞 | 抽出風格 | 主要可移植語言 | 必須丟棄或變條件式 | 網站改造級別 |
| --- | --- | --- | --- | --- |
| 圓潤糖果色塊 | [Candy Geometry](./examples/candy-geometry.json) | 五色配置、幾何圓角、淺色貼紙描邊、可愛 SVG | 招牌文字必須有照片；五色與純白的衝突必須標記 | Storybook 素材＋token 變體 |
| 高端剪紙層疊 | [Paper Collage](./examples/paper-collage.json) | 層疊卡紙、柔和接觸陰影、主體／次要層與微排版 | 原照片形狀、主標、2–4 文字、禁止年份只適用海報 | 全新 Style Pack |
| 50–60 年代歐洲城市繪本 | [Naive City Sketch](./examples/naive-city-sketch.json) | 抖動墨線、歪樓、水粉、手繪錯位與大量天空留白 | 大頭細腿人物和底部手寫字只適用插畫素材 | 全新 Style Pack |
| Vintage Zine | [Risograph Zine](./examples/risograph-zine.json) | 單墨網點、破墨、奶油紙、選擇性保色、打字機字氣質 | 固定英文標語、雙面板與「無額外文字」互相衝突；網站不帶入 | 全新 Style Pack |
| 台灣中世紀旅遊海報 | [Taiwan Retro Poster](./examples/taiwan-retro-poster.json) | 幾何建築、網印、海軍藍／蜂蜜黃／橄欖綠等 | 3:4、70/30 區域、品牌落款、台灣地標需原照片證據 | 全新 Style Pack |
| 手刻橡皮章／田野筆記 | [Field Stamp](./examples/field-stamp.json) | 2–4 色印章、刀刻斷線、乾墨、輕微套色偏差 | 英文地名／No.／年份與左右照片版型只是章票任務 | 全新 Style Pack |

這六份 JSON **是本次由 LLM 根據使用者提供的文字手動抽取的案例**，沒有另外執行模型 API 或真正檢視來源照片。每份 `audit.photoProvided=false`、`basis=text-only`，也沒有把「沒有提供色碼」偷變成自己猜的 HEX。它們的 `stage` 均為 `brief-only`。

## 可直接填空的 Style Prompt（兩批共十二份）

經過 `Style Brief JSON → render-style-prompt.mjs`，可自動產生統一格式、保留視覺特徵的 Markdown 模板：

- [Candy Geometry](./generated-prompts/candy-geometry.md)
- [Paper Collage](./generated-prompts/paper-collage.md)
- [Naive City Sketch](./generated-prompts/naive-city-sketch.md)
- [Risograph Zine](./generated-prompts/risograph-zine.md)
- [Taiwan Retro Poster](./generated-prompts/taiwan-retro-poster.md)
- [Field Stamp](./generated-prompts/field-stamp.md)
- [Quiet Linocut](./generated-prompts/quiet-linocut.md)
- [Doodle Memory Grid](./generated-prompts/doodle-memory-grid.md)
- [Crayon Journal](./generated-prompts/crayon-journal.md)
- [Painterly Editorial](./generated-prompts/painterly-editorial.md)
- [Geometric Print](./generated-prompts/geometric-print.md)
- [Quiet Acrylic](./generated-prompts/quiet-acrylic.md)

這些檔案都有 `{{DESTINATION_OR_TRIP_CONTEXT}}`、`{{REFERENCE_PHOTO_OR_NONE}}`、`{{EXTRA_STYLE_CONSTRAINTS_OR_NONE}}` 等可填欄位，也清楚標明哪些原始海報要求應排除。它們是可提交給 LLM 的**第二階段設計任務描述**，不是可部署 CSS。來源照片未提供時，不會推斷真實場景。

## 第二批：八段來源，去重後六種新的視覺語法

[查看來源 → 既有 Pack／新增 Pack 的去重矩陣、保留風格特徵與排除原任務規則](./batches/2026-10-11-editorial-posters.md)。兩段 RISO／Zine 原提示詞與既有 Risograph 重疊，因此只新增六份 Style Brief／六套視覺風格。

## 具體測出來的 4 個風險

1. **抽取色彩，不等於量到照片顏色。** 糖果風描述了五個色名，但完全沒有 HEX；紙雕／橡皮章要求從照片抽色，照片缺席時只可保留抽色策略。
2. **互斥指示要攤開。** 五色 + 額外純白描邊可能變六色；Zine 同時要求固定字與不能多字。輸出 `audit.conflicts` 而非替使用者默默決定。
3. **媒介轉換不能照搬版型。** 明信片 3:4、年份落款、固定英文標語，不能套用在 Now/Trip/Transport/Places/More。
4. **不要以風格推斷現實。** 「台灣復古」不代表原照片有機車、騎樓或燈籠；沒有照片時不能自動指認地標。網站真實地址、日期與訂位資訊只能取自使用者行程。

## Style Brief 與完成的 Style Pack 有何差異？

| | Style Brief（本階段） | Style Pack（需要實作與測試） |
| --- | --- | --- |
| 內容 | 風格 DNA、取捨、衝突、條件、網站映射建議 | token/CSS、SVG、必要元件、README、實際視覺截圖 |
| 可以修改網站外觀？ | **不行** | 經審查後可以 |
| 可從任意描述開始？ | 可以，分類名稱可擴充 | 需判斷能否沿用 Storybook 或實作新包 |
| 來源照片必須有嗎？ | 不用，沒照片記錄 unknowns | 製作忠於照片的素材才需要 |
| 會直接塞進 `trip.json` 嗎？ | **不會** | 只有已安裝、白名單允許的 `ui.visualStyle` 才能選用 |

第二階段已完成**十二個人工實作並驗收的提示詞來源網站風格**，包含 Candy Geometry、Paper Collage、Naive City Sketch、Risograph Zine、Taiwan Retro Poster、Field Stamp。加上 Editorial、原 Megan Storybook 與另行設計的 Vintage Watercolor，目前共有十五個 Style IDs／十六種外觀。[查看可用的 Style Pack 與測試](../style-packs/README.md)。

這十二份原始來源 JSON 依然標為 `brief-only`，用來追溯當初的風格敘述，不是可執行程式；真正可選用的是另外經過程式碼與視覺驗收的 CSS／SVG + Manifest。下一個未知提示詞的 [E2E 驗收 Runbook](./NEXT_PROMPT_E2E.md) 已定義：抽取、審查、產生素材／樣式、模板／Megan 雙站一致性驗收、上線確認。

## 這版抽取器的限制

- LLM 的實際抽取品質取決於模型，單靠 JSON Schema 無法保證主觀美學理解正確。
- 現在是十二份有代表性的**人工審閱標準案例**與有效性測試；尚未搭建批量 LLM API Pipeline 或自動反覆視覺迭代。
- 自訂風格名字（如 `pixel-art`、`woodcut`）可成為新的 Brief 值，不代表 runtime 會自動載入這些 Style Pack。
- 對照片要求的文字辨識、實際建築比例與顏色抽取，需收到照片才可另外執行。

## 視覺設計的工程底線

風格只決定**如何呈現**，不能改變行程的事實、TBD 狀態、導航操作、清單、跨頁流程、離線功能。所有裝飾字應與真實行程文字分離。現有 production 的 `editorial` 與 `storybook` 都維持不變。
