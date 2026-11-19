/**
 * Sinh Tờ Duyệt Họ Đạo Cụ (`qa-artifacts-ci/HO-<ten_ho>.png`) bằng MỘT lệnh:
 *   npm run ho:duyet -- do_chua
 *
 * Tuân thủ tuyệt đối:
 * - 100% dựng qua luồng thật: Gói Chén JSON -> parseGoiChen (biên dịch ngữ nghĩa + validator cứng) -> DeclarativeStagePlayer trên khung 1080×1920.
 * - CẤM đặt toạ độ tay (`x`, `y`, `scale`, `shapes`) ở bất kỳ bước nào.
 * - Gồm 3 phần trên tờ duyệt:
 *   (1) Vùng hình 1× cắt trực tiếp từ khung 1080×1920: Lữ khách + toàn bộ preset (gồm mam_com đặt trên bàn trà với 2 bat_com + 1 chen_tra).
 *   (2) Hàng phóng 2× (200%) của chính vùng hình đó (chia Nửa Trái & Nửa Phải để giữ nguyên độ phóng 2× không ép ngang).
 *   (3) Bản Đỏ Chu Sa sau cú lật (`post-pivot`) của toàn bộ 7 preset làm được vật đỏ + 1 ô Lữ khách đứng cầm chén ngang ngực.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { parseGoiChen } from '../src/stage/goiChenParser.ts';
import { sanitizeAndNormalizeCupBundle } from '../src/automation/geminiBundleBridge.ts';
import { computeTimelineSync } from '../src/engine/timelineSync.ts';
import { evaluateMotionState } from '../src/engine/motionPhysics.ts';
import { resolveVisualDNA } from '../src/engine/visualDnaResolver.ts';
import { DeclarativeStagePlayer } from '../src/stage/DeclarativeStagePlayer.tsx';
import { LAYOUT_TOKENS, THEME_PALETTES } from '../src/theme/palettes.ts';

process.env.STAGE_STRICT_THROW = '1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'qa-artifacts-ci');
fs.mkdirSync(OUT_DIR, { recursive: true });

const familyArg = (process.argv[2] || 'do_chua').replace(/^--/, '');
if (familyArg !== 'do_chua' && familyArg !== 'mat_phang') {
  console.error(`Hiện script tờ duyệt mới cấu hình cho họ: do_chua, mat_phang (nhận: ${familyArg})`);
  process.exit(1);
}

const palette = THEME_PALETTES.MINIMAL_LIGHT;
const FW = LAYOUT_TOKENS.width; // 1080
const FH = LAYOUT_TOKENS.height; // 1920
const { stageLeft, stageTop, stageWidth, stageHeight } = LAYOUT_TOKENS.swissGrid;

/**
 * Dựng 1 khung 1080×1920 thật từ Gói Chén JSON hoàn chỉnh (không toạ độ tay).
 */
function renderFull1080x1920SvgFromGoiChen(goiChenObj, phase = 'pre_pivot') {
  const parsedGoi = parseGoiChen(goiChenObj);
  if (!parsedGoi.ok || !parsedGoi.compiled) {
    throw new Error(
      `Gói Chén "${goiChenObj.tieu_de}" bị validator chặn:\n` +
        parsedGoi.errors.map((e) => `  • ${e}`).join('\n')
    );
  }

  const bundle = sanitizeAndNormalizeCupBundle(JSON.stringify(goiChenObj), {
    defaultMode: 'create_new',
  });

  const sync = computeTimelineSync({
    id: `ho-${familyArg}`,
    textFormat: bundle.textFormat,
    segments: bundle.segments,
    pivotWord: bundle.pivotWord,
    highlightStyle: 'BOTH',
    targetDurationSeconds: bundle.targetDurationSeconds,
    durationMode: bundle.durationMode,
    typingSpeedMsPerChar: bundle.typingSpeedMsPerChar,
    holdAfterFinishSeconds: bundle.holdAfterFinishSeconds,
    themeId: 'MINIMAL_LIGHT',
    motion: {
      sceneId: bundle.sceneId,
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: bundle.pacingMode,
      stageScript: bundle.stageScript,
      stateA: { intensity: 0.75, spread: 0.25, tiltDeg: -12 },
      stateB: { intensity: 0.12, spread: 0.72, tiltDeg: 0 },
    },
    bgm: { audioMode: bundle.audioMode, foleyPivotStyle: bundle.foleyPivotStyle },
    brandText: 'TRÀ NGUỘI',
  });

  const fps = sync.fps;
  const frame =
    phase === 'post_pivot'
      ? Math.min(
          sync.durationInFrames - Math.round(1.8 * fps),
          sync.pivotFrame + Math.round(1.4 * fps)
        )
      : Math.min(sync.pivotFrame - Math.round(0.4 * fps), Math.round(4.1 * fps));

  const mState = evaluateMotionState(
    frame,
    fps,
    sync.pivotFrame,
    sync.allTextFinishedFrame,
    sync.durationInFrames,
    {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: bundle.pacingMode,
      stateA: { intensity: 0.75, spread: 0.25, tiltDeg: -12 },
      stateB: { intensity: 0.12, spread: 0.72, tiltDeg: 0 },
    }
  );

  const vdna = resolveVisualDNA(
    {
      themeId: 'MINIMAL_LIGHT',
      visualDNA: bundle.visualDNA,
      motion: { archetype: 'BOULDER_TO_BENCH', pacingMode: bundle.pacingMode },
    },
    bundle.stageScript
  );

  const stageSvg = renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script: bundle.stageScript,
      state: mState,
      palette,
      strokeWidth: LAYOUT_TOKENS.strokeWidth,
      frame,
      fps,
      durationInFrames: sync.durationInFrames,
      timeline: sync,
      visualDNA: vdna,
      stageBox: { width: stageWidth, height: stageHeight },
      frameMode: 'NONE',
      showDebugBBoxes: false,
    })
  );

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${FW}" height="${FH}" viewBox="0 0 ${FW} ${FH}">`,
    `<rect x="0" y="0" width="${FW}" height="${FH}" fill="${palette.background}" />`,
    `<g transform="translate(${stageLeft}, ${stageTop})">${stageSvg}</g>`,
    `</svg>`,
  ].join('');
}

