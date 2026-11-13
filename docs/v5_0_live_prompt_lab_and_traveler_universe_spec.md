# V5.0 Specification: Phòng Thí Nghiệm Prompt Trực Tiếp (`Live Prompt Lab`) & Hệ Thống "Vũ Trụ Kẻ Lữ Hành + Ký Họa Liên Tưởng"

> **Mục đích tài liệu (`V5_0_LIVE_PROMPT_LAB_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) thu gọn và nâng cấp dự án tại `/Volumes/Data/Quotes` lên **Bản V5.0 — Tinh Gọn, Trực Quan & Toàn Quyền Làm Chủ Trên UI**:
> 1. **Gỡ bỏ hoàn toàn phần sinh icon clipart rườm rà & chấm điểm VLM 5 lớp nặng nề của V4.0.**
> 2. **Khóa chuẩn Triết lý "Vũ Trụ Kẻ Lữ Hành & Ký Họa Liên Tưởng (*Hoàng Tử Bé*)":** Luôn có `<CloakedTraveler />` làm trung tâm trải nghiệm, kết hợp các vật thể/hiện tượng xung quanh **có liên tưởng trực tiếp tới bài quote** nhưng chỉ phác tối đa **3–5 nét hình học đơn giản** ở tỷ lệ thơ mộng (`0.8x–1.4x` chiều cao người) và chuyển động nhịp chậm (`2.8s–4.5s`).
> 3. **Xây dựng "Phòng Thí Nghiệm Prompt 2 Tầng (`Live Prompt Lab`)" + Ô "Chỉnh Tinh Tại Chỗ (`Live Tweak`)" ngay trên Web UI (`http://localhost:3300`):** Người dùng tự sửa Prompt Tầng 1 / Tầng 2, lưu Preset, sửa tay kịch bản chữ và bấm dựng lên `<Player>` 60fps xem ngay sau ~5 giây mà **không cần chờ xuất MP4 hay sửa code thủ công**!

## 1. Dọn Sạch Hệ Thống & Chuẩn Hóa `data/prompts.json`

1. **Dọn dẹp V4.0:**
   * Xóa thư mục `server/pipeline/` (5 lớp VLM nặng nề), `PropPreviewComposition.tsx`, `data/prop-vault.json`, và các file clipart chi tiết trong `src/kit/props/generated/` (`BoHoaHenHoProp`, `TheLuongTingTingProp` có chữ `+15.000.000đ`, `ChiecCanCoHocProp` có dấu bàn chân...).
   * **Giữ lại tinh hoa:** `CloakedTraveler.tsx`, `Atmosphere.tsx`, `SlowMotionVerbs.ts` (đã khóa `computeCoupledWalk` chống giật chân tại chỗ + nhịp chậm `levitateWeightless`, `slowEmergence`), và bộ 12 cảnh chuẩn gốc (đặc biệt là code mẫu vàng của `Chén 01` và `Chén 02`).

2. **Tạo Kho Lưu Trữ Prompt Có Thể Chỉnh Sửa Trên UI (`data/prompts.json`):**
   Lưu danh sách các `PromptPreset` để người dùng chỉnh sửa, nhân bản thành nhiều hướng thử nghiệm và khôi phục mặc định bất cứ lúc nào:

```typescript
export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  isBuiltInDefault?: boolean;
  layer1ConceptPrompt: string;     // Tầng 1: Ngôn ngữ tự nhiên 100% - Đạo diễn Ý tưởng & Phép liên tưởng
  layer2VisualRulesPrompt: string; // Tầng 2 (Phần mở trên UI): Quy tắc Mỹ thuật, Độ kiệm nét, Tỷ lệ & Nhịp điệu
  quoteWriterPrompt: string;       // Prompt cho ngăn "🍵 AI Pha Trà"
}
```

### Nội Dung Mặc Định Chuẩn Cho Preset Gốc (`"Vũ Trụ Kẻ Lữ Hành & Ký Họa Liên Tưởng"`):

* **`layer1ConceptPrompt` (Tầng 1 – Đạo Diễn Ý Tưởng & Liên Tưởng):**
```text
Bạn là Đạo diễn Kể chuyện Thị giác của kênh hoạt hình tối giản "Trà Nguội" (@tranguoi.15s).
Triết lý cốt lõi: "Vũ Trụ Siêu Thực Tối Giản Của Kẻ Lữ Hành" (tinh thần Hoàng Tử Bé & Chén 01, Chén 02).

4 QUY TẮC ĐẠO DIỄN BẮT BUỘC:
1. TRỤC NHÂN VẬT BẤT BIẾN:
   - Trong cảnh LUÔN LUÔN có Kẻ Lữ Hành Áo Choàng (1 người, hoặc thêm bóng người phụ ở xa nếu bài có sự đối lập/chia ly) đang hiện diện trên một đường mặt đất hoặc địa hình thoáng đãng. Tuyệt đối KHÔNG bày đồ vật lơ lửng không có người!
2. LIÊN TƯỞNG THÔNG MINH TỚI BÀI QUOTE (NHƯNG KIỆM NÉT):
   - Cảnh vật và 1-2 vật thể vây quanh Kẻ Lữ Hành PHẢI gợi liên tưởng trực tiếp tới hình ảnh/ý niệm trong bài quote (ví dụ: bài nhắc "danh bạ chấm xanh & cơm mẹ" -> bầu trời đêm trôi các khung bong bóng tin nhắn rỗng đính chấm xanh lạnh lẽo phía trên Kẻ Lữ Hành đang ngồi co ro, sau đó tan đi nhường chỗ cho nét phác bát cơm bốc khói ấm bên cạnh nhân vật; bài nhắc "nhìn cân thở dài & trân châu ngọt lòng" -> Kẻ Lữ Hành đứng cúi đầu trước vòm cung kim cân nghiêng nặng, sau đó kim cân tan biến để nhân vật ngồi tựa lưng thảnh thơi vào nét phác chiếc cốc lớn có 3 hạt tròn Đỏ Gạch bồng bềnh).
   - CẤM dùng chung chung một hòn đá vô nghĩa cho mọi bài, nhưng cũng CẤM tả thực chi tiết kiểu icon quảng cáo (cấm màn hình điện thoại có cột sóng/pin, cấm bàn phím laptop, cấm chữ viết hay con số tiền bạc!).
3. TỶ LỆ SIÊU THỰC HOÀNG TỬ BÉ:
   - Vật thể liên tưởng chính đặt trên mặt đất cạnh Kẻ Lữ Hành ở tỷ lệ thơ mộng (cao bằng 0.8 đến 1.4 lần chiều cao nhân vật) để nhân vật tương tác trực tiếp: ngồi tựa lưng vào nó, sưởi ấm bên nó, cõng nó, hoặc ngước nhìn nó.
4. LẬT KÈO NHỊP CHẬM TRÊN CÙNG 1 SÂN KHẤU:
   - Dù bài thơ trầm lắng hay tếu táo bẻ lái, chuyển động tại pivotWord luôn diễn ra KHOAN THAI, TỈNH BƠ (2.8s - 4.5s): các khối nặng nề ở Hồi I từ từ hóa không trọng lực bay bồng bềnh lên cao tan biến hoặc mờ lùi đi, nhường chỗ cho duy nhất 1 điểm nhấn màu Đỏ Gạch (#CE472E) ấm áp ở Hồi II & III.
```

* **`layer2VisualRulesPrompt` (Tầng 2 – Quy Tắc Mỹ Thuật & Kiệm Nét Mở Trên UI):**
```text
QUY CHUẨN MỸ THUẬT & CHUYỂN ĐỘNG KHI DỰNG CẢNH SVG/REMOTION:
1. LUẬT TỐI ĐA 5 NÉT HÌNH HỌC MỖI VẬT THỂ (EXTREME REDUCTION):
   - Mỗi vật thể liên tưởng quanh Kẻ Lữ Hành chỉ được phác bằng 3 đến tối đa 5 đường hình học cơ bản (đường thẳng, cung cong mềm Q/C, vòng tròn, khung bo góc rỗng), strokeWidth đồng nhất ~2.6 - 3.0, strokeLinecap="round".
   - TUYỆT ĐỐI CẤM thẻ <text>, cấm viết chữ/con số vào hình vẽ, cấm vẽ quá nhiều chi tiết vụn bên trong vật thể! Khoảng trống (Negative Space) phải chiếm trên 70% khung hình.
2. TỌA ĐỘ & TỶ LỆ CHUẨN TRÊN KHUNG 540x480:
   - Đường mặt đất chính đặt quanh y = 335..355 (rộng từ x = 75 đến x = 465).
   - BẮT BUỘC sử dụng component <CloakedTraveler /> có sẵn cho con người (chiều cao chuẩn ~46px, chân bám khít mặt đất, tuyệt đối không tự vẽ hình người bằng que diêm!).
   - Vật thể liên tưởng chính cao khoảng 38px - 68px đặt bám mặt đất cạnh nhân vật (cách nhân vật 25px - 45px, không đè chồng nét lên người). Nếu có hậu cảnh đối lập ("thiên hạ"), đặt tách xa tối thiểu 150px về phía bên trái với scale 0.68 và opacity 0.32.
3. CHUYỂN ĐỘNG SỐNG ĐỘNG NHƯNG KHOAN THAI (SLOW-CINEMA):
   - Chân nhân vật CHỈ bước khi tọa độ x thực sự di chuyển (dùng computeCoupledWalk). Khi đứng/ngồi một chỗ, chân giữ tĩnh hoàn toàn!
   - Luôn có chuyển động vi mô nhẹ nhàng từ giây 0 -> 15 (gió lướt, khói chữ S bay lên, bong bóng trôi chậm, nhịp nghiêng thân từ cúi gồng sang ngả lưng thư thái qua state.beat2SettleGlow và state.beat3LingeringWalk).
   - Chỉ dùng palette.inkPrimary, palette.inkSecondary (và chấm xanh dịu #4E9F76 nếu bài nói rõ 'chấm xanh'), còn màu Đỏ Gạch palette.accent dành riêng cho linh hồn cú chuyển ở Hồi II & III!
```

## 2. Kiến Trúc Tương Tác 2 Tầng + `Live Tweak` (`server/directorLabService.ts`)

Xây dựng `server/directorLabService.ts` gọn nhẹ, tốc độ phản hồi nhanh (không chụp ảnh chấm điểm VLM lê thê):

1. **API Quản lý Prompt Presets:**
   * `GET /api/prompts`: Trả về danh sách Presets và `activePresetId`.
   * `POST /api/prompts/save`: Cập nhật hoặc tạo mới một `PromptPreset` từ giao diện Web UI.
   * `POST /api/prompts/reset-default`: Khôi phục Preset gốc bất cứ lúc nào.

2. **API Tầng 1 – Phác Thảo Ý Tưởng (`POST /api/director/ideate` – ~2–3 giây):**
   * Nhận `{ cupId, quoteSegments, title, textFormat, pivotWord?, userDirectionHint?, layer1PromptOverride? }`.
   * Gọi LLM với `layer1ConceptPrompt`, trả về JSON kịch bản tiếng Việt ngắn gọn dễ đọc:
     ```typescript
     export interface ConceptStoryboard {
       pivotWord: string;
       associativePropsSummary: string; // Ví dụ: "Bầu trời bong bóng chat chấm xanh lạnh -> Bát cơm 3 nét bốc khói Đỏ Gạch cạnh Kẻ Lữ Hành"
       act1Setup: string;
       act2SlowTwist: string;
       act3Afterimage: string;
       suggestedSceneId: string;
     }
     ```
   * Lưu `storyboard` này vào bản ghi của Chén trong `data/cups.json` để hiển thị trên các ô soạn thảo của UI.

3. **API Tầng 2 – Dựng Cảnh Lên Live `<Player>` (`POST /api/director/build-scene` – ~5–6 giây):**
   * Nhận `{ cupId, storyboard, layer2PromptOverride? }` (lưu ý: `storyboard` có thể đã được người dùng tự tay sửa chữ trên UI!).
   * Ghép `layer2VisualRulesPrompt` (phần người dùng sửa được trên UI) + **Phần Khung Kỹ Thuật Khóa Ngầm** (bao gồm interface `ArchetypeComponentProps`, hướng dẫn dùng `CloakedTraveler`, `Atmosphere`, `SlowMotionVerbs`, và **đính kèm nguyên văn code chuẩn của `Chén 01` & `Chén 02` làm Few-Shot Exemplars** để LLM học chính xác mật độ nét vẽ kiệm chữ!).
   * Ghi file `src/scenes/custom/<ComponentName>.tsx`, kiểm tra nhanh `npx tsc --noEmit` (nếu có lỗi biên dịch TypeScript thì tự gọi LLM sửa 1 vòng trong 2s), cập nhật `src/scenes/vaultIndex.ts` và `data/vault-meta.json`, gán `sceneId` mới cho Chén.
   * **Cập nhật tức thì lên `<Player>` không cần Render MP4:** Nhờ `studio-ui` import trực tiếp `vaultIndex.ts`, Vite HMR tự động nạp cảnh mới lên `<Player>` ngay trên trình duyệt chỉ sau 0.5 giây!

4. **API Chỉnh Tinh Tại Chỗ (`POST /api/director/tweak-scene` – ~3–4 giây):**
   * Nhận `{ cupId, sceneId, tweakInstruction }` (ví dụ: *"Cho chiếc cốc nhỏ đi 20%, dịch sang phải một chút và thêm 2 cánh chim xa"*).
   * Đọc nội dung file `.tsx` hiện tại của `sceneId`, gửi kèm `tweakInstruction` và `layer2VisualRulesPrompt` cho LLM sửa trực tiếp file đó $\rightarrow$ kiểm tra `tsc --noEmit` $\rightarrow$ Vite HMR tự động làm mới `<Player>` ngay trước mắt người dùng!

5. **API Chạy Trọn Gói 1 Chạm (`POST /api/director/auto-direct`):**
   * Chạy nối tiếp Tầng 1 $\rightarrow$ Tầng 2 trong 1 lần bấm khi người dùng không cần dừng lại sửa kịch bản chữ.

## 3. Giao Diện Điều Khiển Trực Quan Trên `studio-ui/`

Nâng cấp giao diện Web tại `http://localhost:3300` để trải nghiệm thử nghiệm Prompt mượt nhất:
1. **Nút & Ngăn "🎛️ Phòng Thí Nghiệm Prompt (`Prompt Lab`)" trên Thanh Topbar:**
   * Chọn Preset đang áp dụng, tạo Preset thử nghiệm mới, nút *"Khôi phục Mặc định"*.
   * Có 3 Tab soạn thảo lớn rõ ràng: **[Tầng 1: Prompt Đạo Diễn Ý Tưởng]**, **[Tầng 2: Prompt Mỹ Thuật & Kiệm Nét]**, và **[Prompt AI Pha Trà (Viết Thơ)]**. Sửa xong bấm *Lưu* (hoặc bấm *Lưu & Chạy thử ngay trên Chén đang mở*).
2. **Khu Vực Đạo Diễn 2 Bước + `Live Tweak` ngay ở Cột Giữa (`StoryDirectorDesk.tsx`):**
   * Ô nhập nhỏ tùy chọn: *"💡 Gợi ý riêng cho bài này (Tùy chọn — VD: Cho nhân vật ngồi dưới gốc cây bàng mùa đông)"*.
   * Cụm nút đôi: **[1. Nghĩ Ý Tưởng (Tầng 1)]** — **[2. Dựng Lên Màn Hình (Tầng 2)]** — kèm nút nhanh **[⚡ Chạy Tự Động 1+2]**.
   * Hiển thị **4 ô Textarea Kịch bản Chữ** (`Vật thể liên tưởng`, `Hồi I`, `Hồi II tại Pivot`, `Hồi III`): người dùng có thể gõ sửa trực tiếp bất kỳ chữ nào trong kịch bản của AI trước khi bấm nút số `[2. Dựng Lên Màn Hình]`!
   * Ngay dưới khung kịch bản (hoặc dưới `<Player>` Cột Phải): **Thanh `💬 Chỉnh Tinh Cảnh Đang Xem (Live Tweak)`** — nhập câu lệnh ngắn chỉnh kích thước/tọa độ/chuyển động rồi bấm Enter là 3 giây sau `<Player>` tự đổi!

## 4. Kiểm Chứng Trước Khi Bàn Giao

Sau khi hoàn tất code V5.0 và đảm bảo `npm run typecheck` sạch 100%:
1. Chạy lại `auto-direct` (Tầng 1 + Tầng 2 với Preset mặc định mới) trên 3 bài `CHÉN 04 — ẤM`, `CHÉN 05 — ĐỦ ẤM`, và `CHÉN 06 — BÙ ĐẮP` để đảm bảo cả 3 bài đều tuân thủ đúng chuẩn **"Luôn có Kẻ Lữ Hành + Vật thể liên tưởng phác <= 5 nét ở tỷ lệ Hoàng Tử Bé + Nhịp chậm khoan thai"**.
2. Xuất sẵn 3 file preview `quote-004.mp4`, `quote-005.mp4`, `quote-006.mp4` để đối chiếu và giữ server `npm run app` (`http://localhost:3300`) chạy ổn định sẵn sàng cho người dùng vào trực tiếp sửa Prompt và test trên `<Player>`!
