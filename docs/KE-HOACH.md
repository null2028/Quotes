# KẾ HOẠCH: Ổn định tool Trà Nguội

MỤC TIÊU: luồng làm việc giữ như cũ (Gemini web dùng skill → JSON → dán vào tool web → xem trước → chỉnh → render), nhưng bên dưới chạy hệ mới: không toạ độ tay, không tự vẽ đồ vật, validator chặn lỗi.

RÀNG BUỘC CHUNG:
- Được sửa mọi phần code: src/, server/, studio-ui/, skill, scripts.
- Nhân vật Lữ khách và quy luật nét giữ như engine cũ (commit 7c1fe76). Giữ toàn bộ khả năng mới đã làm.
- Không vẽ nhân vật mới, không thêm hiệu ứng mới. Ý tưởng mới ghi vào docs/TON-DONG.md.
- Ảnh kiểm tra/so sánh PHẢI dựng qua đúng luồng thật (Gói Chén → biên dịch ngữ nghĩa → validator → render). Cấm đặt toạ độ tay, kể cả trong script thử nghiệm.
- Mỗi task: làm xong → báo cáo tối đa 5 dòng → DỪNG chờ chủ kênh.

TASK:
- [x] T0. Cất giữ: commit toàn bộ code 2 ngày qua lên nhánh `feat/semantic-stage` (12ac239).
- [x] T1. Nhân vật và nét về như cũ. CloakedTraveler hoàn ngoại hình như 7c1fe76, GIỮ khả năng mới (nhin_theo, gục, ngồi vào bàn nhìn ngang). Gom độ dày nét, màu mực, filter loang, độ trong suốt của engine cũ thành hằng số trong stageConstants.ts. Tự căn khung không làm nét dày lên.
- [x] T2. Đạo cụ về phong cách cũ: 13 đạo cụ đã duyệt chỉnh nét và kiểu tô theo hằng số T1, giữ nguyên dáng, tỷ lệ, hộp bao, điểm neo.
- [x] T3. Định dạng Gói Chén: câu chữ (tieu_de, cau[], cu_lat) + cảnh ngữ nghĩa, không toạ độ/shapes. Viết docs/GOI-CHEN.md kèm ví dụ Q001.
- [ ] T4. Ô nhập trên tool web nhận Gói Chén → biên dịch → validator → xem trước. Lỗi hiện từng dòng + nút "Copy lỗi cho Gemini". JSON cũ vẫn mở được kèm cảnh báo.
- [ ] T5. Skill khớp tool: xuất đúng Gói Chén, thư viện sinh từ code, một lệnh tạo zip. Skill không bao giờ vẽ đồ vật.
- [ ] T6. Bộ động từ: T6a liệt kê có/thiếu → chủ kênh chọn; T6b làm tối đa 5 động từ mỗi lượt.
- [ ] T7. Chạy thật 3 Chén mới, sửa lỗi lọt.

SAU KẾ HOẠCH (chưa làm): nhân vật mới, hiệu ứng nét tự vẽ và rung tự nhiên, mở rộng thư viện 30 đạo cụ.

NGHIỆM THU CHỦ KÊNH: T1 (nhân vật đúng Lữ khách cũ), T2 (đạo cụ cạnh Chén 16 không lệch tông), T4 (dán thử A/B/C trên tool web).
