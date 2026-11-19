Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon. Chạy SAU T8-DNA-a.
CÁCH LÀM VIỆC (bắt buộc): đọc AGENTS.md, docs/BAN-DO-HE-THONG.md (mục 2–4), docs/NHAT-KY-QUYET-DINH.md trước. Chỉ đọc thêm các file code nêu trong task. Hiểu cần sửa gì thì SỬA NGAY. Ngoài phạm vi: ghi 1 dòng, không làm. Không thêm hành vi ngầm. Cập nhật đúng các dòng trong BAN-DO-HE-THONG.md mà task này thay đổi. Báo xong kèm bằng chứng thật (output lệnh, ảnh cắt từ MP4 render thật).
Code liên quan: src/engine/visualDnaResolver.ts, src/engine/timelineSync.ts, src/automation/geminiBundleBridge.ts (convertGoiChenToBundle), src/stage/stageValidator.ts, scripts/check-goi.mjs, scripts/stage-preview.mjs, studio-ui (phần slider stageTuning).

T8-DNA-b. Visual DNA chỉ còn làm việc "chống trùng", không đổi nghĩa (chồng chéo #2, #3, #4, #7, #8)
Nguyên tắc: với Gói Chén, những gì mang NGHĨA (bố cục, khung, ánh sáng, camera) do Gói Chén quyết; seed ngẫu nhiên chỉ được đổi những chi tiết KHÔNG mang nghĩa để chống trùng (dịch nhẹ chân trời, bụi giấy, tâm vignette, thời lượng).
1. Bố cục (#2): Gói Chén mặc định CLASSIC_TOP_STAGE. Trường tuỳ chọn `bo_cuc`: co_dien | chan_may | khung_cua (khung_cua = vòm "Cửa sổ Á Đông", chỉ khi skill chọn có chủ đích). Seed không được tự đổi bố cục của Gói Chén. Bỏ hành vi tự hạ ASYMMETRIC_THIRD→WINDOW_FRAME cho Gói Chén.
2. Ánh sáng (#3): Gói Chén mặc định không gobo; trường tuỳ chọn `anh_sang` (bong_la, nan_cua, den_long, suong_hien) — skill phải nêu lý do như khí quyển.
3. Chân trời (#4): validator và check-goi nhận cùng visualDNA với render (cùng seed) để toạ độ khớp.
4. Thời lượng (#7): check-goi và stage-preview tính thời lượng đúng như Studio (AUTO_SEED theo id), in ra thời lượng đã dùng.
5. Slider (#8): Chén từ Gói Chén khoá slider scale/offset (hiện chú thích "cỡ do engine quyết"); slider nét giữ được.
6. Skill: thu-vien.md + goi-chen.md thêm bo_cuc, anh_sang. npm run gen:skill.
KIỂM TRA: typecheck 0 lỗi; check-goi mọi gói mẫu OK và in thời lượng; cùng 1 Gói Chén nhập 2 lần với id khác nhau → bố cục giống nhau, chỉ khác chi tiết chống trùng (ảnh 2 khung cạnh nhau → qa-artifacts-ci/T8-DNA-b.png).
Báo cáo tối đa 5 dòng vào tasks/REPORT-T8-DNA.md (thêm cuối). Không commit git.
