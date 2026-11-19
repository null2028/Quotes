Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon.
CÁCH LÀM VIỆC (bắt buộc):
- Chỉ đọc: src/stage/DeclarativeStagePlayer.tsx (camera/đẩy máy, vẽ đạo cụ có placedOn), src/stage/stageValidator.ts, src/stage/trackCompiler.ts, docs/goi-mau/q001.json, git diff a599d34 -- src/stage (thay đổi của T7d).
- Hiểu cần sửa gì thì SỬA NGAY. Việc ngoài phạm vi: ghi 1 dòng vào báo cáo, không làm.

T7e. Hai lỗi sau T7d (xem qa-artifacts-ci/T7d-mp4.png, khung 13s)
1. CHÉN TRÀ LƠ LỬNG khi đẩy máy: ở khung đã đẩy 2.2×, chén đỏ nằm giữa không trung, cách mặt bàn trà rõ rệt (ở khung cú lật chưa đẩy thì chén nằm đúng trên bàn). Nghi vấn: vị trí vật `tren`/placedOn hoặc khói/đổi đỏ đang tính trong hệ toạ độ khác với camera transform (bị scale hai lần hoặc không scale). Sửa để MỌI thứ trong vùng hình (đất, đạo cụ, vật đặt trên vật, nhân vật, khói) cùng chung một camera transform. Validator: kiểm tra "vật tren phải chạm điểm neo" ở cả khung cuối sau đẩy máy.
2. Đường đất biến mất khi đẩy máy (khung 13s không còn nét đất, chân bàn lơ lửng): đất phải kéo dài ra mép vùng hình ở mọi mức zoom.
3. q001 hết đạt sau T7c/T7d (check-goi báo hoa_don đè laptop). Trước T7c gói này OK → tìm thay đổi gây ra (mở màn/đẩy máy/ngưỡng) và sửa engine, KHÔNG sửa gói q001.
KIỂM TRA: typecheck 0 lỗi; check-goi q001/w051/chen18-v2/c19-t7b đều OK; xuất lại qa-artifacts-ci/T7d-mp4.png (cắt từ MP4 thật: cú lật | 13s) cho c19-t7b và thêm 1 hàng tương tự cho q001.
Báo cáo tối đa 4 dòng vào tasks/REPORT-T7d.md (thêm cuối). Không commit git.
