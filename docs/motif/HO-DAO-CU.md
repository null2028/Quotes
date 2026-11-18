# Bản Đồ 12 Họ Đạo Cụ Tham Số (`HO-DAO-CU`)

> Nguồn dữ liệu: Toàn bộ **262 quote** trong `data/airtable-cache.json` (`Q001–Q161`: 160 câu, `W001–W102`: 102 câu), đã ánh xạ đủ 100% tại `docs/motif/quote-motif-map.csv`.  
> Đối chiếu thư viện hiện tại: `src/stage/propCatalog.tsx` (37 mã: **18 đã duyệt `duyet`**, **19 bản nháp `nhap`**).

---

## 1. Phân loại nền tảng trên 262 quote

- **Nhóm không cần đạo cụ (37/262 quote = `14.1%`)**:
  - `19` quote chỉ diễn bằng tương tác giữa các Lữ khách (`dao_cu` trống).
  - `18` quote chỉ dùng **Địa hình & Khí quyển** (`con đường` 8, `ngã rẽ` 5, `mưa` 4, `ngõ` 3, `dòng sông` 2, `núi` 2, `mây` 2, `sóng biển` 1, `sao` 1, `bóng đổ` 1) — thuộc `terrainSystem` và `Atmosphere`, **không tính là đạo cụ**.
- **Nhóm có đạo cụ (225/262 quote = `85.9%`)**:
  - **12 Họ đạo cụ tham số** bao phủ trọn vẹn đạo cụ cho **205/225** quote có đạo cụ → cộng 37 quote không cần đạo cụ = **242/262 quote (`92.4%`) dựng đủ 100% đạo cụ** (và **248/262 = `94.7%`** nếu tính chạm ít nhất 1 đạo cụ chính).
  - **13 đạo cụ lẻ ngoài họ** chỉ xuất hiện ở **20/262 quote (`7.6%`)**, trong đó 8 món chỉ xuất hiện đúng 1 lần trên toàn kênh.

---

## 2. Bảng tổng hợp 12 Họ Đạo Cụ & Độ phủ cộng dồn (sắp theo số quote cần giảm dần)

> **Cách đọc cột độ phủ cộng dồn (trên tổng 262 quote)**:
> - **Phủ trọn vẹn (`Đủ 100% vật`)**: Mọi đạo cụ của quote đều đã có trong các họ từ `1..k` (đã gồm `37` quote = `14.1%` không cần đạo cụ).
> - **Phủ chạm (`Có ≥1 vật chính`)**: Quote có ít nhất 1 đạo cụ thuộc các họ `1..k` (cộng `37` quote không cần đạo cụ).

