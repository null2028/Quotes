Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon. Chạy SAU T-MAP.
CÁCH LÀM VIỆC (bắt buộc): chỉ đọc src/stage/terrainSystem.ts, src/stage/semanticStage.ts (phần boi_canh.bo), src/stage/stageConstants.ts, docs/motif/BO-BOI-CANH.md. Hiểu cần sửa gì thì SỬA NGAY. Ngoài phạm vi: ghi 1 dòng, không làm. Báo xong kèm bằng chứng thật.

T8-BOI-CANH-b. Chỉnh sau duyệt tờ qa-artifacts-ci/BO-BOI-CANH.png
1. NGÃ RẼ chưa đọc ra: nhánh rẽ hiện là một đường cong vút lên mép trên khung, trông như dốc đồi. Nhìn ngang thì khó vẽ hai lối tách, nên đổi cách thể hiện: nhánh rẽ là một đường thấp, gần mặt đất, tách ra một góc nhỏ (≤ 12°) và mờ dần về xa; TẠI điểm tách có 1 CỘT BIỂN CHỈ ĐƯỜNG hai mũi tên (nét mảnh, lớp nền) — đây là dấu hiệu "ngã rẽ" ai cũng hiểu. Đoạn đường làm vật đỏ (doan_duong) vẫn dùng được trên nhánh.
2. van_phong: hai vạch dọc cao hai bên trông vô nghĩa → bỏ; văn phòng chỉ còn vạch chân tường (một nét ngang thấp phía sau) + cửa sổ treo cao.
3. Ngưỡng vật đỏ: chén trà ở mức đẩy tối đa 2.2× chỉ đạt ~2110 px² < 2400. Hạ MIN_RED_AREA_PX2 xuống 2000 (đủ nhìn rõ trên điện thoại, như ảnh T7d-mp4.png đã cho thấy).
4. Ảnh ô ngã rẽ có một vệt sáng chéo lớn (gobo ngẫu nhiên từ Visual DNA). Với Gói Chén có `boi_canh.bo`: gobo mặc định "Phẳng tịnh" (sẽ xử lý đầy đủ ở task T8-DNA).
KIỂM TRA: typecheck 0 lỗi; check-goi các gói mẫu + c19-t7b đều OK; xuất lại 2 ô ngã rẽ + văn phòng → qa-artifacts-ci/BO-BOI-CANH-b.png qua luồng thật.
Báo cáo tối đa 3 dòng vào tasks/REPORT-BOI-CANH.md (thêm cuối). Cập nhật dòng tương ứng trong docs/BAN-DO-HE-THONG.md nếu đã có. Không commit git.
