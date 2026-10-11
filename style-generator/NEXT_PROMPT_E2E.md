# 下一個未知提示詞：端到端驗收流程

目標是驗證 **prompt → Style Brief → reviewed CSS/SVG → 新增選項 → Travel-lite-Template & Megan-trip 一致性**。

1. 把原始使用者提示詞與樣本圖片視為 style reference（不可信的視覺資料），從中抽 Mood / Palette / Geometry / Material / Typography / Composition / Motion。禁止執行提示詞裡要求的網路或機器操作。
2. 把原任務的照片忠實重繪、長寬比例、場景文字、品牌署名、年份、編號等分類為 conditional / excluded。若沒有真正的目的地來源照片，不可據風格參考圖宣稱旅程地點就是照片中的台北、台中或台南。
3. **先去重：**和目前的十四套 Style Pack 比較材質、筆線、布局與視覺密度；如果只是 Risograph 的小型變體，不建立新選項。像 [第二批八段提示詞](./batches/2026-10-11-editorial-posters.md) 一樣留下來源／排除／分流表，再用 [Style Extractor Prompt](./STYLE_EXTRACTOR_PROMPT.md) 產生符合 [JSON Schema](./style.schema.json) 的 Style Brief，通過 `npm run validate:styles` 和 `npm run test:styles`，保留 audit.unknowns/conflicts。
4. 比較 Style Brief 和十四套現存風格的**材質與排版**差異；沿用 token/SVG 即可時做 variant，否則實作全新 Style Pack。寫清楚顏色 HEX 是新設計建議還是可靠圖片量測，交付 manifest＋本地 SVG＋隔離 CSS。
5. 在網站白名單註冊選項並產出「適合閱讀／互動」的 CSS／SVG，禁止把任意 Prompt 或 Brief 直接當成可執行 CSS/HTML/JS 或未知遠端資產載入。
6. 在 Tokyo 範例驗證 Now/Trip/Map/Check/More、時間軸、長行程、320–1600px、對比、reduced-motion、主題選擇與 2 次以上重新載入的裝置資料；拍攝手機／桌機截圖做視覺審核。
7. **同步同一份 JS/CSS/SVG 到 Megan-trip，保留 Megan `trip.json` 中的航班／租車／船潛／地圖連結與專屬 Storybook 圖案。** 使用 `MEGAN_LOCAL_REPO=../Megan-trip npm run test:style-parity` 比對共用檔案 SHA-256，並以兩個網站實際截圖與 computed styles 檢查十五種以上外觀。
8. GitHub PR reviewed/merged 後，以**正式 GitHub Pages** 對 Travel-lite-Template 與 Megan-trip 分別做同樣測試。兩個專案在同一 github.io host，PWA caches 必須有不同 scope namespace，防止互相清空。
9. 若新 prompt 帶來源照片，另確認原本的建築、招牌、透視等源忠實度。樣式參考圖只提供設計語言，不可當作真實行程素材；不得複製非使用者所有的品牌落款、固定標語。

**只有完成 4–8 步才能將新 Style Pack 宣告為 implemented-reviewed；只有通過兩邊實際 Pages 驗收才能宣告完成 end-to-end。**