// ── 1. Gói Chén toàn cảnh họ `do_chua`: Lữ khách + toàn bộ 8 preset ở tỷ lệ thật ──
// - mam_com đặt trên bàn trà thấp ban_mam, trên 3 điểm neo đặt đủ 2 bat_com + 1 chen_tra.
const lineupGoiChen = {
  phien_ban_goi: 1,
  tieu_de: 'Tờ duyệt họ do_chua',
  cau: [
    'Chén ấm ly bát hộp mâm,',
    'Bày ngang một dải âm thầm đối hương.',
    'Nét thanh mộc mạc đời thường,',
    'Chạm câu điểm lật vấn vương sắc hồng.',
  ],
  cu_lat: 'vấn vương sắc hồng',
  boi_canh: { dia_hinh: 'phang' },
  nhan_vat: [{ id: 'hero', vi_tri: 'xa_trai', tu_the: 'dung', huong: 'phai' }],
  dao_cu: [
    { id: 'ban_1', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'trai', lop: 'giua' },
    { id: 'p_chen_tra', type: 'chen_tra', loai_neo: 'tren', dat_tren: 'ban_1.mat_ban_trai', lop: 'giua' },
    { id: 'p_am_tra', type: 'am_tra', loai_neo: 'tren', dat_tren: 'ban_1.mat_ban_phai', lop: 'giua' },
    { id: 'ban_mam', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'giua_trai', lop: 'giua' },
    { id: 'p_mam_com', type: 'mam_com', loai_neo: 'tren', dat_tren: 'ban_mam.mat_ban_giua', lop: 'giua' },
    { id: 'p_mam_bat1', type: 'bat_com', loai_neo: 'tren', dat_tren: 'p_mam_com.trai_mam', lop: 'giua' },
    { id: 'p_mam_chen', type: 'chen_tra', loai_neo: 'tren', dat_tren: 'p_mam_com.giua_mam', lop: 'giua' },
    { id: 'p_mam_bat2', type: 'bat_com', loai_neo: 'tren', dat_tren: 'p_mam_com.phai_mam', lop: 'giua' },
    { id: 'ban_2', type: 'std_work_desk', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
    { id: 'p_ly_ca_phe', type: 'ly_ca_phe', loai_neo: 'tren', dat_tren: 'ban_2.mat_ban_trai', lop: 'giua' },
    { id: 'p_ly_ruou', type: 'ly_ruou', loai_neo: 'tren', dat_tren: 'ban_2.mat_ban_phai', lop: 'giua' },
    { id: 'p_vo_ruou', type: 'vo_ruou', loai_neo: 'dat', vi_tri: 'giua_phai', lop: 'giua', vat_do: true },
    { id: 'ban_3', type: 'std_work_desk', loai_neo: 'dat', vi_tri: 'phai', lop: 'giua' },
    { id: 'p_bat_com', type: 'bat_com', loai_neo: 'tren', dat_tren: 'ban_3.mat_ban_trai', lop: 'giua' },
    { id: 'p_hop_com', type: 'hop_com', loai_neo: 'tren', dat_tren: 'ban_3.mat_ban_phai', lop: 'giua' },
  ],
  nhip: [
    {
      moc: 'bat_dau',
      thoi_luong: 0.4,
      nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } },
    },
  ],
};