| Thứ tự | Mã họ | Đạo cụ thô trong kho (số quote xuất hiện) | Số quote cần | Phủ trọn vẹn cộng dồn (`Đủ 100% vật`) | Phủ chạm cộng dồn (`Có ≥1 vật`) |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **1** | `do_chua` | chén trà (26), ấm trà (13), ly cà phê (5), mâm cơm (4), ly rượu (2), bát cơm (2), hộp cơm (1) | **51** | 49 / 262 (**18.7%**) | 88 / 262 (**33.6%**) |
| **2** | `mat_phang` | bàn (20), bàn làm việc (8), giường (6), gối (3), tủ kính (1), bàn họp (1) | **38** | 62 / 262 (**23.7%**) | 115 / 262 (**43.9%**) |
| **3** | `khung` | cửa sổ (12), cửa (7), mái hiên (5), cửa nhà (4), gương (4), khung tranh (3), bậc thang (2), cổng rào (1) | **37** | **82 / 262 (31.3%)** | **140 / 262 (53.4%)** |
| **4** | `giay` | lịch bàn (10), cuốn sách (7), phong thư (5), chồng hồ sơ (4), hóa đơn (2), trang giấy (2), lá bài (1), bản đồ (1) | **30** | 103 / 262 (**39.3%**) | 157 / 262 (**59.9%**) |
| **5** | `cay_co` | hoa (16), cây (6), cỏ (3), lá rơi (3), mầm cây (1) | **26** | 125 / 262 (**47.7%**) | 178 / 262 (**67.9%**) |
| **6** | `do_mang` | ví (9), ô (3), khăn len (2), quạt (2), vali (1), khăn tay (1), gánh (1), chiếc đầm (1), áo sơ mi (1), kính (1) | **22** | **141 / 262 (53.8%)** | **192 / 262 (73.3%)** |
| **7** | `ghe` | ghế trống (12), ghế dài (6), ghế văn phòng (2), ghế khán giả (1) | **21** | 160 / 262 (**61.1%**) | 203 / 262 (**77.5%**) |
| **8** | `vat_tron` | đồng hồ (6), mặt trời (6), mặt trăng (3), hành tinh (2), quả địa cầu (1), đồng hồ báo thức (1), quả cam (1), bóng bay (1) | **21** | 175 / 262 (**66.8%**) | 217 / 262 (**82.8%**) |
| **9** | `man_hinh` | điện thoại (10), máy tính (5), bảng tính (2), bảng đen (1), điện tâm đồ (1), ô chữ (1) | **20** | 193 / 262 (**73.7%**) | 227 / 262 (**86.6%**) |
| **10** | `anh_sang` | đèn (9), đèn lồng (7), đèn đường (3), bếp than (1) | **20** | 209 / 262 (**79.8%**) | 233 / 262 (**88.9%**) |
| **11** | `ky_hieu` | nốt nhạc (4), trái tim (4), bong bóng nghĩ (3), băng dán (2), đường kẻ (2), cục pin (2), sợi chỉ (1), mê cung (1) | **18** | 226 / 262 (**86.3%**) | 244 / 262 (**93.1%**) |
| **12** | `nha_xe` | nhà phố (7), nhà nhỏ (3), tàu (2), xe đạp (2), xe máy (2) | **16** | **242 / 262 (92.4%)** | **248 / 262 (94.7%)** |

---

## 3. Thiết kế tham số & Preset cho từng Họ Đạo Cụ

### Họ 1 — `do_chua` (Đồ chứa ẩm thực & trà đạo · 51 quote)
- **Tham số hàm dựng**: `dang_than` (`bau_thap` | `tru_cao` | `loe_mieng` | `co_thon` | `khay_bet`), `ty_le_cao_rong`, `loai_quai` (`khong` | `quai_ben` | `quai_xach`), `voi_rot` (`boolean`), `nap_day` (`boolean`), `chan_de` (`khong` | `de_gom` | `chan_ly`), `hoi_nong` (`boolean`).
- **Điểm neo & vật đỏ**: Neo `tren` / `cam` / `dat`; `mam_com` có điểm neo `giua_mam`, `trai_mam`, `phai_mam`. Tất cả đồ chứa nhỏ đều `canBeRed: true` (trừ `mam_com`).
- **Danh sách preset**:
  - `chen_tra` — **đã có `duyet`** (alias cũ: `small_cup`)
  - `vo_ruou` — **đã có `duyet`** (alias cũ: `wine_jar`)
  - `bat_com` — **đã có `nhap`** (alias cũ: `rice_bowl`)
  - `ly_ca_phe` — **đã có `nhap`** (alias cũ: `tall_cup`)
  - `am_tra` *(mới — thân bầu thấp + vòi cong + quai bên + nắp núm)*
  - `ly_ruou` *(mới — miệng khum + chân cao thanh mảnh)*
  - `hop_com` *(mới — thân chữ nhật bo góc + nắp gài)*
  - `mam_com` *(mới — khay tròn dẹt + vành mâm có điểm neo đặt bát/chén)*

### Họ 2 — `mat_phang` (Bàn, giường, tủ kê đồ · 38 quote)
- **Tham số hàm dựng**: `chieu_rong_cm`, `chieu_cao_cm`, `kieu_chan` (`chan_thang` | `chan_choai` | `chan_quy` | `khoi_hop`), `thanh_dau` (`khong` | `dau_giuong` | `vach_kinh`), `so_ngan` (`0 | 1 | 2`), `phu_kien_mat` (`khong` | `nem_goi`).
- **Điểm neo & vật đỏ**: Neo `dat`, lớp `giua`. Chuẩn hoá điểm neo mặt phẳng: `mat_trai`, `mat_giua`, `mat_phai` (giữ alias `mat_ban_trai`, `mat_ban_giua`, `mat_ban_phai` cho bàn); giường có `mat_giuong` & `dau_goi`. Mặc định `canBeRed: false` (trừ preset `chiec_goi` lẻ khi cần).
- **Danh sách preset**:
  - `ban_lam_viec` — **đã có `duyet`** (alias cũ: `std_work_desk`)
  - `ban_tra` — **đã có `duyet`** (alias cũ: `low_tea_table`)
  - `ban_quan` *(mới — bàn gỗ vuông/tròn cỡ vừa cho quán trà/cà phê)*
  - `ban_hop` *(mới — bàn dài văn phòng 3 điểm neo rộng)*
  - `giuong_ngu` *(mới — khung giường thấp + đầu giường + nệm phẳng)*
  - `chiec_goi` *(mới — gối vải bo mềm đặt trên `giuong_ngu.dau_goi`, `canBeRed: true`)*
  - `tu_kinh` *(mới — khối tủ trưng bày có khung mặt kính và đợt ngang)*

