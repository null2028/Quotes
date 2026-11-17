# GÓI TÀI LIỆU AUDIT HỆ THỐNG TẠO ANIMATION TRÀ NGUỘI (`@tranguoi.15s` — V8.6.1)

> **Mục tiêu gói tài liệu:** Cung cấp toàn bộ thông số kỹ thuật đã xác minh từ mã nguồn, bảng đo đạc bounding box của 122 đạo cụ, 9 bộ ví dụ thực tế (6 kịch bản tốt + 3 kịch bản lỗi kèm JSON nguyên bản và 4 frame PNG trích xuất từ video), ma trận DNA chống lặp và bản chụp mã nguồn sạch bảo mật để đối chiếu trực tiếp và thiết kế cấu trúc JSON thế hệ mới gọn, dễ sáng tác, không lỗi vị trí/chồng lấn.

---

## Cấu trúc Thư mục Gói Tài liệu Audit (`audit-package-tra-nguoi/`)

1. **[Phần 1 — Quy luật Sân khấu Đang chạy (`01_stage_rules_and_schema/`)](01_stage_rules_and_schema/01_STAGE_RULES_AND_SCHEMA.md)**
   - Báo cáo chi tiết: [`01_STAGE_RULES_AND_SCHEMA.md`](01_stage_rules_and_schema/01_STAGE_RULES_AND_SCHEMA.md)
   - Thông số JSON máy đọc: [`stage_rules_machine_readable.json`](01_stage_rules_and_schema/stage_rules_machine_readable.json)
   - Bao gồm: Hệ tọa độ `STAGE_VIEWBOX = "62 126 416 250"`, `DEFAULT_GROUND_Y = 352`, 4 biến thể Layout trên khung `1080×1920`, quy tắc neo `sky/far/mid/fore` & 4 socket nhân vật (`hand`, `head`, `back`, `ground_front`), lỗi đảo thứ tự lớp `fore` vẽ đè đạo cụ lên ngực nhân vật, bẫy ghi đè thời lượng `3.8s` sau Pivot (`resolveCinemagraphDurationFrames`), và bảng phân biệt rõ quy tắc nào thực sự được code kiểm tra vs. quy tắc chỉ nằm trong prompt.

2. **[Phần 2 — Danh mục 122 Đạo cụ & Năng lực Render (`02_prop_catalog/`)](02_prop_catalog/02_PROP_CATALOG_AND_RENDER_CAPABILITIES.md)**
   - Báo cáo & Bảng tra cứu đầy đủ: [`02_PROP_CATALOG_AND_RENDER_CAPABILITIES.md`](02_prop_catalog/02_PROP_CATALOG_AND_RENDER_CAPABILITIES.md)
   - Dữ liệu JSON toàn bộ 122 đạo cụ (`26 Built-In` + `96 Custom`): [`prop_catalog_full.json`](02_prop_catalog/prop_catalog_full.json)
   - Thư mục 122 file SVG Preview có tâm neo `(0,0)`: [`02_prop_catalog/svg_previews/`](02_prop_catalog/svg_previews/)
   - Bao gồm: Kích thước bounding box `[minX..maxX, minY..maxY, width, height]` cho cả trạng thái gốc và trạng thái biến hình `altShapes`, bộ 5 đạo cụ nội thất chuẩn hóa (`std_chair`, `office_stool`, `std_tea_table`, `small_work_desk`, `std_work_desk`), và danh sách các ID đạo cụ bị lỗi/chưa tồn tại trong catalog (`"stool"`, `"low_tea_table"`).

