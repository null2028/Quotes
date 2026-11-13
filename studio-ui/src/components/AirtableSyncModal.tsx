import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Database,
  KeyRound,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  AirtableBaseSummary,
  AirtableFieldMeta,
  AirtableRecordItem,
  AirtableTableCache,
  AirtableWorkspaceCache,
  CupAirtableTrackMeta,
  CupRecord,
} from '../types';
import { studioApi } from '../api';
import { CURRENT_AIRTABLE_BATCH_JOB } from '../airtableBatchJob';
import {
  TRACKER_TABLE_NAME,
  syncAllCupsToAirtableTracker,
} from '../airtableCupTracker';

export const TOKEN_STORAGE_KEY = 'tra_nguoi_airtable_pat';
export const APPLIED_BATCH_KEY = 'tra_nguoi_applied_airtable_batch';

export interface BatchJobResult {
  status: 'no_token' | 'already_done' | 'applied' | 'needs_restart' | 'error';
  message?: string;
  targetTableId?: string;
}

let inFlightBatchPromise: Promise<BatchJobResult> | null = null;

interface AirtableSyncModalProps {
  isOpen: boolean;
  cups?: CupRecord[];
  onClose: () => void;
  onImportRecordAsCup: (params: {
    title: string;
    rawText: string;
    pivotWord?: string;
    themeId?: 'MINIMAL_LIGHT' | 'DARK_CONTEMPLATIVE';
  }) => Promise<void>;
  onTrackerMapUpdated?: (map: Record<string, CupAirtableTrackMeta>) => void;
}

async function fetchAirtableViaProxy<T>(
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
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      'Chưa nhận diện được cổng proxy Airtable. Bạn hãy bấm "Tắt ngầm" rồi mở lại Trà Nguội.app 1 lần để nạp cấu hình mới nhé.'
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
    throw new Error(`Airtable từ chối (${res.status}): ${msg}`);
  }
  return data as T;
}

export async function syncFullAirtableWorkspace(
  cleanToken: string,
  preferredBaseId?: string,
  preferredTableId?: string
): Promise<AirtableWorkspaceCache> {
  const basesRes = await fetchAirtableViaProxy<{
    bases: AirtableBaseSummary[];
  }>('/meta/bases', cleanToken);
  const bases = basesRes.bases || [];
  if (bases.length === 0) {
    throw new Error(
      'Token hợp lệ nhưng chưa có Base nào được chọn trong phần Access (+ Add a base) trên Airtable.'
    );
  }

  const targetBase =
    bases.find((b) => b.id === preferredBaseId) || bases[0];

  const schemaRes = await fetchAirtableViaProxy<{
    tables: Array<{
      id: string;
      name: string;
      primaryFieldId?: string;
      fields: AirtableFieldMeta[];
    }>;
  }>(`/meta/bases/${encodeURIComponent(targetBase.id)}/tables`, cleanToken);

  const tableSchemas = schemaRes.tables || [];
  const tablesWithRecords: AirtableTableCache[] = [];

  for (const tbl of tableSchemas) {
    const records: AirtableRecordItem[] = [];
    let offset: string | undefined;
    do {
      const qs = new URLSearchParams({ pageSize: '100' });
      if (offset) qs.set('offset', offset);
      const page = await fetchAirtableViaProxy<{
        records: AirtableRecordItem[];
        offset?: string;
      }>(
        `/${encodeURIComponent(targetBase.id)}/${encodeURIComponent(
          tbl.id
        )}?${qs.toString()}`,
        cleanToken
      );
      if (Array.isArray(page.records)) {
        records.push(...page.records);
      }
      offset = page.offset;
    } while (offset && records.length < 400);

    tablesWithRecords.push({
      ...tbl,
      records,
      recordCount: records.length,
    });
  }

  const trackerTbl = tablesWithRecords.find(
    (t) => t.name.trim().toLowerCase() === TRACKER_TABLE_NAME.toLowerCase()
  );
  const richestTable = [...tablesWithRecords].sort(
    (a, b) => b.recordCount - a.recordCount
  )[0];

  const nextTableId =
    tablesWithRecords.find((t) => t.id === preferredTableId)?.id ||
    trackerTbl?.id ||
    richestTable?.id ||
    tablesWithRecords[0]?.id ||
    '';

  const nextCache: AirtableWorkspaceCache = {
    syncedAt: new Date().toISOString(),
    selectedBaseId: targetBase.id,
    selectedBaseName: targetBase.name,
    selectedTableId: nextTableId,
    bases,
    tables: tablesWithRecords,
  };

  await studioApi.saveAirtableCache(nextCache);
  return nextCache;
}

