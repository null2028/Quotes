# Hệ Thống 9 Bộ Bối Cảnh Chuẩn (`BO-BOI-CANH`)

> Phân tích từ toàn bộ **262 quote** tại `docs/motif/quote-motif-map.csv`.  
> **6 bộ bối cảnh chính** chiếm **89.7%** (`235/262` quote); **3 bộ bối cảnh phụ** chiếm **10.3%** (`27/262` quote) — tổng cộng phủ **100% kho nội dung**.  
> Tên đạo cụ mặc định sử dụng chuẩn preset tiếng Việt không dấu trong `docs/motif/HO-DAO-CU.md` (kèm mã alias hiện hành trong `propCatalog.tsx` nếu đã duyệt).

---

## Tổng quan tỷ trọng 9 Bộ Bối Cảnh

| Nhóm | STT | Tên bộ bối cảnh | Mã gợi ý | Số quote | Tỷ lệ (%) | Motif chủ đạo |
| :---: | :---: | :--- | :--- | :---: | :---: | :--- |
| **6 Bộ Chính** | 1 | **Phố, ngõ** | `pho_ngo` | **49** | **18.7%** | M2 (Khoảng cách), M4 (Thời gian), M5 (Hành trình) |
| **6 Bộ Chính** | 2 | **Thiên nhiên mở** | `thien_nhien_mo` | **38** | **14.5%** | M5 (Hành trình), M7 (Nội tâm), M6 (Đổi quy mô) |
| **6 Bộ Chính** | 3 | **Phòng trong nhà** | `phong_trong_nha` | **38** | **14.5%** | M7 (Nội tâm), M1 (Vật lật nghĩa), M3 (Vật ở lại) |
| **6 Bộ Chính** | 4 | **Không gian ký hiệu** | `khong_gian_ky_hieu` | **38** | **14.5%** | M1 (Vật lật nghĩa), M7 (Nội tâm), M2 (Khoảng cách) |
| **6 Bộ Chính** | 5 | **Hiên trà** | `hien_tra` | **36** | **13.7%** | M4 (Thời gian), M1 (Vật lật nghĩa), M3 (Vật ở lại) |
| **6 Bộ Chính** | 6 | **Văn phòng** | `van_phong` | **36** | **13.7%** | M1 (Vật lật nghĩa), M8 (Đối chiếu) |
| **3 Bộ Phụ** | 7 | **Quán** | `quan_nho` | **18** | **6.9%** | M1 (Vật lật nghĩa), M2 (Khoảng cách), M8 (Đối chiếu) |
| **3 Bộ Phụ** | 8 | **Nhà quê, mâm cơm** | `nha_que` | **7** | **2.7%** | M4 (Thời gian), M3 (Vật ở lại) |
| **3 Bộ Phụ** | 9 | **Ga tàu** | `ga_tau` | **2** | **0.8%** | M5 (Hành trình), M8 (Đối chiếu) |

---

## Phần A — 6 Bộ Bối Cảnh Chính (`89.7%` kho quote)

### 1. Phố, ngõ (`pho_ngo`) — **49 quote (`18.7%`)**
- **Nền (địa hình / tường / vạch)**:
  - Địa hình mặc định: `dia_hinh: "phang"` (vỉa hè / lối ngõ) hoặc `"nga_re"` khi diễn chia lối (Q032, Q080, Q105, Q130).
  - Lớp `nen`: bóng nhà phố hoặc cổng ngõ mờ nhạt tạo chiều sâu hẻm mà không che nhân vật ở lớp `giua`.
- **Đạo cụ mặc định (3–6 preset)**:
  1. `nha_pho` *(lớp `nen`, neo `dat` — mặt tiền nhà có ô cửa sáng)*
  2. `den_duong` *(lớp `nen`/`giua`, neo `dat` — cột đèn góc phố)*
  3. `mai_hien` *(lớp `nen`, neo `tuong` — hiên trú mưa / hiên tiệm)*
  4. `ghe_dai` *(alias `bench`, lớp `giua`, neo `dat` — ghế băng bên đường)*
  5. `chiec_o` *(alias `umbrella`, neo `cam` — cầm tay khi mưa phố)*
  6. `xe_dap` / `xe_may` *(lớp `giua`, neo `dat` — phương tiện tan tầm)*