### Họ 3 — `khung` (Khung kiến trúc, cửa, gương, bậc thang · 37 quote)
- **Tham số hàm dựng**: `kieu_khung` (`cua_so` | `cua_di` | `cong_rao` | `guong_soi` | `khung_tranh` | `mai_hien` | `bac_thang`), `dang_vom` (`vuong` | `vom_cong` | `oval`), `chia_nan` (`khong` | `chu_thap` | `song_doc`), `trang_thai_canh` (`dong` | `he_mo` | `mo_rong`), `do_nghieng_mai`.
- **Điểm neo & vật đỏ**: `cua_so`, `khung_tranh`, `guong_soi`, `mai_hien` mặc định lớp `nen` (`tuong`); `cua_di`, `cong_rao`, `bac_thang` neo `dat`. Điểm neo `be_cua` trên `cua_so`. Cho phép `canBeRed: true` ở `khung_tranh`, `guong_soi`, `cua_di` (ô sáng khe cửa). *(Lưu ý: bậc thang dài toàn cảnh có thể dùng `boi_canh.dia_hinh = "bac_thang"`).*
- **Danh sách preset**:
  - `cua_so` — **đã có `duyet`** (alias cũ: `porch_window`)
  - `cua_phong` *(mới — khung cửa đứng trong nhà, biến thể `dong` / `he_mo`)*
  - `cua_nha` *(mới — cửa gỗ hai cánh có bậc thềm)*
  - `cong_rao` *(mới — cổng song thưa đầu ngõ)*
  - `mai_hien` *(mới — mái ngói/bạt nghiêng che đầu ở lớp `nen`, cao trên tầm đầu Lữ khách)*
  - `guong_soi` *(mới — gương bầu dục/chữ nhật treo tường hoặc chân đứng)*
  - `khung_tranh` *(mới — khung viền đôi treo tường)*
  - `bac_thang_ngan` *(mới — cụm 3–4 bậc đá khi cần đặt như đạo cụ độc lập)*

### Họ 4 — `giay` (Ấn phẩm giấy, sổ sách, thư từ · 30 quote)
- **Tham số hàm dựng**: `kho_giay` (`ngang_nho` | `dung_le` | `gap_doi` | `chu_a` | `cuon_mo` | `chong_cao`), `mep_rang_cua` (`boolean`), `dong_ke` (`0..4`), `dau_gap_goc` (`boolean`), `con_dau_do` (`boolean`).
- **Điểm neo & vật đỏ**: Neo `tren` / `cam` / `dat`. Tất cả ấn phẩm đơn chiếc `canBeRed: true`; `chong_ho_so` có điểm neo `dinh_hop`.
- **Danh sách preset**:
  - `lich_ban` — **đã có `duyet`** (alias cũ: `desk_calendar`)
  - `phong_thu_co` — **đã có `duyet`** (alias cũ: `envelope`)
  - `phong_bi` — **đã có `duyet`** (giữ nguyên `phong_bi`)
  - `tam_thiep` — **đã có `duyet`** (alias cũ: `thiep`)
  - `hoa_don` — **đã có `duyet`** (giữ nguyên `hoa_don`, biến thể `cam`, `tua`)
  - `chong_ho_so` — **đã có `duyet`** (alias cũ: `box_stack`)
  - `may_bay_giay` — **đã có `nhap`** (alias cũ: `paper_plane`)
  - `cuon_sach` *(mới — sách/sổ tay mở đôi hoặc gập, biến thể `mo` / `gap`)*
  - `trang_giay` *(mới — tờ giấy nháp thơ hơi uốn góc)*
  - `la_bai` *(mới — quân bài bo góc tỷ lệ 2:3)*
  - `ban_do` *(mới — tờ bản đồ gấp 3 nếp có nét đường đi mảnh)*

