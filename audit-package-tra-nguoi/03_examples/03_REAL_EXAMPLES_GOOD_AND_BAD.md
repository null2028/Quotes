# PHẦN 3: BỘ VÍ DỤ THỰC TẾ (6 KỊCH BẢN TỐT & 3 TRƯỜNG HỢP LỖI ĐIỂN HÌNH)

> **Toàn bộ dữ liệu JSON nguyên bản (`cup_input.json` + `stage_script.json`) và bộ 4 ảnh Frame PNG đại diện (`01_intro.png`, `02_pre_pivot.png`, `03_at_pivot.png`, `04_afterimage.png`) được lưu giữ nguyên vẹn trong thư mục [`03_examples/`](.) kèm tệp chỉ mục [`examples_manifest.json`](examples_manifest.json).**

---

## 3.1. Nhóm A — 6 Kịch bản Đã Render Tốt (Đa dạng Motif & Cách kể) — `[Đã xác minh trong code & video]`

### 1. Case Tốt 01 — Chén 08: `"Chiếc ô"` (`SCRIPT_CHIEC_O_RONG_CHO_NHAU`)
- **Nhóm trải nghiệm / Motif**: **01. Chạm – Đồng cảm & Che chở** (Hai người dưới mưa, chiếc ô mở rộng ở Pivot che chung cho cả hai).
- **Cấu hình VisualDNA**: `themeId: "WARM_NOIR"`, `layout: "WINDOW_FRAME"`, `shotMode: "SOLID_SCENE"`, `lightingGobo: "WARM_LANTERN"`, `pivotMechanic: "SPOTLIGHT_DIM"`, `horizonOffsetPx: -10`.
- **Điểm chuẩn mực**:
  - Tọa độ 2 nhân vật (`hero: 215 -> 240`, `beloved: 325 -> 290`) và đèn đường (`warm_lamp: 155`) nằm gọn trong lòng vòm cửa `WINDOW_ARCH` (`X = 122..418`).
  - Đúng **1 đạo cụ Đỏ Chu Sa duy nhất** (`umbrella` gắn socket `follow: "hero:hand"`, biến hình `morph: 0 -> 1` tại `"pivot"`).
- **Tệp nguồn & 4 Frame đại diện**:
  - JSON đầu vào: [`good/good_01_chen_08_chiec_o/cup_input.json`](good/good_01_chen_08_chiec_o/cup_input.json) | [`good/good_01_chen_08_chiec_o/stage_script.json`](good/good_01_chen_08_chiec_o/stage_script.json)
  - 4 Frame (`1.10s`, `4.38s`, `5.98s`, `10.93s`):
    - [`01_intro.png`](good/good_01_chen_08_chiec_o/01_intro.png) | [`02_pre_pivot.png`](good/good_01_chen_08_chiec_o/02_pre_pivot.png) | [`03_at_pivot.png`](good/good_01_chen_08_chiec_o/03_at_pivot.png) | [`04_afterimage.png`](good/good_01_chen_08_chiec_o/04_afterimage.png)

### 2. Case Tốt 02 — Chén 09: `"Ký ức"` (`SCRIPT_NGUOI_LU_HANH_VA_KY_UC`)
- **Nhóm trải nghiệm / Motif**: **04. Ngẫm – Dư âm & Buông bỏ** (Người lữ hành ngồi lại trên ghế đá, mảnh ký ức bay lên hóa thành mây trắng).
- **Cấu hình VisualDNA**: `themeId: "WARM_NOIR"`, `layout: "SKY_QUOTE_BOTTOM_STAGE"`, `shotMode: "BRUSH_DRAW"`, `lightingGobo: "WINDOW_SLATS"`, `pivotMechanic: "PARALLAX_DRIFT"`.
- **Điểm chuẩn mực**:
  - Sử dụng cơ chế `floatAway: true` kết hợp `dissolveToCloud: true` trên đạo cụ `cinnabar_memory_note`, tạo dư ảnh thơ mộng mà không cần nhồi nhét đạo cụ.
- **Tệp nguồn & 4 Frame đại diện**:
  - JSON đầu vào: [`good/good_02_chen_09_ky_uc/cup_input.json`](good/good_02_chen_09_ky_uc/cup_input.json) | [`good/good_02_chen_09_ky_uc/stage_script.json`](good/good_02_chen_09_ky_uc/stage_script.json)
  - 4 Frame (`1.10s`, `5.73s`, `7.33s`, `12.48s`):
    - [`01_intro.png`](good/good_02_chen_09_ky_uc/01_intro.png) | [`02_pre_pivot.png`](good/good_02_chen_09_ky_uc/02_pre_pivot.png) | [`03_at_pivot.png`](good/good_02_chen_09_ky_uc/03_at_pivot.png) | [`04_afterimage.png`](good/good_02_chen_09_ky_uc/04_afterimage.png)