- **Khí quyển & Bảng màu phù hợp**:
  - `Atmosphere`: `rain` (mưa phố chiều), `leaves` (lá bay qua ngõ), `sun` / `hollow_sun` (nắng chiều muộn).
  - Bảng màu: `MINIMAL_LIGHT` (nắng chiều ấm) hoặc `MINIMAL_DARK` / `WARM_NOIR` (phố lên đèn).

### 2. Thiên nhiên mở (`thien_nhien_mo`) — **38 quote (`14.5%`)**
- **Nền (địa hình / tường / vạch)**:
  - Địa hình linh hoạt nhất trong 9 bộ: `"doi"` (sườn đồi thoáng), `"doc"` (dốc bước lên), `"bo_nuoc"` (bờ sông/biển), `"bac_thang"` (bậc đá hành trình), hoặc `"phang"` (đồng cỏ rộng).
  - Không có mảng tường; ưu tiên khoảng trắng giấy lớn phía trên để tôn sự tĩnh lặng (M5, M6, M7).
- **Đạo cụ mặc định (3–6 preset)**:
  1. `cay_xanh` / `cay_tro_canh` *(lớp `nen`/`giua`, neo `dat`)*
  2. `bong_hoa` / `mam_cay` *(lớp `giua`, neo `dat` — điểm tụ thị giác hoặc vật đỏ)*
  3. `cum_co` *(lớp `giua`/`truoc`, neo `dat` — khóm cỏ ven đường)*
  4. `den_long` *(neo `cam` — Lữ khách cầm đi đêm trong Q064, Q147)*
  5. `cloud_wisp` *(lớp `nen`, neo `troi` — làn mây thuỷ mặc)*
- **Khí quyển & Bảng màu phù hợp**:
  - `Atmosphere`: `wind`, `leaves`, `birds`, `sun`, `crescent` (đêm sao/trăng).
  - Bảng màu: `MINIMAL_LIGHT` (ban ngày khoáng đạt) hoặc `WARM_NOIR` (đêm hành trình cầm đèn lồng).

### 3. Phòng trong nhà (`phong_trong_nha`) — **38 quote (`14.5%`)**
- **Nền (địa hình / tường / vạch)**:
  - Địa hình: `dia_hinh: "phang"` (nét cọ sàn gỗ mảnh ngang phòng).
  - Lớp `nen`: mảng tường giả định được gợi bằng `cua_so` hoặc `khung_tranh` treo cao (không vẽ vách kín đè nặng khung hình).
- **Đạo cụ mặc định (3–6 preset)**:
  1. `cua_so` *(alias `porch_window`, lớp `nen`, neo `tuong`, có điểm neo `be_cua`)*
  2. `cua_phong` *(lớp `nen`/`giua`, neo `dat`, biến thể `dong` / `he_mo`)*
  3. `giuong_ngu` + `chiec_goi` *(lớp `giua`, neo `dat` / `tren` — cảnh trằn trọc đêm khuya)*
  4. `ban_quan` / `ghe_tua` *(alias `std_chair`, lớp `giua`, neo `dat` — góc bàn nhỏ hoặc ghế trống M3)*
  5. `den_ban` *(lớp `giua`, neo `tren` — quầng sáng ấm góc phòng)*
  6. `guong_soi` / `khung_tranh` *(lớp `nen`, neo `tuong` — đối diện bản thân M7)*
- **Khí quyển & Bảng màu phù hợp**:
  - `Atmosphere`: `crescent` (trăng ngoài song cửa), `steam` (khói trà nhẹ), `wind` (gió lùa khe cửa).
  - Bảng màu: `MINIMAL_DARK` (chiều muộn trầm lắng) và `WARM_NOIR` (đêm mất ngủ).

### 4. Không gian ký hiệu (`khong_gian_ky_hieu`) — **38 quote (`14.5%`)**
- **Nền (địa hình / tường / vạch)**:
  - Địa hình: `dia_hinh: "phang"` với nét chân trời cực mảnh làm mặt tựa tối giản, khoảng nền giấy trống tối đa như sân khấu kịch câm / tranh thiền thuỷ mặc.
  - Không dựng tường, mái hay cảnh phố phía sau; chỉ đặt đúng 1–2 vật ẩn dụ trung tâm.