### Họ 5 — `cay_co` (Thực vật, hoa, cành lá · 26 quote)
- **Tham số hàm dựng**: `dang_cay` (`mam_nho` | `bui_co` | `canh_hoa` | `chau_hoa` | `cay_tan` | `cay_tro_canh` | `la_roi`), `chieu_cao_cm`, `so_nhanh` (`1..5`), `so_bong` (`0..3`), `co_chau` (`boolean`).
- **Điểm neo & vật đỏ**: Cây lớn/bụi cỏ neo `dat`; chậu hoa/nhành hoa neo `tren` / `cam` / `dat`; `la_roi` neo `cam` / `tren` / `dat`. `bong_hoa`, `chau_hoa`, `mam_cay`, `la_roi` đều `canBeRed: true`.
- **Danh sách preset**:
  - `cay_tro_canh` — **đã có `nhap`** (alias cũ: `bare_tree`)
  - `mam_cay` — **đã có `nhap`** (alias cũ: `sprout`)
  - `bong_hoa` *(mới — nhành hoa một bông thanh mảnh, biến thể `co_gai` / `trong_binh`)*
  - `cay_xanh` *(mới — cây thân gỗ tán thuỷ mặc thoáng)*
  - `cum_co` *(mới — khóm cỏ mềm ven đường)*
  - `chiec_la` *(mới — chiếc lá đơn để cầm tay hoặc đặt bàn; mưa lá nhiều dùng `Atmosphere: leaves`)*

### Họ 6 — `do_mang` (Đồ cá nhân mang theo & phục trang treo · 22 quote)
- **Tham số hàm dựng**: `loai_do` (`vi_gap` | `chiec_o` | `vali_keo` | `tui_xach` | `khan_vai` | `cap_kinh` | `quat_tay` | `don_ganh` | `ao_treo`), `quai_cam` (`khong` | `quai_ngan` | `can_dai` | `tay_keo` | `moc_treo`), `trang_thai_mo` (`mo` | `dong` | `khoa`).
- **Điểm neo & vật đỏ**: Neo `cam` / `tren` / `dat` (riêng `ao_treo` thêm `tuong`). Hầu hết `canBeRed: true` (ví, ô, khăn, quạt, kính, đầm).
- **Danh sách preset**:
  - `vi_tien` — **đã có `duyet`** (giữ nguyên `vi_tien`, biến thể `khoa`)
  - `chiec_o` — **đã có `duyet`** (alias cũ: `umbrella`, biến thể `gap`)
  - `khan_voan` — **đã có `nhap`** (alias cũ: `bridal_veil`)
  - `khan_choang` *(mới — khăn len / khăn tay mềm, biến thể `gap` / `bay`)*
  - `quat_tay` *(mới — quạt giấy/quạt nan xếp nửa vòng)*
  - `vali` *(mới — vali đứng có tay kéo gọn)*
  - `cap_kinh` *(mới — gọng kính tròn mảnh đặt bàn hoặc cầm tay)*
  - `don_ganh` *(mới — đòn tre uốn nhẹ kèm đôi quang gánh đeo vai `lung`)*
  - `ao_so_mi` *(mới — áo sơ mi treo móc phẳng phiu)*
  - `chiec_dam` *(mới — dáng váy chữ A treo móc thanh lịch)*