### 3. Case Tốt 03 — Chén 10: `"Người nhà"` (`SCRIPT_CONG_RAO_HOA_MAI_HIEN_CHUNG`)
- **Nhóm trải nghiệm / Motif**: **02. Lật – Cú bẻ lái bằng hình ảnh (Concept 01)** ("Mẹ anh bảo người lạ / Sẽ cực kỳ xấu xa / Nhưng em xinh đẹp quá / Chắc chắn là người nhà").
- **Cấu hình VisualDNA**: `themeId: "MINIMAL_LIGHT"`, `layout: "CLASSIC_TOP_STAGE"`, `shotMode: "SOLID_SCENE"`, `lightingGobo: "FOLIAGE_DAPPLE"`, `pivotMechanic: "PULLBACK_REVEAL"`.
- **Điểm chuẩn mực**:
  - Đạo cụ trung tâm `gate_to_shared_roof` tại `x: 270` đóng vai trò rào chắn ngăn cách `hero` (`x: 210`) và `beloved` (`x: 330`) ở 2 câu đầu; đúng tại `"pivot"`, cổng rào `morph: 0 -> 1` nâng lên thành mái hiên nhà ấm áp màu đỏ Chu Sa che chung cho hai người bước lại gần nhau (`245` và `295`).
- **Tệp nguồn & 4 Frame đại diện**:
  - JSON đầu vào: [`good/good_03_chen_10_nguoi_nha/cup_input.json`](good/good_03_chen_10_nguoi_nha/cup_input.json) | [`good/good_03_chen_10_nguoi_nha/stage_script.json`](good/good_03_chen_10_nguoi_nha/stage_script.json)
  - 4 Frame (`1.10s`, `5.73s`, `7.33s`, `11.71s`):
    - [`01_intro.png`](good/good_03_chen_10_nguoi_nha/01_intro.png) | [`02_pre_pivot.png`](good/good_03_chen_10_nguoi_nha/02_pre_pivot.png) | [`03_at_pivot.png`](good/good_03_chen_10_nguoi_nha/03_at_pivot.png) | [`04_afterimage.png`](good/good_03_chen_10_nguoi_nha/04_afterimage.png)

### 4. Case Tốt 04 — Chén 12: `"Vitamin Em"` (`SCRIPT_DUNG_NGHI_NGUYEN_TO_A_C_D_HOA_EM`)
- **Nhóm trải nghiệm / Motif**: **03. Chơi – Liên tưởng & Chơi chữ** (Các bình nguyên tố A, C, D trên bàn thí nghiệm hóa thành bóng hình "Vitamin Em").
- **Cấu hình VisualDNA**: `themeId: "MINIMAL_LIGHT"`, `layout: "CLASSIC_TOP_STAGE"`, `shotMode: "SOLID_SCENE"`, `lightingGobo: "WARM_LANTERN"`, `pivotMechanic: "ACCENT_PUSH_IN"`.
- **Tệp nguồn & 4 Frame đại diện**:
  - JSON đầu vào: [`good/good_04_chen_12_vitamin_em/cup_input.json`](good/good_04_chen_12_vitamin_em/cup_input.json) | [`good/good_04_chen_12_vitamin_em/stage_script.json`](good/good_04_chen_12_vitamin_em/stage_script.json)
  - 4 Frame (`1.10s`, `5.54s`, `7.14s`, `11.32s`):
    - [`01_intro.png`](good/good_04_chen_12_vitamin_em/01_intro.png) | [`02_pre_pivot.png`](good/good_04_chen_12_vitamin_em/02_pre_pivot.png) | [`03_at_pivot.png`](good/good_04_chen_12_vitamin_em/03_at_pivot.png) | [`04_afterimage.png`](good/good_04_chen_12_vitamin_em/04_afterimage.png)

