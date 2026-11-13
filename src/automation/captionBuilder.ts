import { VideoInputProps } from '../schemas/videoSchema';

interface CaptionArchetypeRule {
  id: string;
  match: RegExp;
  line1SeoHook: string;
  line2Prompt: string;
  hashtags: [string, string, string, string, string];
}

const BANNED_GENERIC_HASHTAGS = new Set([
  '#fyp',
  '#foryou',
  '#foryoupage',
  '#xuhuong',
  '#viral',
  '#trending',
]);

export interface CaptionSeoAudit {
  hashtagCount: number;
  hasBrandTag: boolean;
  bannedTags: string[];
  duplicatesQuoteVerbatim: boolean;
  hookLength: number;
  isClean: boolean;
}

export interface TnMetricsInput {
  completionRate?: number;
  watchRatio?: number;
  shareRate?: number;
  saveRate?: number;
  commentRate?: number;
}

export type TnScoreBand = 'breakout' | 'steady' | 'watch' | 'warning';

export interface TnScoreResult {
  totalScore: number;
  band: TnScoreBand;
  bandLabel: string;
  diagnostic: string;
  breakdown: {
    completionPts: number;
    watchRatioPts: number;
    sharePts: number;
    savePts: number;
    commentPts: number;
  };
}

const CAPTION_ARCHETYPE_RULES: CaptionArchetypeRule[] = [
  {
    id: 'office_morning_lunch_daydream',
    match: /chấm công|quẹt chiếc thẻ|quẹt thẻ|mở máy|ngóng trông trưa về|đầu giờ|dân văn phòng/i,
    line1SeoHook:
      'Quẹt thẻ đầu giờ khí thế ngút trời, mở máy chưa ấm tay đã ngóng tới giờ nghỉ trưa.',
    line2Prompt:
      'Sáng nay vừa ngồi vào bàn làm việc bạn đã nghĩ trưa nay ăn gì chưa?',
    hashtags: [
      '#tranguoi',
      '#danvanphong',
      '#chamcong',
      '#haihuoc',
      '#thohay',
    ],
  },
  {
    id: 'adult_reality_darkness_refuge',
    match: /quái vật đáng sợ nhất|thực tế cuộc sống|nơi an toàn nhất|trốn chạy|sợ bóng tối/i,
    line1SeoHook:
      'Ngày bé sợ bóng tối giấu quái vật, lớn lên mới biết đời thực ngoài kia còn đáng sợ hơn nhiều.',
    line2Prompt:
      'Đêm nay tắt bớt đèn, cho phép mình trốn vào một góc lặng bình yên nhé?',
    hashtags: [
      '#tranguoi',
      '#truongthanh',
      '#apluccuocsong',
      '#gocbinhyen',
      '#suyngam',
    ],
  },
  {
    id: 'self_worth_spare_tire',
    match: /lốp dự phòng|cốp xe|phương án dự phòng|thay thế|khi cần mới nhớ|lựa chọn thứ hai/i,
    line1SeoHook:
      'Chỉ được nhớ đến lúc họ chênh vênh, rồi lại lặng lẽ nằm sau cốp xe khi đường đã êm.',
    line2Prompt:
      'Đừng mãi làm phương án dự phòng trong hành trình của người khác nữa, nhé?',
    hashtags: [
      '#tranguoi',
      '#lopduphong',
      '#giatribanthan',
      '#suyngam',
      '#trichdan',
    ],
  },
  {
    id: 'unrequited_love',
    match: /câu đơn|cơn đau|đơn phương|thương anh|thương em|chưa kịp nói|thầm thương/i,
    line1SeoHook:
      'Tình đơn phương gói trong một câu ngắn, nhưng bóng chiều ở lại thì rất dài.',
    line2Prompt: 'Có lời thương nào bạn vẫn cất giữ cho riêng mình chưa?',
    hashtags: [
      '#tranguoi',
      '#tinhdonphuong',
      '#thotinhbuon',
      '#trichdan',
      '#tamtrang',
    ],
  },
  {
    id: 'wedding_card_ex',
    match: /gửi thiệp|thiệp hồng|làm dâu|người xưa|tình cũ|lên xe hoa|áo cưới/i,
    line1SeoHook:
      'Người cũ hỏi thăm ngày trở gió, mở ra mới hay là tấm thiệp hồng.',
    line2Prompt:
      'Mỉm cười chúc phúc người ta, còn mình ngồi lại với chén trà ấm nhé?',
    hashtags: [
      '#tranguoi',
      '#nguoicu',
      '#thotinhbuon',
      '#trichdan',
      '#chualanh',
    ],
  },
  {
    id: 'cloud_wine_first_love',
    match: /gom mây|làm rượu|duyên đầu|men quá gắt|say tỉnh|chẳng còn nhau/i,
    line1SeoHook:
      'Mối tình đầu ủ bằng mây trời nên men say mới gắt đến thế.',
    line2Prompt:
      'Qua cơn chếnh choáng rồi, ký ức trong bạn là vị ngọt hay cay?',
    hashtags: [
      '#tranguoi',
      '#moiduyendau',
      '#thohay',
      '#trichdan',
      '#tamtrang',
    ],
  },
  {
    id: 'parting_after_storm',
    match: /giông bão|rẽ ngang|ngược lối|nắng đẹp|đi cùng ta|chia xa|lạc nhau/i,
    line1SeoHook:
      'Cùng nhau đi hết mùa giông bão, lại lặng lẽ rẽ ngang vào ngày nắng đẹp.',
    line2Prompt:
      'Có ai từng chỉ ghé che chung với bạn một đoạn mưa như thế chưa?',
    hashtags: [
      '#tranguoi',
      '#nguocloi',
      '#suyngam',
      '#trichdan',
      '#chualanh',
    ],
  },
  {
    id: 'zen_inner_peace',
    match: /quán trọ|nhân gian|an nhiên|bình yên|dâu bể|không nợ không sầu|kiếp sau|mây trắng/i,
    line1SeoHook:
      'Giữa quán trọ nhân gian lắm đổi dời, bình thản là câu trả lời dịu dàng nhất.',
    line2Prompt: 'Dạo này lòng bạn đã nhẹ hơn những ngày trước chút nào chưa?',
    hashtags: [
      '#tranguoi',
      '#binhyen',
      '#trietlycuocsong',
      '#chualanh',
      '#trichdan',
    ],
  },
  {
    id: 'burnout_adulthood',
    match: /mệt mỏi|cơm áo|gạo tiền|áp lực|trưởng thành|mai tính|nghỉ ngơi|gồng|công việc|lương/i,
    line1SeoHook:
      'Những ngày trưởng thành mỏi vai, cứ ngồi nghỉ uống ngụm trà rồi mai tính tiếp.',
    line2Prompt: 'Hôm nay của bạn có vất vả lắm không?',
    hashtags: [
      '#tranguoi',
      '#truongthanh',
      '#chualanh',
      '#suyngam',
      '#trichdan',
    ],
  },
  {
    id: 'home_family',
    match: /mẹ|cha|nhà|quê|cơm nóng|khói bếp|trở về/i,
    line1SeoHook:
      'Đi qua bao phố thị ồn ào mới thấy chẳng đâu bình yên bằng bữa cơm nhà.',
    line2Prompt:
      'Bao lâu rồi bạn chưa thu xếp được một chiều thảnh thơi về quê?',
    hashtags: [
      '#tranguoi',
      '#veque',
      '#giadinh',
      '#chualanh',
      '#trichdan',
    ],
  },
  {
    id: 'late_night_rain',
    match: /đêm|khuya|mưa|cô đơn|một mình|lạnh|rét|ký ức|kỷ niệm/i,
    line1SeoHook:
      'Đêm trở gió đọc lại đôi dòng thơ trầm, giữ một khoảng lặng cho riêng mình.',
    line2Prompt:
      'Giờ này bạn còn thức vì công việc hay vì một nỗi niềm chưa ngủ?',
    hashtags: [
      '#tranguoi',
      '#demkhuya',
      '#tamtrang',
      '#thohay',
      '#trichdan',
    ],
  },
];

