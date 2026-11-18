Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Chỉ sửa skill, không sửa engine.

T5b. Đưa nguyên tắc ĐẠO DIỄN vào skill (bài học từ Chén 18 "Đường lui": gói hợp lệ nhưng hình vô nghĩa — Lữ khách cầm phong bì đi tới ghế băng, phong bì đổi đỏ; câu chữ nói về "chạm mắt em" và "đường lui" nhưng hình không có "em", không có "đường lui").

Thay toàn bộ phần "Bước 2" trong .agents/skills/dao-dien-tra-nguoi/SKILL.md (giữ SKILL.md ≤ 80 dòng) bằng:

NGUYÊN TẮC: hình không kể lại chữ, hình làm cú lật mạnh hơn. Chữ là chính.
Mỗi phương án (đưa 3, xếp mạnh → yếu) ghi đủ, mỗi mục 1 dòng:
1. Bản lề: "Người xem tưởng A → câu lật thành B." Không viết được thì hỏi lại chủ kênh.
2. Trước cú lật: hình dựng thế giới của A (bối cảnh quen, Lữ khách sống bình thường), KHÔNG lộ B.
3. Vật đỏ: MỘT vật đời thường chứa B, lấy từ CHỮ trong câu (hoặc hình ảnh trực tiếp của chữ lật). Cấm chọn vật chỉ vì thư viện đang có. Ghi rõ: "vật đỏ X vì chữ '...' ".
4. Nhân vật: câu ngôi thứ nhất → Lữ khách là "ta"; câu có người thứ hai ("em", "anh", "người ấy") → PHẢI có nhân vật thứ hai trên sân khấu. Phản ứng nhỏ, thật, hơi vụng; ghi theo từng dòng.
5. Đồ trên sân khấu: mọi đạo cụ phải được dùng hoặc mang nghĩa; đồ chỉ để trang trí thì bỏ (tối đa 3 vật).
6. Dư vị: chi tiết nhỏ ở khung cuối khiến muốn xem lại.
TỰ KIỂM trước khi đưa: bỏ hình đi chữ vẫn đứng được; có hình thì cú lật mạnh hơn; hình không lộ đáp án trước chữ lật; đọc lại câu, từng hình ảnh then chốt trong câu (người, vật, hành động) có mặt trên sân khấu chưa.
Nếu thư viện thiếu thứ phương án mạnh nhất cần (vd nhân vật thứ hai, động từ quay lại) → vẫn đưa phương án đó lên đầu, ghi "Cần bổ sung: ...", và đưa phương án dựng được ngay ở vị trí 2.

Chạy `npm run gen:skill`. Thử lại bằng chính quote Chén 18 (data/cups/quote-018.json, giữ nguyên câu): viết 3 phương án theo nguyên tắc mới vào tasks/REPORT-T5b.md (tối đa 15 dòng). Không commit git.
