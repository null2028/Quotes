Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model gợi ý: Hydrogen.
CÁCH LÀM VIỆC (bắt buộc):
- Chỉ đọc: src/stage/semanticStage.ts (phần tự căn khung/autoFit), src/stage/DeclarativeStagePlayer.tsx (phần camera), src/components/AdaptiveTypography.tsx, src/engine/timelineSync.ts (phần tách pivotWord).
- Hiểu cần sửa gì thì SỬA NGAY. Việc ngoài phạm vi: ghi 1 dòng vào báo cáo, không làm.

T6b. Hai lỗi lộ ra ở Chén 18 v2 (qa-artifacts-ci/T6-chen18.png)
1. Nhân vật quá nhỏ: khung bao đang tính cả con đường dài nên cảnh bị thu nhỏ, cái khựng/quay đầu/nhìn nhau không đọc được trên điện thoại.
   Sửa tự căn khung: khung bao chỉ tính NHÂN VẬT + ĐẠO CỤ + VẬT ĐỎ (không tính địa hình, đường, khí quyển; địa hình tự kéo dài ra mép khung). Thêm ràng buộc: Lữ khách cao tối thiểu 30% chiều cao vùng hình. Vẫn chừa lề trên.
2. Mất dấu cách sau dấu "…": câu gốc "Tính đường lui... chẳng được." đang hiện thành "lui...chẳng được" (Q001 cũng bị: "hóa đơn...lại khỏe tưng"). Lỗi ở chỗ tách cụm chữ lật. Sửa để giữ nguyên khoảng trắng của câu gốc.
Kiểm tra: typecheck 0 lỗi; `node scripts/check-goi.mjs` cho q001, w051, chen18-v2 đều OK; render lại preview 6 khung Chén 18 v2 (cùng lệnh đã dùng ở T6) ra qa-artifacts-ci/T6-chen18.png và Q001 ra qa-artifacts-ci/T6b-q001.png.
Báo cáo tối đa 3 dòng vào tasks/REPORT-T6.md (thêm cuối). Không commit git.