// ── 2. 7 bản Đỏ Chu Sa (gồm am_tra, 4 preset duyet + small_cup & wine_jar) + 1 ô Lữ khách đứng cầm chén ──
const CARD_CASES = [
  {
    label: 'am_tra (nhap · vat_do)',
    crop: [430, 545, 375, 250],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ am_tra',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Ấm trà bên ghế bình yên một chiều.',
        'Chờ khi câu chữ xoay chiều,',
        'Chu sa ấm nóng một điều lắng sâu.',
      ],
      cu_lat: 'một điều lắng sâu',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'am_tra', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'ly_ca_phe (duyet · vat_do)',
    crop: [430, 545, 375, 250],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ ly_ca_phe',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Ly cà phê sáng bình yên một chiều.',
        'Chờ khi câu chữ xoay chiều,',
        'Chu sa tỉnh giấc một điều lắng sâu.',
      ],
      cu_lat: 'một điều lắng sâu',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'ly_ca_phe', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'ly_ruou (duyet · vat_do)',
    crop: [430, 545, 375, 250],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ ly_ruou',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Ly rượu chân mảnh bình yên một chiều.',
        'Chờ khi câu chữ xoay chiều,',
        'Chu sa sóng sánh một điều lắng sâu.',
      ],
      cu_lat: 'một điều lắng sâu',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'ly_ruou', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'bat_com (duyet · vat_do)',
    crop: [430, 545, 375, 250],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ bat_com',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Bát cơm chiều muộn bình yên quê nhà.',
        'Chờ khi câu chữ ngân nga,',
        'Chu sa gợi nhớ đậm đà bữa xưa.',
      ],
      cu_lat: 'đậm đà bữa xưa',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'bat_com', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'hop_com (duyet · vat_do)',
    crop: [430, 545, 375, 250],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ hop_com',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Hộp cơm trưa mở bình yên văn phòng.',
        'Chờ khi câu chữ xoay vòng,',
        'Chu sa gói trọn tấm lòng người thương.',
      ],
      cu_lat: 'tấm lòng người thương',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'std_work_desk', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'hop_com', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'small_cup / chen_tra (vat_do)',
    crop: [430, 545, 375, 250],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ small_cup',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Chén trà trên gỗ bình yên một chiều.',
        'Chờ khi câu chữ xoay chiều,',
        'Chu sa lắng đọng một điều chưa phai.',
      ],
      cu_lat: 'một điều chưa phai',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'small_cup', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'wine_jar / vo_ruou (vat_do)',
    crop: [430, 545, 375, 250],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ wine_jar',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Vò rượu gốm cũ bình yên hiên nhà.',
        'Chờ khi câu chữ ngân xa,',
        'Chu sa ủ kín đậm đà nghĩa xưa.',
      ],
      cu_lat: 'đậm đà nghĩa xưa',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'vat_do', type: 'wine_jar', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'Lữ khách đứng cầm chén (cam_chen_tra)',
    crop: [315, 480, 420, 280],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Lữ khách cầm chén',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Đứng cầm chén nhỏ bình yên giữa đời.',
        'Chờ khi câu chữ buông lơi,',
        'Chu sa còn đọng một lời chưa quên.',
      ],
      cu_lat: 'một lời chưa quên',
      boi_canh: { dia_hinh: 'phang' },
      vat_do_tren_tay: 'hero.chen_tra',
      nhan_vat: [
        {
          id: 'hero',
          vi_tri: 'giua',
          tu_the: 'dung',
          huong: 'phai',
          cam_chen_tra: true,
        },
      ],
      dao_cu: [
        { id: 'ban', type: 'low_wood_stool', loai_neo: 'dat', vi_tri: 'phai', lop: 'giua' },
      ],
      nhip: [
        {
          moc: 'bat_dau',
          thoi_luong: 0.4,
          nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang', cam_chen_tra: true } },
        },
      ],
    },
  },
];

const MAT_PHANG_LINEUP_GOI_A = {
  phien_ban_goi: 1,
  tieu_de: 'Tờ duyệt họ mat_phang — Nhóm Bàn',
  cau: [
    'Bàn trà thấp ấm góc hiên,',
    'Bàn quán gọn gàng bên thềm nắng phai.',
    'Bàn làm việc nối bàn dài,',
    'Bốn mặt phẳng lặng đón ngày đi qua.',
  ],
  cu_lat: 'đón ngày đi qua',
  boi_canh: { dia_hinh: 'phang' },
  nhan_vat: [{ id: 'hero', vi_tri: 'xa_trai', tu_the: 'dung', huong: 'phai' }],
  dao_cu: [
    { id: 'p_ban_tra', type: 'ban_tra', loai_neo: 'dat', vi_tri: 'trai', lop: 'giua' },
    { id: 'p_am_ref', type: 'am_tra', loai_neo: 'tren', dat_tren: 'p_ban_tra.mat_giua', lop: 'giua', vat_do: true },
    { id: 'p_ban_quan', type: 'ban_quan', loai_neo: 'dat', vi_tri: 'giua_trai', lop: 'giua' },
    { id: 'p_ban_lv', type: 'ban_lam_viec', loai_neo: 'dat', vi_tri: 'giua_phai', lop: 'giua' },
    { id: 'p_ban_hop', type: 'ban_hop', loai_neo: 'dat', vi_tri: 'xa_phai', lop: 'giua' },
  ],
  nhip: [
    {
      moc: 'bat_dau',
      thoi_luong: 0.4,
      nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } },
    },
  ],
};

const MAT_PHANG_LINEUP_GOI_B = {
  phien_ban_goi: 1,
  tieu_de: 'Tờ duyệt họ mat_phang — Tủ kính, Giường & Gối',
  cau: [
    'Tủ kính đứng lặng bên tường,',
    'Một chiếc gối vải giữa giường ngủ yên.',
    'Gối đặt cạnh lối dịu hiền,',
    'Đêm dài lắng lại bình yên căn phòng.',
  ],
  cu_lat: 'bình yên căn phòng',
  boi_canh: { dia_hinh: 'phang' },
  nhan_vat: [{ id: 'hero', vi_tri: 'xa_trai', tu_the: 'dung', huong: 'phai' }],
  dao_cu: [
    { id: 'p_tu_kinh', type: 'tu_kinh', loai_neo: 'dat', vi_tri: 'giua_trai', lop: 'giua' },
    { id: 'p_goi_dat', type: 'chiec_goi', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
    { id: 'p_giuong', type: 'giuong_ngu', loai_neo: 'dat', vi_tri: 'xa_phai', lop: 'giua' },
    { id: 'p_goi_giuong', type: 'chiec_goi', loai_neo: 'tren', dat_tren: 'p_giuong.dau_goi', lop: 'giua', vat_do: true },
  ],
  nhip: [
    {
      moc: 'bat_dau',
      thoi_luong: 0.4,
      nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } },
    },
  ],
};