### Họ 7 — `ghe` (Ghế ngồi các loại · 21 quote)
- **Tham số hàm dựng**: `chieu_rong_cm` (đơn `60–75` | băng dài `160`), `tua_lung` (`khong` | `thap` | `cao`), `kieu_chan` (`bon_chan` | `chan_xoay` | `chan_cong_vien` | `chan_gap`).
- **Điểm neo & vật đỏ**: Neo `dat`, bắt buộc có điểm neo `mat_ghe` (ghế dài thêm `mat_ghe_trai`, `mat_ghe_phai`) khớp chuẩn IK ngồi của Lữ khách. Mặc định `canBeRed: false` (riêng `ghe_trong` khi đóng vai vật ở lại M3 có thể bật biến thể điểm nhấn nếu cần, hoặc đặt vật đỏ trên ghế).
- **Danh sách preset**:
  - `ghe_tua` — **đã có `duyet`** (alias cũ: `std_chair`, dùng chung cho `ghế trống` đơn)
  - `don_go` — **đã có `duyet`** (alias cũ: `low_wood_stool`)
  - `ghe_dai` — **đã có `duyet`** (alias cũ: `bench`)
  - `ghe_van_phong` *(mới — ghế tựa lưng cao + trụ chân xoay 5 nhánh)*
  - `ghe_khan_gia` *(mới — cụm 2–3 ghế xếp hàng ngang khán phòng)*

### Họ 8 — `vat_tron` (Đồng hồ, thiên thể, địa cầu, quả, bóng bay · 21 quote)
- **Tham số hàm dựng**: `ban_kinh_cm`, `chi_tiet_tam` (`trong` | `kim_dong_ho` | `kinh_vi_tuyen` | `khuet_trang`), `vanh_ngoai` (`khong` | `quang_sang` | `vanh_dai` | `tai_chuong` | `cuong_la`), `chan_hoac_day` (`khong` | `gia_chu_c` | `day_bay`).
- **Điểm neo & vật đỏ**: Đồng hồ treo neo `tuong`; đồng hồ báo thức / địa cầu / quả cam neo `tren` / `dat`; mặt trời / mặt trăng / hành tinh neo `troi` (`nen`); bóng bay neo `cam` / `troi`. Tất cả `canBeRed: true`.
- **Danh sách preset**:
  - `dong_ho_treo` *(mới — mặt tròn + 2 kim tối giản)*
  - `dong_ho_bao_thuc` *(mới — mặt tròn nhỏ + 2 chuông tai trên đỉnh + chân ngắn)*
  - `mat_troi` *(mới — đĩa tròn + quầng mảnh ở lớp `nen` / `troi`, đồng bộ được với `Atmosphere: sun`)*
  - `mat_trang` *(mới — trăng lưỡi liềm hoặc trăng tròn dịu)*
  - `hanh_tinh` *(mới — khối cầu có vành đai nghiêng)*
  - `qua_dia_cau` *(mới — cầu nghiêng trên giá đỡ chữ C)*
  - `qua_cam` *(mới — quả tròn nhỏ có cuống và 1 lá)*
  - `bong_bay` *(mới — bầu tròn hơi thuôn đáy + sợi dây mảnh)*

### Họ 9 — `man_hinh` (Thiết bị số & bảng hiển thị · 20 quote)
- **Tham số hàm dựng**: `kieu_thiet_bi` (`dien_thoai` | `laptop` | `man_hinh_de` | `bang_treo`), `ty_le_khung`, `noi_dung_hien_thi` (`trong` | `thong_bao` | `bang_tinh` | `mach_tim` | `o_chu` | `phuong_trinh`).
- **Điểm neo & vật đỏ**: Điện thoại neo `cam` / `tren`; laptop & máy tính để bàn neo `tren`; bảng lớn neo `tuong` / `dat`. Tất cả `canBeRed: true` (màn hình / đường mạch / ô chữ đổi Đỏ Chu Sa ở cú lật).
- **Danh sách preset**:
  - `laptop` — **đã có `duyet`** (alias cũ: `desk_laptop`)
  - `dien_thoai` *(mới — khung dọc cầm tay hoặc đặt bàn, biến thể `sang_tin_nhan`)*
  - `may_tinh_ban` *(mới — màn hình chữ nhật có chân đế trên bàn làm việc)*
  - `bang_tinh` *(mới — khung biểu đồ cột / lưới số liệu gọn)*
  - `dien_tam_do` *(mới — khung ngang với đường xung nhịp tim gấp khúc)*
  - `bang_den` *(mới — bảng chữ nhật treo tường có nét phấn tối giản)*
  - `bang_o_chu` *(mới — lưới vuông 3×3 / 4×4 có ô nhấn đỏ)*