/**
 * Tinh thần Trà Nguội: Kiệm lời mà thấm sâu (~2 dòng ngắn + 3–5 Hashtag phân tầng):
 * - Dòng 1: Chứa từ khóa tìm kiếm tự nhiên + ngữ cảnh bổ sung (không lặp nguyên văn quote).
 * - Dòng 2: 1 câu hỏi mở nhẹ như tiếng thủ thỉ để khơi gợi bình luận.
 * - Dòng 3: 3–5 Hashtag phân tầng (#tranguoi cố định + từ khóa cụ thể + danh mục + cộng đồng).
 */
export function generateSeoCaptionForCup(
  _id: string,
  props: Pick<VideoInputProps, 'segments' | 'title' | 'pivotWord' | 'author'>
): string {
  const fullCorpus = [
    props.title ?? '',
    props.pivotWord ?? '',
    ...props.segments,
  ].join(' ');

  const matched = CAPTION_ARCHETYPE_RULES.find((rule) =>
    rule.match.test(fullCorpus)
  );

  if (matched) {
    return [
      matched.line1SeoHook,
      matched.line2Prompt,
      '',
      matched.hashtags.join(' '),
    ].join('\n');
  }

  const cleanTitle = (props.title ?? '').trim().toLowerCase();
  const cleanPivot = (props.pivotWord ?? '')
    .replace(/[*.,!?…]+/g, '')
    .trim()
    .toLowerCase();

  const line1 = cleanTitle
    ? `Đôi dòng ngẫm về "${cleanTitle}" cho những ngày muốn sống chậm lại một nhịp.`
    : cleanPivot
      ? `Chút khoảng lặng chạm đúng khoảnh khắc "${cleanPivot}" giữa bộn bề thường nhật.`
      : 'Chát một chút ở đầu môi, nhưng dịu lại ở câu cuối cùng.';

  const topicTag = cleanTitle
    ? `#${cleanTitle
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, 'd')
        .replace(/[^a-z0-9]/gi, '')}`
    : '#songcham';

  const safeTopicTag =
    topicTag.length > 2 && !BANNED_GENERIC_HASHTAGS.has(topicTag)
      ? topicTag
      : '#songcham';

  return [
    line1,
    'Câu chữ nào hôm nay chạm đúng tâm trạng của bạn nhất?',
    '',
    `#tranguoi ${safeTopicTag} #chiemnghiem #thohay #chualanh`,
  ].join('\n');
}

