Bạn là Gemini trong Antigravity, project Trà Nguội. Làm trọn rồi dừng.

T1c. Lữ khách ở các tư thế mới phải là Lữ khách cũ.

Ảnh qa-artifacts-ci/T1-so-sanh.png cho thấy: cột 1, 2, 4 (bản cũ, Chén 16) là Lữ khách dạng BÓNG MỰC ĐEN ĐẶC, đầu tròn đen, KHÔNG mắt, KHÔNG má, KHÔNG lá trà. Nhưng cột 3 (Q001: ngồi, gục, liếc) lại là một nhân vật khác: thân xám nhạt, đầu viền nét, có mắt, có lá trà. Đây là lỗi: các khả năng mới đang vẽ bằng phong cách khác.

Sửa:
1. Tìm vì sao Q001 ra phong cách khác (colorRole, biến thể nhân vật, nhánh vẽ riêng cho gục/nhìn ngang, hay tham số trong Gói Q001). Mọi tư thế, kể cả ngồi, gục, nhìn ngang, phải vẽ bằng ĐÚNG phong cách của cột 1: bóng mực đen đặc, cùng màu, cùng nét.
2. Bỏ mắt, má, lá trà khỏi Lữ khách trong luồng này (tính năng đó để dành cho giai đoạn nhân vật mới; nếu muốn giữ code thì ẩn sau một cờ mặc định TẮT).
3. `nhin_theo` không còn mắt để liếc → thể hiện bằng HƯỚNG ĐẦU: đầu xoay/nghiêng về phía vật (đầu dịch nhẹ và nghiêng vài độ về hướng vật). Ở Q001: lúc cú lật, đầu đang gục nhấc nhẹ và nghiêng về phía hoá đơn trước, 0,3s sau mới bật thẳng lưng.
4. Dáng gục vẫn giữ: thân đen đặc gập về phía bàn, đầu chạm gần mặt bàn.

Kiểm tra: typecheck 0 lỗi. Xuất lại qa-artifacts-ci/T1-so-sanh.png, cột 3 thay bằng 2 khung Q001 (dòng 3 gục | cú lật nghiêng đầu về hoá đơn), cắt sát, cùng cỡ với cột 4. Cột 3 và cột 4 phải trông là cùng một nhân vật.
Ghi 3 dòng vào cuối tasks/REPORT-T1.md: nguyên nhân, đã sửa gì, đường dẫn ảnh. Không commit git.
