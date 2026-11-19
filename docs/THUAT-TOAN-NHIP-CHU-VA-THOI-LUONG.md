# Thuật Toán Nhịp Hiện Chữ Trọng Số Âm Tiết & Thời Lượng Đàn Hồi (PA-B)

> Tài liệu chuẩn cho mọi agent và người điều phối Trà Nguội Studio. Áp dụng thực tế trong code từ nền tảng nghiên cứu `docs/nghien-cuu/Nghiên Cứu Tốc Độ Hiện Chữ Thị Giác & Thời Lượng Động Theo Khung Quote — Trà Nguội Studio.md` (`TNS-RES-TYPO-ELASTIC-V1.0`) và `TNS-RES-STAGE-LIGHT-PROPS-V1.0`.

## 1. Phạm vi & Nguồn chân lý trong code

- **Tính nhịp & thời lượng đàn hồi**: `src/engine/timelineSync.ts` (`computeTimelineSync`, `computeDynamicDurationFrames`, `AUTO_PACING_PROFILES`, `resolveAutoPacingProfile`, `classifyElasticDurationBand`, `isLegacyTimingCup`).
- **Hiệu ứng thấm mực hiển thị**: `src/components/AdaptiveTypography.tsx` (Remotion/Studio) và `scripts/stage-preview.mjs` (Director Preview).
- **Lượng tử hóa chu kỳ ánh sáng / hạt bụi theo thời lượng**: `src/components/MinimalistBackground.tsx`.
- **Hiển thị Studio UI**: `studio-ui/src/components/StoryDirectorDesk.tsx` (tự động hoàn toàn, không thêm nút chỉnh tốc độ đọc).

## 2. Cơ chế hoạt động (căn tự động 100%)

### 2.1. Ba hồ sơ tốc độ đọc tự động (`AUTO_PACING_PROFILES`)
Engine tự chọn hồ sơ theo `props.motion.pacingMode` và `props.textFormat`:

| Hồ sơ (`pacingProfileId`) | Điều kiện tự động | Thấm mực (`tFade`) | Đệm mắt (`tAnchor`) | Trọng số âm (`tauSyl`) | Nghỉ dấu câu / khổ (`tPausePunct`) | Nín thở trước Pivot (`tPrePivot`) | Hậu vị Hồi 2–3 (`tDwell`) |
|---|---|---:|---:|---:|---:|---:|---:|
| `CONTEMPLATIVE_POEM` | `CONTEMPLATIVE` + `POEM` *(mặc định)* | `0.95s` | `0.50s` | `0.32s/âm` | `+0.30s` | `+0.50s` | `4.50s` |
| `LITERARY_PROSE` | `CONTEMPLATIVE` + `PROSE` | `0.85s` | `0.45s` | `0.30s/âm` | `+0.30s` | `+0.45s` | `4.60s` |
| `WRY_BATHOS` | `WRY_BATHOS` *(Hài / Công sở)* | `0.65s` | `0.38s` | `0.24s/âm` | `+0.25s` | `+0.40s` | `3.60s` |

### 2.2. Phương trình nhịp giãn cách từng nhịp (`beat`)
Trước khi tính thời gian, engine gom `segments[]` thành các **nhịp (`beat`)** theo 2 ký hiệu nhịp (TF6):
- `"+"` đầu dòng = **nối nhịp** (cùng `beatIndex` với dòng trên → âm tiết được cộng dồn vào đúng nhịp đó).
- `" / "` giữa dòng = **tách nhịp** (vế sau sang `beatIndex + 1`, vẫn nằm trên cùng dòng hiển thị).
- Ký hiệu bị gỡ hoàn toàn khỏi video, ảnh bìa, caption và tên file (`stripBeatMarkers` / `stripInlineMarkdown`).

Khoảng giãn cách từ lúc bắt đầu **Nhịp `b`** đến lúc bắt đầu **Nhịp `b + 1`**:

$$\Delta t_b = \max\!\Big(t_{\text{fade}} + 0.15,\; t_{\text{anchor}} + N_{\text{syl}, b} \times \tau_{\text{syl}} + t_{\text{pause}, b}\Big)$$

Trong đó:
- Nhịp đầu tiên bắt đầu tại `STAGE_LEAD_IN_SECONDS = 0.35s` (frame `21` @ 60fps).
- `N_syl,b`: tổng số âm tiết tiếng Việt trong nhịp `b` (gồm cả dòng nối bằng `+`).
- `t_pause,b`: cộng `tPausePunct` nếu nhịp `b` kết thúc bằng dấu kết ý (`. ! ? … : ;`) hoặc có dòng trống ngắt khổ sau nó; cộng thêm `tPrePivot` nếu nhịp `b + 1` chứa `pivotWord`.
- Mốc kịch bản `line_N` = lúc dòng hiển thị `N` bắt đầu hiện (nhịp đầu của dòng).
- Mốc `pivotFrame` tính bên trong đúng nhịp chứa `pivotWord` theo vị trí ký tự `charRatio` (`readDelay ∈ [0.35s, 1.35s]`) và luôn chừa ít nhất `3.0s` hậu vị trước hết video.