### 5. Case Tốt 05 — Chén 15: `"Khỏe tưng"` (`SCRIPT_GANH_NANG_COM_AO_HOA_DON_DOPING`)
- **Nhóm trải nghiệm / Motif**: **02/03. Đồ vật phản chủ & Bẻ lái công sở** ("Đôi khi muốn ốm một tuần / Nhìn tờ hóa đơn… lại khỏe tưng!").
- **Cấu hình VisualDNA**: `themeId: "MINIMAL_DARK"`, `layout: "CLASSIC_TOP_STAGE"`, `shotMode: "SOLID_SCENE"`, `lightingGobo: "NONE"`, `pivotMechanic: "ACCENT_PUSH_IN"`.
- **Tệp nguồn & 4 Frame đại diện**:
  - JSON đầu vào: [`good/good_05_chen_15_khoe_tung/cup_input.json`](good/good_05_chen_15_khoe_tung/cup_input.json) | [`good/good_05_chen_15_khoe_tung/stage_script.json`](good/good_05_chen_15_khoe_tung/stage_script.json)
  - 4 Frame (`1.10s`, `5.73s`, `7.33s`, `12.48s`):
    - [`01_intro.png`](good/good_05_chen_15_khoe_tung/01_intro.png) | [`02_pre_pivot.png`](good/good_05_chen_15_khoe_tung/02_pre_pivot.png) | [`03_at_pivot.png`](good/good_05_chen_15_khoe_tung/03_at_pivot.png) | [`04_afterimage.png`](good/good_05_chen_15_khoe_tung/04_afterimage.png)

### 6. Case Tốt 06 — Chén 17: `"Cập nhật"` (`SCRIPT_P022_LICH_BAN_CHUA_CAP_NHAT`)
- **Nhóm trải nghiệm / Motif**: **04. Ngẫm – Một vật một câu chuyện (Concept 07)** ("Có những mối quan hệ / đã hết hạn từ lâu, / chỉ là tâm mình / vẫn chưa chịu cập nhật").
- **Cấu hình VisualDNA**: `themeId: "MINIMAL_LIGHT"`, `layout: "CLASSIC_TOP_STAGE"`, `shotMode: "SOLID_SCENE"`, `lightingGobo: "NONE"`, `pivotMechanic: "ACCENT_PUSH_IN"`.
- **Điểm chuẩn mực**:
  - Tối giản chỉ gồm 1 nhân vật ngồi (`x: 192`), ghế (`std_chair`, `x: 190`), bàn trà (`x: 230`, rộng `36px`) và 1 cuốn lịch bàn (`desk_calendar`, `x: 230, y: -22`) chuyển đỏ Chu Sa tại `"pivot"`, giữ khoảng trống âm (`Ma`) hơn 75% khung hình.
- **Tệp nguồn & 4 Frame đại diện**:
  - JSON đầu vào: [`good/good_06_chen_17_cap_nhat/cup_input.json`](good/good_06_chen_17_cap_nhat/cup_input.json) | [`good/good_06_chen_17_cap_nhat/stage_script.json`](good/good_06_chen_17_cap_nhat/stage_script.json)
  - 4 Frame (`1.10s`, `5.35s`, `6.95s`, `10.93s`):
    - [`01_intro.png`](good/good_06_chen_17_cap_nhat/01_intro.png) | [`02_pre_pivot.png`](good/good_06_chen_17_cap_nhat/02_pre_pivot.png) | [`03_at_pivot.png`](good/good_06_chen_17_cap_nhat/03_at_pivot.png) | [`04_afterimage.png`](good/good_06_chen_17_cap_nhat/04_afterimage.png)

---

## 3.2. Nhóm B — 3 Trường hợp Gặp Lỗi Vị trí, Chồng lấn, Khó nhận diện & Chuyển động bất hợp lý — `[Đã xác minh trong code & video]`

### 1. Case Lỗi 01 — Chén 16 (`SCRIPT_DE_SANG_MAI`): Quá tải đạo cụ, 2 chiếc ví trùng lặp, 4 vật thể đỏ cùng lúc & Đi bộ xuyên bàn
- **Tệp nguồn & 4 Frame thực tế**:
  - JSON đầu vào nguyên bản: [`bad/bad_01_chen_16_de_sang_mai_qua_tai_dao_cu/cup_input.json`](bad/bad_01_chen_16_de_sang_mai_qua_tai_dao_cu/cup_input.json) | [`bad/bad_01_chen_16_de_sang_mai_qua_tai_dao_cu/stage_script_buggy.json`](bad/bad_01_chen_16_de_sang_mai_qua_tai_dao_cu/stage_script_buggy.json)
  - 4 Frame (`1.10s`, `5.73s`, `7.33s`, `12.10s`):
    - [`01_intro.png`](bad/bad_01_chen_16_de_sang_mai_qua_tai_dao_cu/01_intro.png) | [`02_pre_pivot.png`](bad/bad_01_chen_16_de_sang_mai_qua_tai_dao_cu/02_pre_pivot.png) | [`03_at_pivot.png`](bad/bad_01_chen_16_de_sang_mai_qua_tai_dao_cu/03_at_pivot.png) | [`04_afterimage.png`](bad/bad_01_chen_16_de_sang_mai_qua_tai_dao_cu/04_afterimage.png)
