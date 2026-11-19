Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model gợi ý: Neon.
CÁCH LÀM VIỆC (bắt buộc):
- Chỉ đọc: scripts/gen-stage-skill.mjs, src/stage/propCatalog.tsx, src/stage/families/*, src/stage/semanticStage.ts (danh sách động từ, địa hình, khí quyển), docs/motif/HO-DAO-CU.md, docs/motif/BO-BOI-CANH.md, studio-ui/src/components/GeminiBundleImportModal.tsx (phần hiển thị cảnh báo).
- Hiểu cần sửa gì thì SỬA NGAY. Việc ngoài phạm vi: ghi 1 dòng vào báo cáo, không làm.

BƯỚC 0 (nhỏ, làm trước): tự căn khung đang chạm trần chiều cao (Q001 cảnh chiếm ~82% chiều cao vùng hình, Lữ khách thành khối đen lớn). Thêm hằng số AUTO_FRAME_MAX_HEIGHT_RATIO = 0.6 trong stageConstants.ts: khung bao cảnh không cao quá 60% chiều cao vùng hình (vẫn giữ sàn Lữ khách ≥30%). Render lại qa-artifacts-ci/T6b-q001.png.

T5d. Skill dùng TOÀN BỘ kho để lên ý tưởng rộng hơn
Hiện thu-vien.md chỉ liệt kê đạo cụ `duyet`, nên Gemini web chỉ nghĩ trong ~25 món. Chủ kênh muốn skill thấy cả kho để ý tưởng rộng hơn, nhưng vẫn biết món nào dựng được ngay.

1. thu-vien.md (sinh tự động bởi gen-stage-skill.mjs) chia 3 tầng, mỗi món 1 dòng ngắn: mã · tên Việt · bối cảnh hợp · điểm neo · làm vật đỏ được không:
   - TẦNG A — Dùng ngay: mọi đạo cụ `duyet` (gồm alias như chen_tra, vo_ruou).
   - TẦNG B — Có sẵn, chưa chuẩn hoá nét: mọi đạo cụ `nhap` đang có trong propCatalog (vd umbrella, bench, street_lamp, lantern, kite, small_boat, bare_tree, sprout, campfire, paper_plane, warm_house, city_skyline, hearts…). Dùng được trong Gói Chén, tool sẽ cảnh báo vàng.
   - TẦNG C — Đang lên kế hoạch (chỉ để lên ý tưởng, KHÔNG được xuất trong JSON): các preset trong HO-DAO-CU.md chưa có code, nhóm theo 12 họ. Nếu phương án cần món tầng C → ghi "Cần bổ sung: <mã preset>".
   Thêm vào thu-vien.md: danh sách 9 bộ bối cảnh (từ BO-BOI-CANH.md: nền + đạo cụ mặc định), địa hình (gồm doan_duong/duong_lui), khí quyển, nhân vật (Lữ khách, nguoi_b), toàn bộ động từ nhân vật/đạo cụ/địa hình.
2. SKILL.md Bước 2: thêm 1 dòng: "Lên ý tưởng trên cả 3 tầng. Ưu tiên tầng A; tầng B được dùng nếu đúng nghĩa; tầng C chỉ được đưa vào phương án kèm 'Cần bổ sung' và phải có phương án thay thế dựng được ngay." Giữ SKILL.md ≤ 80 dòng.
3. Ô nhập tool web: Gói Chén dùng đạo cụ `nhap` → vẫn cho nhập, hiện cảnh báo vàng "Dùng đạo cụ chưa chuẩn hoá nét: <mã>". Dùng mã không tồn tại (kể cả preset tầng C) → vẫn là lỗi đỏ như cũ, kèm gợi ý.
4. Chạy `npm run gen:skill`, typecheck 0 lỗi, check-goi q001/w051/chen18-v2 OK.
Báo cáo tối đa 4 dòng vào tasks/REPORT-T5d.md: số món mỗi tầng, số dòng thu-vien.md và SKILL.md, đường dẫn zip. Không commit git.
