import {
  AirtableFieldMeta,
  AirtableRecordItem,
  AirtableWorkspaceCache,
  CupAirtableTrackMeta,
  CupPublishStatus,
  CupRecord,
  PublishSlot,
  TnMetrics,
} from './types';
import { studioApi } from './api';
import {
  computeTnScore,
  generateSeedCommentForCup,
  resolveCupCaption,
} from '../../src/automation/captionBuilder';
import {
  formatCupBaseFileName,
  formatCupSeoFileName,
} from '../../src/automation/fileNaming';

export const AIRTABLE_PAT_KEY = 'tra_nguoi_airtable_pat';
export const DEFAULT_TRA_NGUOI_BASE_ID = 'app9rk1rYkbXuIi3e';
export const QUOTE_LIBRARY_TABLE_ID = 'tblNySzay61Opo3SL';
export const WORDPLAY_LAB_TABLE_ID = 'tblG0SqIZOVn5D2NJ';
export const TRACKER_TABLE_NAME = 'Tủ Chén & Lịch Đăng';

const LS_TRACKER_TABLE_ID_KEY = 'tra_nguoi_cup_tracker_table_id_v1';
const LS_CUP_TRACK_MAP_KEY = 'tra_nguoi_cup_publish_track_map_v1';

export type PortfolioBucketId =
  | 'WORK_WORDPLAY'
  | 'CONTEMPLATIVE'
  | 'FLIRT_ADULT'
  | 'CLASSIC_LIT';

export interface PortfolioBucketStat {
  id: PortfolioBucketId;
  shortLabel: string;
  targetPct: number;
  actualPct: number;
  count: number;
  colorClass: string;
}

export interface ConsecutiveSomberNightWarning {
  cupA: string;
  cupB: string;
  moodA: string;
  moodB: string;
  message: string;
}

export const SLOT_OPTIONS: Array<{
  value: PublishSlot;
  shortLabel: string;
  airtableChoice: string;
}> = [
  {
    value: 'Morning',
    shortLabel: '🌅 Sáng',
    airtableChoice: '🌅 Sáng (06:30–08:30)',
  },
  {
    value: 'Anytime',
    shortLabel: '🌤️ Chiều',
    airtableChoice: '🌤️ Trưa–Chiều',
  },
  {
    value: 'Night',
    shortLabel: '🌙 Tối',
    airtableChoice: '🌙 Tối muộn (21:30–23:00)',
  },
];

export const PUBLISH_STATUS_OPTIONS: Array<{
  value: CupPublishStatus;
  shortLabel: string;
  airtableChoice: string;
}> = [
  {
    value: 'draft',
    shortLabel: '📝 Nháp',
    airtableChoice: '📝 Bản nháp',
  },
  {
    value: 'rendered',
    shortLabel: '🎬 Đã xuất',
    airtableChoice: '🎬 Đã xuất MP4',
  },
  {
    value: 'scheduled',
    shortLabel: '⏳ Chờ đăng',
    airtableChoice: '⏳ Chờ đăng',
  },
  {
    value: 'published',
    shortLabel: '✅ Đã đăng',
    airtableChoice: '✅ Đã đăng TikTok',
  },
];

export const MOOD_PRESETS: string[] = [
  'Nhẹ nhàng',
  'Thả thính',
  'Tự trào',
  'Hoài niệm',
  'Suy tư',
  'Ấm áp',
  'Trầm buồn',
  'Hài hước',
  'Thi vị',
];

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota error
  }
}

export function hasSavedAirtableToken(): boolean {
  return Boolean((window.localStorage.getItem(AIRTABLE_PAT_KEY) || '').trim());
}