- **Phân tích 5 lỗi cụ thể trên Frame `03_at_pivot.png` & `04_afterimage.png`**:

| STT | Hiện tượng lỗi trên Video | Tọa độ / Dữ liệu trong `stage_script_buggy.json` | Phân loại nguyên nhân gốc (`Data / Rule / Engine / Prompt`) |
| :---: | :--- | :--- | :--- |
| **1** | **Trùng lặp 2 đạo cụ chiếc ví trong cùng một cảnh** | Vừa có `locked_wallet_note` (`x: 214, y: -26` trên mặt bàn) vừa có `pet_wallet` (`x: 248 -> 314, y: 0` dưới đất). | **Lỗi dữ liệu JSON + Lỗi Prompt** (ghép máy móc cả "khóa ví nằm im" lẫn "ví thú cưng phản chủ"). |
| **2** | **4 vật thể cùng đỏ Chu Sa (`accent`) tại Pivot** | 1) Mặt trăng `crescent` trên trời đỏ từ `0.00s`; 2) `desk_calendar` đỏ; 3) `locked_wallet_note` đỏ; 4) `pet_wallet` đỏ. | **Lỗi Engine (`DeclarativeStagePlayer.tsx:372`)** tự gán `defaultRole = 'accent'` cho `crescent` + **Lỗi dữ liệu JSON** tô `accent` cho 3 đạo cụ cùng lúc. |
| **3** | **Nhân vật `hero` đứng dậy đi xuyên qua bàn làm việc `work_desk`** | `hero` ngồi tại `x: 158`, bàn `work_desk` đặt tại `x: 205` (rộng `44px`, từ `183..227`). Tại `"pivot"`, `hero` đi bộ từ `x: 158 -> 276`, cắt ngang qua bàn `205`! | **Lỗi quy tắc đặt cảnh + Lỗi thiếu Validator trong Engine** (`auditStageVisualLayout` không kiểm tra quỹ đạo đi bộ cắt qua bàn). |
| **4** | **Chiếc ví `locked_wallet_note` vẽ đè lên giữa ngực áo choàng đen của `hero`** | `locked_wallet_note` đặt ở `layer: "fore"`. Khi `hero` bước tới `x: 214`, ví vẽ đè lên người `hero`. | **Lỗi Engine (`DeclarativeStagePlayer.tsx:644-649`)** vẽ `fore` props đè lên `fore/mid` actors. |
| **5** | **Ví `pet_wallet` lùi về `x: 314` đè trực tiếp lên bàn chân của `beloved` (`x: 320`)** | `pet_wallet` có cue `toX: 314` tại `"line_3"`, trong khi `beloved` bước vào đứng tại `x: 320`. Khoảng cách tâm chỉ `6px` (trong khi ví rộng `30px`). | **Lỗi dữ liệu JSON + Lỗi thiếu kiểm tra `PROP_ACTOR_FOOT_OVERLAP` trong Engine**. |

---

### 2. Case Lỗi 02 — Chén 14 (`SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG` V1 vs V7): Ghế công viên thu nhỏ lệch tỷ lệ & Đạo cụ bay lơ lửng trên mặt bàn
- **Tệp nguồn & 4 Frame thực tế**:
  - JSON đầu vào bản lỗi V1 vs bản sửa V7: [`bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/stage_script_buggy.json`](bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/stage_script_buggy.json) | [`bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/stage_script_fixed_v7.json`](bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/stage_script_fixed_v7.json)
  - 4 Frame bản lỗi (`Chén 14 - Biên bản sáng thứ Hai.mp4`):
    - [`01_intro.png`](bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/01_intro.png) | [`02_pre_pivot.png`](bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/02_pre_pivot.png) | [`03_at_pivot.png`](bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/03_at_pivot.png) | [`04_afterimage.png`](bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/04_afterimage.png)
  - 4 Frame bản đã sửa V7 (`Chén 14 - Thứ 2.mp4`):
    - [`fixed_v7_frames/01_intro.png`](bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/fixed_v7_frames/01_intro.png) | [`fixed_v7_frames/02_pre_pivot.png`](bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/fixed_v7_frames/02_pre_pivot.png) | [`fixed_v7_frames/03_at_pivot.png`](bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/fixed_v7_frames/03_at_pivot.png) | [`fixed_v7_frames/04_afterimage.png`](bad/bad_02_chen_14_bien_ban_hop_v1_lech_ty_le_va_lo_lung/fixed_v7_frames/04_afterimage.png)
