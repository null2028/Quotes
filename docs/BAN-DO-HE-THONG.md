# Bản Đồ Hệ Thống — Trà Nguội Studio

> Tài liệu chuẩn cho người điều phối và mọi agent. Cập nhật ngay khi có task thay đổi hành vi.

## 1. Luồng xử lý chính & Luồng cũ chạy song song

```text
[LUỒNG MỚI — 2 làn chính thức]
  (A) Gói Chén ngữ nghĩa (`phien_ban_goi: 1`, lối tắt cảnh đơn giản)
    ├── CLI: scripts/check-goi.mjs · scripts/stage-preview.mjs ──► parseGoiChen() [src/stage/goiChenParser.ts]
    └── Studio UI: GeminiBundleImportModal ──► convertGoiChenToBundle() [src/automation/geminiBundleBridge.ts]
          │ (lưu nguyên văn `goiChenGoc` + gọi `parseGoiChen`)
          ▼
    compileSemanticStageScript() [src/stage/semanticStage.ts]
      (autoScale cỡ Lữ khách 0.28, xếp vị trí từ slot/neo, dựng lớp nền `boi_canh.bo`, gắn tag `semantic_v1`)
  (B) Làn tự do (`che_do: "tu_do"`, TF1 — toàn quyền StageScript: shapes/altShapes/drawProgress/toạ độ/timeline)
    ├── CLI: scripts/check-goi.mjs <file> [sceneId] (tự nhận dạng) ──► validateFreeModeStageScript()
    └── Studio UI: GeminiBundleImportModal ──► sanitizeAndNormalizeCupBundle() (lưu nguyên văn `scriptGoc`)
          ▼
    validateSemanticStageScript() + validateStageScriptHard() [src/stage/stageValidator.ts]
      (Gói Chén: chặn cứng đầy đủ; Làn tự do: CHỈ kiểm vỡ hình mỗi 0.25s — chặn cứng 1 vật đỏ/tràn khung, cảnh báo vàng đè/lơ lửng/ngồi/cỡ/vật đỏ nhỏ kèm `t`)
          ▼
    QuoteVideoComposition [src/compositions/QuoteVideoComposition.tsx]
      ├── computeTimelineSync()        [src/engine/timelineSync.ts]    (mốc dòng chữ, pivotFrame, cover, loop)
      ├── resolveVisualDNA()           [src/engine/visualDnaResolver.ts] (4 trục + gobo + horizonOffset + motes)
      ├── MinimalistBackground         [src/components/MinimalistBackground.tsx] (giấy trà, gobo, hạt bụi, header)
      ├── MotionStageRouter            [src/components/MotionStageRouter.tsx]
      │     └── DeclarativeStagePlayer [src/stage/DeclarativeStagePlayer.tsx]
      │           └── evaluateStageScriptAtFrame() [src/stage/trackCompiler.ts] (mở màn, cue, đẩy máy, camera)
      ├── AdaptiveTypography           [src/components/AdaptiveTypography.tsx] (chữ thấm mực, tô đỏ chữ lật)
      └── BgmController + foleyEngine  [src/components/BgmController.tsx, src/engine/foleyEngine.ts]
          ▼
    Render: Studio (`server/renderQueueService.ts`) / Remotion CLI (`npx remotion render`) / `scripts/stage-preview.mjs`

[LUỒNG CŨ CHẠY SONG SONG]
  1. 51 StageScript đóng băng (`data/stage-scripts.json` + `LEGACY_SCENE_IDS` trong `src/stage/legacySceneIds.ts`):
     `resolveStageScript()` giữ `legacy: true`, đọc `data/custom-props.json`, bypass `validateStageScriptHard()`.
  2. 12 cảnh React gốc + `CUSTOM_*.tsx` (`src/scenes/vaultIndex.ts`): khi `resolveStageScript()` trả `null`,
     `MotionStageRouter` rẽ nhánh `else` bọc `cameraScale`/`cameraPanY` từ `motionPhysics.ts`.
  3. 6 Archetype gốc (`src/archetypes/`): fallback khi không có `sceneId`/`stageScript`.
  4. JSON Gemini cũ (`!isGoiChen`): `geminiBundleBridge.ts` chạy `sanitizeAndNormalizeCupBundle()` (kèm banner "Định dạng cũ").
```

