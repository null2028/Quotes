import { BUILT_IN_PROP_CATALOG } from './propCatalog';
import {
  AnchorKind,
  AUTO_FRAME_MIN_TOP_MARGIN_RATIO,
  AUTO_FRAME_MIN_TRAVELER_HEIGHT_RATIO,
  AUTO_FRAME_TARGET_WIDTH_RATIO,
  DEFAULT_SCENE_SCALE,
  MIN_RED_AREA_PX2,
  PIVOT_CAMERA_PUSH_IN_ZOOM,
  SEMANTIC_SLOTS,
  SemanticLayer,
  SemanticSlot,
  SKY_MOUNT_Y,
  WALL_MOUNT_Y_OFFSET,
} from './stageConstants';
import {
  computePropRedStageArea,
  PX2_PER_STAGE_UNIT2,
  STAGE_VB_H,
  STAGE_VB_W,
  STAGE_VB_Y0,
} from './stageGeometry';
import type {
  ActorSpec,
  AtmosphereItem,
  AtmosphereType,
  PropSpec,
  StageLayer,
  StageScript,
  StageTravelerPose,
  TerrainSegmentSpec,
  TerrainType,
  TimelineCue,
} from './stageScriptSchema';

export const SEMANTIC_POSES = {
  dung: 'stand',
  di_bo: 'walk',
  day: 'push',
  ngoi_tua: 'sit_lean',
  nguoc_nhin: 'look_up',
  vuon_tay: 'reach_out',
  gio_cao: 'hold_up',
  trao: 'give',
} as const;
export type SemanticPoseName = keyof typeof SEMANTIC_POSES;

export const SEMANTIC_TERRAINS = {
  phang: 'flat',
  doc: 'slope',
  doi: 'hill',
  nga_re: 'fork',
  bo_nuoc: 'water_shore',
  bac_thang: 'stairs',
} as const;
export type SemanticTerrainName = keyof typeof SEMANTIC_TERRAINS;

export const SEMANTIC_SOCKETS = {
  tay: 'hand',
  dau: 'head',
  lung: 'back',
} as const;

export const SEMANTIC_LEANS = ['thang', 'nhe_truoc', 'guc', 'nga_lung'] as const;

export const SEMANTIC_BEAT_ANCHORS = [
  'bat_dau',
  'dong_1',
  'dong_2',
  'dong_3',
  'dong_4',
  'cu_lat',
] as const;

export const SEMANTIC_ACTOR_ROLES = ['lu_khach', 'nguoi_b'] as const;
export type SemanticActorRole = (typeof SEMANTIC_ACTOR_ROLES)[number];

export const SEMANTIC_ACTOR_BEAT_VERBS = [
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
] as const;

export const SEMANTIC_PROP_BEAT_VERBS = [
  'trang_thai',
  'cam_boi',
  'dat_tren',
  'di_toi',
  'bay_len',
  'tach_doi',
  'khoi',
  'tha_roi',
] as const;

export const SEMANTIC_TERRAIN_SEGMENT_VERBS = ['duong_mo', 'doi_do'] as const;

export interface SemanticAtmosphereSpec {
  id?: string;
  loai: AtmosphereType;
  vi_tri?: SemanticSlot;
  huong?: 'trai' | 'phai';
  mat_do?: number;
}

export interface SemanticTerrainSegmentSpec {
  id: string;
  vi_tri?: 'sau_lung' | 'truoc_mat' | 'tu_trai' | 'giua' | 'tu_phai';
  nhan_vat?: string;
  tu?: SemanticSlot;
  den?: SemanticSlot;
  vat_do?: boolean;
}

export interface SemanticTerrainSegmentBeatAction {
  duong_mo?: boolean;
  doi_do?: boolean;
}

export interface SemanticActorSpec {
  id: string;
  vai?: SemanticActorRole;
  toc_duoi_ngua?: boolean;
  vi_tri?: SemanticSlot;
  ngoi_tren?: string; // "<id_ghe>.mat_ghe"
  ngoi_vao?: string; // "<id_ban>" — tự động kê ghế sát bàn và quay mặt nhìn ngang vào bàn
  huong?: 'trai' | 'phai';
  tu_the?: SemanticPoseName;
  nghieng?: 'nhe_truoc' | 'guc' | 'thang' | 'nga_lung';
  nhin_theo?: string; // "<id_vat_hoac_nhan_vat>"
  lop?: SemanticLayer;
  cam_chen_tra?: boolean;
  xuat_hien_tu?: string;
  roi_di_luc?: string;
}

export interface SemanticPropSpec {
  id: string;
  type: string;
  trang_thai?: string; // Ví dụ "khoa" cho vi_tien, "cam" hoặc "tua" cho hoa_don
  loai_neo?: AnchorKind;
  vi_tri?: SemanticSlot;
  dat_tren?: string; // "<id_vat_chu>.<diem_neo>"
  cam_boi?: string; // "<id_nhan_vat>" hoặc "<id_nhan_vat>.tay|dau|lung"
  lop?: SemanticLayer;
  vat_do?: boolean;
  xuat_hien_tu?: string;
}

export interface SemanticActorBeatAction {
  tu_the?: SemanticPoseName;
  di_toi?: SemanticSlot;
  di_vao?: 'trai' | 'phai' | boolean;
  di_ra?: 'trai' | 'phai' | boolean;
  huong?: 'trai' | 'phai';
  nghieng?: 'nhe_truoc' | 'guc' | 'thang' | 'nga_lung';
  nhin_theo?: string | null;
  nhin_nhau?: boolean | string;
  khung_lai?: boolean;
  lui_buoc?: boolean | 'nua_buoc' | 'mot_buoc';
  quay_dau?: boolean | 'trai' | 'phai';
  tha_roi?: boolean | string;
  cam_chen_tra?: boolean;
  dung_day?: boolean;
}

export interface SemanticPropBeatAction {
  trang_thai?: string;
  cam_boi?: string | null;
  dat_tren?: string;
  di_toi?: SemanticSlot;
  bay_len?: boolean;
  tach_doi?: boolean;
  khoi?: boolean;
  tha_roi?: boolean;
}

export interface SemanticBeatSpec {
  moc: 'bat_dau' | 'dong_1' | 'dong_2' | 'dong_3' | 'dong_4' | 'cu_lat';
  sau?: number;
  thoi_luong?: number;
  nhan_vat?: Record<string, SemanticActorBeatAction>;
  dao_cu?: Record<string, SemanticPropBeatAction>;
  doan_duong?: Record<string, SemanticTerrainSegmentBeatAction>;
}

