1. **Hàm dựng & Preset (`src/stage/families/do_chua.tsx`)**: 6 preset mới trạng thái `nhap` dựng từ `buildDoChuaProp` (`am_tra`, `ly_ca_phe`, `ly_ruou`, `bat_com`, `hop_com`, `mam_com`) + 2 alias giữ nguyên bản `duyet` (`chen_tra` → `small_cup`, `vo_ruou` → `wine_jar`).
2. **Độ phủ kho quote**: Họ `do_chua` xuất hiện trong **51/262 quote** (`19.5%`), giúp nâng tổng số câu dựng đủ 100% đạo cụ (gồm 37 câu 0-prop) lên **49/262 (`18.7%`)** và chạm đạo cụ chính ở **88/262 (`33.6%`)**.
3. **Kiểm tra & Tờ duyệt**: `npm run typecheck` **0 lỗi**, Validator **0 lỗi** (`IoU = 1.00`, `Δbox = 0.00`), đã chạy `npm run gen:skill` (ghi rõ `nhap` chưa được dùng); ảnh tờ duyệt 1 lệnh (`npm run ho:duyet -- do_chua`): `qa-artifacts-ci/HO-do_chua.png`.
4. **Cần chủ kênh quyết (1)**: Duyệt chuyển 6 preset mới (`am_tra`, `ly_ca_phe`, `ly_ruou`, `bat_com`, `hop_com`, `mam_com`) từ `nhap` sang `duyet` hay cần chỉnh chi tiết dáng/tỷ lệ món nào?
5. **Phát hiện ngoài phạm vi chờ quyết (2)**: `small_cup` đặt bàn và `wine_jar` cũ chưa có `altShapes` (đang bị `role: 'ink'` chặn đổi đỏ dưới `500 px²`), và `cam_chen_tra` trong `CloakedTraveler.tsx` đang vẽ chén ở chân thay vì tay khi đứng — chủ kênh có muốn giao sửa riêng không?

---
6. **Cập nhật lần 2 (theo duyệt)**: Chuyển `ly_ca_phe`, `ly_ruou`, `bat_com`, `hop_com` sang `duyet`; `am_tra` bỏ chập nét bết đen (nét viền mảnh `0.56` + wash `0.09`, giữ dáng & hộp bao); `mam_com` (`86cm`, loại neo `tren`/`dat`) đặt trên bàn trà thấp chở đủ `2 bat_com + 1 chen_tra`.
7. **Bản đỏ & `cam_chen_tra`**: Thêm `altShapes` đỏ đồng dạng 100% cho `small_cup` và `wine_jar` (giữ nguyên bản thường); sửa `CloakedTraveler.tsx` đưa tay đỡ chén ngang ngực (`y ≈ -24`) kèm làn khói trà.
8. **Kiểm tra & Tờ duyệt mới**: `npm run typecheck` **0 lỗi**, Validator **0 lỗi**, `npm run gen:skill` & `npm run ho:duyet -- do_chua` xuất mới `qa-artifacts-ci/HO-do_chua.png` (có đủ 7 bản đỏ + ô Lữ khách đứng cầm chén); `check-goi` `q001.json` & `w051.json` OK.
9. **Cần chủ kênh quyết**: Duyệt chuyển `am_tra` và `mam_com` từ `nhap` sang `duyet` (riêng `CloakedTraveler` cầm chén đứng đã xử lý tay + chén ngang ngực, giữ nguyên mọi cảnh không cầm chén).
