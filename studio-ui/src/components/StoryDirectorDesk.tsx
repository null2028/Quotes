import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  Volume2,
  Square,
  Plus,
  Trash2,
  RotateCcw,
  Loader2,
  Check,
  AlertCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Italic,
  Bold,
  Target,
  Film,
  Sparkles,
  AlertTriangle,
  User,
  Package,
  Dices,
  Lock,
  Layers,
} from 'lucide-react';
import {
  CupRecord,
  SceneCodeResponse,
  StageScriptResponse,
  VaultSceneMeta,
} from '../types';
import {
  AudioMode,
  DurationMode,
  FoleyPivotStyle,
  LayoutVariant,
  LightingGobo,
  PivotMechanic,
  ShotMode,
  StageTuning,
  VideoInputProps,
  VisualDNAMode,
} from '../../../src/schemas/videoSchema';
import {
  ActorSpec,
  PropSpec,
  StageScript,
  StageScriptSchema,
  formatStageScriptZodError,
} from '../../../src/stage/stageScriptSchema';
import { resolveXCoord } from '../../../src/stage/terrainSystem';
import {
  applyAutoHeadroomFix,
  auditStageVisualLayout,
  sanitizeStageScriptObject,
} from '../../../src/automation/geminiBundleBridge';
import { THEME_PALETTES, LAYOUT_TOKENS } from '../../../src/theme/palettes';
import {
  auditVietnameseSyllables,
  computeTimelineSync,
  stripInlineMarkdown,
} from '../../../src/engine/timelineSync';
import {
  ASYMMETRIC_THIRD_MAX_SYLLABLES,
  canUseAsymmetricThird,
  isLegacyPublishedCupId,
  resolveVisualDNA,
  suggestDistinctVisualDNA,
} from '../../../src/engine/visualDnaResolver';
import { resolveStageScript } from '../../../src/stage/stageScriptRegistry';
import { synthesizeCupAudioByMode } from '../../../src/engine/foleyEngine';

interface Props {
  cup: CupRecord;
  vaultScenes: VaultSceneMeta[];
  onUpdateProps: (nextProps: VideoInputProps) => void;
  onFetchStageScript: (sceneId: string) => Promise<StageScriptResponse>;
  onUpsertStageScript: (params: {
    sceneId?: string;
    name?: string;
    description?: string;
    script: StageScript | unknown;
    cupId?: string;
  }) => Promise<{ scene: VaultSceneMeta; script: StageScript }>;
  onFetchSceneCode: (sceneId: string) => Promise<SceneCodeResponse>;
  onUpsertSceneCode: (params: {
    sceneId: string;
    name?: string;
    description?: string;
    tsxCode: string;
    cupId?: string;
  }) => Promise<VaultSceneMeta>;
  onDeleteCustomScene: (sceneId: string) => Promise<void>;
}

const THEME_META: Record<
  string,
  { label: string; hint: string; isSignature?: boolean }
> = {
  MINIMAL_LIGHT: {
    label: 'Giấy Trà Ấm',
    hint: 'Mặc định · 85% kênh',
    isSignature: true,
  },
  MINIMAL_DARK: {
    label: 'Khói Trà Chiều',
    hint: 'Trầm lắng · Đêm muộn',
  },
  WARM_NOIR: {
    label: 'Ô Long Cổ',
    hint: 'Tối ấm · Hoài niệm',
  },
};

function deriveSceneIdFromTsxCode(code: string): string {
  const m = code.match(/export\s+const\s+([A-Za-z0-9_]+)\s*(?::|\s*=)/);
  if (!m) return `CUSTOM_SCENE_${Date.now().toString().slice(-4)}`;
  const comp = m[1].replace(/Scene$/, '');
  const snake = comp
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase()
    .replace(/^CUSTOM_+/, '');
  return `CUSTOM_${snake || 'SCENE'}`;
}

