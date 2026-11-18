import { BUILT_IN_PROP_CATALOG } from './propCatalog';
import {
  AnchorKind,
  AUTO_FRAME_MIN_TOP_MARGIN_RATIO,
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

export const SEMANTIC_ACTOR_BEAT_VERBS = [
  'tu_the',
  'di_toi',
  'huong',
  'nghieng',
  'nhin_theo',
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
] as const;

export interface SemanticAtmosphereSpec {
  id?: string;
  loai: AtmosphereType;
  vi_tri?: SemanticSlot;
  huong?: 'trai' | 'phai';
  mat_do?: number;
}

export interface SemanticActorSpec {
  id: string;
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
  huong?: 'trai' | 'phai';
  nghieng?: 'nhe_truoc' | 'guc' | 'thang' | 'nga_lung';
  nhin_theo?: string | null;
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
}

export interface SemanticBeatSpec {
  moc: 'bat_dau' | 'dong_1' | 'dong_2' | 'dong_3' | 'dong_4' | 'cu_lat';
  sau?: number;
  thoi_luong?: number;
  nhan_vat?: Record<string, SemanticActorBeatAction>;
  dao_cu?: Record<string, SemanticPropBeatAction>;
}

export interface SemanticStageScript {
  semanticVersion: 1;
  sceneId: string;
  ten: string;
  mo_ta?: string;
  boi_canh?: {
    dia_hinh?: SemanticTerrainName;
    khi_quyen?: SemanticAtmosphereSpec[];
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

  // Bước B: Tính khung bao chung (Combined Bounding Box) của toàn bộ nhân vật & đạo cụ ở tỷ lệ đơn vị 1.0
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

  // Phóng to sao cho khung bao chung chiếm ~70% chiều ngang vùng hình (STAGE_VB_W * 0.70),
  // đồng thời giới hạn bởi chiều cao an toàn (AUTO_FRAME_MAX_SAFE_HEIGHT_UNITS = 212) để không cắt đầu nhân vật.
  const targetWidthUnits = STAGE_VB_W * AUTO_FRAME_TARGET_WIDTH_RATIO;
  const scaleByWidth = targetWidthUnits / rawSpanW;
  const scaleByHeight = AUTO_FRAME_MAX_SAFE_HEIGHT_UNITS / rawSpanH;
  const autoScale = Number(
    Math.max(
      DEFAULT_SCENE_SCALE,
      Math.min(scaleByWidth, scaleByHeight, 4.65)
    ).toFixed(3)
  );

  const transformX = (rx: number) =>
    Number((STAGE_CENTER_X + (rx - rawCenterX) * autoScale).toFixed(2));

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
      x = transformX(entry.rawX);
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

  const compiledActors: ActorSpec[] = sem.nhan_vat.map((a) => {
    const lop: SemanticLayer = a.lop ?? 'giua';
    const aInfo = rawActorPos.get(a.id)!;
    let x = transformX(aInfo.rawX);

    if (a.ngoi_tren) {
      const [seatId, ancName] = a.ngoi_tren.split('.');
      const seat = propWorldPos.get(seatId);
      const seatDef = seat ? BUILT_IN_PROP_CATALOG[seat.type] : undefined;
      const anc = ancName ? seatDef?.anchors?.[ancName] : undefined;
      if (seat && anc) {
        x = Number((seat.x + anc[0] * seat.scale).toFixed(2));
      }
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
      x,
      yOffset: 0,
      scale: autoScale,
      facing: aInfo.facing,
      pose,
      leanDeg: initLeanDeg,
      sitProgress: aInfo.isSeated ? 1 : 0,
      colorRole: 'ink',
      focusRole: 'hero',
      showTeaCup: a.cam_chen_tra ? 1 : 0,
      teaCupRed: isHandCupTwist,
      seatedOn: a.ngoi_tren,
      seatedAtDesk: a.ngoi_vao,
      lookAtTarget: a.nhin_theo,
      semanticLayer: lop,
      layer: mapSemanticLayerToStageLayer(lop),
      enterAt: a.xuat_hien_tu,
      leaveAt: a.roi_di_luc,
    };
  });

  const timeline: TimelineCue[] = [];

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

  for (const beat of sem.nhip) {
    const atExpr = resolveMocToTimeExpr(beat.moc, beat.sau ?? 0);
    const dur = beat.thoi_luong ?? 1.1;

    for (const [actorId, act] of Object.entries(beat.nhan_vat ?? {})) {
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
      if (act.di_toi) {
        cue.toX = transformX(SEMANTIC_SLOTS[act.di_toi]);
      }
      if (act.huong) {
        cue.facing = act.huong === 'trai' ? 'left' : 'right';
      }
      if (act.nghieng === 'guc') cue.leanDeg = 22;
      else if (act.nghieng === 'nhe_truoc') cue.leanDeg = 11;
      else if (act.nghieng === 'thang') cue.leanDeg = 0;
      else if (act.nghieng === 'nga_lung') cue.leanDeg = -3;
      if (act.nhin_theo !== undefined) {
        cue.lookAtTarget = act.nhin_theo;
      }
      if (act.cam_chen_tra !== undefined) {
        cue.showTeaCup = act.cam_chen_tra ? 1 : 0;
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
  }

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
    },
    atmosphere,
    actors: compiledActors,
    props: compiledProps,
    timeline,
  };
}
