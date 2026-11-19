import rawCustomProps from '../../data/custom-props.json';
import { computeTimelineSync, TimelineSyncResult } from '../engine/timelineSync';
import type { ResolvedVisualDNA } from '../engine/visualDnaResolver';
import { THEME_PALETTES } from '../theme/palettes';
import {
  APPROVAL_BATCH_PROP_NAMES,
  BUILT_IN_PROP_CATALOG,
  BUILT_IN_PROP_NAMES,
} from './propCatalog';
import { isFreeModeStageScript, isLegacyStageScript } from './legacySceneIds';
import {
  ANCHOR_KINDS,
  computeExpectedCatalogSpanFromCm,
  DEFAULT_SCENE_SCALE,
  HE_SO_PHONG_DAI,
  LU_KHACH_HEIGHT_RATIO,
  MAX_REAL_SIZE_DEVIATION,
  MAX_RED_BBOX_DELTA,
  MIN_RED_AREA_PX2,
  MIN_RED_SILHOUETTE_IOU,
  MIN_WALL_CLEARANCE_UNITS,
  NGUONG_VAT_NHO_CM,
  SEMANTIC_LAYERS,
  SEMANTIC_SLOTS,
  SemanticLayer,
  TEMPO,
  TRAVELER_HAND_TEACUP_SPAN,
  TY_LE_CANH,
  VALIDATION_SAMPLE_STEP_SEC,
} from './stageConstants';
import {
  compareNormalAndRedSilhouette,
  computePropRedStageArea,
  computeShapesLocalBBox,
  getActorWorldBBox,
  getPropWorldBBox,
  PX2_PER_STAGE_UNIT2,
  resolveEffectiveSemanticLayer,
  STAGE_VB_X0,
  STAGE_VB_X1,
  STAGE_VB_Y0,
  STAGE_VB_Y1,
  suggestClosestName,
} from './stageGeometry';
import {
  classifySemanticBeatTempo,
  compileSemanticStageScript,
  isSemanticStageScript,
  resolveSemanticBackdropName,
  SEMANTIC_ACTOR_ROLES,
  SEMANTIC_BACKDROPS,
  SEMANTIC_LAYOUTS,
  SEMANTIC_LEANS,
  SEMANTIC_LIGHTINGS,
  SEMANTIC_PIVOT_STYLES,
  SEMANTIC_POSES,
  SEMANTIC_SOCKETS,
  SEMANTIC_TERRAINS,
  SemanticStageScript,
} from './semanticStage';
import { computeTerrainSegmentArcLength, getTerrainPoint, resolveXCoord } from './terrainSystem';
import { evaluateEnterLeaveMultiplier, resolveCueFrame } from './timeResolver';
import { evaluateStageScriptAtFrame } from './trackCompiler';
import type { CustomPropDefinition, StageScript } from './stageScriptSchema';

const CUSTOM_ONLY_PROP_NAMES = new Set(
  Object.keys(rawCustomProps as Record<string, unknown>).filter(
    (k) => !(k in BUILT_IN_PROP_CATALOG)
  )
);

const APPROVAL_BATCH_SET = new Set<string>(APPROVAL_BATCH_PROP_NAMES);

const RECOMMENDED_RED_PROPS = [
  'desk_calendar',
  'desk_laptop',
  'vi_tien',
  'thiep',
  'phong_bi',
  'hoa_don',
  'wine_jar',
  'umbrella',
];

const ALLOWED_SEMANTIC_ROOT_KEYS = new Set([
  'semanticVersion',
  'sceneId',
  'ten',
  'mo_ta',
  'boi_canh',
  'kieu_cu_lat',
  'bo_cuc',
  'anh_sang',
  'vat_do_tren_tay',
  'nhan_vat',
  'dao_cu',
  'nhip',
]);

const ALLOWED_BOI_CANH_KEYS = new Set(['bo', 'dia_hinh', 'khi_quyen', 'doan_duong']);
const ALLOWED_KHI_QUYEN_KEYS = new Set(['id', 'loai', 'vi_tri', 'huong', 'mat_do']);
const ALLOWED_DOAN_DUONG_KEYS = new Set(['id', 'vi_tri', 'nhan_vat', 'tu', 'den', 'vat_do']);
const ALLOWED_NHAN_VAT_KEYS = new Set([
  'id',
  'vai',
  'toc_duoi_ngua',
  'vi_tri',
  'ngoi_tren',
  'ngoi_vao',
  'huong',
  'tu_the',
  'nghieng',
  'nhin_theo',
  'lop',
  'cam_chen_tra',
  'xuat_hien_tu',
  'roi_di_luc',
]);
const ALLOWED_DAO_CU_KEYS = new Set([
  'id',
  'type',
  'trang_thai',
  'loai_neo',
  'vi_tri',
  'dat_tren',
  'cam_boi',
  'lop',
  'vat_do',
  'xuat_hien_tu',
]);
const ALLOWED_NHIP_KEYS = new Set([
  'moc',
  'sau',
  'thoi_luong',
  'nhan_vat',
  'dao_cu',
  'doan_duong',
]);
const ALLOWED_NHIP_ACTOR_KEYS = new Set([
  'tu_the',
  'di_toi',
  'di_vao',
  'di_ra',
  'huong',
  'nghieng',
  'nhin_theo',
  'nhin_nhau',
  'khung_lai',
  'lui_buoc',
  'quay_dau',
  'tha_roi',
  'cam_chen_tra',
  'dung_day',
]);
const ALLOWED_NHIP_PROP_KEYS = new Set([
  'trang_thai',
  'cam_boi',
  'dat_tren',
  'di_toi',
  'bay_len',
  'tach_doi',
  'khoi',
  'tha_roi',
]);
const ALLOWED_NHIP_DOAN_DUONG_KEYS = new Set(['duong_mo', 'doi_do']);
const FORBIDDEN_COORD_KEYS = new Set([
  'x',
  'y',
  'toX',
  'toY',
  'yOffset',
  'scale',
  'shapes',
  'altShapes',
]);

export interface StageValidationIssue {
  code:
    | 'UNKNOWN_KEY'
    | 'UNKNOWN_NAME'
    | 'CUSTOM_PROP_FORBIDDEN'
    | 'MISSING_CATALOG_METADATA'
    | 'SINGLE_MEANING_VIOLATION'
    | 'RED_SILHOUETTE_MISMATCH'
    | 'REAL_SIZE_SCALING_VIOLATION'
    | 'SAME_TYPE_SIZE_MISMATCH'
    | 'INVALID_ANCHOR'
    | 'INVALID_SEATING'
    | 'OVERLAP_COLLISION'
    | 'EXCESSIVE_MOTION'
    | 'FLOATING_OBJECT'
    | 'OUT_OF_SAFE_TERRAIN'
    | 'STAGE_OVERFLOW'
    | 'TRAVELER_SCALE_DEVIATION'
    | 'RED_OBJECT_RULE'
    | 'TEMPO_RULE_VIOLATION'
    | 'PIVOT_ORDER_VIOLATION';
  /** 'error' = chặn cứng; 'warn' = cảnh báo vàng (làn tự do TF1, không chặn nhập/render) */
  severity?: 'error' | 'warn';
  /** Thời điểm xảy ra tính bằng giây (dùng cho TF2 chụp đúng khung cảnh báo/lỗi) */
  timeSec?: number;
  message: string;
}

export interface StageValidationResult {
  valid: boolean;
  isLegacy: boolean;
  isFreeMode?: boolean;
  issues: StageValidationIssue[];
  /** Danh sách cảnh báo vàng (kèm timeSec) — chỉ xuất hiện khi có cảnh báo không chặn */
  warnings?: StageValidationIssue[];
  compiledScript?: StageScript;
}

function checkUnknownKeys(
  scope: string,
  obj: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  issues: StageValidationIssue[]
): void {
  const allowedList = Array.from(allowed);
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_COORD_KEYS.has(key)) {
      issues.push({
        code: 'UNKNOWN_KEY',
        message: `${scope}: không được ghi trực tiếp "${key}" trong kịch bản ngữ nghĩa (hãy dùng khe vị trí hoặc điểm neo).`,
      });
      continue;
    }
    if (!allowed.has(key)) {
      const hint = suggestClosestName(key, allowedList);
      issues.push({
        code: 'UNKNOWN_KEY',
        message: `${scope}: khoá lạ "${key}" không hợp lệ${hint ? `, ý bạn là "${hint}"?` : ` (hợp lệ: ${allowedList.join(', ')})`}`,
      });
    }
  }
}

/**
 * Kiểm tự động các luật đạo cụ trong propCatalog:
 * 1. MỘT VẬT, MỘT NGHĨA: không gộp 2 vật bằng dấu `/`, đủ mô tả 5 câu, hộp bao `box` khớp khít với hình vẽ của chính nó.
 * 2. Bản đỏ GIỐNG HỆT DÁNG bản thường, chỉ khác màu: hộp bao và silhouette 2D giữa bản thường và bản đỏ trùng nhau.
 * 3. Luật phóng đại vật nhỏ: bắt buộc có `kich_thuoc_that` (cm), kích thước hiển thị = `kich_thuoc_that × TY_LE_CANH × he_so`
 *    (`he_so = HE_SO_PHONG_DAI = 2.0` nếu `< 30 cm`, `1.0` nếu `>= 30 cm`), lệch quá 15% thì chặn cứng.
 * 4. Đồng nhất kích thước chén trà: `small_cup` phải cùng kích thước với chén trà trên tay Lữ khách.
 */
export function validatePropDefinitionRules(
  typeName: string,
  def: CustomPropDefinition
): StageValidationIssue[] {
  const issues: StageValidationIssue[] = [];
  const mustEnforceFullSpec =
    def.status === 'duyet' || APPROVAL_BATCH_SET.has(typeName) || Boolean(def.box);

  if (!mustEnforceFullSpec) {
    return issues;
  }

  if (def.labelVi && def.labelVi.includes('/')) {
    issues.push({
      code: 'SINGLE_MEANING_VIOLATION',
      message: `propCatalog["${typeName}"]: tên "${def.labelVi}" đang gộp nhiều vật bằng dấu "/". Luật bắt buộc: MỘT VẬT, MỘT NGHĨA.`,
    });
  }

  if (!def.description5) {
    issues.push({
      code: 'MISSING_CATALOG_METADATA',
      message: `propCatalog["${typeName}"]: thiếu mô tả 5 câu bắt buộc (nghĩa, cấu trúc, bóng dáng, thế giới, người lạ).`,
    });
  }

  if (def.kich_thuoc_that === undefined || def.kich_thuoc_that <= 0) {
    issues.push({
      code: 'MISSING_CATALOG_METADATA',
      message: `propCatalog["${typeName}"]: thiếu khai báo kich_thuoc_that (cm).`,
    });
  }

  if (!def.box) {
    issues.push({
      code: 'MISSING_CATALOG_METADATA',
      message: `propCatalog["${typeName}"]: thiếu khai báo hộp bao (box).`,
    });
  } else {
    const geomBox = computeShapesLocalBBox(def.shapes, false);
    if (geomBox) {
      const boxErr = Math.max(
        Math.abs(def.box[0] - geomBox.minX),
        Math.abs(def.box[1] - geomBox.minY),
        Math.abs(def.box[2] - geomBox.maxX),
        Math.abs(def.box[3] - geomBox.maxY)
      );
      if (boxErr > 1.6) {
        issues.push({
          code: 'SINGLE_MEANING_VIOLATION',
          message: `propCatalog["${typeName}"]: hộp bao khai báo [${def.box.join(', ')}] lệch ${boxErr.toFixed(2)} đơn vị so với hình thật [${geomBox.minX.toFixed(1)}, ${geomBox.minY.toFixed(1)}, ${geomBox.maxX.toFixed(1)}, ${geomBox.maxY.toFixed(1)}].`,
        });
      }
    }

    // Kiểm tra Luật 1: Kích thước hiển thị = kich_thuoc_that × TY_LE_CANH × HE_SO_PHONG_DAI (lệch tối đa 15%)
    if (def.kich_thuoc_that && def.kich_thuoc_that > 0) {
      const expectedSpan = computeExpectedCatalogSpanFromCm(def.kich_thuoc_that);
      const actualSpan = Math.max(
        def.box[2] - def.box[0],
        def.box[3] - def.box[1]
      );
      const deviation = Math.abs(actualSpan - expectedSpan) / expectedSpan;
      if (deviation > MAX_REAL_SIZE_DEVIATION) {
        const heSo =
          def.kich_thuoc_that < NGUONG_VAT_NHO_CM ? HE_SO_PHONG_DAI : 1.0;
        issues.push({
          code: 'REAL_SIZE_SCALING_VIOLATION',
          message: `propCatalog["${typeName}"]: kích thước hiển thị ${actualSpan.toFixed(2)} lệch ${(deviation * 100).toFixed(1)}% (> 15%) so với công thức (${def.kich_thuoc_that}cm × ${TY_LE_CANH} × ${heSo} = ${expectedSpan.toFixed(2)}).`,
        });
      }
    }

    // Kiểm tra Luật 6: Chén trà `small_cup` / `chen_tra` phải cùng kích thước với chén trên tay Lữ khách
    if (typeName === 'small_cup' || typeName === 'chen_tra') {
      const cupSpan = Math.max(
        def.box[2] - def.box[0],
        def.box[3] - def.box[1]
      );
      if (Math.abs(cupSpan - TRAVELER_HAND_TEACUP_SPAN) > 0.35) {
        issues.push({
          code: 'SAME_TYPE_SIZE_MISMATCH',
          message: `propCatalog["small_cup"]: kích thước chén trà đặt ngoài (${cupSpan.toFixed(2)}) không bằng chén trà trên tay Lữ khách (${TRAVELER_HAND_TEACUP_SPAN.toFixed(2)}).`,
        });
      }
    }
  }

  // Luật Bản đỏ GIỐNG HỆT DÁNG bản thường
  if (def.canBeRed === false && def.altShapes && def.altShapes.length > 0) {
    issues.push({
      code: 'RED_SILHOUETTE_MISMATCH',
      message: `propCatalog["${typeName}"]: canBeRed=false nhưng vẫn khai báo altShapes.`,
    });
  }

  if (def.altShapes && def.altShapes.length > 0) {
    const cmp = compareNormalAndRedSilhouette(def.shapes, def.altShapes);
    if (cmp.maxBBoxDelta > MAX_RED_BBOX_DELTA) {
      issues.push({
        code: 'RED_SILHOUETTE_MISMATCH',
        message: `propCatalog["${typeName}"]: hộp bao bản đỏ lệch ${cmp.maxBBoxDelta.toFixed(2)} đơn vị so với bản thường (tối đa ${MAX_RED_BBOX_DELTA}). Bản đỏ phải giống hệt dáng bản thường.`,
      });
    }
    if (cmp.silhouetteIoU < MIN_RED_SILHOUETTE_IOU) {
      issues.push({
        code: 'RED_SILHOUETTE_MISMATCH',
        message: `propCatalog["${typeName}"]: silhouette bản đỏ chỉ trùng ${(cmp.silhouetteIoU * 100).toFixed(1)}% so với bản thường (yêu cầu >= ${(MIN_RED_SILHOUETTE_IOU * 100).toFixed(0)}%).`,
      });
    }
  }

  if (def.variants) {
    for (const [vName, vDef] of Object.entries(def.variants)) {
      if (vDef.box && def.kich_thuoc_that) {
        const expectedSpan = computeExpectedCatalogSpanFromCm(def.kich_thuoc_that);
        const vSpan = Math.max(
          vDef.box[2] - vDef.box[0],
          vDef.box[3] - vDef.box[1]
        );
        // Cho phép biến thể gập gọn (`umbrella.gap`) có chiều dài cán tương đương, các biến thể khác lệch <= 15%
        const dev = Math.abs(vSpan - expectedSpan) / expectedSpan;
        if (vName !== 'gap' && dev > MAX_REAL_SIZE_DEVIATION) {
          issues.push({
            code: 'REAL_SIZE_SCALING_VIOLATION',
            message: `propCatalog["${typeName}"].variants["${vName}"]: kích thước ${vSpan.toFixed(2)} lệch ${(dev * 100).toFixed(1)}% (> 15%) so với kết quả tính ${expectedSpan.toFixed(2)}.`,
          });
        }
      }
      if (vDef.altShapes && vDef.altShapes.length > 0) {
        const cmpV = compareNormalAndRedSilhouette(vDef.shapes, vDef.altShapes);
        if (cmpV.maxBBoxDelta > MAX_RED_BBOX_DELTA || cmpV.silhouetteIoU < MIN_RED_SILHOUETTE_IOU) {
          issues.push({
            code: 'RED_SILHOUETTE_MISMATCH',
            message: `propCatalog["${typeName}"].variants["${vName}"]: bản đỏ không trùng dáng bản thường (lệch box ${cmpV.maxBBoxDelta.toFixed(2)}, IoU ${(cmpV.silhouetteIoU * 100).toFixed(1)}%).`,
          });
        }
      }
    }
  }

  return issues;
}