export const StoryDirectorDesk: React.FC<Props> = ({
  cup,
  vaultScenes,
  onUpdateProps,
  onFetchStageScript,
  onUpsertStageScript,
  onFetchSceneCode,
  onUpsertSceneCode,
  onDeleteCustomScene,
}) => {
  const { props } = cup;
  const activeSceneId = props.motion.sceneId || props.motion.archetype;
  const activeSceneMeta = vaultScenes.find((s) => s.sceneId === activeSceneId);
  const isCustomOrScriptScene =
    activeSceneMeta?.origin === 'custom' ||
    activeSceneMeta?.origin === 'script' ||
    activeSceneId.startsWith('CUSTOM_') ||
    activeSceneId.startsWith('SCRIPT_');

  const tuning: StageTuning = props.stageTuning ?? {
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
    strokeScale: 1.0,
  };

  const sync = computeTimelineSync(props, LAYOUT_TOKENS.fps);
  const pivotTimeNum = sync.pivotFrame / LAYOUT_TOKENS.fps;
  const pivotTimeSec = pivotTimeNum.toFixed(1);
  const syllableAudit = auditVietnameseSyllables(props.segments);
  const isPivotOptimal = pivotTimeNum >= 5.5 && pivotTimeNum <= 9.5;

  const quoteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const unifiedQuoteText = props.segments.join('\n');
  const fontSizeScale = props.fontSizeScale ?? 1.0;

  const [isScriptOpen, setIsScriptOpen] = useState(false);
  const [isCreatingBlankScript, setIsCreatingBlankScript] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [savingScript, setSavingScript] = useState(false);
  const [scriptSceneId, setScriptSceneId] = useState(
    activeSceneId.startsWith('SCRIPT_') ? activeSceneId : ''
  );
  const [scriptSceneName, setScriptSceneName] = useState(
    activeSceneMeta?.name || ''
  );
  const [scriptJsonText, setScriptJsonText] = useState('');
  const [scriptNotice, setScriptNotice] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [selectedElementKey, setSelectedElementKey] = useState<string>('');
  const scriptAutoSaveTimerRef = useRef<number | null>(null);
  const [dnaSalt, setDnaSalt] = useState(1);

  const resolvedScriptForDna = resolveStageScript(
    activeSceneId,
    props.motion.stageScript
  );
  const resolvedDna = resolveVisualDNA(props, resolvedScriptForDna);
  const asymmetricGuard = canUseAsymmetricThird(
    resolvedScriptForDna,
    resolvedDna.shotMode,
    syllableAudit.count
  );
  const activeDnaMode: VisualDNAMode =
    props.visualDNA?.mode ??
    (isLegacyPublishedCupId(props.id) ? 'LEGACY_LOCK' : 'AUTO');

  const applyCustomDnaPatch = (
    patch: Partial<NonNullable<VideoInputProps['visualDNA']>>
  ) => {
    onUpdateProps({
      ...props,
      visualDNA: {
        mode: 'CUSTOM',
        layout: resolvedDna.layout,
        lightingGobo: resolvedDna.lightingGobo,
        shotMode: resolvedDna.shotMode,
        pivotMechanic: resolvedDna.pivotMechanic,
        horizonOffsetPx: resolvedDna.horizonOffsetPx,
        forceSolidStyle: resolvedDna.forceSolidStyle,
        ...patch,
      },
    });
  };

  const activeStageScript = activeSceneId.startsWith('SCRIPT_')
    ? props.motion.stageScript
    : undefined;

  const layoutWarnings = activeStageScript
    ? auditStageVisualLayout(
        activeStageScript,
        activeStageScript.customPropsResolved
      )
    : [];
  const hasHeadroomWarning = layoutWarnings.some(
    (w) => w.code === 'HEADROOM_OVERLAP'
  );

  useEffect(() => {
    if (!activeStageScript) return;
    const actors = activeStageScript.actors ?? [];
    const stageProps = activeStageScript.props ?? [];
    const allKeys = [
      ...actors.map((a) => `actor:${a.id}`),
      ...stageProps.map((p) => `prop:${p.id}`),
    ];
    if (allKeys.length > 0 && !allKeys.includes(selectedElementKey)) {
      setSelectedElementKey(allKeys[0]);
    }
  }, [activeStageScript, selectedElementKey]);

  useEffect(() => {
    return () => {
      if (scriptAutoSaveTimerRef.current) {
        window.clearTimeout(scriptAutoSaveTimerRef.current);
      }
    };
  }, []);

  const applyLiveStageScriptMutation = (
    mutator: (prev: StageScript) => StageScript
  ) => {
    if (!activeStageScript) return;
    const nextScript = mutator(activeStageScript);
    const { customPropsResolved: _omit, ...cleanNext } = nextScript;
    setScriptJsonText(JSON.stringify(cleanNext, null, 2));

    onUpdateProps({
      ...props,
      motion: {
        ...props.motion,
        sceneId: activeSceneId,
        archetype: activeSceneId,
        stageScript: nextScript,
      },
    });

    if (scriptAutoSaveTimerRef.current) {
      window.clearTimeout(scriptAutoSaveTimerRef.current);
    }
    scriptAutoSaveTimerRef.current = window.setTimeout(() => {
      scriptAutoSaveTimerRef.current = null;
      void onUpsertStageScript({
        sceneId: nextScript.sceneId || activeSceneId,
        name:
          nextScript.name ||
          scriptSceneName.trim() ||
          activeSceneMeta?.name ||
          activeSceneId,
        script: cleanNext,
        cupId: cup.id,
      }).catch(() => undefined);
    }, 700);
  };

  const handleAutoFixHeadroom = () => {
    if (!activeStageScript || !hasHeadroomWarning) return;
    applyLiveStageScriptMutation((prev) =>
      applyAutoHeadroomFix(prev, layoutWarnings)
    );
  };

  const selectedActor: ActorSpec | undefined =
    activeStageScript && selectedElementKey.startsWith('actor:')
      ? (activeStageScript.actors ?? []).find(
          (a) => `actor:${a.id}` === selectedElementKey
        )
      : undefined;

  const selectedProp: PropSpec | undefined =
    activeStageScript && selectedElementKey.startsWith('prop:')
      ? (activeStageScript.props ?? []).find(
          (p) => `prop:${p.id}` === selectedElementKey
        )
      : undefined;

  useEffect(() => {
    if (isCreatingBlankScript) return;
    if (props.motion.stageScript && activeSceneId.startsWith('SCRIPT_')) {
      setScriptSceneId(props.motion.stageScript.sceneId || activeSceneId);
      setScriptSceneName(
        props.motion.stageScript.name || activeSceneMeta?.name || activeSceneId
      );
      if (!isScriptOpen || !scriptJsonText) {
        const { customPropsResolved: _omit, ...cleanScript } =
          props.motion.stageScript;
        setScriptJsonText(JSON.stringify(cleanScript, null, 2));
      }
      setScriptNotice(null);
      return;
    }

    const targetToFetch = activeSceneId.startsWith('SCRIPT_')
      ? activeSceneId
      : 'SCRIPT_THIEP_HONG_NGUOI_XUA';
    let cancelled = false;
    setLoadingScript(true);
    void onFetchStageScript(targetToFetch)
      .then((res) => {
        if (cancelled) return;
        setScriptSceneId(
          activeSceneId.startsWith('SCRIPT_') ? res.sceneId : ''
        );
        setScriptSceneName(
          activeSceneId.startsWith('SCRIPT_')
            ? res.name
            : props.title
              ? `Kịch Bản — ${props.title}`
              : ''
        );
        const { customPropsResolved: _omit, ...cleanScript } = res.script;
        setScriptJsonText(JSON.stringify(cleanScript, null, 2));
        if (activeSceneId.startsWith('SCRIPT_') && !props.motion.stageScript) {
          onUpdateProps({
            ...props,
            motion: {
              ...props.motion,
              stageScript: res.script,
            },
          });
        }
      })
      .catch(() => {
        // ignore fallback load error
      })
      .finally(() => {
        if (!cancelled) setLoadingScript(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSceneId, cup.id, isCreatingBlankScript, props.motion.stageScript, isScriptOpen]);

  const handleStartBlankStageScript = () => {
    setIsCreatingBlankScript(true);
    setIsScriptOpen(true);
    setIsCodeOpen(false);
    const suggestedName = props.title
      ? `Kịch Bản — ${props.title}`
      : 'Kịch Bản Sân Khấu Mới';
    setScriptSceneId('');
    setScriptSceneName(suggestedName);
    const starter: StageScript = {
      name: suggestedName,
      description: 'Kịch bản JSON khai báo V7.0',
      terrain: { type: 'flat', y: 352 },
      atmosphere: [
        {
          type: 'wind',
          direction: 'left',
          count: 4,
          leaveAt: 'pivot',
          fadeDuration: 1.5,
        },
        {
          type: 'crescent',
          x: 'far_right',
          y: 208,
          radius: 16,
          colorRole: 'accent',
          enterAt: 'pivot',
          fadeDuration: 1.8,
        },
      ],
      actors: [
        {
          id: 'hero',
          x: 'left',
          facing: 'right',
          pose: 'walk',
          colorRole: 'ink',
          scale: 1.2,
          yOffset: 0,
          leanDeg: 0,
          sitProgress: 0,
          opacity: 1,
          showTeaCup: 0,
          dissolveToCloud: 0,
          layer: 'mid',
          fadeDuration: 1.2,
        },
      ],
      props: [
        {
          id: 'bench1',
          type: 'bench',
          x: 'center_right',
          y: 0,
          follow: null,
          layer: 'mid',
          scale: 1,
          rotate: 0,
          opacity: 1,
          colorRole: 'ink',
          drawProgress: 1,
          morphProgress: 0,
          splitProgress: 0,
          floatAwayProgress: 0,
          fadeDuration: 1.2,
        },
      ],
      timeline: [
        {
          at: 'start',
          duration: 2.6,
          target: 'hero',
          toX: 'center_right',
        },
        {
          at: 'pivot',
          duration: 2.2,
          target: 'hero',
          sitProgress: 1,
          leanDeg: -8,
          showTeaCup: 1,
        },
      ],
    };
    setScriptJsonText(
      JSON.stringify(
        {
          name: starter.name,
          terrain: starter.terrain,
          atmosphere: starter.atmosphere,
          actors: [
            {
              id: 'hero',
              x: 'left',
              scale: 1.2,
              facing: 'right',
              pose: 'walk',
            },
          ],
          props: [
            {
              id: 'bench1',
              type: 'bench',
              x: 'center_right',
              y: 0,
            },
          ],
          timeline: starter.timeline,
        },
        null,
        2
      )
    );
    setScriptNotice(null);
  };

  const handleSaveAndApplyStageScript = async () => {
    setSavingScript(true);
    setScriptNotice(null);
    try {
      let rawParsed: unknown;
      try {
        rawParsed = JSON.parse(scriptJsonText);
      } catch (e: unknown) {
        throw new Error(
          `Lỗi cú pháp JSON: ${e instanceof Error ? e.message : String(e)}`
        );
      }

      const sanitizedScript =
        rawParsed && typeof rawParsed === 'object' && !Array.isArray(rawParsed)
          ? sanitizeStageScriptObject(rawParsed as Record<string, unknown>)
          : (() => {
              const zodCheck = StageScriptSchema.safeParse(rawParsed);
              if (!zodCheck.success) {
                throw new Error(
                  `Lỗi cấu trúc StageScript (Zod):\n${formatStageScriptZodError(
                    zodCheck.error
                  )}`
                );
              }
              return zodCheck.data;
            })();

      const res = await onUpsertStageScript({
        sceneId: scriptSceneId.trim() || sanitizedScript.sceneId,
        name:
          scriptSceneName.trim() ||
          sanitizedScript.name ||
          (props.title ? `Kịch Bản — ${props.title}` : undefined),
        script: sanitizedScript,
        cupId: cup.id,
      });

      onUpdateProps({
        ...props,
        motion: {
          ...props.motion,
          sceneId: res.scene.sceneId,
          archetype: res.scene.sceneId,
          stageScript: res.script,
        },
      });

      setIsCreatingBlankScript(false);
      setScriptSceneId(res.scene.sceneId);
      setScriptSceneName(res.scene.name);
      const { customPropsResolved: _omit, ...cleanSaved } = res.script;
      setScriptJsonText(JSON.stringify(cleanSaved, null, 2));
      setScriptNotice({
        type: 'ok',
        text: `Đã lưu & áp dụng tức thì kịch bản ${res.scene.sceneId} lên <Player> (0.01s)!`,
      });
    } catch (err: unknown) {
      setScriptNotice({
        type: 'err',
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSavingScript(false);
    }
  };

  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [isCreatingBlankScene, setIsCreatingBlankScene] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const [deletingScene, setDeletingScene] = useState(false);
  const [editorSceneId, setEditorSceneId] = useState(activeSceneId);
  const [editorSceneName, setEditorSceneName] = useState(
    activeSceneMeta?.name || ''
  );
  const [editorSceneDesc, setEditorSceneDesc] = useState(
    activeSceneMeta?.act1 || ''
  );
  const [editorTsxCode, setEditorTsxCode] = useState('');
  const [codeNotice, setCodeNotice] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isCodeOpen || isCreatingBlankScene) return;
    let cancelled = false;
    setLoadingCode(true);
    setCodeNotice(null);
    void onFetchSceneCode(activeSceneId)
      .then((res) => {
        if (cancelled) return;
        setEditorSceneId(res.sceneId);
        setEditorSceneName(
          activeSceneMeta?.name ||
            (res.isCustom ? res.sceneId : `${props.title || 'Cảnh Mới'} (Custom)`)
        );
        setEditorSceneDesc(activeSceneMeta?.act1 || '');
        setEditorTsxCode(res.tsxCode);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCodeNotice({
          type: 'err',
          text: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingCode(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isCodeOpen, activeSceneId, isCreatingBlankScene]);

  const handleStartBlankCustomScene = () => {
    setIsCreatingBlankScene(true);
    setIsCodeOpen(true);
    setEditorSceneId('');
    setEditorSceneName('');
    setEditorSceneDesc('');
    setEditorTsxCode('');
    setCodeNotice(null);
  };

  const handleUnifiedQuoteChange = (rawText: string) => {
    const rawLines = rawText.split(/\r?\n/);
    const nextSegments =
      rawLines.length > 0 ? rawLines.slice(0, 12) : [''];

    const nonEmptyClean = nextSegments
      .map((s) => stripInlineMarkdown(s).trim())
      .filter((s) => s.length > 0);

    const inferredFormat: 'POEM' | 'PROSE' =
      nonEmptyClean.length >= 2 &&
      nonEmptyClean.every((s) => s.split(/\s+/).length <= 10 && s.length <= 52)
        ? 'POEM'
        : 'PROSE';

    const cleanCurrentPivot = stripInlineMarkdown(props.pivotWord)
      .trim()
      .toLowerCase();
    const stillHasPivot =
      cleanCurrentPivot.length > 0 &&
      nonEmptyClean.some((line) =>
        line.toLowerCase().includes(cleanCurrentPivot)
      );

    let nextPivot = props.pivotWord;
    if (!stillHasPivot && nonEmptyClean.length > 0) {
      const lastLine = nonEmptyClean[nonEmptyClean.length - 1];
      const words = lastLine
        .replace(/[.,;!?…""''()]/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      nextPivot = words.slice(-2).join(' ') || props.pivotWord;
    }

    onUpdateProps({
      ...props,
      segments: nextSegments,
      textFormat: inferredFormat,
      pivotWord: nextPivot,
    });
  };

  const wrapSelectionWithMarkdown = (marker: '*' | '**') => {
    const el = quoteTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const currentText = unifiedQuoteText;

    if (start === end) {
      const sample = marker === '**' ? 'chữ đậm' : 'chữ nghiêng';
      const nextText =
        currentText.slice(0, start) +
        `${marker}${sample}${marker}` +
        currentText.slice(end);
      handleUnifiedQuoteChange(nextText);
      window.requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(
          start + marker.length,
          start + marker.length + sample.length
        );
      });
      return;
    }

    const selected = currentText.slice(start, end);
    const nextText =
      currentText.slice(0, start) +
      `${marker}${selected}${marker}` +
      currentText.slice(end);
    handleUnifiedQuoteChange(nextText);
    window.requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + marker.length, end + marker.length);
    });
  };

  const handleSetSelectionAsPivotWord = () => {
    const el = quoteTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const rawSelected = unifiedQuoteText.slice(start, end);
    const cleaned = stripInlineMarkdown(rawSelected)
      .replace(/^[.,;!?…""''()\s]+|[.,;!?…""''()\s]+$/g, '')
      .trim();
    if (!cleaned) return;
    onUpdateProps({
      ...props,
      pivotWord: cleaned,
    });
  };

  const [isPreviewingFoley, setIsPreviewingFoley] = useState(false);
  const foleyPreviewRef = useRef<HTMLAudioElement | null>(null);
  const foleyTimerRef = useRef<number | null>(null);

  const nonEmptySegments = props.segments
    .map((s) => stripInlineMarkdown(s).trim())
    .filter((s) => s.length > 0);
  const candidateSegments = nonEmptySegments.slice(-2);
  const wordChips: string[] = [];
  for (const seg of candidateSegments) {
    const cleanWords = seg
      .replace(/[.,;!?…""'']/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    for (let i = 0; i < cleanWords.length; i++) {
      if (i < cleanWords.length - 1) {
        const pair = `${cleanWords[i]} ${cleanWords[i + 1]}`;
        if (seg.includes(pair) && !wordChips.includes(pair)) {
          wordChips.push(pair);
        }
      }
    }
  }

  const updateTuning = (partial: Partial<StageTuning>) => {
    onUpdateProps({
      ...props,
      stageTuning: {
        ...tuning,
        ...partial,
      },
    });
  };

  const resetAllTuning = () => {
    onUpdateProps({
      ...props,
      stageTuning: {
        offsetX: 0,
        offsetY: 0,
        scale: 1.0,
        strokeScale: 1.0,
      },
    });
  };

  const handleSaveAndCompileScene = async () => {
    setSavingCode(true);
    setCodeNotice(null);
    try {
      const autoSceneId =
        editorSceneId.trim() || deriveSceneIdFromTsxCode(editorTsxCode);
      const autoSceneName =
        editorSceneName.trim() ||
        (props.title ? `Cảnh — ${props.title}` : autoSceneId);

      const saved = await onUpsertSceneCode({
        sceneId: autoSceneId,
        name: autoSceneName,
        description: editorSceneDesc,
        tsxCode: editorTsxCode,
        cupId: cup.id,
      });
      onUpdateProps({
        ...props,
        motion: {
          ...props.motion,
          sceneId: saved.sceneId,
          archetype: saved.sceneId,
        },
      });
      setIsCreatingBlankScene(false);
      setEditorSceneId(saved.sceneId);
      setEditorSceneName(saved.name);
      setCodeNotice({
        type: 'ok',
        text: `Đã biên dịch tsc --noEmit thành công & áp dụng cảnh ${saved.sceneId} cho Chén này!`,
      });
    } catch (err: unknown) {
      setCodeNotice({
        type: 'err',
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSavingCode(false);
    }
  };

  const handleDeleteCurrentCustomScene = async () => {
    if (!isCustomOrScriptScene) return;
    setDeletingScene(true);
    setCodeNotice(null);
    setScriptNotice(null);
    try {
      await onDeleteCustomScene(activeSceneId);
      onUpdateProps({
        ...props,
        motion: {
          ...props.motion,
          sceneId: 'BOULDER_TO_BENCH',
          archetype: 'BOULDER_TO_BENCH',
          stageScript: undefined,
        },
      });
    } catch (err: unknown) {
      setScriptNotice({
        type: 'err',
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setDeletingScene(false);
    }
  };

  const toggleFoleyPivotPreview = () => {
    if (isPreviewingFoley) {
      if (foleyPreviewRef.current) {
        foleyPreviewRef.current.pause();
      }
      if (foleyTimerRef.current) {
        window.clearTimeout(foleyTimerRef.current);
      }
      setIsPreviewingFoley(false);
      return;
    }

    const { wavBytes, audioMode } = synthesizeCupAudioByMode(props, sync);
    if (audioMode === 'TIKTOK_SILENT') {
      return;
    }
    const blob = new Blob([wavBytes.buffer as ArrayBuffer], {
      type: 'audio/wav',
    });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    foleyPreviewRef.current = audio;
    audio.currentTime = Math.max(0, pivotTimeNum - 1.3);
    void audio.play();
    setIsPreviewingFoley(true);

    foleyTimerRef.current = window.setTimeout(() => {
      audio.pause();
      URL.revokeObjectURL(url);
      setIsPreviewingFoley(false);
    }, 4500);
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* =====================================================================
          NGĂN 1: Ô SOẠN THẢO QUOTE HỢP NHẤT (WYSIWYG), TÁC GIẢ & TỪ KHÓA PIVOT WORD
         ===================================================================== */}
      <section className="rounded-2xl border border-tea-border bg-tea-paper p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-tea-muted">
              Ngăn 1 · Biên Tập Câu Chữ Hợp Nhất (WYSIWYG) &amp; Điểm Rơi
            </span>
            <h2 className="font-serif text-lg font-semibold text-tea-ink">
              CHÉN {cup.cupNumber} — {props.title || 'TRÀ NGUỘI'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border ${
                syllableAudit.band === 'optimal'
                  ? 'bg-emerald-500/12 text-emerald-800 border-emerald-500/35'
                  : syllableAudit.band === 'concise'
                    ? 'bg-sky-500/12 text-sky-800 border-sky-500/35'
                    : syllableAudit.band === 'long'
                      ? 'bg-amber-500/15 text-amber-800 border-amber-500/40'
                      : syllableAudit.band === 'overflow'
                        ? 'bg-red-500/15 text-red-700 border-red-500/40'
                        : 'bg-tea-bg text-tea-muted border-tea-border'
              }`}
              title="Chuẩn nhịp đọc 15s: 14–28 âm tiết (trần tối đa 40 âm tiết)"
            >
              {syllableAudit.count} âm tiết · {syllableAudit.label}
            </span>

            <span
              className={`text-[11px] font-mono font-semibold px-3 py-1 rounded-full border ${
                isPivotOptimal
                  ? 'text-tea-accent bg-tea-accent/10 border-tea-accent/30'
                  : 'text-amber-800 bg-amber-500/12 border-amber-500/35'
              }`}
              title="Khung điểm lật tối ưu: 5.5s – 9.5s"
            >
              Hồi II tại {pivotTimeSec}s (Frame #{sync.pivotFrame})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-tea-muted mb-1">
              Tiêu đề Chén (CHÉN {cup.cupNumber} — ...)
            </label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) =>
                onUpdateProps({ ...props, title: e.target.value })
              }
              placeholder="Thiệp hồng, Rượu mây, Nghỉ..."
              className="w-full text-sm px-3 py-2 rounded-xl border border-tea-border bg-white focus:outline-none focus:border-tea-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-tea-muted mb-1">
              Tác giả (Tùy chọn — hiện nghiêng dưới đuôi Quote)
            </label>
            <input
              type="text"
              value={props.author || ''}
              onChange={(e) =>
                onUpdateProps({ ...props, author: e.target.value })
              }
              placeholder="VD: Nguyễn Bính, Lưu Quang Vũ... — Để trống nếu không có"
              className="w-full font-serif italic text-sm px-3 py-2 rounded-xl border border-tea-border bg-white focus:outline-none focus:border-tea-accent"
            />
          </div>
        </div>

        <div className="rounded-xl border border-tea-border bg-white overflow-hidden focus-within:border-tea-accent transition">
          <div className="px-3 py-2 border-b border-tea-border/80 bg-tea-bg/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => wrapSelectionWithMarkdown('*')}
                className="px-2.5 py-1 rounded-lg border border-tea-border bg-white text-xs font-serif italic text-tea-ink hover:border-tea-accent flex items-center gap-1 transition"
                title="Bôi đen chữ rồi bấm để in nghiêng (*...*)"
              >
                <Italic className="w-3.5 h-3.5 text-tea-muted" />
                I Nghiêng
              </button>

              <button
                type="button"
                onClick={() => wrapSelectionWithMarkdown('**')}
                className="px-2.5 py-1 rounded-lg border border-tea-border bg-white text-xs font-semibold text-tea-ink hover:border-tea-accent flex items-center gap-1 transition"
                title="Bôi đen chữ rồi bấm để in đậm (**...**)"
              >
                <Bold className="w-3.5 h-3.5 text-tea-muted" />
                B Đậm
              </button>

              <button
                type="button"
                onClick={handleSetSelectionAsPivotWord}
                className="px-2.5 py-1 rounded-lg border border-tea-accent/50 bg-tea-accent/10 text-xs font-semibold text-tea-accent hover:bg-tea-accent hover:text-white flex items-center gap-1 transition"
                title="Bôi đen từ/cụm từ trong ô Quote rồi bấm để đặt làm pivotWord"
              >
                <Target className="w-3.5 h-3.5" />
                🎯 Đặt vùng bôi đen làm pivotWord
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-tea-muted font-medium">
                Cỡ chữ:{' '}
                <strong className="font-mono text-tea-ink">
                  {Math.round(
                    LAYOUT_TOKENS.typography.baseFontSize *
                      Math.max(0.88, Math.min(1.15, fontSizeScale))
                  )}
                  px ({fontSizeScale.toFixed(2)}x)
                </strong>
              </span>
              <input
                type="range"
                min={0.88}
                max={1.15}
                step={0.02}
                value={Math.max(0.88, Math.min(1.15, fontSizeScale))}
                onChange={(e) =>
                  onUpdateProps({
                    ...props,
                    fontSizeScale: Number(e.target.value),
                  })
                }
                className="w-20 accent-tea-accent"
                title="Cỡ chữ chuẩn 42px (1.00x), biên độ tinh chỉnh toàn kênh 38px–48px"
              />
              {Math.abs(fontSizeScale - 1.0) > 0.01 && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProps({ ...props, fontSizeScale: 1.0 })
                  }
                  className="px-1.5 py-0.5 rounded bg-tea-edge/60 text-[10px] font-mono text-tea-muted hover:text-tea-ink"
                  title={`Đặt lại cỡ chữ chuẩn ${LAYOUT_TOKENS.typography.baseFontSize}px (1.00x)`}
                >
                  {LAYOUT_TOKENS.typography.baseFontSize}px
                </button>
              )}
            </div>
          </div>

          <textarea
            ref={quoteTextareaRef}
            rows={Math.max(5, Math.min(10, props.segments.length + 1))}
            value={unifiedQuoteText}
            onChange={(e) => handleUnifiedQuoteChange(e.target.value)}
            placeholder={
              'Gõ hoặc dán nguyên đoạn thơ / quote vào đây...\n• Dòng 1 hiện rõ ngay tại 0.0s (OCR Hook).\n• Để 1 dòng trống (Enter 2 lần) -> tạo khoảng thoáng tách khổ 20px.'
            }
            className="w-full font-serif text-base leading-relaxed p-4 bg-white text-tea-ink focus:outline-none resize-y"
          />

          <div className="px-3.5 py-1.5 bg-tea-bg/30 border-t border-tea-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-tea-muted">
            <span>
              Nhập sao lên hình đúng vậy: <code>Enter</code> tách dòng tuần tự ·{' '}
              <code>Enter 2 lần</code> tách khổ (20px) · <code>*nghiêng*</code> ·{' '}
              <code>**đậm**</code>
            </span>
            <span className="font-mono flex items-center gap-2">
              <span>{nonEmptySegments.length} dòng</span>
              <span>·</span>
              <span title="Thời gian đọc ngẫm ước tính">
                Đọc ngẫm ~{syllableAudit.contemplateSeconds}s
              </span>
            </span>
          </div>
        </div>

        {syllableAudit.band === 'overflow' && (
          <div className="px-3.5 py-2 rounded-xl border border-red-500/35 bg-red-500/10 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              Đang ở mức <strong>{syllableAudit.count} âm tiết</strong> (vượt trần 40 âm tiết của video 15s). Nên cô đọng về vùng vàng <strong>14–28 âm tiết</strong> để khán giả kịp đọc hết và xem lặp hoạt cảnh.
            </span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-white/80 border border-tea-border space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-tea-muted shrink-0">
              Từ khóa Bẻ lái (`pivotWord` — tô Đỏ Chu Sa &amp; mở Hồi II):
            </label>
            <input
              type="text"
              value={props.pivotWord}
              onChange={(e) =>
                onUpdateProps({ ...props, pivotWord: e.target.value })
              }
              className="flex-1 min-w-[180px] text-xs font-semibold text-tea-accent px-3 py-1.5 rounded-lg border border-tea-accent/50 bg-tea-accent/5 focus:outline-none focus:border-tea-accent"
            />
          </div>

          {wordChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-tea-muted mr-1">
                Chạm nhanh ở câu kết:
              </span>
              {wordChips.slice(0, 12).map((chip) => {
                const active =
                  stripInlineMarkdown(props.pivotWord).trim().toLowerCase() ===
                  chip.toLowerCase();
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onUpdateProps({ ...props, pivotWord: chip })}
                    className={`px-2.5 py-1 rounded-full text-xs font-serif transition border ${
                      active
                        ? 'border-tea-accent bg-tea-accent text-white font-semibold'
                        : 'border-tea-border bg-white text-tea-ink hover:border-tea-accent'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          NGĂN 2: KỊCH BẢN ĐẠO DIỄN (STAGE SCRIPT JSON V7.0), 4 THANH TRƯỢT & CODE .TSX
         ===================================================================== */}
      <section className="rounded-2xl border border-tea-border bg-tea-paper p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-tea-muted">
              Ngăn 2 · Universal Stage Script Engine · Zoom Pivot +4.8% · Seamless Loop
            </span>
            <h2 className="font-serif text-lg font-semibold text-tea-ink">
              🎬 Kịch Bản Đạo Diễn (Stage Script JSON) &amp; Sân Khấu
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleStartBlankStageScript}
              className="px-3.5 py-1.5 rounded-xl bg-tea-accent text-white text-xs font-semibold hover:bg-tea-accentHover shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />+ Tạo Cảnh Kịch Bản Mới
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCreatingBlankScript(false);
                setIsScriptOpen(!isScriptOpen);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                isScriptOpen
                  ? 'border-tea-ink bg-tea-ink text-tea-paper'
                  : 'border-tea-border bg-white text-tea-ink hover:border-tea-accent'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-tea-accent" />
              🎬 Xem / Sửa JSON gốc
              {isScriptOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCreatingBlankScene(false);
                setIsCodeOpen(!isCodeOpen);
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1 transition ${
                isCodeOpen
                  ? 'border-tea-ink bg-tea-ink text-tea-paper'
                  : 'border-tea-border/80 bg-white/70 text-tea-muted hover:text-tea-ink'
              }`}
              title="Mở trình biên tập Code .tsx nâng cao cho trường hợp đặc biệt"
            >
              <Code2 className="w-3 h-3" />
              &lt;/&gt; Code .tsx Nâng Cao
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/80 border border-tea-border space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-tea-muted shrink-0">
              Cảnh đang áp dụng:
            </label>
            <select
              value={activeSceneId}
              onChange={(e) => {
                const nextId = e.target.value;
                setIsCreatingBlankScene(false);
                setIsCreatingBlankScript(false);
                if (nextId.startsWith('SCRIPT_')) {
                  void onFetchStageScript(nextId).then((res) => {
                    onUpdateProps({
                      ...props,
                      motion: {
                        ...props.motion,
                        sceneId: nextId,
                        archetype: nextId,
                        stageScript: res.script,
                      },
                    });
                  });
                } else {
                  onUpdateProps({
                    ...props,
                    motion: {
                      ...props.motion,
                      sceneId: nextId,
                      archetype: nextId,
                      stageScript: undefined,
                    },
                  });
                }
              }}
              className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl border border-tea-border bg-white text-tea-ink focus:outline-none focus:border-tea-accent"
            >
              {vaultScenes.map((s) => (
                <option key={s.sceneId} value={s.sceneId}>
                  [
                  {s.origin === 'script'
                    ? 'SCRIPT JSON'
                    : s.origin === 'custom'
                      ? 'CUSTOM .TSX'
                      : 'CHUẨN'}
                  ] {s.name} ({s.sceneId})
                </option>
              ))}
              {!vaultScenes.some((s) => s.sceneId === activeSceneId) && (
                <option value={activeSceneId}>{activeSceneId}</option>
              )}
            </select>

            {isCustomOrScriptScene && (
              <button
                type="button"
                disabled={deletingScene}
                onClick={handleDeleteCurrentCustomScene}
                className="px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 text-xs font-semibold hover:bg-red-500/20 flex items-center gap-1 transition disabled:opacity-50"
                title="Xóa cảnh SCRIPT_* hoặc CUSTOM_* này khỏi hệ thống"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingScene ? 'Đang xóa...' : 'Xóa Cảnh'}
              </button>
            )}
          </div>

          {activeSceneMeta && (
            <div className="text-[11px] text-tea-muted space-y-0.5 pt-1 border-t border-tea-border/60">
              <p>
                <strong className="text-tea-ink">Diễn biến:</strong>{' '}
                {activeSceneMeta.act1} → {activeSceneMeta.act2AtPivot}
              </p>
              <p className="text-tea-accent font-medium">
                • Điểm nhấn Đỏ Chu Sa: {activeSceneMeta.redProp}
              </p>
            </div>
          )}
        </div>

        {/* VI CHỈNH TỪNG NHÂN VẬT & ĐẠO CỤ (KÉO TRỰC TIẾP 60FPS — KHÔNG CẦN SỬA JSON) */}
        {activeStageScript &&
          ((activeStageScript.actors?.length ?? 0) > 0 ||
            (activeStageScript.props?.length ?? 0) > 0) && (
            <div className="p-4 rounded-xl bg-white/95 border border-tea-accent/35 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-tea-ink">
                  <Sparkles className="w-3.5 h-3.5 text-tea-accent" />
                  Vi Chỉnh Từng Nhân Vật &amp; Đạo Cụ (Kéo 60fps · Tự lưu không cần sửa JSON)
                </div>
                <span className="text-[10.5px] text-tea-muted">
                  Chọn thẻ bên dưới để dời vị trí X/Y, cỡ hoặc hướng nhìn
                </span>
              </div>

              {layoutWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300/80 text-xs text-amber-950 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-[220px]">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        {layoutWarnings.map((w, idx) => (
                          <p key={`${w.targetId}-${idx}`} className="leading-relaxed">
                            {w.message}
                          </p>
                        ))}
                      </div>
                    </div>
                    {hasHeadroomWarning && (
                      <button
                        type="button"
                        onClick={handleAutoFixHeadroom}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-700 flex items-center gap-1 shrink-0 shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        Tự nâng thoáng đầu nhân vật
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Dải Pill chọn Nhân vật / Đạo cụ */}
              <div className="flex flex-wrap gap-1.5">
                {(activeStageScript.actors ?? []).map((actor) => {
                  const key = `actor:${actor.id}`;
                  const isActive = selectedElementKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedElementKey(key)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                        isActive
                          ? 'bg-tea-ink text-tea-paper border-tea-ink shadow-2xs'
                          : 'bg-tea-bg/50 text-tea-ink border-tea-border hover:border-tea-accent'
                      }`}
                    >
                      <User className="w-3 h-3 text-tea-accent" />
                      <span>Nhân vật: {actor.id}</span>
                    </button>
                  );
                })}
                {(activeStageScript.props ?? []).map((propItem) => {
                  const key = `prop:${propItem.id}`;
                  const isActive = selectedElementKey === key;
                  const isAccent = propItem.colorRole === 'accent';
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedElementKey(key)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                        isActive
                          ? 'bg-tea-accent text-white border-tea-accent shadow-2xs'
                          : 'bg-white text-tea-ink border-tea-border hover:border-tea-accent'
                      }`}
                    >
                      <Package
                        className={`w-3 h-3 ${
                          isActive
                            ? 'text-white'
                            : isAccent
                              ? 'text-tea-accent'
                              : 'text-tea-muted'
                        }`}
                      />
                      <span>
                        Đạo cụ: {propItem.id}
                        {propItem.type ? ` (${propItem.type})` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Thanh trượt cho Nhân vật đang chọn */}
              {selectedActor && (() => {
                const actorX = Math.round(resolveXCoord(selectedActor.x, 270));
                const actorYOffset = Math.round(selectedActor.yOffset ?? 0);
                const actorScale = Number((selectedActor.scale ?? 1.16).toFixed(2));
                const actorLean = Math.round(selectedActor.leanDeg ?? 0);
                const actorFacing = selectedActor.facing ?? 'right';

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-tea-bg/40 border border-tea-border/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-tea-muted">
                          Vị trí Ngang X (cả đường đi):
                        </span>
                        <span className="font-mono font-bold text-tea-ink">
                          {actorX}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={95}
                        max={445}
                        step={1}
                        value={actorX}
                        onChange={(e) => {
                          const nextX = Number(e.target.value);
                          const dx = nextX - actorX;
                          applyLiveStageScriptMutation((prev) => ({
                            ...prev,
                            actors: (prev.actors ?? []).map((a) =>
                              a.id === selectedActor.id ? { ...a, x: nextX } : a
                            ),
                            timeline: (prev.timeline ?? []).map((c) => {
                              if (c.target !== selectedActor.id) return c;
                              if (c.toX === undefined && c.x === undefined) return c;
                              return {
                                ...c,
                                ...(c.toX !== undefined
                                  ? {
                                      toX: Math.max(
                                        80,
                                        Math.min(
                                          460,
                                          Math.round(resolveXCoord(c.toX, actorX) + dx)
                                        )
                                      ),
                                    }
                                  : {}),
                                ...(c.x !== undefined
                                  ? {
                                      x: Math.max(
                                        80,
                                        Math.min(
                                          460,
                                          Math.round(resolveXCoord(c.x, actorX) + dx)
                                        )
                                      ),
                                    }
                                  : {}),
                              };
                            }),
                          }));
                        }}
                        className="w-full accent-tea-accent"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-tea-bg/40 border border-tea-border/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-tea-muted">
                          Cao độ chân (Y Offset):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-tea-ink">
                            {actorYOffset > 0 ? `+${actorYOffset}` : actorYOffset}px
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const dy = 0 - actorYOffset;
                              applyLiveStageScriptMutation((prev) => ({
                                ...prev,
                                actors: (prev.actors ?? []).map((a) =>
                                  a.id === selectedActor.id
                                    ? { ...a, yOffset: 0 }
                                    : a
                                ),
                                timeline: (prev.timeline ?? []).map((c) =>
                                  c.target === selectedActor.id &&
                                  c.yOffset !== undefined
                                    ? { ...c, yOffset: Math.round(c.yOffset + dy) }
                                    : c
                                ),
                              }));
                            }}
                            className="px-1.5 py-0.5 rounded bg-tea-edge/60 text-[10px] font-mono text-tea-muted hover:text-tea-ink"
                          >
                            0
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={-60}
                        max={40}
                        step={1}
                        value={actorYOffset}
                        onChange={(e) => {
                          const nextY = Number(e.target.value);
                          const dy = nextY - actorYOffset;
                          applyLiveStageScriptMutation((prev) => ({
                            ...prev,
                            actors: (prev.actors ?? []).map((a) =>
                              a.id === selectedActor.id
                                ? { ...a, yOffset: nextY }
                                : a
                            ),
                            timeline: (prev.timeline ?? []).map((c) =>
                              c.target === selectedActor.id && c.yOffset !== undefined
                                ? { ...c, yOffset: Math.round(c.yOffset + dy) }
                                : c
                            ),
                          }));
                        }}
                        className="w-full accent-tea-accent"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-tea-bg/40 border border-tea-border/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-tea-muted">
                          Kích cỡ nhân vật (Scale):
                        </span>
                        <span className="font-mono font-bold text-tea-accent">
                          {actorScale.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.6}
                        max={1.8}
                        step={0.02}
                        value={actorScale}
                        onChange={(e) => {
                          const nextS = Number(e.target.value);
                          const ratio = actorScale > 0.1 ? nextS / actorScale : 1;
                          applyLiveStageScriptMutation((prev) => ({
                            ...prev,
                            actors: (prev.actors ?? []).map((a) =>
                              a.id === selectedActor.id ? { ...a, scale: nextS } : a
                            ),
                            timeline: (prev.timeline ?? []).map((c) =>
                              c.target === selectedActor.id && c.scale !== undefined
                                ? {
                                    ...c,
                                    scale:
                                      Math.round(c.scale * ratio * 100) / 100,
                                  }
                                : c
                            ),
                          }));
                        }}
                        className="w-full accent-tea-accent"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-tea-bg/40 border border-tea-border/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-tea-muted">
                          Độ nghiêng ({actorLean}°) &amp; Hướng nhìn:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              applyLiveStageScriptMutation((prev) => ({
                                ...prev,
                                actors: (prev.actors ?? []).map((a) =>
                                  a.id === selectedActor.id
                                    ? { ...a, facing: 'left' }
                                    : a
                                ),
                              }))
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              actorFacing === 'left'
                                ? 'bg-tea-ink text-white border-tea-ink'
                                : 'bg-white text-tea-muted border-tea-border'
                            }`}
                          >
                            ← Trái
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyLiveStageScriptMutation((prev) => ({
                                ...prev,
                                actors: (prev.actors ?? []).map((a) =>
                                  a.id === selectedActor.id
                                    ? { ...a, facing: 'right' }
                                    : a
                                ),
                              }))
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              actorFacing === 'right'
                                ? 'bg-tea-ink text-white border-tea-ink'
                                : 'bg-white text-tea-muted border-tea-border'
                            }`}
                          >
                            Phải →
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={-25}
                        max={25}
                        step={1}
                        value={actorLean}
                        onChange={(e) => {
                          const nextLean = Number(e.target.value);
                          applyLiveStageScriptMutation((prev) => ({
                            ...prev,
                            actors: (prev.actors ?? []).map((a) =>
                              a.id === selectedActor.id
                                ? { ...a, leanDeg: nextLean }
                                : a
                            ),
                          }));
                        }}
                        className="w-full accent-tea-accent"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Thanh trượt cho Đạo cụ đang chọn */}
              {selectedProp && (() => {
                const isFollowing = Boolean(selectedProp.follow);
                const isSky = selectedProp.layer === 'sky';
                const propX = isFollowing
                  ? Math.round(
                      typeof selectedProp.x === 'number' ? selectedProp.x : 0
                    )
                  : Math.round(resolveXCoord(selectedProp.x, 270));
                const propY = Math.round(
                  selectedProp.y ?? (isSky ? 200 : 0)
                );
                const propScale = Number((selectedProp.scale ?? 1.0).toFixed(2));
                const propOpacity = Number(
                  (selectedProp.opacity ?? 1.0).toFixed(2)
                );

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-tea-bg/40 border border-tea-border/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-tea-muted">
                          {isFollowing
                            ? `Lệch Ngang theo "${selectedProp.follow}":`
                            : 'Vị trí Ngang X:'}
                        </span>
                        <span className="font-mono font-bold text-tea-ink">
                          {propX}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={isFollowing ? -80 : 80}
                        max={isFollowing ? 80 : 460}
                        step={1}
                        value={propX}
                        onChange={(e) => {
                          const nextX = Number(e.target.value);
                          const dx = nextX - propX;
                          applyLiveStageScriptMutation((prev) => ({
                            ...prev,
                            props: (prev.props ?? []).map((p) =>
                              p.id === selectedProp.id ? { ...p, x: nextX } : p
                            ),
                            timeline: isFollowing
                              ? prev.timeline
                              : (prev.timeline ?? []).map((c) => {
                                  if (c.target !== selectedProp.id) return c;
                                  if (c.toX === undefined && c.x === undefined) {
                                    return c;
                                  }
                                  return {
                                    ...c,
                                    ...(c.toX !== undefined
                                      ? {
                                          toX: Math.round(
                                            resolveXCoord(c.toX, propX) + dx
                                          ),
                                        }
                                      : {}),
                                    ...(c.x !== undefined
                                      ? {
                                          x: Math.round(
                                            resolveXCoord(c.x, propX) + dx
                                          ),
                                        }
                                      : {}),
                                  };
                                }),
                          }));
                        }}
                        className="w-full accent-tea-accent"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-tea-bg/40 border border-tea-border/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-tea-muted">
                          {isSky
                            ? 'Cao độ Trời Y:'
                            : 'Cao độ Y (âm = nâng lên cao):'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-tea-ink">
                            {!isSky && propY > 0 ? `+${propY}` : propY}px
                          </span>
                          {!isSky && (
                            <button
                              type="button"
                              onClick={() => {
                                const dy = 0 - propY;
                                applyLiveStageScriptMutation((prev) => ({
                                  ...prev,
                                  props: (prev.props ?? []).map((p) =>
                                    p.id === selectedProp.id ? { ...p, y: 0 } : p
                                  ),
                                  timeline: (prev.timeline ?? []).map((c) => {
                                    if (c.target !== selectedProp.id) return c;
                                    if (c.toY === undefined && c.y === undefined) {
                                      return c;
                                    }
                                    return {
                                      ...c,
                                      ...(c.toY !== undefined
                                        ? { toY: Math.round(c.toY + dy) }
                                        : {}),
                                      ...(c.y !== undefined
                                        ? { y: Math.round(c.y + dy) }
                                        : {}),
                                    };
                                  }),
                                }));
                              }}
                              className="px-1.5 py-0.5 rounded bg-tea-edge/60 text-[10px] font-mono text-tea-muted hover:text-tea-ink"
                            >
                              0
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min={isSky ? 130 : -90}
                        max={isSky ? 280 : 40}
                        step={1}
                        value={propY}
                        onChange={(e) => {
                          const nextY = Number(e.target.value);
                          const dy = nextY - propY;
                          applyLiveStageScriptMutation((prev) => ({
                            ...prev,
                            props: (prev.props ?? []).map((p) =>
                              p.id === selectedProp.id ? { ...p, y: nextY } : p
                            ),
                            timeline: (prev.timeline ?? []).map((c) => {
                              if (c.target !== selectedProp.id) return c;
                              if (c.toY === undefined && c.y === undefined) {
                                return c;
                              }
                              return {
                                ...c,
                                ...(c.toY !== undefined
                                  ? { toY: Math.round(c.toY + dy) }
                                  : {}),
                                ...(c.y !== undefined
                                  ? { y: Math.round(c.y + dy) }
                                  : {}),
                              };
                            }),
                          }));
                        }}
                        className="w-full accent-tea-accent"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-tea-bg/40 border border-tea-border/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-tea-muted">
                          Kích cỡ đạo cụ (Scale):
                        </span>
                        <span className="font-mono font-bold text-tea-accent">
                          {propScale.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.4}
                        max={2.2}
                        step={0.02}
                        value={propScale}
                        onChange={(e) => {
                          const nextS = Number(e.target.value);
                          const ratio = propScale > 0.1 ? nextS / propScale : 1;
                          applyLiveStageScriptMutation((prev) => ({
                            ...prev,
                            props: (prev.props ?? []).map((p) =>
                              p.id === selectedProp.id ? { ...p, scale: nextS } : p
                            ),
                            timeline: (prev.timeline ?? []).map((c) =>
                              c.target === selectedProp.id && c.scale !== undefined
                                ? {
                                    ...c,
                                    scale:
                                      Math.round(c.scale * ratio * 100) / 100,
                                  }
                                : c
                            ),
                          }));
                        }}
                        className="w-full accent-tea-accent"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-tea-bg/40 border border-tea-border/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-tea-muted">
                          Độ rõ ban đầu (Opacity):
                        </span>
                        <span className="font-mono font-bold text-tea-ink">
                          {Math.round(propOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={propOpacity}
                        onChange={(e) => {
                          const nextOp = Number(e.target.value);
                          applyLiveStageScriptMutation((prev) => ({
                            ...prev,
                            props: (prev.props ?? []).map((p) =>
                              p.id === selectedProp.id
                                ? { ...p, opacity: nextOp }
                                : p
                            ),
                          }));
                        }}
                        className="w-full accent-tea-accent"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        {isScriptOpen && (
          <div className="p-4 rounded-xl border border-tea-accent/45 bg-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-tea-ink flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-tea-accent" />
                {isCreatingBlankScript
                  ? '✨ Tạo Cảnh Kịch Bản Mới (Dán hoặc gõ StageScript JSON -> Lưu & Xem Ngay 0.01s)'
                  : '🎬 Kịch Bản Đạo Diễn (Stage Script JSON · Phản hồi 0.01s không cần biên dịch tsc)'}
              </span>

              <div className="flex items-center gap-2">
                {loadingScript && (
                  <span className="text-xs text-tea-muted flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
                  </span>
                )}
                {!isCreatingBlankScript && (
                  <button
                    type="button"
                    onClick={handleStartBlankStageScript}
                    className="text-xs font-semibold text-tea-accent hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Làm mới mẫu JSON
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-tea-muted mb-1">
                  Tên Cảnh Kịch Bản (Hiển thị trong Kho Cảnh)
                </label>
                <input
                  type="text"
                  value={scriptSceneName}
                  onChange={(e) => setScriptSceneName(e.target.value)}
                  placeholder={`VD: Kịch Bản — ${props.title || 'Thiệp Hồng'}`}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-tea-border bg-tea-bg/30 focus:outline-none focus:border-tea-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-tea-muted mb-1">
                  Mã Cảnh `SCRIPT_*` (Để trống tự tạo từ Tên Cảnh)
                </label>
                <input
                  type="text"
                  value={scriptSceneId}
                  onChange={(e) => setScriptSceneId(e.target.value)}
                  placeholder="VD: SCRIPT_THIEP_HONG_NGUOI_XUA"
                  className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-tea-border bg-tea-bg/30 focus:outline-none focus:border-tea-accent"
                />
              </div>
            </div>

            <textarea
              rows={15}
              value={scriptJsonText}
              onChange={(e) => {
                const val = e.target.value;
                setScriptJsonText(val);
                try {
                  const parsed = StageScriptSchema.safeParse(JSON.parse(val));
                  if (parsed.success && activeSceneId.startsWith('SCRIPT_')) {
                    setScriptNotice(null);
                  }
                } catch {
                  // chờ người dùng bấm Lưu & Xem Ngay để báo lỗi chi tiết
                }
              }}
              placeholder={`{\n  "name": "Tên cảnh",\n  "terrain": "flat",\n  "actors": [{ "id": "hero", "x": "left", "facing": "right", "pose": "walk" }],\n  "props": [{ "id": "jar", "type": "wine_jar", "x": "center", "y": 0 }],\n  "timeline": [\n    { "at": "pivot", "duration": 2.2, "target": "hero", "toX": "center_left", "sitProgress": 1, "showTeaCup": 1 }\n  ]\n}`}
              spellCheck={false}
              className="w-full font-mono text-xs leading-relaxed p-3 rounded-xl border border-tea-border bg-tea-bg/20 focus:outline-none focus:border-tea-accent"
            />

            {scriptNotice && (
              <div
                className={`p-3 rounded-xl border text-xs whitespace-pre-wrap font-mono flex items-start gap-2 ${
                  scriptNotice.type === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-600/30 text-emerald-900'
                    : 'bg-red-500/10 border-red-500/30 text-red-800'
                }`}
              >
                {scriptNotice.type === 'ok' ? (
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="overflow-x-auto">{scriptNotice.text}</div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-tea-muted">
                Hỗ trợ 25 đạo cụ dựng sẵn + vẽ inline <code>shapes</code> (thêm{' '}
                <code>&quot;saveAs&quot;: &quot;ten_prop&quot;</code> để lưu kho tự động).
              </span>

              <button
                type="button"
                disabled={savingScript || !scriptJsonText.trim()}
                onClick={handleSaveAndApplyStageScript}
                className="px-4 py-2 rounded-xl bg-tea-accent text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-tea-accentHover shadow-xs disabled:opacity-50 shrink-0"
              >
                {savingScript ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Film className="w-3.5 h-3.5" /> Lưu &amp; Xem Ngay (0.01s)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="p-4 rounded-xl bg-tea-bg/60 border border-tea-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-tea-ink">
              <Sliders className="w-3.5 h-3.5 text-tea-accent" />
              Vi Chỉnh Bố Cục Trực Tiếp Trên &lt;Player&gt; (60fps · Đồng bộ 100% khi Render MP4)
            </div>
            <button
              type="button"
              onClick={resetAllTuning}
              className="text-[11px] font-semibold text-tea-muted hover:text-tea-accent flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Đặt lại mặc định
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3 rounded-xl bg-white border border-tea-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-tea-muted">
                  Dịch Ngang (Offset X):
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-tea-ink">
                    {tuning.offsetX > 0 ? `+${tuning.offsetX}` : tuning.offsetX}px
                  </span>
                  <button
                    type="button"
                    onClick={() => updateTuning({ offsetX: 0 })}
                    className="px-1.5 py-0.5 rounded bg-tea-edge/60 text-[10px] font-mono text-tea-muted hover:text-tea-ink"
                    title="Reset về 0px"
                  >
                    0
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={-120}
                max={120}
                step={1}
                value={tuning.offsetX}
                onChange={(e) =>
                  updateTuning({ offsetX: Number(e.target.value) })
                }
                className="w-full accent-tea-accent"
              />
            </div>

            <div className="p-3 rounded-xl bg-white border border-tea-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-tea-muted">
                  Dịch Dọc (Offset Y):
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-tea-ink">
                    {tuning.offsetY > 0 ? `+${tuning.offsetY}` : tuning.offsetY}px
                  </span>
                  <button
                    type="button"
                    onClick={() => updateTuning({ offsetY: 0 })}
                    className="px-1.5 py-0.5 rounded bg-tea-edge/60 text-[10px] font-mono text-tea-muted hover:text-tea-ink"
                    title="Reset về 0px"
                  >
                    0
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={-80}
                max={80}
                step={1}
                value={tuning.offsetY}
                onChange={(e) =>
                  updateTuning({ offsetY: Number(e.target.value) })
                }
                className="w-full accent-tea-accent"
              />
            </div>

            <div className="p-3 rounded-xl bg-white border border-tea-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-tea-muted">
                  Thu Phóng Cảnh (Scale):
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-tea-accent">
                    {tuning.scale.toFixed(2)}x
                  </span>
                  <button
                    type="button"
                    onClick={() => updateTuning({ scale: 1.0 })}
                    className="px-1.5 py-0.5 rounded bg-tea-edge/60 text-[10px] font-mono text-tea-muted hover:text-tea-ink"
                    title="Reset về 1.00x"
                  >
                    1.0x
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0.65}
                max={1.5}
                step={0.02}
                value={tuning.scale}
                onChange={(e) =>
                  updateTuning({ scale: Number(e.target.value) })
                }
                className="w-full accent-tea-accent"
              />
            </div>

            <div className="p-3 rounded-xl bg-white border border-tea-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-tea-muted">
                  Độ Đậm Nét (Stroke):
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-tea-ink">
                    {tuning.strokeScale.toFixed(2)}x
                  </span>
                  <button
                    type="button"
                    onClick={() => updateTuning({ strokeScale: 1.0 })}
                    className="px-1.5 py-0.5 rounded bg-tea-edge/60 text-[10px] font-mono text-tea-muted hover:text-tea-ink"
                    title="Reset về 1.00x"
                  >
                    1.0x
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0.7}
                max={1.4}
                step={0.05}
                value={tuning.strokeScale}
                onChange={(e) =>
                  updateTuning({ strokeScale: Number(e.target.value) })
                }
                className="w-full accent-tea-accent"
              />
            </div>
          </div>
        </div>

        {isCodeOpen && (
          <div className="p-4 rounded-xl border border-tea-accent/40 bg-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-tea-ink">
                {isCreatingBlankScene
                  ? '✨ Tạo Cảnh Mới Từ Code .tsx (Chỉ cần Paste code .tsx rồi bấm Lưu & Áp Dụng)'
                  : '</> Trình Biên Tập Code Cảnh .tsx (Tự động kiểm tra tsc --noEmit & HMR)'}
              </span>
              <div className="flex items-center gap-2">
                {loadingCode && (
                  <span className="text-xs text-tea-muted flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
                  </span>
                )}
                {!isCreatingBlankScene && (
                  <button
                    type="button"
                    onClick={handleStartBlankCustomScene}
                    className="text-xs font-semibold text-tea-accent hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Làm trống để tạo Cảnh mới
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-tea-muted mb-1">
                  Mã Cảnh (Để trống sẽ tự lấy theo tên `export const ...Scene`)
                </label>
                <input
                  type="text"
                  value={editorSceneId}
                  onChange={(e) => setEditorSceneId(e.target.value)}
                  placeholder="VD: CUSTOM_VE_NHA_ME (Tùy chọn)"
                  className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-tea-border bg-tea-bg/30 focus:outline-none focus:border-tea-accent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-tea-muted mb-1">
                  Tên hiển thị trong Kho Cảnh (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={editorSceneName}
                  onChange={(e) => setEditorSceneName(e.target.value)}
                  placeholder={`VD: Cảnh — ${props.title || 'Mới'}`}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-tea-border bg-tea-bg/30 focus:outline-none focus:border-tea-accent"
                />
              </div>
            </div>

            <textarea
              rows={15}
              value={editorTsxCode}
              onChange={(e) => setEditorTsxCode(e.target.value)}
              placeholder={`Paste toàn bộ code file .tsx vào đây...`}
              spellCheck={false}
              className="w-full font-mono text-xs leading-relaxed p-3 rounded-xl border border-tea-border bg-tea-bg/20 focus:outline-none focus:border-tea-accent"
            />

            {codeNotice && (
              <div
                className={`p-3 rounded-xl border text-xs whitespace-pre-wrap font-mono flex items-start gap-2 ${
                  codeNotice.type === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-600/30 text-emerald-900'
                    : 'bg-red-500/10 border-red-500/30 text-red-800'
                }`}
              >
                {codeNotice.type === 'ok' ? (
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="overflow-x-auto">{codeNotice.text}</div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCodeOpen(false);
                  setIsCreatingBlankScene(false);
                }}
                className="px-3.5 py-2 rounded-xl border border-tea-border text-xs font-semibold text-tea-muted hover:text-tea-ink"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={savingCode || !editorTsxCode.trim()}
                onClick={handleSaveAndCompileScene}
                className="px-4 py-2 rounded-xl bg-tea-accent text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-tea-accentHover shadow-xs disabled:opacity-50"
              >
                {savingCode ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang kiểm tra tsc &amp; Lưu...
                  </>
                ) : (
                  <>
                    <Code2 className="w-3.5 h-3.5" /> Lưu &amp; Áp Dụng Cho Chén Này
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          NGĂN 3: BẢNG MÀU GIẤY DÓ, THỜI LƯỢNG & ÂM THANH GỐC FOLEY -14.0 LUFS
         ===================================================================== */}
      <section className="rounded-2xl border border-tea-border bg-tea-paper p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-tea-muted">
              Ngăn 3 · Không Gian Giấy Trà &amp; Âm Thanh Gốc Foley (-14.0 LUFS)
            </span>
            <h2 className="font-serif text-lg font-semibold text-tea-ink">
              Bảng Màu Giấy Dó, Thời Lượng &amp; Foley Master Sạch Bản Quyền
            </h2>
          </div>
          <span className="text-[11px] font-medium text-tea-muted">
            2 nền giấy sáng · 1 nền đêm Ô Long Cổ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(
            [
              'MINIMAL_LIGHT',
              'MINIMAL_DARK',
              'WARM_NOIR',
            ] as const
          ).map((tid) => {
            const pal = THEME_PALETTES[tid];
            const meta = THEME_META[tid];
            const selected = props.themeId === tid;
            return (
              <button
                key={tid}
                type="button"
                onClick={() => onUpdateProps({ ...props, themeId: tid })}
                className={`p-2.5 rounded-xl border text-left transition ${
                  selected
                    ? 'border-tea-accent ring-2 ring-tea-accent/20 bg-white shadow-2xs'
                    : 'border-tea-border bg-white/60 hover:border-tea-accent/40'
                }`}
              >
                <div
                  className="h-10 rounded-lg mb-2 flex items-center justify-between px-3 border border-black/10"
                  style={{
                    background: `radial-gradient(circle, ${pal.background} 0%, ${pal.backgroundEdge} 100%)`,
                  }}
                >
                  <span
                    className="text-xs font-serif font-semibold"
                    style={{ color: pal.inkPrimary }}
                  >
                    Trà Nguội
                  </span>
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: pal.accent }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11.5px] font-semibold text-tea-ink truncate">
                    {meta?.label || pal.name}
                  </span>
                  {meta?.isSignature && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-tea-accent/12 text-tea-accent shrink-0">
                      ★ Signature
                    </span>
                  )}
                </div>

                {meta?.hint && (
                  <div className="text-[10px] text-tea-muted truncate mt-0.5">
                    {meta.hint}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* MODULE 6: BẢNG ĐẠO DIỄN VISUAL DNA — ĐỘC BẢN TRONG KHUÔN KHỔ (4 TRỤC CHỐNG TRÙNG pHash) */}
        <div className="p-4 rounded-xl bg-white/85 border border-tea-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-tea-ink flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-tea-accent" />
                Visual DNA · Độc Bản Trong Khuôn Khổ (4 Trục Chống Trùng pHash)
              </div>
              <div className="text-[11px] text-tea-muted">
                {resolvedDna.isLegacyLocked
                  ? 'Đang khóa nguyên bản Chén 01–07 (Legacy Lock A.2) để giữ 100% thiết kế đã xuất.'
                  : `Đang chạy: ${resolvedDna.layout} · ${resolvedDna.lightingGobo} · ${resolvedDna.shotMode} · ${resolvedDna.pivotMechanic}`}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextSalt = dnaSalt + 1;
                setDnaSalt(nextSalt);
                const suggested = suggestDistinctVisualDNA(
                  props,
                  resolvedScriptForDna,
                  [resolvedDna.layout],
                  [resolvedDna.lightingGobo],
                  dnaSalt
                );
                onUpdateProps({
                  ...props,
                  visualDNA: suggested,
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-tea-ink text-tea-paper text-[11px] font-semibold hover:bg-tea-accent transition flex items-center gap-1.5 shrink-0"
              title="Sinh ngẫu nhiên có kiểm soát 1 tổ hợp Visual DNA khác với cấu hình hiện tại (giữ nguyên Ràng buộc B.3)"
            >
              <Dices className="w-3.5 h-3.5" /> Đảo DNA Khác
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-tea-paper/80 p-1 border border-tea-border">
            {(
              [
                {
                  id: 'AUTO' as VisualDNAMode,
                  label: '🎲 Tự động Seed',
                },
                {
                  id: 'CUSTOM' as VisualDNAMode,
                  label: '🎛️ Chỉnh tay 4 Trục',
                },
                {
                  id: 'LEGACY_LOCK' as VisualDNAMode,
                  label: '🔒 Khóa nguyên bản',
                },
              ]
            ).map((modeOpt) => {
              const active = activeDnaMode === modeOpt.id;
              return (
                <button
                  key={modeOpt.id}
                  type="button"
                  onClick={() => {
                    if (modeOpt.id === 'AUTO') {
                      onUpdateProps({
                        ...props,
                        visualDNA: {
                          mode: 'AUTO',
                          forceSolidStyle: true,
                        },
                      });
                    } else if (modeOpt.id === 'CUSTOM') {
                      applyCustomDnaPatch({});
                    } else {
                      onUpdateProps({
                        ...props,
                        visualDNA: {
                          mode: 'LEGACY_LOCK',
                        },
                      });
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1 ${
                    active
                      ? 'bg-tea-ink text-tea-paper shadow-2xs'
                      : 'text-tea-muted hover:text-tea-ink'
                  }`}
                >
                  {modeOpt.id === 'LEGACY_LOCK' && (
                    <Lock className="w-3 h-3 shrink-0" />
                  )}
                  <span className="truncate">{modeOpt.label}</span>
                </button>
              );
            })}
          </div>

          {resolvedDna.downgradedAsymmetricThird && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-900 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {asymmetricGuard.blockedBySyllables ? (
                  <>
                    Ràng buộc B.3: Quote dài {asymmetricGuard.syllableCount} âm tiết (&gt;{' '}
                    {ASYMMETRIC_THIRD_MAX_SYLLABLES} âm) nên bố cục{' '}
                    <code>ASYMMETRIC_THIRD</code> đã tự chuyển sang{' '}
                    <code>WINDOW_FRAME</code> để tránh ép cột chữ hẹp <code>614px</code>.
                  </>
                ) : (
                  <>
                    Ràng buộc B.3: Cảnh có {asymmetricGuard.actorCount} nhân vật cách xa (
                    {asymmetricGuard.actorSpanX}px) nên bố cục{' '}
                    <code>ASYMMETRIC_THIRD</code> đã tự chuyển về{' '}
                    <code>WINDOW_FRAME</code> để tránh nhân vật bị thu nhỏ li ti. Bấm{' '}
                    <strong>1/3 Độc bản</strong> hoặc bật <strong>Cận đạo cụ (MACRO_PROP)</strong> nếu muốn ép khung 1/3.
                  </>
                )}
              </span>
            </div>
          )}

          <div
            className={`space-y-3 transition-opacity ${
              resolvedDna.isLegacyLocked ? 'opacity-65' : 'opacity-100'
            }`}
          >
            {/* Trục 1: Bố cục Khung (Layout Variant) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-tea-ink">
                  Trục 1 · Bố cục khung (Safe Đa Kênh · Chống trùng pHash)
                </span>
                <span className="font-mono text-[10px] text-tea-muted">
                  Line Đỏ Chu Sa dọc theo chữ
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(
                  [
                    {
                      id: 'CLASSIC_TOP_STAGE' as LayoutVariant,
                      title: 'Cổ điển',
                      sub: 'Tranh trên · Chữ dưới',
                    },
                    {
                      id: 'SKY_QUOTE_BOTTOM_STAGE' as LayoutVariant,
                      title: 'Chân mây',
                      sub: 'Chữ trên · Tranh dưới',
                    },
                    {
                      id: 'WINDOW_FRAME' as LayoutVariant,
                      title: 'Cửa sổ Á Đông',
                      sub: 'Khung vòm tĩnh tại',
                    },
                    {
                      id: 'ASYMMETRIC_THIRD' as LayoutVariant,
                      title: '1/3 Độc bản',
                      sub: asymmetricGuard.blockedBySyllables
                        ? `Khóa >28 âm (${syllableAudit.count} âm)`
                        : asymmetricGuard.allowed
                          ? 'Khung lệch 1/3 gọn'
                          : 'Kèm Cận MACRO_PROP',
                    },
                  ]
                ).map((item) => {
                  const active = resolvedDna.layout === item.id;
                  const disabledBySyllables =
                    item.id === 'ASYMMETRIC_THIRD' &&
                    asymmetricGuard.blockedBySyllables;
                  const needsMacroForB3 =
                    item.id === 'ASYMMETRIC_THIRD' &&
                    !asymmetricGuard.allowed &&
                    !asymmetricGuard.blockedBySyllables;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={disabledBySyllables}
                      onClick={() =>
                        applyCustomDnaPatch(
                          needsMacroForB3
                            ? {
                                layout: 'ASYMMETRIC_THIRD',
                                shotMode: 'MACRO_PROP',
                              }
                            : { layout: item.id }
                        )
                      }
                      title={
                        disabledBySyllables
                          ? `Quote dài ${asymmetricGuard.syllableCount} âm (> ${ASYMMETRIC_THIRD_MAX_SYLLABLES} âm) nên bị khóa khỏi 1/3 Độc bản để giữ cột chữ >= 650px`
                          : needsMacroForB3
                            ? `Cảnh có ${asymmetricGuard.actorCount} nhân vật cách ${asymmetricGuard.actorSpanX}px — bấm sẽ tự bật kèm MACRO_PROP theo Ràng buộc B.3`
                            : item.sub
                      }
                      className={`p-2 rounded-xl border text-left transition ${
                        disabledBySyllables
                          ? 'border-tea-border bg-tea-paper/60 opacity-55 cursor-not-allowed'
                          : active
                            ? 'border-tea-accent bg-tea-accent/10 ring-1 ring-tea-accent/25'
                            : 'border-tea-border bg-white hover:border-tea-accent/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-tea-ink truncate">
                          {item.title}
                        </span>
                        {needsMacroForB3 && (
                          <span className="px-1 rounded bg-amber-500/15 text-amber-800 text-[9px] font-mono shrink-0">
                            B.3
                          </span>
                        )}
                      </div>
                      <div className="text-[9.5px] text-tea-muted truncate mt-0.5">
                        {item.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trục 2: Ánh sáng Gobo (Gradient thuần 60fps - B.2) */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-tea-ink">
                Trục 2 · Ánh sáng Gobo (Gradient mượt 60fps · Zero-Blur)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'NONE' as LightingGobo, label: 'Phẳng tịnh' },
                    { id: 'FOLIAGE_DAPPLE' as LightingGobo, label: '🍃 Bóng lá' },
                    { id: 'WINDOW_SLATS' as LightingGobo, label: '🪟 Nan cửa' },
                    { id: 'WARM_LANTERN' as LightingGobo, label: '🏮 Đèn lồng' },
                    { id: 'PORCH_MIST' as LightingGobo, label: '🌫️ Sương hiên' },
                  ]
                ).map((g) => {
                  const active = resolvedDna.lightingGobo === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() =>
                        applyCustomDnaPatch({ lightingGobo: g.id })
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                        active
                          ? 'border-tea-accent bg-tea-accent text-white'
                          : 'border-tea-border bg-white text-tea-ink hover:border-tea-accent'
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trục 3 & Trục 4: Góc quay, Mảng đặc & Cú máy Pivot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-tea-border/60">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-tea-ink">
                  Trục 3 · Góc quay &amp; Nét nhân vật
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'SOLID_SCENE' as ShotMode, label: 'Toàn cảnh' },
                      { id: 'BRUSH_DRAW' as ShotMode, label: 'Vẽ nét Hồi I' },
                      { id: 'MACRO_PROP' as ShotMode, label: 'Cận đạo cụ' },
                    ]
                  ).map((sh) => {
                    const active = resolvedDna.shotMode === sh.id;
                    return (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() =>
                          applyCustomDnaPatch({ shotMode: sh.id })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border transition ${
                          active
                            ? 'border-tea-ink bg-tea-ink text-tea-paper'
                            : 'border-tea-border bg-white text-tea-ink hover:border-tea-accent'
                        }`}
                      >
                        {sh.label}
                      </button>
                    );
                  })}
                </div>
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-[11px] text-tea-ink">
                  <input
                    type="checkbox"
                    checked={resolvedDna.forceSolidStyle}
                    onChange={(e) =>
                      applyCustomDnaPatch({
                        forceSolidStyle: e.target.checked,
                      })
                    }
                    className="accent-tea-accent rounded"
                  />
                  <span>Ưu tiên Mảng Đặc (Solid Silhouette) nổi khối</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-tea-ink">
                    Trục 4 · Cú máy Pivot &amp; Chân trời
                  </span>
                  <span className="font-mono text-[10.5px] font-bold text-tea-accent">
                    {resolvedDna.horizonOffsetPx >= 0
                      ? `+${resolvedDna.horizonOffsetPx}`
                      : resolvedDna.horizonOffsetPx}
                    px
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      {
                        id: 'PARALLAX_DRIFT' as PivotMechanic,
                        label: 'Trượt sâu',
                      },
                      {
                        id: 'PULLBACK_REVEAL' as PivotMechanic,
                        label: 'Kéo rộng',
                      },
                      {
                        id: 'ACCENT_PUSH_IN' as PivotMechanic,
                        label: 'Đẩy cận',
                      },
                      {
                        id: 'SPOTLIGHT_DIM' as PivotMechanic,
                        label: 'Tụ sáng',
                      },
                    ]
                  ).map((pm) => {
                    const active = resolvedDna.pivotMechanic === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() =>
                          applyCustomDnaPatch({ pivotMechanic: pm.id })
                        }
                        className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold border transition ${
                          active
                            ? 'border-tea-accent bg-tea-accent text-white'
                            : 'border-tea-border bg-white text-tea-ink hover:border-tea-accent'
                        }`}
                      >
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="range"
                    min={-24}
                    max={24}
                    step={2}
                    value={resolvedDna.horizonOffsetPx}
                    onChange={(e) =>
                      applyCustomDnaPatch({
                        horizonOffsetPx: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-tea-accent"
                  />
                  <button
                    type="button"
                    onClick={() => applyCustomDnaPatch({ horizonOffsetPx: 0 })}
                    className="px-1.5 py-0.5 rounded bg-tea-paper border border-tea-border text-[9.5px] font-mono text-tea-muted hover:text-tea-ink"
                  >
                    0px
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/75 border border-tea-border space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-tea-ink">
                Thời lượng &amp; Phá chữ ký 15.0s (`{(sync.durationInFrames / sync.fps).toFixed(2)}s · {sync.durationInFrames} frames`)
              </div>
              <div className="text-[11px] text-tea-muted">
                Tự động giãn theo số âm tiết + seed để tránh trùng thời lượng cứng 900f ngoài kênh mà vẫn khép vòng Seamless Loop
              </div>
            </div>
            <div className="inline-flex rounded-lg border border-tea-border bg-tea-paper p-0.5 text-[11px] font-semibold shrink-0">
              {(
                [
                  { id: 'AUTO_SEED' as DurationMode, label: '🎲 Động (13.5–16.5s)' },
                  { id: 'FIXED' as DurationMode, label: '📌 Cố định' },
                ]
              ).map((dm) => {
                const active = (props.durationMode ?? 'FIXED') === dm.id;
                return (
                  <button
                    key={dm.id}
                    type="button"
                    onClick={() =>
                      onUpdateProps({
                        ...props,
                        durationMode: dm.id,
                      })
                    }
                    className={`px-2.5 py-1 rounded-md transition ${
                      active
                        ? 'bg-tea-ink text-tea-paper shadow-2xs'
                        : 'text-tea-muted hover:text-tea-ink'
                    }`}
                  >
                    {dm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {props.durationMode !== 'AUTO_SEED' && (
            <div className="flex items-center justify-end gap-3 pt-1.5 border-t border-tea-border/50">
              <span className="text-[11px] text-tea-muted">Thời lượng cố định:</span>
              <input
                type="range"
                min={12}
                max={22}
                step={0.5}
                value={props.targetDurationSeconds ?? 15}
                onChange={(e) =>
                  onUpdateProps({
                    ...props,
                    durationMode: 'FIXED',
                    targetDurationSeconds: Number(e.target.value),
                  })
                }
                className="w-32 accent-tea-accent"
              />
              <span className="w-14 text-right font-mono text-xs font-bold text-tea-accent">
                {props.targetDurationSeconds ?? 15}s
              </span>
            </div>
          )}
        </div>

        {/* Kiến trúc Âm thanh 3 Chế Độ (Siêu nhẹ Pivot Accent / Im lặng ghép nhạc TikTok / Foley Đầy đủ) */}
        <div className="p-4 rounded-xl bg-white/85 border border-tea-accent/35 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-tea-ink flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-tea-accent" />
                Âm Thanh Xuất Video — 3 Chế Độ Tinh Gọn (48 kHz AAC)
              </div>
              <div className="text-[11px] text-tea-muted">
                {props.bgm?.audioMode === 'TIKTOK_SILENT'
                  ? 'Mode 1: Rãnh AAC im lặng siêu nhẹ — ghép 100% nhạc xu hướng trực tiếp trên TikTok/Reels'
                  : props.bgm?.audioMode === 'FOLEY_MASTER'
                    ? `Mode 3: Foley Đầy đủ -14.0 LUFS · Điểm thanh âm tại Pivot (${pivotTimeSec}s)`
                    : `Mode 2 (Mặc định): Nền dither tĩnh -55 dBFS + Đúng 1 tiếng điểm Pivot (${pivotTimeSec}s)`}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/12 text-emerald-800 border border-emerald-500/30">
              {props.bgm?.audioMode ?? 'PIVOT_ACCENT'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'PIVOT_ACCENT' as AudioMode,
                  title: '🎯 Mode 2 · Điểm Pivot',
                  desc: 'Nền -55dBFS + 1 tiếng chạm tại Pivot (Nhẹ & giữ điểm nhấn)',
                },
                {
                  id: 'TIKTOK_SILENT' as AudioMode,
                  title: '🔇 Mode 1 · Im Lặng',
                  desc: 'Chỉ xuất AAC rỗng để lồng 100% nhạc kho TikTok',
                },
                {
                  id: 'FOLEY_MASTER' as AudioMode,
                  title: '🍵 Mode 3 · Foley Đầy Đủ',
                  desc: 'Trọn bộ trà, cọ giấy, mưa & -14 LUFS cho Shorts độc lập',
                },
              ]
            ).map((m) => {
              const curMode: AudioMode = props.bgm?.audioMode ?? 'PIVOT_ACCENT';
              const active = curMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    onUpdateProps({
                      ...props,
                      bgm: {
                        audioMode: m.id,
                        foleyPivotStyle: props.bgm?.foleyPivotStyle ?? 'AUTO',
                      },
                    })
                  }
                  className={`p-2 rounded-xl border text-left transition ${
                    active
                      ? 'border-tea-accent bg-tea-accent/8 ring-1 ring-tea-accent/25'
                      : 'border-tea-border bg-white/70 hover:border-tea-accent/40'
                  }`}
                >
                  <div className="text-[11.5px] font-semibold text-tea-ink">
                    {m.title}
                  </div>
                  <div className="text-[10px] text-tea-muted leading-snug mt-0.5">
                    {m.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {(props.bgm?.audioMode ?? 'PIVOT_ACCENT') !== 'TIKTOK_SILENT' && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-tea-border/60">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-tea-muted mr-1">
                  Tiếng điểm Hồi II:
                </span>
                {(
                  [
                    { id: 'AUTO' as FoleyPivotStyle, label: '✨ Tự động theo Mood' },
                    { id: 'TEA_CUP' as FoleyPivotStyle, label: '🍵 Chén sứ khay gỗ' },
                    { id: 'WIND_CHIME' as FoleyPivotStyle, label: '🎐 Chuông đồng trầm' },
                    { id: 'WOOD_SEAL' as FoleyPivotStyle, label: '🟥 Đóng triện gỗ' },
                  ]
                ).map((st) => {
                  const cur = props.bgm?.foleyPivotStyle ?? 'AUTO';
                  const active = cur === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        onUpdateProps({
                          ...props,
                          bgm: {
                            audioMode: props.bgm?.audioMode ?? 'PIVOT_ACCENT',
                            foleyPivotStyle: st.id,
                          },
                        })
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                        active
                          ? 'border-tea-accent bg-tea-accent text-white'
                          : 'border-tea-border bg-white text-tea-ink hover:border-tea-accent'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={toggleFoleyPivotPreview}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition ${
                  isPreviewingFoley
                    ? 'bg-tea-accent text-white'
                    : 'bg-tea-ink text-tea-paper hover:bg-tea-accent'
                }`}
                title="Nghe thử âm thanh quanh giây Pivot theo chế độ đang chọn"
              >
                {isPreviewingFoley ? (
                  <>
                    <Square className="w-3 h-3 fill-current" /> Dừng Audio
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" /> Nghe thử quanh Pivot
                  </>
                )}
              </button>
            </div>
          )}

          <div className="text-[10.5px] text-tea-muted bg-tea-bg/45 rounded-lg px-2.5 py-1.5 border border-tea-border/60">
            Xuất MP4 Constrained CRF (~2.5–4.0 MB, sạch metadata `Lavf`). Chế độ <strong>Mode 2 (Pivot Accent)</strong> giữ 1 nhịp chạm Đỏ Chu Sa rõ nét ngay cả khi lót nhạc kho TikTok/Reels.
          </div>
        </div>
      </section>
    </main>
  );
};
