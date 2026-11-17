import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  CheckSquare,
  Square,
  Play,
  Trash2,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  ClipboardPaste,
  Clock,
  Moon,
  Sparkles,
  Flame,
  Archive,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { CupRecord } from '../types';
import {
  computePortfolioMixSummary,
  detectConsecutiveSomberNightWarning,
  detectVisualDnaSequenceWarnings,
} from '../airtableCupTracker';
import {
  LAYOUT_VARIANT_SHORT_LABELS,
  resolveVisualDNA,
} from '../../../src/engine/visualDnaResolver';
import { resolveStageScript } from '../../../src/stage/stageScriptRegistry';
import { THEME_PALETTES } from '../../../src/theme/palettes';

export function parseQuickQuotePaste(rawText: string): {
  segments: string[];
  textFormat: 'POEM' | 'PROSE';
  pivotWord: string;
} {
  const rawLines = rawText
    .replace(/^\s*\r?\n+|\r?\n+\s*$/g, '')
    .split(/\r?\n/)
    .map((l) => l.trim());

  // Giữ dòng trống ("") để tách khổ (20px), gộp nhiều dòng trống liên tiếp thành 1
  const normalizedLines: string[] = [];
  for (const line of rawLines) {
    if (line === '' && normalizedLines[normalizedLines.length - 1] === '') {
      continue;
    }
    normalizedLines.push(line);
  }

  const segments =
    normalizedLines.filter((l) => l.length > 0).length > 0
      ? normalizedLines.slice(0, 12)
      : ['Dòng thơ mới...'];

  const nonEmpty = segments.filter(
    (s) => s.replace(/\*+/g, '').trim().length > 0
  );
  const isPoem =
    nonEmpty.length >= 2 &&
    nonEmpty.every((s) => s.split(/\s+/).length <= 10 && s.length <= 52);

  const lastSeg = (nonEmpty[nonEmpty.length - 1] || '').replace(/\*+/g, '');
  const cleanWords = lastSeg
    .replace(/[.,;!?…""''()]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let pivotWord = lastSeg.trim();
  if (cleanWords.length >= 3) {
    const candidate = `${cleanWords[cleanWords.length - 3]} ${cleanWords[cleanWords.length - 2]}`;
    if (lastSeg.includes(candidate)) {
      pivotWord = candidate;
    } else {
      pivotWord = cleanWords.slice(-2).join(' ');
    }
  } else if (cleanWords.length >= 2) {
    pivotWord = `${cleanWords[0]} ${cleanWords[1]}`;
  } else if (cleanWords.length === 1) {
    pivotWord = cleanWords[0];
  }

  return {
    segments,
    textFormat: isPoem ? 'POEM' : 'PROSE',
    pivotWord,
  };
}

function getCupNumericOrder(cup: CupRecord): number {
  const match = cup.cupNumber.match(/\d+/) || cup.id.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function sortCupsNewestFirst(list: CupRecord[]): CupRecord[] {
  return [...list].sort((a, b) => {
    const diff = getCupNumericOrder(b) - getCupNumericOrder(a);
    return diff !== 0 ? diff : b.id.localeCompare(a.id);
  });
}

function normalizeSearchText(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

function isCupPublished(cup: CupRecord): boolean {
  return cup.publishTrack?.publishStatus === 'published';
}

function isCupArchivedBase(cup: CupRecord): boolean {
  return isCupPublished(cup) || cup.status === 'completed';
}

interface Props {
  cups: CupRecord[];
  activeCupId: string;
  selectedCupIds: string[];
  justRenderedCupIds?: string[];
  editedArchivedCupIds?: string[];
  onSelectCup: (id: string) => void;
  onToggleBatchSelect: (id: string) => void;
  onOpenGeminiImport: () => void;
  onCreateNewCupFromPaste: (payload: {
    title: string;
    segments: string[];
    textFormat: 'POEM' | 'PROSE';
    pivotWord: string;
  }) => Promise<void>;
  onDuplicateCup: (cup: CupRecord) => Promise<void>;
  onDeleteCup: (id: string) => Promise<void>;
  onEnqueueBatchRender: (ids: string[]) => Promise<void>;
  onDismissJustRendered?: (cupId?: string) => void;
  onReopenCupAsDraft?: (cupId: string) => Promise<void>;
}

export const CupQueueSidebar: React.FC<Props> = ({
  cups,
  activeCupId,
  selectedCupIds,
  justRenderedCupIds = [],
  editedArchivedCupIds = [],
  onSelectCup,
  onToggleBatchSelect,
  onOpenGeminiImport,
  onCreateNewCupFromPaste,
  onDuplicateCup,
  onDeleteCup,
  onEnqueueBatchRender,
  onDismissJustRendered,
  onReopenCupAsDraft,
}) => {
  const [activeTab, setActiveTab] = useState<'working' | 'archived'>('working');
  const [archiveSubFilter, setArchiveSubFilter] = useState<
    'all' | 'ready' | 'published'
  >('all');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [showPortfolioDetail, setShowPortfolioDetail] = useState(false);
  const [isAddingCup, setIsAddingCup] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRawText, setNewRawText] = useState('');
  const [creating, setCreating] = useState(false);
  const [reopeningCupId, setReopeningCupId] = useState<string | null>(null);

  // Tự chuyển về tab Đang làm khi vừa nạp/tạo thêm Chén mới từ bên ngoài (Gemini Import, Airtable, v.v.)
  const prevCupCountRef = useRef<number>(cups.length);
  useEffect(() => {
    if (prevCupCountRef.current > 0 && cups.length > prevCupCountRef.current) {
      setActiveTab('working');
    }
    prevCupCountRef.current = cups.length;
  }, [cups.length]);

  const isPinnedJustRendered = (cup: CupRecord): boolean =>
    cup.status === 'completed' &&
    !isCupPublished(cup) &&
    justRenderedCupIds.includes(cup.id);

  const unrenderedCount = cups.filter((c) => !isCupArchivedBase(c)).length;
  const workingCups = sortCupsNewestFirst(
    cups.filter((c) => !isCupArchivedBase(c) || isPinnedJustRendered(c))
  );
  const pinnedJustRenderedCount = workingCups.filter(isPinnedJustRendered).length;

  const archivedBaseCups = sortCupsNewestFirst(cups.filter(isCupArchivedBase));
  const archivedTotalCount = archivedBaseCups.length;
  const publishedCount = archivedBaseCups.filter(isCupPublished).length;
  const readyCount = archivedTotalCount - publishedCount;

  const normalizedQuery = normalizeSearchText(archiveSearch);
  const archivedCups = archivedBaseCups.filter((cup) => {
    if (archiveSubFilter === 'ready' && isCupPublished(cup)) return false;
    if (archiveSubFilter === 'published' && !isCupPublished(cup)) return false;
    if (!normalizedQuery) return true;

    const searchable = normalizeSearchText(
      [
        cup.cupNumber,
        `chen ${cup.cupNumber}`,
        cup.id,
        cup.props.title || '',
        cup.props.pivotWord || '',
        cup.props.author || '',
        ...cup.props.segments,
        cup.publishTrack?.mood || '',
      ].join(' ')
    );
    return searchable.includes(normalizedQuery);
  });

  const activeCupObj = cups.find((c) => c.id === activeCupId);
  const portfolioMix = computePortfolioMixSummary(cups);
  const activeSomberWarning = detectConsecutiveSomberNightWarning(cups, {
    onlyActiveDrafts: true,
  });
  const dnaWarnings = detectVisualDnaSequenceWarnings(cups);

  const handleSubmitNewCup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRawText.trim()) return;
    setCreating(true);
    try {
      const parsed = parseQuickQuotePaste(newRawText);
      await onCreateNewCupFromPaste({
        title: newTitle.trim() || 'Tĩnh',
        segments: parsed.segments,
        textFormat: parsed.textFormat,
        pivotWord: parsed.pivotWord,
      });
      setNewTitle('');
      setNewRawText('');
      setIsAddingCup(false);
      setActiveTab('working');
    } finally {
      setCreating(false);
    }
  };

  const handleReopenToWorking = async (cupId: string) => {
    if (!onReopenCupAsDraft) return;
    setReopeningCupId(cupId);
    try {
      await onReopenCupAsDraft(cupId);
      setActiveTab('working');
    } finally {
      setReopeningCupId(null);
    }
  };

  const renderStatusBadge = (cup: CupRecord) => {
    if (cup.status === 'bundling') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded-full shrink-0">
          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Bundle...
        </span>
      );
    }
    if (cup.status === 'rendering') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-tea-accent bg-tea-accent/15 px-2 py-0.5 rounded-full shrink-0">
          <Loader2 className="w-2.5 h-2.5 animate-spin" /> {cup.progress}%
        </span>
      );
    }
    if (cup.status === 'queued') {
      return (
        <span className="text-[10px] font-medium text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
          Chờ...
        </span>
      );
    }
    if (cup.status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-500/10 px-2 py-0.5 rounded-full shrink-0">
          <AlertCircle className="w-2.5 h-2.5" /> Lỗi
        </span>
      );
    }

    if (isPinnedJustRendered(cup)) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-500/18 px-2 py-0.5 rounded-full shrink-0">
          ✨ Vừa xuất xong
        </span>
      );
    }

    if (cup.publishTrack?.publishStatus === 'published') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-500/16 px-2 py-0.5 rounded-full shrink-0">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" /> Đã đăng
        </span>
      );
    }
    if (cup.publishTrack?.publishStatus === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-800 bg-sky-500/14 px-2 py-0.5 rounded-full shrink-0">
          <Clock className="w-2.5 h-2.5 text-sky-700" /> Chờ đăng
        </span>
      );
    }
    if (cup.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-900 bg-amber-500/14 px-2 py-0.5 rounded-full shrink-0">
          <CheckCircle2 className="w-2.5 h-2.5 text-amber-700" /> Đã xuất
        </span>
      );
    }

    return (
      <span className="text-[10px] font-medium text-tea-muted bg-tea-edge/60 px-2 py-0.5 rounded-full shrink-0">
        Nháp
      </span>
    );
  };

  const renderCupCard = (
    cup: CupRecord,
    variant: 'working' | 'archived'
  ) => {
    const isActive = cup.id === activeCupId;
    const isChecked = selectedCupIds.includes(cup.id);
    const pinnedJustDone = isPinnedJustRendered(cup);
    const isEditedArchived =
      variant === 'archived' && editedArchivedCupIds.includes(cup.id);
    const isReopening = reopeningCupId === cup.id;

    const slotShort =
      cup.publishTrack?.slot === 'Morning'
        ? '🌅'
        : cup.publishTrack?.slot === 'Night'
          ? '🌙'
          : '🌤️';
    const tnScoreVal = cup.publishTrack?.tnScore;
    const cupSceneId = cup.props.motion?.sceneId || cup.props.motion?.archetype;
    const cupDna = resolveVisualDNA(
      cup.props,
      resolveStageScript(cupSceneId, cup.props.motion?.stageScript)
    );
    const cupPalette =
      THEME_PALETTES[cup.props.themeId || 'MINIMAL_LIGHT'] ||
      THEME_PALETTES.MINIMAL_LIGHT;
    const layoutTag = cupDna.isLegacyLocked
      ? '🔒 Gốc'
      : LAYOUT_VARIANT_SHORT_LABELS[cupDna.layout];

    return (
      <div
        key={cup.id}
        onClick={() => onSelectCup(cup.id)}
        className={`group p-2.5 rounded-xl border cursor-pointer transition ${
          isActive
            ? 'border-tea-accent bg-tea-accent/5 shadow-xs'
            : pinnedJustDone
              ? 'border-emerald-300 bg-emerald-50/50 hover:border-tea-accent/50'
              : 'border-tea-border/80 bg-white/75 hover:border-tea-accent/40'
        }`}
      >
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBatchSelect(cup.id);
              }}
              className="text-tea-muted hover:text-tea-accent shrink-0"
              title={
                variant === 'working'
                  ? 'Chọn để xuất hàng loạt'
                  : 'Chọn để xuất lại hàng loạt'
              }
            >
              {isChecked ? (
                <CheckSquare className="w-3.5 h-3.5 text-tea-accent" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>
            <span className="text-xs font-bold tracking-wider uppercase text-tea-ink truncate">
              CHÉN {cup.cupNumber} — {cup.props.title || 'TRÀ NGUỘI'}
            </span>
          </div>
          {renderStatusBadge(cup)}
        </div>

        <p className="font-serif text-xs text-tea-muted truncate pl-5 leading-relaxed">
          {cup.props.segments[0] || '...'}
        </p>

        {cup.status === 'rendering' && (
          <div className="mt-2 ml-5 h-1.5 rounded-full bg-tea-edge overflow-hidden">
            <div
              className="h-full bg-tea-accent transition-all duration-300"
              style={{ width: `${cup.progress}%` }}
            />
          </div>
        )}

        {isEditedArchived && (
          <div className="mt-1.5 ml-5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-300/80 flex items-center justify-between gap-1.5 text-[10px] text-amber-900">
            <span className="font-medium truncate">Đã sửa · Cần xuất lại</span>
            {onReopenCupAsDraft && (
              <button
                type="button"
                disabled={isReopening}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleReopenToWorking(cup.id);
                }}
                className="shrink-0 font-semibold text-amber-950 underline hover:text-tea-accent disabled:opacity-50"
              >
                ↺ Đưa về Đang làm
              </button>
            )}
          </div>
        )}

        <div className="mt-1.5 pl-5 flex items-center justify-between gap-1 text-[10px] text-tea-muted">
          <span className="truncate min-w-0 flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full border border-black/15 shrink-0"
              style={{ backgroundColor: cupPalette.background }}
              title={`Bảng màu: ${cupPalette.name} · Bố cục: ${layoutTag}`}
            />
            <span className="px-1 py-0.2 rounded bg-tea-bg border border-tea-border/70 text-[9px] font-medium text-tea-ink shrink-0">
              {layoutTag}
            </span>
            <span className="truncate">
              {slotShort}{' '}
              {cup.publishTrack?.mood ? `${cup.publishTrack.mood} · ` : ''}
              {tnScoreVal !== undefined ? (
                <span
                  className={`font-mono font-semibold ${
                    tnScoreVal >= 110 ? 'text-emerald-700' : 'text-tea-ink'
                  }`}
                >
                  {tnScoreVal >= 110 ? '🚀' : ''}
                  {tnScoreVal.toFixed(0)}đ ·{' '}
                </span>
              ) : null}
              <span className="font-mono">
                {cup.props.motion.sceneId || cup.props.motion.archetype}
              </span>
            </span>
          </span>

          <div
            className={`flex items-center gap-0.5 shrink-0 transition ${
              isActive || pinnedJustDone
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {pinnedJustDone && onDismissJustRendered && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissJustRendered(cup.id);
                }}
                className="px-1.5 py-0.5 rounded bg-emerald-100/90 text-emerald-900 font-semibold text-[9.5px] hover:bg-emerald-200 transition mr-0.5"
                title="Cất Chén này sang Kho Đã làm"
              >
                Cất
              </button>
            )}
            {variant === 'archived' && onReopenCupAsDraft && (
              <button
                type="button"
                disabled={isReopening}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleReopenToWorking(cup.id);
                }}
                className="p-1 rounded hover:bg-tea-accent/15 hover:text-tea-accent disabled:opacity-50"
                title="Đưa về Đang làm để chỉnh sửa / xuất lại"
              >
                {isReopening ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                await onDuplicateCup(cup);
                setActiveTab('working');
              }}
              className="p-1 rounded hover:bg-tea-ink/10 hover:text-tea-ink"
              title="Nhân bản thành Chén nháp mới"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void onDeleteCup(cup.id);
              }}
              className="p-1 rounded hover:bg-red-500/10 hover:text-red-600"
              title="Xóa Chén này"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Trạng thái nút Xuất Lô thông minh theo Tab
  const checkedWorkingIds = workingCups
    .filter((c) => selectedCupIds.includes(c.id))
    .map((c) => c.id);
  const actionableDraftIds = workingCups
    .filter((c) => c.status === 'draft' || c.status === 'failed')
    .map((c) => c.id);
  const checkedArchivedIds = archivedCups
    .filter((c) => selectedCupIds.includes(c.id))
    .map((c) => c.id);

  const footerIdsToRender =
    activeTab === 'working'
      ? checkedWorkingIds.length > 0
        ? checkedWorkingIds
        : actionableDraftIds
      : checkedArchivedIds;

  const footerDisabled = footerIdsToRender.length === 0;
  const footerLabel =
    activeTab === 'working'
      ? checkedWorkingIds.length > 0
        ? `Xuất Lô (${checkedWorkingIds.length} Chén đã chọn)`
        : actionableDraftIds.length > 0
          ? `Xuất tất cả Nháp (${actionableDraftIds.length} Chén)`
          : 'Chưa có Chén nháp chờ xuất'
      : checkedArchivedIds.length > 0
        ? `Xuất lại (${checkedArchivedIds.length} Chén đã chọn)`
        : 'Tick ô vuông nếu cần xuất lại';

  return (
    <aside className="w-[285px] shrink-0 border-r border-tea-border bg-tea-paper/90 flex flex-col h-full">
      {/* 1. Cụm Tạo Nhanh + Thanh Tỷ trọng thu gọn + 2 Tab Chế Độ */}
      <div className="p-2.5 border-b border-tea-border bg-tea-bg/50 space-y-2">
        <button
          type="button"
          onClick={onOpenGeminiImport}
          className="w-full py-2.5 px-3 rounded-xl bg-tea-accent text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-tea-accentHover shadow-xs transition"
          title="Dán thẳng gói kịch bản JSON từ Gemini Web để lên đủ Câu chữ, Đạo cụ, Sân khấu & Xem Preview ngay"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Dán Gói Gemini (Xem Ngay)
        </button>

        {!isAddingCup ? (
          <button
            type="button"
            onClick={() => setIsAddingCup(true)}
            className="w-full py-1.5 px-3 rounded-xl border border-tea-border bg-white/90 text-tea-ink text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:border-tea-accent transition"
          >
            <Plus className="w-3 h-3 text-tea-accent" />
            Tạo Nháp Từ Câu Chữ Thô
          </button>
        ) : (
          <form
            onSubmit={handleSubmitNewCup}
            className="p-3 rounded-xl bg-white border border-tea-accent/50 shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-tea-ink flex items-center gap-1">
                <ClipboardPaste className="w-3.5 h-3.5 text-tea-accent" />
                Tạo Chén Từ Đoạn Thơ / Quote
              </span>
              <button
                type="button"
                onClick={() => setIsAddingCup(false)}
                className="p-1 rounded text-tea-muted hover:text-tea-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tiêu đề ngắn (VD: Về, Đủ ấm, Nghỉ...)"
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-tea-border bg-tea-bg/30 focus:outline-none focus:border-tea-accent"
            />

            <textarea
              rows={5}
              value={newRawText}
              onChange={(e) => setNewRawText(e.target.value)}
              placeholder={
                'Dán nguyên cả bài thơ 4 câu hoặc đoạn quote nhiều dòng vào đây...\nHệ thống tự tách dòng & gán pivotWord!'
              }
              autoFocus
              className="w-full font-serif text-xs leading-relaxed p-2.5 rounded-lg border border-tea-border bg-tea-bg/20 focus:outline-none focus:border-tea-accent"
            />

            <button
              type="submit"
              disabled={creating || !newRawText.trim()}
              className="w-full py-2 rounded-lg bg-tea-accent text-white text-xs font-semibold hover:bg-tea-accentHover disabled:opacity-50"
            >
              {creating ? 'Đang tách dòng & tạo...' : 'Tách Dòng & Mở Chén Ngay'}
            </button>
          </form>
        )}

        {/* Thanh Tỷ trọng 40·30·20·10 thu gọn 1 dòng (Collapsible Pill) */}
        {cups.length > 0 && (
          <div className="rounded-lg bg-white/80 border border-tea-border/80 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPortfolioDetail((v) => !v)}
              className="w-full px-2 py-1.5 flex items-center justify-between gap-1.5 text-[10px] hover:bg-tea-bg/40 transition"
              title="Bấm để xem chi tiết tỷ trọng danh mục 40·30·20·10"
            >
              <span className="font-semibold text-tea-ink shrink-0">
                40·30·20·10
              </span>

              <div className="w-14 h-1.5 rounded-full bg-tea-edge/70 overflow-hidden flex shrink-0">
                {portfolioMix.map((bucket) =>
                  bucket.count > 0 ? (
                    <div
                      key={bucket.id}
                      style={{
                        width: `${Math.max(4, (bucket.count / cups.length) * 100)}%`,
                      }}
                      className={`${bucket.colorClass} h-full transition-all`}
                    />
                  ) : null
                )}
              </div>

              <div className="flex items-center gap-1 text-tea-muted shrink-0">
                <span className="font-mono text-[9.5px]">
                  {portfolioMix.map((b) => b.actualPct).join('·')}%
                </span>
                {activeSomberWarning && (
                  <span title={activeSomberWarning.message}>
                    <Moon className="w-3 h-3 text-indigo-700" />
                  </span>
                )}
                {dnaWarnings.length > 0 && (
                  <span title={dnaWarnings[0].message}>
                    <Layers className="w-3 h-3 text-amber-600" />
                  </span>
                )}
                {showPortfolioDetail ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </button>

            {showPortfolioDetail && (
              <div className="px-2 pb-2 pt-1 border-t border-tea-border/60 space-y-1.5">
                <div className="grid grid-cols-2 gap-1 text-[9.5px] text-tea-muted">
                  {portfolioMix.map((b) => (
                    <span
                      key={b.id}
                      className="truncate flex items-center gap-1"
                      title={`${b.shortLabel}: ${b.count} Chén (${b.actualPct}% / mục tiêu ${b.targetPct}%)`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.colorClass}`}
                      />
                      <span className="truncate">
                        {b.shortLabel}:{' '}
                        <strong className="text-tea-ink">{b.count}</strong> (
                        {b.actualPct}%/{b.targetPct}%)
                      </span>
                    </span>
                  ))}
                </div>

                {activeSomberWarning && (
                  <div className="px-2 py-1.5 rounded-md bg-indigo-950/[0.06] border border-indigo-400/40 text-[9.5px] text-indigo-950 flex items-start gap-1.5 leading-snug">
                    <Moon className="w-3 h-3 text-indigo-700 shrink-0 mt-0.5" />
                    <span>{activeSomberWarning.message}</span>
                  </div>
                )}

                {dnaWarnings.length > 0 && (
                  <div className="px-2 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/35 text-[9.5px] text-amber-950 flex items-start gap-1.5 leading-snug">
                    <Layers className="w-3 h-3 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      {dnaWarnings[0].message}
                      {dnaWarnings.length > 1
                        ? ` (+${dnaWarnings.length - 1} cảnh báo khác)`
                        : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Thanh 2 Tab Chế Độ Rõ Ràng: Đang làm (Mặc định) ↔ Đã làm (Kho lưu trữ) */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/85 p-1 border border-tea-border">
          <button
            type="button"
            onClick={() => setActiveTab('working')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'working'
                ? 'bg-tea-ink text-tea-paper shadow-2xs'
                : 'text-tea-muted hover:text-tea-ink'
            }`}
          >
            {activeTab === 'working' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-tea-accent shrink-0" />
            ) : (
              <Flame className="w-3 h-3 shrink-0" />
            )}
            <span className="truncate">Đang làm ({unrenderedCount})</span>
            {pinnedJustRenderedCount > 0 && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                title="Có Chén vừa xuất xong MP4 trong phiên này"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'archived'
                ? 'bg-tea-ink text-tea-paper shadow-2xs'
                : 'text-tea-muted hover:text-tea-ink'
            }`}
          >
            <Archive className="w-3 h-3 shrink-0" />
            <span className="truncate">Đã làm ({archivedTotalCount})</span>
          </button>
        </div>
      </div>

      {/* 2. Vùng Danh sách Chén theo Tab Đang chọn */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {dnaWarnings.length > 0 && (
          <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300/80 text-[10px] text-amber-950 flex items-start gap-1.5 leading-snug">
            <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              {dnaWarnings[0].message}
              {dnaWarnings.length > 1
                ? ` (+${dnaWarnings.length - 1} lưu ý khác)`
                : ''}
            </span>
          </div>
        )}

        {activeTab === 'working' ? (
          <>
            {activeCupObj &&
              isCupArchivedBase(activeCupObj) &&
              !isPinnedJustRendered(activeCupObj) && (
                <div className="px-2.5 py-1.5 rounded-xl bg-amber-50/90 border border-amber-300/70 flex items-center justify-between gap-2 text-[10.5px] text-amber-950">
                  <span className="truncate">
                    Đang mở: <strong>Chén {activeCupObj.cupNumber}</strong> (Kho
                    Đã làm)
                  </span>
                  {onReopenCupAsDraft && (
                    <button
                      type="button"
                      disabled={reopeningCupId === activeCupObj.id}
                      onClick={() => void handleReopenToWorking(activeCupObj.id)}
                      className="shrink-0 px-1.5 py-0.5 rounded bg-white border border-amber-300 font-semibold text-amber-900 hover:border-tea-accent hover:text-tea-accent transition disabled:opacity-50"
                    >
                      ↺ Đưa về Đang làm
                    </button>
                  )}
                </div>
              )}

            {pinnedJustRenderedCount > 0 && (
              <div className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-[10.5px] text-emerald-900">
                <span className="font-medium truncate">
                  ✨ {pinnedJustRenderedCount} Chén vừa xuất xong MP4
                </span>
                {onDismissJustRendered && (
                  <button
                    type="button"
                    onClick={() => onDismissJustRendered()}
                    className="shrink-0 font-semibold underline hover:text-emerald-700"
                  >
                    Cất vào Đã làm
                  </button>
                )}
              </div>
            )}

            {workingCups.length > 0 ? (
              workingCups.map((cup) => renderCupCard(cup, 'working'))
            ) : (
              <div className="mt-4 px-4 py-6 rounded-2xl border border-dashed border-tea-border bg-white/60 text-center space-y-3">
                <div className="mx-auto w-9 h-9 rounded-full bg-emerald-500/12 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-tea-ink">
                    Bàn trà đang sạch tươm
                  </h3>
                  <p className="text-[11px] text-tea-muted leading-relaxed">
                    Tất cả {archivedTotalCount} Chén đều đã xuất video hoàn tất.
                  </p>
                </div>
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={onOpenGeminiImport}
                    className="w-full py-2 px-3 rounded-xl bg-tea-accent text-white text-[11px] font-bold hover:bg-tea-accentHover transition"
                  >
                    + Dán Gói Gemini Tạo Chén Mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('archived')}
                    className="w-full py-1.5 px-3 rounded-xl border border-tea-border bg-white text-tea-ink text-[11px] font-semibold hover:border-tea-accent transition"
                  >
                    Xem lại Kho Đã làm ({archivedTotalCount}) →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Thanh Tra Cứu Kho Đã Làm (Tìm nhanh + Lọc Chờ đăng / Đã đăng) */}
            <div className="sticky top-0 z-10 -mx-0.5 px-0.5 pb-1.5 bg-tea-paper/95 backdrop-blur-xs space-y-1.5">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-tea-muted absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder="Tìm số chén, tiêu đề, câu thơ..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-tea-border bg-white text-[11px] text-tea-ink placeholder:text-tea-muted/80 focus:outline-none focus:border-tea-accent"
                />
                {archiveSearch && (
                  <button
                    type="button"
                    onClick={() => setArchiveSearch('')}
                    className="absolute right-2 p-0.5 rounded text-tea-muted hover:text-tea-ink"
                    title="Xóa từ khóa tìm kiếm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/75 p-0.5 border border-tea-border/80">
                {(
                  [
                    { id: 'all', label: `Tất cả (${archivedTotalCount})` },
                    { id: 'ready', label: `Chờ đăng (${readyCount})` },
                    { id: 'published', label: `Đã đăng (${publishedCount})` },
                  ] as const
                ).map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setArchiveSubFilter(chip.id)}
                    className={`py-1 rounded-md text-[10px] font-semibold transition truncate ${
                      archiveSubFilter === chip.id
                        ? 'bg-tea-ink text-tea-paper shadow-2xs'
                        : 'text-tea-muted hover:text-tea-ink'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {archivedCups.length > 0 ? (
              archivedCups.map((cup) => renderCupCard(cup, 'archived'))
            ) : (
              <div className="mt-4 px-3 py-5 rounded-xl border border-dashed border-tea-border bg-white/50 text-center space-y-2">
                <p className="text-[11px] text-tea-muted">
                  {archiveSearch.trim()
                    ? `Không tìm thấy Chén phù hợp với từ khóa "${archiveSearch.trim()}"`
                    : 'Chưa có Chén nào trong mục này.'}
                </p>
                {(archiveSearch.trim() || archiveSubFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setArchiveSearch('');
                      setArchiveSubFilter('all');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-tea-border bg-white text-[10.5px] font-semibold text-tea-ink hover:border-tea-accent transition"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. Nút Xuất Hàng Loạt Thông Minh ở Đáy Cột Trái */}
      <div className="p-3 border-t border-tea-border bg-tea-bg/60">
        <button
          type="button"
          disabled={footerDisabled}
          onClick={() => void onEnqueueBatchRender(footerIdsToRender)}
          className="w-full py-2 px-3 rounded-xl bg-tea-ink text-tea-paper text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-tea-accent transition disabled:opacity-40"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="truncate">{footerLabel}</span>
        </button>
      </div>
    </aside>
  );
};