export function resolveCupCaption(
  id: string,
  props: VideoInputProps
): string {
  const custom = (props.customCaption ?? '').trim();
  if (custom.length > 0) {
    return custom;
  }
  return generateSeoCaptionForCup(id, props);
}

/**
 * Động cơ "Quán Trà Dưới Phần Bình Luận" (Comment Dwell-Time Engine):
 * Khi độc giả đọc và gõ bình luận, video 15s phía sau tự lặp nền giúp kéo Watch Ratio > 1.10x.
 * - Với Chén Chơi chữ / Công sở (Xưởng W): gợi đố nói lái / đảo vế quanh pivotWord, hẹn vẽ tặng thành Chén mới.
 * - Với Chén Đêm muộn (Night / DARK_CONTEMPLATIVE): lời thủ thỉ trầm ấm giữ hộ tâm sự trước giờ ngủ, không khuyên răn.
 * - Với Chén Thả thính / Sống chậm ban ngày: câu hỏi mở duyên dáng mời kể lại một lát cắt đời thực.
 */
export function generateSeedCommentForCup(
  props: Pick<
    VideoInputProps,
    | 'segments'
    | 'title'
    | 'pivotWord'
    | 'author'
    | 'themeId'
    | 'publishSlot'
    | 'publishMood'
    | 'publishTopic'
    | 'motion'
  >,
  overrideSlot?: 'Morning' | 'Anytime' | 'Night',
  overrideMood?: string
): string {
  const effectiveSlot = overrideSlot || props.publishSlot;
  const effectiveMood = (overrideMood || props.publishMood || '').trim();
  const cleanPivot = (props.pivotWord || '')
    .replace(/[*.,!?…""''“”]+/g, '')
    .trim();
  const cleanTitle = (props.title || '').trim();
  const corpus = [
    cleanTitle,
    cleanPivot,
    effectiveMood,
    props.publishTopic || '',
    ...props.segments,
  ]
    .join(' ')
    .toLowerCase();

  const isNightContemplative =
    effectiveSlot === 'Night' ||
    props.themeId === 'MINIMAL_DARK' ||
    props.themeId === 'WARM_NOIR' ||
    String(props.themeId) === 'DARK_CONTEMPLATIVE';

  const isOfficeOrWordplay =
    props.motion?.pacingMode === 'WRY_BATHOS' ||
    /tự trào|hài hước|chơi chữ|nói lái|slang/i.test(effectiveMood) ||
    /chấm công|quẹt thẻ|lương|sếp|deadline|văn phòng|thứ hai|công sở|câu đơn|cơn đau/i.test(
      corpus
    );

  if (isOfficeOrWordplay) {
    const anchor = cleanPivot || cleanTitle || 'nhịp lật cuối câu';
    return `Góc đối chữ Quán Trà: đố cả nhà tìm được cặp nói lái hoặc đảo vế đối lại chữ «${anchor}» vừa sạch vừa duyên — câu đắt nhất tuần này quán xin phép vẽ tặng thành Chén mới nhé 🍵`;
  }

  if (isNightContemplative) {
    if ((props.author || '').trim().length > 0) {
      return `Đêm muộn đọc lại một câu của ${props.author?.trim()}, quán pha sẵn chén trà ấm ở đây — nếu có điều gì chưa tiện gọi thành tên, bạn cứ gửi tạm dưới hiên này rồi ngủ ngon nhé 🍵`;
    }
    const nightAnchor = cleanPivot
      ? `nhịp «${cleanPivot}»`
      : cleanTitle
        ? `chuyện «${cleanTitle.toLowerCase()}»`
        : 'khoảng lặng cuối ngày';
    return `Khuya rồi quán vẫn để đèn nhỏ cùng ${nightAnchor} — ai đi ngang còn thức cứ ghé gửi lại một dòng nhẹ lòng ở đây, quán giữ hộ cho bạn dễ ngủ hơn nhé 🍵`;
  }

  if (/thả thính|tình yêu|chiếc ô|thương|duyên|say/i.test(corpus)) {
    const loveAnchor = cleanPivot ? `«${cleanPivot}»` : 'câu cuối';
    return `Quán tò mò nhỏ: nếu mượn chữ ${loveAnchor} để nhắn cho một người mà không cần nói thẳng tên, bạn sẽ viết tiếp vế sau thế nào cho thật duyên? 🍵`;
  }

  const dayAnchor = cleanPivot
    ? `chữ «${cleanPivot}»`
    : cleanTitle
      ? `chén «${cleanTitle}»`
      : 'chén trà hôm nay';
  return `Pha xong ${dayAnchor} đặt ở góc bàn — sáng giờ của bạn đang thong thả hay tất bật, ghé ngồi thở chậm với quán một nhịp nhé 🍵`;
}

