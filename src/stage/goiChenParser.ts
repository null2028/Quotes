/**
 * parseGoiChen — Hàm duy nhất biến JSON Gói Chén thành StageScript đã biên dịch.
 *
 * Luồng: Gói Chén → chuyển sang SemanticStageScript → compileSemanticStageScript → validateStageScriptHard
 * Lỗi trả về là câu tiếng Việt có gợi ý tên đúng, dùng cho T4 (copy gửi lại Gemini web).
 */
import { computeTimelineSync, TimelineSyncResult } from '../engine/timelineSync';
import { BUILT_IN_PROP_CATALOG, BUILT_IN_PROP_NAMES } from './propCatalog';
import {
  classifySemanticBeatTempo,
  compileSemanticStageScript,
  isSemanticStageScript,
  SemanticStageScript,
} from './semanticStage';
import {
  validateSemanticSpecStructure,
  validateStageScriptHard,
  StageValidationIssue,
} from './stageValidator';
import type { StageScript } from './stageScriptSchema';

/** Kết quả trả về từ parseGoiChen */
export interface GoiChenResult {
  ok: boolean;
  compiled: StageScript | null;
  /** Mảng câu chữ từ Gói Chén (segments), dùng cho UI import */
  cau?: string[];
  cuLat?: string;
  tieuDe?: string;
  tacGia?: string;
  /** Từng dòng tiếng Việt; chủ kênh copy nguyên gửi lại Gemini web để sửa. */
  errors: string[];
  /** Cảnh báo vàng (không chặn nhập, vd đạo cụ tầng B `nhap` chưa chuẩn hoá nét). */
  warnings?: string[];
}

const GOI_CHEN_VERSION = 1;

/**
 * Parse JSON Gói Chén → { ok, compiled, errors[] }.
 * @param raw — object JSON đã parse hoặc string chưa parse.
 */
