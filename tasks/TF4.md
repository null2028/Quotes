Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon. Chạy SAU TF3.
CÁCH LÀM VIỆC (bắt buộc): đọc AGENTS.md (nhất là MỤC ĐÍCH GỐC), docs/BAN-DO-HE-THONG.md. Chỉ đọc thêm file code nêu trong task. Hiểu cần sửa gì thì SỬA NGAY. Ngoài phạm vi: ghi 1 dòng, không làm. Không thêm hành vi ngầm, không thêm luật ngoài task. Cập nhật dòng tương ứng trong BAN-DO-HE-THONG.md. Báo xong kèm bằng chứng thật.
Đọc thêm: scripts/gen-stage-skill.mjs, src/stage/stageScriptSchema.ts, src/stage/stageValidator.ts (validateFreeModeStageScript), data/stage-scripts.json (SCRIPT_C19_NET_DAT_NAY_MAM), studio-ui/src/components/GeminiBundleImportModal.tsx (nút copy lỗi).

TF4. Dạy skill đạo diễn trên Gemini Web viết LÀN TỰ DO
Bối cảnh: chủ kênh đạo diễn trên Gemini Web (chỉ có file zip skill, không đọc được code), rồi dán JSON vào Studio để xem/render. Skill hiện chỉ biết Gói Chén.
1. gen:skill sinh thêm (từ code, không viết tay):
   - references/lan-tu-do.md: các trường StageScript làn tự do và giá trị hợp lệ (lấy từ stageScriptSchema.ts), khung toạ độ sân khấu (rộng/cao, vùng hình, vùng chữ cấm vẽ, đất y), cách vẽ shapes (d/fill/role/strokeScale), timeline; và danh sách máy CHẶN / CẢNH BÁO của validateFreeModeStageScript (1 dòng mỗi mục).
   - references/c19.json: Chén 19 nguyên văn làm mẫu.
2. SKILL.md (vẫn ≤ 80 dòng): Bước 3 có 2 lối — MẶC ĐỊNH làn tự do ("che_do": "tu_do", AI tự vẽ shapes/toạ độ/chuyển động theo lan-tu-do.md + c19.json, đúng 1 vật đỏ); Gói Chén là lối tắt khi chủ kênh nói "gói chén". Ràng buộc kho đạo cụ tầng A/B/C và mục "chỉ mô tả những gì Gói Chén thể hiện được" chỉ áp dụng cho lối tắt. Giữ nguyên Bước 1, Bước 2 (cú lật, vật đỏ, nhân vật, dư vị).
3. Nút "Copy lỗi cho Gemini" trong ô nhập: với kịch bản tu_do thì câu mở đầu nói đúng là kịch bản làn tự do (không gọi là Gói Chén); SKILL.md hướng dẫn sửa đúng lỗi và xuất lại toàn bộ cho cả 2 lối.
KIỂM TRA: npm run gen:skill chạy sạch, zip có 2 file mới. Đóng vai Gemini Web: CHỈ dùng nội dung trong zip, viết 1 kịch bản tu_do cho 1 câu khác Chén 19 → check-goi qua (0 lỗi chặn) và npm run preview → qa-artifacts-ci/TF4.png.
Báo cáo tối đa 4 dòng vào tasks/REPORT-TF.md (thêm cuối). Không commit git.
