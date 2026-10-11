# 第二批 E2E｜八段相片海報提示詞的去重與網站化（2026-10-11）

**目標：抽 Style DNA，不做 image-to-image。** 沒有收到真正的旅遊場景照片；不從風格描述／範例海報推斷城市、相機視角、地標、人物、真實招牌或 HEX。實作 HEX 都是明確標示的網站設計提案。

| 來源段落 | 原始 Style DNA | 分流結論 | Style Pack |
| --- | --- | --- | --- |
| ① Minimalist Linocut/Riso | 2–3 色、乾墨、撕紙右邊、左上大留白、右下小主體 | 主體尺度與紙邊、版刻獨立於 Risograph | [Quiet Linocut](../../style-packs/quiet-linocut/manifest.json) |
| ② RISO Editorial Illustration | 2–4 色套印、不閉合手繪線、網點、顆粒 | **重疊**：既有 Risograph Zine，作為它的風格輔助規則，不新增近似選項 | [Risograph](../../style-packs/risograph/manifest.json) |
| ③ 九宮格手帳塗鴉 | 3×3 隱性鬆散網格、九個小記憶、蠟筆／彩鉛 | 九格是裝飾插圖，不能偽稱旅程有九個站點 | [Doodle Memory Grid](../../style-packs/doodle-memory-grid/manifest.json) |
| ④ Vintage Zine 單墨 | 靛藍／暖褐單墨、網點、固定編輯文字 | **與前一批幾乎完全重複**，仍歸既有 Risograph | [Risograph](../../style-packs/risograph/manifest.json) |
| ⑤ Crayon Memory Mini-scene | 2–5 個小物件橫向構圖、粗蠟筆、稚拙且細緻 | 非九宮格，重點是水平小場景與乾筆色料 | [Crayon Journal](../../style-packs/crayon-journal/manifest.json) |
| ⑥ Soft Painterly Editorial | 柔藍／象牙、水粉／壓克力刷毛、柔軟大色塊 | 不等於舊 Naive City 的抖動城市墨線 | [Painterly Editorial](../../style-packs/painterly-editorial/manifest.json) |
| ⑦ Neo Geometric Flat Print | 無描邊／陰影、銳利多邊形、5–6 色版畫 | 方向與原 Candy 的圓潤幾何相反 | [Geometric Print](../../style-packs/geometric-print/manifest.json) |
| ⑧ Sparse Acrylic Cover | 細不穩線、約 10–20% 小主體、大片留白、≤4 色 | 非大筆觸繪畫；比 ① 少版刻粗線／破墨 | [Quiet Acrylic](../../style-packs/quiet-acrylic/manifest.json) |

**8 段輸入 → 6 套新增、2 段歸到既有 Risograph；累計 14 個 Style Pack／15 種可選外觀**（Editorial Light/Dark 是同一個 Pack 的兩個 mode）。

## 原提示詞需要丟棄／改寫的部分

- **丟棄**：3:4 版型、上半原片下半插畫、嚴格 50/50、每張照片各自產海報、硬性指定圖片輸出。
- **有來源照片才啟用**：忠於原圖人物姿勢、地標、數量、服飾、場景位置、原圖抽色、視角與自然光影。當前沒有該類照片。
- **不得帶入資料**：固定英文 caption、Zine v1.3、Gathered Scenes、No.07、英語兩句短詩、年月／坐標、照片辨識的城市與品牌落款。網站只顯示 `trip.json` 中可信的真實資訊。
- **改寫成裝飾語法**：九宮格僅描繪 9 個裝飾記憶圖示，沒有 9 個假活動；撕紙邊緣只能出現在 SVG 內，不能裁切按鈕；插圖無描邊不能移除網頁鍵盤 Focus ring。
- **風格互斥要區分**：Geometric 的硬邊無線對比 Crayon 的短線顆粒；Painterly 的大筆觸對比 Quiet Acrylic 的小細線；Riso 印刷語法與 Linocut 的撕紙、大留白要看是否有真正不同的構圖。

每份 [Style Brief](../examples) 是 `brief-only` 的規格，附有 `audit.unknowns` 和原輸出需求 `excludedOriginalInstructions`；上線的是獨立受白名單控制的 CSS／SVG／Manifest。這次經 LLM 提取及人工實作／審查，**沒有建立完全無人介入的 Prompt→CSS 服務**。

## 下一個未知提示詞的驗收

使用 [Style Extractor Prompt](../STYLE_EXTRACTOR_PROMPT.md)，先做重複性判斷，再生成新的 Brief。通過 `npm run validate:styles`／`npm run test:styles` 後判斷既有 Pack 變體或新 Pack，完成 CSS／SVG、手機／桌機截圖、Now/Trip/Map/Check/More 回歸，然後按 [跨雙站 E2E](../NEXT_PROMPT_E2E.md) 同步到 Megan，保留原行程、確認同源 CSS、離線快取、實際 Pages 視覺一致。
