Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model gợi ý: Hydrogen.
CÁCH LÀM VIỆC (bắt buộc):
- Chỉ đọc: src/stage/stageConstants.ts, src/stage/semanticStage.ts (phần tự căn khung), chỗ vẽ bản đỏ (altShapes / accent) của đạo cụ trong src/stage/propCatalog.tsx và src/stage/families/.
- Hiểu cần sửa gì thì SỬA NGAY. Việc ngoài phạm vi: ghi 1 dòng vào báo cáo, không làm.

T6c. Hai chỉnh nhỏ sau khi xem preview T6b
1. Tự căn khung đang để AUTO_FRAME_TARGET_WIDTH_RATIO = 0.72 (chủ kênh duyệt 0.58). Ở Q001 Lữ khách thành một khối đen rất lớn, lấn chữ. Đưa về 0.58; GIỮ ràng buộc Lữ khách ≥ 30% chiều cao vùng hình làm mức sàn.
2. Vật đỏ ở cú lật đang tô đỏ quá nhạt (hoá đơn Q001 gần như hồng), trên điện thoại khó thấy. Chỉ riêng trạng thái đỏ của vật cú lật: tô đỏ đậm hơn (độ phủ khoảng 0.7) + viền đỏ; bản thường của đạo cụ giữ nguyên nhẹ như hiện tại. Gom thành hằng số RED_PIVOT_FILL_OPACITY trong stageConstants.ts.
Kiểm tra: typecheck 0 lỗi; render lại preview Chén 18 v2 (qa-artifacts-ci/T6-chen18.png) và Q001 (qa-artifacts-ci/T6b-q001.png).
Báo cáo tối đa 2 dòng vào tasks/REPORT-T6.md (thêm cuối). Không commit git.
