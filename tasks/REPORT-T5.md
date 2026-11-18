1. **Sinh skill (1 nguồn duy nhất)**: `npm run gen:skill` → `.agents/skills/dao-dien-tra-nguoi/dao-dien-tra-nguoi.zip` (`SKILL.md`: 36 dòng + `references/{thu-vien.md,goi-chen.md,q001.json}`).
2. **Đồng bộ tool & thử W051**: Xoá toàn bộ hằng skill cũ trong `geminiBundleBridge.ts`, Tab 2 tải/copy trực tiếp từ server; `docs/goi-mau/w051.json` qua `check-goi` OK ngay lần đầu (**0 lần sửa**), `npm run typecheck` **0 lỗi**.
3. **Tải skill (1/3)**: Chạy `npm run gen:skill` (hoặc mở `npm run app` → **Nạp Gói Gemini** → tab **2. Cài Gemini Skill** → bấm **Tải Gói Skill (.zip)**).
4. **Tải skill (2/3)**: Mở `gemini.google.com` → **More (Thêm) → Customize (Tùy chỉnh) → Skills** → bấm **Create → Upload** và chọn `dao-dien-tra-nguoi.zip`.
5. **Tải skill (3/3)**: Trong khung chat Gemini gõ `/dao-dien-tra-nguoi` kèm câu quote/ý tưởng → chốt Bước 1 & Bước 2 → copy JSON Gói Chén ở Bước 3 dán về tool web.
