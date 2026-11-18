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

## Thứ tự việc của Agent A (kèm model)
1. T8-do_chua-sua — sửa ấm trà, mâm cơm, chén cầm tay → **Hydrogen**
2. T5c — siết luật đạo diễn trong skill → **Hydrogen**
3. T6 — nhân vật thứ hai + động từ, dựng lại Chén 18 → **Argon**
4. Họ đạo cụ lần lượt (`Đọc tasks/T8-HO.md và làm họ <tên>`): `mat_phang` → `khung` → `giay` → `cay_co` → `do_mang` → **Hydrogen**
Carbon chỉ dùng khi có lỗi lạ mà Hydrogen/Argon không giải được.
Chạy quá 20 phút chưa sửa file nào → gõ: "Bạn đã đủ thông tin để sửa chưa? Nếu đủ thì sửa ngay."

## Sau mỗi task
Nhắn Claude "xong <tên task>" → Claude duyệt, commit (A) hoặc gộp nhánh (B), rồi báo task tiếp theo.

## Đừng
- Giao 2 task engine cùng lúc cho 2 agent.
- Mở `Quotes` cho Agent B, hoặc `Quotes-B` cho Agent A.
- Chạy `npm run gen:skill` ở Agent B.