- **Đạo cụ mặc định (3–6 preset)**:
  1. `trai_tim` / `tim_net_dut` *(neo `troi` / `cam` — ẩn dụ cảm xúc)*
  2. `duong_ke` / `soi_chi` *(neo `dat` / `giua` — ranh giới & sợi duyên M2)*
  3. `bong_bong_nghi` *(alias `chat_bubble`, neo `troi` — suy tưởng nội tâm M7)*
  4. `cuon_sach` / `trang_giay` / `ban_do` *(neo `dat` / `cam` — ẩn dụ tri thức & hành trình)*
  5. `hanh_tinh` / `qua_dia_cau` *(neo `troi` / `dat` — đối chiếu quy mô M6)*
- **Khí quyển & Bảng màu phù hợp**:
  - `Atmosphere`: tiết chế tối đa (`ring_pulse` nhẹ tại cú lật hoặc để trống hoàn toàn).
  - Bảng màu: `MINIMAL_LIGHT` (Giấy Trà Ấm làm nổi bật đường mực và điểm Đỏ Chu Sa).

### 5. Hiên trà (`hien_tra`) — **36 quote (`13.7%`)**
- **Nền (địa hình / tường / vạch)**:
  - Địa hình: `dia_hinh: "phang"` (thềm gỗ hiên nhà tiếp giáp khoảng sân thoáng).
  - Lớp `nen`: nửa trên điểm `mai_hien` hoặc `cua_so` lệch một bên, nửa còn lại mở thoáng ra trời/mây — bối cảnh chữ ký (signature) của kênh **Trà Nguội**.
- **Đạo cụ mặc định (3–6 preset)**:
  1. `ban_tra` *(alias `low_tea_table`, lớp `giua`, neo `dat` — mặt bàn trà thấp 3 điểm neo)*
  2. `don_go` / `ghe_dai` *(alias `low_wood_stool` / `bench`, lớp `giua`, neo `dat`)*
  3. `am_tra` *(lớp `giua`, neo `tren` đặt giữa/trái bàn trà)*
  4. `chen_tra` *(alias `small_cup`, neo `tren` hoặc `cam` — 1 chén độc ẩm hoặc 2 chén đối ẩm)*
  5. `mai_hien` *(lớp `nen`, neo `tuong` — gợi hiên nhà yên tĩnh)*
  6. `bep_than` / `quat_tay` *(tuỳ chọn khi dựng cảnh nhóm lò pha trà W029, W035)*
- **Khí quyển & Bảng màu phù hợp**:
  - `Atmosphere`: `steam` (làn khói trà mảnh), `leaves` (lá thu bay ngang hiên), `sun` / `crescent`.
  - Bảng màu: `MINIMAL_LIGHT` (sớm mai / chiều tà) hoặc `MINIMAL_DARK` (khói trà chiều).

### 6. Văn phòng (`van_phong`) — **36 quote (`13.7%`)**
- **Nền (địa hình / tường / vạch)**:
  - Địa hình: `dia_hinh: "phang"` (mặt sàn phẳng).
  - Lớp `nen`: `cua_so` công sở hoặc `dong_ho_treo` trên tường sau bàn làm việc, giữ bố cục ngang gọn gàng cho loạt quote Công sở (`W009–W055`, `W075–W095`, `Q001`).
- **Đạo cụ mặc định (3–6 preset)**:
  1. `ban_lam_viec` *(alias `std_work_desk`, lớp `giua`, neo `dat`)*
  2. `ghe_tua` / `ghe_van_phong` *(alias `std_chair`, lớp `giua`, neo `dat`)*
  3. `laptop` / `may_tinh_ban` *(alias `desk_laptop`, neo `tren` tại `mat_ban_trai`)*
  4. `lich_ban` *(alias `desk_calendar`, neo `tren` tại `mat_ban_phai` — vật đỏ kinh điển cho deadline/Chủ nhật)*
  5. `hoa_don` / `vi_tien` *(neo `tren` tại `mat_ban_giua` hoặc `cam` — vật đỏ lương/chi phí)*
  6. `chong_ho_so` *(alias `box_stack`, neo `dat` / `tren` — áp lực công việc)*
