export interface AirtableCreateFieldSpec {
  name: string;
  type: 'singleLineText' | 'multilineText' | 'singleSelect' | 'multipleSelects';
  description?: string;
  options?: {
    choices: Array<{
      name: string;
      color?: string;
    }>;
  };
}

export interface AirtableBatchPatchJob {
  batchId: string;
  mode?: 'sync_only' | 'patch_and_sync';
  baseId: string;
  tableId?: string;
  allowOriginalEdit?: boolean;
  ensureTable?: {
    name: string;
    description?: string;
    fields: AirtableCreateFieldSpec[];
  };
  description: string;
  records: Array<{
    id: string;
    code: string;
    tableId?: string;
    fields: Record<string, unknown>;
  }>;
  createRecords?: Array<{
    code: string;
    tableId?: string;
    fields: Record<string, unknown>;
  }>;
}

/**
 * Cầu nối đồng bộ trực tiếp 2 chiều giữa Gemini Editorial Engine <-> Trà Nguội Studio <-> Airtable:
 * - Khi `mode: 'sync_only'` (hoặc `records` & `createRecords` rỗng): Trà Nguội Studio tự động kéo bản mới nhất từ Airtable về `data/airtable-cache.json`.
 * - Khi `mode: 'patch_and_sync'`: Trà Nguội Studio đẩy toàn bộ bản biên tập (`Quote tinh chỉnh`, `TikTok Caption`, `Caption Status`, `Trạng thái`...) lên Airtable theo lô 10 bản ghi, bảo toàn `Nội dung nguyên văn`, sau đó làm mới lại `data/airtable-cache.json` kèm `lastBridgeReceipt`.
 */
export const CURRENT_AIRTABLE_BATCH_JOB: AirtableBatchPatchJob = {
  batchId: 'batch-2026-11-17-morning-sync-v1',
  mode: 'sync_only',
  baseId: 'app9rk1rYkbXuIi3e',
  tableId: 'tblNySzay61Opo3SL',
  description:
    'Đồng bộ trực tiếp toàn bộ thư viện Airtable mới nhất sáng 17/11/2026 về Trà Nguội Studio',
  records: [],
  createRecords: [],
};