3. **[Phần 3 — Bộ Ví dụ Thực tế: 6 Kịch bản Tốt & 3 Kịch bản Lỗi (`03_examples/`)](03_examples/03_REAL_EXAMPLES_GOOD_AND_BAD.md)**
   - Báo cáo phân tích chi tiết: [`03_REAL_EXAMPLES_GOOD_AND_BAD.md`](03_examples/03_REAL_EXAMPLES_GOOD_AND_BAD.md)
   - Chỉ mục манифест: [`examples_manifest.json`](03_examples/examples_manifest.json)
   - **6 Kịch bản Tốt (`03_examples/good/`)**:
     1. [`good_01_chen_08_chiec_o`](03_examples/good/good_01_chen_08_chiec_o/) — Motif Chạm/Đồng cảm (`umbrella` morph + `WINDOW_FRAME`)
     2. [`good_02_chen_09_ky_uc`](03_examples/good/good_02_chen_09_ky_uc/) — Motif Ngẫm/Dư âm (`cinnabar_memory_note` bay lên hóa mây `dissolveToCloud`)
     3. [`good_03_chen_10_nguoi_nha`](03_examples/good/good_03_chen_10_nguoi_nha/) — Motif Lật/Bẻ lái hình ảnh (`gate_to_shared_roof` morph cổng rào thành mái hiên)
     4. [`good_04_chen_12_vitamin_em`](03_examples/good/good_04_chen_12_vitamin_em/) — Motif Chơi chữ/Liên tưởng (`flasks A-C-D` morph thành bóng cô gái)
     5. [`good_05_chen_15_khoe_tung`](03_examples/good/good_05_chen_15_khoe_tung/) — Motif Đồ vật tác động/Công sở (`hóa đơn doping` vực dậy nhân vật)
     6. [`good_06_chen_17_cap_nhat`](03_examples/good/good_06_chen_17_cap_nhat/) — Motif Một vật một câu chuyện (`desk_calendar` khựng lại ở trang cũ)
   - **3 Kịch bản Lỗi (`03_examples/bad/`)**:
     1. [`bad_01_chen_16_de_sang_mai_qua_tai_dao_cu`](03_examples/bad/bad_01_chen_16_de_sang_mai_qua_tai_dao_cu/) — Lỗi 2 chiếc ví trùng lặp, 4 vật thể đỏ cùng lúc ở Pivot, đi bộ xuyên bàn & đạo cụ lớp `fore` đè lên người nhân vật.
     2. [`bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung`](03_examples/bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/) — Lỗi dùng ghế công viên `bench` thu nhỏ làm ghế văn phòng & đạo cụ bay lơ lửng ở `y: -29` (kèm đối chiếu V1 lỗi vs V7 đã sửa).
     3. [`bad_03_script_p032_quyet_tam_3_giay_invisible_furniture_va_hop_den`](03_examples/bad/bad_03_script_p032_quyet_tam_3_giay_invisible_furniture_va_hop_den/) — Lỗi gọi `"type": "stool"` không có trong catalog khiến ghế tàng hình, thiếu trường `type`, dùng hộp đen đặc `vault_lid` (`fill: "bg", fillOpacity: 1`) và đi bộ xuyên bàn.

4. **[Phần 4 — DNA Trà Nguội, Biến thể & Tránh lặp (`04_dna_and_variation/`)](04_dna_and_variation/04_DNA_VARIATION_AND_DEDUP.md)**
   - Báo cáo chi tiết: [`04_DNA_VARIATION_AND_DEDUP.md`](04_dna_and_variation/04_DNA_VARIATION_AND_DEDUP.md)
   - Ma trận VisualDNA thực tế của 16 Chén: [`dna_matrix_and_dedup_audit.json`](04_dna_and_variation/dna_matrix_and_dedup_audit.json)

5. **[Phần 5 — Nguồn, Phiên bản & Tài liệu Mâu thuẫn (`05_sources_and_code/`)](05_sources_and_code/05_SOURCES_VERSIONS_AND_CONFLICTS.md)**
   - Báo cáo đối chiếu phiên bản & mâu thuẫn: [`05_SOURCES_VERSIONS_AND_CONFLICTS.md`](05_sources_and_code/05_SOURCES_VERSIONS_AND_CONFLICTS.md)
   - Danh mục kiểm kê tệp nguồn: [`file_inventory_and_conflicts.json`](05_sources_and_code/file_inventory_and_conflicts.json)
   - Bản chụp 20 tệp mã nguồn & dữ liệu sạch bảo mật: [`05_sources_and_code/src_snapshot/`](05_sources_and_code/src_snapshot/)