/**
 * Thang điểm Cộng hưởng TN-Score (Chuẩn 100 Điểm | Trần tối đa 138.75 Điểm)
 * Đo sau 7 ngày đăng để định lượng quyết định thăng hạng từ bảng W -> bảng Q:
 * 1. Completion Rate (chuẩn 80%, tối đa 1.25x = 37.5đ): min(Completion% / 80, 1.25) * 30
 * 2. Watch Ratio (Avg Watch / 15s, chuẩn 1.10x, tối đa 1.35x = 33.75đ): min(WatchRatio / 1.10, 1.35) * 25
 * 3. Share Rate (chuẩn 1.20%, tối đa 1.50x = 30.0đ): min(Share% / 1.20, 1.50) * 20
 * 4. Save Rate (chuẩn 2.50%, tối đa 1.50x = 22.5đ): min(Save% / 2.50, 1.50) * 15
 * 5. Comment Rate (chuẩn 0.50%, tối đa 1.50x = 15.0đ): min(Comment% / 0.50, 1.50) * 10
 */
export function computeTnScore(metrics: TnMetricsInput): TnScoreResult {
  const completion = Math.max(0, Number(metrics.completionRate) || 0);
  const watchRatio = Math.max(0, Number(metrics.watchRatio) || 0);
  const share = Math.max(0, Number(metrics.shareRate) || 0);
  const save = Math.max(0, Number(metrics.saveRate) || 0);
  const comment = Math.max(0, Number(metrics.commentRate) || 0);

  const completionPts = Math.min(completion / 80, 1.25) * 30;
  const watchRatioPts = Math.min(watchRatio / 1.1, 1.35) * 25;
  const sharePts = Math.min(share / 1.2, 1.5) * 20;
  const savePts = Math.min(save / 2.5, 1.5) * 15;
  const commentPts = Math.min(comment / 0.5, 1.5) * 10;

  const rawTotal =
    completionPts + watchRatioPts + sharePts + savePts + commentPts;
  const totalScore = Math.round(rawTotal * 100) / 100;

  let band: TnScoreBand = 'steady';
  let bandLabel = '🌿 Giữ nhịp (75–109đ)';
  let diagnostic =
    'Nhóm Giữ nhịp: Duy trì sản xuất đều theo tỷ trọng 40–30–20–10.';

  if (totalScore >= 110) {
    band = 'breakout';
    bandLabel = '🚀 Bứt phá (≥110đ)';
    diagnostic =
      'Đủ chuẩn thăng hạng W → Kho Q! Nên viết thêm 3 biến thể mới cùng mô-típ chơi chữ hoặc cặp đạo cụ này cho lô tuần tới.';
  } else if (totalScore >= 75) {
    band = 'steady';
    bandLabel = '🌿 Giữ nhịp (75–109đ)';
    diagnostic =
      'Nhịp giữ chân ổn định — tiếp tục duy trì theo tỷ trọng danh mục định kỳ.';
  } else if (totalScore >= 50) {
    band = 'watch';
    bandLabel = '🌤️ Cần tối ưu (50–74đ)';
    diagnostic =
      'Nên thả bình luận mồi sớm hơn để kéo Watch Ratio vượt 1.10x và rà lại độ gãy gọn của câu mở đầu.';
  } else {
    band = 'warning';
    bandLabel = '⚠️ Cảnh báo (<50đ)';
    const lowCompletion = completion > 0 && completion < 55;
    diagnostic = lowCompletion
      ? 'Retention rơi sớm: kiểm tra tư thế đạo cụ 0.0s (mốc 1–3s) và đôn thời điểm tô đỏ pivotWord lên 5.5s–6.0s (mốc 7s). Giữ nguyên video cũ, tuyệt đối không xóa đăng lại.'
      : 'Kiểm tra biểu đồ Retention tại 1s, 3s (khung hình 0.0s) và 7s (đôn pivotWord lên 5.5s–6.0s). Giữ nguyên video trên kênh, không xóa đăng lại.';
  }

  return {
    totalScore,
    band,
    bandLabel,
    diagnostic,
    breakdown: {
      completionPts: Math.round(completionPts * 10) / 10,
      watchRatioPts: Math.round(watchRatioPts * 10) / 10,
      sharePts: Math.round(sharePts * 10) / 10,
      savePts: Math.round(savePts * 10) / 10,
      commentPts: Math.round(commentPts * 10) / 10,
    },
  };
}

