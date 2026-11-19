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

## Hàng đợi của Agent A (model mặc định: Neon)
| # | Task | Câu lệnh | Chủ kênh cần xem |
|---|---|---|---|
| 1 | T7b — vật đỏ giữ đến hết, không bỏ im lặng, cụ thể hoá câu trừu tượng | `Đọc tasks/T7b.md và làm.` | — (đang chạy) |
| 2 | T7c — nghi thức mở màn | `Đọc tasks/T7c.md và làm.` | ảnh dải 3 giây đầu |
| 3 | T8-BOI-CANH — 9 bộ bối cảnh + ngã rẽ rõ | `Đọc tasks/T8-BOI-CANH.md và làm.` | tờ 3×3 bối cảnh |
| — | **Chủ kênh**: cập nhật skill trên Gemini web, dựng lại Chén 19 (phương án chén trà), render, xem trên điện thoại | | video |
| 4 | Họ `khung` (cửa, cổng, gương, mái hiên…) | `Đọc tasks/T8-HO.md và làm họ khung.` | tờ duyệt |
| 5 | Họ `giay` | `Đọc tasks/T8-HO.md và làm họ giay.` | tờ duyệt |
| 6 | Kiểu cú lật (xuat_hien, bien_hinh, lui_may, phong_dai…) | task sẽ viết sau | |
| 7 | Tham số họ + trạng thái dùng chung | task sẽ viết sau | |
| 8 | Họ `cay_co`, `do_mang`, rồi các họ còn lại | `Đọc tasks/T8-HO.md và làm họ <tên>.` | tờ duyệt |
| 9 | Chữ nhỏ trên đồ vật, đồ tạm lắp ghép | task sẽ viết sau | |
Carbon chỉ khi có lỗi lạ Neon không giải được. Chạy quá 20 phút chưa sửa file nào → gõ: "Bạn đã đủ thông tin để sửa chưa? Nếu đủ thì sửa ngay."
Sau mỗi task có thư viện mới (họ đạo cụ, bối cảnh): cập nhật skill trên Gemini web (tải zip mới, xoá bản cũ, tải lên).

## Sau mỗi task
Nhắn Claude "xong <tên task>" → Claude duyệt, commit (A) hoặc gộp nhánh (B), rồi báo task tiếp theo.

## Đừng
- Giao 2 task engine cùng lúc cho 2 agent.
- Mở `Quotes` cho Agent B, hoặc `Quotes-B` cho Agent A.
- Chạy `npm run gen:skill` ở Agent B.
