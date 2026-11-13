import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BookOpen, Database, Power } from 'lucide-react';
import { studioApi } from './api';
import {
  CupAirtableTrackMeta,
  CupRecord,
  RenderJobStatus,
  VaultSceneMeta,
} from './types';
import { VideoInputProps } from '../../src/schemas/videoSchema';
import { CupQueueSidebar } from './components/CupQueueSidebar';
import { StoryDirectorDesk } from './components/StoryDirectorDesk';
import { LivePhonePreview } from './components/LivePhonePreview';
import { VaultExplorerModal } from './components/VaultExplorerModal';
import {
  AirtableSyncModal,
  TOKEN_STORAGE_KEY,
  runPendingAirtableBatchJob,
  syncFullAirtableWorkspace,
} from './components/AirtableSyncModal';
import { CURRENT_AIRTABLE_BATCH_JOB } from './airtableBatchJob';
import {
  TRACKER_TABLE_NAME,
  hasSavedAirtableToken,
  hydrateCupsWithLocalTrack,
  resolveEffectiveCupTrackMeta,
  syncAllCupsToAirtableTracker,
  upsertSingleCupOnAirtableTracker,
} from './airtableCupTracker';

export const App: React.FC = () => {
  const [cups, setCups] = useState<CupRecord[]>([]);
  const [activeCupId, setActiveCupId] = useState<string>('');
  const [selectedCupIds, setSelectedCupIds] = useState<string[]>([]);

  const [vaultScenes, setVaultScenes] = useState<VaultSceneMeta[]>([]);

  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isAirtableOpen, setIsAirtableOpen] = useState(false);
  const [isShutDown, setIsShutDown] = useState(false);
  const [airtableBanner, setAirtableBanner] = useState<{
    tone: 'ok' | 'warn';
    text: string;
  } | null>(null);

  const saveTimerRef = useRef<number | null>(null);
  const prevStatusMapRef = useRef<Record<string, RenderJobStatus>>({});
  const initialTrackerSyncedRef = useRef<boolean>(false);

  const applyCupTrackMeta = useCallback(
    (cupId: string, meta: CupAirtableTrackMeta) => {
      setCups((prev) =>
        prev.map((c) => (c.id === cupId ? { ...c, publishTrack: meta } : c))
      );
    },
    []
  );

  const applyFullTrackerMap = useCallback(
    (trackMap: Record<string, CupAirtableTrackMeta>) => {
      setCups((prev) =>
        prev.map((c) => ({
          ...c,
          publishTrack: trackMap[c.id] || resolveEffectiveCupTrackMeta(c),
        }))
      );
    },
    []
  );

  const syncWorkspaceData = useCallback(async (selectFirstIfEmpty = false) => {
    try {
      const [cupsRes, vaultRes] = await Promise.all([
        studioApi.getCups(),
        studioApi.getVault(),
      ]);
      const hydrated = hydrateCupsWithLocalTrack(cupsRes.cups);
      setCups(hydrated);
      for (const c of hydrated) {
        prevStatusMapRef.current[c.id] = c.status;
      }
      if (selectFirstIfEmpty && hydrated.length > 0) {
        setActiveCupId((prev) => prev || hydrated[0].id);
      }
      setVaultScenes(vaultRes.scenes);
      return hydrated;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    void syncWorkspaceData(true).then((loadedCups) => {
      if (
        loadedCups &&
        loadedCups.length > 0 &&
        hasSavedAirtableToken() &&
        !initialTrackerSyncedRef.current
      ) {
        initialTrackerSyncedRef.current = true;
        void syncAllCupsToAirtableTracker(loadedCups)
          .then(async (res) => {
            applyFullTrackerMap(res.trackMap);
            const pat = (
              window.localStorage.getItem(TOKEN_STORAGE_KEY) || ''
            ).trim();
            if (pat) {
              await syncFullAirtableWorkspace(pat, undefined, res.tableId).catch(
                () => undefined
              );
            }
            if (res.createdCount > 0) {
              setAirtableBanner({
                tone: 'ok',
                text: `🍵 Đã tự động khởi tạo & nạp ${loadedCups.length} Chén lên bảng "${TRACKER_TABLE_NAME}" trên Airtable!`,
              });
            }
          })
          .catch(() => undefined);
      }
    });

    void runPendingAirtableBatchJob().then((res) => {
      if (res.status === 'applied' && res.message) {
        setAirtableBanner({ tone: 'ok', text: res.message });
      } else if (
        (res.status === 'needs_restart' || res.status === 'error') &&
        res.message
      ) {
        setAirtableBanner({ tone: 'warn', text: res.message });
      }
    });

    const onFocus = () => {
      if (!saveTimerRef.current) {
        void syncWorkspaceData(false).then((freshCups) => {
          if (freshCups && freshCups.length > 0 && hasSavedAirtableToken()) {
            void syncAllCupsToAirtableTracker(freshCups)
              .then((res) => applyFullTrackerMap(res.trackMap))
              .catch(() => undefined);
          }
        });
      }
      void runPendingAirtableBatchJob(false).then((res) => {
        if (res.status === 'applied' && res.message) {
          setAirtableBanner({ tone: 'ok', text: res.message });
        }
      });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [syncWorkspaceData, applyFullTrackerMap, CURRENT_AIRTABLE_BATCH_JOB.batchId]);

  // Polling tiến độ Render 1.2s/lần và tự động chuyển trạng thái trên Airtable sang "🎬 Đã xuất MP4" ngay khi xong
  useEffect(() => {
    const hasRunning = cups.some(
      (c) =>
        c.status === 'queued' ||
        c.status === 'bundling' ||
        c.status === 'rendering'
    );
    if (!hasRunning) {
      for (const c of cups) {
        prevStatusMapRef.current[c.id] = c.status;
      }
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const res = await studioApi.getRenderStatus();
        const hydrated = hydrateCupsWithLocalTrack(res.cups);

        for (const nextCup of hydrated) {
          const prevStatus = prevStatusMapRef.current[nextCup.id];
          prevStatusMapRef.current[nextCup.id] = nextCup.status;

          const justFinished =
            (prevStatus === 'queued' ||
              prevStatus === 'bundling' ||
              prevStatus === 'rendering') &&
            nextCup.status === 'completed';

          if (justFinished && hasSavedAirtableToken()) {
            const targetStatus =
              nextCup.publishTrack?.publishStatus === 'published' ||
              nextCup.publishTrack?.publishStatus === 'scheduled'
                ? nextCup.publishTrack.publishStatus
                : 'rendered';

            void upsertSingleCupOnAirtableTracker(nextCup, {
              publishStatus: targetStatus,
            })
              .then((updatedMeta) => {
                applyCupTrackMeta(nextCup.id, updatedMeta);
                setAirtableBanner({
                  tone: 'ok',
                  text: `🍵 Đã xuất xong MP4 Chén ${nextCup.cupNumber} & cập nhật trạng thái "Đã xuất MP4" lên Airtable!`,
                });
              })
              .catch(() => undefined);
          }
        }

        setCups(hydrated);
      } catch {
        // ignore transient network error
      }
    }, 1200);

    return () => window.clearInterval(timer);
  }, [cups, applyCupTrackMeta]);

  const activeCup = cups.find((c) => c.id === activeCupId) || cups[0];

  const handleUpdateActiveCupProps = (nextProps: VideoInputProps) => {
    if (!activeCup) return;
    setCups((prev) =>
      prev.map((c) =>
        c.id === activeCup.id ? { ...c, props: nextProps } : c
      )
    );

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(async () => {
      saveTimerRef.current = null;
      try {
        const res = await studioApi.updateCup(activeCup.id, nextProps);
        setCups((prev) =>
          prev.map((c) =>
            c.id === res.cup.id
              ? {
                  ...res.cup,
                  publishTrack: resolveEffectiveCupTrackMeta({
                    ...res.cup,
                    publishTrack: c.publishTrack,
                  }),
                }
              : c
          )
        );
      } catch (err) {
        console.error('Lỗi tự động lưu Chén:', err);
      }
    }, 280);
  };

  if (isShutDown) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-tea-bg p-6 text-center space-y-3">
        <span className="w-3 h-3 rounded-full bg-tea-muted/50" />
        <h1 className="font-serif text-xl font-semibold text-tea-ink">
          Đã dừng tiến trình ngầm Trà Nguội Studio
        </h1>
        <p className="text-xs text-tea-muted max-w-md leading-relaxed">
          Bạn có thể đóng tab trình duyệt này. Khi cần mở lại, chỉ việc bấm vào ứng dụng{' '}
          <strong>Trà Nguội.app</strong> trên máy Mac.
        </p>
      </div>
    );
  }

  const airtableConnected = hasSavedAirtableToken();
  const publishedCount = cups.filter(
    (c) => c.publishTrack?.publishStatus === 'published'
  ).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-tea-bg">
      {/* THANH TOPBAR TRÀ NGUỘI WORKBENCH (V8.3 · FOLEY MASTER & AIRTABLE HUB) */}
      <header className="h-14 shrink-0 border-b border-tea-border bg-tea-paper px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-tea-accent" />
          <span className="font-sans text-sm font-bold tracking-[0.22em] uppercase text-tea-ink">
            TRÀ NGUỘI WORKBENCH
          </span>
          <span className="hidden sm:inline-block text-xs text-tea-muted border-l border-tea-border pl-3">
            Chút thơ, chút đời, chút ngẫm — @tranguoi.15s
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Nút Kho Nội Dung & Tủ Chén Lịch Đăng Airtable */}
          <button
            type="button"
            onClick={() => setIsAirtableOpen(true)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              airtableConnected
                ? 'border-emerald-300 bg-emerald-50/80 text-emerald-900 hover:border-emerald-500'
                : 'border-tea-border bg-white/80 text-tea-ink hover:border-tea-accent'
            }`}
            title='Mở Kho Nội Dung & Bảng "Tủ Chén & Lịch Đăng" trên Airtable'
          >
            <Database
              className={`w-3.5 h-3.5 ${
                airtableConnected ? 'text-emerald-600' : 'text-tea-accent'
              }`}
            />
            <span>
              Airtable · Tủ Chén ({publishedCount}/{cups.length} đã đăng)
            </span>
            {airtableConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Nút Duyệt Kho Cảnh */}
          <button
            type="button"
            onClick={() => setIsVaultOpen(true)}
            className="px-3.5 py-1.5 rounded-xl border border-tea-border bg-white/80 text-xs font-semibold text-tea-ink hover:border-tea-accent flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-tea-accent" />
            Kho Cảnh ({vaultScenes.length})
          </button>

          {/* Nút Tắt Tiến Trình Ngầm 1 Chạm */}
          <button
            type="button"
            onClick={async () => {
              try {
                await studioApi.shutdownStudio();
              } catch {
                // server exits right away
              }
              setIsShutDown(true);
            }}
            title="Tắt hoàn toàn tiến trình chạy ngầm khi nghỉ làm việc"
            className="px-3 py-1.5 rounded-xl border border-tea-border bg-white/60 text-xs font-medium text-tea-muted hover:text-red-700 hover:border-red-400/60 flex items-center gap-1.5 transition"
          >
            <Power className="w-3.5 h-3.5" />
            Tắt ngầm
          </button>
        </div>
      </header>

      {airtableBanner && (
        <div
          className={`px-5 py-2 text-xs flex items-center justify-between border-b ${
            airtableBanner.tone === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span>{airtableBanner.text}</span>
          <div className="flex items-center gap-3 ml-4 shrink-0">
            <button
              type="button"
              onClick={() => setAirtableBanner(null)}
              className="underline opacity-75 hover:opacity-100"
            >
              Ẩn
            </button>
          </div>
        </div>
      )}

      {/* KHÔNG GIAN 3 CỘT */}
      <div className="flex-1 flex min-h-0">
        <CupQueueSidebar
          cups={cups}
          activeCupId={activeCup?.id || ''}
          selectedCupIds={selectedCupIds}
          onSelectCup={(id) => setActiveCupId(id)}
          onToggleBatchSelect={(id) =>
            setSelectedCupIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onCreateNewCupFromPaste={async ({
            title,
            segments,
            textFormat,
            pivotWord,
          }) => {
            const res = await studioApi.createCup({
              props: {
                textFormat,
                title,
                segments,
                pivotWord,
                highlightStyle: 'BOTH',
                targetDurationSeconds: 15,
                typingSpeedMsPerChar: 55,
                holdAfterFinishSeconds: 5.5,
                themeId: 'MINIMAL_LIGHT',
                stageTuning: {
                  offsetX: 0,
                  offsetY: 0,
                  scale: 1,
                  strokeScale: 1,
                },
                motion: {
                  sceneId: 'BOULDER_TO_BENCH',
                  archetype: 'BOULDER_TO_BENCH',
                  pacingMode: 'CONTEMPLATIVE',
                  stateA: { intensity: 0.85, spread: 0.25, tiltDeg: -14 },
                  stateB: { intensity: 0.05, spread: 0.65, tiltDeg: 0 },
                },
                bgm: {
                  audioMode: 'FOLEY_MASTER',
                  foleyPivotStyle: 'AUTO',
                },
                brandText: 'TRÀ NGUỘI',
              },
            });
            const hydrated = hydrateCupsWithLocalTrack(res.cups);
            setCups(hydrated);
            setActiveCupId(res.cup.id);
            if (hasSavedAirtableToken()) {
              void upsertSingleCupOnAirtableTracker(res.cup).then((meta) =>
                applyCupTrackMeta(res.cup.id, meta)
              );
            }
          }}
          onDuplicateCup={async (sourceCup) => {
            const res = await studioApi.createCup({
              props: {
                ...sourceCup.props,
                title: `${sourceCup.props.title || 'Trà Nguội'} (Bản sao)`,
              },
            });
            const hydrated = hydrateCupsWithLocalTrack(res.cups);
            setCups(hydrated);
            setActiveCupId(res.cup.id);
            if (hasSavedAirtableToken()) {
              void upsertSingleCupOnAirtableTracker(res.cup).then((meta) =>
                applyCupTrackMeta(res.cup.id, meta)
              );
            }
          }}
          onDeleteCup={async (id) => {
            const res = await studioApi.deleteCup(id);
            setCups(hydrateCupsWithLocalTrack(res.cups));
            if (activeCupId === id && res.cups[0]) {
              setActiveCupId(res.cups[0].id);
            }
          }}
          onEnqueueBatchRender={async (ids) => {
            const res = await studioApi.enqueueRender(ids);
            setCups(hydrateCupsWithLocalTrack(res.cups));
            setSelectedCupIds([]);
          }}
        />

        {activeCup ? (
          <>
            <StoryDirectorDesk
              cup={activeCup}
              vaultScenes={vaultScenes}
              onUpdateProps={handleUpdateActiveCupProps}
              onFetchStageScript={(sceneId) =>
                studioApi.getStageScript(sceneId)
              }
              onUpsertStageScript={async (params) => {
                const res = await studioApi.upsertStageScript(params);
                setVaultScenes(res.scenes);
                setCups(hydrateCupsWithLocalTrack(res.cups));
                return { scene: res.scene, script: res.script };
              }}
              onFetchSceneCode={(sceneId) => studioApi.getSceneCode(sceneId)}
              onUpsertSceneCode={async (params) => {
                const res = await studioApi.upsertSceneCode(params);
                setVaultScenes(res.scenes);
                setCups(hydrateCupsWithLocalTrack(res.cups));
                return res.scene;
              }}
              onDeleteCustomScene={async (sceneId) => {
                const res = await studioApi.deleteScene(sceneId);
                setVaultScenes(res.scenes);
                setCups(hydrateCupsWithLocalTrack(res.cups));
              }}
            />

            <LivePhonePreview
              cup={activeCup}
              onUpdateProps={handleUpdateActiveCupProps}
              onRenderSingleCup={async (cupId) => {
                await studioApi.updateCup(cupId, activeCup.props);
                const res = await studioApi.enqueueRender([cupId]);
                setCups(hydrateCupsWithLocalTrack(res.cups));
              }}
              onOpenAirtableModal={() => setIsAirtableOpen(true)}
              onCupTrackUpdated={applyCupTrackMeta}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-tea-muted">
            Hãy bấm “+ Tạo Chén Mới (Paste Nhanh)” ở cột bên trái để bắt đầu.
          </div>
        )}
      </div>

      {/* HỘP THOẠI DUYỆT KHO CẢNH */}
      <VaultExplorerModal
        isOpen={isVaultOpen}
        scenes={vaultScenes}
        activeSceneId={
          activeCup?.props.motion.sceneId || activeCup?.props.motion.archetype
        }
        onSelectScene={async (sceneId) => {
          if (!activeCup) return;
          if (sceneId.startsWith('SCRIPT_')) {
            try {
              const res = await studioApi.getStageScript(sceneId);
              handleUpdateActiveCupProps({
                ...activeCup.props,
                motion: {
                  ...activeCup.props.motion,
                  sceneId,
                  archetype: sceneId,
                  stageScript: res.script,
                },
              });
              return;
            } catch {
              // fallback below
            }
          }
          handleUpdateActiveCupProps({
            ...activeCup.props,
            motion: {
              ...activeCup.props.motion,
              sceneId,
              archetype: sceneId,
              stageScript: undefined,
            },
          });
        }}
        onClose={() => setIsVaultOpen(false)}
      />

      {/* HỘP THOẠI ĐỒNG BỘ DỮ LIỆU AIRTABLE & TỦ CHÉN LỊCH ĐĂNG */}
      <AirtableSyncModal
        isOpen={isAirtableOpen}
        cups={cups}
        onClose={() => setIsAirtableOpen(false)}
        onImportRecordAsCup={async ({ title, rawText, pivotWord, themeId }) => {
          const res = await studioApi.createCup({
            title,
            rawText,
            pivotWord,
            themeId,
          });
          const hydrated = hydrateCupsWithLocalTrack(res.cups);
          setCups(hydrated);
          setActiveCupId(res.cup.id);
          if (hasSavedAirtableToken()) {
            void upsertSingleCupOnAirtableTracker(res.cup).then((meta) =>
              applyCupTrackMeta(res.cup.id, meta)
            );
          }
        }}
        onTrackerMapUpdated={applyFullTrackerMap}
      />
    </div>
  );
};
