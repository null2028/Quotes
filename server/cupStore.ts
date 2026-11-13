import fs from 'fs';
import path from 'path';
import { VideoInputProps } from '../src/schemas/videoSchema';
import {
  CustomPropDefinition,
  StageScript,
  StageScriptSchema,
} from '../src/stage/stageScriptSchema';

export type RenderJobStatus =
  | 'draft'
  | 'queued'
  | 'bundling'
  | 'rendering'
  | 'completed'
  | 'failed';

export interface CupRecord {
  id: string;
  cupNumber: string;
  status: RenderJobStatus;
  progress: number;
  videoUrl?: string;
  seoVideoUrl?: string;
  seoFileName?: string;
  thumbUrl?: string;
  captionText: string;
  errorMessage?: string;
  props: VideoInputProps;
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
export const CUPS_DIR_PATH = path.resolve(PROJECT_ROOT, 'data/cups');
export const LEGACY_CUPS_JSON_PATH = path.resolve(
  PROJECT_ROOT,
  'data/cups.json'
);
const STAGE_SCRIPTS_PATH = path.resolve(PROJECT_ROOT, 'data/stage-scripts.json');
const CUSTOM_PROPS_PATH = path.resolve(PROJECT_ROOT, 'data/custom-props.json');

function readStageScriptsDiskMap(): Record<string, StageScript> {
  if (!fs.existsSync(STAGE_SCRIPTS_PATH)) return {};
  try {
    return JSON.parse(
      fs.readFileSync(STAGE_SCRIPTS_PATH, 'utf-8')
    ) as Record<string, StageScript>;
  } catch {
    return {};
  }
}

function writeCleanStageScriptsDiskMap(
  scriptsMap: Record<string, StageScript>
): void {
  const cleaned: Record<string, StageScript> = {};
  for (const [key, val] of Object.entries(scriptsMap)) {
    const { customPropsResolved: _omit, ...rest } = val;
    cleaned[key] = rest;
  }
  fs.mkdirSync(path.dirname(STAGE_SCRIPTS_PATH), { recursive: true });
  fs.writeFileSync(
    STAGE_SCRIPTS_PATH,
    JSON.stringify(cleaned, null, 2) + '\n',
    'utf-8'
  );
}

function readCustomPropsDiskMap(): Record<string, CustomPropDefinition> {
  if (!fs.existsSync(CUSTOM_PROPS_PATH)) return {};
  try {
    return JSON.parse(
      fs.readFileSync(CUSTOM_PROPS_PATH, 'utf-8')
    ) as Record<string, CustomPropDefinition>;
  } catch {
    return {};
  }
}

function sanitizeCupFileId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function getCupFilePath(id: string): string {
  return path.resolve(CUPS_DIR_PATH, `${sanitizeCupFileId(id)}.json`);
}

/**
 * Tách bỏ stageScript & customPropsResolved nhúng thừa trước khi ghi xuống đĩa,
 * đồng thời tự động giải cứu kịch bản nháp mới vào data/stage-scripts.json nếu chưa có.
 */
export function dehydrateCupForDisk(
  cup: CupRecord,
  scriptsMap: Record<string, StageScript>,
  onNewScriptRescued?: () => void
): CupRecord {
  const activeSceneId =
    cup.props.motion.sceneId || cup.props.motion.archetype || '';
  const inlineScript = cup.props.motion.stageScript;

  if (activeSceneId.startsWith('SCRIPT_') && inlineScript) {
    if (!scriptsMap[activeSceneId]) {
      const parsed = StageScriptSchema.safeParse(inlineScript);
      if (parsed.success) {
        const { customPropsResolved: _omit, ...cleanScript } = parsed.data;
        scriptsMap[activeSceneId] = {
          ...cleanScript,
          sceneId: activeSceneId,
        };
        onNewScriptRescued?.();
      }
    }
  }

  const canOmitInlineScript =
    !activeSceneId.startsWith('SCRIPT_') || Boolean(scriptsMap[activeSceneId]);

  return {
    ...cup,
    props: {
      ...cup.props,
      bgm: {
        audioMode: 'FOLEY_MASTER',
        foleyPivotStyle: cup.props.bgm?.foleyPivotStyle ?? 'AUTO',
      },
      motion: {
        ...cup.props.motion,
        stageScript: canOmitInlineScript ? undefined : inlineScript,
      },
    },
  };
}

/**
 * Ghép kịch bản sân khấu và đạo cụ customPropsResolved trên RAM để <Player> phản hồi 0.01s.
 */
export function hydrateCupInMemory(
  cup: CupRecord,
  scriptsMap: Record<string, StageScript>,
  customPropsMap: Record<string, CustomPropDefinition>
): CupRecord {
  const activeSceneId =
    cup.props.motion.sceneId || cup.props.motion.archetype || '';
  if (!activeSceneId.startsWith('SCRIPT_')) {
    return cup;
  }

  const baseScript = scriptsMap[activeSceneId] ?? cup.props.motion.stageScript;
  if (!baseScript) {
    return cup;
  }

  const parsed = StageScriptSchema.safeParse(baseScript);
  if (!parsed.success) {
    return cup;
  }

  return {
    ...cup,
    props: {
      ...cup.props,
      motion: {
        ...cup.props.motion,
        stageScript: {
          ...parsed.data,
          sceneId: activeSceneId,
          customPropsResolved: {
            ...customPropsMap,
            ...(parsed.data.customPropsResolved ?? {}),
          },
        },
      },
    },
  };
}

function listCupJsonFiles(): string[] {
  if (!fs.existsSync(CUPS_DIR_PATH)) return [];
  return fs
    .readdirSync(CUPS_DIR_PATH)
    .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
    .sort();
}

/**
 * Tự động di trú không mất dữ liệu từ tệp đơn data/cups.json cũ sang thư mục data/cups/quote-XXX.json (Hướng 2).
 */
export function ensureCupsDirectoryMigrated(): void {
  const existingFiles = listCupJsonFiles();
  if (existingFiles.length > 0 || !fs.existsSync(LEGACY_CUPS_JSON_PATH)) {
    return;
  }

  const legacyCups = JSON.parse(
    fs.readFileSync(LEGACY_CUPS_JSON_PATH, 'utf-8')
  ) as CupRecord[];
  const scriptsMap = readStageScriptsDiskMap();

  fs.mkdirSync(CUPS_DIR_PATH, { recursive: true });
  for (const cup of legacyCups) {
    const thin = dehydrateCupForDisk(cup, scriptsMap);
    fs.writeFileSync(
      getCupFilePath(thin.id),
      JSON.stringify(thin, null, 2) + '\n',
      'utf-8'
    );
  }

  // Đồng thời làm sạch toàn bộ customPropsResolved chép lặp trong stage-scripts.json
  if (Object.keys(scriptsMap).length > 0) {
    writeCleanStageScriptsDiskMap(scriptsMap);
  }

  fs.unlinkSync(LEGACY_CUPS_JSON_PATH);
}

function sortCups(cups: CupRecord[]): CupRecord[] {
  return [...cups].sort((a, b) => {
    const na = Number(a.cupNumber) || Number((a.id.match(/\d+/) || [0])[0]) || 0;
    const nb = Number(b.cupNumber) || Number((b.id.match(/\d+/) || [0])[0]) || 0;
    if (na !== nb) return na - nb;
    return a.id.localeCompare(b.id);
  });
}

export function loadThinCupsFromDisk(): CupRecord[] {
  ensureCupsDirectoryMigrated();
  const files = listCupJsonFiles();
  const cups: CupRecord[] = [];
  for (const file of files) {
    try {
      const full = path.resolve(CUPS_DIR_PATH, file);
      const parsed = JSON.parse(fs.readFileSync(full, 'utf-8')) as CupRecord;
      if (parsed && parsed.id) {
        cups.push(parsed);
      }
    } catch {
      // Bỏ qua tệp lỗi cú pháp đơn lẻ
    }
  }
  return sortCups(cups);
}

export function loadCups(): CupRecord[] {
  const thinCups = loadThinCupsFromDisk();
  const scriptsMap = readStageScriptsDiskMap();
  const customPropsMap = readCustomPropsDiskMap();
  return thinCups.map((cup) =>
    hydrateCupInMemory(cup, scriptsMap, customPropsMap)
  );
}

export function saveCups(cups: CupRecord[]): void {
  ensureCupsDirectoryMigrated();
  fs.mkdirSync(CUPS_DIR_PATH, { recursive: true });

  const scriptsMap = readStageScriptsDiskMap();
  let rescuedAnyScript = false;
  const keepFileNames = new Set<string>();

  for (const cup of sortCups(cups)) {
    const thin = dehydrateCupForDisk(cup, scriptsMap, () => {
      rescuedAnyScript = true;
    });
    const targetPath = getCupFilePath(thin.id);
    keepFileNames.add(path.basename(targetPath));
    const serialized = JSON.stringify(thin, null, 2) + '\n';
    const prev = fs.existsSync(targetPath)
      ? fs.readFileSync(targetPath, 'utf-8')
      : null;
    if (prev !== serialized) {
      fs.writeFileSync(targetPath, serialized, 'utf-8');
    }
  }

  if (rescuedAnyScript) {
    writeCleanStageScriptsDiskMap(scriptsMap);
  }

  for (const existing of listCupJsonFiles()) {
    if (!keepFileNames.has(existing)) {
      fs.unlinkSync(path.resolve(CUPS_DIR_PATH, existing));
    }
  }
}

export function updateCupInStore(
  cupId: string,
  updater: (cup: CupRecord) => CupRecord
): CupRecord | null {
  ensureCupsDirectoryMigrated();
  const targetPath = getCupFilePath(cupId);
  if (!fs.existsSync(targetPath)) return null;

  const scriptsMap = readStageScriptsDiskMap();
  const customPropsMap = readCustomPropsDiskMap();
  const currentThin = JSON.parse(
    fs.readFileSync(targetPath, 'utf-8')
  ) as CupRecord;
  const currentHydrated = hydrateCupInMemory(
    currentThin,
    scriptsMap,
    customPropsMap
  );

  const updated = updater(currentHydrated);
  let rescued = false;
  const nextThin = dehydrateCupForDisk(updated, scriptsMap, () => {
    rescued = true;
  });

  if (rescued) {
    writeCleanStageScriptsDiskMap(scriptsMap);
  }

  const serialized = JSON.stringify(nextThin, null, 2) + '\n';
  fs.writeFileSync(targetPath, serialized, 'utf-8');

  return hydrateCupInMemory(nextThin, scriptsMap, customPropsMap);
}
