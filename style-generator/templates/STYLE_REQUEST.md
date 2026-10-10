# Style Prompt → Style Brief（使用者填空版）

將這份模板連同 [STYLE_EXTRACTOR_PROMPT.md](../STYLE_EXTRACTOR_PROMPT.md) 貼給 ChatGPT / 具結構化輸出能力的 LLM。

原風格描述可以是中文、英文、圖片重繪提示詞、明信片或海報設計指示；**不必先自己拆解**。

```text
我想把以下提示詞裡的「風格」抽出來，作為 Travel-lite-Template 的視覺 Style Brief。

原始提示詞：
{{RAW_STYLE_PROMPT}}

希望應用的情境（可留空）：
{{TRIP_CONTEXT_OR_DESTINATION}}

是否提供原始照片：
{{NO_PHOTO / PHOTO_ATTACHED}}
（如果有照片，請先理解圖片再提取來源相關規則；沒有圖片就僅處理文字）

參考的網站風格（可留空）：
{{AUTO / STORYBOOK / EDITORIAL / NEW_STYLE_PACK}}

特別要保留的特色：
{{OPTIONAL_KEEP}}

特別不想要的效果：
{{OPTIONAL_AVOID}}

請：
1. 區分 Style / Asset generation / Output layout / Functional requirements。
2. 不要讓明信片的比例、品牌、年份與固定標語污染旅遊網站。
3. 未給原始照片時，不推測照片裡出現的地標、街景、招牌與精確 HEX。
4. 辨識衝突與缺少的資料；把不確定寫入 audit。
5. 輸出符合 style-generator/style.schema.json 的 JSON（stage=brief-only）。
6. 不直接生成六套未驗證的網站 CSS。
```

範例：填入「奶白底色、糖果色圓潤貼紙與白邊，日期卡有彈跳」會導向 Candy Geometry 的 token／asset 變體；填入「手刻橡皮章、飛白、2–4 色」則應是另一套材料語言，不能簡單當作 Storybook 換色。

## 之後如何把 Brief 變成真的網站？

把驗證成功的 JSON 交給下一階段 Style Pack 任務，先檢查是否能用既有 `storybook` 或 `editorial` 作變體；需要特殊網點、剪紙層次、手刻印泥效果時，再製作隔離的 Style Pack 和截圖測試。**不能把任意提示詞、JSON 當作 CSS／腳本直接載入網站。**
