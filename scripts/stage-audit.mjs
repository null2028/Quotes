import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BUILT_IN_PROP_CATALOG } from '../src/stage/propCatalog.tsx';
import {
  MIN_RED_AREA_PX2,
  VALIDATION_SAMPLE_STEP_SEC,
} from '../src/stage/stageConstants.ts';
import {
  computePropRedStageArea,
  getActorWorldBBox,
  getPropWorldBBox,
  PX2_PER_STAGE_UNIT2,
  resolveEffectiveSemanticLayer,
  STAGE_VB_X0,
  STAGE_VB_X1,
  STAGE_VB_Y0,
  STAGE_VB_Y1,
} from '../src/stage/stageGeometry.ts';
import { getTerrainPoint } from '../src/stage/terrainSystem.ts';
import { evaluateStageScriptAtFrame } from '../src/stage/trackCompiler.ts';
import { computeTimelineSync } from '../src/engine/timelineSync.ts';
import { THEME_PALETTES } from '../src/theme/palettes.ts';
import { resolveVisualDNA } from '../src/engine/visualDnaResolver.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const STAGE_SCRIPTS_PATH = path.join(ROOT, 'data/stage-scripts.json');
const CUSTOM_PROPS_PATH = path.join(ROOT, 'data/custom-props.json');
const CUPS_DIR = path.join(ROOT, 'data/cups');
const AIRTABLE_CACHE_PATH = path.join(ROOT, 'data/airtable-cache.json');
const OUT_DIR = path.join(ROOT, 'qa-artifacts-ci');
fs.mkdirSync(OUT_DIR, { recursive: true });

const AERIAL_OR_WALL_PROP_RE =
  /window|clock|cloud|kite|paper_plane|chat_bubble|thought_bubble|lunch_thought|sun|moon|star|sparks|melody_silk|memory_note|rising_ink_heart|sanctuary_dome|water_moon|puddle|shadow|stepping_stone|brush_line/i;

const GROUND_DECAL_RE =
  /water_moon|puddle|shadow|stepping_stone|brush_line|sanctuary_dome/i;

const SEAT_PROP_RE = /chair|stool|bench|seat/i;
const SURFACE_HOST_RE = /desk|table|bench|stool|chair|stand|gate|box_stack|boulder|counter/i;

// Bộ 26 đạo cụ gốc trước khi đưa thêm 9 đạo cụ mới
const ORIGINAL_26_PROPS = new Set([
  'envelope',
  'bridal_veil',
  'dashed_heart',
  'solid_heart',
  'wine_jar',
  'small_cup',
  'rice_bowl',
  'tall_cup',
  'boulder',
  'box_stack',
  'umbrella',
  'bench',
  'street_lamp',
  'warm_house',
  'city_skyline',
  'small_boat',
  'kite',
  'paper_plane',
  'bare_tree',
  'sprout',
  'campfire',
  'lantern',
  'seesaw',
  'hourglass',
  'chat_bubble',
  'cloud_wisp',
]);

function buildDefaultTimeline(cupProps) {
  return computeTimelineSync({
    id: cupProps?.id || 'audit-cup',
    textFormat: cupProps?.textFormat || 'POEM',
    segments:
      cupProps?.segments?.length > 0
        ? cupProps.segments
        : [
            'Dòng một mở cảnh nhẹ nhàng,',
            'Dòng hai nhịp bước sang ngang,',
            'Dòng ba lặng giữa chiều tàn,',
            'Dòng bốn chạm điểm lật vàng chu sa.',
          ],
    pivotWord: cupProps?.pivotWord || 'chu sa',
    highlightStyle: 'BOTH',
    targetDurationSeconds: cupProps?.targetDurationSeconds || 15,
    durationMode: cupProps?.durationMode || 'FIXED',
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: cupProps?.themeId || 'MINIMAL_LIGHT',
    motion: cupProps?.motion || {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -16 },
      stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 0 },
    },
    bgm: { audioMode: 'PIVOT_ACCENT', foleyPivotStyle: 'AUTO' },
    brandText: 'TRÀ NGUỘI',
  });
}

