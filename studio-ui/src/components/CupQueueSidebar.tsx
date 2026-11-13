import React, { useState } from 'react';
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
} from 'lucide-react';
import { CupRecord } from '../types';
import {
  computePortfolioMixSummary,
  detectConsecutiveSomberNightWarning,
} from '../airtableCupTracker';

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

interface Props {
  cups: CupRecord[];
  activeCupId: string;
  selectedCupIds: string[];
  onSelectCup: (id: string) => void;
  onToggleBatchSelect: (id: string) => void;
  onCreateNewCupFromPaste: (payload: {
    title: string;
    segments: string[];
    textFormat: 'POEM' | 'PROSE';
    pivotWord: string;
  }) => Promise<void>;
  onDuplicateCup: (cup: CupRecord) => Promise<void>;
  onDeleteCup: (id: string) => Promise<void>;
  onEnqueueBatchRender: (ids: string[]) => Promise<void>;
}

export const CupQueueSidebar: React.FC<Props> = ({
  cups,
  activeCupId,
  selectedCupIds,
  onSelectCup,
  onToggleBatchSelect,
  onCreateNewCupFromPaste,
  onDuplicateCup,
  onDeleteCup,
  onEnqueueBatchRender,
}) => {
  const [filter, setFilter] = useState<'all' | 'draft' | 'ready' | 'published'>(
    'all'
  );
  const [isAddingCup, setIsAddingCup] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRawText, setNewRawText] = useState('');
  const [creating, setCreating] = useState(false);

  const isCupPublished = (c: CupRecord) =>
    c.publishTrack?.publishStatus === 'published';

  const isCupReadyToPost = (c: CupRecord) =>
    !isCupPublished(c) &&
    (c.status === 'completed' || c.publishTrack?.publishStatus === 'scheduled');

  const isCupDraft = (c: CupRecord) =>
    !isCupPublished(c) && !isCupReadyToPost(c);

  const filteredCups = cups.filter((c) => {
    if (filter === 'draft') return isCupDraft(c);
    if (filter === 'ready') return isCupReadyToPost(c);
    if (filter === 'published') return isCupPublished(c);
    return true;
  });

  const portfolioMix = computePortfolioMixSummary(cups);
  const somberNightWarning = detectConsecutiveSomberNightWarning(cups);

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
    } finally {
      setCreating(false);
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

  return (
    <aside className="w-[285px] shrink-0 border-r border-tea-border bg-tea-paper/90 flex flex-col h-full">
      {/* Nút + Tạo Chén Mới, Bộ lọc & Thước Tỷ trọng Danh mục 40–30–20–10 */}
      <div className="p-3 border-b border-tea-border bg-tea-bg/50 space-y-2.5">
        {!isAddingCup ? (
          <button
            type="button"
            onClick={() => setIsAddingCup(true)}
            className="w-full py-2 px-3 rounded-xl bg-tea-ink text-tea-paper text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-tea-accent transition"
          >
            <Plus className="w-3.5 h-3.5" />+ Tạo Chén Mới (Paste Nhanh)
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

        {/* Thanh Tỷ trọng Danh mục Chiến lược 40–30–20–10 */}
        {cups.length > 0 && (
          <div className="rounded-lg bg-white/80 border border-tea-border/80 px-2 py-1.5 space-y-1">
            <div className="flex items-center justify-between text-[9.5px] text-tea-muted">
              <span className="font-semibold text-tea-ink">
                Danh mục 40·30·20·10
              </span>
              <span className="font-mono">
                {portfolioMix.map((b) => b.actualPct).join('·')}%
              </span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-tea-edge/70 overflow-hidden flex">
              {portfolioMix.map((bucket) =>
                bucket.count > 0 ? (
                  <div
                    key={bucket.id}
                    style={{
                      width: `${Math.max(4, (bucket.count / cups.length) * 100)}%`,
                    }}
                    className={`${bucket.colorClass} h-full transition-all`}
                    title={`${bucket.shortLabel}: ${bucket.count} Chén (${bucket.actualPct}% · chuẩn ${bucket.targetPct}%)`}
                  />
                ) : null
              )}
            </div>

            <div className="grid grid-cols-4 gap-0.5 text-[9px] text-tea-muted pt-0.5">
              {portfolioMix.map((b) => (
                <span
                  key={b.id}
                  className="truncate flex items-center gap-1"
                  title={`${b.shortLabel}: ${b.count} Chén (${b.actualPct}% / mục tiêu ${b.targetPct}%)`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.colorClass}`}
                  />
                  <span>
                    {b.count} ({b.targetPct}%)
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cảnh báo 2 Chén Khung Tối (Night) mang sắc thái trầm buồn liên tiếp */}
        {somberNightWarning && (
          <div
            className="px-2 py-1.5 rounded-lg bg-indigo-950/[0.06] border border-indigo-400/40 text-[10px] text-indigo-950 flex items-start gap-1.5 leading-snug"
            title={somberNightWarning.message}
          >
            <Moon className="w-3 h-3 text-indigo-700 shrink-0 mt-0.5" />
            <span>{somberNightWarning.message}</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-0.5 rounded-lg bg-white/70 p-1 border border-tea-border/80">
          {(
            [
              { id: 'all', label: `Tất cả (${cups.length})` },
              {
                id: 'draft',
                label: `Nháp (${cups.filter(isCupDraft).length})`,
              },
              {
                id: 'ready',
                label: `Chờ (${cups.filter(isCupReadyToPost).length})`,
              },
              {
                id: 'published',
                label: `Đăng (${cups.filter(isCupPublished).length})`,
              },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`py-1 rounded-md text-[10px] font-semibold transition truncate ${
                filter === f.id
                  ? 'bg-tea-ink text-tea-paper shadow-2xs'
                  : 'text-tea-muted hover:text-tea-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách các Chén */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredCups.map((cup) => {
          const isActive = cup.id === activeCupId;
          const isChecked = selectedCupIds.includes(cup.id);
          const slotShort =
            cup.publishTrack?.slot === 'Morning'
              ? '🌅'
              : cup.publishTrack?.slot === 'Night'
                ? '🌙'
                : '🌤️';
          const tnScoreVal = cup.publishTrack?.tnScore;

          return (
            <div
              key={cup.id}
              onClick={() => onSelectCup(cup.id)}
              className={`group p-2.5 rounded-xl border cursor-pointer transition ${
                isActive
                  ? 'border-tea-accent bg-tea-accent/5 shadow-xs'
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
                    title="Chọn để xuất hàng loạt"
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

              <div className="mt-1.5 pl-5 flex items-center justify-between text-[10px] text-tea-muted">
                <span className="truncate max-w-[165px]">
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onDuplicateCup(cup);
                    }}
                    className="p-1 rounded hover:bg-tea-ink/10 hover:text-tea-ink"
                    title="Nhân bản Chén này"
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
        })}
      </div>

      {/* Nút Xuất Hàng Loạt ở đáy Cột Trái */}
      <div className="p-3 border-t border-tea-border bg-tea-bg/60">
        <button
          type="button"
          disabled={selectedCupIds.length === 0}
          onClick={() => void onEnqueueBatchRender(selectedCupIds)}
          className="w-full py-2 px-3 rounded-xl bg-tea-ink text-tea-paper text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-tea-accent transition disabled:opacity-40"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {selectedCupIds.length > 0
            ? `Xuất Lô (${selectedCupIds.length} Chén)`
            : 'Tick chọn để Xuất Lô'}
        </button>
      </div>
    </aside>
  );
};