export function validateCatalogPropsHard(): StageValidationIssue[] {
  const allIssues: StageValidationIssue[] = [];
  for (const [name, def] of Object.entries(BUILT_IN_PROP_CATALOG)) {
    allIssues.push(...validatePropDefinitionRules(name, def));
  }
  return allIssues;
}

function buildFallbackTimeline(): TimelineSyncResult {
  return computeTimelineSync({
    id: 'validator-timeline',
    textFormat: 'POEM',
    segments: [
      'Dòng một mở cảnh nhẹ nhàng,',
      'Dòng hai nhịp bước sang ngang,',
      'Dòng ba lặng giữa chiều tàn,',
      'Dòng bốn chạm điểm lật vàng chu sa.',
    ],
    pivotWord: 'chu sa',
    highlightStyle: 'BOTH',
    targetDurationSeconds: 15,
    durationMode: 'FIXED',
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: 'MINIMAL_LIGHT',
    motion: {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -16 },
      stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 0 },
    },
    bgm: { audioMode: 'PIVOT_ACCENT', foleyPivotStyle: 'AUTO' },
    brandText: 'TRÀ NGUỘI',
  });
}

export function validateSemanticSpecStructure(
  raw: unknown
): StageValidationIssue[] {
  const issues: StageValidationIssue[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return [{ code: 'UNKNOWN_KEY', message: 'Kịch bản ngữ nghĩa phải là một object JSON.' }];
  }

  const sem = raw as Record<string, unknown>;
  checkUnknownKeys('root', sem, ALLOWED_SEMANTIC_ROOT_KEYS, issues);

  for (const req of ['semanticVersion', 'sceneId', 'ten', 'nhan_vat', 'dao_cu', 'nhip']) {
    if (!(req in sem)) {
      issues.push({
        code: 'UNKNOWN_KEY',
        message: `Thiếu trường bắt buộc "${req}" ở cấp gốc.`,
      });
    }
  }

  if (sem.kieu_cu_lat !== undefined && !(String(sem.kieu_cu_lat) in SEMANTIC_PIVOT_STYLES)) {
    const validStyles = Object.keys(SEMANTIC_PIVOT_STYLES);
    const hint = suggestClosestName(String(sem.kieu_cu_lat), validStyles);
    issues.push({
      code: 'UNKNOWN_NAME',
      message: `kieu_cu_lat: "${sem.kieu_cu_lat}" không hợp lệ (chỉ có: ${validStyles.join(', ')})${hint ? `, ý bạn là "${hint}"?` : ''}`,
    });
  }

  if (sem.bo_cuc !== undefined && !(String(sem.bo_cuc) in SEMANTIC_LAYOUTS)) {
    const validLayouts = Object.keys(SEMANTIC_LAYOUTS);
    const hint = suggestClosestName(String(sem.bo_cuc), validLayouts);
    issues.push({
      code: 'UNKNOWN_NAME',
      message: `bo_cuc: "${sem.bo_cuc}" không hợp lệ (chỉ có: ${validLayouts.join(', ')})${hint ? `, ý bạn là "${hint}"?` : ''}`,
    });
  }

  if (sem.anh_sang !== undefined && !(String(sem.anh_sang) in SEMANTIC_LIGHTINGS)) {
    const validLights = Object.keys(SEMANTIC_LIGHTINGS);
    const hint = suggestClosestName(String(sem.anh_sang), validLights);
    issues.push({
      code: 'UNKNOWN_NAME',
      message: `anh_sang: "${sem.anh_sang}" không hợp lệ (chỉ có: ${validLights.join(', ')})${hint ? `, ý bạn là "${hint}"?` : ''}`,
    });
  }

  if (sem.boi_canh && typeof sem.boi_canh === 'object') {
    const bc = sem.boi_canh as Record<string, unknown>;
    checkUnknownKeys('boi_canh', bc, ALLOWED_BOI_CANH_KEYS, issues);
    if (bc.bo !== undefined && !resolveSemanticBackdropName(String(bc.bo))) {
      const validBos = Object.keys(SEMANTIC_BACKDROPS);
      const hint = suggestClosestName(String(bc.bo), validBos);
      issues.push({
        code: 'UNKNOWN_NAME',
        message: `boi_canh.bo: "${bc.bo}" không có trong 9 bộ bối cảnh (${validBos.join(', ')})${hint ? `, ý bạn là "${hint}"?` : ''}`,
      });
    }
    if (bc.dia_hinh !== undefined && !(String(bc.dia_hinh) in SEMANTIC_TERRAINS)) {
      const hint = suggestClosestName(String(bc.dia_hinh), Object.keys(SEMANTIC_TERRAINS));
      issues.push({
        code: 'UNKNOWN_NAME',
        message: `boi_canh.dia_hinh: "${bc.dia_hinh}" không có${hint ? `, ý bạn là "${hint}"?` : ''}`,
      });
    }
    if (Array.isArray(bc.khi_quyen)) {
      bc.khi_quyen.forEach((kq, i) => {
        if (kq && typeof kq === 'object') {
          checkUnknownKeys(`boi_canh.khi_quyen[${i}]`, kq as Record<string, unknown>, ALLOWED_KHI_QUYEN_KEYS, issues);
        }
      });
    }
  }

  const slotNames = Object.keys(SEMANTIC_SLOTS);
  const terrainSegIds = new Set<string>();
  const terrainSegRefs: Array<{ idx: number; id: string; actor?: string }> = [];
  if (sem.boi_canh && typeof sem.boi_canh === 'object') {
    const bc = sem.boi_canh as Record<string, unknown>;
    if (Array.isArray(bc.doan_duong)) {
      bc.doan_duong.forEach((rawSeg, i) => {
        if (!rawSeg || typeof rawSeg !== 'object') return;
        const sg = rawSeg as Record<string, unknown>;
        const scope = `boi_canh.doan_duong[${i}] (${sg.id || '?'})`;
        checkUnknownKeys(scope, sg, ALLOWED_DOAN_DUONG_KEYS, issues);
        const sid = String(sg.id || '').trim();
        if (!sid) {
          issues.push({
            code: 'UNKNOWN_KEY',
            message: `${scope}: đoạn đường cần có trường "id" (vd: "duong_lui").`,
          });
        } else {
          terrainSegIds.add(sid);
        }
        const validSegPositions = ['sau_lung', 'truoc_mat', 'tu_trai', 'giua', 'tu_phai'];
        if (sg.vi_tri !== undefined && !validSegPositions.includes(String(sg.vi_tri))) {
          const hint = suggestClosestName(String(sg.vi_tri), validSegPositions);
          issues.push({
            code: 'UNKNOWN_NAME',
            message: `${scope}: vị trí đoạn đường "${sg.vi_tri}" không hợp lệ${hint ? `, ý bạn là "${hint}"?` : ` (có: ${validSegPositions.join(', ')})`}`,
          });
        }
        for (const k of ['tu', 'den'] as const) {
          if (sg[k] !== undefined && !(String(sg[k]) in SEMANTIC_SLOTS)) {
            const hint = suggestClosestName(String(sg[k]), slotNames);
            issues.push({
              code: 'UNKNOWN_NAME',
              message: `${scope}: ${k} "${sg[k]}" không có${hint ? `, ý bạn là "${hint}"?` : ''}`,
            });
          }
        }
        if (sg.nhan_vat !== undefined) {
          terrainSegRefs.push({ idx: i, id: sid || '?', actor: String(sg.nhan_vat) });
        }
      });
    }
  }
  const propIds = new Map<string, { type: string }>();
  const actorIds = new Set<string>();

  if (Array.isArray(sem.dao_cu)) {
    sem.dao_cu.forEach((rawP, i) => {
      if (!rawP || typeof rawP !== 'object') return;
      const p = rawP as Record<string, unknown>;
      const scope = `dao_cu[${i}] (${p.id || '?'})`;
      checkUnknownKeys(scope, p, ALLOWED_DAO_CU_KEYS, issues);

      const id = String(p.id || '');
      const typeName = String(p.type || '');
      if (id) propIds.set(id, { type: typeName });

      if (CUSTOM_ONLY_PROP_NAMES.has(typeName)) {
        const hint = suggestClosestName(typeName, BUILT_IN_PROP_NAMES);
        issues.push({
          code: 'CUSTOM_PROP_FORBIDDEN',
          message: `${scope}: "${typeName}" nằm trong custom-props.json (chỉ đọc cho bản cũ), kịch bản mới chỉ được dùng propCatalog${hint ? `. Ý bạn là "${hint}"?` : '.'}`,
        });
        return;
      }

      const catDef = BUILT_IN_PROP_CATALOG[typeName];
      if (!catDef) {
        const hint = suggestClosestName(typeName, BUILT_IN_PROP_NAMES);
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `${scope}: "${typeName}" không có trong propCatalog${hint ? `, ý bạn là "${hint}"?` : ` (có: ${BUILT_IN_PROP_NAMES.join(', ')})`}`,
        });
        return;
      }

      issues.push(...validatePropDefinitionRules(typeName, catDef));

      if (p.trang_thai !== undefined && p.trang_thai !== 'mac_dinh') {
        const stName = String(p.trang_thai);
        const validStates = ['mac_dinh', ...Object.keys(catDef.variants ?? {})];
        if (!catDef.variants?.[stName]) {
          const hint = suggestClosestName(stName, validStates);
          issues.push({
            code: 'UNKNOWN_NAME',
            message: `${scope}: đạo cụ "${typeName}" không có trạng thái "${stName}"${hint ? `, ý bạn là "${hint}"?` : ` (trạng thái hợp lệ: ${validStates.join(', ')})`}`,
          });
        }
      }

      if (p.lop !== undefined && !SEMANTIC_LAYERS.includes(p.lop as SemanticLayer)) {
        const hint = suggestClosestName(String(p.lop), SEMANTIC_LAYERS);
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `${scope}: lớp "${p.lop}" không hợp lệ${hint ? `, ý bạn là "${hint}"?` : ' (chỉ nhận: nen, giua, truoc)'}`,
        });
      }

      if (
        p.loai_neo !== undefined &&
        !ANCHOR_KINDS.includes(p.loai_neo as (typeof ANCHOR_KINDS)[number])
      ) {
        const hint = suggestClosestName(String(p.loai_neo), ANCHOR_KINDS);
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `${scope}: loại neo "${p.loai_neo}" không hợp lệ${hint ? `, ý bạn là "${hint}"?` : ' (chỉ nhận: dat, tuong, troi, tren, cam)'}`,
        });
      }

      if (p.vi_tri !== undefined && !(String(p.vi_tri) in SEMANTIC_SLOTS)) {
        const hint = suggestClosestName(String(p.vi_tri), slotNames);
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `${scope}: khe vị trí "${p.vi_tri}" không có${hint ? `, ý bạn là "${hint}"?` : ` (có: ${slotNames.join(', ')})`}`,
        });
      }

      const effectiveKind =
        (p.loai_neo as string | undefined) ??
        (p.dat_tren ? 'tren' : p.cam_boi ? 'cam' : catDef.anchorKind ?? 'dat');

      if (effectiveKind === 'tren') {
        const dt = String(p.dat_tren || '');
        const [hostId, ancName] = dt.split('.');
        const host = propIds.get(hostId);
        if (!dt || !hostId || !ancName) {
          issues.push({
            code: 'INVALID_ANCHOR',
            message: `${scope}: loại neo "tren" bắt buộc khai báo dat_tren dạng "<id_vat_chu>.<diem_neo>".`,
          });
        } else if (!host) {
          const hint = suggestClosestName(hostId, Array.from(propIds.keys()));
          issues.push({
            code: 'INVALID_ANCHOR',
            message: `${scope}: vật chủ "${hostId}" trong dat_tren "${dt}" chưa được khai báo trước đó${hint ? `, ý bạn là "${hint}"?` : ''}.`,
          });
        } else {
          const hostDef = BUILT_IN_PROP_CATALOG[host.type];
          const hostAnchors = Object.keys(hostDef?.anchors ?? {});
          if (!hostDef?.anchors?.[ancName]) {
            const hint = suggestClosestName(ancName, hostAnchors);
            issues.push({
              code: 'INVALID_ANCHOR',
              message: `${scope}: đạo cụ "${hostId}" (${host.type}) không có điểm neo "${ancName}"${hint ? `, ý bạn là "${hostId}.${hint}"?` : ` (điểm neo hợp lệ: ${hostAnchors.join(', ') || 'không có'})`}`,
            });
          }
        }
      }

      if (p.vat_do === true && catDef.canBeRed === false) {
        issues.push({
          code: 'RED_OBJECT_RULE',
          message: `${scope}: đạo cụ "${typeName}" là đồ nội thất/kiến trúc lớp nền nên không được dùng làm vật đỏ cú lật.`,
        });
      }
    });
  }

  if (Array.isArray(sem.nhan_vat)) {
    sem.nhan_vat.forEach((rawA, i) => {
      if (!rawA || typeof rawA !== 'object') return;
      const a = rawA as Record<string, unknown>;
      const scope = `nhan_vat[${i}] (${a.id || '?'})`;
      checkUnknownKeys(scope, a, ALLOWED_NHAN_VAT_KEYS, issues);

      const id = String(a.id || '');
      if (id) actorIds.add(id);

      if (
        a.vai !== undefined &&
        !SEMANTIC_ACTOR_ROLES.includes(String(a.vai) as (typeof SEMANTIC_ACTOR_ROLES)[number])
      ) {
        const hint = suggestClosestName(String(a.vai), [...SEMANTIC_ACTOR_ROLES]);
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `${scope}: vai "${a.vai}" không hợp lệ${hint ? `, ý bạn là "${hint}"?` : ` (chỉ nhận: ${SEMANTIC_ACTOR_ROLES.join(', ')})`}`,
        });
      }

      if (a.vi_tri !== undefined && !(String(a.vi_tri) in SEMANTIC_SLOTS)) {
        const hint = suggestClosestName(String(a.vi_tri), slotNames);
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `${scope}: khe vị trí "${a.vi_tri}" không có${hint ? `, ý bạn là "${hint}"?` : ` (có: ${slotNames.join(', ')})`}`,
        });
      }

      if (a.lop !== undefined && !SEMANTIC_LAYERS.includes(a.lop as SemanticLayer)) {
        const hint = suggestClosestName(String(a.lop), SEMANTIC_LAYERS);
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `${scope}: lớp "${a.lop}" không hợp lệ${hint ? `, ý bạn là "${hint}"?` : ''}`,
        });
      }

      if (a.tu_the !== undefined && !(String(a.tu_the) in SEMANTIC_POSES)) {
        const hint = suggestClosestName(String(a.tu_the), Object.keys(SEMANTIC_POSES));
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `${scope}: tư thế "${a.tu_the}" không có${hint ? `, ý bạn là "${hint}"?` : ` (có: ${Object.keys(SEMANTIC_POSES).join(', ')})`}`,
        });
      }

      if (
        a.nghieng !== undefined &&
        !(SEMANTIC_LEANS as readonly string[]).includes(String(a.nghieng))
      ) {
        const hint = suggestClosestName(String(a.nghieng), [...SEMANTIC_LEANS]);
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `${scope}: độ nghiêng "${a.nghieng}" không hợp lệ${hint ? `, ý bạn là "${hint}"?` : ` (có: ${SEMANTIC_LEANS.join(', ')})`}`,
        });
      }

      if (a.tu_the === 'ngoi_tua' && !a.ngoi_tren) {
        issues.push({
          code: 'INVALID_SEATING',
          message: `${scope}: nhân vật không được ngồi ("ngoi_tua") khi không khai báo ngoi_tren: "<ghe>.mat_ghe".`,
        });
      }

      if (a.ngoi_vao !== undefined) {
        const nv = String(a.ngoi_vao);
        const desk = propIds.get(nv);
        if (!desk) {
          const hint = suggestClosestName(nv, Array.from(propIds.keys()));
          issues.push({
            code: 'INVALID_SEATING',
            message: `${scope}: bàn "${nv}" trong ngoi_vao chưa được khai báo trong dao_cu${hint ? `, ý bạn là "${hint}"?` : ''}.`,
          });
        }
      }

      if (a.ngoi_tren !== undefined) {
        const nt = String(a.ngoi_tren);
        const [seatId, ancName] = nt.split('.');
        const seat = propIds.get(seatId);
        if (!seatId || ancName !== 'mat_ghe') {
          issues.push({
            code: 'INVALID_SEATING',
            message: `${scope}: ngoi_tren "${nt}" phải có dạng "<id_ghe>.mat_ghe".`,
          });
        } else if (!seat) {
          const hint = suggestClosestName(seatId, Array.from(propIds.keys()));
          issues.push({
            code: 'INVALID_SEATING',
            message: `${scope}: ghế "${seatId}" chưa được khai báo trong dao_cu${hint ? `, ý bạn là "${hint}"?` : ''}.`,
          });
        } else {
          const seatDef = BUILT_IN_PROP_CATALOG[seat.type];
          if (!seatDef?.anchors?.mat_ghe) {
            issues.push({
              code: 'INVALID_SEATING',
              message: `${scope}: đạo cụ "${seatId}" (${seat.type}) không phải ghế có điểm neo "mat_ghe".`,
            });
          }
        }
      }
    });
  }

  if (Array.isArray(sem.dao_cu)) {
    sem.dao_cu.forEach((rawP, i) => {
      if (!rawP || typeof rawP !== 'object') return;
      const p = rawP as Record<string, unknown>;
      if (p.cam_boi) {
        const [actorId, sock] = String(p.cam_boi).split('.');
        if (!actorIds.has(actorId)) {
          const hint = suggestClosestName(actorId, Array.from(actorIds));
          issues.push({
            code: 'INVALID_ANCHOR',
            message: `dao_cu[${i}] (${p.id}): cam_boi "${p.cam_boi}" trỏ tới nhân vật chưa tồn tại "${actorId}"${hint ? `, ý bạn là "${hint}"?` : ''}.`,
          });
        } else if (sock && !(sock in SEMANTIC_SOCKETS)) {
          issues.push({
            code: 'INVALID_ANCHOR',
            message: `dao_cu[${i}] (${p.id}): điểm cầm "${sock}" không hợp lệ (chỉ nhận: tay, dau, lung).`,
          });
        }
      }
    });
  }

  const allLookTargets = new Set<string>([...propIds.keys(), ...actorIds]);
  if (Array.isArray(sem.nhan_vat)) {
    sem.nhan_vat.forEach((rawA, i) => {
      if (!rawA || typeof rawA !== 'object') return;
      const a = rawA as Record<string, unknown>;
      if (a.nhin_theo && !allLookTargets.has(String(a.nhin_theo))) {
        const hint = suggestClosestName(String(a.nhin_theo), Array.from(allLookTargets));
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `nhan_vat[${i}] (${a.id}): nhin_theo "${a.nhin_theo}" không tồn tại${hint ? `, ý bạn là "${hint}"?` : ''}.`,
        });
      }
    });
  }

  for (const tref of terrainSegRefs) {
    if (tref.actor && !actorIds.has(tref.actor)) {
      const hint = suggestClosestName(tref.actor, Array.from(actorIds));
      issues.push({
        code: 'UNKNOWN_NAME',
        message: `boi_canh.doan_duong[${tref.idx}] (${tref.id}): nhan_vat "${tref.actor}" chưa khai báo trong nhan_vat${hint ? `, ý bạn là "${hint}"?` : ''}.`,
      });
    }
  }

  if (Array.isArray(sem.nhip)) {
    const validMocs = ['bat_dau', 'dong_1', 'dong_2', 'dong_3', 'dong_4', 'cu_lat'];
    sem.nhip.forEach((rawB, i) => {
      if (!rawB || typeof rawB !== 'object') return;
      const b = rawB as Record<string, unknown>;
      const scope = `nhip[${i}]`;
      checkUnknownKeys(scope, b, ALLOWED_NHIP_KEYS, issues);
      if (!validMocs.includes(String(b.moc || ''))) {
        const hint = suggestClosestName(String(b.moc || ''), validMocs);
        issues.push({
          code: 'UNKNOWN_NAME',
          message: `${scope}: mốc "${b.moc}" không hợp lệ${hint ? `, ý bạn là "${hint}"?` : ` (có: ${validMocs.join(', ')})`}`,
        });
      }
      if (b.nhan_vat && typeof b.nhan_vat === 'object') {
        for (const [aid, actObj] of Object.entries(b.nhan_vat as Record<string, unknown>)) {
          if (!actorIds.has(aid)) {
            const hint = suggestClosestName(aid, Array.from(actorIds));
            issues.push({
              code: 'UNKNOWN_NAME',
              message: `${scope}.nhan_vat: "${aid}" chưa khai báo${hint ? `, ý bạn là "${hint}"?` : ''}`,
            });
            continue;
          }
          if (actObj && typeof actObj === 'object') {
            const ao = actObj as Record<string, unknown>;
            checkUnknownKeys(`${scope}.nhan_vat.${aid}`, ao, ALLOWED_NHIP_ACTOR_KEYS, issues);
            if (ao.tu_the !== undefined && !(String(ao.tu_the) in SEMANTIC_POSES)) {
              const hint = suggestClosestName(String(ao.tu_the), Object.keys(SEMANTIC_POSES));
              issues.push({
                code: 'UNKNOWN_NAME',
                message: `${scope}.nhan_vat.${aid}: tư thế "${ao.tu_the}" không có${hint ? `, ý bạn là "${hint}"?` : ''}`,
              });
            }
            if (
              ao.nghieng !== undefined &&
              !(SEMANTIC_LEANS as readonly string[]).includes(String(ao.nghieng))
            ) {
              const hint = suggestClosestName(String(ao.nghieng), [...SEMANTIC_LEANS]);
              issues.push({
                code: 'UNKNOWN_NAME',
                message: `${scope}.nhan_vat.${aid}: độ nghiêng "${ao.nghieng}" không hợp lệ${hint ? `, ý bạn là "${hint}"?` : ` (có: ${SEMANTIC_LEANS.join(', ')})`}`,
              });
            }
            if (ao.tu_the === 'ngoi_tua') {
              const actorSpec = (sem.nhan_vat as Array<Record<string, unknown>>).find((x) => x.id === aid);
              if (!actorSpec?.ngoi_tren) {
                issues.push({
                  code: 'INVALID_SEATING',
                  message: `${scope}.nhan_vat.${aid}: không có ghế (ngoi_tren) thì không được chuyển sang tư thế ngồi.`,
                });
              }
            }
            if (ao.nhin_theo && !allLookTargets.has(String(ao.nhin_theo))) {
              const hint = suggestClosestName(String(ao.nhin_theo), Array.from(allLookTargets));
              issues.push({
                code: 'UNKNOWN_NAME',
                message: `${scope}.nhan_vat.${aid}: nhin_theo "${ao.nhin_theo}" không tồn tại${hint ? `, ý bạn là "${hint}"?` : ''}`,
              });
            }
            if (ao.di_toi !== undefined && !(String(ao.di_toi) in SEMANTIC_SLOTS)) {
              const hint = suggestClosestName(String(ao.di_toi), slotNames);
              issues.push({
                code: 'UNKNOWN_NAME',
                message: `${scope}.nhan_vat.${aid}: khe di_toi "${ao.di_toi}" không có${hint ? `, ý bạn là "${hint}"?` : ''}`,
              });
            }
            for (const dirKey of ['di_vao', 'di_ra'] as const) {
              if (
                ao[dirKey] !== undefined &&
                typeof ao[dirKey] !== 'boolean' &&
                ao[dirKey] !== 'trai' &&
                ao[dirKey] !== 'phai'
              ) {
                issues.push({
                  code: 'UNKNOWN_NAME',
                  message: `${scope}.nhan_vat.${aid}: ${dirKey} "${ao[dirKey]}" chỉ nhận "trai", "phai" hoặc true.`,
                });
              }
            }
            if (typeof ao.nhin_nhau === 'string' && !actorIds.has(ao.nhin_nhau)) {
              const hint = suggestClosestName(ao.nhin_nhau, Array.from(actorIds));
              issues.push({
                code: 'UNKNOWN_NAME',
                message: `${scope}.nhan_vat.${aid}: nhin_nhau "${ao.nhin_nhau}" chưa khai báo trong nhan_vat${hint ? `, ý bạn là "${hint}"?` : ''}`,
              });
            }
            if (typeof ao.tha_roi === 'string' && !propIds.has(ao.tha_roi)) {
              const hint = suggestClosestName(ao.tha_roi, Array.from(propIds.keys()));
              issues.push({
                code: 'UNKNOWN_NAME',
                message: `${scope}.nhan_vat.${aid}: tha_roi "${ao.tha_roi}" chưa khai báo trong dao_cu${hint ? `, ý bạn là "${hint}"?` : ''}`,
              });
            }
          }
        }
      }
      if (b.doan_duong && typeof b.doan_duong === 'object') {
        for (const [sid, sObj] of Object.entries(b.doan_duong as Record<string, unknown>)) {
          if (!terrainSegIds.has(sid)) {
            const hint = suggestClosestName(sid, Array.from(terrainSegIds));
            issues.push({
              code: 'UNKNOWN_NAME',
              message: `${scope}.doan_duong: "${sid}" chưa khai báo trong boi_canh.doan_duong${hint ? `, ý bạn là "${hint}"?` : ''}`,
            });
            continue;
          }
          if (sObj && typeof sObj === 'object') {
            checkUnknownKeys(
              `${scope}.doan_duong.${sid}`,
              sObj as Record<string, unknown>,
              ALLOWED_NHIP_DOAN_DUONG_KEYS,
              issues
            );
          }
        }
      }
      if (b.dao_cu && typeof b.dao_cu === 'object') {
        for (const [pid, pObj] of Object.entries(b.dao_cu as Record<string, unknown>)) {
          const propInfo = propIds.get(pid);
          if (!propInfo) {
            const hint = suggestClosestName(pid, Array.from(propIds.keys()));
            issues.push({
              code: 'UNKNOWN_NAME',
              message: `${scope}.dao_cu: "${pid}" chưa khai báo${hint ? `, ý bạn là "${hint}"?` : ''}`,
            });
            continue;
          }
          if (pObj && typeof pObj === 'object') {
            const po = pObj as Record<string, unknown>;
            checkUnknownKeys(`${scope}.dao_cu.${pid}`, po, ALLOWED_NHIP_PROP_KEYS, issues);
            if (po.trang_thai !== undefined && po.trang_thai !== 'mac_dinh') {
              const cDef = BUILT_IN_PROP_CATALOG[propInfo.type];
              const validSt = ['mac_dinh', ...Object.keys(cDef?.variants ?? {})];
              if (!cDef?.variants?.[String(po.trang_thai)]) {
                const hint = suggestClosestName(String(po.trang_thai), validSt);
                issues.push({
                  code: 'UNKNOWN_NAME',
                  message: `${scope}.dao_cu.${pid}: trạng thái "${po.trang_thai}" không hợp lệ${hint ? `, ý bạn là "${hint}"?` : ''}`,
                });
              }
            }
          }
        }
      }
    });

    // T7b #3: Chặn mọi lệnh làm mờ/biến mất (duong_mo, bay_len) áp lên chính vật đỏ trước khi hết video
    const redPropIds = new Set<string>(
      (Array.isArray(sem.dao_cu) ? sem.dao_cu : [])
        .filter((p) => p && typeof p === 'object' && (p as Record<string, unknown>).vat_do === true)
        .map((p) => String((p as Record<string, unknown>).id || ''))
        .filter(Boolean)
    );
    const redSegIds = new Set<string>(
      (sem.boi_canh && typeof sem.boi_canh === 'object' && Array.isArray((sem.boi_canh as Record<string, unknown>).doan_duong)
        ? ((sem.boi_canh as Record<string, unknown>).doan_duong as unknown[])
        : []
      )
        .filter((s) => s && typeof s === 'object' && (s as Record<string, unknown>).vat_do === true)
        .map((s) => String((s as Record<string, unknown>).id || ''))
        .filter(Boolean)
    );
    sem.nhip.forEach((rawB, idx) => {
      if (!rawB || typeof rawB !== 'object') return;
      const b = rawB as Record<string, unknown>;
      if (b.doan_duong && typeof b.doan_duong === 'object') {
        for (const [sid, sObj] of Object.entries(b.doan_duong as Record<string, unknown>)) {
          if (redSegIds.has(sid) && sObj && typeof sObj === 'object' && (sObj as Record<string, unknown>).duong_mo === true) {
            issues.push({
              code: 'RED_OBJECT_RULE',
              message: `nhip[${idx}].doan_duong.${sid}: không được dùng "duong_mo" làm mờ/biến mất vật đỏ "${sid}" trước khi hết video — vật đỏ phải còn đỏ và nhìn rõ đến khung cuối. Hãy bỏ "duong_mo".`,
            });
          }
        }
      }
      if (b.dao_cu && typeof b.dao_cu === 'object') {
        for (const [pid, pObj] of Object.entries(b.dao_cu as Record<string, unknown>)) {
          if (redPropIds.has(pid) && pObj && typeof pObj === 'object' && (pObj as Record<string, unknown>).bay_len === true) {
            issues.push({
              code: 'RED_OBJECT_RULE',
              message: `nhip[${idx}].dao_cu.${pid}: không được dùng "bay_len" làm vật đỏ "${pid}" biến mất trước khi hết video — vật đỏ phải còn đỏ đến khung cuối. Hãy bỏ "bay_len".`,
            });
          }
        }
      }
    });

    // Kiểm luật Nhịp Trà Nguội (giới hạn số chuyển động lớn) & "Chữ dẫn, hình theo" tại cú lật
    if (Array.isArray(sem.nhan_vat) && Array.isArray(sem.dao_cu)) {
      const tempoInfo = classifySemanticBeatTempo(sem as unknown as SemanticStageScript);
      if (tempoInfo.totalMajorMotions > TEMPO.MAX_MAJOR_MOTIONS_TOTAL) {
        issues.push({
          code: 'TEMPO_RULE_VIOLATION',
          message: `Cả Chén có ${tempoInfo.totalMajorMotions} chuyển động lớn của nhân vật (tối đa ${TEMPO.MAX_MAJOR_MOTIONS_TOTAL} theo Nhịp Trà Nguội); hãy bỏ bớt để cảnh tĩnh và lắng hơn.`,
        });
      }
      for (const [lineMoc, cnt] of Object.entries(tempoInfo.majorCountByLine)) {
        if (cnt > TEMPO.MAX_MOTIONS_PER_LINE) {
          issues.push({
            code: 'TEMPO_RULE_VIOLATION',
            message: `Mốc "${lineMoc}" có ${cnt} chuyển động lớn (mỗi dòng chữ tối đa ${TEMPO.MAX_MOTIONS_PER_LINE}); hãy bỏ bớt hoặc gộp nhịp.`,
          });
        }
      }
      if (tempoInfo.afterPivotMajorCount > TEMPO.MAX_MOTIONS_AFTER_PIVOT) {
        issues.push({
          code: 'TEMPO_RULE_VIOLATION',
          message: `Sau cú lật ("cu_lat") có ${tempoInfo.afterPivotMajorCount} chuyển động lớn (tối đa ${TEMPO.MAX_MOTIONS_AFTER_PIVOT}); hãy bỏ bớt để giữ dư vị tĩnh.`,
        });
      }
      for (const bInfo of tempoInfo.beats) {
        if (
          bInfo.moc === 'cu_lat' &&
          bInfo.isMajorMotion &&
          bInfo.sau < TEMPO.PIVOT_REACTION_MIN_DELAY_SEC - 0.005
        ) {
          issues.push({
            code: 'PIVOT_ORDER_VIOLATION',
            message: `nhip[${bInfo.beatIndex}] (cu_lat, sau=${bInfo.sau}s): vi phạm luật "Chữ dẫn, hình theo" — phản ứng lớn của nhân vật ở cú lật phải bắt đầu ≥ ${TEMPO.PIVOT_REACTION_MIN_DELAY_SEC}s sau khi chữ lật đổi đỏ (và không sớm hơn lúc vật đỏ bắt đầu đổi màu). Hãy đổi "sau" thành ≥ 0.45.`,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * TF1: Validator làn tự do (`che_do: "tu_do"`).
 * - KHÔNG chặn TEMPO, KHÔNG đếm cử chỉ, KHÔNG giới hạn đồ trong kho, cho phép `shapes`/`altShapes`/`drawProgress`/toạ độ tự do.
 * - CHỈ kiểm VỠ HÌNH đo bằng máy mỗi 0.25s suốt video:
 *   + CHẶN CỨNG (`issues`): (1) không đúng 1 vật đỏ (đếm CẢ nguồn đỏ ngầm: `teaCupRed`, `atmosphere`/`props` accent, khói/emitter đỏ, đoạn đường đỏ…);
 *                           (2) hình tràn lên tiêu đề (`y0 < STAGE_VB_Y0`) hoặc xuống khối chữ (`y1 > STAGE_VB_Y1`).
 *   + CẢNH BÁO VÀNG (`warnings`, đều gắn `timeSec`):
 *     (1) đè/xuyên giữa vật cùng lớp hoặc nhân vật với vật;
 *     (2) vật/nhân vật lơ lửng > 3px không có mặt đỡ;
 *     (3) tư thế ngồi không có mặt ngồi;
 *     (4) cỡ Lữ khách lệch > 25% so với `LU_KHACH_HEIGHT_RATIO`;
 *     (5) vật đỏ < `MIN_RED_AREA_PX2` ở khung cuối.
 */
export function validateFreeModeStageScript(
  script: StageScript,
  timelineInput?: TimelineSyncResult,
  visualDNA?: ResolvedVisualDNA
): StageValidationResult {
  const errors: StageValidationIssue[] = [];
  const warnings: StageValidationIssue[] = [];

  const timeline = timelineInput ?? buildFallbackTimeline();
  const palette = THEME_PALETTES.MINIMAL_LIGHT;
  const accentHex = palette.accentProp || palette.accent;
  const fps = timeline.fps;
  const stepFrames = Math.max(1, Math.round(VALIDATION_SAMPLE_STEP_SEC * fps));
  const stageH = STAGE_VB_Y1 - STAGE_VB_Y0;
  const customPropsMap = script.customPropsResolved;

  const actorSpecMap = new Map((script.actors ?? []).map((a) => [a.id, a]));
  const actorSeatHost = new Map<string, string>();
  const actorDeskHost = new Map<string, string>();
  for (const a of script.actors ?? []) {
    if (a.seatedOn) {
      const [seatId] = a.seatedOn.split('.');
      if (seatId) actorSeatHost.set(a.id, seatId);
    }
    if (a.seatedAtDesk) {
      actorDeskHost.set(a.id, a.seatedAtDesk);
    }
  }

  interface FreeEntity {
    kind: 'prop' | 'actor';
    id: string;
    type: string;
    layer: string;
    semLayer: SemanticLayer;
    anchorKind?: string;
    anchorType?: string;
    placedOnHost?: string;
    activeFollowActor?: string;
    isDropping?: boolean;
    focusRole?: string;
    worldX: number;
    worldY: number;
    scale: number;
    sitProgress?: number;
    pose?: string;
    box: { x0: number; y0: number; x1: number; y1: number };
  }

  const collectFreeEntities = (
    compiled: ReturnType<typeof evaluateStageScriptAtFrame>,
    isAfterPivot: boolean
  ): FreeEntity[] => {
    const out: FreeEntity[] = [];
    for (const p of compiled.props) {
      if (p.opacity <= 0.15 || p.drawProgress <= 0.05 || p.floatAwayProgress >= 0.85) {
        continue;
      }
      const box = getPropWorldBBox(p, customPropsMap, isAfterPivot);
      if (!box) continue;
      const catDef = customPropsMap?.[p.type] ?? BUILT_IN_PROP_CATALOG[p.type];
      const semLayer = resolveEffectiveSemanticLayer(
        p.spec.semanticLayer ?? catDef?.defaultLayer,
        p.layer,
        `${p.id} ${p.type}`
      );
      const activeFollowActor = p.activeFollow ? p.activeFollow.split(':')[0] : undefined;
      const anchorType = p.spec.anchorType ?? catDef?.anchorType;
      const anchorKind = activeFollowActor
        ? 'cam'
        : p.isDropping
          ? 'dat'
          : p.spec.anchorKind ??
            (p.spec.placedOn
              ? 'tren'
              : p.spec.follow
                ? 'cam'
                : p.layer === 'sky'
                  ? 'troi'
                  : catDef?.anchorKind ?? (anchorType === 'center' ? 'troi' : anchorType === 'hand' ? 'cam' : 'dat'));

      out.push({
        kind: 'prop',
        id: p.id,
        type: p.type,
        layer: p.layer,
        semLayer,
        anchorKind,
        anchorType,
        placedOnHost: p.spec.placedOn?.split('.')[0],
        activeFollowActor,
        isDropping: Boolean(p.isDropping),
        focusRole: p.spec.focusRole,
        worldX: p.x,
        worldY: p.y,
        scale: p.scale,
        box,
      });
    }

    for (const a of compiled.actors) {
      if (a.opacity <= 0.15 || a.dissolveToCloud >= 0.75) continue;
      const aSpec = actorSpecMap.get(a.id);
      const box = getActorWorldBBox(a, customPropsMap, isAfterPivot);
      if (!box) continue;
      const semLayer = resolveEffectiveSemanticLayer(
        aSpec?.semanticLayer,
        a.layer,
        `${a.id} ${a.rig || 'human'}`
      );
      out.push({
        kind: 'actor',
        id: a.id,
        type: a.rig || 'human',
        layer: a.layer,
        semLayer,
        focusRole: a.focusRole,
        worldX: a.x,
        worldY: a.y,
        scale: a.scale,
        sitProgress: a.sitProgress,
        pose: a.pose,
        box,
      });
    }
    return out;
  };

  interface RedSource {
    id: string;
    kind: string;
    screenPx2: number;
    zoom: number;
  }

  const collectRedSources = (
    compiled: ReturnType<typeof evaluateStageScriptAtFrame>,
    frame: number,
    isAfterPivot: boolean
  ): RedSource[] => {
    const reds: RedSource[] = [];
    const zoom2 = compiled.camera.zoom * compiled.camera.zoom;

    // 1. Props & red emitters (khói đỏ / pulseRing đỏ / glow đỏ / spill đỏ)
    for (const p of compiled.props) {
      if (p.opacity <= 0.15 || p.drawProgress <= 0.05 || p.floatAwayProgress >= 0.85) {
        continue;
      }
      const areaUnits2 = computePropRedStageArea(p, customPropsMap);
      const propIsRed =
        areaUnits2 > 0.05 ||
        p.isAccentActive ||
        p.color === accentHex;

      if (propIsRed) {
        let px2 = areaUnits2 * PX2_PER_STAGE_UNIT2 * zoom2;
        if (px2 <= 0) {
          const box = getPropWorldBBox(p, customPropsMap, isAfterPivot);
          if (box) {
            px2 =
              Math.max(1, (box.x1 - box.x0) * (box.y1 - box.y0)) *
              0.5 *
              PX2_PER_STAGE_UNIT2 *
              zoom2;
          }
        }
        reds.push({
          id: p.id,
          kind: p.type,
          screenPx2: px2,
          zoom: compiled.camera.zoom,
        });
      } else {
        // Nguồn đỏ ngầm trên prop không đỏ: khói đỏ / vòng sóng đỏ / quầng đỏ
        const hasRedSteam =
          p.emitters.steam > 0.05 && p.emitters.steamColor === accentHex;
        const hasRedOtherEmitter =
          (p.emitters.pulseRing > 0.05 ||
            p.emitters.glow > 0.05 ||
            p.emitters.spill > 0.05) &&
          p.emitters.color === accentHex;
        if (hasRedSteam || hasRedOtherEmitter) {
          reds.push({
            id: `${p.id}.khoi_do`,
            kind: 'emitter_do',
            screenPx2: 180 * p.scale * p.scale * PX2_PER_STAGE_UNIT2 * zoom2,
            zoom: compiled.camera.zoom,
          });
        }
      }
    }

    // 2. Actors: nhân vật đỏ, chén trà cầm tay đỏ (`teaCupRed`), khói đỏ từ custom rig
    for (const a of compiled.actors) {
      if (a.opacity <= 0.15 || a.dissolveToCloud >= 0.75) continue;
      const aSpec = actorSpecMap.get(a.id);
      const rigName = a.rig?.trim();
      const isCustomRig =
        Boolean(rigName) &&
        rigName !== 'traveler' &&
        rigName !== 'cloaked_traveler' &&
        rigName !== 'human';

      if (a.color === accentHex) {
        reds.push({
          id: a.id,
          kind: 'human',
          screenPx2: 320 * a.scale * a.scale * PX2_PER_STAGE_UNIT2 * zoom2,
          zoom: compiled.camera.zoom,
        });
      } else if (isAfterPivot && a.showTeaCup > 0.1 && aSpec?.teaCupRed === true) {
        reds.push({
          id: `${a.id}.chen_tra`,
          kind: 'teaCupRed',
          screenPx2: 7 * 5 * 0.88 * a.scale * a.scale * PX2_PER_STAGE_UNIT2 * zoom2,
          zoom: compiled.camera.zoom,
        });
      } else if (isAfterPivot && isCustomRig && a.showTeaCup > 0.1) {
        reds.push({
          id: `${a.id}.khoi_do`,
          kind: 'custom_rig_steam',
          screenPx2: 120 * a.scale * a.scale * PX2_PER_STAGE_UNIT2 * zoom2,
          zoom: compiled.camera.zoom,
        });
      }
    }

    // 3. Terrain segments đỏ (`doan_duong`)
    for (const ts of compiled.terrainSegments ?? []) {
      if (ts.opacity <= 0.15 || !ts.isAccentActive) continue;
      const segLenUnits = computeTerrainSegmentArcLength(compiled.terrain, ts.startX, ts.endX);
      if (segLenUnits <= 0.5) continue;
      const areaUnits2 = segLenUnits * Math.max(ts.strokeWidth, 5.8);
      reds.push({
        id: ts.id,
        kind: 'doan_duong',
        screenPx2: areaUnits2 * PX2_PER_STAGE_UNIT2 * zoom2,
        zoom: compiled.camera.zoom,
      });
    }

    // 4. Atmosphere đỏ (`colorRole === 'accent'` hoặc `leaves` có lá accent sau pivot)
    for (let idx = 0; idx < (script.atmosphere ?? []).length; idx++) {
      const item = script.atmosphere![idx];
      const baseOp = item.opacity ?? 1;
      if (baseOp <= 0.15) continue;
      const mult = evaluateEnterLeaveMultiplier(
        frame,
        timeline,
        item.enterAt,
        item.leaveAt,
        item.fadeDuration ?? 0.9
      );
      if (baseOp * mult <= 0.15) continue;
      const isAtmoRed =
        isAfterPivot && (item.colorRole === 'accent' || item.type === 'leaves');
      if (isAtmoRed) {
        const r = item.radius ?? 18;
        reds.push({
          id: `atmosphere:${item.id || `${item.type}#${idx + 1}`}`,
          kind: `atmosphere_${item.type}`,
          screenPx2: Math.PI * r * r * 0.45 * PX2_PER_STAGE_UNIT2 * zoom2,
          zoom: compiled.camera.zoom,
        });
      }
    }

    return reds;
  };

  const seenOverflow = new Set<string>();
  const seenOverlaps = new Set<string>();
  const seenFloating = new Set<string>();
  const seenSeating = new Set<string>();
  const seenScaleDev = new Set<string>();
  let multiRedErrorAdded = false;

  const fFinal = Math.max(
    Math.min(timeline.durationInFrames - 2, timeline.pivotFrame + Math.round(1.0 * fps)),
    timeline.durationInFrames - Math.round(1.0 * fps)
  );
  const postPivotStartF = Math.min(
    fFinal,
    timeline.pivotFrame + Math.round(0.35 * fps)
  );

  // Tạo tập frame quét mỗi 0.25s + chắc chắn có fFinal
  const sampleFramesSet = new Set<number>();
  for (let f = 0; f < timeline.durationInFrames; f += stepFrames) {
    sampleFramesSet.add(f);
  }
  sampleFramesSet.add(Math.max(0, Math.min(timeline.durationInFrames - 1, fFinal)));
  const sampleFrames = Array.from(sampleFramesSet).sort((a, b) => a - b);

  const checkFreeCollisions = (
    entities: FreeEntity[],
    tSec: number,
    viaSweep: boolean
  ): void => {
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const A = entities[i];
        const B = entities[j];
        if (A.semLayer !== B.semLayer) continue;

        const pairKey = [A.id, B.id].sort().join('::');
        if (seenOverlaps.has(pairKey)) continue;

        if (A.placedOnHost === B.id || B.placedOnHost === A.id) continue;
        if (A.isDropping || B.isDropping) continue;
        if (A.activeFollowActor === B.id || B.activeFollowActor === A.id) continue;
        if (
          (A.kind === 'actor' && actorSeatHost.get(A.id) === B.id) ||
          (B.kind === 'actor' && actorSeatHost.get(B.id) === A.id) ||
          (A.kind === 'actor' && actorDeskHost.get(A.id) === B.id) ||
          (B.kind === 'actor' && actorDeskHost.get(B.id) === A.id)
        ) {
          continue;
        }
        // Trong làn tự do, vật đặt trực tiếp lên mặt trên của vật khác (tiếp xúc mép ≤ 4.5px) không tính là đè/xuyên
        if (A.kind === 'prop' && B.kind === 'prop') {
          const aOnB = Math.abs(A.box.y1 - B.box.y0) <= 4.5;
          const bOnA = Math.abs(B.box.y1 - A.box.y0) <= 4.5;
          if (aOnB || bOnA) continue;
        }

        const ix = Math.min(A.box.x1, B.box.x1) - Math.max(A.box.x0, B.box.x0);
        const iy = Math.min(A.box.y1, B.box.y1) - Math.max(A.box.y0, B.box.y0);
        if (ix > 2.5 && iy > 2.5 && ix * iy > 10) {
          seenOverlaps.add(pairKey);
          const first = B.kind === 'actor' && A.kind === 'prop' ? B : A;
          const second = first === A ? B : A;
          warnings.push({
            code: 'OVERLAP_COLLISION',
            severity: 'warn',
            timeSec: tSec,
            message: viaSweep
              ? `[t=${tSec.toFixed(2)}s] "${first.id}" đi xuyên "${second.id}" cùng lớp "${A.semLayer}" (${ix.toFixed(1)}×${iy.toFixed(1)}px).`
              : `[t=${tSec.toFixed(2)}s] "${first.id}" đè lên "${second.id}" cùng lớp "${A.semLayer}" (${ix.toFixed(1)}×${iy.toFixed(1)}px).`,
          });
        }
      }
    }
  };

  let peakPostPivotReds: RedSource[] = [];
  let finalReds: RedSource[] = [];
  let prevFrame: number | undefined;
  let prevEntitiesById = new Map<string, FreeEntity>();

  for (const frame of sampleFrames) {
    const isAfterPivot = frame >= timeline.pivotFrame - 6;
    const compiled = evaluateStageScriptAtFrame(script, frame, timeline, palette, visualDNA);
    const terrain = compiled.terrain;
    const phase =
      ((frame % timeline.durationInFrames) / timeline.durationInFrames) *
      Math.PI *
      2 *
      8;
    const tSec = Number((frame / fps).toFixed(2));
    const entities = collectFreeEntities(compiled, isAfterPivot);

    // ── CHẶN CỨNG 1: Đếm nguồn đỏ (kể cả nguồn đỏ ngầm) ──
    const reds = collectRedSources(compiled, frame, isAfterPivot);
    if (reds.length > 1 && !multiRedErrorAdded) {
      multiRedErrorAdded = true;
      errors.push({
        code: 'RED_OBJECT_RULE',
        severity: 'error',
        timeSec: tSec,
        message: `[t=${tSec.toFixed(2)}s] Có ${reds.length} nguồn đỏ cùng lúc (${reds.map((r) => r.id).join(', ')}) — bắt buộc đúng 1 vật đỏ.`,
      });
    }
    if (frame >= postPivotStartF && frame <= fFinal) {
      if (reds.length > peakPostPivotReds.length) {
        peakPostPivotReds = reds;
      } else if (
        reds.length === 1 &&
        peakPostPivotReds.length === 1 &&
        reds[0].screenPx2 > peakPostPivotReds[0].screenPx2
      ) {
        peakPostPivotReds = reds;
      }
    }
    if (frame === fFinal) {
      finalReds = reds;
    }

    // ── CHẶN CỨNG 2: Hình tràn lên tiêu đề hoặc xuống khối chữ ──
    for (const ent of entities) {
      if (seenOverflow.has(ent.id)) continue;
      if (ent.box.y0 < STAGE_VB_Y0 - 2) {
        seenOverflow.add(ent.id);
        errors.push({
          code: 'STAGE_OVERFLOW',
          severity: 'error',
          timeSec: tSec,
          message: `[t=${tSec.toFixed(2)}s] "${ent.id}" tràn lên vùng tiêu đề (đỉnh y=${ent.box.y0.toFixed(1)} < mép trên ${STAGE_VB_Y0}).`,
        });
      } else if (ent.box.y1 > STAGE_VB_Y1 + 2) {
        seenOverflow.add(ent.id);
        errors.push({
          code: 'STAGE_OVERFLOW',
          severity: 'error',
          timeSec: tSec,
          message: `[t=${tSec.toFixed(2)}s] "${ent.id}" tràn xuống khối chữ (đáy y=${ent.box.y1.toFixed(1)} > mép dưới ${STAGE_VB_Y1}).`,
        });
      }
    }
    for (let idx = 0; idx < (script.atmosphere ?? []).length; idx++) {
      const item = script.atmosphere![idx];
      if (item.y === undefined) continue;
      const isCelestial =
        item.type === 'sun' || item.type === 'hollow_sun' || item.type === 'crescent';
      if (isCelestial) continue; // DeclarativeStagePlayer tự kẹp celestial vào [138..250]
      const atmoKey = `atmosphere:${item.id || `${item.type}#${idx + 1}`}`;
      if (seenOverflow.has(atmoKey)) continue;
      const mult = evaluateEnterLeaveMultiplier(
        frame,
        timeline,
        item.enterAt,
        item.leaveAt,
        item.fadeDuration ?? 0.9
      );
      if ((item.opacity ?? 1) * mult <= 0.15) continue;
      const r = item.type === 'ring_pulse' ? item.radius ?? 24 : 0;
      const x = resolveXCoord(item.x, 270);
      if (Number.isFinite(x)) {
        if (item.y - r < STAGE_VB_Y0 - 2) {
          seenOverflow.add(atmoKey);
          errors.push({
            code: 'STAGE_OVERFLOW',
            severity: 'error',
            timeSec: tSec,
            message: `[t=${tSec.toFixed(2)}s] "${atmoKey}" tràn lên vùng tiêu đề (đỉnh y=${(item.y - r).toFixed(1)} < ${STAGE_VB_Y0}).`,
          });
        } else if (item.y + r > STAGE_VB_Y1 + 2) {
          seenOverflow.add(atmoKey);
          errors.push({
            code: 'STAGE_OVERFLOW',
            severity: 'error',
            timeSec: tSec,
            message: `[t=${tSec.toFixed(2)}s] "${atmoKey}" tràn xuống khối chữ (đáy y=${(item.y + r).toFixed(1)} > ${STAGE_VB_Y1}).`,
          });
        }
      }
    }

    // ── CẢNH BÁO VÀNG 1: Đè/xuyên (tại khung mẫu + quét quỹ đạo giữa 2 nhịp 0.25s) ──
    if (prevFrame !== undefined) {
      let maxMovedDist = 0;
      for (const ent of entities) {
        const prevEnt = prevEntitiesById.get(`${ent.kind}:${ent.id}`);
        if (!prevEnt) continue;
        const dist = Math.hypot(ent.worldX - prevEnt.worldX, ent.worldY - prevEnt.worldY);
        if (dist > maxMovedDist) maxMovedDist = dist;
      }
      if (maxMovedDist > 4 && frame - prevFrame > 2) {
        const subSteps = Math.min(20, Math.max(4, Math.ceil(maxMovedDist / 8)));
        for (let s = 1; s < subSteps; s++) {
          const sf = Math.round(prevFrame + ((frame - prevFrame) * s) / subSteps);
          const subCompiled = evaluateStageScriptAtFrame(script, sf, timeline, palette, visualDNA);
          const subEntities = collectFreeEntities(subCompiled, sf >= timeline.pivotFrame - 6);
          checkFreeCollisions(subEntities, Number((sf / fps).toFixed(2)), true);
        }
      }
    }
    checkFreeCollisions(entities, tSec, false);

    // ── CẢNH BÁO VÀNG 2: Vật / nhân vật lơ lửng > 3px không có mặt đỡ ──
    for (const ent of entities) {
      if (seenFloating.has(ent.id)) continue;
      if (ent.kind === 'prop') {
        if (
          ent.layer === 'sky' ||
          ent.anchorKind === 'troi' ||
          ent.anchorKind === 'cam' ||
          ent.anchorKind === 'tuong' ||
          ent.anchorType === 'center' ||
          ent.anchorType === 'hand' ||
          ent.activeFollowActor ||
          ent.isDropping
        ) {
          continue;
        }
        const cx = (ent.box.x0 + ent.box.x1) * 0.5;
        const groundY = getTerrainPoint(terrain, cx, phase).y;
        const gap = groundY - ent.box.y1;
        if (Math.abs(gap) > 3.0) {
          // Kiểm tra có mặt đỡ là đạo cụ khác bên dưới không
          const hasSupportProp = entities.some((other) => {
            if (other.kind !== 'prop' || other.id === ent.id) return false;
            const horizOverlap =
              Math.min(ent.box.x1, other.box.x1) - Math.max(ent.box.x0, other.box.x0);
            if (horizOverlap <= 1.5) return false;
            return (
              Math.abs(ent.box.y1 - other.box.y0) <= 4.5 ||
              (ent.placedOnHost === other.id &&
                ent.box.y1 >= other.box.y0 - 4.5 &&
                ent.box.y1 <= other.box.y1 + 4.5)
            );
          });
          if (!hasSupportProp) {
            seenFloating.add(ent.id);
            warnings.push({
              code: 'FLOATING_OBJECT',
              severity: 'warn',
              timeSec: tSec,
              message: `[t=${tSec.toFixed(2)}s] Đạo cụ "${ent.id}" lơ lửng/lệch mặt đất ${gap.toFixed(1)}px (> 3px) không có mặt đỡ (đáy y=${ent.box.y1.toFixed(1)}, đất y=${groundY.toFixed(1)}).`,
            });
          }
        }
      } else if (ent.kind === 'actor') {
        const isSitting = (ent.sitProgress ?? 0) >= 0.5 || ent.pose === 'sit_lean';
        const hasSeatSupport =
          isSitting &&
          (actorSeatHost.has(ent.id) ||
            entities.some(
              (o) =>
                o.kind === 'prop' &&
                Math.min(ent.box.x1, o.box.x1) - Math.max(ent.box.x0, o.box.x0) > 2 &&
                o.box.y0 <= ent.box.y1 + 4 &&
                o.box.y1 >= ent.box.y0 + 10
            ));
        if (hasSeatSupport) continue;
        const groundY = getTerrainPoint(
          terrain,
          (ent.box.x0 + ent.box.x1) * 0.5,
          phase
        ).y;
        const gap = groundY - ent.box.y1;
        if (Math.abs(gap) > 3.0) {
          seenFloating.add(ent.id);
          warnings.push({
            code: 'FLOATING_OBJECT',
            severity: 'warn',
            timeSec: tSec,
            message: `[t=${tSec.toFixed(2)}s] Nhân vật "${ent.id}" lơ lửng cách mặt đất ${gap.toFixed(1)}px (> 3px) không có mặt đỡ.`,
          });
        }
      }
    }

    // ── CẢNH BÁO VÀNG 3: Tư thế ngồi không có mặt ngồi ──
    for (const ent of entities) {
      if (ent.kind !== 'actor' || seenSeating.has(ent.id)) continue;
      const isSitting = (ent.sitProgress ?? 0) >= 0.5 || ent.pose === 'sit_lean';
      if (!isSitting) continue;
      const hasSeat =
        actorSeatHost.has(ent.id) ||
        entities.some(
          (o) =>
            o.kind === 'prop' &&
            Math.min(ent.box.x1, o.box.x1) - Math.max(ent.box.x0, o.box.x0) > 2 &&
            o.box.y0 <= ent.box.y1 + 4 &&
            o.box.y1 >= ent.box.y0 + 10
        );
      if (!hasSeat) {
        seenSeating.add(ent.id);
        warnings.push({
          code: 'INVALID_SEATING',
          severity: 'warn',
          timeSec: tSec,
          message: `[t=${tSec.toFixed(2)}s] Nhân vật "${ent.id}" đang ở tư thế ngồi nhưng không có mặt ngồi bên dưới.`,
        });
      }
    }

    // ── CẢNH BÁO VÀNG 4: Cỡ Lữ khách lệch > 25% so với chuẩn LU_KHACH_HEIGHT_RATIO ──
    for (const ent of entities) {
      if (ent.kind !== 'actor' || seenScaleDev.has(ent.id)) continue;
      const isHumanRig =
        !ent.type ||
        ent.type === 'human' ||
        ent.type === 'traveler' ||
        ent.type === 'cloaked_traveler';
      if (!isHumanRig) continue;
      if (ent.layer === 'far' || ent.focusRole === 'ambient') continue;
      const standingRatio = (48.5 * ent.scale) / stageH;
      const dev = Math.abs(standingRatio - LU_KHACH_HEIGHT_RATIO) / LU_KHACH_HEIGHT_RATIO;
      if (dev > 0.25) {
        seenScaleDev.add(ent.id);
        warnings.push({
          code: 'TRAVELER_SCALE_DEVIATION',
          severity: 'warn',
          timeSec: tSec,
          message: `[t=${tSec.toFixed(2)}s] Cỡ Lữ khách "${ent.id}" (${(standingRatio * 100).toFixed(1)}% khung, scale=${ent.scale.toFixed(2)}) lệch ${(dev * 100).toFixed(0)}% (> 25%) so với chuẩn ${(LU_KHACH_HEIGHT_RATIO * 100).toFixed(0)}%.`,
        });
      }
    }

    prevFrame = frame;
    prevEntitiesById = new Map(entities.map((e) => [`${e.kind}:${e.id}`, e]));
  }

  const finalTimeSec = Number((fFinal / fps).toFixed(2));
  if (!multiRedErrorAdded && peakPostPivotReds.length === 0) {
    errors.push({
      code: 'RED_OBJECT_RULE',
      severity: 'error',
      timeSec: finalTimeSec,
      message: `[t=${finalTimeSec.toFixed(2)}s] Phải có đúng 1 vật đỏ sau cú lật, hiện đang có 0 vật đỏ.`,
    });
  }

  // ── CẢNH BÁO VÀNG 5: Vật đỏ < MIN_RED_AREA_PX2 ở khung cuối ──
  if (finalReds.length === 1 && finalReds[0].screenPx2 < MIN_RED_AREA_PX2) {
    const r = finalReds[0];
    warnings.push({
      code: 'RED_OBJECT_RULE',
      severity: 'warn',
      timeSec: finalTimeSec,
      message: `[t=${finalTimeSec.toFixed(2)}s] Vật đỏ "${r.id}" nhỏ ở khung cuối (${Math.round(r.screenPx2)} px² < ${MIN_RED_AREA_PX2} px², zoom=${r.zoom.toFixed(2)}).`,
    });
  }

  return {
    valid: errors.length === 0,
    isLegacy: false,
    isFreeMode: true,
    issues: errors,
    warnings,
    compiledScript: script,
  };
}

/**
 * Validator chặn cứng trên StageScript trước khi render (chạy trong cả Studio lẫn CLI).
 */
export function validateStageScriptHard(
  script: StageScript,
  timelineInput?: TimelineSyncResult,
  visualDNA?: ResolvedVisualDNA
): StageValidationResult {
  if (isLegacyStageScript(script, script.sceneId)) {
    return { valid: true, isLegacy: true, issues: [], compiledScript: script };
  }
  if (isFreeModeStageScript(script)) {
    return validateFreeModeStageScript(script, timelineInput, visualDNA);
  }

  const issues: StageValidationIssue[] = [];
  const propMap = new Map<string, NonNullable<StageScript['props']>[number]>();
  const scaleByType = new Map<string, { firstId: string; scale: number }>();

  const hasEngineBackdrop = Boolean(
    script.tags?.some((t) => t.startsWith('boi_canh_bo:'))
  );
  const firstSceneProp = (script.props ?? []).find(
    (pr) => !(hasEngineBackdrop && pr.id.startsWith('__bg_'))
  );
  const commonSceneScale =
    (firstSceneProp?.scale ?? script.actors?.[0]?.scale) ||
    DEFAULT_SCENE_SCALE;

  // 1. Kiểm tra tĩnh đạo cụ, luật kích thước thật, luật cùng loại vật cùng kích thước, và luật bản đỏ trùng dáng
  for (const p of script.props ?? []) {
    propMap.set(p.id, p);
    // Lớp nền tự sinh từ `boi_canh.bo` (tiền tố `__bg_`, lớp `nen`): không bắt luật catalog/tỷ lệ của đạo cụ lớp giữa
    if (hasEngineBackdrop && p.id.startsWith('__bg_') && p.layer === 'far') {
      continue;
    }
    if ((p.shapes && p.shapes.length > 0) || (p.altShapes && p.altShapes.length > 0)) {
      issues.push({
        code: 'CUSTOM_PROP_FORBIDDEN',
        message: `Đạo cụ "${p.id}": cấm tự vẽ "shapes" / "altShapes" trực tiếp; chỉ dùng type có trong propCatalog.`,
      });
    }
    const tName = p.type || '';
    if (CUSTOM_ONLY_PROP_NAMES.has(tName)) {
      const hint = suggestClosestName(tName, BUILT_IN_PROP_NAMES);
      issues.push({
        code: 'CUSTOM_PROP_FORBIDDEN',
        message: `Đạo cụ "${p.id}": "${tName}" thuộc custom-props.json (chỉ đọc cho bản cũ), kịch bản mới không được dùng${hint ? `. Ý bạn là "${hint}"?` : '.'}`,
      });
      continue;
    }
    const def = BUILT_IN_PROP_CATALOG[tName];
    if (!def) {
      const hint = suggestClosestName(tName, BUILT_IN_PROP_NAMES);
      issues.push({
        code: 'UNKNOWN_NAME',
        message: `Đạo cụ "${p.id}": "${tName}" không có trong propCatalog${hint ? `, ý bạn là "${hint}"?` : ` (có: ${BUILT_IN_PROP_NAMES.join(', ')})`}`,
      });
      continue;
    }

    issues.push(...validatePropDefinitionRules(tName, def));

    const pScale = p.scale ?? DEFAULT_SCENE_SCALE;
    const prevSameType = scaleByType.get(tName);
    if (prevSameType && Math.abs(prevSameType.scale - pScale) > 0.01) {
      issues.push({
        code: 'SAME_TYPE_SIZE_MISMATCH',
        message: `Đạo cụ "${p.id}" và "${prevSameType.firstId}" cùng loại "${tName}" nhưng kích thước khác nhau (scale ${pScale} vs ${prevSameType.scale}). Cùng một loại vật phải cùng kích thước dù đặt ở đâu.`,
      });
    } else if (!prevSameType) {
      scaleByType.set(tName, { firstId: p.id, scale: pScale });
    }

    // Kiểm tra kích thước hiển thị thực tế trong cảnh so với công thức kich_thuoc_that × TY_LE_CANH × HE_SO_PHONG_DAI × sceneScale (mọi vật dùng chung tỷ lệ tự căn khung, sai số tối đa 15%)
    if (Math.abs(pScale - commonSceneScale) > 0.02) {
      issues.push({
        code: 'REAL_SIZE_SCALING_VIOLATION',
        message: `Đạo cụ "${p.id}" (${tName}): scale=${pScale} khác với tỷ lệ chung của cảnh (${commonSceneScale}). Cấm phóng to/thu nhỏ riêng từng đạo cụ.`,
      });
    } else if (def.kich_thuoc_that && def.box) {
      const expectedWorldSpan =
        computeExpectedCatalogSpanFromCm(def.kich_thuoc_that) *
        commonSceneScale;
      const actualWorldSpan =
        Math.max(def.box[2] - def.box[0], def.box[3] - def.box[1]) * pScale;
      const dev = Math.abs(actualWorldSpan - expectedWorldSpan) / expectedWorldSpan;
      if (dev > MAX_REAL_SIZE_DEVIATION) {
        issues.push({
          code: 'REAL_SIZE_SCALING_VIOLATION',
          message: `Đạo cụ "${p.id}" (${tName}): kích thước trong cảnh ${actualWorldSpan.toFixed(1)} lệch ${(dev * 100).toFixed(1)}% (> 15%) so với chuẩn tính từ kich_thuoc_that=${def.kich_thuoc_that}cm (${expectedWorldSpan.toFixed(1)}). Cấm phóng to/thu nhỏ riêng đạo cụ.`,
        });
      }
    }

    if (p.variant && !def.variants?.[p.variant]) {
      const validSt = ['mac_dinh', ...Object.keys(def.variants ?? {})];
      const hint = suggestClosestName(p.variant, validSt);
      issues.push({
        code: 'UNKNOWN_NAME',
        message: `Đạo cụ "${p.id}": type "${tName}" không có trạng thái "${p.variant}"${hint ? `, ý bạn là "${hint}"?` : ''}.`,
      });
    }

    if (p.placedOn) {
      const [hostId, ancName] = p.placedOn.split('.');
      const hostSpec = propMap.get(hostId);
      const hostDef = hostSpec?.type ? BUILT_IN_PROP_CATALOG[hostSpec.type] : undefined;
      if (!hostSpec || !ancName || !hostDef?.anchors?.[ancName]) {
        issues.push({
          code: 'INVALID_ANCHOR',
          message: `Đạo cụ "${p.id}": điểm neo đặt trên "${p.placedOn}" không tồn tại.`,
        });
      }
    }
  }

  // Kiểm tra chén trà đặt ngoài (`small_cup`) phải bằng kích thước chén trà trên tay Lữ khách (`actor.showTeaCup`)
  const smallCupEntry = scaleByType.get('small_cup');
  if (smallCupEntry) {
    for (const a of script.actors ?? []) {
      const aScale = a.scale ?? DEFAULT_SCENE_SCALE;
      if (Math.abs(smallCupEntry.scale - aScale) > 0.01) {
        issues.push({
          code: 'SAME_TYPE_SIZE_MISMATCH',
          message: `Chén trà "${smallCupEntry.firstId}" (scale=${smallCupEntry.scale}) không cùng kích thước với chén trà trên tay Lữ khách "${a.id}" (scale=${aScale}).`,
        });
      }
    }
  }

  // Chặn cue trong timeline cố tình phóng to riêng một đạo cụ
  for (const cue of script.timeline ?? []) {
    if (cue.scale !== undefined && propMap.has(cue.target)) {
      const baseP = propMap.get(cue.target)!;
      const baseScale = baseP.scale ?? DEFAULT_SCENE_SCALE;
      if (Math.abs(cue.scale - baseScale) > 0.01) {
        issues.push({
          code: 'REAL_SIZE_SCALING_VIOLATION',
          message: `Timeline cue trên đạo cụ "${cue.target}": cấm thay đổi scale (${cue.scale}) để phóng to riêng vật; nếu vật đỏ nhỏ hãy dùng máy quay đẩy vào hoặc đưa lên tay Lữ khách.`,
        });
      }
    }
  }

  const actorSeatHost = new Map<string, string>();
  const actorDeskHost = new Map<string, string>();
  const seatToDeskHost = new Map<string, string>();
  for (const a of script.actors ?? []) {
    if (a.seatedAtDesk) {
      actorDeskHost.set(a.id, a.seatedAtDesk);
      if (a.seatedOn) {
        const [seatId] = a.seatedOn.split('.');
        if (seatId) seatToDeskHost.set(seatId, a.seatedAtDesk);
      }
    }
    if (a.seatedOn) {
      const [seatId, ancName] = a.seatedOn.split('.');
      const seatSpec = propMap.get(seatId);
      const seatDef = seatSpec?.type ? BUILT_IN_PROP_CATALOG[seatSpec.type] : undefined;
      if (!seatSpec || ancName !== 'mat_ghe' || !seatDef?.anchors?.mat_ghe) {
        issues.push({
          code: 'INVALID_SEATING',
          message: `Nhân vật "${a.id}": ngoi_tren "${a.seatedOn}" không hợp lệ (cần trỏ tới "<ghe>.mat_ghe" đã khai báo).`,
        });
      } else {
        actorSeatHost.set(a.id, seatId);
      }
    } else if ((a.sitProgress ?? 0) > 0.1 || a.pose === 'sit_lean') {
      issues.push({
        code: 'INVALID_SEATING',
        message: `Nhân vật "${a.id}": không có ghế (seatedOn: "<ghe>.mat_ghe") thì không được ngồi.`,
      });
    }
  }

  const timeline = timelineInput ?? buildFallbackTimeline();
  const palette = THEME_PALETTES.MINIMAL_LIGHT;
  const fps = timeline.fps;
  const stepFrames = Math.max(1, Math.round(VALIDATION_SAMPLE_STEP_SEC * fps));

  const f0 = evaluateStageScriptAtFrame(script, 0, timeline, palette, visualDNA);
  if (f0.terrain.startX < STAGE_VB_X0 || f0.terrain.endX > STAGE_VB_X1 || f0.terrain.endX - f0.terrain.startX < 120) {
    issues.push({
      code: 'OUT_OF_SAFE_TERRAIN',
      message: `Terrain [${f0.terrain.startX}..${f0.terrain.endX}] nằm ngoài khung sân khấu hợp lệ [${STAGE_VB_X0}..${STAGE_VB_X1}].`,
    });
  }

  const seenOverlaps = new Set<string>();
  const seenFloating = new Set<string>();
  const seenOob = new Set<string>();
  const seenExcessiveMotion = new Set<string>();

  interface SampleEntity {
    kind: 'prop' | 'actor';
    id: string;
    type: string;
    variant?: string;
    semLayer: SemanticLayer;
    anchorKind?: string;
    placedOnRef?: string;
    placedOnHost?: string;
    activeFollowActor?: string;
    isDropping?: boolean;
    worldX: number;
    worldY: number;
    scale: number;
    box: { x0: number; y0: number; x1: number; y1: number };
    sitProgress?: number;
  }

  const collectEntitiesFromCompiled = (
    compiled: ReturnType<typeof evaluateStageScriptAtFrame>,
    isAfterPivot: boolean
  ): SampleEntity[] => {
    const entities: SampleEntity[] = [];

    for (const p of compiled.props) {
      if (p.opacity <= 0.2 || p.drawProgress <= 0.35 || p.floatAwayProgress > 0.3) {
        continue;
      }
      if (!BUILT_IN_PROP_CATALOG[p.type]) continue;
      const box = getPropWorldBBox(p, undefined, isAfterPivot);
      if (!box) continue;

      const catDef = BUILT_IN_PROP_CATALOG[p.type];
      const semLayer = resolveEffectiveSemanticLayer(
        p.spec.semanticLayer ?? catDef?.defaultLayer,
        p.layer,
        `${p.id} ${p.type}`
      );
      const activeFollowActor = p.activeFollow ? p.activeFollow.split(':')[0] : undefined;
      const anchorKind = activeFollowActor
        ? 'cam'
        : p.isDropping
          ? 'dat'
          : p.spec.anchorKind ??
            (p.spec.placedOn ? 'tren' : p.spec.follow ? 'cam' : catDef?.anchorKind ?? 'dat');

      entities.push({
        kind: 'prop',
        id: p.id,
        type: p.type,
        variant: p.variant ?? p.spec.variant,
        semLayer,
        anchorKind,
        placedOnRef: p.spec.placedOn,
        placedOnHost: p.spec.placedOn?.split('.')[0],
        activeFollowActor,
        isDropping: Boolean(p.isDropping),
        worldX: p.x,
        worldY: p.y,
        scale: p.scale,
        box,
      });
    }

    for (const a of compiled.actors) {
      if (a.opacity <= 0.2 || a.dissolveToCloud > 0.4) continue;
      const aSpec = (script.actors ?? []).find((x) => x.id === a.id);
      const box = getActorWorldBBox(a, undefined, isAfterPivot);
      if (!box) continue;
      const semLayer = resolveEffectiveSemanticLayer(
        aSpec?.semanticLayer,
        a.layer,
        `${a.id} ${a.rig || 'human'}`
      );

      entities.push({
        kind: 'actor',
        id: a.id,
        type: a.rig || 'human',
        semLayer,
        worldX: a.x,
        worldY: a.y,
        scale: a.scale,
        box,
        sitProgress: a.sitProgress,
      });
    }

    return entities;
  };

  const checkPairCollisions = (
    entities: SampleEntity[],
    timeSec: string,
    viaSweep = false
  ): void => {
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const A = entities[i];
        const B = entities[j];
        if (A.semLayer !== B.semLayer) continue;

        const pairKey = [A.id, B.id].sort().join('::');
        if (seenOverlaps.has(pairKey)) continue;

        if (A.placedOnHost === B.id || B.placedOnHost === A.id) continue;
        if (A.isDropping || B.isDropping) continue;
        if (
          A.placedOnHost &&
          A.placedOnHost === B.placedOnHost &&
          (A.variant === 'tua' || B.variant === 'tua')
        ) {
          continue;
        }
        if (A.activeFollowActor === B.id || B.activeFollowActor === A.id) continue;
        if (
          (A.kind === 'actor' && actorSeatHost.get(A.id) === B.id) ||
          (B.kind === 'actor' && actorSeatHost.get(B.id) === A.id)
        ) {
          continue;
        }
        if (
          (A.kind === 'actor' && actorDeskHost.get(A.id) === B.id) ||
          (B.kind === 'actor' && actorDeskHost.get(B.id) === A.id) ||
          seatToDeskHost.get(A.id) === B.id ||
          seatToDeskHost.get(B.id) === A.id ||
          (A.kind === 'actor' && B.placedOnHost && actorDeskHost.get(A.id) === B.placedOnHost) ||
          (B.kind === 'actor' && A.placedOnHost && actorDeskHost.get(B.id) === A.placedOnHost)
        ) {
          continue;
        }

        const ix = Math.min(A.box.x1, B.box.x1) - Math.max(A.box.x0, B.box.x0);
        const iy = Math.min(A.box.y1, B.box.y1) - Math.max(A.box.y0, B.box.y0);
        if (ix > 2.5 && iy > 2.5 && ix * iy > 10) {
          seenOverlaps.add(pairKey);
          const first = B.kind === 'actor' && A.kind === 'prop' ? B : A;
          const second = first === A ? B : A;
          issues.push({
            code: 'OVERLAP_COLLISION',
            message: viaSweep
              ? `Va chạm khi di chuyển (đi xuyên vật) cùng lớp "${A.semLayer}" tại t=${timeSec}s: "${first.id}" đi xuyên "${second.id}" (${ix.toFixed(1)}×${iy.toFixed(1)}px).`
              : `Va chạm cùng lớp "${A.semLayer}" tại t=${timeSec}s: "${first.id}" đè lên "${second.id}" (${ix.toFixed(1)}×${iy.toFixed(1)}px).`,
          });
        }
      }
    }
  };

  const maxSampleFrame = Math.max(1, timeline.durationInFrames - Math.round(1.0 * fps));
  let prevFrame: number | undefined;
  let prevEntitiesById = new Map<string, SampleEntity>();

  // 2. Lấy mẫu nhiều khung dọc cả video (mỗi 0.25s) + quét đường đi (chặn đi xuyên vật / chuyển động lớn)
  for (let frame = 0; frame <= maxSampleFrame; frame += stepFrames) {
    const isAfterPivot = frame >= timeline.pivotFrame - 6;
    const compiled = evaluateStageScriptAtFrame(script, frame, timeline, palette, visualDNA);
    const terrain = compiled.terrain;
    const phase =
      ((frame % timeline.durationInFrames) / timeline.durationInFrames) *
      Math.PI *
      2 *
      8;
    const timeSec = (frame / fps).toFixed(2);

    const entities = collectEntitiesFromCompiled(compiled, isAfterPivot);
    for (const ent of entities) {
      if (
        ent.kind === 'actor' &&
        (ent.sitProgress ?? 0) >= 0.5 &&
        !actorSeatHost.has(ent.id) &&
        !seenFloating.has(`seat:${ent.id}`)
      ) {
        seenFloating.add(`seat:${ent.id}`);
        issues.push({
          code: 'INVALID_SEATING',
          message: `Nhân vật "${ent.id}" ngồi lơ lửng tại t=${timeSec}s mà không gắn ngoi_tren vào ghế.`,
        });
      }
    }

    // 2.0 Kiểm tra chuyển động đột ngột & quét quỹ đạo giữa 2 nhịp mẫu để chặn đi xuyên vật
    if (prevFrame !== undefined) {
      const dtSec = (frame - prevFrame) / fps;
      let maxMovedDist = 0;
      for (const ent of entities) {
        const prevEnt = prevEntitiesById.get(`${ent.kind}:${ent.id}`);
        if (!prevEnt) continue;
        const dx = ent.worldX - prevEnt.worldX;
        const dy = ent.worldY - prevEnt.worldY;
        const dist = Math.hypot(dx, dy);
        if (dist > maxMovedDist) maxMovedDist = dist;
        if (
          dtSec > 0.01 &&
          !ent.activeFollowActor &&
          !seenExcessiveMotion.has(ent.id) &&
          dist > 95 &&
          dist / dtSec > 380
        ) {
          seenExcessiveMotion.add(ent.id);
          issues.push({
            code: 'EXCESSIVE_MOTION',
            message: `"${ent.id}" chuyển động quá nhanh / dịch chuyển lớn (${dist.toFixed(0)} đơn vị trong ${dtSec.toFixed(2)}s) tại t=${timeSec}s; hãy tăng thoi_luong hoặc rút ngắn quãng di chuyển.`,
          });
        }
      }
      if (maxMovedDist > 4 && frame - prevFrame > 2) {
        const subSteps = Math.min(20, Math.max(4, Math.ceil(maxMovedDist / 8)));
        for (let s = 1; s < subSteps; s++) {
          const sf = Math.round(prevFrame + ((frame - prevFrame) * s) / subSteps);
          const subCompiled = evaluateStageScriptAtFrame(script, sf, timeline, palette, visualDNA);
          const subEntities = collectEntitiesFromCompiled(
            subCompiled,
            sf >= timeline.pivotFrame - 6
          );
          checkPairCollisions(subEntities, (sf / fps).toFixed(2), true);
        }
      }
    }

    // 2a. Kiểm tra vùng an toàn của terrain
    const safeMinX = Math.max(STAGE_VB_X0 + 2, terrain.startX - 4);
    const safeMaxX = Math.min(STAGE_VB_X1 - 2, terrain.endX + 4);
    for (const ent of entities) {
      const reasons: string[] = [];
      if (ent.box.x0 < safeMinX) reasons.push(`mép trái ${ent.box.x0.toFixed(1)} < ${safeMinX.toFixed(0)}`);
      if (ent.box.x1 > safeMaxX) reasons.push(`mép phải ${ent.box.x1.toFixed(1)} > ${safeMaxX.toFixed(0)}`);
      if (ent.box.y0 < STAGE_VB_Y0 + 2) reasons.push(`đỉnh ${ent.box.y0.toFixed(1)} < ${STAGE_VB_Y0 + 2}`);
      if (ent.box.y1 > STAGE_VB_Y1 - 2) reasons.push(`đáy ${ent.box.y1.toFixed(1)} > ${STAGE_VB_Y1 - 2}`);
      if (reasons.length > 0 && !seenOob.has(ent.id)) {
        seenOob.add(ent.id);
        issues.push({
          code: 'OUT_OF_SAFE_TERRAIN',
          message: `"${ent.id}" ra ngoài vùng an toàn của terrain tại t=${timeSec}s (${reasons.join(', ')}).`,
        });
      }
    }

    // 2b. Kiểm tra vật lơ lửng & luật treo tường (`tuong` không chạm đất)
    for (const ent of entities) {
      if (seenFloating.has(ent.id)) continue;
      if (ent.kind === 'prop') {
        if (ent.anchorKind === 'troi' || ent.anchorKind === 'cam' || ent.isDropping) {
          continue;
        }
        if (ent.anchorKind === 'tuong') {
          const cx = (ent.box.x0 + ent.box.x1) * 0.5;
          const groundY = getTerrainPoint(terrain, cx, phase).y;
          const clearance = groundY - ent.box.y1;
          if (clearance < MIN_WALL_CLEARANCE_UNITS) {
            seenFloating.add(ent.id);
            issues.push({
              code: 'FLOATING_OBJECT',
              message: `Đạo cụ treo tường "${ent.id}" đặt quá thấp / chạm đất tại t=${timeSec}s (cách đất ${clearance.toFixed(1)}px < tối thiểu ${MIN_WALL_CLEARANCE_UNITS}px).`,
            });
          }
          continue;
        }
        if (ent.anchorKind === 'tren' && ent.placedOnRef) {
          const [hostId, ancName] = ent.placedOnRef.split('.');
          const hostEnt = entities.find((e) => e.id === hostId);
          const hostDef = hostEnt ? BUILT_IN_PROP_CATALOG[hostEnt.type] : undefined;
          const anc = ancName ? hostDef?.anchors?.[ancName] : undefined;
          if (hostEnt && anc) {
            const entDef = BUILT_IN_PROP_CATALOG[ent.type];
            const entVar =
              ent.variant && entDef?.variants
                ? entDef.variants[ent.variant]
                : undefined;
            const localBox = entVar?.box ?? entDef?.box ?? [0, 0, 0, 0];
            const localCenterX = (localBox[0] + localBox[2]) * 0.5;
            const expectedY = hostEnt.worldY + anc[1] * hostEnt.scale;
            const expectedX =
              hostEnt.worldX + anc[0] * hostEnt.scale + localCenterX * ent.scale;
            const dy = Math.abs(ent.box.y1 - expectedY);
            const dx = Math.abs((ent.box.x0 + ent.box.x1) * 0.5 - expectedX);
            const tolY = Math.max(3.5, 1.5 * ent.scale);
            const tolX = Math.max(8.0, 3.0 * ent.scale);
            if (dy > tolY || dx > tolX) {
              seenFloating.add(ent.id);
              issues.push({
                code: 'FLOATING_OBJECT',
                message: `Đạo cụ "${ent.id}" đặt trên điểm neo "${ent.placedOnRef}" nhưng bị lệch (${dx.toFixed(1)}px ngang, ${dy.toFixed(1)}px dọc) tại t=${timeSec}s.`,
              });
            }
          }
          continue;
        }
        const cx = (ent.box.x0 + ent.box.x1) * 0.5;
        const groundY = getTerrainPoint(terrain, cx, phase).y;
        const gap = groundY - ent.box.y1;
        if (Math.abs(gap) > 3.0) {
          seenFloating.add(ent.id);
          issues.push({
            code: 'FLOATING_OBJECT',
            message: `Đạo cụ "${ent.id}" lơ lửng / lệch mặt đất ${gap.toFixed(1)}px tại t=${timeSec}s (đáy y=${ent.box.y1.toFixed(1)}, terrain y=${groundY.toFixed(1)}).`,
          });
        }
      } else if (ent.kind === 'actor') {
        const groundY = getTerrainPoint(terrain, (ent.box.x0 + ent.box.x1) * 0.5, phase).y;
        const gap = groundY - ent.box.y1;
        if (Math.abs(gap) > 3.0) {
          seenFloating.add(ent.id);
          issues.push({
            code: 'FLOATING_OBJECT',
            message: `Nhân vật "${ent.id}" lơ lửng cách mặt đất ${gap.toFixed(1)}px tại t=${timeSec}s.`,
          });
        }
      }
    }

    // 2c. Kiểm tra đè nhau: CHỈ xét các vật CÙNG lớp (`nen` / `giua` / `truoc`)
    checkPairCollisions(entities, timeSec, false);

    prevFrame = frame;
    prevEntitiesById = new Map(entities.map((e) => [`${e.kind}:${e.id}`, e]));
  }

  // 2d. T7e #1: Kiểm tra vật `tren` (placedOn) phải chạm đúng điểm neo ở cả khung cuối SAU đẩy máy
  {
    const fFinalAfterPush = Math.max(
      maxSampleFrame,
      timeline.durationInFrames - 2
    );
    const compFinal = evaluateStageScriptAtFrame(
      script,
      fFinalAfterPush,
      timeline,
      palette,
      visualDNA
    );
    const finalEntities = collectEntitiesFromCompiled(compFinal, true);
    const finalTimeSec = (fFinalAfterPush / fps).toFixed(2);
    for (const ent of finalEntities) {
      if (seenFloating.has(ent.id)) continue;
      if (ent.kind !== 'prop' || !ent.placedOnRef) continue;
      if (ent.anchorKind === 'cam' || ent.isDropping) continue;
      const [hostId, ancName] = ent.placedOnRef.split('.');
      const hostEnt = finalEntities.find((e) => e.id === hostId);
      const hostDef = hostEnt ? BUILT_IN_PROP_CATALOG[hostEnt.type] : undefined;
      const anc = ancName ? hostDef?.anchors?.[ancName] : undefined;
      if (hostEnt && anc) {
        const entDef = BUILT_IN_PROP_CATALOG[ent.type];
        const entVar =
          ent.variant && entDef?.variants
            ? entDef.variants[ent.variant]
            : undefined;
        const localBox = entVar?.box ?? entDef?.box ?? [0, 0, 0, 0];
        const localCenterX = (localBox[0] + localBox[2]) * 0.5;
        const expectedY = hostEnt.worldY + anc[1] * hostEnt.scale;
        const expectedX =
          hostEnt.worldX + anc[0] * hostEnt.scale + localCenterX * ent.scale;
        const dy = Math.abs(ent.box.y1 - expectedY);
        const dx = Math.abs((ent.box.x0 + ent.box.x1) * 0.5 - expectedX);
        const tolY = Math.max(3.5, 1.5 * ent.scale);
        const tolX = Math.max(8.0, 3.0 * ent.scale);
        if (dy > tolY || dx > tolX) {
          seenFloating.add(ent.id);
          issues.push({
            code: 'FLOATING_OBJECT',
            message: `Đạo cụ "${ent.id}" đặt trên điểm neo "${ent.placedOnRef}" bị lệch sau đẩy máy tại khung cuối t=${finalTimeSec}s (${dx.toFixed(1)}px ngang, ${dy.toFixed(1)}px dọc).`,
          });
        }
      }
    }
  }

  // 3. Kiểm tra luật đúng 1 vật đỏ & diện tích tối thiểu thống nhất MIN_RED_AREA_PX2 (2000 px²)
  //    T8-DNA-a #1 & #4: Với `semantic_v1`, đo tại khung ngay trước 0.8s mờ cuối (`fBeforeFade`) theo đúng kiểu `kieu_cu_lat` đã chọn.
  const isSemanticScript = Boolean(script.tags?.includes('semantic_v1'));
  const fPost1 = Math.min(
    timeline.durationInFrames - Math.round(1.6 * fps),
    timeline.pivotFrame + Math.round(1.4 * fps)
  );
  const fPost2 = Math.max(fPost1, timeline.durationInFrames - Math.round(2.0 * fps));
  const fBeforeFade = Math.max(
    fPost1,
    timeline.durationInFrames - Math.round(0.85 * fps)
  );
  const redSampleFrames = isSemanticScript ? [fBeforeFade] : [fPost1, fPost2];

  let maxRedSnapshot: Array<{ id: string; typeName: string; screenPx2: number; zoom: number }> = [];
  for (const pf of redSampleFrames) {
    const compiled = evaluateStageScriptAtFrame(script, pf, timeline, palette, visualDNA);
    const zoom2 = compiled.camera.zoom * compiled.camera.zoom;
    const reds: Array<{ id: string; typeName: string; screenPx2: number; zoom: number }> = [];

    for (const p of compiled.props) {
      if (p.opacity <= 0.15 || p.floatAwayProgress >= 0.75) continue;
      const areaUnits2 = computePropRedStageArea(p);
      if (areaUnits2 > 0.2) {
        reds.push({
          id: p.id,
          typeName: p.type,
          screenPx2: areaUnits2 * PX2_PER_STAGE_UNIT2 * zoom2,
          zoom: compiled.camera.zoom,
        });
      }
    }

    for (const a of compiled.actors) {
      const aSpec = (script.actors ?? []).find((x) => x.id === a.id);
      if (a.opacity <= 0.15 || a.dissolveToCloud >= 0.7) continue;
      if (a.color === (palette.accentProp || palette.accent)) {
        reds.push({
          id: a.id,
          typeName: 'human',
          screenPx2: 320 * a.scale * a.scale * PX2_PER_STAGE_UNIT2 * zoom2,
          zoom: compiled.camera.zoom,
        });
      } else if (a.showTeaCup > 0.2 && aSpec?.teaCupRed === true) {
        reds.push({
          id: `${a.id}.chen_tra`,
          typeName: 'small_cup',
          screenPx2: 7 * 5 * 0.88 * a.scale * a.scale * PX2_PER_STAGE_UNIT2 * zoom2,
          zoom: compiled.camera.zoom,
        });
      }
    }

    for (const ts of compiled.terrainSegments ?? []) {
      if (ts.opacity <= 0.15 || !ts.isAccentActive) continue;
      const segLenUnits = computeTerrainSegmentArcLength(compiled.terrain, ts.startX, ts.endX);
      if (segLenUnits <= 0.5) continue;
      // Dải lối đi có bề rộng ~5.8 đơn vị (2 mép song song tách khỏi nét đất đen)
      const areaUnits2 = segLenUnits * Math.max(ts.strokeWidth, 5.8);
      reds.push({
        id: ts.id,
        typeName: 'doan_duong',
        screenPx2: areaUnits2 * PX2_PER_STAGE_UNIT2 * zoom2,
        zoom: compiled.camera.zoom,
      });
    }

    if (reds.length > maxRedSnapshot.length) {
      maxRedSnapshot = reds;
    } else if (
      reds.length === 1 &&
      maxRedSnapshot.length === 1 &&
      reds[0].screenPx2 > maxRedSnapshot[0].screenPx2
    ) {
      maxRedSnapshot = reds;
    }
  }

  if (maxRedSnapshot.length === 0) {
    issues.push({
      code: 'RED_OBJECT_RULE',
      message: 'Phải có đúng 1 vật đỏ tại cú lật, hiện đang có 0 vật đỏ.',
    });
  } else if (maxRedSnapshot.length > 1) {
    issues.push({
      code: 'RED_OBJECT_RULE',
      message: `Mỗi Chén chỉ được có đúng 1 vật đỏ, hiện đang có ${maxRedSnapshot.length} vật đỏ (${maxRedSnapshot.map((r) => r.id).join(', ')}).`,
    });
  } else {
    const onlyRed = maxRedSnapshot[0];
    if (onlyRed.screenPx2 < MIN_RED_AREA_PX2) {
      const suggestions = RECOMMENDED_RED_PROPS.filter(
        (x) => x !== onlyRed.typeName
      ).join(', ');
      issues.push({
        code: 'RED_OBJECT_RULE',
        message: `Vật đỏ "${onlyRed.id}" (${onlyRed.typeName}) quá nhỏ trên màn hình (${Math.round(onlyRed.screenPx2)} px² < ngưỡng tối thiểu ${MIN_RED_AREA_PX2} px² ngay cả sau khi đẩy máy quay zoom=${onlyRed.zoom.toFixed(2)}). Tuyệt đối không phóng to riêng vật nhỏ; hãy đổi sang vật đỏ khác đủ diện tích như: ${suggestions}.`,
      });
    }

    // T7b #3 & T8-DNA-a #4: Vật đỏ phải còn đỏ và còn nhìn thấy từ lúc đổi đỏ đến khung ngay trước lúc mờ cuối (0.8s)
    if (isSemanticScript) {
      const fEnd = fBeforeFade;
      const persistSamples = Array.from(
        new Set([
          fPost1,
          Math.round((fPost1 + fEnd) * 0.5),
          fEnd,
        ])
      );
      for (const sf of persistSamples) {
        const compS = evaluateStageScriptAtFrame(script, sf, timeline, palette, visualDNA);
        let stillVisibleAndRed = false;
        if (onlyRed.typeName === 'doan_duong') {
          const ts = (compS.terrainSegments ?? []).find((s) => s.id === onlyRed.id);
          stillVisibleAndRed = Boolean(ts && ts.isAccentActive && ts.opacity > 0.35);
        } else if (onlyRed.id.endsWith('.chen_tra')) {
          const aid = onlyRed.id.replace(/\.chen_tra$/, '');
          const act = compS.actors.find((a) => a.id === aid);
          stillVisibleAndRed = Boolean(act && act.opacity > 0.35 && act.showTeaCup > 0.2);
        } else if (onlyRed.typeName === 'human') {
          const act = compS.actors.find((a) => a.id === onlyRed.id);
          stillVisibleAndRed = Boolean(
            act &&
              act.opacity > 0.35 &&
              act.dissolveToCloud < 0.5 &&
              act.color === (palette.accentProp || palette.accent)
          );
        } else {
          const pr = compS.props.find((p) => p.id === onlyRed.id);
          stillVisibleAndRed = Boolean(
            pr && pr.opacity > 0.35 && pr.floatAwayProgress < 0.5 && pr.isAccentActive
          );
        }
        if (!stillVisibleAndRed) {
          issues.push({
            code: 'RED_OBJECT_RULE',
            message: `Vật đỏ "${onlyRed.id}" bị mờ hoặc biến mất tại t=${(sf / fps).toFixed(2)}s trước khi hết video — vật đỏ phải còn đỏ và nhìn rõ đến khung cuối cùng. Hãy bỏ lệnh làm mờ/biến mất (duong_mo / bay_len / opacity=0).`,
          });
          break;
        }
      }

      // T7b #6: Vật đỏ phải là một hình riêng nhìn ra rõ ràng (không bị đạo cụ khác che lấp > 50%)
      if (
        onlyRed.typeName !== 'doan_duong' &&
        onlyRed.typeName !== 'human' &&
        !onlyRed.id.endsWith('.chen_tra')
      ) {
        const compRed = evaluateStageScriptAtFrame(script, fPost1, timeline, palette, visualDNA);
        const redProp = compRed.props.find((p) => p.id === onlyRed.id);
        const redBox = redProp ? getPropWorldBBox(redProp, undefined, true) : null;
        if (redProp && redBox) {
          const redArea = Math.max(
            0.01,
            (redBox.x1 - redBox.x0) * (redBox.y1 - redBox.y0)
          );
          const redHostId = redProp.spec.placedOn?.split('.')[0];
          for (const other of compRed.props) {
            if (other.id === redProp.id || other.id === redHostId) continue;
            if (other.opacity <= 0.2 || other.drawProgress <= 0.35) continue;
            // Bỏ qua vật đặt trên mặt đất khác lớp nền (ví dụ cửa sổ/mây ở nền xa) nếu không cùng lớp?
            // Luật T7b #6 kiểm che lấp hình chiếu 2D của mọi đạo cụ khác cùng sân khấu (trừ vật chủ trực tiếp đặt dưới)
            const oBox = getPropWorldBBox(other, undefined, true);
            if (!oBox) continue;
            const ix = Math.max(0, Math.min(redBox.x1, oBox.x1) - Math.max(redBox.x0, oBox.x0));
            const iy = Math.max(0, Math.min(redBox.y1, oBox.y1) - Math.max(redBox.y0, oBox.y0));
            const overlapRatio = (ix * iy) / redArea;
            if (overlapRatio > 0.5) {
              const isBackdrop =
                other.id.startsWith('__bg_') ||
                other.layer === 'far' ||
                other.spec.semanticLayer === 'nen';
              issues.push({
                code: 'RED_OBJECT_RULE',
                message: isBackdrop
                  ? `Vật đỏ "${onlyRed.id}" bị lớp nền "${other.id}" che lấp ${(overlapRatio * 100).toFixed(0)}% (> 50%) tại cú lật — lớp nền không được che vật đỏ.`
                  : `Vật đỏ "${onlyRed.id}" bị "${other.id}" che lấp ${(overlapRatio * 100).toFixed(0)}% (> 50%) tại cú lật — vật đỏ phải là một hình riêng nhìn ra rõ ràng.`,
              });
              break;
            }
          }
        }
      }
    }
  }

  // 4. Kiểm tra luật "Chữ dẫn, hình theo" & tỷ lệ tĩnh/động (≤ 40%) trên timeline đã biên dịch (chặn cả StageScript như Q096)
  if (script.tags?.includes('semantic_v1')) {
    const timelineCues = script.timeline ?? [];
    const propIdsSet = new Set((script.props ?? []).map((p) => p.id));
    const segIdsSet = new Set(
      (typeof script.terrain === 'object' ? script.terrain.segments ?? [] : []).map((s) => s.id)
    );

    let redStartFrame = Infinity;
    for (const cue of timelineCues) {
      if (!propIdsSet.has(cue.target) && !segIdsSet.has(cue.target)) continue;
      if (cue.colorRole === 'accent' || (cue.morphProgress !== undefined && cue.morphProgress > 0)) {
        const sf = resolveCueFrame(cue.at ?? cue.when, timeline);
        if (sf >= timeline.pivotFrame - 6 && sf < redStartFrame) {
          redStartFrame = sf;
        }
      }
    }
    if (!Number.isFinite(redStartFrame)) {
      redStartFrame =
        timeline.pivotFrame + Math.round(TEMPO.RED_COLOR_DELAY_AFTER_PIVOT_SEC * fps);
    }

    const minReactionFrame = Math.max(
      redStartFrame,
      timeline.pivotFrame + Math.round(TEMPO.PIVOT_REACTION_MIN_DELAY_SEC * fps)
    );
    const pivotWindowStart =
      timeline.pivotFrame - Math.round(TEMPO.PIVOT_WINDOW_BEFORE_SEC * fps);

    for (const actor of script.actors ?? []) {
      const aCues = timelineCues
        .filter((c) => c.target === actor.id)
        .map((c) => ({
          cue: c,
          startF: resolveCueFrame(c.at ?? c.when, timeline),
        }))
        .sort((a, b) => a.startF - b.startF);

      let curX = typeof actor.x === 'number' ? actor.x : 270;
      let curLean = actor.leanDeg ?? 0;
      let curSit = actor.sitProgress ?? (actor.pose === 'sit_lean' ? 1 : 0);
      let curPose = actor.pose ?? 'stand';
      let curFacing = actor.facing ?? 'right';

      const activeIntervals: Array<[number, number]> = [];
      let flaggedPivotEarly = false;

      for (const { cue, startF } of aCues) {
        const nextX =
          cue.toX !== undefined
            ? typeof cue.toX === 'number'
              ? cue.toX
              : curX
            : cue.x !== undefined && typeof cue.x === 'number'
              ? cue.x
              : curX;
        const nextLean = cue.leanDeg !== undefined ? cue.leanDeg : curLean;
        const nextSit = cue.sitProgress !== undefined ? cue.sitProgress : curSit;
        const nextPose = cue.pose !== undefined ? cue.pose : curPose;
        const nextFacing = cue.facing !== undefined ? cue.facing : curFacing;

        const changed =
          Math.abs(nextX - curX) > 0.5 ||
          Math.abs(nextLean - curLean) > 0.5 ||
          Math.abs(nextSit - curSit) > 0.05 ||
          nextPose !== curPose ||
          nextFacing !== curFacing;

        curX = nextX;
        curLean = nextLean;
        curSit = nextSit;
        curPose = nextPose;
        curFacing = nextFacing;

        if (!changed || startF <= 2) continue;

        // T7c: Không tính chuyển động mở màn vào luật chuyển động
        const openingEndFrame = Math.round(TEMPO.MO_MAN_TOTAL_MAX_SEC * fps);
        if (startF <= openingEndFrame) continue;

        const durF = Math.max(1, Math.round((cue.duration ?? TEMPO.MIN_LOOK_TURN_SEC) * fps));
        const endF = Math.min(timeline.durationInFrames, startF + durF);
        activeIntervals.push([startF, endF]);

        if (!flaggedPivotEarly && startF >= pivotWindowStart && startF < minReactionFrame) {
          flaggedPivotEarly = true;
          issues.push({
            code: 'PIVOT_ORDER_VIOLATION',
            message: `Nhân vật "${actor.id}" có chuyển động lớn bắt đầu tại ${cue.at ?? cue.when} (t=${(startF / fps).toFixed(2)}s), sớm hơn ngưỡng "Chữ dẫn, hình theo" (cần ≥ t=${(minReactionFrame / fps).toFixed(2)}s, tức ≥ pivot+${TEMPO.PIVOT_REACTION_MIN_DELAY_SEC}s và không trước lúc vật đỏ đổi màu).`,
          });
        }
      }

      // Hợp nhất các khoảng chuyển động để tính % thời lượng nhân vật đang động
      if (activeIntervals.length > 0) {
        activeIntervals.sort((a, b) => a[0] - b[0]);
        let mergedFrames = 0;
        let [mStart, mEnd] = activeIntervals[0];
        for (let i = 1; i < activeIntervals.length; i++) {
          const [s, e] = activeIntervals[i];
          if (s <= mEnd) {
            mEnd = Math.max(mEnd, e);
          } else {
            mergedFrames += Math.max(0, mEnd - mStart);
            mStart = s;
            mEnd = e;
          }
        }
        mergedFrames += Math.max(0, mEnd - mStart);
        const activeRatio = mergedFrames / Math.max(1, timeline.durationInFrames);
        if (activeRatio > TEMPO.MAX_ACTIVE_MOTION_RATIO + 0.005) {
          issues.push({
            code: 'TEMPO_RULE_VIOLATION',
            message: `Nhân vật "${actor.id}" chuyển động ${(activeRatio * 100).toFixed(0)}% thời lượng video (tối đa ${Math.round(TEMPO.MAX_ACTIVE_MOTION_RATIO * 100)}% theo Nhịp Trà Nguội); hãy bỏ bớt chuyển động để cảnh tĩnh hơn.`,
          });
        }
      }
    }
  }

  return {
    valid: issues.length === 0,
    isLegacy: false,
    issues,
    compiledScript: script,
  };
}

export function validateAndCompileStageInput(
  input: unknown,
  timelineInput?: TimelineSyncResult,
  visualDNA?: ResolvedVisualDNA
): StageValidationResult {
  if (isSemanticStageScript(input)) {
    const structIssues = validateSemanticSpecStructure(input);
    const compiled = compileSemanticStageScript(input as SemanticStageScript);
    const runtimeRes = validateStageScriptHard(compiled, timelineInput, visualDNA);
    const merged: StageValidationIssue[] = [...structIssues];
    const seenMsg = new Set(merged.map((i) => i.message));
    for (const ri of runtimeRes.issues) {
      if (!seenMsg.has(ri.message)) {
        seenMsg.add(ri.message);
        merged.push(ri);
      }
    }
    return {
      valid: merged.length === 0,
      isLegacy: false,
      issues: merged,
      compiledScript: compiled,
    };
  }

  const script = input as StageScript;
  return validateStageScriptHard(script, timelineInput, visualDNA);
}