### Họ 10 — `anh_sang` (Đèn & nguồn lửa ấm · 20 quote)
- **Tham số hàm dựng**: `kieu_den` (`den_ban` | `den_long` | `den_duong` | `bep_than`), `dang_chup` (`non_cut` | `bau_lua` | `cau_nho` | `chau_than`), `chieu_cao_tru`, `quang_sang` (`boolean`).
- **Điểm neo & vật đỏ**: `den_ban` neo `tren`; `den_long` neo `tuong` / `troi` / `cam`; `den_duong` & `bep_than` neo `dat`. Tất cả `canBeRed: true` (bầu đèn / tâm lửa chuyển Đỏ Chu Sa ở cú lật).
- **Danh sách preset**:
  - `den_long` — **đã có `nhap`** (alias cũ: `lantern`)
  - `den_duong` — **đã có `nhap`** (alias cũ: `street_lamp`)
  - `bep_than` — **đã có `nhap`** (alias cũ: `campfire`, thêm viền lò đất nhỏ khi ở hiên trà)
  - `den_ban` *(mới — đế tròn + thân cong mảnh + chụp đèn nghiêng ấm)*

### Họ 11 — `ky_hieu` (Biểu tượng thị giác Không gian ký hiệu · 18 quote)
- **Tham số hàm dựng**: `loai_ky_hieu` (`trai_tim` | `not_nhac` | `bong_bong_nghi` | `bang_dan` | `duong_ke` | `soi_chi` | `me_cung` | `pin_sac`), `net_dut` (`boolean`), `trang_thai_tach` (`nguyen` | `nut_doi` | `day_pin`).
- **Điểm neo & vật đỏ**: Neo `troi` / `tuong` / `cam` / `dat` tuỳ cảnh ký hiệu. Tất cả `canBeRed: true`.
- **Danh sách preset**:
  - `trai_tim` — **đã có `nhap`** (alias cũ: `solid_heart`)
  - `tim_net_dut` — **đã có `nhap`** (alias cũ: `dashed_heart`)
  - `bong_bong_nghi` — **đã có `nhap`** (alias cũ: `chat_bubble`)
  - `not_nhac` *(mới — nốt móc đơn / móc kép bay nhẹ)*
  - `bang_dan` *(mới — miếng băng cá nhân bo tròn có ô gạc giữa)*
  - `duong_ke` *(mới — vạch ranh giới dưới đất chia hai bên sân khấu)*
  - `soi_chi` *(mới — sợi dây mảnh nối giữa hai vị trí, biến thể `cang` / `chung`)*
  - `me_cung` *(mới — vòng xoắn vuông tối giản nhìn nghiêng/trên)*
  - `pin_sac` *(mới — viên pin chữ nhật có cực đầu và vạch mức năng lượng)*

### Họ 12 — `nha_xe` (Bóng kiến trúc xa & phương tiện · 16 quote)
- **Tham số hàm dựng**: `loai_bong` (`nha_nho` | `nha_pho` | `day_pho` | `xe_dap` | `xe_may` | `toa_tau` | `thuyen_nho`), `so_tang` (`1..3`), `o_cua_sang` (`boolean`), `so_banh` (`0 | 2`).
- **Điểm neo & vật đỏ**: Nhà/phố đặt lớp `nen` (`dat`), phương tiện đặt lớp `giua` (`dat`). Ô cửa trên `nha_nho`/`nha_pho` và giỏ xe có thể `canBeRed: true`.
- **Danh sách preset**:
  - `nha_nho` — **đã có `nhap`** (alias cũ: `warm_house`)
  - `day_pho` — **đã có `nhap`** (alias cũ: `city_skyline`)
  - `thuyen_nho` — **đã có `nhap`** (alias cũ: `small_boat`)
  - `nha_pho` *(mới — mặt tiền nhà 2 tầng có ban công / ô cửa sáng)*
  - `xe_dap` *(mới — khung sườn mảnh + 2 bánh nan tối giản)*
  - `xe_may` *(mới — dáng scooter / cub gọn gàng)*
  - `toa_tau` *(mới — thân toa ngang có dãy ô cửa vuông ở sân ga)*

---

## 4. Đạo cụ lẻ KHÔNG thuộc 12 họ (13 món thô · 20/262 quote = `7.6%`)

> Các món này có cấu trúc hình học đặc thù, không ép gượng vào 12 hàm tham số để giữ đúng nguyên tắc **“Một vật, một nghĩa”**. Chỉ vẽ riêng và duyệt từng món khi sản xuất tới đúng quote đó.