export interface SemanticStageScript {
  semanticVersion: 1;
  sceneId: string;
  ten: string;
  mo_ta?: string;
  boi_canh?: {
    dia_hinh?: SemanticTerrainName;
    khi_quyen?: SemanticAtmosphereSpec[];
    doan_duong?: SemanticTerrainSegmentSpec[];
  };
  vat_do_tren_tay?: string; // "<actorId>.chen_tra" nếu chén trên tay Lữ khách chính là vật đỏ của cú lật
  nhan_vat: SemanticActorSpec[];
  dao_cu: SemanticPropSpec[];
  nhip: SemanticBeatSpec[];
}

export function isSemanticStageScript(input: unknown): input is SemanticStageScript {
  return Boolean(
    input &&
      typeof input === 'object' &&
      (input as Record<string, unknown>).semanticVersion === 1
  );
}

function mapSemanticLayerToStageLayer(
  lop: SemanticLayer,
  loaiNeo?: AnchorKind
): StageLayer {
  if (loaiNeo === 'troi') return 'sky';
  if (lop === 'nen') return 'far';
  if (lop === 'truoc') return 'fore';
  return 'mid';
}

function addSecToTimeExpr(baseExpr: string, deltaSec: number): string {
  const m = baseExpr.match(/^([a-z0-9_]+)([+-]\d+(?:\.\d+)?)?s?$/i);
  if (!m) return baseExpr;
  const anchor = m[1];
  const baseOffset = m[2] ? Number(m[2]) : 0;
  const total = Number((baseOffset + deltaSec).toFixed(2));
  if (Math.abs(total) < 0.005) return anchor;
  return total > 0 ? `${anchor}+${total}s` : `${anchor}${total}s`;
}

function getMocSortKey(moc: SemanticBeatSpec['moc'], sau = 0): number {
  const rank: Record<SemanticBeatSpec['moc'], number> = {
    bat_dau: 0,
    dong_1: 1,
    dong_2: 2,
    dong_3: 3,
    dong_4: 4,
    cu_lat: 5,
  };
  return (rank[moc] ?? 5) * 100 + (sau ?? 0);
}

function resolveMocToTimeExpr(moc: SemanticBeatSpec['moc'], sau = 0): string {
  const baseMap: Record<SemanticBeatSpec['moc'], string> = {
    bat_dau: 'start',
    dong_1: 'line_1',
    dong_2: 'line_2',
    dong_3: 'line_3',
    dong_4: 'line_4',
    cu_lat: 'pivot',
  };
  const base = baseMap[moc] || 'pivot';
  if (!sau) return base;
  return sau > 0 ? `${base}+${sau}s` : `${base}${sau}s`;
}

function parseCamBoiToFollow(camBoi: string): string {
  const [actorId, rawSock] = camBoi.split('.');
  const sock =
    rawSock && rawSock in SEMANTIC_SOCKETS
      ? SEMANTIC_SOCKETS[rawSock as keyof typeof SEMANTIC_SOCKETS]
      : 'hand';
  return `${actorId}:${sock}`;
}

/**
 * Ước tính diện tích đỏ (px²) của một đạo cụ chuẩn propCatalog ở tỷ lệ cảnh SAU khi đã tự căn khung (`sceneScale`).
 */
function estimateCatalogPropBaseRedPx2(
  typeName: string,
  variant: string | undefined,
  sceneScale: number
): number {
  const catDef = BUILT_IN_PROP_CATALOG[typeName];
  if (!catDef || !catDef.canBeRed) return 0;
  const dummyState = {
    id: typeName,
    type: typeName,
    variant,
    layer: 'mid' as const,
    x: 0,
    y: 0,
    scale: sceneScale,
    rotate: 0,
    opacity: 1,
    color: '#D44D33',
    isAccentActive: true,
    loopProgress: 0,
    motionActivity: 0,
    travelDist: 0,
    drawProgress: 1,
    morphProgress: 1,
    splitProgress: 0,
    floatAwayProgress: 0,
    emitters: {
      steam: 0,
      pulseRing: 0,
      spill: 0,
      glow: 0,
      color: '#D44D33',
      steamColor: '#D44D33',
    },
    spec: { id: typeName, type: typeName, variant },
  };
  return computePropRedStageArea(dummyState) * PX2_PER_STAGE_UNIT2;
}

/**
 * Tỷ lệ mục tiêu của Tự căn khung: khung bao chung của mọi nhân vật và đạo cụ chiếm ~70% chiều ngang vùng hình,
 * đồng thời giới hạn chiều cao tối đa để đỉnh đầu nhân vật/đạo cụ không bao giờ chạm mép trên vùng hình.
 */
export { AUTO_FRAME_TARGET_WIDTH_RATIO, AUTO_FRAME_MIN_TOP_MARGIN_RATIO };
// Đường đất y = 352, đỉnh vùng hình STAGE_VB_Y0 = 126, cao STAGE_VB_H = 250 -> lề trên tối thiểu 12% = 30 đơn vị -> đỉnh cao nhất y = 156 -> chiều cao tối đa từ mặt đất = 352 - 156 = 196 đơn vị
export const AUTO_FRAME_MAX_SAFE_HEIGHT_UNITS =
  352 - (STAGE_VB_Y0 + STAGE_VB_H * AUTO_FRAME_MIN_TOP_MARGIN_RATIO);
export const STAGE_CENTER_X = 270;
export const SEATED_AT_DESK_OFFSET_UNITS = 24.5;

/**
 * Biên dịch Kịch bản Ngữ nghĩa -> StageScript chuẩn cho DeclarativeStagePlayer:
 * 1. Hỗ trợ `ngoi_vao: "<id_ban>"`: tự động kê ghế sát cạnh bàn và quay mặt nhân vật nhìn ngang vào bàn.
 * 2. Tự căn khung (Auto-Framing, dùng cho mọi Chén): tính khung bao chung của mọi nhân vật và đạo cụ ở tỷ lệ cơ sở 1.0,
 *    tự phóng to đồng nhất (`sceneScale`) sao cho khung bao chiếm ~70% chiều ngang vùng hình (giới hạn trong chiều cao an toàn),
 *    căn giữa theo chiều ngang (`x = 270`), đáy cảnh đặt đúng trên đường đất (`y = 352`).
 * 3. Đo diện tích vật đỏ SAU khi đã tự căn khung.
 */