async function executeAirtableBatchJobInternal(
  force: boolean
): Promise<BatchJobResult> {
  const token = (window.localStorage.getItem(TOKEN_STORAGE_KEY) || '').trim();
  if (!token) {
    return { status: 'no_token' };
  }

  const job = CURRENT_AIRTABLE_BATCH_JOB;
  if (!force && window.localStorage.getItem(APPLIED_BATCH_KEY) === job.batchId) {
    return { status: 'already_done' };
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 25000);

  try {
    let targetTableId = job.tableId || '';
    let createdTableFlag = false;

    if (job.ensureTable) {
      const schemaRes = await fetchAirtableViaProxy<{
        tables: Array<{ id: string; name: string }>;
      }>(
        `/meta/bases/${encodeURIComponent(job.baseId)}/tables`,
        token,
        { signal: controller.signal }
      );

      const wantedName = job.ensureTable.name.trim().toLowerCase();
      const existingTbl = (schemaRes.tables || []).find(
        (t) => t.name.trim().toLowerCase() === wantedName
      );

      if (existingTbl) {
        targetTableId = existingTbl.id;
      } else {
        try {
          const createdTbl = await fetchAirtableViaProxy<{
            id: string;
            name: string;
          }>(
            `/meta/bases/${encodeURIComponent(job.baseId)}/tables`,
            token,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: job.ensureTable.name,
                description: job.ensureTable.description,
                fields: job.ensureTable.fields,
              }),
              signal: controller.signal,
            }
          );
          targetTableId = createdTbl.id;
          createdTableFlag = true;
        } catch (schemaErr: unknown) {
          const rawMsg =
            schemaErr instanceof Error ? schemaErr.message : String(schemaErr);
          if (/403|permission|not authorized|invalid_permissions/i.test(rawMsg)) {
            window.clearTimeout(timer);
            return {
              status: 'error',
              message:
                'Đang chờ bật quyền schema.bases:write trên Airtable Token. Sau khi bạn tích chọn schema.bases:write và bấm Save trên trang Airtable, chỉ cần bấm "Đồng bộ mới"!',
            };
          }
          throw schemaErr;
        }
      }
    }

    if (!targetTableId) {
      throw new Error('Không xác định được tableId đích trên Airtable.');
    }

    for (let i = 0; i < job.records.length; i += 10) {
      const chunk = job.records.slice(i, i + 10);
      await fetchAirtableViaProxy(
        `/${encodeURIComponent(job.baseId)}/${encodeURIComponent(targetTableId)}`,
        token,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: chunk.map((r) => ({
              id: r.id,
              fields: r.fields,
            })),
            typecast: true,
          }),
          signal: controller.signal,
        }
      );
      if (i + 10 < job.records.length) {
        await new Promise((r) => setTimeout(r, 260));
      }
    }

    let createdCount = 0;
    if (Array.isArray(job.createRecords) && job.createRecords.length > 0) {
      const existingCheck = await fetchAirtableViaProxy<{
        records: AirtableRecordItem[];
      }>(
        `/${encodeURIComponent(job.baseId)}/${encodeURIComponent(
          targetTableId
        )}?fields%5B%5D=ID&pageSize=100`,
        token,
        { signal: controller.signal }
      );
      const existingIds = new Set(
        (existingCheck.records || []).map((r) => String(r.fields.ID || '').trim())
      );
      const toCreate = job.createRecords.filter(
        (item) => !existingIds.has(item.code)
      );

      for (let i = 0; i < toCreate.length; i += 10) {
        const chunk = toCreate.slice(i, i + 10);
        await fetchAirtableViaProxy(
          `/${encodeURIComponent(job.baseId)}/${encodeURIComponent(targetTableId)}`,
          token,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              records: chunk.map((r) => ({
                fields: r.fields,
              })),
              typecast: true,
            }),
            signal: controller.signal,
          }
        );
        createdCount += chunk.length;
        if (i + 10 < toCreate.length) {
          await new Promise((r) => setTimeout(r, 260));
        }
      }
    }

    window.clearTimeout(timer);

    window.localStorage.setItem(APPLIED_BATCH_KEY, job.batchId);
    await syncFullAirtableWorkspace(token, job.baseId, targetTableId);

    const tableMsg = job.ensureTable
      ? createdTableFlag
        ? `Đã tạo mới bảng "${job.ensureTable.name}" và nạp ${createdCount} bản ghi lên Airtable!`
        : `Đã đồng bộ vào bảng "${job.ensureTable.name}" (thêm mới ${createdCount} bản ghi) trên Airtable!`
      : `Đã cập nhật ${job.records.length} bài và thêm mới ${createdCount} bài lên Airtable!`;

    return {
      status: 'applied',
      message: tableMsg,
      targetTableId,
    };
  } catch (err: unknown) {
    window.clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        status: 'needs_restart',
        message:
          'Kết nối Airtable quá thời gian chờ. Bạn hãy bấm "Thử lại" để đẩy lại gói dữ liệu nhé.',
      };
    }
    return {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export function runPendingAirtableBatchJob(force = false): Promise<BatchJobResult> {
  if (inFlightBatchPromise) {
    return inFlightBatchPromise;
  }
  inFlightBatchPromise = executeAirtableBatchJobInternal(force).finally(() => {
    inFlightBatchPromise = null;
  });
  return inFlightBatchPromise;
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'name' in item) {
          return String((item as { name: unknown }).name);
        }
        return JSON.stringify(item);
      })
      .join(', ');
  }
  if (typeof val === 'object' && 'name' in (val as Record<string, unknown>)) {
    return String((val as { name: unknown }).name);
  }
  return JSON.stringify(val);
}