async function callAirtableProxy<T>(
  subPath: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`/airtable-api${subPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(
      'Chưa kết nối được cổng Airtable cục bộ. Hãy kiểm tra Trà Nguội.app đang mở.'
    );
  }
  if (!res.ok) {
    const errField = data.error as
      | { message?: string; type?: string }
      | string
      | undefined;
    const msg =
      typeof errField === 'string'
        ? errField
        : errField?.message || `HTTP ${res.status}`;
    throw new Error(`Airtable (${res.status}): ${msg}`);
  }
  return data as T;
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,…!?""''—\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let cachedWorkspaceData: AirtableWorkspaceCache | null | undefined = undefined;

export async function loadCachedAirtableWorkspace(
  forceReload = false
): Promise<AirtableWorkspaceCache | null> {
  if (!forceReload && cachedWorkspaceData !== undefined) {
    return cachedWorkspaceData;
  }
  try {
    const res = await studioApi.getAirtableCache();
    cachedWorkspaceData = res.cache;
    return res.cache;
  } catch {
    cachedWorkspaceData = null;
    return null;
  }
}

export function slotToAirtableChoice(slot: PublishSlot): string {
  return (
    SLOT_OPTIONS.find((s) => s.value === slot)?.airtableChoice ||
    '🌤️ Trưa–Chiều'
  );
}

export function airtableChoiceToSlot(raw: unknown): PublishSlot | undefined {
  const text = String(raw || '').trim();
  if (!text) return undefined;
  if (/sáng|morning/i.test(text)) return 'Morning';
  if (/tối|night/i.test(text)) return 'Night';
  if (/trưa|chiều|anytime/i.test(text)) return 'Anytime';
  return undefined;
}

export function statusToAirtableChoice(status: CupPublishStatus): string {
  return (
    PUBLISH_STATUS_OPTIONS.find((s) => s.value === status)?.airtableChoice ||
    '📝 Bản nháp'
  );
}

export function airtableChoiceToStatus(
  raw: unknown
): CupPublishStatus | undefined {
  const text = String(raw || '').trim();
  if (!text) return undefined;
  if (/đã đăng|published/i.test(text)) return 'published';
  if (/chờ đăng|scheduled/i.test(text)) return 'scheduled';
  if (/đã xuất|mp4|rendered/i.test(text)) return 'rendered';
  if (/nháp|draft/i.test(text)) return 'draft';
  return undefined;
}

export function getStoredCupTrackMap(): Record<string, CupAirtableTrackMeta> {
  return readLocalJson<Record<string, CupAirtableTrackMeta>>(
    LS_CUP_TRACK_MAP_KEY,
    {}
  );
}

export function saveStoredCupTrackMap(
  map: Record<string, CupAirtableTrackMeta>
): void {
  writeLocalJson(LS_CUP_TRACK_MAP_KEY, map);
}

export function inferCupDefaultSlotAndMood(
  cup: CupRecord,
  cache?: AirtableWorkspaceCache | null
): { slot: PublishSlot; mood: string } {
  const stored = getStoredCupTrackMap()[cup.id];
  let slot: PublishSlot | undefined = stored?.slot || cup.props.publishSlot;
  let mood = (stored?.mood || cup.props.publishMood || '').trim();

  const effectiveCache = cache ?? cachedWorkspaceData;
  if ((!slot || !mood) && effectiveCache?.tables) {
    const fullQuoteNorm = normalizeForMatch(cup.props.segments.join(' '));
    const firstLineNorm = normalizeForMatch(cup.props.segments[0] || '');
    const captionFirstNorm = normalizeForMatch(
      (cup.props.customCaption || cup.captionText || '').split('\n')[0] || ''
    );

    for (const table of effectiveCache.tables) {
      if (table.name === TRACKER_TABLE_NAME) continue;
      for (const rec of table.records || []) {
        const f = rec.fields || {};
        const rawContent = String(
          f['Nội dung nguyên văn'] || f['Nội dung Trà Nguội'] || ''
        );
        const recNorm = normalizeForMatch(rawContent);
        const recCapFirst = normalizeForMatch(
          String(f['TikTok Caption'] || '').split('\n')[0] || ''
        );

        const matched =
          (recNorm &&
            firstLineNorm.length > 10 &&
            (recNorm.includes(firstLineNorm) ||
              fullQuoteNorm.includes(recNorm.slice(0, 26)))) ||
          (captionFirstNorm.length > 16 &&
            recCapFirst &&
            captionFirstNorm === recCapFirst);

        if (matched) {
          const rawSlot = airtableChoiceToSlot(f['Thời điểm phù hợp']);
          if (!slot && rawSlot) slot = rawSlot;
          if (!mood) {
            mood = String(
              f['Tone'] || f['Hiệu ứng cảm xúc'] || f['Kiểu chơi chữ'] || ''
            )
              .replace(/^\d+\s*-\s*/, '')
              .trim();
          }
          break;
        }
      }
    }
  }

  if (!slot) {
    slot =
      cup.props.themeId === 'MINIMAL_DARK' ||
      cup.props.themeId === 'WARM_NOIR' ||
      cup.props.themeId === 'DARK_CONTEMPLATIVE'
        ? 'Night'
        : cup.props.themeId === 'SLATE_CALM'
          ? 'Morning'
          : 'Anytime';
  }

  if (!mood) {
    const titleNorm = (cup.props.title || '').toLowerCase();
    if (/ký ức|kỷ niệm|cũ|nhớ/.test(titleNorm)) {
      mood = 'Hoài niệm';
    } else if (/ô|thương|duyên|say/.test(titleNorm)) {
      mood = 'Thả thính';
    } else if (/chấm công|lương|lốp/.test(titleNorm)) {
      mood = 'Tự trào';
    } else {
      mood =
        cup.props.motion.pacingMode === 'WRY_BATHOS' ? 'Tự trào' : 'Nhẹ nhàng';
    }
  }

  return { slot, mood };
}

function parseRemoteTnScoreNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const text = String(raw || '').trim();
  if (!text) return undefined;
  const m = text.match(/^(\d+(?:\.\d+)?)/);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

export function formatTnScoreSummaryLine(
  tnScore?: number,
  metrics?: TnMetrics,
  promotedQCode?: string
): string {
  if (tnScore === undefined || !Number.isFinite(tnScore)) return '';
  const evalRes = metrics ? computeTnScore(metrics) : null;
  const badge =
    tnScore >= 110
      ? '🚀 Bứt phá'
      : tnScore >= 75
        ? '🌿 Giữ nhịp'
        : tnScore >= 50
          ? '🌤️ Tối ưu'
          : '⚠️ Cảnh báo';
  const metricDetail = metrics
    ? ` (C:${metrics.completionRate ?? 0}% · W:${metrics.watchRatio ?? 0}x · Sh:${metrics.shareRate ?? 0}% · Sv:${metrics.saveRate ?? 0}% · Cm:${metrics.commentRate ?? 0}%)`
    : '';
  const promotedSuffix = promotedQCode ? ` · Đã lên ${promotedQCode}` : '';
  const scoreFixed = (evalRes ? evalRes.totalScore : tnScore).toFixed(1);
  return `${scoreFixed}đ · ${badge}${metricDetail}${promotedSuffix}`;
}

export function resolveEffectiveCupTrackMeta(
  cup: CupRecord,
  cache?: AirtableWorkspaceCache | null
): CupAirtableTrackMeta {
  const stored = cup.publishTrack || getStoredCupTrackMap()[cup.id];
  const { slot, mood } = inferCupDefaultSlotAndMood(cup, cache);

  let publishStatus: CupPublishStatus =
    stored?.publishStatus ||
    (cup.status === 'completed' ? 'rendered' : 'draft');

  if (publishStatus === 'draft' && cup.status === 'completed') {
    publishStatus = 'rendered';
  }

  const defaultSeed = generateSeedCommentForCup(cup.props, slot, mood);

  return {
    airtableRecordId: stored?.airtableRecordId,
    publishStatus,
    slot,
    mood,
    publishedDate: stored?.publishedDate,
    seedComment: stored?.seedComment || defaultSeed,
    tnMetrics: stored?.tnMetrics,
    tnScore: stored?.tnScore,
    promotedToQ: stored?.promotedToQ,
    promotedQCode: stored?.promotedQCode,
    syncedAt: stored?.syncedAt,
  };
}

export function hydrateCupsWithLocalTrack(cups: CupRecord[]): CupRecord[] {
  return cups.map((c) => ({
    ...c,
    publishTrack: resolveEffectiveCupTrackMeta(c),
  }));
}

export function classifyCupPortfolioBucket(cup: CupRecord): PortfolioBucketId {
  if ((cup.props.author || '').trim().length > 0) {
    return 'CLASSIC_LIT';
  }
  const mood = (cup.publishTrack?.mood || cup.props.publishMood || '').toLowerCase();
  const topic = (cup.props.publishTopic || '').toLowerCase();
  const corpus = [
    cup.props.title || '',
    cup.props.pivotWord || '',
    mood,
    topic,
    ...cup.props.segments,
  ]
    .join(' ')
    .toLowerCase();

  if (
    cup.props.motion?.pacingMode === 'WRY_BATHOS' ||
    /tự trào|hài hước|chơi chữ|công sở|mưu sinh/.test(`${mood} ${topic}`) ||
    /chấm công|quẹt thẻ|lương|sếp|deadline|văn phòng|lốp dự phòng|câu đơn|cơn đau/.test(
      corpus
    )
  ) {
    return 'WORK_WORDPLAY';
  }

  if (
    /thả thính|tình yêu/.test(`${mood} ${topic}`) ||
    /chiếc ô|che nghiêng|duyên đầu|thiệp hồng|thương anh|thương em|làm rượu|người thương/.test(
      corpus
    )
  ) {
    return 'FLIRT_ADULT';
  }

  return 'CONTEMPLATIVE';
}

export function computePortfolioMixSummary(
  cups: CupRecord[]
): PortfolioBucketStat[] {
  const counts: Record<PortfolioBucketId, number> = {
    WORK_WORDPLAY: 0,
    CONTEMPLATIVE: 0,
    FLIRT_ADULT: 0,
    CLASSIC_LIT: 0,
  };

  for (const cup of cups) {
    const bucket = classifyCupPortfolioBucket(cup);
    counts[bucket] += 1;
  }

  const total = Math.max(1, cups.length);
  return [
    {
      id: 'WORK_WORDPLAY',
      shortLabel: 'Công sở·Chơi chữ',
      targetPct: 40,
      actualPct: Math.round((counts.WORK_WORDPLAY / total) * 100),
      count: counts.WORK_WORDPLAY,
      colorClass: 'bg-tea-accent',
    },
    {
      id: 'CONTEMPLATIVE',
      shortLabel: 'Chiêm nghiệm',
      targetPct: 30,
      actualPct: Math.round((counts.CONTEMPLATIVE / total) * 100),
      count: counts.CONTEMPLATIVE,
      colorClass: 'bg-emerald-600',
    },
    {
      id: 'FLIRT_ADULT',
      shortLabel: 'Thả thính',
      targetPct: 20,
      actualPct: Math.round((counts.FLIRT_ADULT / total) * 100),
      count: counts.FLIRT_ADULT,
      colorClass: 'bg-amber-500',
    },
    {
      id: 'CLASSIC_LIT',
      shortLabel: 'Văn học',
      targetPct: 10,
      actualPct: Math.round((counts.CLASSIC_LIT / total) * 100),
      count: counts.CLASSIC_LIT,
      colorClass: 'bg-sky-600',
    },
  ];
}

function isSomberMood(mood: string): boolean {
  return /trầm buồn|hoài niệm|chua chát|hoài cổ|u buồn|cô đơn/i.test(
    mood.trim()
  );
}

export function detectConsecutiveSomberNightWarning(
  cups: CupRecord[]
): ConsecutiveSomberNightWarning | null {
  const ordered = [...cups].sort((a, b) => {
    const na = extractCupNumberInt(a.cupNumber || a.id) ?? 999;
    const nb = extractCupNumberInt(b.cupNumber || b.id) ?? 999;
    return na - nb;
  });

  const nightCups = ordered
    .map((cup) => ({
      cup,
      meta: resolveEffectiveCupTrackMeta(cup),
    }))
    .filter((item) => item.meta.slot === 'Night');

  for (let i = 1; i < nightCups.length; i++) {
    const prev = nightCups[i - 1];
    const curr = nightCups[i];
    if (isSomberMood(prev.meta.mood) && isSomberMood(curr.meta.mood)) {
      const labelA = `Chén ${prev.cup.cupNumber}`;
      const labelB = `Chén ${curr.cup.cupNumber}`;
      return {
        cupA: labelA,
        cupB: labelB,
        moodA: prev.meta.mood,
        moodB: curr.meta.mood,
        message: `${labelA} (${prev.meta.mood}) & ${labelB} (${curr.meta.mood}) cùng khung Tối trầm — nên xen 1 Chén Tối «Ấm áp / Nhẹ nhàng» ở giữa.`,
      };
    }
  }

  return null;
}

function extractCupNumberInt(cupNumberOrLabel: string): number | null {
  const m = cupNumberOrLabel.match(/(?:chén\s*)?0*(\d+)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

let trackerSupportsExtendedCols = true;

function buildTrackerFieldsPayload(
  cup: CupRecord,
  meta: CupAirtableTrackMeta,
  includeExtendedCols = trackerSupportsExtendedCols
): Record<string, unknown> {
  const paddedNum = String(cup.cupNumber || '01').padStart(2, '0');
  const titleText = (cup.props.title || 'Trà Nguội').trim();
  const primaryLabel = `Chén ${paddedNum} — ${titleText}`;

  const captionText = resolveCupCaption(cup.id, cup.props);
  const quoteLines = cup.props.segments
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
  const videoScriptSummary = cup.props.pivotWord
    ? `${quoteLines}\n\n[Nhấn đỏ: ${cup.props.pivotWord}]`
    : quoteLines;

  const mp4FileName = `${formatCupBaseFileName(
    paddedNum,
    cup.props.title
  )}.mp4`;
  const seoMp4FileName =
    cup.seoFileName ||
    `${formatCupSeoFileName(paddedNum, {
      title: cup.props.title,
      pivotWord: cup.props.pivotWord,
      mood: meta.mood || cup.props.publishMood,
      topic: cup.props.publishTopic,
    })}.mp4`;
  const foleyTag = ' · 🍵 Foley -14 LUFS';
  const fileStatusText =
    cup.status === 'completed'
      ? `${seoMp4FileName} (${mp4FileName})${foleyTag}`
      : `(Đang nháp) ${seoMp4FileName}${foleyTag}`;

  const fields: Record<string, unknown> = {
    'Mã Chén': primaryLabel,
    'Trạng thái': statusToAirtableChoice(meta.publishStatus),
    'Khung giờ hợp': slotToAirtableChoice(meta.slot),
    Mood: meta.mood || 'Nhẹ nhàng',
    'Caption & Hashtag': captionText,
    'Lời dẫn trong video': videoScriptSummary,
    'Tên file MP4': fileStatusText,
  };

  if (meta.publishedDate) {
    fields['Ngày đăng'] = meta.publishedDate;
  }

  if (includeExtendedCols) {
    const seedText =
      (meta.seedComment || '').trim() ||
      generateSeedCommentForCup(cup.props, meta.slot, meta.mood);
    fields['Bình luận mồi'] = seedText;

    const tnSummary = formatTnScoreSummaryLine(
      meta.tnScore,
      meta.tnMetrics,
      meta.promotedQCode
    );
    if (tnSummary) {
      fields['TN-Score (7 ngày)'] = tnSummary;
    }
  }

  return fields;
}

async function ensureExtendedTrackerFieldsOnExistingTable(
  token: string,
  baseId: string,
  tableId: string,
  existingFields: AirtableFieldMeta[]
): Promise<void> {
  const existingNames = new Set(
    existingFields.map((f) => f.name.trim().toLowerCase())
  );

  const requiredExtra: Array<{
    name: string;
    type: string;
    description: string;
  }> = [
    {
      name: 'Bình luận mồi',
      type: 'multilineText',
      description:
        'Câu bình luận mồi Quán Trà thả ngay giây đầu sau khi đăng để kích hoạt Watch Ratio',
    },
    {
      name: 'TN-Score (7 ngày)',
      type: 'singleLineText',
      description:
        'Điểm cộng hưởng TN-Score đo sau 7 ngày đăng và trạng thái thăng hạng W -> Q',
    },
  ];

  for (const col of requiredExtra) {
    if (existingNames.has(col.name.toLowerCase())) continue;
    try {
      await callAirtableProxy(
        `/meta/bases/${encodeURIComponent(baseId)}/tables/${encodeURIComponent(tableId)}/fields`,
        token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(col),
        }
      );
      trackerSupportsExtendedCols = true;
    } catch {
      trackerSupportsExtendedCols = false;
    }
  }
}

async function ensureCupTrackerTableId(
  token: string,
  baseId: string
): Promise<string> {
  const schemaRes = await callAirtableProxy<{
    tables: Array<{ id: string; name: string; fields?: AirtableFieldMeta[] }>;
  }>(`/meta/bases/${encodeURIComponent(baseId)}/tables`, token);

  const wanted = TRACKER_TABLE_NAME.trim().toLowerCase();
  const existing = (schemaRes.tables || []).find(
    (t) => t.name.trim().toLowerCase() === wanted
  );
  if (existing) {
    window.localStorage.setItem(LS_TRACKER_TABLE_ID_KEY, existing.id);
    await ensureExtendedTrackerFieldsOnExistingTable(
      token,
      baseId,
      existing.id,
      existing.fields || []
    );
    return existing.id;
  }

  const baseFields = [
    {
      name: 'Mã Chén',
      type: 'singleLineText',
      description:
        'Định danh Chén hiển thị đầu thẻ trên điện thoại (VD: Chén 08 — Chiếc ô)',
    },
    {
      name: 'Trạng thái',
      type: 'singleSelect',
      description: 'Tiến độ dựng và đăng lên kênh @tranguoi.15s',
      options: {
        choices: [
          { name: '📝 Bản nháp', color: 'grayLight2' },
          { name: '🎬 Đã xuất MP4', color: 'yellowLight2' },
          { name: '⏳ Chờ đăng', color: 'cyanLight2' },
          { name: '✅ Đã đăng TikTok', color: 'greenLight2' },
        ],
      },
    },
    {
      name: 'Khung giờ hợp',
      type: 'singleSelect',
      description: 'Buổi đăng phù hợp để lọc bài nhanh trên điện thoại',
      options: {
        choices: [
          { name: '🌅 Sáng (06:30–08:30)', color: 'yellowLight2' },
          { name: '🌤️ Trưa–Chiều', color: 'greenLight2' },
          { name: '🌙 Tối muộn (21:30–23:00)', color: 'blueLight2' },
        ],
      },
    },
    {
      name: 'Mood',
      type: 'singleSelect',
      description: 'Nhãn cảm xúc để phân bổ bài không bị lặp mood liên tiếp',
      options: {
        choices: [
          { name: 'Nhẹ nhàng', color: 'greenLight2' },
          { name: 'Thả thính', color: 'redLight2' },
          { name: 'Tự trào', color: 'yellowLight2' },
          { name: 'Hoài niệm', color: 'blueLight2' },
          { name: 'Suy tư', color: 'cyanLight2' },
          { name: 'Ấm áp', color: 'tealLight2' },
          { name: 'Trầm buồn', color: 'grayLight2' },
          { name: 'Hài hước', color: 'blueLight2' },
          { name: 'Thi vị', color: 'tealLight2' },
        ],
      },
    },
    {
      name: 'Caption & Hashtag',
      type: 'multilineText',
      description:
        'Câu dẫn kèm bộ hashtag chuẩn sạch để chạm giữ copy thẳng sang TikTok',
    },
    {
      name: 'Bình luận mồi',
      type: 'multilineText',
      description:
        'Câu bình luận mồi Quán Trà thả ngay giây đầu sau khi đăng để kích hoạt Watch Ratio',
    },
    {
      name: 'Lời dẫn trong video',
      type: 'multilineText',
      description: 'Toàn bộ câu thơ/văn xuôi kèm từ khóa nhấn Đỏ Chu Sa',
    },
    {
      name: 'Tên file MP4',
      type: 'singleLineText',
      description: 'Tên file video kết xuất chuẩn SEO kèm chuẩn âm thanh Foley -14 LUFS',
    },
    {
      name: 'TN-Score (7 ngày)',
      type: 'singleLineText',
      description:
        'Điểm cộng hưởng TN-Score đo sau 7 ngày đăng và trạng thái thăng hạng W -> Q',
    },
  ];

  try {
    const created = await callAirtableProxy<{ id: string; name: string }>(
      `/meta/bases/${encodeURIComponent(baseId)}/tables`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: TRACKER_TABLE_NAME,
          description:
            'Bảng quản lý toàn bộ các Chén đã tạo, đã xuất MP4, bình luận mồi, điểm TN-Score và lịch đăng lên kênh @tranguoi.15s.',
          fields: [
            ...baseFields,
            {
              name: 'Ngày đăng',
              type: 'date',
              options: { dateFormat: { name: 'iso' } },
            },
          ],
        }),
      }
    );
    trackerSupportsExtendedCols = true;
    window.localStorage.setItem(LS_TRACKER_TABLE_ID_KEY, created.id);
    return created.id;
  } catch {
    const createdFallback = await callAirtableProxy<{
      id: string;
      name: string;
    }>(`/meta/bases/${encodeURIComponent(baseId)}/tables`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TRACKER_TABLE_NAME,
        description:
          'Bảng quản lý toàn bộ các Chén đã tạo, đã xuất MP4, bình luận mồi, điểm TN-Score và lịch đăng lên kênh @tranguoi.15s.',
        fields: [
          ...baseFields,
          {
            name: 'Ngày đăng',
            type: 'singleLineText',
            description: 'Ngày lên sóng (YYYY-MM-DD)',
          },
        ],
      }),
    });
    trackerSupportsExtendedCols = true;
    window.localStorage.setItem(LS_TRACKER_TABLE_ID_KEY, createdFallback.id);
    return createdFallback.id;
  }
}

async function listAllTableRecords(
  token: string,
  baseId: string,
  tableId: string
): Promise<AirtableRecordItem[]> {
  const all: AirtableRecordItem[] = [];
  let offset: string | undefined;
  do {
    const qs = new URLSearchParams({ pageSize: '100' });
    if (offset) qs.set('offset', offset);
    const page = await callAirtableProxy<{
      records: AirtableRecordItem[];
      offset?: string;
    }>(
      `/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}?${qs.toString()}`,
      token
    );
    if (Array.isArray(page.records)) {
      all.push(...page.records);
    }
    offset = page.offset;
  } while (offset && all.length < 400);
  return all;
}

let inFlightFullTrackerSync: Promise<{
  tableId: string;
  trackMap: Record<string, CupAirtableTrackMeta>;
  createdCount: number;
  updatedCount: number;
}> | null = null;

export async function syncAllCupsToAirtableTracker(
  cups: CupRecord[]
): Promise<{
  tableId: string;
  trackMap: Record<string, CupAirtableTrackMeta>;
  createdCount: number;
  updatedCount: number;
}> {
  if (inFlightFullTrackerSync) {
    return inFlightFullTrackerSync;
  }

  inFlightFullTrackerSync = (async () => {
    const token = (window.localStorage.getItem(AIRTABLE_PAT_KEY) || '').trim();
    if (!token) {
      throw new Error(
        'Chưa có mã kết nối Airtable. Hãy bấm nút "Airtable" trên thanh công cụ để dán mã pat... trước.'
      );
    }

    const cache = await loadCachedAirtableWorkspace();
    const baseId = cache?.selectedBaseId || DEFAULT_TRA_NGUOI_BASE_ID;
    const tableId = await ensureCupTrackerTableId(token, baseId);
    const existingRecords = await listAllTableRecords(token, baseId, tableId);

    const existingByCupInt = new Map<number, AirtableRecordItem>();
    for (const rec of existingRecords) {
      const label = String(rec.fields['Mã Chén'] || '');
      const num = extractCupNumberInt(label);
      if (num !== null && !existingByCupInt.has(num)) {
        existingByCupInt.set(num, rec);
      }
    }

    const storedMap = getStoredCupTrackMap();
    const nextMap: Record<string, CupAirtableTrackMeta> = { ...storedMap };

    const toCreate: Array<{
      cup: CupRecord;
      cupId: string;
      meta: CupAirtableTrackMeta;
      fields: Record<string, unknown>;
    }> = [];
    const toPatch: Array<{
      id: string;
      cup: CupRecord;
      cupId: string;
      meta: CupAirtableTrackMeta;
      fields: Record<string, unknown>;
    }> = [];

    const sortedCups = [...cups].sort((a, b) => {
      const na = extractCupNumberInt(a.cupNumber || a.id) ?? 999;
      const nb = extractCupNumberInt(b.cupNumber || b.id) ?? 999;
      return na - nb;
    });

    for (const cup of sortedCups) {
      const cupInt = extractCupNumberInt(cup.cupNumber || cup.id);
      const remoteRec =
        cupInt !== null ? existingByCupInt.get(cupInt) : undefined;
      const inferred = inferCupDefaultSlotAndMood(cup, cache);
      const prevLocal = storedMap[cup.id];

      if (remoteRec) {
        const remoteStatus = airtableChoiceToStatus(
          remoteRec.fields['Trạng thái']
        );
        const remoteSlot = airtableChoiceToSlot(
          remoteRec.fields['Khung giờ hợp']
        );
        const remoteMood = String(remoteRec.fields['Mood'] || '').trim();
        const remoteDate = remoteRec.fields['Ngày đăng']
          ? String(remoteRec.fields['Ngày đăng']).trim()
          : undefined;
        const remoteSeed = remoteRec.fields['Bình luận mồi']
          ? String(remoteRec.fields['Bình luận mồi']).trim()
          : undefined;
        const remoteTn = parseRemoteTnScoreNumber(
          remoteRec.fields['TN-Score (7 ngày)']
        );

        let mergedStatus: CupPublishStatus =
          remoteStatus ||
          prevLocal?.publishStatus ||
          (cup.status === 'completed' ? 'rendered' : 'draft');

        if (mergedStatus === 'draft' && cup.status === 'completed') {
          mergedStatus = 'rendered';
        }

        const effectiveSlot = cup.props.publishSlot || remoteSlot || inferred.slot;
        const effectiveMood = cup.props.publishMood || remoteMood || inferred.mood;

        const mergedMeta: CupAirtableTrackMeta = {
          airtableRecordId: remoteRec.id,
          publishStatus: mergedStatus,
          slot: effectiveSlot,
          mood: effectiveMood,
          publishedDate: remoteDate || prevLocal?.publishedDate,
          seedComment:
            prevLocal?.seedComment ||
            remoteSeed ||
            generateSeedCommentForCup(cup.props, effectiveSlot, effectiveMood),
          tnMetrics: prevLocal?.tnMetrics,
          tnScore: prevLocal?.tnScore ?? remoteTn,
          promotedToQ: prevLocal?.promotedToQ,
          promotedQCode: prevLocal?.promotedQCode,
          syncedAt: new Date().toISOString(),
        };

        nextMap[cup.id] = mergedMeta;
        toPatch.push({
          id: remoteRec.id,
          cup,
          cupId: cup.id,
          meta: mergedMeta,
          fields: buildTrackerFieldsPayload(cup, mergedMeta),
        });
      } else {
        const initStatus: CupPublishStatus =
          prevLocal?.publishStatus ||
          (cup.status === 'completed' ? 'rendered' : 'draft');
        const effectiveSlot = cup.props.publishSlot || inferred.slot;
        const effectiveMood = cup.props.publishMood || inferred.mood;

        const initMeta: CupAirtableTrackMeta = {
          publishStatus:
            initStatus === 'draft' && cup.status === 'completed'
              ? 'rendered'
              : initStatus,
          slot: effectiveSlot,
          mood: effectiveMood,
          publishedDate: prevLocal?.publishedDate,
          seedComment:
            prevLocal?.seedComment ||
            generateSeedCommentForCup(cup.props, effectiveSlot, effectiveMood),
          tnMetrics: prevLocal?.tnMetrics,
          tnScore: prevLocal?.tnScore,
          promotedToQ: prevLocal?.promotedToQ,
          promotedQCode: prevLocal?.promotedQCode,
          syncedAt: new Date().toISOString(),
        };

        nextMap[cup.id] = initMeta;
        toCreate.push({
          cup,
          cupId: cup.id,
          meta: initMeta,
          fields: buildTrackerFieldsPayload(cup, initMeta),
        });
      }
    }

    let createdCount = 0;
    for (let i = 0; i < toCreate.length; i += 10) {
      const chunk = toCreate.slice(i, i + 10);
      let createdRes: { records: AirtableRecordItem[] };
      try {
        createdRes = await callAirtableProxy<{
          records: AirtableRecordItem[];
        }>(
          `/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`,
          token,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              records: chunk.map((item) => ({ fields: item.fields })),
              typecast: true,
            }),
          }
        );
      } catch {
        trackerSupportsExtendedCols = false;
        createdRes = await callAirtableProxy<{
          records: AirtableRecordItem[];
        }>(
          `/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`,
          token,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              records: chunk.map((item) => ({
                fields: buildTrackerFieldsPayload(item.cup, item.meta, false),
              })),
              typecast: true,
            }),
          }
        );
      }

      (createdRes.records || []).forEach((rec, idx) => {
        const targetItem = chunk[idx];
        if (targetItem && rec?.id) {
          nextMap[targetItem.cupId] = {
            ...nextMap[targetItem.cupId],
            airtableRecordId: rec.id,
            syncedAt: new Date().toISOString(),
          };
        }
      });
      createdCount += chunk.length;
    }

    let updatedCount = 0;
    for (let i = 0; i < toPatch.length; i += 10) {
      const chunk = toPatch.slice(i, i + 10);
      try {
        await callAirtableProxy(
          `/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`,
          token,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              records: chunk.map((item) => ({
                id: item.id,
                fields: item.fields,
              })),
              typecast: true,
            }),
          }
        );
      } catch {
        trackerSupportsExtendedCols = false;
        await callAirtableProxy(
          `/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`,
          token,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              records: chunk.map((item) => ({
                id: item.id,
                fields: buildTrackerFieldsPayload(item.cup, item.meta, false),
              })),
              typecast: true,
            }),
          }
        );
      }
      updatedCount += chunk.length;
    }

    saveStoredCupTrackMap(nextMap);
    return {
      tableId,
      trackMap: nextMap,
      createdCount,
      updatedCount,
    };
  })().finally(() => {
    inFlightFullTrackerSync = null;
  });

  return inFlightFullTrackerSync;
}

export async function upsertSingleCupOnAirtableTracker(
  cup: CupRecord,
  overridePatch?: Partial<CupAirtableTrackMeta>
): Promise<CupAirtableTrackMeta> {
  const token = (window.localStorage.getItem(AIRTABLE_PAT_KEY) || '').trim();
  const cache = await loadCachedAirtableWorkspace();
  const current = resolveEffectiveCupTrackMeta(cup, cache);

  const nextStatus = overridePatch?.publishStatus ?? current.publishStatus;
  const todayIso = new Date().toISOString().slice(0, 10);
  const nextPublishedDate =
    overridePatch?.publishedDate !== undefined
      ? overridePatch.publishedDate
      : nextStatus === 'published'
        ? current.publishedDate || todayIso
        : current.publishedDate;

  const nextMeta: CupAirtableTrackMeta = {
    ...current,
    ...overridePatch,
    publishStatus: nextStatus,
    publishedDate: nextPublishedDate,
    syncedAt: new Date().toISOString(),
  };

  const map = getStoredCupTrackMap();
  map[cup.id] = nextMeta;
  saveStoredCupTrackMap(map);

  if (!token) {
    throw new Error(
      'Chưa kết nối Airtable. Hãy bấm nút "Airtable" trên thanh công cụ để dán mã pat... 1 lần.'
    );
  }

  const baseId = cache?.selectedBaseId || DEFAULT_TRA_NGUOI_BASE_ID;
  const tableId = await ensureCupTrackerTableId(token, baseId);

  let recordId = nextMeta.airtableRecordId;
  if (!recordId) {
    const existingRecords = await listAllTableRecords(token, baseId, tableId);
    const wantedNum = extractCupNumberInt(cup.cupNumber || cup.id);
    const matched = existingRecords.find(
      (r) =>
        extractCupNumberInt(String(r.fields['Mã Chén'] || '')) === wantedNum
    );
    if (matched) {
      recordId = matched.id;
    }
  }

  const writeRecord = async (includeExtended: boolean) => {
    const fields = buildTrackerFieldsPayload(cup, nextMeta, includeExtended);
    if (recordId) {
      await callAirtableProxy(
        `/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`,
        token,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records: [{ id: recordId, fields }],
            typecast: true,
          }),
        }
      );
      nextMeta.airtableRecordId = recordId;
    } else {
      const created = await callAirtableProxy<{
        records: AirtableRecordItem[];
      }>(
        `/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`,
        token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records: [{ fields }],
            typecast: true,
          }),
        }
      );
      nextMeta.airtableRecordId = created.records?.[0]?.id;
    }
  };

  try {
    await writeRecord(trackerSupportsExtendedCols);
  } catch {
    trackerSupportsExtendedCols = false;
    await writeRecord(false);
  }

  const latestMap = getStoredCupTrackMap();
  latestMap[cup.id] = nextMeta;
  saveStoredCupTrackMap(latestMap);
  return nextMeta;
}

export async function promoteWordplayCupToQuoteLibrary(
  cup: CupRecord,
  tnScore: number,
  metrics?: TnMetrics
): Promise<{
  qCode: string;
  updatedWordplayId?: string;
  meta: CupAirtableTrackMeta;
}> {
  const token = (window.localStorage.getItem(AIRTABLE_PAT_KEY) || '').trim();
  if (!token) {
    throw new Error(
      'Chưa kết nối Airtable. Hãy bấm nút "Airtable" trên thanh công cụ để dán mã pat... trước.'
    );
  }

  const cache = await loadCachedAirtableWorkspace();
  const baseId = cache?.selectedBaseId || DEFAULT_TRA_NGUOI_BASE_ID;
  const currentMeta = resolveEffectiveCupTrackMeta(cup, cache);

  const fullQuoteText = cup.props.segments
    .map((s) => s.replace(/\*+/g, '').trim())
    .filter(Boolean)
    .join('\n');
  const firstLineNorm = normalizeForMatch(cup.props.segments[0] || '');
  const fullQuoteNorm = normalizeForMatch(fullQuoteText);

  const qRecords = await listAllTableRecords(
    token,
    baseId,
    QUOTE_LIBRARY_TABLE_ID
  );
  let maxQNum = 42;
  let existingQCode: string | undefined;

  for (const rec of qRecords) {
    const rawId = String(rec.fields['ID'] || '').trim();
    const m = rawId.match(/^Q0*(\d+)$/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxQNum) maxQNum = n;
    }
    const qContentNorm = normalizeForMatch(
      String(rec.fields['Nội dung nguyên văn'] || '')
    );
    if (
      qContentNorm &&
      firstLineNorm.length > 10 &&
      (qContentNorm === fullQuoteNorm || qContentNorm.includes(firstLineNorm))
    ) {
      existingQCode = rawId || `Q${String(maxQNum).padStart(3, '0')}`;
    }
  }

  let updatedWordplayId: string | undefined;
  try {
    const wRecords = await listAllTableRecords(
      token,
      baseId,
      WORDPLAY_LAB_TABLE_ID
    );
    const matchedW = wRecords.find((rec) => {
      const wContentNorm = normalizeForMatch(
        String(
          rec.fields['Nội dung Trà Nguội'] || rec.fields['Hạt nhân gốc'] || ''
        )
      );
      return (
        wContentNorm.length > 10 &&
        (wContentNorm.includes(firstLineNorm) ||
          fullQuoteNorm.includes(wContentNorm.slice(0, 24)))
      );
    });

    if (matchedW) {
      await callAirtableProxy(
        `/${encodeURIComponent(baseId)}/${encodeURIComponent(WORDPLAY_LAB_TABLE_ID)}`,
        token,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records: [
              {
                id: matchedW.id,
                fields: {
                  'Trạng thái dùng': 'Đã chuyển sang Kho Q',
                },
              },
            ],
            typecast: true,
          }),
        }
      );
      updatedWordplayId = String(matchedW.fields['ID'] || matchedW.id);
    }
  } catch {
    // Không chặn luồng tạo Q nếu bảng W không khớp
  }

  let finalQCode = existingQCode;
  if (!finalQCode) {
    finalQCode = `Q${String(maxQNum + 1).padStart(3, '0')}`;
    const bucket = classifyCupPortfolioBucket(cup);
    const topicChoice =
      bucket === 'WORK_WORDPLAY'
        ? 'Mưu sinh'
        : bucket === 'FLIRT_ADULT'
          ? 'Tình yêu'
          : 'Chiêm nghiệm';
    const loaiChoice =
      cup.props.textFormat === 'POEM'
        ? bucket === 'WORK_WORDPLAY'
          ? 'Thơ hài'
          : 'Thơ'
        : 'Quote';

    await callAirtableProxy(
      `/${encodeURIComponent(baseId)}/${encodeURIComponent(QUOTE_LIBRARY_TABLE_ID)}`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [
            {
              fields: {
                ID: finalQCode,
                'Nội dung nguyên văn': fullQuoteText,
                Loại: loaiChoice,
                'Chủ đề': topicChoice,
                Tone: currentMeta.mood || 'Tự trào',
                Visual: 'Cao',
                'Trạng thái': 'Đã lưu',
                'Caption Status': 'Published',
                'Thời điểm phù hợp': currentMeta.slot,
                'TikTok Caption': resolveCupCaption(cup.id, cup.props),
              },
            },
          ],
          typecast: true,
        }),
      }
    );
  }

  const syncedMeta = await upsertSingleCupOnAirtableTracker(cup, {
    tnScore,
    tnMetrics: metrics ?? currentMeta.tnMetrics,
    promotedToQ: true,
    promotedQCode: finalQCode,
  });

  return {
    qCode: finalQCode,
    updatedWordplayId,
    meta: syncedMeta,
  };
}