export function extractCaptionHashtags(caption: string): string[] {
  const matches = caption.match(/#[\p{L}\p{N}_]+/gu);
  return matches ? matches.map((t) => t.toLowerCase()) : [];
}

export function countCaptionHashtags(caption: string): number {
  return extractCaptionHashtags(caption).length;
}

export function stripBannedHashtags(caption: string): string {
  let cleaned = caption.replace(
    /(^|\s)#(fyp|foryou|foryoupage|xuhuong|viral|trending)(?=\s|$)/giu,
    ' '
  );
  cleaned = cleaned
    .split('\n')
    .map((line) => line.replace(/\s{2,}/g, ' ').trim())
    .join('\n')
    .trim();
  if (!/#tranguoi\b/i.test(cleaned)) {
    cleaned = `${cleaned}\n#tranguoi`.trim();
  }
  return cleaned;
}

function normalizeTextCompare(s: string): string {
  return s
    .replace(/\*+/g, '')
    .toLowerCase()
    .replace(/[.,;!?…""''“”‘’()—–\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function auditTikTokSeoCaption(
  caption: string,
  segments: string[]
): CaptionSeoAudit {
  const tags = extractCaptionHashtags(caption);
  const hashtagCount = tags.length;
  const hasBrandTag = tags.includes('#tranguoi');
  const bannedTags = Array.from(
    new Set(tags.filter((t) => BANNED_GENERIC_HASHTAGS.has(t)))
  );

  const nonTagLines = caption
    .split('\n')
    .map((l) => l.replace(/#[\p{L}\p{N}_]+/gu, '').trim())
    .filter((l) => l.length > 0);
  const firstHook = nonTagLines[0] || '';
  const hookNorm = normalizeTextCompare(firstHook);

  const segNorms = segments
    .map((s) => normalizeTextCompare(s))
    .filter((s) => s.length >= 12);
  const fullQuoteNorm = normalizeTextCompare(segments.join(' '));

  const duplicatesQuoteVerbatim =
    hookNorm.length >= 14 &&
    (hookNorm === fullQuoteNorm ||
      segNorms.some((seg) => hookNorm === seg || hookNorm.includes(seg)));

  const isClean =
    hasBrandTag &&
    hashtagCount >= 3 &&
    hashtagCount <= 5 &&
    bannedTags.length === 0 &&
    !duplicatesQuoteVerbatim &&
    firstHook.length >= 20;

  return {
    hashtagCount,
    hasBrandTag,
    bannedTags,
    duplicatesQuoteVerbatim,
    hookLength: firstHook.length,
    isClean,
  };
}
