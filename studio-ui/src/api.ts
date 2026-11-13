import {
  AirtableWorkspaceCache,
  CupBundleImport,
  CupRecord,
  SceneCodeResponse,
  StageScriptResponse,
  VaultSceneMeta,
} from './types';
import { VideoInputProps } from '../../src/schemas/videoSchema';
import { StageScript } from '../../src/stage/stageScriptSchema';

async function parseApiResponse<T>(res: Response, url: string): Promise<T> {
  const rawText = await res.text();
  if (!rawText.trim()) {
    throw new Error(`HTTP ${res.status}: Empty response from ${url}`);
  }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    throw new Error(`HTTP ${res.status}: Non-JSON response from ${url}`);
  }
  if (!res.ok) {
    throw new Error(String(data?.error || `HTTP Error ${res.status}`));
  }
  return data as T;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });
  return parseApiResponse<T>(res, url);
}

export const studioApi = {
  getVault: () => requestJson<{ scenes: VaultSceneMeta[] }>('/api/vault'),

  getSceneCode: (sceneId: string) =>
    requestJson<SceneCodeResponse>(
      `/api/scenes/${encodeURIComponent(sceneId)}/code`
    ),

  upsertSceneCode: (params: {
    sceneId: string;
    name?: string;
    description?: string;
    act1?: string;
    act2AtPivot?: string;
    act3Afterimage?: string;
    redProp?: string;
    tsxCode: string;
    cupId?: string;
  }) =>
    requestJson<{
      scene: VaultSceneMeta;
      scenes: VaultSceneMeta[];
      cups: CupRecord[];
    }>('/api/scenes/upsert', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  deleteScene: (sceneId: string) =>
    requestJson<{ scenes: VaultSceneMeta[]; cups: CupRecord[] }>(
      `/api/scenes/${encodeURIComponent(sceneId)}`,
      {
        method: 'DELETE',
      }
    ),

  getStageScript: (sceneId: string) =>
    requestJson<StageScriptResponse>(
      `/api/stage-scripts/${encodeURIComponent(sceneId)}`
    ),

  upsertStageScript: (params: {
    sceneId?: string;
    name?: string;
    description?: string;
    script: StageScript | unknown;
    cupId?: string;
  }) =>
    requestJson<{
      scene: VaultSceneMeta;
      script: StageScript;
      scenes: VaultSceneMeta[];
      cups: CupRecord[];
    }>('/api/stage-scripts/upsert', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  importBundle: (bundlePayload: CupBundleImport | unknown) =>
    requestJson<{
      cup: CupRecord;
      cups: CupRecord[];
      scenes: VaultSceneMeta[];
    }>('/api/bundles/import', {
      method: 'POST',
      body: JSON.stringify(bundlePayload),
    }),

  getCups: () => requestJson<{ cups: CupRecord[] }>('/api/cups'),

  createCup: (payload?: {
    title?: string;
    rawText?: string;
    pivotWord?: string;
    themeId?: 'MINIMAL_LIGHT' | 'DARK_CONTEMPLATIVE';
    sceneId?: string;
    props?: Partial<VideoInputProps>;
  }) =>
    requestJson<{ cup: CupRecord; cups: CupRecord[] }>('/api/cups', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),

  updateCup: (id: string, props: VideoInputProps) =>
    requestJson<{ cup: CupRecord }>(`/api/cups/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ props }),
    }),

  deleteCup: (id: string) =>
    requestJson<{ cups: CupRecord[] }>(`/api/cups/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  enqueueRender: (cupIds: string[]) =>
    requestJson<{ enqueued: CupRecord[]; cups: CupRecord[] }>(
      '/api/render/enqueue',
      {
        method: 'POST',
        body: JSON.stringify({ cupIds }),
      }
    ),

  getRenderStatus: () =>
    requestJson<{ cups: CupRecord[] }>('/api/render/status'),

  getAirtableCache: () =>
    requestJson<{ cache: AirtableWorkspaceCache | null }>('/api/airtable/cache'),

  saveAirtableCache: (cache: AirtableWorkspaceCache) =>
    requestJson<{ ok: boolean; cache: AirtableWorkspaceCache }>(
      '/api/airtable/cache',
      {
        method: 'POST',
        body: JSON.stringify({ cache }),
      }
    ),

  shutdownStudio: () =>
    requestJson<{ ok: boolean; message: string }>('/api/system/shutdown', {
      method: 'POST',
    }),
};