### 2.3. Hiệu ứng thấm mực `Ease-Out Cubic`
- Với mọi Chén mới (`!sync.isLegacyTiming`), `AdaptiveTypography.tsx` và `stage-preview.mjs` dùng **`Easing.out(Easing.cubic)`** trên đúng `[chunk.startFrame, chunk.startFrame + fadeDurationFrames]` (`0.65s / 0.85s / 0.95s`).
- Chữ đạt `> 75%` độ rõ ngay trong `~0.30s` đầu để bảo toàn vùng nhìn ngoại vi `14–15` ký tự (*Rayner et al., 2010*) trong khi đuôi mực tiếp tục lắng êm.

### 2.4. Bốn Dải Thời Lượng Đàn Hồi (`8.5s – 24.0s`)
Khi `durationMode === 'AUTO_SEED'` (mặc định mọi Chén mới, Gói Chén và Làn tự do):

$$T_{\text{raw}} = 0.35 + \sum \Delta t_b + T_{\text{lastRead}} + T_{\text{author}} + t_{\text{dwell}} + 0.80$$

- `T_lastRead = max(tFade, 0.6 × tAnchor + N_syl,last × tauSyl)`; `T_author = 0.45s` nếu có `props.author`.
- Kẹp trong `[8.5s, 24.0s]`, làm tròn bội `0.5s` (`30f @ 60fps`). Nếu rơi đúng `15.0s` (`900f`), tự dịch `14.5s` hoặc `15.5s` theo `hashCupSeed` để né mốc cứng 900f.
- Nếu `T_raw > 24.0s` (hoặc người dùng tự đặt `durationMode: 'FIXED'` ngắn hơn `T_raw`), engine co đều tỷ lệ các `Δt_b` sao cho vẫn giữ nguyên nhịp tương đối dài/ngắn giữa các dòng và bảo toàn tối thiểu `3.8s` hậu vị (`AUTO_SEED`) / `≥ 2.8s` (`FIXED`).

| Dải (`durationBand`) | Biên độ thời lượng | Đặc trưng nội dung | Vùng `effectiveCps` mục tiêu |
|---|---|---|---|
| `BAND_S` (Chớp vị) | `8.5s – 11.5s` | Quote cực ngắn, châm ngôn 1–2 dòng (`6–13` âm) | `8.5 – 12.5 CPS` |
| `BAND_M` (Chuẩn Thơ) | `12.0s – 16.0s` | Thơ 3–4 dòng, chơi chữ công sở (`14–28` âm) | `8.5 – 13.5 CPS` |
| `BAND_L` (Tự sự) | `16.5s – 19.5s` | Thơ 5–6 dòng hoặc nối/tách nhịp sâu (`26–42` âm) | `8.5 – 12.5 CPS` |
| `BAND_XL` (Văn học) | `20.0s – 24.0s` | Tản văn/trích dẫn nguyên tác 6–8 dòng + tác giả | `10.5 – 13.0 CPS` |

## 3. Lượng tử hóa chu kỳ ánh sáng & bụi giấy (`MinimalistBackground.tsx`)
Để bảo toàn tuyệt đối điểm nối vòng lặp `frame[0] === frame[end]` mà không bị nhanh gắt ở `8.5s` hay đông cứng ở `24.0s`, số chu kỳ dao động `K` là số nguyên dương tính theo thời lượng thực `durationSec`:
- Gobo chính `w1`: `kGobo1 = max(1, round(durationSec / 12.0))` (khi `kGobo1 ≥ 2` giảm biên độ `25%`).
- Gobo phụ `w2`: `kGobo2 = max(2, round(durationSec / 6.0))`.
- Nhịp thở chấm đỏ Header: `kBreath = max(2, round(durationSec / 3.9))`.
- Bụi giấy `motes`: nhân hệ số nguyên `moteHarmScale = max(1, round(durationSec / 14.0))`.

## 4. Quy tắc bảo toàn & Lưu ý cho các agent khác
1. **Bảo toàn 7 Chén đã đóng băng (`quote-001..quote-007`)**: `isLegacyTimingCup()` trả `true` khi `id` thuộc `quote-001..quote-007` và không bật `AUTO_SEED` → giữ nguyên 100% nhịp chia đều cũ (`≤ 5.85s`, `fade 1.05s`, `Easing.inOut(Easing.sin)` + `0.35s`), không lệch 1 frame nào.
2. **Không hardcode `15s` hay `pivot ∈ [5.5s, 9.5s]`**: mọi công cụ kiểm tra, validator, preview, UI phải đọc trực tiếp `timeline.durationInFrames`, `timeline.pivotFrame`, `timeline.fadeDurationFrames`, `timeline.durationBand` và `timeline.effectiveCps` từ `computeTimelineSync()`.
3. **Kịch bản sân khấu (`tu_do` & Gói Chén)**: luôn neo timeline cue theo mốc tương đối (`"start"`, `"line_1"`, `"line_2"`, `"line_3"`, `"line_4"`, `"pivot"`, `"end"` + `±Xs`) thay vì giây tuyệt đối cứng để tự khớp trên cả 4 dải `8.5s–24.0s`.
