Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon.
CÁCH LÀM VIỆC (bắt buộc): đọc AGENTS.md (nhất là MỤC ĐÍCH GỐC), docs/BAN-DO-HE-THONG.md. Chỉ đọc thêm file code nêu trong task. Hiểu cần sửa gì thì SỬA NGAY. Ngoài phạm vi: ghi 1 dòng, không làm. Không thêm hành vi ngầm. Cập nhật dòng tương ứng trong BAN-DO-HE-THONG.md. Báo xong kèm bằng chứng thật.
Đọc thêm: src/engine/timelineSync.ts (computeTimelineSync, stripInlineMarkdown, auditVietnameseSyllables), src/components/AdaptiveTypography.tsx, studio-ui/src/components/StoryDirectorDesk.tsx (ô biên tập + thanh cỡ chữ), scripts/gen-stage-skill.mjs.

TF6. Nhịp hiện chữ do chủ kênh đặt + sửa thanh cỡ chữ

1. Hai ký hiệu nhịp trong ô biên tập quote (cùng kiểu *nghiêng* **đậm**):
   - " / " giữa dòng = TÁCH NHỊP: phần sau hiện ở nhịp kế tiếp, vẫn cùng dòng hiển thị.
   - "+" đầu dòng = NỐI NHỊP: dòng này hiện cùng lúc với dòng trên.
   Engine chia đều thời gian hiện chữ theo NHỊP thay vì theo dòng (cùng cửa sổ thời gian như hiện tại). Ký hiệu không bao giờ hiện trên video, ảnh bìa, caption, tên file.
   Không có ký hiệu → kết quả y hệt hiện nay (mọi Chén cũ không đổi khung nào).
   Mốc line_N trong kịch bản = lúc dòng hiển thị N bắt đầu hiện (nhịp đầu của dòng). pivot vẫn tính trong nhịp chứa pivotWord.
   Ô biên tập hiện thêm "N nhịp" cạnh "N dòng". Ký hiệu được lưu nguyên trong segments.
2. Skill: gen:skill thêm 2–3 dòng mô tả 2 ký hiệu vào SKILL.md (Bước 1, mục nhịp đọc) và lan-tu-do.md, để đạo diễn đề xuất nhịp hiện chữ.
3. Thanh kéo cỡ chữ: chủ kênh báo "kéo cứ nhảy linh tinh không như thao tác". Tìm đúng nguyên nhân (nghi: nút đặt lại 42px hiện/ẩn làm xô lệch vị trí thanh khi đang kéo; hoặc giá trị bị ghi đè lại từ props/lưu server khi đang kéo). Sửa để kéo mượt, đúng tay. Kèm: bước 1px (38–48px) thay vì 0.02x; nút đặt lại ghi rõ "↺ 42px" và luôn chiếm chỗ (không làm xô thanh).
KIỂM TRA: typecheck + studio-ui tsc 0 lỗi. Preview Chén 20 với
   Va vấp đủ rồi, thôi chứng minh,
   +Đàn ông đâu mãi phải gồng mình.
   Những ngày tự biết vai đã mỏi.
   Dám dừng lại, / cũng là bản lĩnh.
→ in bảng mốc từng nhịp (giây) + ảnh khung giữa nhịp 3 và 4 (chỉ thấy "Dám dừng lại,") → qa-artifacts-ci/TF6.png. Chén 19 không ký hiệu: mốc dòng trước/sau giống hệt. Ghi 1 câu nguyên nhân thanh cỡ chữ nhảy.
Báo cáo tối đa 4 dòng vào tasks/REPORT-TF.md (thêm cuối). Không commit git.