function loadCupMappings() {
  const scriptToCups = new Map();
  const cupsList = [];

  if (fs.existsSync(CUPS_DIR)) {
    const files = fs
      .readdirSync(CUPS_DIR)
      .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
      .sort();
    for (const f of files) {
      const cup = JSON.parse(fs.readFileSync(path.join(CUPS_DIR, f), 'utf8'));
      const sceneId = cup.props?.motion?.sceneId || cup.props?.motion?.archetype || '';
      cupsList.push({
        cupNumber: String(cup.cupNumber).padStart(2, '0'),
        id: cup.id,
        title: cup.props?.title || '',
        sceneId,
        props: cup.props,
      });
      if (sceneId) {
        if (!scriptToCups.has(sceneId)) scriptToCups.set(sceneId, []);
        scriptToCups.get(sceneId).push({
          cupNumber: String(cup.cupNumber).padStart(2, '0'),
          title: cup.props?.title || '',
          props: cup.props,
        });
      }
    }
  }

  if (!cupsList.some((c) => c.cupNumber === '13') && fs.existsSync(AIRTABLE_CACHE_PATH)) {
    cupsList.push({
      cupNumber: '13',
      id: 'quote-013',
      title: 'Biên bản sáng thứ Hai',
      sceneId: 'SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG',
      props: null,
    });
    if (!scriptToCups.has('SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG')) {
      scriptToCups.set('SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG', []);
    }
    scriptToCups.get('SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG').push({
      cupNumber: '13',
      title: 'Biên bản sáng thứ Hai',
      props: null,
    });
  }

  cupsList.sort((a, b) => Number(a.cupNumber) - Number(b.cupNumber));
  return { scriptToCups, cupsList };
}

function isRestingOnHost(upperBox, hostBox, hostType) {
  const horizOverlap =
    Math.min(upperBox.x1, hostBox.x1 + 5) - Math.max(upperBox.x0, hostBox.x0 - 5);
  if (horizOverlap < Math.min(3, (upperBox.x1 - upperBox.x0) * 0.35)) {
    return false;
  }
  const topDiff = Math.abs(upperBox.y1 - hostBox.y0);
  if (topDiff <= 4.5) return true;
  if (/desk|table/i.test(hostType) && upperBox.y1 >= hostBox.y0 - 2 && upperBox.y1 <= hostBox.y0 + 6.5) {
    return true;
  }
  return false;
}

