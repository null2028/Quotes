Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon.
CÁCH LÀM VIỆC (bắt buộc):
- Chỉ đọc: src/stage/semanticStage.ts, src/stage/stageConstants.ts, src/stage/stageValidator.ts (phần lấy mẫu theo thời gian), src/stage/trackCompiler.ts (thời lượng/easing), scripts/gen-stage-skill.mjs (phần SKILL + goi-chen), docs/motif/BO-BOI-CANH.md.
- Hiểu cần sửa gì thì SỬA NGAY. Việc ngoài phạm vi: ghi 1 dòng vào báo cáo, không làm.

T7a. Bài học từ Chén 19 "Kỳ diệu" (SCRIPT_GOICHEN_Q096, video videos/Chén 19 - Kỳ diệu.mp4)
Chủ kênh nhận xét: nhân vật quá lớn, mất cân bằng, hành động nhanh và kỳ cục. Số liệu: Lữ khách scale 3.158 (Chén cũ ~1.18); 5 chuyển động, mỗi cái 0.6–0.9s; phản ứng ở pivot+0.2s TRƯỚC khi chén đổi đỏ ở pivot+0.4s; dòng 2 gục sâu gập người xuống bàn; có mặt trời + lá rơi trang trí.

1. CỠ NHÂN VẬT CỐ ĐỊNH (thay cho tự phóng theo cảnh):
   - Lữ khách luôn MỘT cỡ chuẩn ở mọi Chén: chiều cao đứng = LU_KHACH_HEIGHT_RATIO (đề xuất 0.28) chiều cao vùng hình; ngồi thì thấp theo tư thế. Đạo cụ theo tỷ lệ thật với Lữ khách.
   - Tự căn khung chỉ còn: dịch ngang để căn giữa cụm cảnh, và THU NHỎ (không bao giờ phóng to vượt cỡ chuẩn) khi cảnh rộng quá vùng hình, tối thiểu 0.75 cỡ chuẩn.
   - Bỏ AUTO_FRAME_TARGET_WIDTH_RATIO/AUTO_FRAME_MAX_HEIGHT_RATIO nếu không còn dùng.
2. NHỊP TRÀ NGUỘI — mọi chuyển động chậm rãi (đặc trưng của kênh, áp cho MỌI Chén, nằm trong engine, kịch bản không cần ghi):
   - Gom thành bộ hằng số TEMPO trong stageConstants.ts (một chỗ duy nhất để chỉnh nhịp cả kênh).
   - Thời lượng tối thiểu: nghiêng/gục/thẳng lưng/ngả lưng ≥ 2.0s; quay đầu/nhìn theo ≥ 1.2s; khựng/giật mình ≥ 0.6s nhưng biên độ nhỏ; đi bộ tốc độ chậm (bước dài, nhịp đều, không vung tay); vật đổi đỏ chuyển dần ≥ 0.8s; khói/vật rơi theo nhịp chậm.
   - Easing chậm hai đầu (ease-in-out sine/cubic), không có chuyển động tuyến tính hay bật nảy.
   - Sau mỗi chuyển động có KHOẢNG LẶNG giữ nguyên tư thế ≥ 1.0s trước chuyển động kế tiếp.
   - Tĩnh nhiều hơn động: tổng thời gian nhân vật chuyển động ≤ 40% thời lượng video; cả Chén tối đa 4 chuyển động lớn; mỗi dòng chữ tối đa 1; sau cú lật tối đa 2.
   - Lúc đứng yên vẫn "thở": vi động rất nhẹ (nhịp thở, khói trà, vạt khăn) để cảnh không chết.
   - `thoi_luong` trong Gói Chén nhỏ hơn mức tối thiểu → tự nâng lên + cảnh báo vàng. Vượt số chuyển động → lỗi đỏ, gợi ý bỏ bớt.
   - Mức "guc" khi ngồi: giảm biên độ (cúi đầu, vai chùng), không gập người xuống mặt bàn. Giữ dáng gục sâu thành mức riêng `guc_sau`.
   - SKILL Bước 2 thêm 1 dòng: "Nhịp Trà Nguội: Lữ khách làm mọi thứ chậm rãi như người đang uống trà; ít cử chỉ, mỗi dòng tối đa 1 cử chỉ nhỏ, phần lớn thời gian là lặng."
3. VALIDATOR "CHỮ DẪN, HÌNH THEO": chặn mọi chuyển động lớn của nhân vật bắt đầu trước (thời điểm vật đỏ đổi màu + 0.0s) trong cửa sổ cú lật; phản ứng ở cú lật phải bắt đầu ≥ 0.4s sau khi chữ lật đổi đỏ. Hiện validator chưa kiểm luật này (Chén 19 lọt).
4. KHÍ QUYỂN MẶC ĐỊNH TẮT (ở Chén 19 chính skill đã chọn hollow_sun + leaves cho 'nắng sớm'; mặt trời rỗng hiện thành một vòng tròn lạ, lá gần như không thấy): bộ bối cảnh không tự thêm mặt trời/lá/gió; chỉ có khi Gói Chén khai báo và skill phải nêu nó mang nghĩa gì. Cập nhật BO-BOI-CANH.md, SKILL (Bước 2 mục đồ trên sân khấu: "kể cả khí quyển"), goi-chen.md (bỏ thoi_luong khỏi ví dụ, ghi rõ engine tự tính).
5. Nhỏ: chiec_goi (src/stage/families/mat_phang.tsx) bản thường có nét viền đen dày hơn các đạo cụ khác và đặt dưới đất trông như hòn đá → đưa nét về chuẩn mảnh như các preset khác, dáng gối dẹt hơn có 2 góc bo hơi nhọn. Rồi chuyển chiec_goi sang `duyet`.
6. `npm run gen:skill` (để 4 món mat_phang vừa duyệt lên Tầng A).
6. Ghi vào goi-chen.md và thu-vien.md: `guc` = cúi đầu vai chùng (thờ ơ, mệt nhẹ); `guc_sau` = gục xuống bàn (kiệt sức). Ở Chén 19 kịch bản ghi 'guc nhẹ vẻ thờ ơ' nhưng engine vẽ gục sâu.
KIỂM TRA: typecheck 0 lỗi; check-goi q001/w051/chen18-v2 OK. Render preview 6 khung (qua luồng thật) cho Chén 19 (Q096, dựng lại Gói từ stage-scripts nếu cần), Q001 và Chén 18 v2, ghép 3 hàng vào qa-artifacts-ci/T7a.png — Lữ khách phải CÙNG CỠ ở cả 3 Chén.
Báo cáo tối đa 5 dòng vào tasks/REPORT-T7a.md. Không commit git.
