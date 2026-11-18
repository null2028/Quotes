Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Chỉ sửa nội dung skill (SKILL_MD_CONTENT trong scripts/gen-stage-skill.mjs), không sửa engine.

T5c. Siết 3 luật đạo diễn (bài học từ REPORT-T5b: các phương án vẫn chọn laptop/lịch làm vật đỏ rồi "gán" nghĩa, đặt bàn làm việc giữa ngã rẽ, và bỏ quên hình ảnh mạnh nhất của câu là "đường lui").

Sửa Bước 2 trong SKILL.md:
1. Mục 3 (Vật đỏ) thay bằng: "Vật đỏ phải là hình ảnh nằm TRONG CỤM CHỮ LẬT hoặc DÒNG CUỐI (vd câu Chén 18 'Tính đường lui… chẳng được' → vật đỏ gắn với 'đường lui'). Chỉ khi cụm đó không có hình ảnh cụ thể mới lấy từ dòng khác. Không chọn được vật cụ thể → dùng chính địa hình/khí quyển (vd một đoạn đường) hoặc ghi 'Cần bổ sung'. Gán nghĩa vòng vo (laptop vì 'tính nhanh') là SAI."
2. Thêm mục "Bối cảnh nhất quán": mọi đồ vật phải thuộc cùng một bộ bối cảnh (văn phòng / phố ngõ / hiên trà / phòng trong nhà / thiên nhiên / không gian ký hiệu). Không đặt bàn làm việc giữa ngã rẽ, không đặt lịch bàn lên ghế đá.
3. Thêm vào TỰ KIỂM: "Liệt kê 3 hình ảnh mạnh nhất trong câu (danh từ/động từ cụ thể). Phương án số 1 phải dùng ít nhất 2 trong 3, và hình ảnh của chữ lật phải là thứ thay đổi ở cú lật."

Giữ SKILL.md ≤ 80 dòng. Chạy `npm run gen:skill`.
Thử lại với quote Chén 18: ghi 3 phương án mới (tối đa 12 dòng) vào tasks/REPORT-T5c.md, đầu báo cáo ghi 3 hình ảnh mạnh nhất đã liệt kê. Không commit git.
