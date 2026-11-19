Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon.
CÁCH LÀM VIỆC (bắt buộc): đọc AGENTS.md (nhất là MỤC ĐÍCH GỐC), docs/BAN-DO-HE-THONG.md. Chỉ đọc thêm file nêu trong task. Hiểu cần sửa gì thì SỬA NGAY. Ngoài phạm vi: ghi 1 dòng, không làm. Không thêm hành vi ngầm, không thêm luật ngoài task. Cập nhật dòng tương ứng trong BAN-DO-HE-THONG.md. Báo xong kèm bằng chứng thật.
Đọc thêm: scripts/gen-stage-skill.mjs, toàn bộ .agents/skills/sang-tac-tra-nguoi/ (SKILL.md, references/, scripts/kiem_cau.py), docs/NHAT-KY-QUYET-DINH.md.

TS1. Cài skill sáng tác câu chữ `sang-tac-tra-nguoi` vào luồng Gemini Web
Bối cảnh: skill `.agents/skills/sang-tac-tra-nguoi/` đã được viết tay (Claude, 19/11) từ dữ liệu `data/airtable-cache.json`. Chủ kênh dùng nó trên Gemini Web để sinh câu chữ TRƯỚC bước đạo diễn. Gemini Web chỉ đọc file zip, không đọc repo. KHÔNG sửa nội dung SKILL.md, references/giong-tra-nguoi.md, loi-mon.md, motif.md, scripts/kiem_cau.py.
1. Mở rộng `scripts/gen-stage-skill.mjs` (không dựng script thứ hai): sau khi sinh skill đạo diễn,
   - đóng `.agents/skills/sang-tac-tra-nguoi/sang-tac-tra-nguoi.zip` gồm: SKILL.md, references/giong-tra-nguoi.md, references/loi-mon.md, references/motif.md, scripts/kiem_cau.py. Không đưa `__pycache__` hay file khác.
   - Dòng log cuối in thêm kích thước zip sáng tác.
2. AGENTS.md:
   - Mục 1 "Luồng chính hiện hành": thêm bước 0 trước bước Đạo diễn — "Sáng tác câu chữ trên Gemini Web bằng skill `sang-tac-tra-nguoi` (`sang-tac-tra-nguoi.zip`): Gemini sinh 12 bản thô → lọc bằng `kiem_cau.py` + một lượt biên tập riêng → chủ kênh chốt → câu chốt giữ nguyên văn sang skill đạo diễn".
   - Mục 2, dòng DNA ngôn từ: thay "14–28 âm tiết (trần 40)" bằng "độ dài theo 4 dải S 6–13 · M 14–28 · L 29–42 · XL 43–58 âm tiết; trần 48 cho tự sáng tác, 58 cho trích dẫn có tác giả; thả thính/hài mặc định dải M; thời lượng video do engine tự tính". Giữ nguyên phần tỷ trọng và các câu còn lại.
3. docs/BAN-DO-HE-THONG.md: thêm 1 dòng mới cho "Skill sáng tác câu chữ" (file: `.agents/skills/sang-tac-tra-nguoi/`, `scripts/kiem_cau.py`, phần zip trong `gen-stage-skill.mjs`), theo đúng định dạng cột của bảng.
4. docs/NHAT-KY-QUYET-DINH.md: thêm 1 dòng 2026-11-19 — "Thời lượng co giãn theo độ dài câu, trần theo khung chữ (48/58 âm tiết) thay cho mốc 14–28; thêm skill sáng tác `sang-tac-tra-nguoi` (Gemini sinh, máy + biên tập lọc, chủ kênh chốt)".
NGOÀI PHẠM VI (chỉ ghi ĐỀ XUẤT, không làm):
- `goiChenParser.ts` khoá `cau` 2–4 phần tử → dải L/XL (thơ 5–6 câu) phải gộp câu.
- SKILL.md đạo diễn (sinh trong `gen-stage-skill.mjs`) chưa có luật nhịp cho dải L/XL (biến chuyển phụ giữa bài).
KIỂM TRA: `npm run gen:skill` chạy sạch; in danh sách file trong CẢ HAI zip (`python3 -m zipfile -l <zip>`); `python3 .agents/skills/sang-tac-tra-nguoi/scripts/kiem_cau.py --cau "Tháng năm tất tả chưa từng dừng/Tiền chưa đầy túi đã đau lưng/Lắm hôm mệt quá toan buông xuống/Nhìn tờ hóa đơn… lại khỏe tưng!" --lat "lại khỏe tưng"` → exit 0, có dòng "dải M".
Báo cáo tối đa 4 dòng vào tasks/REPORT-TF.md (thêm cuối). Không commit git.