function extractRecordForCup(
  record: AirtableRecordItem,
  fieldsMeta: AirtableFieldMeta[]
): {
  title: string;
  content: string;
  pivotWord?: string;
  themeId?: 'MINIMAL_LIGHT' | 'DARK_CONTEMPLATIVE';
} {
  const entries = Object.entries(record.fields)
    .map(([k, v]) => ({ key: k, text: formatCellValue(v) }))
    .filter((e) => e.text.length > 0);

  const exactTraNguoiContent =
    formatCellValue(record.fields['Nội dung Trà Nguội']) ||
    formatCellValue(record.fields['Nội dung nguyên văn']) ||
    formatCellValue(record.fields['Lời dẫn trong video']);

  const contentCandidate = exactTraNguoiContent
    ? { key: 'Nội dung', text: exactTraNguoiContent }
    : entries.find((e) =>
        /(nội dung|noi dung|thơ|tho|bài viết|bai viet|quote|content|lyrics|text|lời)/i.test(
          e.key
        )
      ) || [...entries].sort((a, b) => b.text.length - a.text.length)[0];

  const motifTitle = formatCellValue(record.fields['Cặp khóa / Mô-típ']);
  const primaryFieldName = fieldsMeta[0]?.name;
  const primaryCode = primaryFieldName
    ? formatCellValue(record.fields[primaryFieldName])
    : '';

  const fallbackTitleCandidate =
    entries.find(
      (e) =>
        e.key !== contentCandidate?.key &&
        /(mã chén|cặp khóa|mô-típ|tiêu đề|tieu de|tên|ten|chủ đề|chu de|title|name|chén|chen)/i.test(
          e.key
        )
    ) ||
    (primaryCode && primaryFieldName !== contentCandidate?.key
      ? { key: primaryFieldName || 'ID', text: primaryCode }
      : undefined);

  const resolvedTitle = motifTitle
    ? primaryCode
      ? `${primaryCode} · ${motifTitle}`
      : motifTitle
    : fallbackTitleCandidate?.text?.slice(0, 60) || 'Chén từ Airtable';

  const rawPivot = formatCellValue(record.fields['Pivot Word (Đỏ Chu Sa)']);
  const slot = formatCellValue(record.fields['Thời điểm phù hợp']);
  const themeId: 'MINIMAL_LIGHT' | 'DARK_CONTEMPLATIVE' | undefined =
    slot === 'Night'
      ? 'DARK_CONTEMPLATIVE'
      : slot
        ? 'MINIMAL_LIGHT'
        : undefined;

  return {
    title: resolvedTitle.slice(0, 60),
    content: contentCandidate?.text || '',
    pivotWord: rawPivot || undefined,
    themeId,
  };
}