export function parseGoiChen(raw: unknown): GoiChenResult {
  // ── 1. Parse JSON nếu đầu vào là string ──
  let obj: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      return {
        ok: false,
        compiled: null,
        errors: [`JSON không hợp lệ: ${(e as Error).message}`],
      };
    }
  } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  } else {
    return {
      ok: false,
      compiled: null,
      errors: ['Gói Chén phải là một object JSON (không phải mảng hay giá trị đơn).'],
    };
  }

  const formatErrors: string[] = [];   // Lỗi định dạng / tên
  const ruleErrors: string[] = [];     // Lỗi luật vật đỏ
  const geomErrors: string[] = [];     // Lỗi hình học (đè nhau, lơ lửng, vùng an toàn)

  // ── 2. Kiểm tra phien_ban_goi ──
  if (!('phien_ban_goi' in obj)) {
    formatErrors.push('Thiếu trường "phien_ban_goi". Thêm: "phien_ban_goi": 1');
  } else if (obj.phien_ban_goi !== GOI_CHEN_VERSION) {
    formatErrors.push(
      `"phien_ban_goi" phải là ${GOI_CHEN_VERSION}, nhận được ${JSON.stringify(obj.phien_ban_goi)}.`
    );
  }

  // ── 3. Kiểm tra câu chữ ──
  if (!('tieu_de' in obj) || typeof obj.tieu_de !== 'string' || !obj.tieu_de) {
    formatErrors.push('Thiếu trường "tieu_de" (tiêu đề Chén, kiểu string).');
  }

  const cau = obj.cau;
  if (!Array.isArray(cau) || cau.length === 0) {
    formatErrors.push('Thiếu trường "cau" (mảng các dòng thơ, tối thiểu 2 dòng).');
  } else {
    if (cau.length < 2) {
      formatErrors.push(`"cau" chỉ có ${cau.length} dòng, cần tối thiểu 2 dòng.`);
    }
    if (cau.length > 4) {
      formatErrors.push(`"cau" có ${cau.length} dòng, tối đa 4 dòng.`);
    }
    for (let i = 0; i < cau.length; i++) {
      if (typeof cau[i] !== 'string' || !cau[i].trim()) {
        formatErrors.push(`"cau[${i}]" phải là chuỗi không rỗng.`);
      }
    }
  }

  const cuLat = obj.cu_lat;
  if (!cuLat || typeof cuLat !== 'string') {
    formatErrors.push('Thiếu trường "cu_lat" (cụm chữ đổi đỏ, kiểu string).');
  } else if (Array.isArray(cau) && cau.length > 0) {
    const lastLine = String(cau[cau.length - 1]);
    if (!lastLine.includes(cuLat as string)) {
      formatErrors.push(
        `"cu_lat" = "${cuLat}" không nằm trong dòng cuối "${lastLine}". Cụm chữ đổi đỏ phải là một phần của dòng cuối cùng trong "cau".`
      );
    }
  }

  // ── 4. Kiểm tra trường cấm (toạ độ, shapes) ──
  const FORBIDDEN = ['x', 'y', 'toX', 'toY', 'yOffset', 'scale', 'shapes', 'altShapes'];
  const forbiddenSeen = new Set<string>();
  function checkForbiddenDeep(path: string, val: unknown): void {
    if (!val || typeof val !== 'object') return;
    if (Array.isArray(val)) {
      val.forEach((item, i) => checkForbiddenDeep(`${path}[${i}]`, item));
      return;
    }
    for (const key of Object.keys(val as Record<string, unknown>)) {
      if (FORBIDDEN.includes(key) && !forbiddenSeen.has(key)) {
        forbiddenSeen.add(key);
        formatErrors.push(
          `Không được ghi trường "${key}" trong Gói Chén — hãy dùng khe vị trí hoặc điểm neo thay vì toạ độ trực tiếp.`
        );
      }
      checkForbiddenDeep(`${path}.${key}`, (val as Record<string, unknown>)[key]);
    }
  }
  checkForbiddenDeep('root', obj);

  // ── 5. Đếm vật đỏ ──
  const daoCu = obj.dao_cu;
  const doanDuong =
    obj.boi_canh && typeof obj.boi_canh === 'object'
      ? (obj.boi_canh as Record<string, unknown>).doan_duong
      : undefined;
  const redIds: string[] = [];
  if (Array.isArray(daoCu)) {
    for (const p of daoCu) {
      if (p && typeof p === 'object' && (p as Record<string, unknown>).vat_do === true) {
        redIds.push(`"${String((p as Record<string, unknown>).id || '?')}"`);
      }
    }
  }
  if (Array.isArray(doanDuong)) {
    for (const seg of doanDuong) {
      if (seg && typeof seg === 'object' && (seg as Record<string, unknown>).vat_do === true) {
        redIds.push(`"${String((seg as Record<string, unknown>).id || '?')}"`);
      }
    }
  }
  if (typeof obj.vat_do_tren_tay === 'string' && obj.vat_do_tren_tay.trim().length > 0) {
    redIds.push(`"${obj.vat_do_tren_tay.trim()}"`);
  }
  if (redIds.length > 1) {
    ruleErrors.push(
      `Có ${redIds.length} vật đỏ (${redIds.join(', ')}) nhưng chỉ được tối đa 1. Giữ 1 vật "vat_do": true, xoá ở các vật còn lại.`
    );
  }

  // Nếu lỗi câu chữ / cấu trúc nghiêm trọng → dừng sớm
  if (formatErrors.length > 0 && (!Array.isArray(obj.nhan_vat) || !Array.isArray(obj.dao_cu) || !Array.isArray(obj.nhip))) {
    return { ok: false, compiled: null, errors: [...formatErrors, ...ruleErrors] };
  }

  // ── 6. Chuyển sang SemanticStageScript ──
  const semInput: Record<string, unknown> = {
    semanticVersion: 1,
    sceneId: `GOICHEN_${String(obj.ma_quote || obj.tieu_de || 'DRAFT').replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`,
    ten: String(obj.tieu_de || 'Gói Chén'),
    mo_ta: obj.mo_ta,
    boi_canh: obj.boi_canh,
    nhan_vat: obj.nhan_vat,
    dao_cu: obj.dao_cu,
    nhip: obj.nhip,
  };
  if (obj.vat_do_tren_tay) {
    semInput.vat_do_tren_tay = obj.vat_do_tren_tay;
  }
  if (obj.kieu_cu_lat !== undefined) {
    semInput.kieu_cu_lat = obj.kieu_cu_lat;
  }

  // ── 7. Validate cấu trúc ngữ nghĩa ──
  // Thu thập id các vật bị lỗi tên/neo → không kiểm hình học cho chúng
  const badPropIds = new Set<string>();
  const draftPropTypes = new Set<string>();
  if (Array.isArray(daoCu)) {
    for (const p of daoCu) {
      if (!p || typeof p !== 'object') continue;
      const po = p as Record<string, unknown>;
      const typeName = String(po.type || '');
      const catDef = BUILT_IN_PROP_CATALOG[typeName];
      if (!catDef) {
        badPropIds.add(String(po.id || ''));
      } else if (catDef.status !== 'duyet') {
        draftPropTypes.add(typeName);
      }
      // Vật đặt trên vật chủ không tồn tại
      if (po.dat_tren) {
        const [hostId] = String(po.dat_tren).split('.');
        const hostExists = daoCu.some(
          (h: unknown) => h && typeof h === 'object' && (h as Record<string, unknown>).id === hostId
        );
        if (!hostExists) badPropIds.add(String(po.id || ''));
      }
    }
  }
  const warnings = Array.from(draftPropTypes).map(
    (t) => `Dùng đạo cụ chưa chuẩn hoá nét: ${t}`
  );
  if (isSemanticStageScript(semInput) && Array.isArray(semInput.nhip)) {
    const tempoAnalysis = classifySemanticBeatTempo(semInput as SemanticStageScript);
    for (const tw of tempoAnalysis.warnings) {
      warnings.push(tw);
    }
  }

  const structIssues = validateSemanticSpecStructure(semInput);
  for (const issue of structIssues) {
    // Phân loại lỗi
    if (issue.code === 'UNKNOWN_NAME' || issue.code === 'UNKNOWN_KEY' ||
        issue.code === 'CUSTOM_PROP_FORBIDDEN' || issue.code === 'MISSING_CATALOG_METADATA' ||
        issue.code === 'INVALID_ANCHOR' || issue.code === 'INVALID_SEATING') {
      formatErrors.push(issue.message);
    } else if (
      issue.code === 'RED_OBJECT_RULE' ||
      issue.code === 'TEMPO_RULE_VIOLATION' ||
      issue.code === 'PIVOT_ORDER_VIOLATION'
    ) {
      ruleErrors.push(issue.message);
    } else {
      geomErrors.push(issue.message);
    }
  }

  // ── 8. Biên dịch → StageScript ──
  let compiled: StageScript | null = null;
  if (isSemanticStageScript(semInput)) {
    const compileWarnings: string[] = [];
    try {
      compiled = compileSemanticStageScript(
        semInput as SemanticStageScript,
        compileWarnings
      );
      for (const cw of compileWarnings) {
        warnings.push(cw);
      }
    } catch (e) {
      formatErrors.push(`Lỗi biên dịch cảnh: ${(e as Error).message}`);
      return {
        ok: false,
        compiled: null,
        tieuDe: typeof obj.tieu_de === 'string' ? obj.tieu_de : undefined,
        cau: Array.isArray(obj.cau) ? obj.cau.map(String) : undefined,
        cuLat: typeof obj.cu_lat === 'string' ? obj.cu_lat : undefined,
        tacGia: typeof obj.tac_gia === 'string' ? obj.tac_gia : undefined,
        errors: [...formatErrors, ...ruleErrors, ...geomErrors],
      };
    }

    // ── 9. Validate runtime (đè nhau, lơ lửng, tỷ lệ 40%, Chữ dẫn Hình theo trên timeline thật) ──
    let realTimeline: TimelineSyncResult | undefined;
    if (Array.isArray(cau) && cau.length >= 2 && typeof cuLat === 'string' && cuLat.trim()) {
      try {
        realTimeline = computeTimelineSync({
          id: compiled.sceneId || 'goichen-validate',
          textFormat: 'POEM',
          segments: cau.map((c) => String(c)),
          pivotWord: cuLat.replace(/[!?.…]+$/u, ''),
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
      } catch {
        realTimeline = undefined;
      }
    }

    const runtimeRes = validateStageScriptHard(compiled, realTimeline);
    for (const issue of runtimeRes.issues) {
      // Bỏ lỗi dây chuyền: nếu vật đã lỗi tên/neo → bỏ collision/floating/oob cho vật đó
      if (isCascadeError(issue, badPropIds)) continue;

      // Phân loại + làm sạch message
      const cleanMsg = cleanGeomMessage(issue.message);

      if (
        issue.code === 'RED_OBJECT_RULE' ||
        issue.code === 'RED_SILHOUETTE_MISMATCH' ||
        issue.code === 'TEMPO_RULE_VIOLATION' ||
        issue.code === 'PIVOT_ORDER_VIOLATION'
      ) {
        ruleErrors.push(cleanMsg);
      } else {
        geomErrors.push(cleanMsg);
      }
    }
  }

  // ── 10. Gộp, dedup, sắp thứ tự: format → rule → geom ──
  const allErrors = dedup([...formatErrors, ...ruleErrors, ...geomErrors]);

  return {
    ok: allErrors.length === 0,
    compiled,
    tieuDe: typeof obj.tieu_de === 'string' ? obj.tieu_de : undefined,
    cau: Array.isArray(obj.cau) ? obj.cau.map(String) : undefined,
    cuLat: typeof obj.cu_lat === 'string' ? obj.cu_lat : undefined,
    tacGia: typeof obj.tac_gia === 'string' ? obj.tac_gia : undefined,
    errors: allErrors,
    warnings,
  };
}

/** Kiểm tra xem lỗi runtime có phải hệ quả dây chuyền từ vật đã lỗi tên/neo */
function isCascadeError(issue: StageValidationIssue, badIds: Set<string>): boolean {
  if (badIds.size === 0) return false;
  const cascadeCodes = new Set([
    'OVERLAP_COLLISION', 'FLOATING_OBJECT', 'OUT_OF_SAFE_TERRAIN',
    'REAL_SIZE_SCALING_VIOLATION', 'SAME_TYPE_SIZE_MISMATCH',
  ]);
  if (!cascadeCodes.has(issue.code)) return false;
  // Kiểm tra nếu message nhắc tới bất kỳ badId nào
  for (const id of badIds) {
    if (issue.message.includes(`"${id}"`)) return true;
  }
  return false;
}

/** Bỏ số pixel kỹ thuật khỏi câu lỗi hình học */
function cleanGeomMessage(msg: string): string {
  // Bỏ "(9.4×14.6px)" → ""
  let clean = msg.replace(/\s*\(\d+\.?\d*×\d+\.?\d*px\)/g, '');
  // Bỏ "cách mặt đất 12.5px" → "cách mặt đất"
  clean = clean.replace(/\s+\d+\.?\d*px/g, '');
  // Bỏ "(đáy y=... terrain y=...)" → ""
  clean = clean.replace(/\s*\(đáy y=[\d.]+,?\s*terrain y=[\d.]+\)/g, '');
  // Bỏ "(mép trái -4.5 < 70)" → ""
  clean = clean.replace(/\s*\(mép \w+ [\d.-]+ [<>] [\d.-]+\)/g, '');
  // Thay "tại t=0.00s" → "lúc bắt đầu video" cho dễ đọc (chỉ t=0)
  clean = clean.replace(/ tại t=0\.00s/g, ' lúc bắt đầu video');
  return clean.trim();
}

function dedup(arr: string[]): string[] {
  const result: string[] = [];
  const normSet = new Set<string>();

  for (const s of arr) {
    // Normalize bằng cách bóc prefix scope, bỏ dấu chấm cuối, lowercase
    let norm = s
      .replace(/^(root\.)?(dao_cu|nhan_vat|nhip)\[\d+\]\s*\([^)]*\):\s*/g, '')
      .replace(/^Đạo cụ\s+"[^"]*":\s*/g, '')
      .replace(/\.\s*$/, '')
      .trim()
      .toLowerCase();

    // Thêm: gom các lỗi cùng bản chất
    // "không được ghi trực tiếp \"x\"" và "không được ghi trường \"x\"" → cùng key
    const forbiddenMatch = norm.match(/không được ghi[^"]*"(\w+)"/);
    if (forbiddenMatch) norm = `forbidden:${forbiddenMatch[1]}`;

    // "2 vật đỏ" / "đúng 1 vật đỏ" / "tối đa 1" → cùng key
    if (/vật đỏ/.test(norm) && /\d+\s*vật đỏ|tối đa 1/.test(norm)) norm = 'rule:max_red';

    // anchor error cùng ref: "ke_sach.mat_ke" chưa khai báo / không tồn tại → cùng key
    const anchorRefMatch = norm.match(/"([^"]+\.[^"]+)"[^"]*(?:chưa|không)/);
    if (anchorRefMatch) norm = `anchor:${anchorRefMatch[1]}`;

    if (!normSet.has(norm)) {
      normSet.add(norm);
      result.push(s);
    }
  }
  return result;
}

/** Nhận dạng JSON có phải Gói Chén không (dùng trong bridge) */
export function isGoiChen(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const r = obj as Record<string, unknown>;
  return r.phien_ban_goi === GOI_CHEN_VERSION && Array.isArray(r.cau) && typeof r.cu_lat === 'string';
}
