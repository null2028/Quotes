# Cách tư duy khi code — Trà Nguội Studio

Gemini đọc file này trước mỗi phiên làm việc. Ưu tiên cao hơn hướng dẫn cũ.

## 14 nguyên tắc
1. **Luật nằm trong code, không nằm trong prompt.** Muốn AI không làm sai điều gì → viết hàm kiểm tra chặn nó, đừng chỉ viết thêm dòng hướng dẫn.
2. **AI quyết ý nghĩa, code quyết hình học.** Kịch bản chỉ dùng tên (đạo cụ, khe vị trí, điểm neo, tư thế, trạng thái). Cần vị trí mới → thêm điểm neo vào thư viện, không viết toạ độ tay.
3. **Không bao giờ lỗi im lặng.** Cấm fallback ngầm, bỏ trường lạ, ép giá trị (kiểu "giãn thành 3.8s"), đạo cụ thiếu thì không vẽ. Sai thì báo lỗi rõ, kèm danh sách giá trị hợp lệ.
4. **Sửa gốc, không vá ngọn.** Trước khi sửa, viết một câu: "Nguyên nhân gốc là …". Không thêm hằng số ma thuật để che lỗi.
5. **Mỗi lỗi tìm thấy → một luật kiểm tra mới**, để lỗi đó không quay lại.
6. **Nhìn trước khi tin.** `tsc` qua hay test qua chưa có nghĩa video đúng. Luôn xuất ảnh 6 khung chính và tự xem trước khi dựng đủ video.
7. **Không nới luật để cho qua.** Thấy luật sai → nói ra, đừng tắt.
8. **Một nguồn chuẩn.** Sửa đúng file đang dùng; không tạo bản "v8.7", "(1).md", SKILL mới. Thông số trong tài liệu phải khớp code.
9. **Thay đổi nhỏ, đúng phạm vi.** Không refactor lan sang chỗ không được yêu cầu. Commit theo từng việc.
10. **Cú lật đến từ nghĩa của quote.** Mỗi Chén đúng 1 vật đỏ do câu chữ quyết định; Lữ khách chỉ phản ứng bằng lá trà, mắt, tư thế.
11. **Một vật, một nghĩa.** Không bao giờ gộp 2 vật khác nhau vào một mã đạo cụ. Hộp bao (`box`) của mỗi vật phải khớp khít với hình của chính nó.
12. **Bản đỏ giống hệt dáng bản thường, chỉ khác màu.** Ở cùng một trạng thái vật lý, trạng thái thường và trạng thái đỏ phải trùng khớp cả hộp bao lẫn bóng dáng (`silhouette`), được kiểm tra tự động bằng code.
13. **Luật phóng đại vật nhỏ thống nhất & đồng nhất kích thước cùng loại vật.**
    - Mỗi đạo cụ khai báo `kich_thuoc_that` (cm). Kích thước hiển thị = `kich_thuoc_that × TY_LE_CANH × HE_SO_PHONG_DAI` (`TY_LE_CANH = 0.32`, `HE_SO_PHONG_DAI = 2.0` cho vật `< 30 cm`, `1.0` cho vật `>= 30 cm`).
    - Validator chặn cứng mọi đạo cụ có kích thước lệch quá `15%` so với kết quả tính, và bắt buộc cùng một loại vật phải có cùng kích thước dù đặt ở đâu.
14. **Xử lý vật đỏ nhỏ bằng máy quay hoặc đưa lên tay cầm — cấm phóng to riêng.**
    - Khi vật đỏ là vật nhỏ, tuyệt đối không phóng to riêng vật đó. Code tự động dùng 1 trong 2 cách: (a) đẩy máy quay vào `10–15%` (`zoom = 1.14`) tại cú lật và đo diện tích đỏ sau khi đẩy máy; hoặc (b) đưa vật lên tay Lữ khách (`cam`). Nếu vẫn dưới `500 px²` thì chặn cứng và gợi ý đổi vật đỏ khác.

## Quy tắc làm việc & báo cáo (bắt buộc)
1. **Mỗi task chỉ đổi MỘT thứ** và có điều kiện "xong" rõ ràng. Phát hiện việc khác cần làm thì ghi vào cuối báo cáo, **KHÔNG tự làm luôn**.
2. **Báo cáo tối đa 10 dòng**, gồm đúng 3 ý: **đã làm gì**, **kết quả (kèm đường dẫn ảnh)**, **cần chủ kênh quyết điều gì**. Không chép lại bảng hay mô tả đã có.
3. **Mô tả 5 câu** chỉ bắt buộc với vật vẽ **MỚI**. Sửa vật cũ thì không cần.
4. **Tờ duyệt phải sinh bằng MỘT lệnh**, và **chỉ dựng lại các món vừa sửa**.
5. **Giới hạn thời gian**: task chạy quá khoảng 30 phút thì dừng lại, báo đang ở đâu và vướng gì.
6. **Kiểm tra hệ thống**: bỏ việc chuyển đổi Chén 16 và 17; bài kiểm tra hệ thống sẽ là **MỘT CHÉN MỚI** do chủ kênh chọn quote.

## Việc tồn đọng (chờ chủ kênh giao ở task sau)
- Thống nhất độ dày nét của mọi đạo cụ bằng một hằng số chung (hiện vật nhỏ có nét đen dày hơn bàn ghế, khiến chi tiết bị bết khi thu nhỏ).
- Bổ sung động tác `go_phim` (gõ laptop thoăn thoắt khi ngồi bàn làm việc).

## Tài liệu chuẩn
Sổ tay nhân vật (ảnh `docs/character/tra-nguoi-lu-khach-vong-7.png`) · `tn-core/README.md` · `docs/motif/quote-motif-map.csv`.