export function compileSemanticStageScript(
  sem: SemanticStageScript
): StageScript {
  const terrainName = sem.boi_canh?.dia_hinh ?? 'phang';
  const terrainType: TerrainType = SEMANTIC_TERRAINS[terrainName] ?? 'flat';

  const atmosphere: AtmosphereItem[] = (sem.boi_canh?.khi_quyen ?? []).map(
    (at, idx) => ({
      id: at.id ?? `atmo_${idx + 1}`,
      type: at.loai,
      x: at.vi_tri ? SEMANTIC_SLOTS[at.vi_tri] : undefined,
      direction:
        at.huong === 'trai'
          ? 'left'
          : at.huong === 'phai'
            ? 'right'
            : undefined,
      count: at.mat_do,
      colorRole: 'secondary',
      focusRole: 'ambient',
      opacity: 0.34,
    })
  );

  // Bước A: Đặt toạ độ tương đối ở tỷ lệ đơn vị (scale = 1.0)
  const rawPropPos = new Map<
    string,
    {
      rawX: number;
      rawY: number;
      type: string;
      lop: SemanticLayer;
      loaiNeo: AnchorKind;
      initVariant?: string;
      follow?: string;
    }
  >();

  // Lưu quan hệ ngoi_vao: nếu nhân vật có ngoi_tren="<ghe>.mat_ghe" và ngoi_vao="<ban>", ghế sẽ tự động đặt sát cạnh bàn
  const seatToDeskBinding = new Map<
    string,
    { deskId: string; facing: 'left' | 'right' }
  >();
  for (const a of sem.nhan_vat) {
    if (a.ngoi_tren && a.ngoi_vao) {
      const [seatId] = a.ngoi_tren.split('.');
      const facing = a.huong === 'trai' ? 'left' : 'right';
      if (seatId) {
        seatToDeskBinding.set(seatId, { deskId: a.ngoi_vao, facing });
      }
    }
  }

  // Tính vị trí cho các đạo cụ mặt đất/tường/trời trước (để bàn có toạ độ trước khi ghế bám theo ngoi_vao)
  for (const p of sem.dao_cu) {
    const catDef = BUILT_IN_PROP_CATALOG[p.type];
    const loaiNeo: AnchorKind =
      p.loai_neo ??
      (p.dat_tren
        ? 'tren'
        : p.cam_boi
          ? 'cam'
          : catDef?.anchorKind ?? 'dat');
    const lop: SemanticLayer = p.lop ?? catDef?.defaultLayer ?? 'giua';

    let rawX: number = p.vi_tri ? SEMANTIC_SLOTS[p.vi_tri] : 270;
    let rawY = 0;
    let follow: string | undefined;

    if (loaiNeo === 'tuong') {
      rawX = p.vi_tri ? SEMANTIC_SLOTS[p.vi_tri] : 175;
      rawY = WALL_MOUNT_Y_OFFSET;
    } else if (loaiNeo === 'troi') {
      rawX = p.vi_tri ? SEMANTIC_SLOTS[p.vi_tri] : 225;
      rawY = SKY_MOUNT_Y;
    } else if (loaiNeo === 'cam' && p.cam_boi) {
      rawX = 0;
      rawY = 0;
      follow = parseCamBoiToFollow(p.cam_boi);
    }

    let initVariant =
      p.trang_thai && p.trang_thai !== 'mac_dinh' ? p.trang_thai : undefined;
    if (!initVariant && loaiNeo === 'cam' && catDef?.variants?.cam) {
      initVariant = 'cam';
    } else if (
      !initVariant &&
      (loaiNeo === 'tren' || loaiNeo === 'dat') &&
      catDef?.variants?.tua
    ) {
      initVariant = 'tua';
    }

    rawPropPos.set(p.id, {
      rawX,
      rawY,
      type: p.type,
      lop,
      loaiNeo,
      initVariant,
      follow,
    });
  }

  // Áp dụng ngoi_vao: đặt ghế sát cạnh bàn
  for (const [seatId, binding] of seatToDeskBinding.entries()) {
    const seatEntry = rawPropPos.get(seatId);
    const deskEntry = rawPropPos.get(binding.deskId);
    if (seatEntry && deskEntry) {
      const sign = binding.facing === 'right' ? -1 : 1;
      seatEntry.rawX = deskEntry.rawX + sign * SEATED_AT_DESK_OFFSET_UNITS;
    }
  }

  // Tính vị trí cho các đạo cụ đặt trên vật khác (loai_neo === 'tren') ở tỷ lệ đơn vị 1.0
  for (const p of sem.dao_cu) {
    const entry = rawPropPos.get(p.id);
    if (!entry) continue;
    if (entry.loaiNeo === 'tren' && p.dat_tren) {
      const [hostId, anchorName] = p.dat_tren.split('.');
      const host = rawPropPos.get(hostId);
      const hostDef = host ? BUILT_IN_PROP_CATALOG[host.type] : undefined;
      const anc = anchorName ? hostDef?.anchors?.[anchorName] : undefined;
      if (host && anc) {
        entry.rawX = host.rawX + anc[0];
        entry.rawY = host.rawY + anc[1];
      }
    }
  }

  // Tính vị trí nhân vật ở tỷ lệ đơn vị 1.0
  const rawActorPos = new Map<
    string,
    { rawX: number; facing: 'left' | 'right'; isSeated: boolean }
  >();
  for (const a of sem.nhan_vat) {
    const isSeated = Boolean(a.ngoi_tren);
    let rawX = a.vi_tri ? SEMANTIC_SLOTS[a.vi_tri] : 225;
    let facing: 'left' | 'right' = a.huong === 'trai' ? 'left' : 'right';

    if (a.ngoi_tren) {
      const [seatId, ancName] = a.ngoi_tren.split('.');
      const seat = rawPropPos.get(seatId);
      const seatDef = seat ? BUILT_IN_PROP_CATALOG[seat.type] : undefined;
      const anc = ancName ? seatDef?.anchors?.[ancName] : undefined;
      if (seat && anc) {
        rawX = seat.rawX + anc[0];
      }
      if (a.ngoi_vao) {
        const desk = rawPropPos.get(a.ngoi_vao);
        if (desk && seat) {
          facing = desk.rawX >= seat.rawX ? 'right' : 'left';
        }
      }
    }
    rawActorPos.set(a.id, { rawX, facing, isSeated });
  }

  // Bước B: Tính khung bao chung (Combined Bounding Box) CHỈ tính NHÂN VẬT + ĐẠO CỤ + VẬT ĐỎ
  // (không tính địa hình, đường, khí quyển, mây trời phụ; địa hình luôn kéo dài ra mép khung).
  let rawMinX = Infinity;
  let rawMaxX = -Infinity;
  let rawMinY = 0; // Đỉnh cao nhất so với mặt đất (số âm)

  const expandRawBounds = (x0: number, y0: number, x1: number) => {
    if (x0 < rawMinX) rawMinX = x0;
    if (x1 > rawMaxX) rawMaxX = x1;
    if (y0 < rawMinY) rawMinY = y0;
  };

  for (const p of sem.dao_cu) {
    const entry = rawPropPos.get(p.id);
    if (!entry || entry.loaiNeo === 'cam') continue;
    // Bỏ qua vật trang trí nền trời (mây, trăng, mặt trời) trừ khi chính nó là vật đỏ
    if (entry.loaiNeo === 'troi' && !p.vat_do) continue;
    const catDef = BUILT_IN_PROP_CATALOG[p.type];
    const vDef =
      entry.initVariant && catDef?.variants
        ? catDef.variants[entry.initVariant]
        : undefined;
    const box = vDef?.box ?? catDef?.box ?? [-8, -12, 8, 0];
    if (entry.loaiNeo === 'troi') {
      expandRawBounds(entry.rawX + box[0], -64, entry.rawX + box[2]);
    } else {
      expandRawBounds(
        entry.rawX + box[0],
        entry.rawY + box[1],
        entry.rawX + box[2]
      );
    }
  }

  for (const a of sem.nhan_vat) {
    const aInfo = rawActorPos.get(a.id);
    if (!aInfo) continue;
    const topY = aInfo.isSeated ? -47.5 : -50.0;
    const leftExt = aInfo.facing === 'right' ? -10.0 : -12.5;
    const rightExt = aInfo.facing === 'right' ? 12.5 : 10.0;
    expandRawBounds(aInfo.rawX + leftExt, topY, aInfo.rawX + rightExt);

    for (const beat of sem.nhip) {
      const act = beat.nhan_vat?.[a.id];
      if (act?.di_toi && act.di_toi in SEMANTIC_SLOTS) {
        const targetRawX = SEMANTIC_SLOTS[act.di_toi];
        expandRawBounds(targetRawX + leftExt, -50.0, targetRawX + rightExt);
      }
    }
  }

  if (!Number.isFinite(rawMinX) || !Number.isFinite(rawMaxX)) {
    rawMinX = 210;
    rawMaxX = 330;
    rawMinY = -48;
  }

  const rawSpanW = Math.max(24, rawMaxX - rawMinX);
  const rawSpanH = Math.max(24, Math.abs(rawMinY));
  const rawCenterX = (rawMinX + rawMaxX) * 0.5;

  // Ràng buộc: Lữ khách cao tối thiểu 30% chiều cao vùng hình (50 * scale >= 0.30 * STAGE_VB_H),
  // đồng thời giữ nguyên lề trên tối thiểu 12% chiều cao vùng hình (AUTO_FRAME_MAX_SAFE_HEIGHT_UNITS).
  const targetWidthUnits = STAGE_VB_W * AUTO_FRAME_TARGET_WIDTH_RATIO;
  const scaleByWidth = targetWidthUnits / rawSpanW;
  const scaleByHeight = AUTO_FRAME_MAX_SAFE_HEIGHT_UNITS / rawSpanH;
  const heroBaseHeight = sem.nhan_vat.some((a) => !a.ngoi_tren) ? 50 : 47.5;
  const minHeroScale =
    sem.nhan_vat.length > 0
      ? (STAGE_VB_H * AUTO_FRAME_MIN_TRAVELER_HEIGHT_RATIO) / heroBaseHeight
      : DEFAULT_SCENE_SCALE;
  const autoScale = Number(
    Math.min(
      scaleByHeight,
      4.65,
      Math.max(DEFAULT_SCENE_SCALE, minHeroScale, scaleByWidth)
    ).toFixed(3)
  );

  // Giữ vị trí ngang nằm trong vùng an toàn [84..456] kể cả khi tỷ lệ nhân vật được nâng lên mức tối thiểu
  const maxSafeSpanScale = (STAGE_VB_W - 44) / rawSpanW;
  const spreadScale = Math.min(autoScale, maxSafeSpanScale);

  const transformX = (rx: number) =>
    Number((STAGE_CENTER_X + (rx - rawCenterX) * spreadScale).toFixed(2));

  // Bước C: Áp dụng autoScale và căn giữa (STAGE_CENTER_X = 270) cho mọi đạo cụ & nhân vật
  const propWorldPos = new Map<
    string,
    { x: number; y: number; scale: number; type: string; lop: SemanticLayer }
  >();

  const compiledProps: PropSpec[] = sem.dao_cu.map((p) => {
    const entry = rawPropPos.get(p.id)!;
    let x = 0;
    let y = 0;

    if (entry.loaiNeo === 'cam') {
      x = 0;
      y = 0;
    } else if (entry.loaiNeo === 'troi') {
      x = transformX(entry.rawX);
      y = SKY_MOUNT_Y;
    } else if (entry.loaiNeo === 'tren' && p.dat_tren) {
      const [hostId, anchorName] = p.dat_tren.split('.');
      const host = propWorldPos.get(hostId);
      const hostDef = host ? BUILT_IN_PROP_CATALOG[host.type] : undefined;
      const anc = anchorName ? hostDef?.anchors?.[anchorName] : undefined;
      if (host && anc) {
        x = Number((host.x + anc[0] * host.scale).toFixed(2));
        y = Number((host.y + anc[1] * host.scale).toFixed(2));
      }
    } else {
      const seatBind = seatToDeskBinding.get(p.id);
      const deskEntry = seatBind ? rawPropPos.get(seatBind.deskId) : undefined;
      if (seatBind && deskEntry) {
        const sign = seatBind.facing === 'right' ? -1 : 1;
        x = Number(
          (
            transformX(deskEntry.rawX) +
            sign * SEATED_AT_DESK_OFFSET_UNITS * autoScale
          ).toFixed(2)
        );
      } else {
        x = transformX(entry.rawX);
      }
      y = Number((entry.rawY * autoScale).toFixed(2));
    }

    propWorldPos.set(p.id, {
      x,
      y,
      scale: autoScale,
      type: p.type,
      lop: entry.lop,
    });

    return {
      id: p.id,
      type: p.type,
      variant: entry.initVariant,
      x,
      y,
      follow: entry.follow,
      layer: mapSemanticLayerToStageLayer(entry.lop, entry.loaiNeo),
      semanticLayer: entry.lop,
      anchorKind: entry.loaiNeo,
      placedOn: p.dat_tren,
      scale: autoScale,
      colorRole: entry.lop === 'nen' && !p.vat_do ? 'secondary' : 'ink',
      focusRole: p.vat_do ? 'hero' : entry.lop === 'nen' ? 'ambient' : 'support',
      idle: entry.loaiNeo === 'troi' ? 'float' : 'none',
      enterAt: p.xuat_hien_tu,
    };
  });

  const sortedBeats = [...sem.nhip].sort(
    (a, b) => getMocSortKey(a.moc, a.sau) - getMocSortKey(b.moc, b.sau)
  );

  const actorHomeX = new Map<string, number>();
  const compiledActors: ActorSpec[] = sem.nhan_vat.map((a) => {
    const lop: SemanticLayer = a.lop ?? 'giua';
    const role: SemanticActorRole = a.vai === 'nguoi_b' ? 'nguoi_b' : 'lu_khach';
    const aInfo = rawActorPos.get(a.id)!;
    let homeX = transformX(aInfo.rawX);

    if (a.ngoi_tren) {
      const [seatId, ancName] = a.ngoi_tren.split('.');
      const seat = propWorldPos.get(seatId);
      const seatDef = seat ? BUILT_IN_PROP_CATALOG[seat.type] : undefined;
      const anc = ancName ? seatDef?.anchors?.[ancName] : undefined;
      if (seat && anc) {
        homeX = Number((seat.x + anc[0] * seat.scale).toFixed(2));
      }
    }
    actorHomeX.set(a.id, homeX);

    const actorScale =
      role === 'nguoi_b' ? Number((autoScale * 0.94).toFixed(3)) : autoScale;
    const edgePad = Math.ceil(13 * actorScale) + 2;
    const leftEdgeX = Number(Math.max(82, 74 + edgePad).toFixed(2));
    const rightEdgeX = Number(Math.min(458, 466 - edgePad).toFixed(2));

    let initX = homeX;
    let initFacing = aInfo.facing;
    let initEnterAt = a.xuat_hien_tu;
    let initLeaveAt = a.roi_di_luc;
    let needsEdgeFade = false;

    const firstDiVaoBeat = sortedBeats.find(
      (b) => b.nhan_vat?.[a.id]?.di_vao !== undefined
    );
    if (firstDiVaoBeat) {
      const act = firstDiVaoBeat.nhan_vat![a.id]!;
      const side =
        act.di_vao === 'trai' || act.di_vao === 'phai'
          ? act.di_vao
          : homeX >= STAGE_CENTER_X
            ? 'phai'
            : 'trai';
      initX = side === 'phai' ? rightEdgeX : leftEdgeX;
      initFacing = side === 'phai' ? 'left' : 'right';
      if (!initEnterAt) {
        initEnterAt = resolveMocToTimeExpr(firstDiVaoBeat.moc, firstDiVaoBeat.sau ?? 0);
      }
      needsEdgeFade = true;
    }

    const firstDiRaBeat = sortedBeats.find(
      (b) => b.nhan_vat?.[a.id]?.di_ra !== undefined
    );
    if (firstDiRaBeat && !initLeaveAt) {
      const dur = firstDiRaBeat.thoi_luong ?? 1.2;
      const atExpr = resolveMocToTimeExpr(firstDiRaBeat.moc, firstDiRaBeat.sau ?? 0);
      initLeaveAt = addSecToTimeExpr(atExpr, Math.max(0.25, dur - 0.35));
      needsEdgeFade = true;
    }

    const poseName: SemanticPoseName =
      a.tu_the ?? (aInfo.isSeated ? 'ngoi_tua' : 'dung');
    const pose: StageTravelerPose = SEMANTIC_POSES[poseName] ?? 'stand';
    const isHandCupTwist = sem.vat_do_tren_tay === `${a.id}.chen_tra`;
    const initLeanDeg =
      a.nghieng === 'guc'
        ? 22
        : a.nghieng === 'nhe_truoc'
          ? 11
          : a.nghieng === 'thang'
            ? 0
            : a.nghieng === 'nga_lung'
              ? -3
              : aInfo.isSeated
                ? 2
                : 0;

    return {
      id: a.id,
      rig: 'human',
      x: initX,
      yOffset: 0,
      scale: actorScale,
      facing: initFacing,
      pose,
      leanDeg: initLeanDeg,
      sitProgress: aInfo.isSeated ? 1 : 0,
      colorRole: role === 'nguoi_b' ? 'secondary' : 'ink',
      focusRole: 'hero',
      role,
      ponytail: Boolean(a.toc_duoi_ngua),
      showTeaCup: a.cam_chen_tra ? 1 : 0,
      teaCupRed: isHandCupTwist,
      seatedOn: a.ngoi_tren,
      seatedAtDesk: a.ngoi_vao,
      lookAtTarget: a.nhin_theo,
      semanticLayer: lop,
      layer: mapSemanticLayerToStageLayer(lop),
      enterAt: initEnterAt,
      leaveAt: initLeaveAt,
      fadeDuration: needsEdgeFade ? 0.42 : undefined,
    };
  });

  const timeline: TimelineCue[] = [];

  if (sem.vat_do_tren_tay) {
    const [cupActorId] = sem.vat_do_tren_tay.split('.');
    const cupActor = compiledActors.find((a) => a.id === cupActorId);
    const cupScale = cupActor?.scale ?? autoScale;
    const cupPx2 = 7 * 5 * 0.88 * cupScale * cupScale * PX2_PER_STAGE_UNIT2;
    if (cupPx2 < MIN_RED_AREA_PX2) {
      const focusX = actorHomeX.get(cupActorId) ?? STAGE_CENTER_X;
      const panX = Number(
        Math.max(-42, Math.min(42, (focusX - STAGE_CENTER_X) * 0.28)).toFixed(2)
      );
      timeline.push({
        at: 'pivot',
        duration: 1.1,
        exactDuration: true,
        target: 'camera',
        zoom: PIVOT_CAMERA_PUSH_IN_ZOOM,
        panX,
        panY: 0,
      });
    }
  }

  // Tự động kích hoạt vật đỏ tại cú lật & đo diện tích đỏ SAU khi đã tự căn khung (autoScale)
  for (const p of sem.dao_cu) {
    if (p.vat_do) {
      const catDef = BUILT_IN_PROP_CATALOG[p.type];
      const entry = rawPropPos.get(p.id);
      const activeVarName = entry?.initVariant;
      const activeVar =
        activeVarName && catDef?.variants
          ? catDef.variants[activeVarName]
          : undefined;
      const hasAlt = Boolean(
        (activeVar?.altShapes && activeVar.altShapes.length > 0) ||
          (catDef?.altShapes && catDef.altShapes.length > 0)
      );
      // Cú lật chỉ có vật đổi đỏ, tắt hoàn toàn vòng tròn mờ (pulseRing / glow) cho mọi Chén mới
      timeline.push({
        at: 'pivot+0.4s',
        duration: 0.16,
        exactDuration: true,
        target: p.id,
        colorRole: 'accent',
        morphProgress: hasAlt ? 1 : undefined,
      });

      // Đo diện tích vật đỏ SAU khi đã căn khung (autoScale)
      const framedRedPx2 = estimateCatalogPropBaseRedPx2(
        p.type,
        activeVarName,
        autoScale
      );
      const posInfo = propWorldPos.get(p.id);
      if (framedRedPx2 < MIN_RED_AREA_PX2) {
        const pushZoom = PIVOT_CAMERA_PUSH_IN_ZOOM; // 1.14 (+14% push-in)
        const afterPushPx2 = framedRedPx2 * pushZoom * pushZoom;
        const focusX = posInfo && posInfo.x > 0 ? posInfo.x : STAGE_CENTER_X;
        const panX = Number(
          Math.max(-42, Math.min(42, (focusX - STAGE_CENTER_X) * 0.28)).toFixed(
            2
          )
        );
        timeline.push({
          at: 'pivot',
          duration: 1.1,
          exactDuration: true,
          target: 'camera',
          zoom: pushZoom,
          panX,
          panY: 0,
        });

        const allowsHand = (
          catDef?.allowedAnchorKinds ?? [catDef?.anchorKind ?? 'dat']
        ).includes('cam');
        const alreadyHandledInBeats = sem.nhip.some(
          (b) => b.dao_cu && b.dao_cu[p.id]?.cam_boi !== undefined
        );
        if (
          afterPushPx2 < MIN_RED_AREA_PX2 &&
          allowsHand &&
          !p.cam_boi &&
          !alreadyHandledInBeats &&
          compiledActors.length > 0
        ) {
          const heroId = compiledActors[0].id;
          timeline.push({
            at: 'pivot',
            duration: 0.8,
            exactDuration: true,
            target: p.id,
            follow: `${heroId}:hand`,
            x: 0,
            y: 0,
            variant: catDef?.variants?.cam ? 'cam' : activeVarName,
          });
        }
      }
    }
  }

  interface LiveActorTracker {
    id: string;
    initHomeX: number;
    x: number;
    minBackX: number;
    maxForwardX: number;
    pivotX: number;
    postLuiX?: number;
    pivotFacing: 'left' | 'right';
    facing: 'left' | 'right';
    scale: number;
    leanDeg: number;
    lookAtTarget: string | null;
    leftEdgeX: number;
    rightEdgeX: number;
    heldProps: Set<string>;
  }

  const liveActors = new Map<string, LiveActorTracker>();
  for (const ca of compiledActors) {
    const scale = ca.scale ?? autoScale;
    const edgePad = Math.ceil(13 * scale) + 2;
    const initHomeX = actorHomeX.get(ca.id) ?? Number(ca.x ?? 270);
    const heldProps = new Set<string>();
    for (const p of sem.dao_cu) {
      if (p.cam_boi && p.cam_boi.startsWith(`${ca.id}.`)) {
        heldProps.add(p.id);
      }
    }
    liveActors.set(ca.id, {
      id: ca.id,
      initHomeX,
      x: Number(ca.x ?? 270),
      minBackX: initHomeX,
      maxForwardX: initHomeX,
      pivotX: initHomeX,
      pivotFacing: ca.facing ?? 'right',
      facing: ca.facing ?? 'right',
      scale,
      leanDeg: ca.leanDeg ?? 0,
      lookAtTarget: ca.lookAtTarget ?? null,
      leftEdgeX: Number(Math.max(82, 74 + edgePad).toFixed(2)),
      rightEdgeX: Number(Math.min(458, 466 - edgePad).toFixed(2)),
      heldProps,
    });
  }

  for (const beat of sortedBeats) {
    const atExpr = resolveMocToTimeExpr(beat.moc, beat.sau ?? 0);
    const dur = beat.thoi_luong ?? 1.1;
    const isPivotOrBefore =
      beat.moc !== 'cu_lat' || (beat.sau ?? 0) <= 0.15;

    // 1. Cập nhật quyền cầm đạo cụ trong nhịp
    for (const [propId, pact] of Object.entries(beat.dao_cu ?? {})) {
      if (pact.cam_boi === null || pact.tha_roi) {
        liveActors.forEach((st) => st.heldProps.delete(propId));
      } else if (pact.cam_boi) {
        const [holderId] = pact.cam_boi.split('.');
        liveActors.forEach((st) => st.heldProps.delete(propId));
        liveActors.get(holderId)?.heldProps.add(propId);
      }
    }

    // 2. Tính chuyển động vị trí trước (để nhin_nhau / quay_dau biết toạ độ mới trong cùng nhịp)
    const pendingActorCues = new Map<string, TimelineCue>();
    const actorBeatActions = Object.entries(beat.nhan_vat ?? {});

    for (const [actorId, act] of actorBeatActions) {
      const st = liveActors.get(actorId);
      const cue: TimelineCue = {
        at: atExpr,
        duration: dur,
        exactDuration: true,
        target: actorId,
      };
      if (act.tu_the) {
        cue.pose = SEMANTIC_POSES[act.tu_the];
        if (act.tu_the === 'ngoi_tua') {
          cue.sitProgress = 1;
        }
      }
      if (act.dung_day || (act.tu_the && act.tu_the !== 'ngoi_tua' && act.di_toi)) {
        cue.sitProgress = 0;
      }

      if (st) {
        if (act.di_vao !== undefined) {
          const destX = act.di_toi
            ? transformX(SEMANTIC_SLOTS[act.di_toi])
            : st.initHomeX;
          cue.toX = destX;
          if (!act.huong) {
            const moveDir = destX >= st.x ? 'right' : 'left';
            cue.facing = moveDir;
            st.facing = moveDir;
          }
          st.x = destX;
        } else if (act.di_toi) {
          const destX = transformX(SEMANTIC_SLOTS[act.di_toi]);
          cue.toX = destX;
          if (!act.huong && Math.abs(destX - st.x) > 2) {
            const moveDir = destX >= st.x ? 'right' : 'left';
            cue.facing = moveDir;
            st.facing = moveDir;
          }
          st.x = destX;
        } else if (act.di_ra !== undefined) {
          const side =
            act.di_ra === 'trai' || act.di_ra === 'phai'
              ? act.di_ra
              : st.x >= STAGE_CENTER_X
                ? 'phai'
                : 'trai';
          const destX = side === 'trai' ? st.leftEdgeX : st.rightEdgeX;
          cue.toX = destX;
          const moveDir = side === 'trai' ? 'left' : 'right';
          cue.facing = moveDir;
          st.facing = moveDir;
          st.x = destX;
        }

        if (act.lui_buoc) {
          const stepUnits = act.lui_buoc === 'mot_buoc' ? 20 : 12;
          const dirSign = st.facing === 'right' ? 1 : -1;
          const backX = Number(
            Math.max(
              st.leftEdgeX,
              Math.min(st.rightEdgeX, st.x - dirSign * stepUnits * st.scale)
            ).toFixed(2)
          );
          cue.toX = backX;
          st.x = backX;
          st.postLuiX = backX;
        }

        st.minBackX = Math.min(st.minBackX, st.x);
        st.maxForwardX = Math.max(st.maxForwardX, st.x);
        if (isPivotOrBefore) {
          st.pivotX = st.x;
          st.pivotFacing = st.facing;
        }
      } else if (act.di_toi) {
        cue.toX = transformX(SEMANTIC_SLOTS[act.di_toi]);
      }

      if (act.huong) {
        cue.facing = act.huong === 'trai' ? 'left' : 'right';
        if (st) st.facing = cue.facing;
      }

      const targetLean =
        act.nghieng === 'guc'
          ? 22
          : act.nghieng === 'nhe_truoc'
            ? 11
            : act.nghieng === 'thang'
              ? 0
              : act.nghieng === 'nga_lung'
                ? -3
                : undefined;

      if (act.khung_lai) {
        const settleLean = targetLean ?? st?.leanDeg ?? 0;
        cue.leanDeg = -6;
        cue.duration = 0.16;
        if (!cue.pose) cue.pose = 'stand';
        timeline.push({
          at: addSecToTimeExpr(atExpr, 0.16),
          duration: Math.max(0.24, Math.min(0.42, dur - 0.16)),
          exactDuration: true,
          target: actorId,
          leanDeg: settleLean,
          pose: 'stand',
        });
        if (st) st.leanDeg = settleLean;
      } else if (targetLean !== undefined) {
        cue.leanDeg = targetLean;
        if (st) st.leanDeg = targetLean;
      }

      if (act.nhin_theo !== undefined) {
        cue.lookAtTarget = act.nhin_theo;
        if (st) st.lookAtTarget = act.nhin_theo;
      }
      if (act.cam_chen_tra !== undefined) {
        cue.showTeaCup = act.cam_chen_tra ? 1 : 0;
      }

      pendingActorCues.set(actorId, cue);
    }

    // 3. Xử lý nhin_nhau, quay_dau, tha_roi sau khi đã cập nhật vị trí mọi nhân vật
    for (const [actorId, act] of actorBeatActions) {
      const st = liveActors.get(actorId);
      const cue = pendingActorCues.get(actorId)!;
      if (!st) {
        timeline.push(cue);
        continue;
      }

      if (act.nhin_nhau !== undefined && act.nhin_nhau !== false) {
        const partnerId =
          typeof act.nhin_nhau === 'string'
            ? act.nhin_nhau
            : compiledActors.find((x) => x.id !== actorId)?.id;
        const partnerSt = partnerId ? liveActors.get(partnerId) : undefined;
        if (partnerId && partnerSt) {
          const myFacing: 'left' | 'right' =
            partnerSt.x >= st.x ? 'right' : 'left';
          const partnerFacing: 'left' | 'right' =
            st.x >= partnerSt.x ? 'right' : 'left';
          if (!act.huong) {
            cue.facing = myFacing;
            st.facing = myFacing;
          }
          if (act.nhin_theo === undefined) {
            cue.lookAtTarget = partnerId;
            st.lookAtTarget = partnerId;
          }
          if (isPivotOrBefore) {
            st.pivotFacing = st.facing;
          }

          const partnerAct = beat.nhan_vat?.[partnerId];
          const partnerCue = pendingActorCues.get(partnerId);
          if (partnerCue) {
            if (!partnerAct?.huong && !partnerAct?.quay_dau) {
              partnerCue.facing = partnerFacing;
              partnerSt.facing = partnerFacing;
            }
            if (partnerAct?.nhin_theo === undefined) {
              partnerCue.lookAtTarget = actorId;
              partnerSt.lookAtTarget = actorId;
            }
          } else {
            partnerSt.facing = partnerFacing;
            partnerSt.lookAtTarget = actorId;
            timeline.push({
              at: atExpr,
              duration: dur,
              exactDuration: true,
              target: partnerId,
              facing: partnerFacing,
              lookAtTarget: actorId,
            });
          }
          if (isPivotOrBefore) {
            partnerSt.pivotFacing = partnerSt.facing;
          }
        }
      }

      if (act.quay_dau) {
        const returnFacing = st.facing;
        const backFacing: 'left' | 'right' =
          act.quay_dau === 'trai'
            ? 'left'
            : act.quay_dau === 'phai'
              ? 'right'
              : returnFacing === 'right'
                ? 'left'
                : 'right';
        const turnDelay = act.lui_buoc ? Math.min(0.26, dur * 0.28) : 0;
        const turnAt = turnDelay > 0 ? addSecToTimeExpr(atExpr, turnDelay) : atExpr;
        const glanceHold = Math.max(0.75, Math.min(1.45, dur * 0.66));
        const returnAt = addSecToTimeExpr(turnAt, glanceHold);

        if (turnDelay === 0) {
          cue.facing = backFacing;
          cue.lookAtTarget = null;
          cue.leanDeg = 7;
          cue.duration = 0.28;
        } else {
          timeline.push({
            at: turnAt,
            duration: 0.25,
            exactDuration: true,
            target: actorId,
            facing: backFacing,
            lookAtTarget: null,
            leanDeg: 7,
          });
        }
        timeline.push({
          at: returnAt,
          duration: 0.28,
          exactDuration: true,
          target: actorId,
          facing: returnFacing,
          lookAtTarget: st.lookAtTarget,
          leanDeg: st.leanDeg,
        });
      }

      if (act.tha_roi) {
        const dropPropId =
          typeof act.tha_roi === 'string'
            ? act.tha_roi
            : Array.from(st.heldProps)[0];
        if (dropPropId) {
          st.heldProps.delete(dropPropId);
          const dirSign = st.facing === 'right' ? 1 : -1;
          const dropX = Number(
            Math.max(84, Math.min(456, st.x + dirSign * Math.max(20 * st.scale, 26))).toFixed(2)
          );
          timeline.push({
            at: atExpr,
            duration: Math.min(dur, 0.52),
            exactDuration: true,
            target: dropPropId,
            follow: null,
            toX: dropX,
            toY: 0,
            dropGravity: true,
            variant: '',
          });
        }
      }

      timeline.push(cue);
    }

    for (const [propId, pact] of Object.entries(beat.dao_cu ?? {})) {
      const pSpec = sem.dao_cu.find((x) => x.id === propId);
      const catDef = pSpec ? BUILT_IN_PROP_CATALOG[pSpec.type] : undefined;
      const cue: TimelineCue = {
        at: atExpr,
        duration: dur,
        exactDuration: true,
        target: propId,
      };
      if (pact.trang_thai !== undefined) {
        cue.variant = pact.trang_thai === 'mac_dinh' ? '' : pact.trang_thai;
      }
      if (pact.cam_boi !== undefined) {
        if (pact.cam_boi === null) {
          cue.follow = null;
          if (catDef?.variants?.cam && pact.trang_thai === undefined) {
            cue.variant = '';
          }
        } else {
          cue.follow = parseCamBoiToFollow(pact.cam_boi);
          cue.x = 0;
          cue.y = 0;
          if (catDef?.variants?.cam && pact.trang_thai === undefined) {
            cue.variant = 'cam';
          }
        }
      }
      if (pact.tha_roi) {
        const holderEntry = Array.from(liveActors.values()).find((st) =>
          st.heldProps.has(propId)
        );
        const dirSign = holderEntry?.facing === 'left' ? -1 : 1;
        const baseX = holderEntry?.x ?? propWorldPos.get(propId)?.x ?? 270;
        const sc = holderEntry?.scale ?? autoScale;
        cue.follow = null;
        cue.toX = Number(Math.max(84, Math.min(456, baseX + dirSign * Math.max(20 * sc, 26))).toFixed(2));
        cue.toY = 0;
        cue.dropGravity = true;
        cue.duration = Math.min(dur, 0.52);
        if (catDef?.variants?.cam && pact.trang_thai === undefined) {
          cue.variant = '';
        }
      }
      if (pact.dat_tren) {
        const [hostId, anchorName] = pact.dat_tren.split('.');
        const host = propWorldPos.get(hostId);
        const hostDef = host ? BUILT_IN_PROP_CATALOG[host.type] : undefined;
        const anc = anchorName ? hostDef?.anchors?.[anchorName] : undefined;
        if (host && anc) {
          cue.follow = null;
          cue.toX = Number((host.x + anc[0] * host.scale).toFixed(2));
          cue.toY = Number((host.y + anc[1] * host.scale).toFixed(2));
          if (catDef?.variants?.cam && pact.trang_thai === undefined) {
            cue.variant = '';
          }
        }
      }
      if (pact.di_toi) {
        cue.toX = transformX(SEMANTIC_SLOTS[pact.di_toi]);
      }
      if (pact.bay_len) {
        cue.floatAwayProgress = 1;
      }
      if (pact.tach_doi) {
        cue.splitProgress = 1;
      }
      if (pact.khoi !== undefined) {
        cue.emitters = { ...(cue.emitters ?? {}), steam: pact.khoi ? 0.8 : 0 };
      }
      timeline.push(cue);
    }

    for (const [segId, sact] of Object.entries(beat.doan_duong ?? {})) {
      if (sact.doi_do) {
        timeline.push({
          at: atExpr,
          duration: Math.min(dur, 0.28),
          exactDuration: true,
          target: segId,
          colorRole: 'accent',
          strokeWidth: 3.2,
          opacity: 1,
        });
      }
      if (sact.duong_mo) {
        timeline.push({
          at: atExpr,
          duration: Math.max(0.8, dur),
          exactDuration: true,
          target: segId,
          opacity: 0,
        });
      }
    }
  }

  const compiledTerrainSegments: TerrainSegmentSpec[] = (
    sem.boi_canh?.doan_duong ?? []
  ).map((seg) => {
    let segStartX = 96;
    let segEndX = 240;

    if (seg.tu && seg.den) {
      segStartX = transformX(SEMANTIC_SLOTS[seg.tu]);
      segEndX = transformX(SEMANTIC_SLOTS[seg.den]);
    } else if (seg.nhan_vat) {
      const st = liveActors.get(seg.nhan_vat);
      if (st) {
        const anchorX =
          st.pivotFacing === 'right'
            ? Math.min(st.pivotX, st.postLuiX ?? st.pivotX)
            : Math.max(st.pivotX, st.postLuiX ?? st.pivotX);
        const dirSign = st.pivotFacing === 'right' ? 1 : -1;
        if (seg.vi_tri === 'truoc_mat') {
          segStartX = anchorX + dirSign * 10;
          segEndX = anchorX + dirSign * 130;
        } else {
          // Đoạn đường phía sau lưng nhân vật dọc quãng đường đã bước
          if (dirSign >= 0) {
            segEndX = Math.max(106, anchorX - 7);
            segStartX = Math.max(84, Math.min(st.initHomeX - 24, segEndX - 118));
          } else {
            segEndX = Math.min(434, anchorX + 7);
            segStartX = Math.min(456, Math.max(st.initHomeX + 24, segEndX + 118));
          }
        }
      }
    } else if (seg.vi_tri === 'giua') {
      segStartX = 200;
      segEndX = 340;
    } else if (seg.vi_tri === 'tu_phai') {
      segStartX = 285;
      segEndX = 435;
    } else {
      segStartX = 105;
      segEndX = 245;
    }

    const s0 = Number(Math.max(76, Math.min(segStartX, segEndX)).toFixed(2));
    const s1 = Number(Math.min(464, Math.max(segStartX, segEndX)).toFixed(2));

    if (seg.vat_do) {
      timeline.push({
        at: 'pivot+0.25s',
        duration: 0.22,
        exactDuration: true,
        target: seg.id,
        colorRole: 'accent',
        strokeWidth: 3.2,
        opacity: 1,
      });
    }

    return {
      id: seg.id,
      startX: s0,
      endX: s1,
      colorRole: 'ink',
      strokeWidth: 1.35,
      opacity: 0.9,
    };
  });

  return {
    sceneId: sem.sceneId,
    name: sem.ten,
    description: sem.mo_ta,
    legacy: false,
    strictValidation: true,
    tags: ['semantic_v1'],
    camera: {
      zoom: 1,
      panX: 0,
      panY: 0,
    },
    terrain: {
      type: terrainType,
      y: 352,
      startX: 74,
      endX: 466,
      segments: compiledTerrainSegments.length > 0 ? compiledTerrainSegments : undefined,
    },
    atmosphere,
    actors: compiledActors,
    props: compiledProps,
    timeline,
  };
}