---

## 2. Bảng cơ chế (25 cơ chế)

| # | Tên cơ chế | Làm gì | File chính | Bật khi nào | Hằng số chính | Có thể xung đột với |
|---|---|---|---|---|---|---|
| 1 | Visual DNA · Trục 1 Bố cục (`layout`) | Chọn vị trí khung hình & khối chữ: **Gói Chén (`semantic_v1`)** mặc định `CLASSIC_TOP_STAGE`, chỉ đổi khi Gói Chén khai báo `bo_cuc` (`co_dien` \| `chan_may` \| `khung_cua`), seed không đổi bố cục; **Legacy/non-semantic** xoay theo seed | `src/engine/visualDnaResolver.ts`, `semanticStage.ts` | Gói Chén: theo `bo_cuc` (mặc định `co_dien`); non-semantic: theo seed | `SEMANTIC_LAYOUTS` (3 giá trị), non-semantic: `ASYMMETRIC_THIRD_MAX_SYLLABLES=28` | Không còn xung đột với Gói Chén |
| 2 | Visual DNA · Khung vòm (`WINDOW_ARCH`) | Vẽ 1 vòm cung nét mảnh tĩnh ngoài `cameraTransform` khi `layout='WINDOW_FRAME'` | `DeclarativeStagePlayer.tsx`, `visualDnaResolver.ts` | Gói Chén: **chỉ bật khi `bo_cuc: "khung_cua"`** (kể cả khi có `boi_canh.bo`); Legacy: khi `WINDOW_FRAME` & không có `bo` | `d="M 122 362...A 148 114..."`, `opacity 0.82` | Không còn tự chèn vòm ngẫu nhiên |
| 3 | Visual DNA · Trục 2 Gobo ánh sáng (`lightingGobo`) | Phủ vệt sáng/bóng nền: **Gói Chén** mặc định `'NONE'`, chỉ bật khi khai báo `anh_sang` (`bong_la` \| `nan_cua` \| `den_long` \| `suong_hien`); **Legacy/non-semantic** xoay theo seed (tắt khi `isLegacyLocked` / có `bo`) | `MinimalistBackground.tsx`, `visualDnaResolver.ts`, `semanticStage.ts` | Gói Chén: theo `anh_sang` (mặc định tắt); non-semantic: seed | `SEMANTIC_LIGHTINGS` (4 giá trị) | Không còn xung đột với luật khí quyển mặc định tắt |
| 4 | Visual DNA · Trục 3 Chế độ quay (`shotMode`) | **Gói Chén (`semantic_v1`)** luôn cố định `'SOLID_SCENE'` (seed không xoay); **non-semantic** xoay `SOLID_SCENE`, `BRUSH_DRAW` (1.12×), `MACRO_PROP` (zoom ≤ 1.52× + mờ nhân vật 14%) | `visualDnaResolver.ts`, `trackCompiler.ts` | Gói Chén: luôn `'SOLID_SCENE'`; non-semantic: seed | `timeScale=1.12`, `macroZoom<=1.52`, `actorOpacity*0.14` | Không còn xung đột với Gói Chén |
| 5 | Visual DNA · Trục 4 Cơ chế cú lật (`pivotMechanic`) | Biến đổi camera/ánh sáng quanh pivot: `ACCENT_PUSH_IN` (+4.8%), `PULLBACK_REVEAL`, `PARALLAX_DRIFT`, `SPOTLIGHT_DIM` | `visualDnaResolver.ts`, `trackCompiler.ts` | Chỉ chạy trên script **non-`semantic_v1`** không `isLegacyLocked` (T8-DNA-a đã tắt trên Gói Chén) | `autoPush 1.048`, `pullback 1.065→0.98`, `panDrift 9.5`, `spot 0.36` | Không còn xung đột với Gói Chén |
| 6 | Visual DNA · Chống trùng (`horizonOffsetPx`, bụi giấy, vignette) | Seed **chỉ đổi chi tiết chống trùng không đổi nghĩa**: dịch chân trời `terrain.y` ±8.1px (`horizonOffsetPx * 0.45`), 14 hạt bụi giấy, tâm vignette động; cùng `visualDNA` truyền vào cả render lẫn validator | `visualDnaResolver.ts`, `trackCompiler.ts`, `stageValidator.ts`, `goiChenParser.ts` | Mọi Chén không `isLegacyLocked` (bằng `0` nếu `isLegacyLocked`) | `autoHorizon ∈ [-18, +18]`, `14` motes, `y ∈ [305, 368]` | Không còn lệch tọa độ với validator (T8-DNA-b) |
| 7 | Thời lượng động (`durationMode`) | `AUTO_SEED` chọn 13.5–16.5s (bước 0.5s, bỏ 15.0s) theo âm tiết & seed `id`; `FIXED` dùng `targetDurationSeconds` (15s) | `src/engine/timelineSync.ts`, `goiChenParser.ts`, `scripts/check-goi.mjs`, `scripts/stage-preview.mjs` | Gói Chén thống nhất `AUTO_SEED` ở cả Studio, `check-goi` và `stage-preview` (CLI in ra thời lượng đang dùng) | `<18 âm: 810..870f`, `18–28: 840..960f`, `>28: 930..990f` | Đã đồng bộ 100% CLI & Studio (T8-DNA-b) |
| 8 | Nghi thức Mở màn (`semantic_v1` / Legacy) | `semantic_v1`: đất trái→phải đúng `0.9s` (`openingTerrainProgress`) → nền `far` → đạo cụ `mid` (chủ trước con) → nhân vật cuối. Legacy: 4 pha V8.6.1 | `src/stage/trackCompiler.ts`, `DeclarativeStagePlayer.tsx` | Mặc định cho mọi `semantic_v1` (trừ vật có `enterAt` / `xuat_hien`) | `MO_MAN_TERRAIN=0.9s`, `PROP=0.4s`, `STAGGER=0.2s`, `ACTOR=0.5s`, `MAX=2.5s` | Đã tách khỏi `motionPhysics.drawProgress` (T8-DNA-a) |
| 9 | Kiểu cú lật & Camera cú lật (`kieu_cu_lat`) | MỘT bộ điều khiển camera duy nhất cho Gói Chén: `day_may` (mặc định, đẩy 2.0s ≤ 2.2×), `xuat_hien` (vẽ nét ở pivot rồi đẩy nhẹ), `keo_rong` (mở cận 1.55× → lùi 1.0×), `dung_lang` (tĩnh 100%) | `trackCompiler.ts`, `semanticStage.ts`, `stageValidator.ts` | Do Gói Chén khai báo `kieu_cu_lat` (mặc định `day_may`); đã bỏ cue `zoom=1.14` cũ | `PIVOT_PUSH_DUR=2.0s`, `MAX_ZOOM=2.2`, `MIN_ZOOM=1.1`, `keo_rong start=1.55` | Không còn chồng với Trục 4 hay loopBlend |
| 10 | Cỡ nhân vật cố định & Tự căn khung | Lữ khách đứng cao cố định 28% vùng hình (`scale=1.40`); chỉ thu nhỏ tối thiểu 0.75× nếu cảnh quá rộng; căn giữa X=270 | `src/stage/semanticStage.ts`, `stageConstants.ts` | Mặc định mọi Gói Chén (`compileSemanticStageScript`) | `LU_KHACH_HEIGHT_RATIO=0.28`, `MIN_SHRINK=0.75`, `TOP_MARGIN=0.12`, `TY_LE_CANH=0.32`, `HE_SO_PHONG_DAI=2.0` (<30cm) | `stageTuning.scale` (UI), `visualDNA.layout` hẹp (`ASYMMETRIC_THIRD`) |
| 11 | Nhịp Trà Nguội (`TEMPO`) | Quy định thời lượng tối thiểu từng cử chỉ, số chuyển động tối đa, tỷ lệ động ≤ 40%, nhịp thở tĩnh, dáng `guc`/`guc_sau` | `stageConstants.ts`, `semanticStage.ts`, `stageValidator.ts` | Mặc định mọi `semantic_v1` | `MIN_LEAN=2.0s`, `LOOK=1.2s`, `WALK=2.0s`, `MAX_MOTION_RATIO=0.4`, `MAX_MAJOR=4`, `PIVOT_DELAY>=0.4s` | Thời lượng ngắn (`13.5s`) dễ làm cảnh báo giãn/vượt tỷ lệ động |
| 12 | 9 Bộ bối cảnh (`boi_canh.bo`) & Địa hình (`dia_hinh`) | Tự dựng lớp nền `nen`/`far` nét mảnh (~36–44%) quanh nhân vật; vẽ 6 loại địa hình (`nga_re` góc ≤ 12° + biển 2 mũi tên, `doan_duong` dải đỏ) | `semanticStage.ts`, `terrainSystem.ts`, `DeclarativeStagePlayer.tsx` | Do Gói Chén khai báo `boi_canh.bo` / `dia_hinh` / `doan_duong` | 9 bộ chuẩn, `forkAtX=232`, `forkAngleDeg=-9`, `renderTerrain` kéo dài khi `zoom>1.02` | `PARALLAX_DRIFT`, che vật đỏ > 50% (validator chặn) |
| 13 | Khí quyển (`Atmosphere`) | Vẽ mưa, gió, lá, khói, chim, trăng/mặt trời, vòng sóng | `src/kit/Atmosphere.tsx`, `DeclarativeStagePlayer.tsx`, `semanticStage.ts` | Mặc định TẮT; chỉ bật khi Gói Chén khai báo `boi_canh.khi_quyen` | 9 loại `AtmosphereTypeEnum` | `lightingGobo` (nếu không có `boi_canh.bo`) |
| 14 | Luật vật đỏ duy nhất & Ngưỡng diện tích | Đúng 1 vật đỏ tại cú lật, giữ đỏ đến hết, cùng dáng bản thường, không bị che > 50%, diện tích sau đẩy máy ≥ ngưỡng | `stageValidator.ts`, `propCatalog.tsx`, `stageConstants.ts` | Mặc định mọi kịch bản mới (`strictValidation`) | `MIN_RED_AREA_PX2=2000`, `RED_PIVOT_FILL_OPACITY=0.7`, `IoU>=0.98`, `Δbox<=0.12` | `seamlessLoopBlend` làm mờ đỏ về đen ở 1.5s cuối |
| 15 | Nét mực không phình theo zoom (`zoomStroke`) | Chia `strokeWidth` cho `cam.zoom` và `scale^0.78` để nét Lữ khách & đạo cụ mảnh đồng nhất mọi tỷ lệ | `DeclarativeStagePlayer.tsx`, `CloakedTraveler.tsx`, `propCatalog.tsx` | Mặc định toàn bộ stage engine | `INK_BASE=2.6`, `INK_SCALE_POWER=0.78`, `PROP_FINE_STROKE=1.35`, `WASH=0.13` | `TerrainRenderer.fineHorizonStrokeWidth` cố định `1.15–1.28` (không chia `cam.zoom`) |
| 16 | Validator chặn cứng, Làn tự do (`tu_do`) & Khóa legacy | **Gói Chén**: chặn cứng đầy đủ (tên/neo/va chạm/lơ lửng/nhịp/vật đỏ). **Làn tự do (`che_do: "tu_do"`, TF1)**: bỏ TEMPO/cử chỉ/kho, quét mỗi `0.25s` chỉ kiểm vỡ hình — **chặn cứng** không đúng 1 vật đỏ (gồm cả `teaCupRed`/khói đỏ/`atmosphere` accent/`leaves`) & tràn tiêu đề/chữ; **cảnh báo vàng** (kèm `timeSec`) đè/xuyên, lơ lửng > 3px, ngồi không mặt ngồi, cỡ Lữ khách lệch > 25%, vật đỏ cuối < `MIN_RED_AREA_PX2`. **Legacy**: 51 cảnh `LEGACY_SCENE_IDS` miễn kiểm | `stageValidator.ts`, `legacySceneIds.ts`, `DeclarativeStagePlayer.tsx`, `goiChenParser.ts`, `scripts/check-goi.mjs` | Mặc định bật; rẽ nhánh `tu_do` khi `che_do === "tu_do"`; tắt khi `legacy: true` | `VALIDATION_SAMPLE_STEP_SEC=0.25`, `MIN_RED_AREA_PX2=2000`, `LU_KHACH_HEIGHT_RATIO=0.28` (±25%), `51` legacy IDs | Không còn mượn `legacy: true` cho cảnh sáng tạo tự do (TF1) |
| 17 | Vật lý chuyển động chung (`motionPhysics`) | Tính `drawProgress` (2.2s vẽ + 1.35s tắt), `seamlessLoopBlend` (1.5s), `beat1/2/3`, `cameraScale`/`cameraPanY` di sản | `src/engine/motionPhysics.ts` | Chạy mọi frame cho cả luồng cũ & mới | `horizonDraw=2.2s`, `outroDissolve=1.35s`, `loopWindow=1.5s`, `68 BPM` | Đè thời lượng vẽ đất `0.9s` của T7c (`Math.min(drawProgress, openingTerrainProgress)`) |
| 18 | Kết vòng lặp cuối video | **Gói Chén (`semantic_v1`)**: KHÔNG phai vật đỏ về mực; 0.8s cuối cả vùng hình mờ dần về giấy (`stageOutroOpacity 1→0`), **chữ giữ nguyên** để khớp khung đầu giấy trống. **Legacy**: hòa về `frame 0` (`1.5s`) + chữ tan (`0.8s`) | `DeclarativeStagePlayer.tsx`, `AdaptiveTypography.tsx`, `MinimalistBackground.tsx` | Mặc định mọi video (tách nhánh `semantic_v1` vs Legacy từ T8-DNA-a) | `outroFade=0.8s` (stage `semantic_v1`), `loopWindow=1.5s` (legacy) | Đã gỡ xung đột với luật giữ vật đỏ (validator đo tại `fBeforeFade`) |
| 19 | Typography, tách chữ lật & thanh đỏ dọc | Hiện từng dòng thấm mực từ `0.35s`, tô đỏ `pivotWord` tại `pivotFrame`, giữ nguyên khối đứng yên, tự co nếu tràn Safe Zone | `AdaptiveTypography.tsx`, `timelineSync.ts` | Mặc định mọi video | `STAGE_LEAD_IN=0.35s`, `fade=1.05s`, `baseFont=42px` (`0.88–1.15×`), `marginLeft=132px` | `layout` thay đổi `typographyTop`/`quoteBlockWidth` |
| 20 | Header tập tự tan mực theo Ảnh Bìa | Hiện `CHÉN XX — TÊN` sắc nét qua `recommendedCoverFrame`, tan hoàn toàn trước `pivotFrame`, hồi lại ở loop | `MinimalistBackground.tsx`, `timelineSync.ts` | Mặc định mọi video | `holdAfterCover=0.3s`, `dissolve=0.55–0.8s` | Không có (độc lập lớp nền) |
| 21 | Âm thanh Foley & BGM (`-14.0 LUFS`) | Tổng hợp WAV stereo tiếng cọ/giấy theo từng dòng + âm điểm lật (`TEA_CUP`/`WIND_CHIME`/`WOOD_SEAL`/`AUTO`) | `src/engine/foleyEngine.ts`, `src/components/BgmController.tsx` | Mặc định `PIVOT_ACCENT` (Studio Gói Chén ép `FOLEY_MASTER`); tắt bằng `TIKTOK_SILENT` | `TARGET_INTEGRATED_LUFS=-14.0`, `48kHz`, `debounce=380ms` | Không có |
| 22 | Tinh chỉnh thủ công UI (`stageTuning`) & Cắt khung sân khấu (`clipPath`) | 4 thanh trượt X/Y/Scale/Stroke; với Gói Chén khoá `offsetX/offsetY/scale` (`0/0/1`, ghi `"cỡ do engine quyết"`), chỉ giữ `strokeScale`; cắt cứng vùng sân khấu (`overflow: hidden` + SVG `<clipPath>` `[0,126,540,250]`) để đồ không tràn lên tiêu đề/chữ khi đẩy máy | `MotionStageRouter.tsx`, `DeclarativeStagePlayer.tsx`, `studio-ui/src/components/StoryDirectorDesk.tsx` | Khoá slider & cắt khung mặc định bật cho Gói Chén / mọi mức zoom | `clipRect: [0, 126, 540, 250]`, khoá `{0, 0, 1}` cho `semantic_v1` | Không còn xung đột cỡ Lữ khách hay tràn mái hiên lên header (T8-DNA-b) |
| 23 | Gói Chén Parser, Làn tự do & Lưu gốc | **Gói Chén**: chặn toạ độ/shapes, gom lỗi 2 tầng, lưu `goiChenGoc`. **Làn tự do (`che_do: "tu_do"`, TF1)**: nhận StageScript bọc trong CupBundle, hiện cảnh báo vàng, chỉ khoá nút Nhập khi có lỗi chặn, lưu nguyên văn `scriptGoc` trong `data/cups/*.json` | `src/stage/goiChenParser.ts`, `geminiBundleBridge.ts`, `GeminiBundleImportModal.tsx`, `server/cupStore.ts`, `server/sceneManagerService.ts` | Gói Chén: `phien_ban_goi: 1`; Làn tự do: `che_do: "tu_do"` | `goiChenGoc` / `scriptGoc`, `bundleVersion: "goichen_1" \| "tudo_1"` | Không có |
| 24 | Auto-fix dán JSON cũ (`geminiBundleBridge`) | Tách JSON từ markdown, đổi synonym (`pose`/`layer`/`atmosphere`/`theme`), khớp lại `pivotWord`, sửa import `tsxCode`, lọc hashtag | `src/automation/geminiBundleBridge.ts` | Khi dán JSON không phải Gói Chén vào Studio UI | `ATMOSPHERE/POSE/COLOR_ROLE_SYNONYM_MAP` | Luật "không lỗi im lặng" (chỉ áp cho định dạng cũ) |
| 25 | Auto-fix biên dịch ngữ nghĩa (`semanticStage`) | Tự nâng `thoi_luong` ngắn, gộp cue trùng, tự thêm cue đổi đỏ `pivot+0.4s`; vật đỏ nhỏ chỉ báo **cảnh báo vàng** (đã bỏ tự đẩy `1.14×` và tự `follow: hand` ở T8-DNA-a) | `src/stage/semanticStage.ts` | Mặc định khi biên dịch Gói Chén | `TEMPO`, `MIN_RED_AREA_PX2=2000` | Không còn chồng camera hay tự nhấc vật |

