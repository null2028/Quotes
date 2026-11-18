# REPORT-T1 — Phục hồi CloakedTraveler theo 7c1fe76

1. **CloakedTraveler.tsx**: Phục hồi arm lengths (7.4/7.8), sitSlump divisor (14), clampedLean max=24 khi đứng, sit_slump arm pose, IK comments. Giữ nguyên gazeX/gazeY, deepSlump gục, side-profile eye, tea leaf, sit arm on desk.
2. **stageConstants.ts**: Trích 25 hằng số INK_* (stroke, opacity, arm, head, lean, fold) từ magic numbers.
3. **DeclarativeStagePlayer.tsx**: Thêm `zoomStroke = strokeWidth / cam.zoom` cho mọi phần tử trong cameraTransform (actor, props, terrain, cloud dissolution) → non-scaling-stroke khi autoFit phóng to.
4. **semanticStage.ts:308**: Sửa `let rawX` → `let rawX: number` để cho phép gán `rawX = 0` tại line 319 (anchor cam).
5. **`npx tsc --noEmit`**: PASS — 0 lỗi.
6. So sánh: `qa-artifacts-ci/T1-so-sanh.png` (3 cột: stand baseline | stand mới | Q001 sit+slump+gaze).

---
**T1b addendum**: SVG output cột 1 (baseline 7c1fe76) và cột 2 (mới) **IDENTICAL** — không có khác biệt nào. Không cần sửa thêm CloakedTraveler.
Ảnh 4 cột phóng to (baseline / mới / Q001 sit+slump+gaze / Chén 16 legacy): `qa-artifacts-ci/T1-so-sanh.png`.

**T1c addendum**: Nguyên nhân: (1) DSP `isSolidStyle` loại trừ `semantic_v1` → Q001 render outline thay vì solid; (2) mắt/lá trà/nét tóc luôn vẽ, baseline không có chúng.
Đã sửa: Thêm prop `showFace` (mặc định `false`) ẩn mắt+lá+tóc; sửa `isSolidStyle` cho `semantic_v1` = solid; `nhin_theo` không mắt → đầu dịch+nhấc nhẹ về phía vật (`gazeHeadShiftX/LiftY`).
Ảnh mới 4 cột: `qa-artifacts-ci/T1-so-sanh.png` — cột 3 (Q001 gục + cú lật) giờ cùng phong cách bóng mực đen đặc với cột 1/2/4.