function auditSingleScript(sceneId, rawScript, customPropsMap, cupRef) {
  const script = {
    ...rawScript,
    sceneId: rawScript.sceneId || sceneId,
    customPropsResolved: {
      ...customPropsMap,
      ...(rawScript.customPropsResolved ?? {}),
    },
  };

  const timeline = buildDefaultTimeline(cupRef?.props);
  const palette = THEME_PALETTES.MINIMAL_LIGHT;
  const visualDNA = cupRef?.props
    ? resolveVisualDNA(cupRef.props, script)
    : undefined;

  const fps = timeline.fps;
  const stepFrames = Math.max(1, Math.round(VALIDATION_SAMPLE_STEP_SEC * fps));
  const maxSampleFrame = Math.max(1, timeline.durationInFrames - Math.round(1.0 * fps));

  const issues = {
    customShapes: [],
    overlaps: [],
    floating: [],
    outOfBounds: [],
    redCount: [],
    redTooSmall: [],
  };

  // --- 1. Đạo cụ tự vẽ shapes hoặc dùng type ngoài 26 đạo cụ gốc của propCatalog ---
  for (const p of script.props ?? []) {
    const hasInlineShapes =
      (Array.isArray(p.shapes) && p.shapes.length > 0) ||
      (Array.isArray(p.altShapes) && p.altShapes.length > 0);
    const tName = p.type || '';
    const inOrigCatalog = ORIGINAL_26_PROPS.has(tName);
    const inNewCatalog = Boolean(BUILT_IN_PROP_CATALOG[tName]);
    const inCustom = Boolean(script.customPropsResolved?.[tName]);

    if (hasInlineShapes) {
      issues.customShapes.push(
        `prop "${p.id}" nhúng shapes trực tiếp trong JSON${inOrigCatalog ? '' : ` (type "${tName || 'none'}")`}`
      );
    } else if (!inOrigCatalog) {
      if (inNewCatalog) {
        issues.customShapes.push(
          `prop "${p.id}" dùng "${tName}" (nay đã đưa vào nhóm 9 đạo cụ chờ duyệt 'nhap' trong propCatalog)`
        );
      } else if (inCustom) {
        issues.customShapes.push(
          `prop "${p.id}" dùng "${tName}" từ custom-props.json (chưa có trong propCatalog)`
        );
      } else {
        issues.customShapes.push(
          `prop "${p.id}" dùng type lạ "${tName || 'none'}" (tàng hình)`
        );
      }
    }
  }

  // Tiền xử lý: Xác định chiếc ghế mà mỗi nhân vật thực sự đã ngồi trong suốt video
  // (Điều 4: Nhân vật đứng dậy từ chính chiếc ghế mình đang ngồi thì được miễn va chạm với ghế đó)
  const actorSeatedChairIds = new Map();
  for (let frame = 0; frame <= maxSampleFrame; frame += stepFrames) {
    const isAfterPivot = frame >= timeline.pivotFrame - 6;
    const compiled = evaluateStageScriptAtFrame(script, frame, timeline, palette, visualDNA);
    for (const a of compiled.actors) {
      const aSpec = (script.actors ?? []).find((x) => x.id === a.id);
      if (aSpec?.seatedOn) {
        const seatId = aSpec.seatedOn.split('.')[0];
        if (!actorSeatedChairIds.has(a.id)) actorSeatedChairIds.set(a.id, new Set());
        actorSeatedChairIds.get(a.id).add(seatId);
      }
      if (a.sitProgress >= 0.55) {
        for (const p of compiled.props) {
          if (!SEAT_PROP_RE.test(`${p.id} ${p.type}`)) continue;
          const pb = getPropWorldBBox(p, script.customPropsResolved, isAfterPivot);
          if (!pb) continue;
          if (Math.abs((pb.x0 + pb.x1) * 0.5 - a.x) <= 18) {
            if (!actorSeatedChairIds.has(a.id)) actorSeatedChairIds.set(a.id, new Set());
            actorSeatedChairIds.get(a.id).add(p.id);
          }
        }
      }
    }
  }

  const seenOverlaps = new Set();
  const seenFloating = new Set();
  const seenOob = new Set();

  // --- Quét lấy mẫu dọc cả video (mỗi 0.25s = ~56 khung mẫu trên 14s) ---
  for (let frame = Math.round(1.8 * fps); frame <= maxSampleFrame; frame += stepFrames) {
    const isAfterPivot = frame >= timeline.pivotFrame - 6;
    const compiled = evaluateStageScriptAtFrame(
      script,
      frame,
      timeline,
      palette,
      visualDNA
    );
    const terrain = compiled.terrain;
    const phase =
      ((frame % timeline.durationInFrames) / timeline.durationInFrames) *
      Math.PI *
      2 *
      8;
    const tLabel = `t=${(frame / fps).toFixed(2)}s`;

    const propBoxes = [];
    for (const p of compiled.props) {
      if (p.opacity <= 0.25 || p.drawProgress <= 0.45 || p.floatAwayProgress > 0.35) {
        continue;
      }
      const box = getPropWorldBBox(p, script.customPropsResolved, isAfterPivot);
      if (!box) continue;
      const semLayer = resolveEffectiveSemanticLayer(
        p.spec?.semanticLayer,
        p.layer,
        `${p.id} ${p.type}`
      );
      propBoxes.push({
        kind: 'prop',
        id: p.id,
        type: p.type,
        layer: p.layer,
        semLayer,
        state: p,
        box,
      });
    }

    const actorBoxes = [];
    for (const a of compiled.actors) {
      if (a.opacity <= 0.25 || a.dissolveToCloud > 0.4) continue;
      const aSpec = (script.actors ?? []).find((x) => x.id === a.id);
      const box = getActorWorldBBox(a, script.customPropsResolved, isAfterPivot);
      if (!box) continue;
      const semLayer = resolveEffectiveSemanticLayer(
        aSpec?.semanticLayer,
        a.layer,
        `${a.id} ${a.rig || 'human'}`
      );
      actorBoxes.push({
        kind: 'actor',
        id: a.id,
        type: a.rig || 'human',
        layer: a.layer,
        semLayer,
        state: a,
        box,
      });
    }

    // --- 4. Vật nằm ngoài vùng an toàn của terrain ---
    const safeMinX = Math.max(STAGE_VB_X0 + 2, terrain.startX - 4);
    const safeMaxX = Math.min(STAGE_VB_X1 - 2, terrain.endX + 4);
    for (const item of [...propBoxes, ...actorBoxes]) {
      if (item.kind === 'prop' && GROUND_DECAL_RE.test(`${item.id} ${item.type}`)) {
        continue;
      }
      const { x0, y0, x1, y1 } = item.box;
      const reasons = [];
      if (x0 < safeMinX) reasons.push(`trái x=${x0.toFixed(1)} < ${safeMinX.toFixed(0)}`);
      if (x1 > safeMaxX) reasons.push(`phải x=${x1.toFixed(1)} > ${safeMaxX.toFixed(0)}`);
      if (y0 < STAGE_VB_Y0 + 2) reasons.push(`đỉnh y=${y0.toFixed(1)} < ${STAGE_VB_Y0 + 2}`);
      if (y1 > STAGE_VB_Y1 - 2) reasons.push(`đáy y=${y1.toFixed(1)} > ${STAGE_VB_Y1 - 2}`);
      if (reasons.length > 0 && !seenOob.has(item.id)) {
        seenOob.add(item.id);
        issues.outOfBounds.push(
          `${item.kind} "${item.id}" ra ngoài vùng an toàn (${reasons.join(', ')}) [${tLabel}]`
        );
      }
    }

    // --- 3. Vật lơ lửng ---
    for (const item of propBoxes) {
      const p = item.state;
      const idType = `${p.id} ${p.type}`;
      if (
        item.semLayer === 'nen' ||
        Boolean(p.spec?.follow) ||
        AERIAL_OR_WALL_PROP_RE.test(idType)
      ) {
        continue;
      }
      const hasFollowCue = (script.timeline ?? []).some(
        (c) => c.target === p.id && c.follow
      );
      if (hasFollowCue && isAfterPivot) continue;

      const cx = (item.box.x0 + item.box.x1) * 0.5;
      const groundY = getTerrainPoint(terrain, cx, phase).y;
      const gap = groundY - item.box.y1;

      const onHost = propBoxes.some((other) => {
        if (other.id === item.id) return false;
        if (!SURFACE_HOST_RE.test(`${other.id} ${other.type}`)) return false;
        return isRestingOnHost(item.box, other.box, `${other.id} ${other.type}`);
      });

      if (!onHost && gap > 3.0 && !seenFloating.has(item.id)) {
        seenFloating.add(item.id);
        issues.floating.push(
          `prop "${item.id}" (${item.type}) lơ lửng cách đất ${gap.toFixed(1)}px [${tLabel}]`
        );
      } else if (!onHost && gap < -5.5 && !seenFloating.has(item.id)) {
        seenFloating.add(item.id);
        issues.floating.push(
          `prop "${item.id}" (${item.type}) chìm dưới đất ${Math.abs(gap).toFixed(1)}px [${tLabel}]`
        );
      }
    }

    for (const item of actorBoxes) {
      const a = item.state;
      const groundY = getTerrainPoint(terrain, a.x, phase).y;
      const footGap = groundY - item.box.y1;
      if (footGap > 3.0 && !seenFloating.has(`actor:${a.id}`)) {
        seenFloating.add(`actor:${a.id}`);
        issues.floating.push(
          `actor "${a.id}" lơ lửng cách đất ${footGap.toFixed(1)}px [${tLabel}]`
        );
      }
      if (a.sitProgress >= 0.6 && !seenFloating.has(`seat:${a.id}`)) {
        const hasSeat = propBoxes.some(
          (pb) =>
            SEAT_PROP_RE.test(`${pb.id} ${pb.type}`) &&
            Math.abs((pb.box.x0 + pb.box.x1) * 0.5 - a.x) <= 18
        );
        if (!hasSeat) {
          seenFloating.add(`seat:${a.id}`);
          issues.floating.push(
            `actor "${a.id}" ngồi ghế vô hình (không có ghế bên dưới) [${tLabel}]`
          );
        }
      }
    }

    // --- 2. Hai vật đè lên nhau: CHỈ XÉT VẬT CÙNG LỚP (`nen` / `giua` / `truoc`) ---
    const solidItems = [...propBoxes, ...actorBoxes].filter((it) => {
      if (it.kind === 'prop' && GROUND_DECAL_RE.test(`${it.id} ${it.type}`)) return false;
      if (
        it.kind === 'prop' &&
        /thought_bubble|lunch_thought|sparks|melody_silk|memory_note/i.test(
          `${it.id} ${it.type}`
        )
      ) {
        return false;
      }
      return true;
    });

    for (let i = 0; i < solidItems.length; i++) {
      for (let j = i + 1; j < solidItems.length; j++) {
        const A = solidItems[i];
        const B = solidItems[j];
        // Điều 1: Kiểm tra đè nhau CHỈ xét các vật cùng lớp (`nen`, `giua`, `truoc`)
        if (A.semLayer !== B.semLayer) continue;

        const pairKey = [A.id, B.id].sort().join('::');
        if (seenOverlaps.has(pairKey)) continue;

        // Vật đang được chính nhân vật đó cầm (`follow: "<actorId>:..."`), ví dụ hero cầm ô, nhưng VẪN bắt lỗi nếu ô đè đầu nhân vật KHÁC (như beloved ở Chén 08)!
        if (
          (A.kind === 'prop' &&
            B.kind === 'actor' &&
            String(A.state.spec?.follow || '').startsWith(`${B.id}:`)) ||
          (B.kind === 'prop' &&
            A.kind === 'actor' &&
            String(B.state.spec?.follow || '').startsWith(`${A.id}:`))
        ) {
          continue;
        }
        const cueFollowsThisExactActor = (script.timeline ?? []).some(
          (c) =>
            (A.kind === 'prop' &&
              B.kind === 'actor' &&
              c.target === A.id &&
              String(c.follow || '').startsWith(`${B.id}:`)) ||
            (B.kind === 'prop' &&
              A.kind === 'actor' &&
              c.target === B.id &&
              String(c.follow || '').startsWith(`${A.id}:`))
        );
        if (cueFollowsThisExactActor && isAfterPivot) continue;

        // Điều 4: Nhân vật ngồi trên ghế đó HOẶC đứng dậy từ chính chiếc ghế mình đang ngồi thì được miễn va chạm với ghế đó.
        // Ngược lại, nếu đi ngang qua ghế/vật cùng lớp từ xa tới thì vẫn bắt lỗi đè nhau!
        if (
          A.kind === 'actor' &&
          B.kind === 'prop' &&
          actorSeatedChairIds.get(A.id)?.has(B.id)
        ) {
          // Chỉ miễn trừ khi nhân vật đang ở gần vị trí ghế ngồi / vừa đứng dậy từ ghế đó,
          // còn nếu lúc đầu đứng cách xa ghế rồi đi xuyên qua ghế thì vẫn báo
          if (A.state.sitProgress >= 0.25 || isAfterPivot) continue;
        }
        if (
          B.kind === 'actor' &&
          A.kind === 'prop' &&
          actorSeatedChairIds.get(B.id)?.has(A.id)
        ) {
          if (B.state.sitProgress >= 0.25 || isAfterPivot) continue;
        }

        // Vật đặt trên mặt vật chủ
        if (
          A.kind === 'prop' &&
          B.kind === 'prop' &&
          ((SURFACE_HOST_RE.test(`${B.id} ${B.type}`) &&
            isRestingOnHost(A.box, B.box, `${B.id} ${B.type}`)) ||
            (SURFACE_HOST_RE.test(`${A.id} ${A.type}`) &&
              isRestingOnHost(B.box, A.box, `${A.id} ${A.type}`)))
        ) {
          continue;
        }

        const ix = Math.min(A.box.x1, B.box.x1) - Math.max(A.box.x0, B.box.x0);
        const iy = Math.min(A.box.y1, B.box.y1) - Math.max(A.box.y0, B.box.y0);
        if (ix > 3.5 && iy > 3.5 && ix * iy > 18) {
          seenOverlaps.add(pairKey);
          issues.overlaps.push(
            `[lớp ${A.semLayer}] "${A.id}" đè lên "${B.id}" (${ix.toFixed(1)}×${iy.toFixed(1)}px) [${tLabel}]`
          );
        }
      }
    }
  }

  // --- 5 & 6. Kiểm tra số vật đỏ & diện tích tối thiểu thống nhất MIN_RED_AREA_PX2 (500 px²) ---
  // Điều 3: Chén trên tay Lữ khách mặc định màu mực, không tính là vật đỏ, trừ khi nó chính là vật duy nhất của cú lật.
  const fPostPivot = Math.min(
    timeline.durationInFrames - Math.round(1.6 * fps),
    timeline.pivotFrame + Math.round(1.6 * fps)
  );
  const fLingering = Math.max(
    fPostPivot,
    timeline.durationInFrames - Math.round(2.0 * fps)
  );

  let bestRedSnapshot = null;
  for (const pf of [fPostPivot, fLingering]) {
    const compiled = evaluateStageScriptAtFrame(
      script,
      pf,
      timeline,
      palette,
      visualDNA
    );
    const zoom2 = compiled.camera.zoom * compiled.camera.zoom;
    const redPropsAndAtmo = [];
    const handTeacups = [];

    for (const p of compiled.props) {
      if (p.opacity <= 0.15 || p.floatAwayProgress >= 0.75) continue;
      const stageArea = computePropRedStageArea(p, script.customPropsResolved);
      if (stageArea > 0.2) {
        redPropsAndAtmo.push({
          id: p.id,
          kind: 'prop',
          screenPx2: stageArea * PX2_PER_STAGE_UNIT2 * zoom2,
        });
      }
    }

    for (const a of compiled.actors) {
      if (a.opacity <= 0.15 || a.dissolveToCloud >= 0.7) continue;
      const aSpec = (script.actors ?? []).find((x) => x.id === a.id);
      if (a.color === (palette.accentProp || palette.accent)) {
        redPropsAndAtmo.push({
          id: a.id,
          kind: 'actor',
          screenPx2: 320 * a.scale * a.scale * PX2_PER_STAGE_UNIT2 * zoom2,
        });
      } else if (a.showTeaCup > 0.2) {
        handTeacups.push({
          id: `${a.id}:showTeaCup`,
          explicitTwist: aSpec?.teaCupRed === true,
          screenPx2: 7 * 5 * 0.75 * a.scale * a.scale * PX2_PER_STAGE_UNIT2 * zoom2,
        });
      }
    }

    for (const atmo of script.atmosphere ?? []) {
      if (
        atmo.colorRole === 'accent' &&
        atmo.type !== 'ring_pulse' &&
        (atmo.opacity ?? 1) > 0.15
      ) {
        const r = atmo.radius ?? 18;
        redPropsAndAtmo.push({
          id: atmo.id || atmo.type,
          kind: 'atmosphere',
          screenPx2: Math.PI * r * r * PX2_PER_STAGE_UNIT2 * zoom2,
        });
      }
    }

    // Chén trên tay không tính là vật đỏ nếu cảnh đã có vật đỏ khác (trừ khi chén trên tay là vật duy nhất của cú lật)
    const redEntities = [...redPropsAndAtmo];
    for (const tc of handTeacups) {
      if (tc.explicitTwist || redPropsAndAtmo.length === 0) {
        redEntities.push(tc);
      }
    }

    if (!bestRedSnapshot || redEntities.length > bestRedSnapshot.length) {
      bestRedSnapshot = redEntities;
    }
  }

  const reds = bestRedSnapshot || [];
  if (reds.length === 0) {
    issues.redCount.push('Không có vật đỏ nào sau cú lật (0 vật đỏ)');
  } else if (reds.length > 1) {
    issues.redCount.push(
      `Có ${reds.length} vật đỏ cùng lúc (${reds.map((r) => `${r.id} [${Math.round(r.screenPx2)}px²]`).join(', ')})`
    );
  }

  if (reds.length >= 1) {
    const primaryRed = reds.reduce((a, b) =>
      a.screenPx2 >= b.screenPx2 ? a : b
    );
    if (primaryRed.screenPx2 < MIN_RED_AREA_PX2) {
      issues.redTooSmall.push(
        `Vật đỏ "${primaryRed.id}" quá nhỏ (${Math.round(primaryRed.screenPx2)} px² < ngưỡng ${MIN_RED_AREA_PX2} px²)`
      );
    }
  }

  const totalIssueCount = Object.values(issues).reduce(
    (s, arr) => s + arr.length,
    0
  );
  return {
    sceneId,
    name: rawScript.name || sceneId,
    issues,
    totalIssueCount,
  };
}

