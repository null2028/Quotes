Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon.
CÁCH LÀM VIỆC (bắt buộc): đọc AGENTS.md, docs/BAN-DO-HE-THONG.md (mục 2–4), docs/NHAT-KY-QUYET-DINH.md trước. Chỉ đọc thêm các file code nêu trong task. Hiểu cần sửa gì thì SỬA NGAY. Ngoài phạm vi: ghi 1 dòng, không làm. Không thêm hành vi ngầm. Cập nhật đúng các dòng trong BAN-DO-HE-THONG.md mà task này thay đổi. Báo xong kèm bằng chứng thật (output lệnh, ảnh cắt từ MP4 render thật).
Code liên quan: src/stage/semanticStage.ts, src/stage/trackCompiler.ts, src/stage/DeclarativeStagePlayer.tsx, src/engine/visualDnaResolver.ts, src/stage/stageValidator.ts, scripts/gen-stage-skill.mjs.

T8-DNA-a. MỘT người điều khiển camera ở cú lật + KIỂU CÚ LẬT (xử lý chồng chéo #1, #5, #6 và hành vi ngầm #6 trong bản đồ)
1. Với Gói Chén, camera quanh cú lật chỉ do MỘT cơ chế quyết định: trường mới `kieu_cu_lat` trong Gói Chén. Bỏ cue zoom 1.14 tự thêm trong semanticStage; bỏ ảnh hưởng Visual DNA Trục 4 (pivotMechanic) lên Gói Chén.
   Các giá trị (tái dùng code sẵn có của Trục 4, đổi tên theo nghĩa):
   - `day_may` (mặc định): vật đỏ đổi màu rồi đẩy máy chậm như T7c/T7d.
   - `xuat_hien`: vật đỏ không có từ đầu, hiện ra (vẽ nét + loang) ở cú lật, rồi đẩy máy nhẹ.
   - `keo_rong`: máy lùi ra từ cận cảnh, lộ bối cảnh lớn hơn làm đổi nghĩa (dùng code PULLBACK_REVEAL); mở màn bắt đầu ở cận cảnh.
   - `dung_lang`: không chuyển động máy, chỉ vật đổi đỏ (cho cảnh cần tĩnh tuyệt đối).
   Validator đo diện tích đỏ theo đúng kiểu đã chọn.
2. Bỏ hành vi ngầm "tự chuyển vật đỏ nhỏ lên tay (follow hand)". Thay bằng cảnh báo vàng gợi ý: "vật đỏ nhỏ — cân nhắc cam_boi hoặc day_may".
3. Mở màn: sửa chồng chéo #5 (drawProgress 2.2s kéo chậm đường đất) để mở màn đúng TEMPO.
4. Vòng lặp (#6): KHÔNG phai vật đỏ về mực. Thay bằng: 0.8s cuối cả vùng hình mờ dần về giấy (chữ giữ), để khớp khung đầu (trang giấy trống trước mở màn). Validator đo vật đỏ ở khung ngay trước lúc mờ.
5. Skill: thu-vien.md + SKILL Bước 2 thêm mục "Kiểu cú lật" (4 giá trị, mỗi giá trị 1 dòng khi nào dùng). Chạy npm run gen:skill.
KIỂM TRA: typecheck 0 lỗi; check-goi mọi gói mẫu OK; render MP4 thật c19-t7b với day_may mặc định và 1 bản keo_rong, cắt 3 khung (trước lật | sau lật 2s | 0.3s trước hết) → qa-artifacts-ci/T8-DNA-a.png.
Báo cáo tối đa 5 dòng vào tasks/REPORT-T8-DNA.md. Không commit git.