const MAT_PHANG_CARDS = [
  {
    label: 'chiec_goi đỏ trên giuong_ngu.dau_goi',
    crop: [515, 600, 345, 230],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ chiec_goi trên giường',
      cau: [
        'Đèn khuya tắt bóng phòng êm,',
        'Gối mềm đầu giường vẫn mềm hơi quen.',
        'Đêm dài trở giấc không tên,',
        'Một vệt chu sa ấm êm góc giường.',
      ],
      cu_lat: 'ấm êm góc giường',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'giuong', type: 'giuong_ngu', loai_neo: 'dat', vi_tri: 'giua_phai', lop: 'giua' },
        { id: 'vat_do', type: 'chiec_goi', loai_neo: 'tren', dat_tren: 'giuong.dau_goi', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'chiec_goi đỏ đặt lẻ (dat)',
    crop: [600, 650, 270, 180],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ chiec_goi đặt đất',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Chiếc gối vải mềm bình yên góc phòng.',
        'Chờ khi câu chữ xoay vòng,',
        'Chu sa ấm lại bên lòng lặng im.',
      ],
      cu_lat: 'bên lòng lặng im',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'vat_do', type: 'chiec_goi', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'ban_quan + ly_ca_phe trên mat_giua',
    crop: [565, 600, 315, 210],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Kiểm neo ban_quan',
      cau: [
        'Quán chiều vắng khách bên hiên,',
        'Bàn quán gọn gàng ly đen nóng nồng.',
        'Ngồi nghe gió thổi ngang song,',
        'Ly cà phê đỏ ấm lòng chiều rơi.',
      ],
      cu_lat: 'ấm lòng chiều rơi',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'ban_quan', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'ly_ca_phe', loai_neo: 'tren', dat_tren: 'ban.mat_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'tu_kinh + ban_hop (neo ngan_tren & mat_giua)',
    crop: [410, 550, 480, 320],
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Kiểm neo tu_kinh và ban_hop',
      cau: [
        'Tủ kính hai đợt ngay hàng,',
        'Bàn họp trải dài nắng loang cuối ngày.',
        'Đặt chén lên đợt tủ này,',
        'Nhìn chiếc laptop đỏ ngay giữa bàn.',
      ],
      cu_lat: 'đỏ ngay giữa bàn',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'xa_trai', tu_the: 'dung', huong: 'phai' }],
      dao_cu: [
        { id: 'tu', type: 'tu_kinh', loai_neo: 'dat', vi_tri: 'giua_trai', lop: 'giua' },
        { id: 'ch', type: 'chen_tra', loai_neo: 'tren', dat_tren: 'tu.ngan_tren', lop: 'giua' },
        { id: 'hop', type: 'ban_hop', loai_neo: 'dat', vi_tri: 'giua_phai', lop: 'giua' },
        { id: 'vat_do', type: 'desk_laptop', loai_neo: 'tren', dat_tren: 'hop.mat_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
];

const activeLineupGoi = familyArg === 'mat_phang' ? MAT_PHANG_LINEUP_GOI_A : lineupGoiChen;
const activeLineupGoi2 = familyArg === 'mat_phang' ? MAT_PHANG_LINEUP_GOI_B : null;
const activeCardCases = familyArg === 'mat_phang' ? MAT_PHANG_CARDS : CARD_CASES;

const sheetMeta =
  familyArg === 'mat_phang'
    ? {
        sheetH: 1850,
        twoLineups: true,
        headerTitle: 'TỜ DUYỆT HỌ ĐẠO CỤ: mat_phang — Lần 1 (100% qua Gói Chén → Validator → Render 1080×1920)',
        headerSub: '1A (Nhóm Bàn): Lữ khách · ban_tra (alias) · ban_quan (82cm) · ban_lam_viec (alias) · ban_hop (168cm)   |   1B (Tủ & Giường): Lữ khách · tu_kinh (138cm) · chiec_goi (46cm) · giuong_ngu (185cm) + chiec_goi',
        section1ATitle: '1A. Vùng hình 1× (1080×1920) — Nhóm Bàn (ban_tra, ban_quan, ban_lam_viec, ban_hop)',
        section1BTitle: '1B. Vùng hình 1× (1080×1920) — Tủ kính, Gối & Giường (tu_kinh, chiec_goi, giuong_ngu)',
        summaryTitle: 'Họ 2 mat_phang (phủ 38/262 quote · 0 lỗi Validator · Trạng thái: nhap — chờ chủ kênh duyệt):',
        summaryLines: [
          '• 5 preset mới (nhap): ban_quan (82cm), ban_hop (168cm), giuong_ngu (185cm), chiec_goi (46cm), tu_kinh (138cm)',
          '• 2 alias duyet sẵn (không vẽ lại): ban_lam_viec → std_work_desk (112cm), ban_tra → low_tea_table (98cm)',
          '• Điểm neo chuẩn hoá: mat_trai / mat_giua / mat_phai (giữ mat_ban_*); giuong_ngu có dau_goi & mat_giuong',
          '• tu_kinh thêm ngan_tren / ngan_duoi để đặt vật nhỏ trong tủ; 2 nét chéo mảnh gợi mặt kính phản sáng',
          '• Vật đỏ (canBeRed: true): chỉ chiec_goi (IoU = 1.00, phủ đỏ RED_PIVOT_FILL_OPACITY = 0.7); bàn/giường/tủ = false',
          '• Skill đã chạy npm run gen:skill: 5 preset mới ở Tầng B (nhap, cảnh báo vàng khi dùng) chờ duyệt',
        ],
        section2Title: '2A. Phóng 2× (200% pixel thật) — Nhóm Bàn (Lữ khách · ban_tra · ban_quan · ban_lam_viec · ban_hop)',
        section2BTitle: '2B. Phóng 2× (200% pixel thật) — Tủ kính, Gối & Giường (Lữ khách · tu_kinh · chiec_goi · giuong_ngu + chiec_goi)',
        section3Title: '3. Bản Đỏ Chu Sa (chiec_goi) & Kiểm Điểm Neo Thực Tế (ban_quan, tu_kinh, ban_hop, giuong_ngu)',
        lastCardNeutral: true,
      }
    : {
        sheetH: 1680,
        twoLineups: false,
        headerTitle: 'TỜ DUYỆT HỌ ĐẠO CỤ: do_chua — Lần 2 (Dựng 100% qua Gói Chén → Validator → Render 1080×1920)',
        headerSub: 'Trái → phải: Lữ khách · [Bàn trà: chen_tra, am_tra] · [Bàn trà: mam_com (2 bat_com + 1 chen_tra)] · [Bàn dài: ly_ca_phe, ly_ruou] · vo_ruou · [Bàn dài: bat_com, hop_com]',
        summaryTitle: 'Cập nhật theo duyệt của chủ kênh (0 lỗi Validator):',
        summaryLines: [
          '• Đã chuyển duyet: ly_ca_phe (14cm), ly_ruou (19cm), bat_com (15cm), hop_com (19cm)',
          '• am_tra (nhap): bỏ mảng bết đen, nét viền mảnh 0.56 + wash 0.09, mở thoáng nắp và vòi',
          '• mam_com (nhap, 86cm): đặt trên bàn trà thấp, đặt đủ 2 bat_com + 1 chen_tra lên 3 điểm neo',
          '• small_cup & wine_jar: giữ nguyên bản thường, thêm altShapes đỏ (IoU = 1.00, ≥ 500 px²)',
          '• cam_chen_tra: Lữ khách đứng đưa tay đỡ chén ngang ngực (không còn rơi xuống chân)',
          '• Alias giữ nguyên: chen_tra → small_cup (11.5cm), vo_ruou → wine_jar (58cm)',
        ],
        section2Title: '2. Phóng 2× (200% pixel thật) cùng vùng hình — Nửa Trái (am_tra & mam_com trên bàn) & Nửa Phải (ly_ca_phe, ly_ruou, vo_ruou, bat_com, hop_com)',
        section3Title: '3. Bản Đỏ Chu Sa sau cú lật (7 món làm được vật đỏ) & Lữ khách đứng cầm chén (cam_chen_tra)',
        lastCardNeutral: true,
      };

console.log(`Đang dựng khung 1080×1920 toàn cảnh họ "${familyArg}" qua parseGoiChen...`);
const lineupSvg1x = renderFull1080x1920SvgFromGoiChen(activeLineupGoi, 'pre_pivot');
const lineupSvg1x2 = activeLineupGoi2
  ? renderFull1080x1920SvgFromGoiChen(activeLineupGoi2, 'pre_pivot')
  : null;

console.log(`Đang dựng ${activeCardCases.length} khung 1080×1920 bản Đỏ & kiểm điểm neo...`);
const redSvgs = activeCardCases.map((rc) => ({
  label: rc.label,
  crop: rc.crop,
  svg: renderFull1080x1920SvgFromGoiChen(rc.goi, 'post_pivot'),
}));

// ── Python CoreGraphics rasterize 1080×1920 (1× & 2×) + crop vùng sân khấu + ghép tờ duyệt ──
const PY_COMPOSITOR = `
import ctypes, json, re, sys
from ctypes import c_void_p, c_size_t, c_double, c_uint32, c_char_p, c_bool, Structure

class CGPoint(Structure): _fields_ = [("x", c_double), ("y", c_double)]
class CGSize(Structure): _fields_ = [("width", c_double), ("height", c_double)]
class CGRect(Structure): _fields_ = [("origin", CGPoint), ("size", CGSize)]

cg = ctypes.CDLL("/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics")
cf = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
imageio = ctypes.CDLL("/System/Library/Frameworks/ImageIO.framework/ImageIO")
coresvg = ctypes.CDLL("/System/Library/PrivateFrameworks/CoreSVG.framework/CoreSVG")

cf.CFDataCreate.restype = c_void_p; cf.CFDataCreate.argtypes = [c_void_p, c_char_p, c_size_t]
cf.CFStringCreateWithCString.restype = c_void_p; cf.CFStringCreateWithCString.argtypes = [c_void_p, c_char_p, c_uint32]
cf.CFURLCreateFromFileSystemRepresentation.restype = c_void_p; cf.CFURLCreateFromFileSystemRepresentation.argtypes = [c_void_p, c_char_p, c_size_t, c_bool]
cf.CFRelease.argtypes = [c_void_p]

coresvg.CGSVGDocumentCreateFromData.restype = c_void_p; coresvg.CGSVGDocumentCreateFromData.argtypes = [c_void_p, c_void_p]
coresvg.CGSVGDocumentRelease.argtypes = [c_void_p]
coresvg.CGContextDrawSVGDocument.argtypes = [c_void_p, c_void_p]

cg.CGColorSpaceCreateDeviceRGB.restype = c_void_p
cg.CGBitmapContextCreate.restype = c_void_p; cg.CGBitmapContextCreate.argtypes = [c_void_p, c_size_t, c_size_t, c_size_t, c_size_t, c_void_p, c_uint32]
cg.CGContextRelease.argtypes = [c_void_p]
cg.CGBitmapContextCreateImage.restype = c_void_p; cg.CGBitmapContextCreateImage.argtypes = [c_void_p]
cg.CGImageRelease.argtypes = [c_void_p]
cg.CGImageCreateWithImageInRect.restype = c_void_p; cg.CGImageCreateWithImageInRect.argtypes = [c_void_p, CGRect]
cg.CGContextDrawImage.argtypes = [c_void_p, CGRect, c_void_p]
cg.CGContextScaleCTM.argtypes = [c_void_p, c_double, c_double]

imageio.CGImageDestinationCreateWithURL.restype = c_void_p; imageio.CGImageDestinationCreateWithURL.argtypes = [c_void_p, c_void_p, c_size_t, c_void_p]
imageio.CGImageDestinationAddImage.argtypes = [c_void_p, c_void_p, c_void_p]
imageio.CGImageDestinationFinalize.restype = c_bool; imageio.CGImageDestinationFinalize.argtypes = [c_void_p]

cs_rgb = cg.CGColorSpaceCreateDeviceRGB()
uti_png = cf.CFStringCreateWithCString(None, b"public.png", 0x08000100)

import html
RE_RGB = re.compile(r"rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)")
RE_RGBA_CSS = re.compile(r"rgba\\((\\d+),\\s*(\\d+),\\s*(\\d+),\\s*([0-9.]+)\\)")
RE_RGBA_HEX = re.compile(r"#([0-9a-fA-F]{6})([0-9a-fA-F]{2})\\b")
def clean_svg(svg):
    svg = RE_RGBA_CSS.sub(lambda m: f"#{int(m.group(1)):02X}{int(m.group(2)):02X}{int(m.group(3)):02X}", svg)
    svg = RE_RGB.sub(lambda m: f"#{int(m.group(1)):02X}{int(m.group(2)):02X}{int(m.group(3)):02X}", svg)
    svg = RE_RGBA_HEX.sub(lambda m: f"#{m.group(1)}", svg)
    svg = svg.replace('style="overflow:visible;background:transparent"', '')
    return svg

def render_svg_to_cgimage(svg_str, w, h, scale=1.0):
    svg_clean = clean_svg(svg_str)
    data = svg_clean.encode("utf-8")
    cfdata = cf.CFDataCreate(None, data, len(data))
    doc = coresvg.CGSVGDocumentCreateFromData(cfdata, None)
    pw, ph = int(round(w * scale)), int(round(h * scale))
    ctx = cg.CGBitmapContextCreate(None, pw, ph, 8, pw * 4, cs_rgb, 1)
    if scale != 1.0:
        cg.CGContextScaleCTM(ctx, scale, scale)
    coresvg.CGContextDrawSVGDocument(ctx, doc)
    im = cg.CGBitmapContextCreateImage(ctx)
    cg.CGContextRelease(ctx)
    coresvg.CGSVGDocumentRelease(doc)
    cf.CFRelease(cfdata)
    return im

payload = json.loads(sys.stdin.read())
out_png = payload["out"]

# 1. Render 1080x1920 ở tỷ lệ 1x và 2x cho cảnh toàn bộ họ
meta = payload["meta"]
two_lineups = bool(meta.get("twoLineups"))
im_1x = render_svg_to_cgimage(payload["lineupSvg"], 1080, 1920, 1.0)
im_2x = render_svg_to_cgimage(payload["lineupSvg"], 1080, 1920, 2.0)

# Cắt vùng sân khấu trên khung 1080x1920: x=132..948 (816px), y=540..810 (270px)
cx, cy, cw, ch = 132, 540, 816, 270
crop_1x = cg.CGImageCreateWithImageInRect(im_1x, CGRect(CGPoint(cx, cy), CGSize(cw, ch)))

SHEET_W, SHEET_H = 1720, int(meta["sheetH"])
card_w, card_h = 394, 262
gap_x, gap_y = 18, 48

if two_lineups:
    im_1x_b = render_svg_to_cgimage(payload["lineupSvg2"], 1080, 1920, 1.0)
    im_2x_b = render_svg_to_cgimage(payload["lineupSvg2"], 1080, 1920, 2.0)
    crop_1x_b = cg.CGImageCreateWithImageInRect(im_1x_b, CGRect(CGPoint(cx, cy), CGSize(cw, ch)))
    # Phóng 2x toàn cảnh 1A và 1B (cắt y=565..785 → 220px × 2 = 440px, chiều rộng 816 × 2 = 1632px khớp 100% bề rộng tờ!)
    cy2, ch2 = 565, 220
    crop_2x_a = cg.CGImageCreateWithImageInRect(im_2x, CGRect(CGPoint(cx * 2, cy2 * 2), CGSize(cw * 2, ch2 * 2)))
    crop_2x_b = cg.CGImageCreateWithImageInRect(im_2x_b, CGRect(CGPoint(cx * 2, cy2 * 2), CGSize(cw * 2, ch2 * 2)))
    cards_top_y = 1524
    summary_svg_parts = []
    for sidx, sline in enumerate(meta["summaryLines"]):
        col = sidx // 3
        row = sidx % 3
        sx = 64 + col * 816
        sy = 468 + row * 24
        sfill = "#C8432B" if "Vật đỏ" in sline else ("#6B6259" if sidx == len(meta["summaryLines"]) - 1 else "#1E1B18")
        summary_svg_parts.append(f'<text x="{sx}" y="{sy}" font-family="Helvetica, Arial, sans-serif" font-size="13.5" fill="{sfill}">{html.escape(sline)}</text>')
    cards_svg_parts = []
    for idx, item in enumerate(payload["redSvgs"]):
        col = idx % 4
        row = idx // 4
        lx = 44 + col * (card_w + gap_x)
        ty = cards_top_y + row * (card_h + gap_y)
        stroke_col = "#1E1B18" if (meta.get("lastCardNeutral") and idx == len(payload["redSvgs"]) - 1) else "#C8432B"
        cards_svg_parts.append(f'<rect x="{lx}" y="{ty}" width="{card_w}" height="{card_h}" fill="none" stroke="{stroke_col}" stroke-width="1.3" />')
        cards_svg_parts.append(f'<text x="{lx + card_w // 2}" y="{ty + card_h + 22}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="bold" fill="#1E1B18">{html.escape(item["label"])}</text>')
    labels_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{SHEET_W}" height="{SHEET_H}" viewBox="0 0 {SHEET_W} {SHEET_H}">
  <rect x="0" y="0" width="{SHEET_W}" height="{SHEET_H}" fill="#EAE1D3" />
  <text x="44" y="46" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="bold" fill="#1E1B18">{html.escape(meta["headerTitle"])}</text>
  <text x="44" y="72" font-family="Helvetica, Arial, sans-serif" font-size="13.5" fill="#6B6259">{html.escape(meta["headerSub"])}</text>

  <text x="44" y="108" font-family="Helvetica, Arial, sans-serif" font-size="15.5" font-weight="bold" fill="#1E1B18">{html.escape(meta["section1ATitle"])}</text>
  <rect x="44" y="118" width="808" height="270" fill="#F1EAE0" stroke="#C9BFAE" stroke-width="1.5" />
  <text x="868" y="108" font-family="Helvetica, Arial, sans-serif" font-size="15.5" font-weight="bold" fill="#1E1B18">{html.escape(meta["section1BTitle"])}</text>
  <rect x="868" y="118" width="808" height="270" fill="#F1EAE0" stroke="#C9BFAE" stroke-width="1.5" />

  <rect x="44" y="406" width="1632" height="122" rx="8" fill="#F6F1E9" stroke="#C9BFAE" stroke-width="1.2" />
  <text x="64" y="438" font-family="Helvetica, Arial, sans-serif" font-size="15.5" font-weight="bold" fill="#1E1B18">{html.escape(meta["summaryTitle"])}</text>
  {"".join(summary_svg_parts)}

  <text x="44" y="558" font-family="Helvetica, Arial, sans-serif" font-size="15.5" font-weight="bold" fill="#1E1B18">{html.escape(meta["section2Title"])}</text>
  <rect x="44" y="568" width="1632" height="440" fill="#F1EAE0" stroke="#C9BFAE" stroke-width="1.5" />

  <text x="44" y="1038" font-family="Helvetica, Arial, sans-serif" font-size="15.5" font-weight="bold" fill="#1E1B18">{html.escape(meta["section2BTitle"])}</text>
  <rect x="44" y="1048" width="1632" height="440" fill="#F1EAE0" stroke="#C9BFAE" stroke-width="1.5" />

  <text x="44" y="1512" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#C8432B">{html.escape(meta["section3Title"])}</text>
  {"".join(cards_svg_parts)}
</svg>'''
else:
    # Phóng 2x cùng vùng hình (1632 x 540), chia đôi Trái (816x540) và Phải (816x540) để giữ đúng 200% pixel thật
    crop_2x_left = cg.CGImageCreateWithImageInRect(im_2x, CGRect(CGPoint(cx * 2, cy * 2), CGSize(cw, ch * 2)))
    crop_2x_right = cg.CGImageCreateWithImageInRect(im_2x, CGRect(CGPoint((cx + cw // 2) * 2, cy * 2), CGSize(cw, ch * 2)))
    cards_top_y = 1044
    cards_svg_parts = []
    for idx, item in enumerate(payload["redSvgs"]):
        col = idx % 4
        row = idx // 4
        lx = 44 + col * (card_w + gap_x)
        ty = cards_top_y + row * (card_h + gap_y)
        stroke_col = "#1E1B18" if (meta.get("lastCardNeutral") and idx == len(payload["redSvgs"]) - 1) else "#C8432B"
        cards_svg_parts.append(f'<rect x="{lx}" y="{ty}" width="{card_w}" height="{card_h}" fill="none" stroke="{stroke_col}" stroke-width="1.3" />')
        cards_svg_parts.append(f'<text x="{lx + card_w // 2}" y="{ty + card_h + 22}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="bold" fill="#1E1B18">{html.escape(item["label"])}</text>')

    summary_svg_parts = []
    for sidx, sline in enumerate(meta["summaryLines"]):
        sy = 188 + sidx * 26
        sfill = "#C8432B" if "Vật đỏ" in sline or "small_cup" in sline else ("#6B6259" if sidx == len(meta["summaryLines"]) - 1 else "#1E1B18")
        summary_svg_parts.append(f'<text x="920" y="{sy}" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="{sfill}">{html.escape(sline)}</text>')

    labels_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{SHEET_W}" height="{SHEET_H}" viewBox="0 0 {SHEET_W} {SHEET_H}">
  <rect x="0" y="0" width="{SHEET_W}" height="{SHEET_H}" fill="#EAE1D3" />
  <text x="44" y="48" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="bold" fill="#1E1B18">{html.escape(meta["headerTitle"])}</text>
  <text x="44" y="76" font-family="Helvetica, Arial, sans-serif" font-size="14.5" fill="#6B6259">{html.escape(meta["headerSub"])}</text>

  <text x="44" y="114" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#1E1B18">1. Vùng hình 1× cắt trực tiếp từ khung 1080×1920 (816×270 px — tỷ lệ 1:1 trên điện thoại)</text>
  <rect x="44" y="126" width="816" height="270" fill="#F1EAE0" stroke="#C9BFAE" stroke-width="1.5" />

  <rect x="896" y="126" width="780" height="270" rx="8" fill="#F6F1E9" stroke="#C9BFAE" stroke-width="1.2" />
  <text x="920" y="160" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#1E1B18">{html.escape(meta["summaryTitle"])}</text>
  {"".join(summary_svg_parts)}

  <text x="44" y="434" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#1E1B18">{html.escape(meta["section2Title"])}</text>
  <rect x="44" y="446" width="816" height="540" fill="#F1EAE0" stroke="#C9BFAE" stroke-width="1.5" />
  <rect x="876" y="446" width="800" height="540" fill="#F1EAE0" stroke="#C9BFAE" stroke-width="1.5" />

  <text x="44" y="1024" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#C8432B">{html.escape(meta["section3Title"])}</text>
  {"".join(cards_svg_parts)}
</svg>'''

sheet_bg = render_svg_to_cgimage(labels_svg, SHEET_W, SHEET_H, 1.0)
ctx = cg.CGBitmapContextCreate(None, SHEET_W, SHEET_H, 8, SHEET_W * 4, cs_rgb, 1)

def draw2(img, left_x, top_y, w, h):
    cg.CGContextDrawImage(ctx, CGRect(CGPoint(left_x, SHEET_H - top_y - h), CGSize(w, h)), img)

draw2(sheet_bg, 0, 0, SHEET_W, SHEET_H)
if two_lineups:
    draw2(crop_1x, 44, 118, 808, 270)
    draw2(crop_1x_b, 868, 118, 808, 270)
    draw2(crop_2x_a, 44, 568, 1632, 440)
    draw2(crop_2x_b, 44, 1048, 1632, 440)
else:
    draw2(crop_1x, 44, 126, 816, 270)
    draw2(crop_2x_left, 44, 446, 816, 540)
    draw2(crop_2x_right, 876, 446, 800, 540)

for idx, item in enumerate(payload["redSvgs"]):
    rim = render_svg_to_cgimage(item["svg"], 1080, 1920, 1.0)
    rx0, ry0, rw, rh = item["crop"]
    rc = cg.CGImageCreateWithImageInRect(rim, CGRect(CGPoint(rx0, ry0), CGSize(rw, rh)))
    col = idx % 4
    row = idx // 4
    lx = 44 + col * (card_w + gap_x)
    ty = cards_top_y + row * (card_h + gap_y)
    draw2(rc, lx, ty, card_w, card_h)
    cg.CGImageRelease(rc)
    cg.CGImageRelease(rim)

out_im = cg.CGBitmapContextCreateImage(ctx)
pbytes = out_png.encode("utf-8")
url = cf.CFURLCreateFromFileSystemRepresentation(None, pbytes, len(pbytes), False)
dest = imageio.CGImageDestinationCreateWithURL(url, uti_png, 1, None)
imageio.CGImageDestinationAddImage(dest, out_im, None)
imageio.CGImageDestinationFinalize(dest)

cf.CFRelease(dest); cf.CFRelease(url); cg.CGImageRelease(out_im); cg.CGContextRelease(ctx)
cg.CGImageRelease(sheet_bg); cg.CGImageRelease(crop_1x)
if two_lineups:
    cg.CGImageRelease(crop_1x_b); cg.CGImageRelease(crop_2x_a); cg.CGImageRelease(crop_2x_b)
    cg.CGImageRelease(im_1x_b); cg.CGImageRelease(im_2x_b)
else:
    cg.CGImageRelease(crop_2x_left); cg.CGImageRelease(crop_2x_right)
cg.CGImageRelease(im_1x); cg.CGImageRelease(im_2x)
print("SAVED", out_png)
`;

const outPngPath = path.join(OUT_DIR, `HO-${familyArg}.png`);
const res = spawnSync('/usr/bin/python3', ['-c', PY_COMPOSITOR], {
  input: JSON.stringify({
    out: outPngPath,
    meta: sheetMeta,
    lineupSvg: lineupSvg1x,
    lineupSvg2: lineupSvg1x2,
    redSvgs,
  }),
  encoding: 'utf8',
  maxBuffer: 128 * 1024 * 1024,
});

if (res.status !== 0) {
  console.error(res.stderr || res.stdout);
  process.exit(1);
}
console.log(`✅ Đã xuất tờ duyệt: ${path.relative(ROOT, outPngPath)}`);