| # | Đạo cụ thô | Mã đề xuất | Số quote | Quote cụ thể | Đã có nháp trong `propCatalog`? | Ghi chú xử lý |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| 1 | `cân` | `can_dia` | **3** | Q034, Q094, Q113 | Gần với `seesaw` (`nhap`) | Cân đòn hai đĩa thăng bằng (vẽ riêng 1 mẫu chuẩn). |
| 2 | `đàn` | `dan_guitar` | **3** | Q074, Q138, W008 | Chưa | Đàn thùng gỗ tối giản (biến thể `dut_day` cho W008). |
| 3 | `đồng hồ cát` | `dong_ho_cat` | **2** | Q076, Q148 | Có (`hourglass` — `nhap`) | Duyệt hộp bao + chuẩn nét T1 từ `hourglass` sẵn có. |
| 4 | `ống nghiệm` | `ong_nghiem` | **2** | Q129, Q135 | Chưa | Ống thuỷ tinh thon + mực chất lỏng. |
| 5 | `ong` | `con_ong` | **2** | W058, W071 | Chưa | Nét chấm cánh nhỏ (có thể thêm vào `Atmosphere` hoặc vẽ nhỏ). |
| 6 | `chuồn chuồn` | `chuon_chuon` | **1** | Q115 | Chưa | Cùng nhóm côn trùng bay nhỏ với `con_ong`. |
| 7 | `hòn đá` | `tang_da` | **1** | Q007 | Có (`boulder` — `nhap`) | Duyệt hộp bao + chuẩn nét T1 từ `boulder` sẵn có. |
| 8 | `kẹo` | `vien_keo` | **1** | Q022 | Chưa | Viên kẹo tròn nhỏ có 2 tai giấy xoắn. |
| 9 | `cọ vẽ` | `co_ve` | **1** | Q124 | Chưa | Cán bút lông thuỷ mặc cầm tay (`cam`). |
| 10 | `bàn ủi` | `ban_ui` | **1** | W027 | Chưa | Bàn ủi đặt bàn (có thể diễn thay bằng `ao_so_mi` phẳng). |
| 11 | `lưới` | `tam_luoi` | **1** | W067 | Chưa | Mảng đan mắt cáo mảnh ở Không gian ký hiệu / Phòng. |
| 12 | `sầu riêng` | `sau_rieng` | **1** | W031 | Chưa | Chơi chữ độc bản W031 — vẽ riêng khi dựng W031. |
| 13 | `cần câu` | `can_cau` | **1** | W017 | Chưa | Cần trúc cong mảnh cầm tay bên `bo_nuoc`. |

*(Ghi chú thêm: `kite` — cánh diều giấy đang có sẵn bản `nhap` trong `propCatalog.tsx`, chưa quote nào bắt buộc nhưng giữ lại ở nhóm lẻ `canh_dieu` khi cần).*

---

## 5. Thứ tự triển khai đề xuất (3 chặng)

1. **Chặng 1 — Dựng xương sống bàn trà & cửa phòng (3 họ đầu: `do_chua` → `mat_phang` → `khung`)**:
   - Đạt ngay **31.3%** quote đủ 100% đạo cụ (`82/262`) và **53.4%** quote có đạo cụ chủ đạo (`140/262`).
   - *Mẹo thực thi nhanh*: kết hợp luôn các preset đã `duyet` sẵn của `ghe` (`std_chair`, `low_wood_stool`, `bench`) vì 75% cảnh bàn trà/văn phòng đều ghép với ghế.
2. **Chặng 2 — Mở rộng Công sở, Thiên nhiên & Đời thường (3 họ tiếp: `giay` → `cay_co` → `do_mang`)**:
   - Nâng độ phủ trọn vẹn lên **53.8%** (`141/262`) và phủ chạm lên **73.3%** (`192/262`). Riêng `giay` đã hoàn thành sẵn 6/10 preset (`duyet`).
3. **Chặng 3 — Khép kín 6 họ còn lại (`ghe` → `vat_tron` → `man_hinh` → `anh_sang` → `ky_hieu` → `nha_xe`)**:
   - Đạt **92.4%** toàn kho (`242/262` quote dựng trọn vẹn 100% không vướng thiếu đồ). 20 quote còn lại chỉ cần duyệt lẻ đúng món khi chạm tới.
