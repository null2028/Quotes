import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Download,
  FileText,
  Film,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  GEMINI_SKILL_NAME,
  GEMINI_SKILL_DESCRIPTION,
  sanitizeAndNormalizeCupBundle,
  GoiChenValidationError,
} from '../../../src/automation/geminiBundleBridge';
import { isGoiChen, parseGoiChen } from '../../../src/stage/goiChenParser';
import {
  THEME_PALETTES,
  isDarkThemePalette,
} from '../../../src/theme/palettes';
import { CupRecord } from '../types';

interface Props {
  isOpen: boolean;
  activeCup?: CupRecord;
  onClose: () => void;
  onImportBundle: (params: {
    rawText: string;
    mode: 'create_new' | 'overwrite_cup';
    targetCupId?: string;
    autoFixHeadroom: boolean;
  }) => Promise<void>;
}

export const GeminiBundleImportModal: React.FC<Props> = ({
  isOpen,
  activeCup,
  onClose,
  onImportBundle,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'skill_setup'>('import');
  const [rawPaste, setRawPaste] = useState('');
  const [mode, setMode] = useState<'create_new' | 'overwrite_cup'>('create_new');
  const [autoFixHeadroom, setAutoFixHeadroom] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedSkillMd, setCopiedSkillMd] = useState(false);
  const [copiedGoiChenErrors, setCopiedGoiChenErrors] = useState(false);
  const [downloadedType, setDownloadedType] = useState<'zip' | 'md' | null>(null);
  const [skillMdContent, setSkillMdContent] = useState<string>('Đang tải...');

  useEffect(() => {
    if (isOpen && activeTab === 'skill_setup') {
      fetch(`/api/skills/${GEMINI_SKILL_NAME}/SKILL.md`)
        .then((r) => r.ok ? r.text() : Promise.reject('Chạy npm run gen:skill trước'))
        .then(setSkillMdContent)
        .catch((e) => setSkillMdContent(`Lỗi: ${e}`));
    }
  }, [isOpen, activeTab]);

  const livePreviewCheck = useMemo(() => {
    if (!rawPaste.trim()) return null;
    try {
      const parsed = sanitizeAndNormalizeCupBundle(rawPaste, {
        defaultMode: mode,
        targetCupId: activeCup?.id,
        fallbackCupProps: activeCup
          ? {
              title: activeCup.props.title,
              segments: activeCup.props.segments,
              pivotWord: activeCup.props.pivotWord,
              textFormat: activeCup.props.textFormat,
            }
          : undefined,
      });
      // Detect if this was legacy JSON (not Gói Chén and not Làn tự do `che_do: "tu_do"`)
      let isLegacy = false;
      try {
        const rawObj = JSON.parse(rawPaste.trim().replace(/^```json\s*/, '').replace(/```\s*$/, ''));
        if (rawObj && typeof rawObj === 'object' && !isGoiChen(rawObj) && !parsed.isFreeMode) {
          isLegacy = true;
        }
      } catch { /* ignore */ }
      return { ok: true as const, data: parsed, isLegacy };
    } catch (err: unknown) {
      if (err instanceof GoiChenValidationError) {
        return {
          ok: false as const,
          isGoiChenError: true as const,
          goiChenErrors: err.errors,
          error: err.message,
        };
      }
      return {
        ok: false as const,
        isGoiChenError: false as const,
        goiChenErrors: [] as string[],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [rawPaste, mode, activeCup]);

  if (!isOpen) return null;

  const handleOneClickClipboardImport = async () => {
    setSubmitError(null);
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        setSubmitError(
          'Clipboard đang trống. Hãy bấm Copy khối JSON trên Gemini rồi thử lại.'
        );
        return;
      }
      setRawPaste(clip);
      setSubmitting(true);
      await onImportBundle({
        rawText: clip,
        mode,
        targetCupId: mode === 'overwrite_cup' ? activeCup?.id : undefined,
        autoFixHeadroom,
      });
      setRawPaste('');
      onClose();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Không đọc được Clipboard tự động — vui lòng nhấn Cmd+V vào ô bên dưới.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!rawPaste.trim()) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onImportBundle({
        rawText: rawPaste,
        mode,
        targetCupId: mode === 'overwrite_cup' ? activeCup?.id : undefined,
        autoFixHeadroom,
      });
      setRawPaste('');
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopySkillMd = async () => {
    await navigator.clipboard.writeText(skillMdContent);
    setCopiedSkillMd(true);
    setTimeout(() => setCopiedSkillMd(false), 2400);
  };

  const triggerBlobDownload = (
    bytesOrText: Uint8Array | string,
    fileName: string,
    mimeType: string
  ) => {
    const part: BlobPart =
      typeof bytesOrText === 'string'
        ? bytesOrText
        : new Uint8Array(bytesOrText);
    const blob = new Blob([part], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleDownloadSkillZip = () => {
    // Download zip directly from server
    const link = document.createElement('a');
    link.href = `/api/skills/${GEMINI_SKILL_NAME}.zip`;
    link.download = `${GEMINI_SKILL_NAME}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedType('zip');
    setTimeout(() => setDownloadedType(null), 2800);
  };

  const handleDownloadSkillMd = () => {
    triggerBlobDownload(
      skillMdContent,
      'SKILL.md',
      'text/markdown;charset=utf-8'
    );
    setDownloadedType('md');
    setTimeout(() => setDownloadedType(null), 2800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-tea-paper border border-tea-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-tea-border bg-tea-bg/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-tea-accent/15 text-tea-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-tea-ink">
                Nạp Gói Kịch Bản Gemini · Xem Live Preview Ngay (0.1s)
              </h2>
              <p className="text-[11px] text-tea-muted">
                Không cần chạm vào code — dán thẳng phản hồi từ Gemini là lên đầy đủ Câu chữ, Đạo cụ, Sân khấu &amp; Foley
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-tea-muted hover:text-tea-ink hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 bg-tea-bg/35 border-b border-tea-border flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'import'
                ? 'border-tea-accent text-tea-accent bg-white/80'
                : 'border-transparent text-tea-muted hover:text-tea-ink'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            1. Dán Gói JSON &amp; Xem Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('skill_setup')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'skill_setup'
                ? 'border-tea-accent text-tea-accent bg-white/80'
                : 'border-transparent text-tea-muted hover:text-tea-ink'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            2. Cài Gemini Skill &ldquo;/{GEMINI_SKILL_NAME}&rdquo; (Tải 1 lần)
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'import' ? (
            <>
              {/* Chế độ Tạo mới vs Ghi đè Chén đang mở */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMode('create_new')}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                    mode === 'create_new'
                      ? 'border-tea-accent bg-white ring-2 ring-tea-accent/15'
                      : 'border-tea-border bg-white/60 hover:border-tea-accent/40'
                  }`}
                >
                  <Plus className="w-4 h-4 text-tea-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-tea-ink">
                      Tạo thành Chén mới tiếp theo
                    </div>
                    <div className="text-[10.5px] text-tea-muted">
                      Tự đánh số Chén kế tiếp, lưu đạo cụ &amp; kịch bản riêng vào Kho Cảnh
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!activeCup}
                  onClick={() => setMode('overwrite_cup')}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 disabled:opacity-40 ${
                    mode === 'overwrite_cup'
                      ? 'border-tea-accent bg-white ring-2 ring-tea-accent/15'
                      : 'border-tea-border bg-white/60 hover:border-tea-accent/40'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 text-tea-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-tea-ink">
                      Cập nhật vào Chén đang mở
                      {activeCup ? ` (Chén ${activeCup.cupNumber})` : ''}
                    </div>
                    <div className="text-[10.5px] text-tea-muted">
                      Rất tiện khi thử liên tiếp Kịch bản 1, 2, 3 của Gemini trên cùng 1 Chén
                    </div>
                  </div>
                </button>
              </div>

              {/* Nút 1-Click đọc thẳng Clipboard */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleOneClickClipboardImport}
                className="w-full py-3 px-4 rounded-xl bg-tea-accent text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-tea-accentHover shadow-sm transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang dựng sân khấu &amp; mở Live Preview...
                  </>
                ) : (
                  <>
                    <ClipboardPaste className="w-4 h-4" />
                    ⚡ Dán Thẳng Từ Clipboard &amp; Mở Live Preview Ngay (1-Click)
                  </>
                )}
              </button>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-tea-muted">
                    Hoặc nhấn Cmd+V dán nội dung Gemini vào đây để kiểm tra trước:
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-tea-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoFixHeadroom}
                      onChange={(e) => setAutoFixHeadroom(e.target.checked)}
                      className="accent-tea-accent rounded"
                    />
                    <span>Tự nâng mái hiên/vòm che nếu chạm đầu nhân vật</span>
                  </label>
                </div>

                <textarea
                  rows={8}
                  value={rawPaste}
                  onChange={(e) => {
                    setRawPaste(e.target.value);
                    setSubmitError(null);
                  }}
                  placeholder={`Dán nguyên phản hồi có chứa khối \`\`\`json ... \`\`\` từ Gemini vào đây...\nHệ thống tự bóc tách JSON, tự lọc bỏ chữ thừa bên ngoài!`}
                  spellCheck={false}
                  className="w-full font-mono text-xs leading-relaxed p-3 rounded-xl border border-tea-border bg-white focus:outline-none focus:border-tea-accent"
                />
              </div>

              {/* Thẻ kiểm tra nhanh trực tiếp trước khi bấm Áp dụng */}
              {livePreviewCheck && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    livePreviewCheck.ok
                      ? 'bg-emerald-500/[0.08] border-emerald-600/30 text-tea-ink'
                      : livePreviewCheck.isGoiChenError
                        ? 'bg-red-500/[0.08] border-red-500/30 text-red-900'
                        : 'bg-red-500/[0.08] border-red-500/30 text-red-900'
                  }`}
                >
                  {livePreviewCheck.ok ? (
                    <>
                      {/* Legacy warning banner */}
                      {livePreviewCheck.isLegacy && (
                        <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-950 flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <span className="font-semibold">
                            ⚠️ Định dạng cũ — vẫn mở được, nên làm lại bằng skill mới
                          </span>
                        </div>
                      )}
                      {livePreviewCheck.data.isFreeMode && (
                        <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-600/25 text-[11px] text-sky-950 font-semibold">
                          🎨 Làn tự do (<code>che_do: &ldquo;tu_do&rdquo;</code>) — đã kiểm vỡ hình, giữ nguyên bản gốc <code>scriptGoc</code>.
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          Hợp lệ! Sẵn sàng dựng: &ldquo;{livePreviewCheck.data.title}&rdquo;
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-white border border-emerald-600/25 text-emerald-900">
                          {livePreviewCheck.data.syllableCount} âm tiết ·{' '}
                          {livePreviewCheck.data.syllableLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-700/15">
                        <div>
                          <span className="text-tea-muted">Điểm lật Đỏ Chu Sa:</span>{' '}
                          <strong className="text-tea-accent">
                            {livePreviewCheck.data.pivotWord}
                          </strong>
                        </div>
                        <div>
                          <span className="text-tea-muted">Kịch bản sân khấu:</span>{' '}
                          <strong>
                            {livePreviewCheck.data.tsxMeta?.name ||
                              livePreviewCheck.data.stageScript?.name ||
                              livePreviewCheck.data.sceneId ||
                              'Cảnh mặc định'}
                          </strong>{' '}
                          ({Object.keys(livePreviewCheck.data.customProps).length}{' '}
                          đạo cụ mới)
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-emerald-700/15 text-[10.5px]">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold border ${
                            isDarkThemePalette(livePreviewCheck.data.themeId)
                              ? 'bg-slate-900 text-amber-100 border-slate-700'
                              : 'bg-amber-50 text-amber-950 border-amber-300'
                          }`}
                        >
                          {isDarkThemePalette(livePreviewCheck.data.themeId)
                            ? '🌙 Nền tối'
                            : '☀️ Nền sáng'}{' '}
                          ·{' '}
                          {THEME_PALETTES[livePreviewCheck.data.themeId]?.name ||
                            livePreviewCheck.data.themeId}{' '}
                          ({livePreviewCheck.data.themeId})
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-white border border-emerald-700/20 text-emerald-950">
                          🧬 Visual DNA: {livePreviewCheck.data.visualDNA?.mode || 'AUTO'}
                          {livePreviewCheck.data.visualDNA?.layout
                            ? ` · ${livePreviewCheck.data.visualDNA.layout}`
                            : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-white border border-emerald-700/20 text-tea-ink">
                          ⏱️ {livePreviewCheck.data.durationMode} · 🔊{' '}
                          {livePreviewCheck.data.audioMode}
                        </span>
                      </div>

                      {(livePreviewCheck.data.engineCapabilities.hasArticulatedProps ||
                        livePreviewCheck.data.engineCapabilities.hasCustomTerrain ||
                        livePreviewCheck.data.engineCapabilities.hasCustomActorRig ||
                        livePreviewCheck.data.engineCapabilities.hasCustomTsxCode) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {livePreviewCheck.data.engineCapabilities.hasArticulatedProps && (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-700/10 text-emerald-900 border border-emerald-700/20">
                              ⚙️ Khớp động JSON (60fps)
                            </span>
                          )}
                          {livePreviewCheck.data.engineCapabilities.hasCustomTerrain && (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-700/10 text-emerald-900 border border-emerald-700/20">
                              ⛰️ Địa hình tự vẽ
                            </span>
                          )}
                          {livePreviewCheck.data.engineCapabilities.hasCustomActorRig && (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-700/10 text-emerald-900 border border-emerald-700/20">
                              🐾 Nhân vật khớp động mới
                            </span>
                          )}
                          {livePreviewCheck.data.engineCapabilities.hasCustomTsxCode && (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-tea-accent/12 text-tea-accent border border-tea-accent/30">
                              🧬 Mô-đun .tsx Tự Biên Dịch &amp; HMR
                            </span>
                          )}
                        </div>
                      )}

                      {livePreviewCheck.data.layoutWarnings.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-950 space-y-1">
                          {livePreviewCheck.data.layoutWarnings.map((w, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                              <span>
                                {w.message}
                                {autoFixHeadroom && w.code === 'HEADROOM_OVERLAP'
                                  ? ' (Đã bật tự động nâng thoáng đầu khi nạp!)'
                                  : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : livePreviewCheck.isGoiChenError ? (
                    <>
                      <div className="font-bold text-red-900 flex items-center gap-1.5">
                        <X className="w-4 h-4 text-red-700" />
                        ❌ Có {livePreviewCheck.goiChenErrors.length} lỗi chặn nhập
                      </div>
                      <ul className="list-none space-y-1 text-[11px] font-mono">
                        {livePreviewCheck.goiChenErrors.map((e, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-red-600 shrink-0">•</span>
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={async () => {
                          const text = `Gói Chén của bạn bị tool báo các lỗi sau, hãy sửa và xuất lại toàn bộ gói:\n${livePreviewCheck.goiChenErrors.map(e => `• ${e}`).join('\n')}`;
                          await navigator.clipboard.writeText(text);
                          setCopiedGoiChenErrors(true);
                          setTimeout(() => setCopiedGoiChenErrors(false), 2400);
                        }}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-red-700/10 border border-red-500/30 text-red-900 text-[11px] font-semibold flex items-center gap-1.5 hover:bg-red-700/20 transition"
                      >
                        {copiedGoiChenErrors ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Đã copy!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy lỗi cho Gemini
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="whitespace-pre-wrap font-mono text-[11px]">
                      {livePreviewCheck.error}
                    </div>
                  )}
                </div>
              )}

              {submitError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-800 whitespace-pre-wrap">
                  {submitError}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-white border border-tea-border space-y-2.5 text-xs text-tea-ink leading-relaxed">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-tea-ink">
                    Cài đặt 1 lần lên mục &ldquo;Skills&rdquo; mới của Gemini Web:
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-tea-accent/10 text-tea-accent font-mono text-[11px] font-bold">
                    /{GEMINI_SKILL_NAME}
                  </span>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-[11.5px] text-tea-muted">
                  <li>
                    Bấm nút{' '}
                    <strong className="text-tea-ink">
                      Tải Gói Skill Chuẩn (.zip)
                    </strong>{' '}
                    bên dưới (đã đóng gói sẵn <code>SKILL.md</code> + thư viện đạo cụ{' '}
                    <code>references/</code> + định dạng Gói Chén + ví dụ sạch 100%).
                  </li>
                  <li>
                    Mở <strong>gemini.google.com</strong> &rarr; bấm{' '}
                    <strong>More (Thêm) &rarr; Customize (Tùy chỉnh) &rarr; Skills</strong>{' '}
                    &rarr; chọn <strong>Create &rarr; Upload</strong> và tải tệp{' '}
                    <code>{GEMINI_SKILL_NAME}.zip</code> (hoặc <code>SKILL.md</code>) lên.
                  </li>
                  <li>
                    Từ nay trong bất kỳ cuộc chat bình thường nào trên Gemini, chỉ cần gõ{' '}
                    <code className="text-tea-accent font-bold">
                      /{GEMINI_SKILL_NAME}
                    </code>{' '}
                    kèm ý tưởng &rarr; duyệt chữ &rarr; duyệt cảnh &rarr; copy khối JSON ở Bước 3 đem về đây bấm{' '}
                    <strong className="text-tea-ink">
                      1-Click Mở Live Preview
                    </strong>
                    !
                  </li>
                </ol>
              </div>

              {/* Cụm nút tải .zip / tải SKILL.md / copy */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadSkillZip}
                  className="py-2.5 px-3 rounded-xl bg-tea-accent text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-tea-accentHover shadow-xs transition"
                  title="Tải gói ZIP đầy đủ gồm SKILL.md + references/ (thu-vien.md, goi-chen.md, q001.json) để upload thẳng lên Gemini Skills"
                >
                  {downloadedType === 'zip' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Đã tải {GEMINI_SKILL_NAME}.zip!
                    </>
                  ) : (
                    <>
                      <Package className="w-3.5 h-3.5" />
                      Tải Gói Skill (.zip)
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSkillMd}
                  className="py-2.5 px-3 rounded-xl border border-tea-border bg-white text-tea-ink text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-tea-accent transition"
                  title="Tải riêng 1 file SKILL.md độc lập"
                >
                  {downloadedType === 'md' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      Đã tải SKILL.md!
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-tea-accent" />
                      Tải Lẻ SKILL.md
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopySkillMd}
                  className="py-2.5 px-3 rounded-xl border border-tea-border bg-white text-tea-ink text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-tea-accent transition"
                  title="Copy toàn bộ nội dung SKILL.md (gồm cả YAML frontmatter)"
                >
                  {copiedSkillMd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      Đã Copy SKILL.md!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-tea-accent" />
                      Copy Nội Dung SKILL.md
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-tea-bg/50 border border-tea-border/80 text-[11px] space-y-1">
                <div>
                  <span className="text-tea-muted font-semibold">Tên định danh (name):</span>{' '}
                  <code className="font-mono font-bold text-tea-ink">
                    {GEMINI_SKILL_NAME}
                  </code>
                </div>
                <div>
                  <span className="text-tea-muted font-semibold">
                    Mô tả tự kích hoạt (description):
                  </span>{' '}
                  <span className="text-tea-ink">{GEMINI_SKILL_DESCRIPTION}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-tea-ink flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-tea-accent" />
                    Xem trước nội dung tệp <code>SKILL.md</code> (Chuẩn Gói Chén):
                  </span>
                  <a
                    href={`/api/skills/${GEMINI_SKILL_NAME}.zip`}
                    download={`${GEMINI_SKILL_NAME}.zip`}
                    className="text-[11px] font-semibold text-tea-accent hover:underline"
                  >
                    Link tải dự phòng (.zip)
                  </a>
                </div>

                <textarea
                  readOnly
                  rows={10}
                  value={skillMdContent}
                  className="w-full font-mono text-[11px] leading-relaxed p-3 rounded-xl border border-tea-border bg-white/85 text-tea-ink focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-tea-border bg-tea-bg/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === 'import' ? 'skill_setup' : 'import')
            }
            className="text-xs font-semibold text-tea-accent hover:underline"
          >
            {activeTab === 'import'
              ? `Chưa cài Skill /${GEMINI_SKILL_NAME} trên Gemini? Tải gói .zip ngay ->`
              : '<- Quay lại màn hình Dán JSON'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-tea-border bg-white text-xs font-semibold text-tea-muted hover:text-tea-ink"
            >
              Đóng
            </button>
            {activeTab === 'import' && (
              <button
                type="button"
                disabled={
                  submitting || !rawPaste.trim() || Boolean(livePreviewCheck && !livePreviewCheck.ok)
                }
                onClick={handleManualSubmit}
                className="px-4 py-2 rounded-xl bg-tea-ink text-tea-paper text-xs font-semibold flex items-center gap-1.5 hover:bg-tea-accent hover:text-white transition disabled:opacity-45"
              >
                <Film className="w-3.5 h-3.5" />
                {mode === 'overwrite_cup'
                  ? 'Áp Dụng & Xem Ngay Trên Player'
                  : 'Tạo Chén Mới & Xem Ngay'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
