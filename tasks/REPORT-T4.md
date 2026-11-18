# REPORT-T4: Ô nhập trên tool web nhận Gói Chén

1. **parseGoiChen** dọn lỗi: dedup 2 tầng, bỏ cascade (vật lỗi tên/neo → skip hình học), sắp format→rule→geom, bỏ pixel kỹ thuật. `check-goi loi.json` → 5 lỗi không trùng.
2. **geminiBundleBridge**: tự nhận dạng Gói Chén (`isGoiChen`), biên dịch qua `convertGoiChenToBundle()`, ném `GoiChenValidationError` nếu lỗi.
3. **GeminiBundleImportModal**: 3 nhánh hiển thị — Gói Chén lỗi (đỏ, danh sách lỗi + "Copy lỗi cho Gemini", khoá nút Nhập), Gói Chén hợp lệ (xanh, preview đầy đủ), JSON cũ (xanh + banner vàng "Định dạng cũ").
4. **Typecheck**: 0 lỗi. Screenshots: T4-A (q001 valid), T4-B (loi 5 lỗi), T4-C (Chén 16 legacy warning).
5. `check-goi loi.json`:
```
❌ 5 lỗi:
  • Không được ghi trường "x" trong Gói Chén — hãy dùng khe vị trí hoặc điểm neo thay vì toạ độ trực tiếp.
  • dao_cu[1] (binh_hoa): "binh_hoa_quy" không có trong propCatalog, ý bạn là "wine_jar"?
  • dao_cu[5] (coc): vật chủ "ke_sach" trong dat_tren "ke_sach.mat_ke" chưa được khai báo trước đó.
  • Có 2 vật đỏ ("hoa_don", "thiep") nhưng chỉ được tối đa 1. Giữ 1 vật "vat_do": true, xoá ở các vật còn lại.
  • Va chạm cùng lớp "giua" lúc bắt đầu video: "ban" đè lên "hoa_don".
```