---

## 3. Hành vi ngầm (code tự đổi ngoài yêu cầu kịch bản)

| # | Vị trí (file) | Hành vi ngầm | Cảnh báo cho người dùng? |
|---|---|---|---|
| 1 | `visualDnaResolver.ts` | **Gói Chén (`semantic_v1`)**: seed CHỈ đổi chi tiết chống trùng (`horizonOffsetPx` ±18px, 14 bụi giấy, tâm vignette); bố cục/ánh sáng/kiểu quay do Gói Chén quyết. **Non-semantic**: vẫn xoay ngẫu nhiên 4 trục theo seed | **Không** |
| 2 | `visualDnaResolver.ts` | Tự hạ `ASYMMETRIC_THIRD` → `WINDOW_FRAME` khi câu > 28 âm tiết hoặc > 1 nhân vật rộng > 56 — **chỉ còn chạy trên non-`semantic_v1`** (đã bỏ trên Gói Chén ở T8-DNA-b) | **Không** |
| 3 | `visualDnaResolver.ts` | Tự bật `LEGACY_LOCK` cho `quote-001..quote-007` (trừ khi ép `mode: 'CUSTOM'|'AUTO'`) | **Không** |
| 4 | `geminiBundleBridge.ts` | `convertGoiChenToBundle` dùng `durationMode: 'AUTO_SEED'` (đồng bộ với `check-goi` & `stage-preview` từ T8-DNA-b), `pacingMode: 'WRY_BATHOS'`, `audioMode: 'FOLEY_MASTER'` | **Có** (CLI in thời lượng `AUTO_SEED`) |
| 5 | `semanticStage.ts` | ~~Tự gắn cue camera `zoom = 1.14`~~ — **ĐÃ BỎ (T8-DNA-a)** | — |
| 6 | `semanticStage.ts` | ~~Tự chuyển vật đỏ nhỏ sang `follow: <hero>:hand`~~ — **ĐÃ BỎ (T8-DNA-a)**, thay bằng cảnh báo vàng gợi ý `cam_boi` hoặc `day_may` | **Có** (cảnh báo vàng) |
| 7 | `semanticStage.ts` | Tự nâng `thoi_luong` ngắn hơn ngưỡng `TEMPO` tối thiểu | **Có** (cảnh báo vàng) |
| 8 | `semanticStage.ts` | Tự gộp 2 timeline cue trùng đối tượng & thuộc tính chồng thời gian (`deduplicateOverlappingTimelineCues`) | **Có** (cảnh báo vàng) |
| 9 | `semanticStage.ts` | Tự đặt tỷ lệ `nguoi_b = 0.94×` Lữ khách và tự sinh cue đổi màu đỏ `pivot + 0.4s` | **Không** |
| 10 | `trackCompiler.ts` | `pivotMechanic` + dao động thở `panX ±1.4` — **chỉ còn chạy trên script non-`semantic_v1`** (đã tắt trên Gói Chén ở T8-DNA-a) | **Không** |
| 11 | `trackCompiler.ts` | Trên script non-`semantic_v1`, `shotMode === 'MACRO_PROP'` tự zoom tới 1.52× và làm mờ nhân vật còn 14% | **Không** |
| 12 | `trackCompiler.ts` | Tự ép tắt hoàn toàn `pulseRing` và `glow` cho mọi `semantic_v1` | **Không** |
| 13 | `DeclarativeStagePlayer.tsx` | **Legacy**: kéo ngược về `frame 0` (`1.5s`). **Gói Chén (`semantic_v1`)**: đã đổi sang mờ cả vùng hình về giấy `0.8s` cuối, giữ nguyên màu đỏ & chữ (T8-DNA-a) | **Không** |
| 14 | `AdaptiveTypography.tsx` | Tự co `rowGap`/`lineHeight`/`sealMarginTop` rồi giảm `quoteFontSize` nếu văn bản dài chạm đáy Safe Zone | **Không** |
| 15 | `geminiBundleBridge.ts` | Nhánh JSON cũ tự sửa synonym, khớp lại `pivotWord`, tách dòng, sửa import `tsxCode`, thay caption trùng quote | **Có một phần** (`autoFixesApplied`; `normalizeThemeId`/`ColorRole` không ghi) |