- **Phân tích nguyên nhân gốc**:
  - **Lỗi quy tắc đặt cảnh & thiếu đạo cụ nội thất chuẩn ở thời điểm V1**: Tác giả lấy `bench` (ghế băng công viên rộng `68px`, có tay vịn 2 bên) ép `scale: 0.68` tại `x: 206` để làm ghế ngồi cho nhân vật tại `x: 208`, khiến tay vịn và thanh ngang ghế công viên cắt ngang hông nhân vật.
  - **Lỗi tính nhẩm tọa độ `y` thủ công**: Mặt bàn `tea_table_surface` cao `-26px`, nhưng đạo cụ `kpi_chart_to_hot_bowl` đặt ở `y: -29` khiến bát bún bay lơ lửng cách mặt bàn `3px`. Trong `data/stage-scripts.json` hiện còn lưu vết 7 bản sửa liên tiếp (`SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG`, `_V2`, `_V3`, `_V4`, `_V5`, `_V6`, `_V7`) chỉ để căn lại ghế, bàn và khói bún!

---

### 3. Case Lỗi 03 — Kịch bản `SCRIPT_P032_QUYET_TAM_3_GIAY` (& Video lỗi tỷ lệ `Chén 13 - Người anh yêu.mp4`): Đạo cụ `"stool"` tàng hình, thiếu trường `type`, hộp đen `vault_lid` & Đi xuyên bàn
- **Tệp nguồn & Frame đối chiếu**:
  - JSON kịch bản lỗi trong `data/stage-scripts.json`: [`bad/bad_03_script_p032_quyet_tam_3_giay_invisible_furniture_va_hop_den/stage_script_buggy.json`](bad/bad_03_script_p032_quyet_tam_3_giay_invisible_furniture_va_hop_den/stage_script_buggy.json)
  - 4 Frame trích xuất (`01_intro.png` .. `04_afterimage.png`):
    - [`01_intro.png`](bad/bad_03_script_p032_quyet_tam_3_giay_invisible_furniture_va_hop_den/01_intro.png) | [`02_pre_pivot.png`](bad/bad_03_script_p032_quyet_tam_3_giay_invisible_furniture_va_hop_den/02_pre_pivot.png) | [`03_at_pivot.png`](bad/bad_03_script_p032_quyet_tam_3_giay_invisible_furniture_va_hop_den/03_at_pivot.png) | [`04_afterimage.png`](bad/bad_03_script_p032_quyet_tam_3_giay_invisible_furniture_va_hop_den/04_afterimage.png)
- **Phân tích 4 lỗi nghiêm trọng trong `SCRIPT_P032_QUYET_TAM_3_GIAY`**:
  1. **Lỗi Prompt/Skill Mismatch (`"type": "stool"` không tồn tại trong Catalog)**: Đạo cụ `chair` khai báo `{"id": "chair", "type": "stool", "x": 183, "y": 0}` không kèm `shapes`. Vì `"stool"` không có trong `BUILT_IN_PROP_CATALOG` lẫn `custom-props.json`, `StagePropRenderer` nhận `primaryShapes = []` và trả về `null` -> ghế hoàn toàn tàng hình, nhân vật `hero` ngồi lơ lửng trên không trung tại `x: 185`!
  2. **Lỗi dữ liệu JSON vi phạm Schema**: Hai đạo cụ `wallet` và `vault_lid` không có trường `"type"` (`type: undefined`), nếu đưa qua `StageScriptSchema.parse()` sẽ báo lỗi Zod ngay lập tức.
  3. **Lỗi thẩm mỹ & quy tắc đặt cảnh (`vault_lid` hộp đen đặc)**: `vault_lid` đặt tại `layer: "fore"` dùng `rect` với `fill: "bg", fillOpacity: 1, stroke: "primary"` tạo thành một chiếc hộp chữ nhật đặc che lên ví, và khi `hero` đứng dậy đi từ `x: 185 -> 318` tại `"pivot"`, `hero` đi xuyên thẳng qua cả bàn `tea_table` (`x: 216`) lẫn chiếc hộp `vault_lid` (`x: 212`).
