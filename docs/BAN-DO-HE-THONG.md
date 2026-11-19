# Bản Đồ Hệ Thống — Trà Nguội Studio

> Tài liệu chuẩn cho người điều phối và mọi agent. Cập nhật ngay khi có task thay đổi hành vi.

## 1. Luồng xử lý chính & Luồng cũ chạy song song

```text
[LUỒNG MỚI — Gói Chén ngữ nghĩa (chuẩn hiện hành)]
  Gói Chén JSON (từ Gemini Skill `dao-dien-tra-nguoi` / `docs/goi-mau/*.json`)
    ├── CLI: scripts/check-goi.mjs · scripts/stage-preview.mjs ──► parseGoiChen() [src/stage/goiChenParser.ts]
    └── Studio UI: GeminiBundleImportModal ──► convertGoiChenToBundle() [src/automation/geminiBundleBridge.ts]
          │ (lưu nguyên văn `goiChenGoc` + gọi `parseGoiChen`)
          ▼
    compileSemanticStageScript() [src/stage/semanticStage.ts]
      (autoScale cỡ Lữ khách 0.28, xếp vị trí từ slot/neo, dựng lớp nền `boi_canh.bo`, gắn tag `semantic_v1`)
          ▼
    validateSemanticStageScript() + validateStageScriptHard() [src/stage/stageValidator.ts]
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
| 1 | Visual DNA · Trục 1 Bố cục (`layout`) | Chọn vị trí khung hình & khối chữ: `CLASSIC_TOP_STAGE`, `SKY_QUOTE_BOTTOM_STAGE`, `WINDOW_FRAME`, `ASYMMETRIC_THIRD` | `src/engine/visualDnaResolver.ts` | Tự chọn theo seed `id::pivot::theme` (hoặc UI `visualDNA`) | `ASYMMETRIC_THIRD_MAX_SYLLABLES=28`, `actorSpanX<=56` | Bố cục chuẩn Gói Chén, `autoScale`, vùng an toàn |
| 2 | Visual DNA · Khung vòm (`WINDOW_ARCH`) | Vẽ 1 vòm cung nét mảnh tĩnh đứng yên ngoài `cameraTransform` khi `layout='WINDOW_FRAME'` | `DeclarativeStagePlayer.tsx`, `visualDnaResolver.ts` | Khi `layout='WINDOW_FRAME'` và KHÔNG có `boi_canh.bo` | `d="M 122 362...A 148 114..."`, `opacity 0.82` | `boi_canh.bo` (đã tắt khi có `bo`), đẩy máy cú lật |
| 3 | Visual DNA · Trục 2 Gobo ánh sáng (`lightingGobo`) | Phủ vệt sáng/bóng nền: `NONE`, `FOLIAGE_DAPPLE`, `WINDOW_SLATS`, `PORCH_MIST`, `WARM_LANTERN` | `MinimalistBackground.tsx`, `visualDnaResolver.ts` | Seed (tắt `'NONE'` nếu `isLegacyLocked` hoặc có `boi_canh.bo`) | Danh sách theo light/dark theme | Luật khí quyển mặc định tắt (T7a), nền sạch |
| 4 | Visual DNA · Trục 3 Chế độ quay (`shotMode`) | Chọn `SOLID_SCENE`, `BRUSH_DRAW` (vẽ chậm 1.12×), `MACRO_PROP` (zoom tới 1.52× + mờ nhân vật 14%) | `visualDnaResolver.ts`, `trackCompiler.ts` | Seed (chỉ nhánh non-`semantic_v1` dùng `BRUSH_DRAW`/`MACRO_PROP`) | `timeScale=1.12`, `macroZoom<=1.52`, `actorOpacity*0.14` | Cỡ nhân vật, đẩy máy cú lật (trên script non-semantic) |
| 5 | Visual DNA · Trục 4 Cơ chế cú lật (`pivotMechanic`) | Biến đổi camera/ánh sáng quanh pivot: `ACCENT_PUSH_IN` (+4.8%), `PULLBACK_REVEAL`, `PARALLAX_DRIFT`, `SPOTLIGHT_DIM` | `visualDnaResolver.ts`, `trackCompiler.ts` | Seed trên MỌI script không `isLegacyLocked` (kể cả `semantic_v1`) | `autoPush 1.048`, `pullback 1.065→0.98`, `panDrift 9.5`, `spot 0.36` | Đẩy máy cú lật T7c/T7d, lớp nền `boi_canh.bo` (`PARALLAX_DRIFT`) |
| 6 | Visual DNA · Dịch chân trời & Bụi giấy | Dịch cao độ `terrain.y` ±8.1px (`horizonOffsetPx * 0.45`), hạt bụi giấy & tâm vignette động | `visualDnaResolver.ts`, `trackCompiler.ts`, `MinimalistBackground.tsx` | Seed (bằng `0` nếu `isLegacyLocked`) | `autoHorizon ∈ [-18, +18]`, `14` motes, `y ∈ [305, 368]` | `stageValidator` (chạy không có `visualDNA`), kẹp `panY` đường đất |
| 7 | Thời lượng động (`durationMode`) | `FIXED` dùng `targetDurationSeconds` (15s); `AUTO_SEED` chọn 13.5–16.5s (bước 0.5s, bỏ 15.0s) theo âm tiết & seed | `src/engine/timelineSync.ts` | Gói Chén vào Studio mặc định `AUTO_SEED`; CLI mặc định `FIXED 15s` | `<18 âm: 810..870f`, `18–28: 840..960f`, `>28: 930..990f` | Mốc `pivotFrame` lệch giữa CLI (`15s`) và Studio (`AUTO_SEED`) |
| 8 | Nghi thức Mở màn (`semantic_v1` / Legacy) | `semantic_v1`: đất trái→phải → nền `far` → đạo cụ `mid` (chủ trước con) → nhân vật cuối. Legacy: 4 pha V8.6.1 | `src/stage/trackCompiler.ts`, `DeclarativeStagePlayer.tsx` | Mặc định cho mọi `semantic_v1` (trừ vật có `enterAt` / `cu_lat`) | `MO_MAN_TERRAIN=0.9s`, `PROP=0.4s`, `STAGGER=0.2s`, `ACTOR=0.5s`, `MAX=2.5s` | `motionPhysics.drawProgress` (`horizonSweep=2.2s` ghìm đường đất) |
| 9 | Đẩy máy cú lật + Cue zoom 1.14 cũ | Sau `pivot + 0.4s`, đẩy mượt 2.0s vào vật đỏ (80/20 ưu tiên vật đỏ), kẹp tổng zoom ≤ 2.2, kẹp `panY` giữ đất | `trackCompiler.ts`, `semanticStage.ts`, `DeclarativeStagePlayer.tsx` | Tự bật trên `semantic_v1` có vật đỏ; `semanticStage` còn sinh cue `1.14×` | `PIVOT_PUSH_DUR=2.0s`, `MAX_ZOOM=2.2`, `MIN_ZOOM=1.1`, `MULT=2.0`, `PUSH_IN=1.14` | `pivotMechanic` Trục 4, `seamlessLoopBlend` kéo ngược cuối video |
| 10 | Cỡ nhân vật cố định & Tự căn khung | Lữ khách đứng cao cố định 28% vùng hình (`scale=1.40`); chỉ thu nhỏ tối thiểu 0.75× nếu cảnh quá rộng; căn giữa X=270 | `src/stage/semanticStage.ts`, `stageConstants.ts` | Mặc định mọi Gói Chén (`compileSemanticStageScript`) | `LU_KHACH_HEIGHT_RATIO=0.28`, `MIN_SHRINK=0.75`, `TOP_MARGIN=0.12`, `TY_LE_CANH=0.32`, `HE_SO_PHONG_DAI=2.0` (<30cm) | `stageTuning.scale` (UI), `visualDNA.layout` hẹp (`ASYMMETRIC_THIRD`) |
| 11 | Nhịp Trà Nguội (`TEMPO`) | Quy định thời lượng tối thiểu từng cử chỉ, số chuyển động tối đa, tỷ lệ động ≤ 40%, nhịp thở tĩnh, dáng `guc`/`guc_sau` | `stageConstants.ts`, `semanticStage.ts`, `stageValidator.ts` | Mặc định mọi `semantic_v1` | `MIN_LEAN=2.0s`, `LOOK=1.2s`, `WALK=2.0s`, `MAX_MOTION_RATIO=0.4`, `MAX_MAJOR=4`, `PIVOT_DELAY>=0.4s` | Thời lượng ngắn (`13.5s`) dễ làm cảnh báo giãn/vượt tỷ lệ động |
| 12 | 9 Bộ bối cảnh (`boi_canh.bo`) & Địa hình (`dia_hinh`) | Tự dựng lớp nền `nen`/`far` nét mảnh (~36–44%) quanh nhân vật; vẽ 6 loại địa hình (`nga_re` góc ≤ 12° + biển 2 mũi tên, `doan_duong` dải đỏ) | `semanticStage.ts`, `terrainSystem.ts`, `DeclarativeStagePlayer.tsx` | Do Gói Chén khai báo `boi_canh.bo` / `dia_hinh` / `doan_duong` | 9 bộ chuẩn, `forkAtX=232`, `forkAngleDeg=-9`, `renderTerrain` kéo dài khi `zoom>1.02` | `PARALLAX_DRIFT`, che vật đỏ > 50% (validator chặn) |
| 13 | Khí quyển (`Atmosphere`) | Vẽ mưa, gió, lá, khói, chim, trăng/mặt trời, vòng sóng | `src/kit/Atmosphere.tsx`, `DeclarativeStagePlayer.tsx`, `semanticStage.ts` | Mặc định TẮT; chỉ bật khi Gói Chén khai báo `boi_canh.khi_quyen` | 9 loại `AtmosphereTypeEnum` | `lightingGobo` (nếu không có `boi_canh.bo`) |
| 14 | Luật vật đỏ duy nhất & Ngưỡng diện tích | Đúng 1 vật đỏ tại cú lật, giữ đỏ đến hết, cùng dáng bản thường, không bị che > 50%, diện tích sau đẩy máy ≥ ngưỡng | `stageValidator.ts`, `propCatalog.tsx`, `stageConstants.ts` | Mặc định mọi kịch bản mới (`strictValidation`) | `MIN_RED_AREA_PX2=2000`, `RED_PIVOT_FILL_OPACITY=0.7`, `IoU>=0.98`, `Δbox<=0.12` | `seamlessLoopBlend` làm mờ đỏ về đen ở 1.5s cuối |
| 15 | Nét mực không phình theo zoom (`zoomStroke`) | Chia `strokeWidth` cho `cam.zoom` và `scale^0.78` để nét Lữ khách & đạo cụ mảnh đồng nhất mọi tỷ lệ | `DeclarativeStagePlayer.tsx`, `CloakedTraveler.tsx`, `propCatalog.tsx` | Mặc định toàn bộ stage engine | `INK_BASE=2.6`, `INK_SCALE_POWER=0.78`, `PROP_FINE_STROKE=1.35`, `WASH=0.13` | `TerrainRenderer.fineHorizonStrokeWidth` cố định `1.15–1.28` (không chia `cam.zoom`) |
| 16 | Validator chặn cứng & Khóa legacy | Chặn sai tên/neo/va chạm/lơ lửng/vượt nhịp/lỗi vật đỏ trước render; 51 cảnh `LEGACY_SCENE_IDS` được miễn | `stageValidator.ts`, `legacySceneIds.ts`, `DeclarativeStagePlayer.tsx` | Mặc định bật (`strictValidation: true`); tắt khi `legacy: true` | `VALIDATION_SAMPLE_STEP_SEC=0.25`, `51` legacy IDs | `horizonOffsetPx` không truyền vào validator → lệch nhẹ Y |
| 17 | Vật lý chuyển động chung (`motionPhysics`) | Tính `drawProgress` (2.2s vẽ + 1.35s tắt), `seamlessLoopBlend` (1.5s), `beat1/2/3`, `cameraScale`/`cameraPanY` di sản | `src/engine/motionPhysics.ts` | Chạy mọi frame cho cả luồng cũ & mới | `horizonDraw=2.2s`, `outroDissolve=1.35s`, `loopWindow=1.5s`, `68 BPM` | Đè thời lượng vẽ đất `0.9s` của T7c (`Math.min(drawProgress, openingTerrainProgress)`) |
| 18 | Seamless Loop cuối video | Cuối video hòa sân khấu về `frame 0` (`1.5s`), chữ tan mờ (`0.8s`), header hiện lại để nối vòng 15s → 0s | `DeclarativeStagePlayer.tsx`, `AdaptiveTypography.tsx`, `MinimalistBackground.tsx` | Mặc định bật mọi video | `loopWindow=1.5s` (stage), `TYPO_LOOP_FADE=0.8s` (chữ) | Luật "vật đỏ & đẩy máy giữ đến hết" (T7b/T7c) |
| 19 | Typography, tách chữ lật & thanh đỏ dọc | Hiện từng dòng thấm mực từ `0.35s`, tô đỏ `pivotWord` tại `pivotFrame`, giữ nguyên khối đứng yên, tự co nếu tràn Safe Zone | `AdaptiveTypography.tsx`, `timelineSync.ts` | Mặc định mọi video | `STAGE_LEAD_IN=0.35s`, `fade=1.05s`, `baseFont=42px` (`0.88–1.15×`), `marginLeft=132px` | `layout` thay đổi `typographyTop`/`quoteBlockWidth` |
| 20 | Header tập tự tan mực theo Ảnh Bìa | Hiện `CHÉN XX — TÊN` sắc nét qua `recommendedCoverFrame`, tan hoàn toàn trước `pivotFrame`, hồi lại ở loop | `MinimalistBackground.tsx`, `timelineSync.ts` | Mặc định mọi video | `holdAfterCover=0.3s`, `dissolve=0.55–0.8s` | Không có (độc lập lớp nền) |
| 21 | Âm thanh Foley & BGM (`-14.0 LUFS`) | Tổng hợp WAV stereo tiếng cọ/giấy theo từng dòng + âm điểm lật (`TEA_CUP`/`WIND_CHIME`/`WOOD_SEAL`/`AUTO`) | `src/engine/foleyEngine.ts`, `src/components/BgmController.tsx` | Mặc định `PIVOT_ACCENT` (Studio Gói Chén ép `FOLEY_MASTER`); tắt bằng `TIKTOK_SILENT` | `TARGET_INTEGRATED_LUFS=-14.0`, `48kHz`, `debounce=380ms` | Không có |
| 22 | Tinh chỉnh thủ công trên UI (`stageTuning`) | 4 thanh trượt dịch X/Y, phóng khung sân khấu và độ dày nét bao ngoài `DeclarativeStagePlayer` | `MotionStageRouter.tsx`, Studio UI | Do người dùng kéo trên UI | Mặc định `{0, 0, 1, 1}` (fallback cũ `scale: 1.05`) | Cỡ nhân vật cố định 28%, `stageValidator` (không kiểm sau slider) |
| 23 | Gói Chén Parser & Lưu gốc | Chặn toạ độ/shapes, gom & khử trùng lỗi 2 tầng, giữ nguyên văn `goiChenGoc` trong `data/cups/*.json` | `src/stage/goiChenParser.ts`, `geminiBundleBridge.ts` | Khi JSON có `phien_ban_goi: 1` | Danh sách trường cấm (`x`, `y`, `scale`, `shapes`...) | Không có |
| 24 | Auto-fix dán JSON cũ (`geminiBundleBridge`) | Tách JSON từ markdown, đổi synonym (`pose`/`layer`/`atmosphere`/`theme`), khớp lại `pivotWord`, sửa import `tsxCode`, lọc hashtag | `src/automation/geminiBundleBridge.ts` | Khi dán JSON không phải Gói Chén vào Studio UI | `ATMOSPHERE/POSE/COLOR_ROLE_SYNONYM_MAP` | Luật "không lỗi im lặng" (chỉ áp cho định dạng cũ) |
| 25 | Auto-fix biên dịch ngữ nghĩa (`semanticStage`) | Tự nâng `thoi_luong` ngắn, gộp cue trùng, tự gắn `follow: hand` cho vật đỏ nhỏ không có `dat_tren`, tự thêm cue đỏ & đẩy 1.14× | `src/stage/semanticStage.ts` | Mặc định khi biên dịch Gói Chén | `TEMPO`, `PIVOT_CAMERA_PUSH_IN_ZOOM=1.14`, `MIN_RED_AREA_PX2=2000` | Đẩy máy T7c/T7d, ý đồ dàn dựng gốc |

---

## 3. Hành vi ngầm (code tự đổi ngoài yêu cầu kịch bản)

| # | Vị trí (file) | Hành vi ngầm | Cảnh báo cho người dùng? |
|---|---|---|---|
| 1 | `visualDnaResolver.ts` | Tự chọn ngẫu nhiên theo seed 4 trục (`layout`, `lightingGobo`, `shotMode`, `pivotMechanic`) + `horizonOffsetPx` (±18px) khi `visualDNA` không khai báo | **Không** |
| 2 | `visualDnaResolver.ts` | Tự hạ `ASYMMETRIC_THIRD` → `WINDOW_FRAME` (bật vòm `WINDOW_ARCH` nếu không có `boi_canh.bo`) khi câu > 28 âm tiết hoặc > 1 nhân vật rộng > 56 | **Không** (chỉ cờ nội bộ) |
| 3 | `visualDnaResolver.ts` | Tự bật `LEGACY_LOCK` cho `quote-001..quote-007` (trừ khi ép `mode: 'CUSTOM'|'AUTO'`) | **Không** |
| 4 | `geminiBundleBridge.ts` | `convertGoiChenToBundle` tự gán `durationMode: 'AUTO_SEED'` (đổi 15s thành 13.5–16.5s), `pacingMode: 'WRY_BATHOS'`, `audioMode: 'FOLEY_MASTER'` | **Không** |
| 5 | `semanticStage.ts` | Tự gắn cue camera `zoom = 1.14` tại `pivot` nếu `framedRedPx2 < MIN_RED_AREA_PX2` hoặc `vat_do_tren_tay` nhỏ | **Không** |
| 6 | `semanticStage.ts` | Tự chuyển vật đỏ nhỏ sang `follow: <hero>:hand` + đổi `variant: 'cam'` tại `pivot` nếu vật không có `dat_tren`/`cam_boi` và hỗ trợ `cam` | **Không** |
| 7 | `semanticStage.ts` | Tự nâng `thoi_luong` ngắn hơn ngưỡng `TEMPO` tối thiểu | **Có** (cảnh báo vàng) |
| 8 | `semanticStage.ts` | Tự gộp 2 timeline cue trùng đối tượng & thuộc tính chồng thời gian (`deduplicateOverlappingTimelineCues`) | **Có** (cảnh báo vàng) |
| 9 | `semanticStage.ts` | Tự đặt tỷ lệ `nguoi_b = 0.94×` Lữ khách và tự sinh cue đổi màu đỏ `pivot + 0.4s` | **Không** |
| 10 | `trackCompiler.ts` | Tự chạy `pivotMechanic` (zoom +4.8%, pullback, parallax drift, spotlight dim) + dao động thở `panX ±1.4` lên cả `semantic_v1` | **Không** |
| 11 | `trackCompiler.ts` | Trên script non-`semantic_v1`, `shotMode === 'MACRO_PROP'` tự zoom tới 1.52× và làm mờ nhân vật còn 14% | **Không** |
| 12 | `trackCompiler.ts` | Tự ép tắt hoàn toàn `pulseRing` và `glow` cho mọi `semantic_v1` | **Không** |
| 13 | `DeclarativeStagePlayer.tsx` | Tự kéo ngược toàn bộ đạo cụ, màu vật đỏ & camera về `frame 0` trong 1.5s cuối (`seamlessLoopBlend`) | **Không** |
| 14 | `AdaptiveTypography.tsx` | Tự co `rowGap`/`lineHeight`/`sealMarginTop` rồi giảm `quoteFontSize` nếu văn bản dài chạm đáy Safe Zone | **Không** |
| 15 | `geminiBundleBridge.ts` | Nhánh JSON cũ tự sửa synonym, khớp lại `pivotWord`, tách dòng, sửa import `tsxCode`, thay caption trùng quote | **Có một phần** (`autoFixesApplied`; `normalizeThemeId`/`ColorRole` không ghi) |

---

## 4. Chồng chéo đã biết (các cặp cơ chế cùng điều khiển 1 thứ)

| # | Cặp cơ chế chồng chéo | Cùng điều khiển gì | Hậu quả thực tế & Trạng thái |
|---|---|---|---|
| 1 | Visual DNA Trục 4 (`pivotMechanic`) × Đẩy máy cú lật (`trackCompiler`) × Cue `zoom=1.14` (`semanticStage`) | `camera.zoom`, `camera.panX`, `layerParallaxX` quanh cú lật | `PULLBACK_REVEAL` kéo lùi trong khi đẩy máy kéo vào; `PARALLAX_DRIFT` dịch lệch lớp `far` (`boi_canh.bo`) với `mid`. Đã kẹp tổng zoom ≤ 2.2 (T8-BOI-CANH), 3 cơ chế vẫn chạy đồng thời. |
| 2 | Visual DNA Trục 1 (`layout` ngẫu nhiên) × Căn khung & Bố cục Gói Chén | Vị trí/cỡ hộp sân khấu (`stageWidth/Height`), vòm `WINDOW_ARCH` | Cùng 1 Gói Chén đổi `id` có thể nhảy sang chữ trên/hình dưới hoặc hộp hẹp 388px. Đã tắt `WINDOW_ARCH` khi có `boi_canh.bo`; 4 layout vẫn xoay ngẫu nhiên theo seed (chờ T8-DNA). |
| 3 | Visual DNA Trục 2 (`lightingGobo`) × Luật khí quyển mặc định tắt (T7a) | Vệt sáng/bóng phủ nền giấy | Tự thêm vệt sáng chéo dù kịch bản không khai báo khí quyển. Đã tắt `'NONE'` khi có `boi_canh.bo` (T8-BOI-CANH-b); Gói Chén chưa có `bo` vẫn chịu gobo ngẫu nhiên (chờ T8-DNA). |
| 4 | Visual DNA `horizonOffsetPx` (±18px) × `stageValidator` & Kẹp `panY` đường đất | Cao độ đường đất `terrain.y` | `DeclarativeStagePlayer` dịch `terrain.y` theo `visualDNA`, còn `stageValidator` không nhận `visualDNA` → sai lệch tọa độ Y tới ±8.1px giữa kiểm định và render thật. |
| 5 | `motionPhysics.drawProgress` (`horizonSweep=2.2s`) × Mở màn `semantic_v1` (`MO_MAN_TERRAIN_DUR=0.9s`) | Tiến trình vẽ đường đất mở màn | `DeclarativeStagePlayer` lấy `Math.min(state.drawProgress, openingTerrainProgress)` khiến đường đất bị kéo chậm thành 2.2s thay vì 0.9s như `TEMPO`. |
| 6 | `DeclarativeStagePlayer` `seamlessLoopBlend` (1.5s cuối) × Luật "vật đỏ & đẩy máy giữ đến hết" (T7b/T7c) | Trạng thái màu vật đỏ & camera ở cuối video | 1.5s cuối video vật đỏ phai về mực đen và camera thu về 1.0 để loop, nhưng validator đo trước `loopBlend` nên vẫn báo đạt. |
| 7 | `durationMode: 'AUTO_SEED'` (Studio Gói Chén) × `FIXED 15s` (CLI `check-goi`/`stage-preview`) | Tổng số frame & mốc `pivotFrame` | Studio có thể chạy 13.5s–16.5s trong khi CLI kiểm trên 15.0s → khác biệt nhẹ thời điểm cú lật & nhịp. |
| 8 | `stageTuning` sliders (UI) × `autoScale` cố định cỡ Lữ khách & Validator | Vị trí/scale/nét toàn sân khấu | Kéo slider trên UI làm thay đổi cỡ Lữ khách (lệch chuẩn 28%) và có thể đẩy vật ra ngoài Safe Zone mà không đi qua `stageValidator`. |
