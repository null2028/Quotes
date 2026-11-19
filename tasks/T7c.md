Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon. Chạy SAU T7b.
CÁCH LÀM VIỆC (bắt buộc):
- Chỉ đọc: src/stage/DeclarativeStagePlayer.tsx, src/stage/terrainSystem.ts, src/stage/stageConstants.ts (TEMPO), src/kit/WorldStage.tsx và src/kit/RelativeStage.tsx (cách engine cũ vẽ dần đường bằng evolvePath), src/stage/timeResolver.ts.
- Hiểu cần sửa gì thì SỬA NGAY. Việc ngoài phạm vi: ghi 1 dòng vào báo cáo, không làm.

T7c. NGHI THỨC MỞ MÀN (khôi phục từ các Chén cũ, chủ kênh rất thích)
Tham chiếu: videos/Chén 01 - Nghỉ.mp4 (đường dốc vẽ ra từ trái sang phải, rồi nhân vật + tảng đá hiện), Chén 05 - Trốn.mp4 (toà nhà hiện dần), Chén 12 - Vitamin Em.mp4 (đạo cụ hiện lần lượt từng món). Các Chén dựng bằng Gói Chén (DeclarativeStagePlayer) hiện đang hiện mọi thứ cùng lúc → mất chất này.

Làm thành hành vi MẶC ĐỊNH của mọi Gói Chén (kịch bản không cần ghi gì), thời lượng nằm trong TEMPO:
1. Đường đất / địa hình VẼ RA từ trái sang phải bằng evolvePath (ease-in-out), như Chén 01. Nhánh ngã rẽ/đoạn đường phụ vẽ tiếp sau đường chính.
2. Đạo cụ hiện LẦN LƯỢT theo thứ tự trái → phải (lớp nền trước, rồi lớp giữa), mỗi món: nét viền vẽ ra rồi lớp wash loang vào (hoặc mực loang + nâng nhẹ 1–2px), cách nhau một nhịp ngắn. Vật đặt trên vật khác hiện SAU vật chủ.
3. Nhân vật hiện CUỐI CÙNG (mực loang vào tại chỗ; nếu kịch bản cho nhân vật `di_vao` thì bước vào thay vì hiện).
4. Vật đỏ có `xuat_hien: "cu_lat"` KHÔNG hiện ở mở màn. Vật đỏ có mặt từ đầu thì hiện như đạo cụ thường (màu mực), chỉ đổi đỏ ở cú lật.
5. Nhịp: toàn bộ mở màn gói trong khoảng dòng chữ thứ nhất (đề xuất tổng ~2.0–2.5s, đường ~0.9s, mỗi đạo cụ ~0.4s cách nhau ~0.2s, nhân vật ~0.5s), không kéo sang dòng 2. Cảnh nhiều đồ thì rút ngắn khoảng cách, không kéo dài tổng. Nhịp chậm rãi đúng TEMPO, không nảy.
6. Vòng lặp: khung cuối khớp với khung đầu như hiện tại (giữ cơ chế loop sẵn có).
7. Validator: thời gian mở màn không tính va chạm/vùng an toàn cho vật chưa hiện; luật số chuyển động (T7a) không tính các chuyển động mở màn.
8. ĐẨY MÁY Ở CÚ LẬT (vật đỏ nhỏ đang gần như không thấy — xem qa-artifacts-ci/T7b-c19.png, chén đỏ chỉ vài pixel): sau khi vật đỏ đổi màu, máy quay đẩy vào CHẬM (theo TEMPO, ≈2.0s, ease-in-out) và hướng tâm về giữa vật đỏ và nhân vật, mức đẩy tự tính sao cho vật đỏ đạt tối thiểu MIN_RED_AREA_PX2 × 2 trên màn hình (giới hạn 1.6×). Vật đỏ đã đủ to thì đẩy nhẹ 1.1× hoặc không đẩy. Giữ mức đẩy đến hết video; vòng lặp quay về khung đầu như cơ chế loop hiện có. Validator đo diện tích đỏ ở khung cuối (sau đẩy máy). Lớp chữ KHÔNG bị đẩy theo.
KIỂM TRA: typecheck 0 lỗi; check-goi q001/w051/chen18-v2 OK. Xuất dải 8 khung trong 3 giây đầu (0.1, 0.4, 0.7, 1.0, 1.4, 1.8, 2.2, 2.8s) cho Chén 18 v2 và Q001, ghép 2 hàng → qa-artifacts-ci/T7c-mo-man.png. Thêm preview 6 khung Chén 19 phương án chén trà (gói c19-t7b) → qa-artifacts-ci/T7c-c19.png để xem đẩy máy.
Báo cáo tối đa 4 dòng vào tasks/REPORT-T7c.md. Không commit git.
