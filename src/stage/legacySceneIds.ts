import type { StageScript } from './stageScriptSchema';

/**
 * Danh sách đóng băng 51 kịch bản cũ trong data/stage-scripts.json trước khi chuẩn hoá ngữ nghĩa.
 * - Các kịch bản này được đánh dấu `legacy` và giữ nguyên 100% cách render cũ (kể cả custom-props.json).
 * - Mọi kịch bản mới hoặc kịch bản đã chuyển sang ngữ nghĩa (`strictValidation: true` / `legacy: false`)
 *   bắt buộc phải đi qua Validator chặn cứng và không được dùng custom-props.json.
 */
export const LEGACY_SCENE_IDS: ReadonlySet<string> = new Set([
  'SCRIPT_RUOU_MAY_DUYEN_DAU',
  'SCRIPT_LA_AP_TRANG_NUOC',
  'SCRIPT_CAU_DON_BONG_DAI',
  'SCRIPT_LOP_DU_PHONG',
  'SCRIPT_CAI_BONG_PHO_THI_VOM_DEM',
  'SCRIPT_BEN_NUOC_CHEN_SAY_TROI_XA',
  'SCRIPT_NGOI_NHA_TREN_MAY_TINH_MONG',
  'SCRIPT_DUYEN_DAU_TREN_MAY',
  'SCRIPT_CHAM_CONG_NGONG_TRUA',
  'SCRIPT_CHIEC_O_RONG_CHO_NHAU',
  'SCRIPT_NGUOI_LU_HANH_VA_KY_UC',
  'SCRIPT_CONG_RAO_HOA_MAI_HIEN_CHUNG',
  'SCRIPT_MOT_THU_HOA_TIM_DOI',
  'SCRIPT_NHANH_MAM_HOA_TAN_O_DOI',
  'SCRIPT_GHE_DA_DOI_CHEN_TRA_DO',
  'SCRIPT_CAU_DA_LONG_DEN_DO_SOI_DOI',
  'SCRIPT_NAM_RUOU_HOA_TIM_LONG_LANH',
  'SCRIPT_NAM_RUOU_HOA_VOAN_DO_TINH_TAI',
  'SCRIPT_NAM_RUOU_HOA_VOAN_LUA_DO',
  'SCRIPT_GHE_DA_CHUONG_GIO_DO_TINH_TAI',
  'SCRIPT_BAC_THEM_DOA_HONG_DO_TINH_TAI',
  'SCRIPT_MOT_TIM_MANH_HOA_TIM_DOI_TINH_TAI',
  'SCRIPT_GHE_DAI_BO_HOA_DOI_TINH_TAI',
  'SCRIPT_XE_DAP_CO_GIO_HOA_DO_GAP_DOI',
  'SCRIPT_XE_DAP_HOA_DO_GAP_DOI_V2',
  'SCRIPT_DIEN_TAM_DO_HOA_NHIP_TIM_DO',
  'SCRIPT_VIEN_NANG_NO_HOA_TIM',
  'SCRIPT_BANG_DO_MAT_HOA_O_CUA_EM',
  'SCRIPT_PIN_CAN_SAC_TIM_DO',
  'SCRIPT_PIN_CAN_SAC_TIM_DO_V2',
  'SCRIPT_BANG_TUAN_HOAN_NGUYEN_TO_EM',
  'SCRIPT_BANG_TUAN_HOAN_GHEP_TIM_DO',
  'SCRIPT_NGOI_NGHI_NGUYEN_TO_A_C_D_HOA_EM',
  'SCRIPT_DUNG_NGHI_NGUYEN_TO_A_C_D_HOA_EM',
  'SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG',
  'SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG_V2',
  'SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG_V3',
  'SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG_V4',
  'SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG_V5',
  'SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG_V6',
  'SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG_V7',
  'SCRIPT_NHANH_HOA_LE_HOA_XE_HOA_GAP_DOI',
  'SCRIPT_MOT_BONG_HOA_BO_HOA_EM_QUAY_LAI',
  'SCRIPT_P019_TO_HOA_DON_PHAN_CHU',
  'SCRIPT_P019_TO_HOA_DON_PHAN_CHU_V2',
  'SCRIPT_P019_TO_HOA_DON_PHAN_CHU_V3',
  'SCRIPT_P019_TO_HOA_DON_PHAN_CHU_V4',
  'SCRIPT_P022_LICH_BAN_CHUA_CAP_NHAT',
  'SCRIPT_GANH_NANG_COM_AO_HOA_DON_DOPING',
  'SCRIPT_P032_QUYET_TAM_3_GIAY',
  'SCRIPT_DE_SANG_MAI',
]);

export function isFreeModeStageScript(script?: StageScript | null): boolean {
  return script?.che_do === 'tu_do';
}

export function isLegacyStageScript(
  script?: StageScript | null,
  sceneId?: string
): boolean {
  if (script?.che_do === 'tu_do') {
    return false;
  }
  if (script?.strictValidation === true || script?.legacy === false) {
    return false;
  }
  if (script?.legacy === true) {
    return true;
  }
  const sid = script?.sceneId || sceneId || '';
  return Boolean(sid && LEGACY_SCENE_IDS.has(sid));
}
