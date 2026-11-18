Bạn là Gemini trong Antigravity, project Trà Nguội. Chủ kênh sẽ ghi kèm TÊN HỌ cần làm (vd "làm họ do_chua"). Làm ĐÚNG một họ đó rồi dừng.
CÁCH LÀM VIỆC (bắt buộc):
- Chỉ đọc các file được nêu trong task. Không rà soát code ngoài phạm vi, không phòng ngừa trường hợp task không nhắc tới.
- Đọc mỗi file một lần, đọc nhiều file cùng lúc nếu được. Không đọc lại thứ đã đọc.
- Hiểu cần sửa gì thì SỬA NGAY. Sau mỗi bước lớn tự hỏi: "Đủ thông tin làm tiếp chưa?" — đủ thì làm.
- Phát hiện việc ngoài phạm vi: ghi 1 dòng vào báo cáo, KHÔNG làm.

Đọc trước: docs/KE-HOACH.md, docs/motif/HO-DAO-CU.md (phần của họ này), docs/GOI-CHEN.md, các luật nét ở src/stage/stageConstants.ts.

Làm MỘT họ đạo cụ:
1. Viết 1 hàm dựng có tham số cho họ (file riêng trong src/stage/families/<ten_ho>.tsx), lắp từ hình cơ bản dùng chung. Cấm đường SVG tự do; cần nét cong riêng thì viết thành hàm có tham số.
2. Phong cách bắt buộc theo luật T2: nét mảnh như 13 đạo cụ đã duyệt, mỗi vật tối đa 1–2 nét chi tiết bên trong, không mảng tô đặc (chỉ lớp wash nhạt), vật đỏ = tô đỏ nhạt + viền đỏ cùng dáng. Nhìn ngang, không phối cảnh.
3. Tạo các preset trong HO-DAO-CU.md cho họ này, đăng ký vào propCatalog với trạng thái `nhap`: đủ kich_thuoc_that (cm), hộp bao khớp hình, điểm neo, lớp, loại neo, canBeRed, ghi chú 3 đặc điểm nhận diện.
   - Preset nào đã có sẵn và đã `duyet` trong propCatalog: KHÔNG vẽ lại, chỉ gắn vào họ bằng alias (tên mới trỏ về mã cũ, mã cũ vẫn dùng được).
4. Validator, typecheck 0 lỗi. Chạy `npm run gen:skill` để thư viện skill có preset mới (preset `nhap` ghi rõ là chưa duyệt, skill chưa được dùng).
5. Tờ duyệt: chạy `npm run ho:duyet -- <ten_ho>` (dựng qua đúng luồng thật Gói Chén → validator → render, KHÔNG đặt toạ độ tay): 1 cảnh khung 1080×1920 cắt vùng hình, đặt Lữ khách + toàn bộ preset của họ cạnh nhau ở tỷ lệ thật (vật nhỏ đặt trên bàn đã duyệt), thêm 1 hàng phóng 2× cùng vùng, và bản đỏ của các preset làm được vật đỏ. Lưu qa-artifacts-ci/HO-<ten_ho>.png.

Báo cáo tối đa 5 dòng vào tasks/REPORT-HO-<ten_ho>.md: danh sách preset (mới / alias), số quote họ này phủ, đường dẫn ảnh, điều gì cần chủ kênh quyết. Không commit git. DỪNG chờ chủ kênh duyệt.
