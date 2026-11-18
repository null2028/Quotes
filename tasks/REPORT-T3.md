# REPORT-T3: Định dạng Gói Chén

Đã tạo: `docs/GOI-CHEN.md` (đọc 2 phút), `src/stage/goiChenParser.ts` (`parseGoiChen()`), `scripts/check-goi.mjs`, 2 file mẫu.
Typecheck: 0 lỗi.

**check-goi q001.json:**
```
✅ OK
```

**check-goi loi.json:**
```
❌ 10 lỗi:
  • root.dao_cu[4].x: không được ghi "x" trong Gói Chén (hãy dùng khe vị trí hoặc điểm neo).
  • Có 2 vật đỏ ("hoa_don", "thiep") nhưng chỉ được tối đa 1. Giữ 1 vật "vat_do": true, xoá ở các vật còn lại.
  • dao_cu[1] (binh_hoa): "binh_hoa_quy" không có trong propCatalog, ý bạn là "wine_jar"?
  • dao_cu[4] (thiep): không được ghi trực tiếp "x" trong kịch bản ngữ nghĩa (hãy dùng khe vị trí hoặc điểm neo).
  • dao_cu[5] (coc): vật chủ "ke_sach" trong dat_tren "ke_sach.mat_ke" chưa được khai báo trước đó.
  • Đạo cụ "binh_hoa": "binh_hoa_quy" không có trong propCatalog, ý bạn là "wine_jar"?
  • Đạo cụ "coc": điểm neo đặt trên "ke_sach.mat_ke" không tồn tại.
  • "coc" ra ngoài vùng an toàn của terrain tại t=0.00s (mép trái -4.5 < 70).
  • Va chạm cùng lớp "giua" tại t=0.00s: "ban" đè lên "hoa_don" (9.4×14.6px).
  • Mỗi Chén chỉ được có đúng 1 vật đỏ, hiện đang có 2 vật đỏ (hoa_don, thiep).
```
