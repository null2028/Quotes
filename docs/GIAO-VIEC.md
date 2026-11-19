# Ghi chú giao việc cho 2 agent

## Ai làm gì
| | Agent A | Agent B |
|---|---|---|
| Thư mục | `Quotes` | `Quotes-B` (tạo sau) |
| Nhánh git | `feat/semantic-stage` | nhánh riêng của B |
| Mảng việc | ENGINE: skill, đạo cụ, động từ, nhân vật, validator, render | NGOÀI ENGINE: Airtable, caption, hàng đợi & lịch đăng, kết nối YouTube/TikTok |
| Được sửa | `src/stage/`, `src/kit/`, `.agents/skills/`, `scripts/` (skill/stage), `docs/` | `studio-ui/` (phần Airtable/hàng đợi), `server/` (phần đăng bài), `data/` |
| Không được sửa | phần Airtable, đăng bài | `src/stage/`, `src/kit/`, skill, `propCatalog` |

## Câu lệnh giao việc
- Agent A, task có sẵn: `Đọc tasks/<tên task>.md và làm.`
  - Họ đạo cụ: `Đọc tasks/T8-HO.md và làm họ <tên họ>.`
- Agent B: mở đúng thư mục `Quotes-B` rồi mới giao việc.

## Hàng đợi của Agent A (từ 19/11 — chuyển hướng "làn tự do", model Neon)
| # | Task | Câu lệnh |
|---|---|---|
| 1 | TF1 — làn tự do chính thức, kiểm tra chỉ vỡ hình | `Đọc tasks/TF1.md và làm.` |
| 2 | TF2 — preview chạy macOS + Linux, cùng luồng video thật | `Đọc tasks/TF2.md và làm.` |
| 3 | TF3 — sửa đồi che vật đỏ, đất kéo hết ngang, dấu phiên bản + log | `Đọc tasks/TF3.md và làm.` |
| — | Sau đó: làm 2–3 Chén thật qua làn tự do, rồi mới quyết thêm gì | |
TẠM DỪNG: T8-DNA-b, các họ đạo cụ (T8-HO), mọi luật mới.

## Sau mỗi task
Nhắn Claude "xong <tên task>" → Claude duyệt, commit (A) hoặc gộp nhánh (B), rồi báo task tiếp theo.

## Đừng
- Giao 2 task engine cùng lúc cho 2 agent.
- Mở `Quotes` cho Agent B, hoặc `Quotes-B` cho Agent A.
- Chạy `npm run gen:skill` ở Agent B.