function main() {
  const stageScripts = JSON.parse(fs.readFileSync(STAGE_SCRIPTS_PATH, 'utf8'));
  const customPropsMap = JSON.parse(fs.readFileSync(CUSTOM_PROPS_PATH, 'utf8'));
  const { scriptToCups, cupsList } = loadCupMappings();

  const allScriptAudits = {};
  for (const [sceneId, rawScript] of Object.entries(stageScripts)) {
    const linkedCups = scriptToCups.get(sceneId) || [];
    allScriptAudits[sceneId] = auditSingleScript(
      sceneId,
      rawScript,
      customPropsMap,
      linkedCups[0] || null
    );
  }

  const cupRows = cupsList.map((c) => {
    const audit = allScriptAudits[c.sceneId] || null;
    return {
      cupNumber: c.cupNumber,
      title: c.title,
      sceneId: c.sceneId,
      inStageScripts: Boolean(audit),
      audit,
    };
  });

  const countByCat = (auditsList) => {
    const tally = {
      customShapes: 0,
      overlaps: 0,
      floating: 0,
      outOfBounds: 0,
      redCount: 0,
      redTooSmall: 0,
    };
    for (const a of auditsList) {
      if (!a) continue;
      for (const k of Object.keys(tally)) {
        if (a.issues[k].length > 0) tally[k] += 1;
      }
    }
    return tally;
  };

  const cupAuditsOnly = cupRows.map((r) => r.audit).filter(Boolean);
  const allAuditsList = Object.values(allScriptAudits);
  const cupCatSummary = countByCat(cupAuditsOnly);
  const allCatSummary = countByCat(allAuditsList);

  const md = [];
  md.push('# Báo Cáo Kiểm Toán Sân Khấu (Cập nhật Luật Lớp Sâu `nen/giua/truoc` & Lấy Mẫu Toàn Video)');
  md.push('');
  md.push(`- Ngưỡng diện tích vật đỏ thống nhất: **\`MIN_RED_AREA_PX2 = ${MIN_RED_AREA_PX2} px²\`**`);
  md.push(`- Bước lấy mẫu thời gian dọc video: **\`${VALIDATION_SAMPLE_STEP_SEC}s\`** (~50–60 khung mẫu/Chén)`);
  md.push('');
  md.push('## 1. Thống kê tần suất 6 loại lỗi sau khi áp luật mới');
  md.push('');
  md.push('| Nhóm lỗi kiểm toán | Trên 15 Chén dùng `stage-scripts.json` | Trên toàn bộ 51 script |');
  md.push('| :--- | :---: | :---: |');
  md.push(`| 1. Tự vẽ \`shapes\` / ngoài 26 đạo cụ gốc | **${cupCatSummary.customShapes}/15** | **${allCatSummary.customShapes}/51** |`);
  md.push(`| 2. Hai vật đè nhau CÙNG LỚP (\`nen/giua/truoc\`) | **${cupCatSummary.overlaps}/15** | **${allCatSummary.overlaps}/51** |`);
  md.push(`| 3. Vật lơ lửng | **${cupCatSummary.floating}/15** | **${allCatSummary.floating}/51** |`);
  md.push(`| 4. Ngoài vùng an toàn của terrain | **${cupCatSummary.outOfBounds}/15** | **${allCatSummary.outOfBounds}/51** |`);
  md.push(`| 5. Không có hoặc nhiều hơn 1 vật đỏ | **${cupCatSummary.redCount}/15** | **${allCatSummary.redCount}/51** |`);
  md.push(`| 6. Vật đỏ quá nhỏ (< ${MIN_RED_AREA_PX2} px²) | **${cupCatSummary.redTooSmall}/15** | **${allCatSummary.redTooSmall}/51** |`);
  md.push('');
  md.push('## 2. Danh sách các Chén còn lỗi đè nhau cùng lớp');
  md.push('');
  for (const row of cupRows) {
    if (!row.audit || row.audit.issues.overlaps.length === 0) continue;
    md.push(`- **Chén ${row.cupNumber} — ${row.title}** (\`${row.sceneId}\`): ${row.audit.issues.overlaps.join('; ')}`);
  }

  const mdStr = md.join('\n') + '\n';
  fs.writeFileSync(path.join(OUT_DIR, 'STAGE_AUDIT_STEP0.md'), mdStr, 'utf8');
  fs.writeFileSync(
    path.join(OUT_DIR, 'stage-audit-step0.json'),
    JSON.stringify({ cupCatSummary, allCatSummary, cupRows, allScriptAudits }, null, 2),
    'utf8'
  );
  console.log(mdStr);
}

main();
