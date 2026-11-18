/**
 * parseGoiChen — Hàm duy nhất biến JSON Gói Chén thành StageScript đã biên dịch.
 *
 * Luồng: Gói Chén → chuyển sang SemanticStageScript → compileSemanticStageScript → validateStageScriptHard
 * Lỗi trả về là câu tiếng Việt có gợi ý tên đúng, dùng cho T4 (copy gửi lại Gemini web).
 */
import { BUILT_IN_PROP_CATALOG, BUILT_IN_PROP_NAMES } from './propCatalog';
import {
  compileSemanticStageScript,
  isSemanticStageScript,
  SemanticStageScript,
} from './semanticStage';
import {
  validateSemanticSpecStructure,
  validateStageScriptHard,
} from './stageValidator';
import type { StageScript } from './stageScriptSchema';

/** Kết quả trả về từ parseGoiChen */
export interface GoiChenResult {
  ok: boolean;
  compiled: StageScript | null;
  /** Từng dòng tiếng Việt; chủ kênh copy nguyên gửi lại Gemini web để sửa. */
  errors: string[];
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

  const errors: string[] = [];

  // ── 2. Kiểm tra phien_ban_goi ──
  if (!('phien_ban_goi' in obj)) {
    errors.push('Thiếu trường "phien_ban_goi". Thêm: "phien_ban_goi": 1');
  } else if (obj.phien_ban_goi !== GOI_CHEN_VERSION) {
    errors.push(
      `"phien_ban_goi" phải là ${GOI_CHEN_VERSION}, nhận được ${JSON.stringify(obj.phien_ban_goi)}.`
    );
  }

  // ── 3. Kiểm tra câu chữ ──
  if (!('tieu_de' in obj) || typeof obj.tieu_de !== 'string' || !obj.tieu_de) {
    errors.push('Thiếu trường "tieu_de" (tiêu đề Chén, kiểu string).');
  }

  const cau = obj.cau;
  if (!Array.isArray(cau) || cau.length === 0) {
    errors.push('Thiếu trường "cau" (mảng các dòng thơ, tối thiểu 2 dòng).');
  } else {
    if (cau.length < 2) {
      errors.push(`"cau" chỉ có ${cau.length} dòng, cần tối thiểu 2 dòng.`);
    }
    if (cau.length > 4) {
      errors.push(`"cau" có ${cau.length} dòng, tối đa 4 dòng.`);
    }
    for (let i = 0; i < cau.length; i++) {
      if (typeof cau[i] !== 'string' || !cau[i].trim()) {
        errors.push(`"cau[${i}]" phải là chuỗi không rỗng.`);
      }
    }
  }

  const cuLat = obj.cu_lat;
  if (!cuLat || typeof cuLat !== 'string') {
    errors.push('Thiếu trường "cu_lat" (cụm chữ đổi đỏ, kiểu string).');
  } else if (Array.isArray(cau) && cau.length > 0) {
    const lastLine = String(cau[cau.length - 1]);
    if (!lastLine.includes(cuLat as string)) {
      errors.push(
        `"cu_lat" = "${cuLat}" không nằm trong dòng cuối "${lastLine}". Cụm chữ đổi đỏ phải là một phần của dòng cuối cùng trong "cau".`
      );
    }
  }

  // ── 4. Kiểm tra trường cấm (toạ độ, shapes) ──
  const FORBIDDEN = ['x', 'y', 'toX', 'toY', 'yOffset', 'scale', 'shapes', 'altShapes'];
  function checkForbiddenDeep(path: string, val: unknown): void {
    if (!val || typeof val !== 'object') return;
    if (Array.isArray(val)) {
      val.forEach((item, i) => checkForbiddenDeep(`${path}[${i}]`, item));
      return;
    }
    for (const key of Object.keys(val as Record<string, unknown>)) {
      if (FORBIDDEN.includes(key)) {
        errors.push(
          `${path}.${key}: không được ghi "${key}" trong Gói Chén (hãy dùng khe vị trí hoặc điểm neo).`
        );
      }
      checkForbiddenDeep(`${path}.${key}`, (val as Record<string, unknown>)[key]);
    }
  }
  checkForbiddenDeep('root', obj);

  // ── 5. Đếm vật đỏ ──
  const daoCu = obj.dao_cu;
  if (Array.isArray(daoCu)) {
    const redItems = daoCu.filter(
      (p) => p && typeof p === 'object' && (p as Record<string, unknown>).vat_do === true
    );
    if (redItems.length > 1) {
      const ids = redItems.map((p) => `"${(p as Record<string, unknown>).id}"`).join(', ');
      errors.push(
        `Có ${redItems.length} vật đỏ (${ids}) nhưng chỉ được tối đa 1. Giữ 1 vật "vat_do": true, xoá ở các vật còn lại.`
      );
    }
  }

  // Nếu lỗi câu chữ / cấu trúc nghiêm trọng → dừng sớm
  if (errors.length > 0 && (!Array.isArray(obj.nhan_vat) || !Array.isArray(obj.dao_cu) || !Array.isArray(obj.nhip))) {
    return { ok: false, compiled: null, errors };
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

  // ── 7. Validate cấu trúc ngữ nghĩa ──
  const structIssues = validateSemanticSpecStructure(semInput);
  for (const issue of structIssues) {
    errors.push(issue.message);
  }

  // ── 8. Biên dịch → StageScript ──
  let compiled: StageScript | null = null;
  if (isSemanticStageScript(semInput)) {
    try {
      compiled = compileSemanticStageScript(semInput as SemanticStageScript);
    } catch (e) {
      errors.push(`Lỗi biên dịch cảnh: ${(e as Error).message}`);
      return { ok: false, compiled: null, errors };
    }

    // ── 9. Validate runtime (đè nhau, lơ lửng, v.v.) ──
    const runtimeRes = validateStageScriptHard(compiled);
    const seenMsg = new Set(errors);
    for (const issue of runtimeRes.issues) {
      if (!seenMsg.has(issue.message)) {
        seenMsg.add(issue.message);
        errors.push(issue.message);
      }
    }
  }

  // Dedup errors
  const uniqueErrors = [...new Set(errors)];

  return {
    ok: uniqueErrors.length === 0,
    compiled: compiled,
    errors: uniqueErrors,
  };
}