- **Khí quyển & Bảng màu phù hợp**:
  - `Atmosphere`: thường để tĩnh (không gió mưa), hoặc `crescent` ngoài ô cửa sổ khi tăng ca đêm (W053, W083).
  - Bảng màu: `MINIMAL_LIGHT` (giờ hành chính) hoặc `WARM_NOIR` (tăng ca khuya, đèn bàn bật sáng).

---

## Phần B — 3 Bộ Bối Cảnh Phụ (`10.3%` kho quote)

### 7. Quán (`quan_nho`) — **18 quote (`6.9%`)**
- **Nền (địa hình / tường / vạch)**:
  - Địa hình: `dia_hinh: "phang"`. Lớp `nen` điểm `cua_so` nhìn ra phố hoặc `den_ban` / đèn thả nhỏ tạo cảm giác bàn quán cà phê / quán trà / quán rượu đêm ấm cúng.
- **Đạo cụ mặc định (3–5 preset)**:
  1. `ban_quan` *(lớp `giua`, neo `dat` — bàn cao vừa cho 1–2 ghế đối diện)*
  2. `ghe_tua` *(alias `std_chair`, 1 hoặc 2 ghế đối diện quanh bàn)*
  3. `ly_ca_phe` / `chen_tra` / `ly_ruou` *(neo `tren` trên mặt bàn)*
  4. `dien_thoai` / `cuon_sach` *(neo `tren` hoặc `cam`)*
  5. `den_ban` *(neo `tren` — tạo điểm ấm cho cảnh quán tối Q161)*
- **Khí quyển & Bảng màu phù hợp**:
  - `Atmosphere`: `steam` (hơi cà phê/trà/phở nóng), `rain` (nhìn mưa qua ô cửa quán), `not_nhac` nhẹ.
  - Bảng màu: `MINIMAL_LIGHT` (quán chiều) và `WARM_NOIR` (quán đêm).

### 8. Nhà quê, mâm cơm (`nha_que`) — **7 quote (`2.7%`)**
- **Nền (địa hình / tường / vạch)**:
  - Địa hình: `dia_hinh: "phang"` (nền hiên gạch / sân nhà quê). Lớp `nen` đặt `cua_nha` hoặc `nha_nho` gợi mái ấm gia đình & ký ức tuổi thơ (`Q027`, `Q048`, `Q057`, `Q066`, `Q068`, `Q115`, `W056`).
- **Đạo cụ mặc định (3–5 preset)**:
  1. `mam_com` *(lớp `giua`, neo `dat` hoặc trên phản/bàn thấp — tâm điểm sum vầy)*
  2. `bat_com` / `am_tra` *(neo `tren` trên `mam_com`)*
  3. `don_go` / `ghe_tua` *(đặt quanh mâm; để trống 1 ghế khi diễn motif M3 người đi xa)*
  4. `cua_nha` / `nha_nho` *(lớp `nen`, neo `dat` — ngưỡng cửa ngóng về)*
- **Khí quyển & Bảng màu phù hợp**:
  - `Atmosphere`: `steam` (khói cơm chiều), `sun` (nắng trưa hè), `leaves`.
  - Bảng màu: `MINIMAL_LIGHT` (Giấy Trà Ấm gợi màu rơm nắng & ký ức).

### 9. Ga tàu (`ga_tau`) — **2 quote (`0.8%` · Q012, Q137)**
- **Nền (địa hình / tường / vạch)**:
  - Địa hình: `dia_hinh: "phang"` đóng vai mép ke sân ga chạy ngang. Lớp `nen` đặt `toa_tau` chạy dài tạo chiều ngang chia ly / khởi hành.
- **Đạo cụ mặc định (3–4 preset)**:
  1. `toa_tau` *(lớp `nen`, neo `dat` — thân tàu có hàng ô cửa vuông)*
  2. `vali` *(lớp `giua`, neo `dat` cạnh Lữ khách hoặc `cam`)*
  3. `ghe_dai` *(alias `bench`, lớp `giua`, neo `dat` — ghế chờ sân ga)*
  4. `dong_ho_treo` *(lớp `nen`, neo `tuong` — đồng hồ giờ tàu chạy)*
- **Khí quyển & Bảng màu phù hợp**:
  - `Atmosphere`: `wind` hoặc `leaves` bay dọc sân ga lúc tàu rời bến.
  - Bảng màu: `MINIMAL_DARK` (chiều xám chia xa).