export const AirtableSyncModal: React.FC<AirtableSyncModalProps> = ({
  isOpen,
  cups = [],
  onClose,
  onImportRecordAsCup,
  onTrackerMapUpdated,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(
    () => window.localStorage.getItem(TOKEN_STORAGE_KEY) || ''
  );
  const [cache, setCache] = useState<AirtableWorkspaceCache | null>(null);
  const [activeTableId, setActiveTableId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSyncingTracker, setIsSyncingTracker] = useState<boolean>(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    void studioApi
      .getAirtableCache()
      .then((res) => {
        if (res.cache) {
          setCache(res.cache);
          const trackerTbl = res.cache.tables.find(
            (t) => t.name.trim().toLowerCase() === TRACKER_TABLE_NAME.toLowerCase()
          );
          const preferred = res.cache.tables.find(
            (t) => t.id === res.cache?.selectedTableId
          );
          const richest = [...res.cache.tables].sort(
            (a, b) => b.recordCount - a.recordCount
          )[0];
          setActiveTableId(
            (prev) =>
              prev || trackerTbl?.id || preferred?.id || richest?.id || ''
          );
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const handleSyncAirtable = async (preferredBaseId?: string) => {
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setErrorMsg('Vui lòng dán mã Personal Access Token (pat...) trước.');
      return;
    }

    setIsSyncing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, cleanToken);

      let batchAppliedMsg = '';
      let targetTblFromBatch: string | undefined;
      if (
        window.localStorage.getItem(APPLIED_BATCH_KEY) !==
        CURRENT_AIRTABLE_BATCH_JOB.batchId
      ) {
        const batchRes = await runPendingAirtableBatchJob(true);
        if (batchRes.status === 'applied') {
          batchAppliedMsg = batchRes.message || '';
          targetTblFromBatch = batchRes.targetTableId;
        } else if (batchRes.status === 'error' && batchRes.message) {
          setErrorMsg(batchRes.message);
        }
      }

      if (cups.length > 0) {
        const trackerRes = await syncAllCupsToAirtableTracker(cups);
        onTrackerMapUpdated?.(trackerRes.trackMap);
      }

      const nextCache = await syncFullAirtableWorkspace(
        cleanToken,
        preferredBaseId || cache?.selectedBaseId,
        targetTblFromBatch || activeTableId
      );
      setCache(nextCache);
      setActiveTableId(targetTblFromBatch || nextCache.selectedTableId);

      const totalRows = nextCache.tables.reduce(
        (sum, t) => sum + t.recordCount,
        0
      );
      setSuccessMsg(
        batchAppliedMsg ||
          `Đã đồng bộ ${nextCache.tables.length} bảng (${totalRows} bản ghi) từ "${nextCache.selectedBaseName}"!`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCupTrackerNow = async () => {
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setErrorMsg('Vui lòng dán mã Personal Access Token (pat...) trước.');
      return;
    }

    setIsSyncingTracker(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, cleanToken);
      const res = await syncAllCupsToAirtableTracker(cups);
      onTrackerMapUpdated?.(res.trackMap);

      const nextCache = await syncFullAirtableWorkspace(
        cleanToken,
        cache?.selectedBaseId,
        res.tableId
      );
      setCache(nextCache);
      setActiveTableId(res.tableId);
      setSuccessMsg(
        `Đã đồng bộ ${cups.length} Chén (thêm mới ${res.createdCount}, cập nhật ${res.updatedCount}) vào bảng "${TRACKER_TABLE_NAME}" trên Airtable!`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSyncingTracker(false);
    }
  };

  const activeTable = useMemo(() => {
    if (!cache) return null;
    return (
      cache.tables.find((t) => t.id === activeTableId) ||
      cache.tables[0] ||
      null
    );
  }, [cache, activeTableId]);

  const isTrackerTableActive = Boolean(
    activeTable &&
      activeTable.name.trim().toLowerCase() === TRACKER_TABLE_NAME.toLowerCase()
  );

  const filteredRecords = useMemo(() => {
    if (!activeTable) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeTable.records;
    return activeTable.records.filter((rec) =>
      Object.values(rec.fields).some((v) =>
        formatCellValue(v).toLowerCase().includes(q)
      )
    );
  }, [activeTable, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-tea-paper border border-tea-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-tea-border flex items-center justify-between bg-white/60">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-tea-accent" />
            <div>
              <h2 className="font-serif text-base font-semibold text-tea-ink">
                Kho Nội Dung & Tủ Chén Lịch Đăng (Airtable)
              </h2>
              <p className="text-[11px] text-tea-muted">
                Quản lý Kho Thơ/Quote, Xưởng Chơi Chữ và đồng bộ hai chiều bảng "{TRACKER_TABLE_NAME}" để xem & duyệt bài đăng trên điện thoại
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

        {/* Thanh nhập Token & Đồng bộ */}
        <div className="px-6 py-4 border-b border-tea-border bg-tea-bg/60 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <KeyRound className="w-3.5 h-3.5 text-tea-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Dán mã Personal Access Token (pat...) của Airtable vào đây"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-tea-border bg-white text-xs text-tea-ink focus:outline-none focus:border-tea-accent"
              />
            </div>

            {cache && cache.bases.length > 1 && (
              <select
                value={cache.selectedBaseId}
                onChange={(e) => void handleSyncAirtable(e.target.value)}
                className="px-3 py-2 rounded-xl border border-tea-border bg-white text-xs text-tea-ink"
              >
                {cache.bases.map((b) => (
                  <option key={b.id} value={b.id}>
                    Base: {b.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              disabled={isSyncingTracker || isSyncing || cups.length === 0}
              onClick={() => void handleSyncCupTrackerNow()}
              className="px-3.5 py-2 rounded-xl bg-tea-ink text-tea-paper text-xs font-semibold hover:bg-tea-accent disabled:opacity-50 flex items-center gap-1.5 transition"
              title='Tạo/cập nhật bảng "Tủ Chén & Lịch Đăng" với toàn bộ các Chén hiện có trên Studio'
            >
              <ListChecks
                className={`w-3.5 h-3.5 ${isSyncingTracker ? 'animate-pulse' : ''}`}
              />
              {isSyncingTracker
                ? 'Đang đẩy Tủ Chén...'
                : `Đồng bộ Tủ Chén (${cups.length})`}
            </button>

            <button
              type="button"
              disabled={isSyncing || isSyncingTracker}
              onClick={() => void handleSyncAirtable()}
              className="px-3.5 py-2 rounded-xl bg-tea-accent text-white text-xs font-semibold hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {isSyncing
                ? 'Đang tải...'
                : cache
                  ? 'Làm mới toàn bộ'
                  : 'Kết nối & Đồng bộ'}
            </button>

            {tokenInput && (
              <button
                type="button"
                title="Xoá mã Token khỏi trình duyệt"
                onClick={() => {
                  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
                  setTokenInput('');
                }}
                className="p-2 rounded-xl border border-tea-border bg-white/70 text-tea-muted hover:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Danh sách Bảng & Bản ghi */}
        {cache && activeTable ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-2.5 border-b border-tea-border bg-white/50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {cache.tables.map((tbl) => {
                  const isTracker =
                    tbl.name.trim().toLowerCase() ===
                    TRACKER_TABLE_NAME.toLowerCase();
                  return (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => setActiveTableId(tbl.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        tbl.id === activeTable.id
                          ? 'bg-tea-ink text-white'
                          : isTracker
                            ? 'bg-tea-accent/12 text-tea-accent hover:bg-tea-accent/20 font-semibold'
                            : 'bg-tea-bg text-tea-muted hover:text-tea-ink'
                      }`}
                    >
                      {isTracker ? `🍵 ${tbl.name}` : tbl.name} ({tbl.recordCount})
                    </button>
                  );
                })}
              </div>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-tea-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo buổi, mood, câu chữ..."
                  className="w-full pl-8 pr-2.5 py-1 rounded-lg border border-tea-border bg-white text-xs text-tea-ink focus:outline-none focus:border-tea-accent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-10 text-xs text-tea-muted">
                  Không có bản ghi nào khớp từ khoá tìm kiếm.
                </div>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const { title, content, pivotWord, themeId } =
                    extractRecordForCup(rec, activeTable.fields);
                  const extraPairs = Object.entries(rec.fields)
                    .map(([k, v]) => ({ k, v: formatCellValue(v) }))
                    .filter(
                      (x) =>
                        x.v.length > 0 &&
                        x.v !== content &&
                        x.v !== title &&
                        x.k !== 'Cặp khóa / Mô-típ' &&
                        x.k !== 'TikTok Caption' &&
                        x.k !== 'Caption & Hashtag' &&
                        x.k !== 'Hạt nhân gốc'
                    )
                    .slice(0, 5);

                  const trackerCaption = isTrackerTableActive
                    ? formatCellValue(rec.fields['Caption & Hashtag'])
                    : '';

                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-xl border border-tea-border bg-white/80 hover:border-tea-accent/60 transition flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-tea-bg text-tea-muted">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-tea-ink">
                            {title}
                          </span>
                          {extraPairs.map((p) => (
                            <span
                              key={p.k}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-tea-bg text-tea-muted"
                            >
                              {p.k}: {p.v}
                            </span>
                          ))}
                        </div>
                        {content && (
                          <p className="font-serif text-xs text-tea-ink/90 whitespace-pre-line leading-relaxed">
                            {content}
                          </p>
                        )}
                        {trackerCaption && (
                          <div className="mt-1.5 pt-1.5 border-t border-tea-border/60 text-[11px] text-tea-muted whitespace-pre-line">
                            {trackerCaption}
                          </div>
                        )}
                      </div>

                      {!isTrackerTableActive && content && (
                        <button
                          type="button"
                          disabled={importingId === rec.id}
                          onClick={async () => {
                            setImportingId(rec.id);
                            try {
                              await onImportRecordAsCup({
                                title,
                                rawText: content,
                                pivotWord,
                                themeId,
                              });
                              onClose();
                            } finally {
                              setImportingId(null);
                            }
                          }}
                          className="shrink-0 px-3 py-1.5 rounded-xl border border-tea-border bg-tea-bg hover:border-tea-accent hover:text-tea-accent text-xs font-semibold text-tea-ink flex items-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {importingId === rec.id
                            ? 'Đang tạo...'
                            : 'Đẩy vào Chén'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-2.5 border-t border-tea-border bg-white/60 text-[11px] text-tea-muted flex items-center justify-between">
              <span>
                Base đang chọn: <strong>{cache.selectedBaseName}</strong>
              </span>
              <span>
                Đồng bộ lần cuối:{' '}
                {new Date(cache.syncedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center space-y-2">
            <p className="text-xs text-tea-muted max-w-md mx-auto leading-relaxed">
              Dán mã <strong>pat...</strong> của bạn lên ô phía trên và bấm{' '}
              <strong>Kết nối &amp; Đồng bộ</strong> để tự động tạo bảng "{TRACKER_TABLE_NAME}" và đồng bộ hai chiều với ứng dụng Airtable trên điện thoại.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