---

## 4. Chồng chéo đã biết (các cặp cơ chế cùng điều khiển 1 thứ)

| # | Cặp cơ chế chồng chéo | Cùng điều khiển gì | Hậu quả thực tế & Trạng thái |
|---|---|---|---|
| 1 | Visual DNA Trục 4 (`pivotMechanic`) × Đẩy máy cú lật (`trackCompiler`) × Cue `zoom=1.14` (`semanticStage`) | `camera.zoom`, `camera.panX`, `layerParallaxX` quanh cú lật | **ĐÃ XỬ LÝ (T8-DNA-a)**: bỏ cue `1.14`, tắt Trục 4 trên Gói Chén; duy nhất `kieu_cu_lat` điều khiển camera. |
| 2 | Visual DNA Trục 1 (`layout` ngẫu nhiên) × Căn khung & Bố cục Gói Chén | Vị trí/cỡ hộp sân khấu (`stageWidth/Height`), vòm `WINDOW_ARCH` | **ĐÃ XỬ LÝ (T8-DNA-b)**: Gói Chén mặc định `CLASSIC_TOP_STAGE`, chỉ đổi khi khai báo `bo_cuc` (`co_dien` \| `chan_may` \| `khung_cua`); seed không đổi bố cục; bỏ hạ cấp `ASYMMETRIC_THIRD → WINDOW_FRAME` trên `semantic_v1`. |
| 3 | Visual DNA Trục 2 (`lightingGobo`) × Luật khí quyển mặc định tắt (T7a) | Vệt sáng/bóng phủ nền giấy | **ĐÃ XỬ LÝ (T8-DNA-b)**: Gói Chén mặc định `'NONE'`, chỉ bật gobo khi khai báo `anh_sang` (`bong_la` \| `nan_cua` \| `den_long` \| `suong_hien`) có lý do từ Bước 2. |
| 4 | Visual DNA `horizonOffsetPx` (±18px) × `stageValidator` & Kẹp `panY` đường đất | Cao độ đường đất `terrain.y` | **ĐÃ XỬ LÝ (T8-DNA-b)**: `DeclarativeStagePlayer`, `goiChenParser` (`check-goi`) và `stage-preview` đều truyền đúng `visualDNA` cùng seed vào `validateStageScriptHard()`. |
| 5 | `motionPhysics.drawProgress` (`horizonSweep=2.2s`) × Mở màn `semantic_v1` (`MO_MAN_TERRAIN_DUR=0.9s`) | Tiến trình vẽ đường đất mở màn | **ĐÃ XỬ LÝ (T8-DNA-a)**: `semantic_v1` dùng trực tiếp `compiledNow.openingTerrainProgress` đúng `0.9s` `TEMPO`. |
| 6 | `DeclarativeStagePlayer` `seamlessLoopBlend` (1.5s cuối) × Luật "vật đỏ & đẩy máy giữ đến hết" (T7b/T7c) | Trạng thái màu vật đỏ & camera ở cuối video | **ĐÃ XỬ LÝ (T8-DNA-a)**: tắt `loopBlend` trên `semantic_v1`; 0.8s cuối mờ cả vùng hình về giấy (giữ đỏ & chữ), validator đo tại `fBeforeFade`. |
| 7 | `durationMode: 'AUTO_SEED'` (Studio Gói Chén) × `FIXED 15s` (CLI `check-goi`/`stage-preview`) | Tổng số frame & mốc `pivotFrame` | **ĐÃ XỬ LÝ (T8-DNA-b)**: `parseGoiChen` (`check-goi`) và `stage-preview` dùng `AUTO_SEED` theo `id` giống Studio và in rõ thời lượng đang dùng. |
| 8 | `stageTuning` sliders (UI) × `autoScale` cố định cỡ Lữ khách & Validator | Vị trí/scale/nét toàn sân khấu | **ĐÃ XỬ LÝ (T8-DNA-b)**: Chén dùng Gói Chén khoá `offsetX/offsetY/scale` về `0/0/1` (UI ghi `"cỡ do engine quyết"`), chỉ giữ mở thanh `strokeScale`; cắt cứng vùng sân khấu (`overflow: hidden` + `<clipPath>`). |
