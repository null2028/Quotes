import React, { useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import {
  Film,
  Copy,
  Check,
  Download,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Search,
  Loader2,
  Sparkles,
  FileText,
  Scan,
  ChevronLeft,
  Database,
  CheckCircle2,
  ShoppingBag,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from 'lucide-react';
import {
  CupAirtableTrackMeta,
  CupPublishStatus,
  CupRecord,
  PublishSlot,
  TnMetrics,
} from '../types';
import { VideoInputProps } from '../../../src/schemas/videoSchema';
import { QuoteVideoComposition } from '../../../src/compositions/QuoteVideoComposition';
import {
  auditVietnameseSyllables,
  computeTimelineSync,
} from '../../../src/engine/timelineSync';
import { LAYOUT_TOKENS } from '../../../src/theme/palettes';
import {
  auditTikTokSeoCaption,
  computeTnScore,
  generateSeedCommentForCup,
  generateSeoCaptionForCup,
  resolveCupCaption,
  stripBannedHashtags,
} from '../../../src/automation/captionBuilder';
import {
  formatCupBaseFileName,
  formatCupSeoFileName,
} from '../../../src/automation/fileNaming';
import {
  MOOD_PRESETS,
  PUBLISH_STATUS_OPTIONS,
  SLOT_OPTIONS,
  loadCachedAirtableWorkspace,
  promoteWordplayCupToQuoteLibrary,
  resolveEffectiveCupTrackMeta,
  upsertSingleCupOnAirtableTracker,
} from '../airtableCupTracker';

type SafeZoneMode = 'off' | 'organic' | 'shop';

interface Props {
  cup: CupRecord;
  onUpdateProps: (nextProps: VideoInputProps) => void;
  onRenderSingleCup: (cupId: string) => Promise<void>;
  onOpenAirtableModal?: () => void;
  onCupTrackUpdated?: (cupId: string, meta: CupAirtableTrackMeta) => void;
}

export const LivePhonePreview: React.FC<Props> = ({
  cup,
  onUpdateProps,
  onRenderSingleCup,
  onOpenAirtableModal,
  onCupTrackUpdated,
}) => {
  // Mặc định TẮT lớp phủ Safe-Zone để xem video phẳng chuẩn 9:16 (1080×1920);
  // cho phép bật nhanh 2 chế độ: Đa Kênh (X=[157,833], Y=[180,1540]) hoặc Shop/Ads (X=[217,803], Y=[240,1260])
  const [safeZoneMode, setSafeZoneMode] = useState<SafeZoneMode>('off');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [publishStatus, setPublishStatus] = useState<CupPublishStatus>('draft');
  const [publishSlot, setPublishSlot] = useState<PublishSlot>('Anytime');
  const [publishMood, setPublishMood] = useState<string>('Nhẹ nhàng');
  const [publishedDate, setPublishedDate] = useState<string | undefined>(
    undefined
  );
  const [seedComment, setSeedComment] = useState<string>('');
  const [showTnDrawer, setShowTnDrawer] = useState<boolean>(false);
  const [tnMetrics, setTnMetrics] = useState<TnMetrics>({});
  const [promotedQCode, setPromotedQCode] = useState<string | undefined>(
    undefined
  );
  const [promotingToQ, setPromotingToQ] = useState<boolean>(false);
  const [syncingTracker, setSyncingTracker] = useState(false);
  const [trackerNote, setTrackerNote] = useState<{
    tone: 'ok' | 'err';
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    setTrackerNote(null);
    void loadCachedAirtableWorkspace().then((cache) => {
      if (!active) return;
      const meta = resolveEffectiveCupTrackMeta(cup, cache);
      setPublishStatus(meta.publishStatus);
      setPublishSlot(meta.slot);
      setPublishMood(meta.mood);
      setPublishedDate(meta.publishedDate);
      setSeedComment(
        meta.seedComment ||
          generateSeedCommentForCup(cup.props, meta.slot, meta.mood)
      );
      setTnMetrics(meta.tnMetrics || {});
      setPromotedQCode(meta.promotedQCode);
    });
    return () => {
      active = false;
    };
  }, [
    cup.id,
    cup.status,
    cup.publishTrack?.publishStatus,
    cup.publishTrack?.slot,
    cup.publishTrack?.mood,
    cup.publishTrack?.publishedDate,
    cup.publishTrack?.seedComment,
    cup.publishTrack?.tnScore,
    cup.publishTrack?.promotedQCode,
    cup.props.publishSlot,
    cup.props.publishMood,
    cup.props.themeId,
  ]);

  const sync = computeTimelineSync(cup.props, LAYOUT_TOKENS.fps);
  const syllableAudit = auditVietnameseSyllables(cup.props.segments);
  const isBusy =
    cup.status === 'queued' ||
    cup.status === 'bundling' ||
    cup.status === 'rendering';

  const activeCaption = resolveCupCaption(cup.id, cup.props);
  const seoAudit = auditTikTokSeoCaption(activeCaption, cup.props.segments);

  const hasAnyTnInput =
    (tnMetrics.completionRate ?? 0) > 0 ||
    (tnMetrics.watchRatio ?? 0) > 0 ||
    (tnMetrics.shareRate ?? 0) > 0 ||
    (tnMetrics.saveRate ?? 0) > 0 ||
    (tnMetrics.commentRate ?? 0) > 0;
  const tnResult = computeTnScore(tnMetrics);

  const cupFileBase = formatCupBaseFileName(
    cup.cupNumber || cup.id,
    cup.props.title
  );
  const seoFileBase = formatCupSeoFileName(cup.cupNumber || cup.id, {
    title: cup.props.title,
    pivotWord: cup.props.pivotWord,
    mood: publishMood || cup.props.publishMood,
    topic: cup.props.publishTopic,
  });
  const seoDownloadName = cup.seoFileName || `${seoFileBase}.mp4`;
  const downloadHref = cup.seoVideoUrl || cup.videoUrl;

  const firstHookLine =
    activeCaption
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith('#')) || '';

  const handleCopyCaption = async () => {
    await navigator.clipboard.writeText(activeCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopySeedComment = async () => {
    const textToCopy =
      seedComment.trim() ||
      generateSeedCommentForCup(cup.props, publishSlot, publishMood);
    await navigator.clipboard.writeText(textToCopy);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const handleRegenerateSeedComment = () => {
    const freshSeed = generateSeedCommentForCup(
      cup.props,
      publishSlot,
      publishMood
    );
    setSeedComment(freshSeed);
    void pushTrackPatch({
      publishStatus,
      slot: publishSlot,
      mood: publishMood,
      seedComment: freshSeed,
    });
  };

  const handleRegenerateSeoCaption = () => {
    const generated = generateSeoCaptionForCup(cup.id, cup.props);
    onUpdateProps({
      ...cup.props,
      customCaption: generated,
    });
  };

  const handleCleanBannedHashtags = () => {
    const cleaned = stripBannedHashtags(activeCaption);
    onUpdateProps({
      ...cup.props,
      customCaption: cleaned,
    });
  };

  const pushTrackPatch = async (
    patch: Partial<CupAirtableTrackMeta>,
    showSuccessToast = false
  ) => {
    setTrackerNote(null);
    setSyncingTracker(true);
    try {
      const updated = await upsertSingleCupOnAirtableTracker(cup, patch);
      setPublishStatus(updated.publishStatus);
      setPublishSlot(updated.slot);
      setPublishMood(updated.mood);
      setPublishedDate(updated.publishedDate);
      if (updated.seedComment) setSeedComment(updated.seedComment);
      if (updated.promotedQCode) setPromotedQCode(updated.promotedQCode);
      onCupTrackUpdated?.(cup.id, updated);
      if (showSuccessToast) {
        setTrackerNote({
          tone: 'ok',
          text: `Đã cập nhật Chén ${cup.cupNumber} lên bảng "Tủ Chén & Lịch Đăng"!`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTrackerNote({ tone: 'err', text: msg });
      if (msg.includes('Chưa kết nối Airtable')) {
        onOpenAirtableModal?.();
      }
    } finally {
      setSyncingTracker(false);
    }
  };

  const handleSaveTnScore = () => {
    const computed = computeTnScore(tnMetrics);
    void pushTrackPatch(
      {
        publishStatus,
        slot: publishSlot,
        mood: publishMood,
        seedComment,
        tnMetrics,
        tnScore: computed.totalScore,
      },
      true
    );
  };

  const handlePromoteToQuoteLibrary = async () => {
    setTrackerNote(null);
    setPromotingToQ(true);
    try {
      const computed = computeTnScore(tnMetrics);
      const res = await promoteWordplayCupToQuoteLibrary(
        cup,
        computed.totalScore,
        tnMetrics
      );
      setPromotedQCode(res.qCode);
      onCupTrackUpdated?.(cup.id, res.meta);
      const wSuffix = res.updatedWordplayId
        ? ` (đã đổi ${res.updatedWordplayId} → Đã chuyển sang Kho Q)`
        : '';
      setTrackerNote({
        tone: 'ok',
        text: `Đã thăng hạng Chén ${cup.cupNumber} vào Kho Q với mã ${res.qCode}${wSuffix}!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTrackerNote({ tone: 'err', text: msg });
      if (msg.includes('Chưa kết nối Airtable')) {
        onOpenAirtableModal?.();
      }
    } finally {
      setPromotingToQ(false);
    }
  };

  const handleSelectPublishStatus = (nextStatus: CupPublishStatus) => {
    setPublishStatus(nextStatus);
    void pushTrackPatch({
      publishStatus: nextStatus,
      slot: publishSlot,
      mood: publishMood,
      seedComment,
    });
  };

  const handleChangeSlot = (nextSlot: PublishSlot) => {
    setPublishSlot(nextSlot);
    const refreshedSeed = generateSeedCommentForCup(
      cup.props,
      nextSlot,
      publishMood
    );
    setSeedComment(refreshedSeed);
    onUpdateProps({
      ...cup.props,
      publishSlot: nextSlot,
    });
    void pushTrackPatch({
      publishStatus,
      slot: nextSlot,
      mood: publishMood,
      seedComment: refreshedSeed,
    });
  };

  const handleChangeMood = (nextMood: string, syncImmediately = false) => {
    setPublishMood(nextMood);
    onUpdateProps({
      ...cup.props,
      publishMood: nextMood,
    });
    if (syncImmediately) {
      void pushTrackPatch({
        publishStatus,
        slot: publishSlot,
        mood: nextMood,
        seedComment,
      });
    }
  };

  const updateSingleMetric = (field: keyof TnMetrics, rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed === '') {
      setTnMetrics((prev) => ({ ...prev, [field]: undefined }));
      return;
    }
    const parsed = parseFloat(trimmed);
    if (!Number.isNaN(parsed)) {
      setTnMetrics((prev) => ({ ...prev, [field]: parsed }));
    }
  };

  // Tỷ lệ phần trăm chính xác bên trong khung chuẩn 9:16 (1080 × 1920 px):
  // - Dải xén mép iPhone 9:19.5 full-height: 97px / 1080px = 8.98% mỗi bên
  // - Vùng an toàn Đa kênh (Organic): X=[157..833] (left 14.54%, right 22.87%), Y=[180..1540] (top 9.38%, bottom 19.79%), trần chữ Studio Y=1460 (bottom 23.96%)
  // - Vùng an toàn Shop / Spark Ads: X=[217..803] (left 20.09%, right 25.65%), Y=[240..1260] (top 12.50%, bottom 34.38%)
  const safeBoxStyle =
    safeZoneMode === 'shop'
      ? {
          left: '20.09%',
          right: '25.65%',
          top: '12.50%',
          bottom: '34.38%',
        }
      : {
          left: '14.54%',
          right: '22.87%',
          top: '9.38%',
          bottom: '19.79%',
        };

  return (
    <aside className="w-[405px] shrink-0 border-l border-tea-border bg-tea-paper/95 p-4 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-3">
        {/* Thanh tiêu đề Preview chuẩn 9:16 + Công tắc 3 chế độ thước ngắm Safe-Zone */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-tea-ink shrink-0">
            <Film className="w-4 h-4 text-tea-accent" />
            <span>Khung 9:16</span>
          </div>

          <div
            className="inline-flex items-center rounded-full border border-tea-border bg-white p-0.5 text-[10.5px] font-semibold"
            title="Thước ngắm vùng an toàn nằm bên trong khung xuất chuẩn 9:16 (1080×1920)"
          >
            <button
              type="button"
              onClick={() => setSafeZoneMode('off')}
              className={`px-2 py-0.5 rounded-full transition ${
                safeZoneMode === 'off'
                  ? 'bg-tea-ink text-tea-paper'
                  : 'text-tea-muted hover:text-tea-ink'
              }`}
            >
              1:1 Sạch
            </button>
            <button
              type="button"
              onClick={() => setSafeZoneMode('organic')}
              className={`px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
                safeZoneMode === 'organic'
                  ? 'bg-tea-accent text-white'
                  : 'text-tea-muted hover:text-tea-ink'
              }`}
              title="Vùng an toàn Đa kênh (TikTok · Reels · Shorts): X=[157,833], Y=[180,1540], trừ 97px mép màn hình 9:19.5"
            >
              <Scan className="w-2.5 h-2.5" />
              Safe Đa Kênh
            </button>
            <button
              type="button"
              onClick={() => setSafeZoneMode('shop')}
              className={`px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
                safeZoneMode === 'shop'
                  ? 'bg-amber-600 text-white'
                  : 'text-tea-muted hover:text-tea-ink'
              }`}
              title="Vùng an toàn gắn giỏ hàng TikTok Shop / Spark Ads: X=[217,803], Y=[240,1260]"
            >
              <ShoppingBag className="w-2.5 h-2.5" />
              Shop/Ads
            </button>
          </div>
        </div>

        {/* Khung Video Chuẩn Tỷ Lệ 9:16 Tuyệt Đối (box-content 288×512 = 1080×1920) */}
        <div className="box-content relative mx-auto w-[288px] h-[512px] border border-tea-ink/20 bg-tea-bg shadow-sm overflow-hidden">
          <Player
            component={QuoteVideoComposition}
            inputProps={cup.props}
            durationInFrames={sync.durationInFrames}
            fps={LAYOUT_TOKENS.fps}
            compositionWidth={LAYOUT_TOKENS.width}
            compositionHeight={LAYOUT_TOKENS.height}
            style={{ width: '100%', height: '100%' }}
            controls
            loop
          />

          {/* Lớp phủ Thước ngắm Safe-Zone đặt bên trong bức tranh 9:16 (1080×1920) */}
          {safeZoneMode !== 'off' && (
            <div className="pointer-events-none absolute inset-0 z-10">
              {/* 1. Hai dải rìa 97px (8.98%) bị màn hình dài iPhone 9:19.5 phóng tràn viền cắt khuất */}
              <div
                style={{ width: '8.98%' }}
                className="absolute inset-y-0 left-0 bg-black/32 border-r border-dotted border-white/55"
                title="97px mép trái bị màn hình iPhone 9:19.5 cắt khuất khi phóng tràn chiều dọc"
              >
                <span className="absolute top-1/2 left-0.5 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap text-[7px] font-mono text-white/75">
                  X&lt;97px (xén 9:19.5)
                </span>
              </div>
              <div
                style={{ width: '8.98%' }}
                className="absolute inset-y-0 right-0 bg-black/32 border-l border-dotted border-white/55"
                title="97px mép phải bị màn hình iPhone 9:19.5 cắt khuất"
              />

              {/* 2. Khung chữ nhật Safe Zone chuẩn (Đa kênh X=[157,833] Y=[180,1540] hoặc Shop X=[217,803] Y=[240,1260]) */}
              <div
                style={safeBoxStyle}
                className={`absolute border border-dashed rounded-sm ${
                  safeZoneMode === 'shop'
                    ? 'border-amber-300/90 bg-amber-400/[0.03]'
                    : 'border-sky-300/90 bg-sky-400/[0.02]'
                }`}
              >
                <span
                  className={`absolute -top-3.5 left-1 px-1 rounded text-[7.5px] font-mono font-semibold ${
                    safeZoneMode === 'shop'
                      ? 'bg-amber-600/90 text-white'
                      : 'bg-sky-600/90 text-white'
                  }`}
                >
                  {safeZoneMode === 'shop'
                    ? 'SHOP SAFE · X[217..803] · Y[240..1260]'
                    : 'SAFE ĐA KÊNH · X[157..833] · tâm X=495'}
                </span>

                {/* Vạch ranh giới giữa Sân khấu (y=354..844) & Khối chữ (y=856..1460) tại y=850px (44.27% toàn khung) */}
                <div
                  style={{
                    top:
                      safeZoneMode === 'shop'
                        ? `${((850 - 240) / (1260 - 240)) * 100}%`
                        : `${((850 - 180) / (1540 - 180)) * 100}%`,
                  }}
                  className="absolute inset-x-1 border-t border-dotted border-tea-accent/55 flex justify-end"
                >
                  <span className="px-1 -mt-2 bg-black/45 rounded text-[7px] font-mono text-white/85">
                    Sân khấu ↑ · Chữ ↓ (y=850)
                  </span>
                </div>
              </div>

              {/* 3. Thanh tìm kiếm TikTok phía trên (y=0..295px = 15.36%) */}
              <div
                style={{ height: '15.36%', left: '8.98%', right: '8.98%' }}
                className="absolute top-0 bg-black/28 border-b border-dashed border-tea-accent/65 px-2 pt-2 pb-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[8px] text-white/80 font-mono">
                  <span>9:16 (1080×1920)</span>
                  <span>Search UI · y=295px</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3 text-white shrink-0" />
                  <div className="flex-1 rounded-full border border-white/50 bg-white/15 px-2 py-0.5 flex items-center justify-between text-[8px] text-white/95">
                    <span className="flex items-center gap-1 truncate">
                      <Search className="w-2.5 h-2.5 shrink-0" />
                      Tìm nội dung liên quan
                    </span>
                    <span className="font-semibold shrink-0 ml-1">Tìm</span>
                  </div>
                </div>
              </div>

              {/* 4. Cột nút tương tác phải TikTok (X=833..983px -> right 8.98%, width 13.89%) */}
              <div
                style={{
                  width: '13.89%',
                  right: '8.98%',
                  top: '44%',
                  bottom: safeZoneMode === 'shop' ? '34.38%' : '23.96%',
                }}
                className="absolute bg-black/18 border-l border-dashed border-tea-accent/60 flex flex-col items-center justify-between py-1.5 text-white drop-shadow"
              >
                <div className="w-6 h-6 rounded-full bg-tea-ink border border-white/80 flex items-center justify-center text-[6.5px] font-serif text-tea-paper">
                  Trà
                </div>
                <div className="flex flex-col items-center text-[7.5px]">
                  <Heart className="w-3.5 h-3.5 fill-white/90" />
                  <span>Tim</span>
                </div>
                <div className="flex flex-col items-center text-[7.5px]">
                  <MessageCircle className="w-3.5 h-3.5 fill-white/90" />
                  <span>Đối</span>
                </div>
                <div className="flex flex-col items-center text-[7.5px]">
                  <Bookmark className="w-3.5 h-3.5 fill-white/90" />
                  <span>Lưu</span>
                </div>
                <Share2 className="w-3 h-3" />
              </div>

              {/* 5. Thẻ Giỏ hàng TikTok Shop / CTA Spark Ads (y=1260..1460px) khi chọn chế độ Shop/Ads */}
              {safeZoneMode === 'shop' && (
                <div
                  style={{
                    top: '65.62%',
                    height: '10.42%',
                    left: '8.98%',
                    right: '8.98%',
                  }}
                  className="absolute bg-amber-950/65 border-t-2 border-dashed border-amber-400 px-2 py-1 flex items-center justify-between text-white"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[8.5px] font-semibold truncate">
                        Giỏ hàng TikTok Shop · Bộ thẻ Trà Nguội
                      </div>
                      <div className="text-[7.5px] text-amber-200 font-mono">
                        TRẦN SHOP/ADS · y=1260px
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Vùng tên kênh + Caption + Thanh nhạc dưới đáy (y=1460..1920px = 23.96%) */}
              <div
                style={{ height: '23.96%', left: '8.98%', right: '8.98%' }}
                className="absolute bottom-0 bg-black/45 border-t-2 border-dashed border-tea-accent px-2 pt-1.5 pb-2 flex flex-col justify-between text-white"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-bold">@tranguoi.15s</span>
                    <span className="text-[7.5px] font-mono text-amber-200 font-semibold">
                      y=1460..1540px
                    </span>
                  </div>
                  <div className="text-[8.5px] text-white/90 line-clamp-2 leading-snug mt-0.5 pr-1">
                    {firstHookLine}{' '}
                    <span className="text-white/65 font-semibold">...thêm</span>
                  </div>
                </div>

                <div className="bg-black/55 rounded-full px-2 py-0.5 text-[8px] text-white/80 flex items-center justify-between border border-white/15">
                  <span>♫ Foley gốc 100% + Nhạc 5%</span>
                  <span className="text-[7.5px] text-white/65">9:19.5 view</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4 Ô Thông số kỹ thuật: Pivot · Nhịp đọc Âm tiết · Hết chữ · Chuẩn Master */}
        <div className="grid grid-cols-4 gap-1 text-center text-[10.5px] bg-tea-bg/70 border border-tea-border rounded-xl p-1.5">
          <div>
            <div className="text-[9.5px] text-tea-muted">Pivot</div>
            <div className="font-mono font-bold text-tea-accent">
              {(sync.pivotFrame / LAYOUT_TOKENS.fps).toFixed(1)}s
            </div>
          </div>
          <div title={syllableAudit.label}>
            <div className="text-[9.5px] text-tea-muted">Nhịp đọc</div>
            <div
              className={`font-mono font-bold ${
                syllableAudit.band === 'optimal'
                  ? 'text-emerald-700'
                  : syllableAudit.band === 'overflow'
                    ? 'text-red-600'
                    : syllableAudit.band === 'long'
                      ? 'text-amber-700'
                      : 'text-sky-700'
              }`}
            >
              {syllableAudit.count} âm
            </div>
          </div>
          <div>
            <div className="text-[9.5px] text-tea-muted">Hết chữ</div>
            <div className="font-mono font-semibold text-tea-ink">
              {(sync.allTextFinishedFrame / LAYOUT_TOKENS.fps).toFixed(1)}s
            </div>
          </div>
          <div title="Chuẩn kết xuất 1080×1920 CFR · H.264 High · BT.709 · 10 Mbps · Foley -14 LUFS">
            <div className="text-[9.5px] text-tea-muted">Master</div>
            <div className="font-mono font-semibold text-tea-ink">
              bt709·10M
            </div>
          </div>
        </div>

        {/* QUẢN LÝ TỦ CHÉN & LỊCH ĐĂNG TRÊN AIRTABLE */}
        <div className="rounded-xl border border-tea-border bg-white/90 shadow-2xs p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-tea-ink flex items-center gap-1">
              <Database className="w-3 h-3 text-tea-accent" />
              Tủ Chén &amp; Lịch Đăng (Airtable)
            </span>
            {syncingTracker ? (
              <span className="text-[10px] text-tea-accent flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Đang lưu...
              </span>
            ) : publishedDate && publishStatus === 'published' ? (
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Đăng: {publishedDate}
              </span>
            ) : (
              <span className="text-[10px] text-tea-muted">
                Đồng bộ 2 chiều ĐT
              </span>
            )}
          </div>

          {/* 4 Nút trạng thái đăng bài */}
          <div className="grid grid-cols-4 gap-1">
            {PUBLISH_STATUS_OPTIONS.map((st) => {
              const active = publishStatus === st.value;
              const activeClass =
                st.value === 'published'
                  ? 'border-emerald-500 bg-emerald-500/14 text-emerald-800'
                  : st.value === 'scheduled'
                    ? 'border-sky-500 bg-sky-500/14 text-sky-800'
                    : st.value === 'rendered'
                      ? 'border-amber-500 bg-amber-500/14 text-amber-900'
                      : 'border-tea-ink bg-tea-ink text-tea-paper';
              return (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => handleSelectPublishStatus(st.value)}
                  className={`py-1 px-1 rounded-lg text-[10px] font-semibold border transition truncate ${
                    active
                      ? activeClass
                      : 'border-tea-border bg-tea-bg/35 text-tea-muted hover:text-tea-ink'
                  }`}
                  title={st.airtableChoice}
                >
                  {st.shortLabel}
                </button>
              );
            })}
          </div>

          {/* 3 Nút khung giờ buổi đăng */}
          <div className="grid grid-cols-3 gap-1.5">
            {SLOT_OPTIONS.map((opt) => {
              const active = publishSlot === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChangeSlot(opt.value)}
                  className={`py-1 px-2 rounded-lg text-[10.5px] font-semibold border transition ${
                    active
                      ? 'border-tea-accent bg-tea-accent/12 text-tea-accent'
                      : 'border-tea-border bg-tea-bg/40 text-tea-muted hover:text-tea-ink'
                  }`}
                  title={opt.airtableChoice}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Chọn hoặc nhập Mood */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] text-tea-muted shrink-0">Mood:</span>
            <select
              value={
                MOOD_PRESETS.includes(publishMood) ? publishMood : '__custom__'
              }
              onChange={(e) => {
                if (e.target.value !== '__custom__') {
                  handleChangeMood(e.target.value, true);
                }
              }}
              className="rounded-lg border border-tea-border bg-tea-bg/40 px-2 py-1 text-[11px] font-medium text-tea-ink focus:outline-none focus:border-tea-accent"
            >
              {MOOD_PRESETS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              {!MOOD_PRESETS.includes(publishMood) && (
                <option value="__custom__">{publishMood || 'Tùy chỉnh'}</option>
              )}
            </select>

            <input
              type="text"
              value={publishMood}
              onChange={(e) => handleChangeMood(e.target.value, false)}
              onBlur={() =>
                void pushTrackPatch({
                  publishStatus,
                  slot: publishSlot,
                  mood: publishMood,
                  seedComment,
                })
              }
              placeholder="Nhẹ nhàng, Hoài niệm..."
              className="flex-1 min-w-0 rounded-lg border border-tea-border bg-tea-bg/30 px-2 py-1 text-[11px] text-tea-ink focus:outline-none focus:border-tea-accent"
            />
          </div>
        </div>

        {/* KHUNG CAPTION TIKTOK SEO + KIỂM ĐỊNH THUẬT TOÁN TỰ ĐỘNG */}
        <div className="rounded-xl border border-tea-border bg-white/90 shadow-2xs p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileText className="w-3.5 h-3.5 text-tea-accent shrink-0" />
              <span className="text-[11px] font-bold text-tea-ink truncate">
                Caption TikTok SEO
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                  seoAudit.isClean
                    ? 'bg-emerald-500/12 text-emerald-700'
                    : 'bg-amber-500/15 text-amber-700'
                }`}
                title="Chuẩn SEO: 3–5 hashtag phân tầng có #tranguoi, không #fyp, câu đầu không chép lặp nguyên văn quote"
              >
                {seoAudit.hashtagCount}/5 tags
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleRegenerateSeoCaption}
                className="px-2 py-1 rounded-lg border border-tea-border bg-tea-bg/60 text-[10.5px] font-medium text-tea-ink hover:border-tea-accent flex items-center gap-1 transition"
                title="Tạo lại Caption cô đọng 2 câu theo nội dung Quote"
              >
                <Sparkles className="w-3 h-3 text-tea-accent" />
                Tạo tự động
              </button>

              <button
                type="button"
                onClick={handleCopyCaption}
                className="px-2.5 py-1 rounded-lg bg-tea-ink text-tea-paper text-[10.5px] font-semibold hover:bg-tea-accent flex items-center gap-1 transition"
              >
                {copiedCaption ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-300" /> Đã Copy
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <textarea
            value={activeCaption}
            onChange={(e) =>
              onUpdateProps({
                ...cup.props,
                customCaption: e.target.value,
              })
            }
            onBlur={() =>
              void pushTrackPatch({
                publishStatus,
                slot: publishSlot,
                mood: publishMood,
                seedComment,
              })
            }
            rows={4}
            placeholder="Caption cô đọng chuẩn TikTok SEO..."
            className="w-full rounded-lg border border-tea-border/80 bg-tea-bg/35 px-2.5 py-2 text-[11.5px] leading-relaxed text-tea-ink focus:outline-none focus:border-tea-accent resize-y"
          />

          {(seoAudit.bannedTags.length > 0 ||
            seoAudit.duplicatesQuoteVerbatim ||
            !seoAudit.hasBrandTag) && (
            <div className="px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-900 flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1 min-w-0">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">
                  {seoAudit.bannedTags.length > 0
                    ? `Nên bỏ thẻ chung ${seoAudit.bannedTags.join(', ')}`
                    : seoAudit.duplicatesQuoteVerbatim
                      ? 'Câu đầu đang lặp nguyên văn quote trên màn hình'
                      : 'Thiếu thẻ định danh #tranguoi'}
                </span>
              </span>
              {(seoAudit.bannedTags.length > 0 || !seoAudit.hasBrandTag) && (
                <button
                  type="button"
                  onClick={handleCleanBannedHashtags}
                  className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-semibold shrink-0 hover:bg-amber-700"
                >
                  Chuẩn hóa
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-tea-muted px-0.5">
            <span className="truncate" title={seoDownloadName}>
              SEO file: <code className="text-tea-ink">{seoDownloadName}</code>
            </span>
            <span className="shrink-0 ml-1">{activeCaption.length} ký tự</span>
          </div>
        </div>

        {/* QUÁN TRÀ DƯỚI PHẦN BÌNH LUẬN — BÌNH LUẬN MỒI GIÂY ĐẦU */}
        <div className="rounded-xl border border-tea-border bg-white/90 shadow-2xs p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <MessageCircle className="w-3.5 h-3.5 text-tea-accent shrink-0" />
              <span className="text-[11px] font-bold text-tea-ink truncate">
                Bình luận mồi Quán Trà
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleRegenerateSeedComment}
                className="px-2 py-0.5 rounded-lg border border-tea-border bg-tea-bg/60 text-[10px] font-medium text-tea-ink hover:border-tea-accent flex items-center gap-1 transition"
                title="Sinh câu mồi mới theo khung giờ (Đố chữ công sở / Thủ thỉ đêm khuya)"
              >
                <Sparkles className="w-2.5 h-2.5 text-tea-accent" />
                Gợi ý
              </button>
              <button
                type="button"
                onClick={handleCopySeedComment}
                className="px-2 py-0.5 rounded-lg bg-tea-ink text-tea-paper text-[10px] font-semibold hover:bg-tea-accent flex items-center gap-1 transition"
                title="Copy câu bình luận mồi để thả ngay giây đầu sau khi đăng TikTok"
              >
                {copiedSeed ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-300" /> Đã Copy
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <textarea
            value={seedComment}
            onChange={(e) => setSeedComment(e.target.value)}
            onBlur={() =>
              void pushTrackPatch({
                publishStatus,
                slot: publishSlot,
                mood: publishMood,
                seedComment,
              })
            }
            rows={2}
            placeholder="Câu bình luận thả ngay giây đầu sau khi đăng để giữ người xem đọc & lặp nền 15s..."
            className="w-full rounded-lg border border-tea-border/80 bg-tea-bg/30 px-2.5 py-1.5 text-[11px] leading-relaxed text-tea-ink focus:outline-none focus:border-tea-accent resize-y"
          />
        </div>

        {/* THANG ĐIỂM CỘNG HƯỞNG TN-SCORE (SAU 7 NGÀY ĐĂNG) & THĂNG HẠNG W -> Q */}
        <div className="rounded-xl border border-tea-border bg-white/90 shadow-2xs p-2.5 space-y-2">
          <button
            type="button"
            onClick={() => setShowTnDrawer((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <span className="text-[11px] font-bold text-tea-ink flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-tea-accent shrink-0" />
              <span>Thang điểm TN-Score (7 ngày)</span>
            </span>

            <span className="flex items-center gap-1.5 shrink-0">
              {hasAnyTnInput || cup.publishTrack?.tnScore !== undefined ? (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    tnResult.totalScore >= 110
                      ? 'bg-emerald-500/15 text-emerald-800'
                      : tnResult.totalScore >= 75
                        ? 'bg-sky-500/15 text-sky-800'
                        : tnResult.totalScore >= 50
                          ? 'bg-amber-500/15 text-amber-800'
                          : 'bg-red-500/15 text-red-700'
                  }`}
                >
                  {(hasAnyTnInput
                    ? tnResult.totalScore
                    : cup.publishTrack?.tnScore ?? 0
                  ).toFixed(1)}
                  đ
                </span>
              ) : (
                <span className="text-[10px] text-tea-muted">Chuẩn 100đ</span>
              )}
              {showTnDrawer ? (
                <ChevronUp className="w-3.5 h-3.5 text-tea-muted" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-tea-muted" />
              )}
            </span>
          </button>

          {showTnDrawer && (
            <div className="pt-1 space-y-2 border-t border-tea-border/60">
              <div className="grid grid-cols-5 gap-1 text-[10px]">
                <label className="space-y-0.5">
                  <span
                    className="block text-[9.5px] text-tea-muted truncate"
                    title="Completion Rate % (Mốc chuẩn 80% = 30đ)"
                  >
                    Compl%
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="80"
                    value={tnMetrics.completionRate ?? ''}
                    onChange={(e) =>
                      updateSingleMetric('completionRate', e.target.value)
                    }
                    className="w-full rounded-md border border-tea-border bg-tea-bg/35 px-1.5 py-1 font-mono text-[10.5px] text-tea-ink focus:outline-none focus:border-tea-accent"
                  />
                </label>

                <label className="space-y-0.5">
                  <span
                    className="block text-[9.5px] text-tea-muted truncate"
                    title="Watch Ratio = Avg Watch / 15s (Mốc chuẩn 1.10x = 25đ)"
                  >
                    Watch×
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder="1.10"
                    value={tnMetrics.watchRatio ?? ''}
                    onChange={(e) =>
                      updateSingleMetric('watchRatio', e.target.value)
                    }
                    className="w-full rounded-md border border-tea-border bg-tea-bg/35 px-1.5 py-1 font-mono text-[10.5px] text-tea-ink focus:outline-none focus:border-tea-accent"
                  />
                </label>

                <label className="space-y-0.5">
                  <span
                    className="block text-[9.5px] text-tea-muted truncate"
                    title="Share Rate % = Shares / Views (Mốc chuẩn 1.20% = 20đ)"
                  >
                    Share%
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder="1.20"
                    value={tnMetrics.shareRate ?? ''}
                    onChange={(e) =>
                      updateSingleMetric('shareRate', e.target.value)
                    }
                    className="w-full rounded-md border border-tea-border bg-tea-bg/35 px-1.5 py-1 font-mono text-[10.5px] text-tea-ink focus:outline-none focus:border-tea-accent"
                  />
                </label>

                <label className="space-y-0.5">
                  <span
                    className="block text-[9.5px] text-tea-muted truncate"
                    title="Save Rate % = Saves / Views (Mốc chuẩn 2.50% = 15đ)"
                  >
                    Save%
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="2.50"
                    value={tnMetrics.saveRate ?? ''}
                    onChange={(e) =>
                      updateSingleMetric('saveRate', e.target.value)
                    }
                    className="w-full rounded-md border border-tea-border bg-tea-bg/35 px-1.5 py-1 font-mono text-[10.5px] text-tea-ink focus:outline-none focus:border-tea-accent"
                  />
                </label>

                <label className="space-y-0.5">
                  <span
                    className="block text-[9.5px] text-tea-muted truncate"
                    title="Comment Rate % = Comments / Views (Mốc chuẩn 0.50% = 10đ)"
                  >
                    Cmt%
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder="0.50"
                    value={tnMetrics.commentRate ?? ''}
                    onChange={(e) =>
                      updateSingleMetric('commentRate', e.target.value)
                    }
                    className="w-full rounded-md border border-tea-border bg-tea-bg/35 px-1.5 py-1 font-mono text-[10.5px] text-tea-ink focus:outline-none focus:border-tea-accent"
                  />
                </label>
              </div>

              {hasAnyTnInput && (
                <div
                  className={`p-2 rounded-lg border text-[10.5px] leading-snug space-y-1 ${
                    tnResult.band === 'breakout'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
                      : tnResult.band === 'steady'
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-900'
                        : tnResult.band === 'watch'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                          : 'bg-red-500/10 border-red-500/30 text-red-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{tnResult.bandLabel}</span>
                    <span className="font-mono">
                      {tnResult.totalScore.toFixed(2)} / 138.75đ
                    </span>
                  </div>
                  <p className="text-[10px] opacity-90">{tnResult.diagnostic}</p>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={syncingTracker || !hasAnyTnInput}
                  onClick={handleSaveTnScore}
                  className="flex-1 py-1.5 px-2.5 rounded-lg border border-tea-border bg-tea-bg/50 text-[10.5px] font-semibold text-tea-ink hover:border-tea-accent transition disabled:opacity-50"
                >
                  Lưu TN-Score lên Airtable
                </button>

                {promotedQCode ? (
                  <span className="py-1.5 px-2.5 rounded-lg bg-emerald-600/12 border border-emerald-600/30 text-emerald-800 text-[10.5px] font-semibold">
                    ✅ Kho Q ({promotedQCode})
                  </span>
                ) : (
                  tnResult.totalScore >= 110 && (
                    <button
                      type="button"
                      disabled={promotingToQ}
                      onClick={() => void handlePromoteToQuoteLibrary()}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-700 text-white text-[10.5px] font-semibold hover:bg-emerald-800 transition flex items-center gap-1 shrink-0 disabled:opacity-60"
                      title="Cập nhật bảng W sang 'Đã chuyển sang Kho Q' và tạo bản ghi mới bên bảng Q (Poetry & Quote Library)"
                    >
                      {promotingToQ ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      Thăng hạng W → Kho Q
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cụm nút Xuất MP4, Tải File Master SEO & Đồng bộ lên Tủ Chén Airtable */}
      <div className="space-y-2 pt-3 border-t border-tea-border mt-3">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void onRenderSingleCup(cup.id)}
          className="w-full py-2.5 px-4 rounded-xl bg-tea-accent text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-tea-accentHover shadow-sm transition disabled:opacity-60"
        >
          {isBusy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {cup.status === 'bundling'
                ? 'Đang đóng gói Bundle...'
                : `Đang kết xuất MP4 (${cup.progress}%)...`}
            </>
          ) : (
            <>
              <Film className="w-4 h-4" /> Xuất MP4 Chén {cup.cupNumber} (9:16 · bt709)
            </>
          )}
        </button>

        {cup.errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-700">
            {cup.errorMessage}
          </div>
        )}

        {trackerNote && (
          <div
            className={`p-2 rounded-lg border text-[11px] flex items-center gap-1.5 ${
              trackerNote.tone === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {trackerNote.tone === 'ok' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span>{trackerNote.text}</span>
          </div>
        )}

        {cup.status === 'completed' && downloadHref ? (
          <div className="grid grid-cols-2 gap-1.5">
            <a
              href={downloadHref}
              download={seoDownloadName}
              className="py-2 px-2.5 rounded-xl bg-tea-ink text-tea-paper text-[11.5px] font-semibold hover:bg-tea-accent transition flex items-center justify-center gap-1.5"
              title={`Tải bản Master đặt tên chuẩn SEO: ${seoDownloadName} (bản lưu Studio: ${cupFileBase}.mp4)`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Tải MP4 (SEO)</span>
            </a>

            <button
              type="button"
              disabled={syncingTracker}
              onClick={() =>
                void pushTrackPatch(
                  {
                    publishStatus,
                    slot: publishSlot,
                    mood: publishMood,
                    seedComment,
                  },
                  true
                )
              }
              className="py-2 px-2.5 rounded-xl border border-tea-accent/50 bg-tea-accent/10 text-tea-accent text-[11.5px] font-semibold hover:bg-tea-accent hover:text-white transition flex items-center justify-center gap-1.5 disabled:opacity-60"
              title='Cập nhật thông tin Chén này lên bảng "Tủ Chén & Lịch Đăng" trên Airtable'
            >
              {syncingTracker ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="truncate">Đang lưu...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Lưu lên Airtable</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="py-1.5 px-2.5 rounded-xl border border-dashed border-tea-border text-[11px] text-tea-muted flex items-center justify-center">
              Chưa xuất MP4
            </div>

            <button
              type="button"
              disabled={syncingTracker}
              onClick={() =>
                void pushTrackPatch(
                  {
                    publishStatus,
                    slot: publishSlot,
                    mood: publishMood,
                    seedComment,
                  },
                  true
                )
              }
              className="py-1.5 px-2.5 rounded-xl border border-tea-border bg-white text-[11px] font-semibold text-tea-ink hover:border-tea-accent hover:text-tea-accent transition flex items-center justify-center gap-1 disabled:opacity-60"
            >
              <Database className="w-3 h-3 text-tea-accent shrink-0" />
              <span className="truncate">Lưu nháp Airtable</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
