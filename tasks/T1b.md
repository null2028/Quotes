Bạn là Gemini trong Antigravity, project Trà Nguội. Làm trọn rồi dừng.

T1b. Làm lại ảnh so sánh của T1 cho đúng (KHÔNG sửa code nhân vật, trừ khi so sánh lộ ra khác biệt).

Vấn đề: scripts/t1-compare.mjs đang render cột 1 và cột 2 bằng CÙNG code hiện tại, nên ảnh không chứng minh được gì.

Làm:
1. Cột 1 phải dùng ĐÚNG code bản 7c1fe76: `git show 7c1fe76:src/kit/CloakedTraveler.tsx > src/kit/CloakedTraveler.baseline.tsx` (tạm thời), cho cột 1 import file này. Xoá file tạm sau khi xuất ảnh.
2. Phóng to: mỗi cột cắt sát quanh nhân vật, nhân vật cao ít nhất 400px để thấy rõ nét, khăn, mắt, lá trà.
3. Thêm cột 4: một khung hình ở giữa video Chén 16 bản đã đăng (dùng JSON kiểu cũ SCRIPT_DE_SANG_MAI), cắt sát nhân vật, để so phong cách nét với cột 3.
4. Nếu cột 1 và cột 2 có bất kỳ khác biệt nào nhìn thấy được → sửa CloakedTraveler cho khớp cột 1, giữ khả năng mới.

Xuất lại qa-artifacts-ci/T1-so-sanh.png. Ghi thêm 3 dòng vào cuối tasks/REPORT-T1.md: có khác biệt không, đã sửa gì, đường dẫn ảnh. Không commit git.
