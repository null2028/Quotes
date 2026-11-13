import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { z } from 'zod';
import {
  FoleyPivotStyleEnum,
  StageTuningSchema,
  VideoInputProps,
  VideoInputSchema,
} from '../src/schemas/videoSchema';
import {
  ensureValidPivotSubstring,
  validateAndNormalizeVideoProps,
} from '../src/automation/validator';
import {
  buildTraNguoiCaption,
  CupRecord,
  loadCups,
  saveCups,
} from './renderQueueService';
import {
  CustomPropDefinition,
  formatStageScriptZodError,
  StageScript,
  StageScriptSchema,
} from '../src/stage/stageScriptSchema';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const VAULT_META_PATH = path.resolve(PROJECT_ROOT, 'data/vault-meta.json');
const STAGE_SCRIPTS_PATH = path.resolve(PROJECT_ROOT, 'data/stage-scripts.json');
const CUSTOM_PROPS_PATH = path.resolve(PROJECT_ROOT, 'data/custom-props.json');
const VAULT_INDEX_PATH = path.resolve(PROJECT_ROOT, 'src/scenes/vaultIndex.ts');
const CUSTOM_SCENES_DIR = path.resolve(PROJECT_ROOT, 'src/scenes/custom');

export interface VaultSceneMeta {
  sceneId: string;
  name: string;
  category: 'TRAVELER' | 'OBJECT';
  origin: 'built-in' | 'custom' | 'script';
  act1: string;
  act2AtPivot: string;
  act3Afterimage: string;
  redProp: string;
  tags: string[];
  usageCount: number;
}

export function loadStageScriptsMap(): Record<string, StageScript> {
  if (!fs.existsSync(STAGE_SCRIPTS_PATH)) return {};
  try {
    return JSON.parse(
      fs.readFileSync(STAGE_SCRIPTS_PATH, 'utf-8')
    ) as Record<string, StageScript>;
  } catch {
    return {};
  }
}

export function saveStageScriptsMap(map: Record<string, StageScript>): void {
  const cleaned: Record<string, StageScript> = {};
  for (const [key, val] of Object.entries(map)) {
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

export function loadCustomPropsMap(): Record<string, CustomPropDefinition> {
  if (!fs.existsSync(CUSTOM_PROPS_PATH)) return {};
  try {
    return JSON.parse(
      fs.readFileSync(CUSTOM_PROPS_PATH, 'utf-8')
    ) as Record<string, CustomPropDefinition>;
  } catch {
    return {};
  }
}

export function saveCustomPropsMap(
  map: Record<string, CustomPropDefinition>
): void {
  fs.mkdirSync(path.dirname(CUSTOM_PROPS_PATH), { recursive: true });
  fs.writeFileSync(
    CUSTOM_PROPS_PATH,
    JSON.stringify(map, null, 2) + '\n',
    'utf-8'
  );
}

export function loadVaultMeta(): VaultSceneMeta[] {
  const baseScenes: VaultSceneMeta[] = fs.existsSync(VAULT_META_PATH)
    ? (JSON.parse(
        fs.readFileSync(VAULT_META_PATH, 'utf-8')
      ) as VaultSceneMeta[])
    : [];

  const scriptsMap = loadStageScriptsMap();
  const existingIds = new Set(baseScenes.map((s) => s.sceneId));
  const scriptMetas: VaultSceneMeta[] = [];

  for (const [key, script] of Object.entries(scriptsMap)) {
    const sid = script.sceneId || key;
    if (existingIds.has(sid)) continue;
    scriptMetas.push({
      sceneId: sid,
      name: script.name || sid,
      category: 'TRAVELER',
      origin: 'script',
      act1:
        script.act1 ||
        script.description ||
        'Kịch bản sân khấu khai báo JSON (V7.0 StageScript)',
      act2AtPivot:
        script.act2AtPivot ||
        'Chuyển hóa mượt tại điểm bẻ lái pivotWord',
      act3Afterimage:
        script.act3Afterimage ||
        'Dư âm tĩnh lặng đến cuối video',
      redProp: script.redProp || 'Đạo cụ điểm nhấn Đỏ Gạch (#CE472E)',
      tags: script.tags || ['script', 'v7'],
      usageCount: 1,
    });
  }

  return [...scriptMetas, ...baseScenes];
}

export function saveVaultMeta(scenes: VaultSceneMeta[]): void {
  fs.mkdirSync(path.dirname(VAULT_META_PATH), { recursive: true });
  fs.writeFileSync(VAULT_META_PATH, JSON.stringify(scenes, null, 2), 'utf-8');
}

export function incrementSceneUsage(sceneId: string): void {
  const scenes = loadVaultMeta();
  const target = scenes.find((s) => s.sceneId === sceneId);
  if (target) {
    target.usageCount = (target.usageCount || 0) + 1;
    saveVaultMeta(scenes);
  }
}

export function normalizeCustomSceneId(rawId: string): string {
  const clean = rawId
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/^CUSTOM_+/, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/, '');
  return `CUSTOM_${clean || 'SCENE'}`;
}

export function toSceneComponentName(sceneId: string): string {
  const words = sceneId
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  const base = words.join('');
  return base.endsWith('Scene') ? base : `${base}Scene`;
}

function extractExportedComponentName(tsxCode: string): string | null {
  const match = tsxCode.match(
    /export\s+const\s+([A-Za-z0-9_]+)\s*(?::|\s*=)/
  );
  return match ? match[1] : null;
}

function runTscValidation(): { ok: boolean; errorOutput: string } {
  try {
    const tscBin = path.resolve(PROJECT_ROOT, 'node_modules/.bin/tsc');
    execFileSync(tscBin, ['--noEmit'], {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return { ok: true, errorOutput: '' };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    const rawOut = `${e.stdout || ''}\n${e.stderr || ''}`.trim();
    return {
      ok: false,
      errorOutput: rawOut || e.message || 'Lỗi biên dịch TypeScript',
    };
  }
}

function registerCustomSceneInVaultIndex(
  sceneId: string,
  componentName: string
): void {
  let code = fs.readFileSync(VAULT_INDEX_PATH, 'utf-8');
  const importStmt = `import { ${componentName} } from './custom/${componentName}';`;
  const entryStmt = `  ${sceneId}: ${componentName},`;

  const lines = code.split('\n').filter((line) => {
    if (line.includes(`from './custom/${componentName}'`)) return false;
    if (new RegExp(`^\\s*${sceneId}\\s*:`).test(line)) return false;
    return true;
  });
  code = lines.join('\n');

  code = code.replace(
    '// [AUTO-CUSTOM-IMPORTS]',
    `${importStmt}\n// [AUTO-CUSTOM-IMPORTS]`
  );
  code = code.replace(
    '  // [AUTO-CUSTOM-ENTRIES]',
    `${entryStmt}\n  // [AUTO-CUSTOM-ENTRIES]`
  );

  fs.writeFileSync(VAULT_INDEX_PATH, code, 'utf-8');
}

function removeCustomSceneFromVaultIndex(
  sceneId: string,
  componentName: string
): void {
  if (!fs.existsSync(VAULT_INDEX_PATH)) return;
  const code = fs.readFileSync(VAULT_INDEX_PATH, 'utf-8');
  const filtered = code
    .split('\n')
    .filter((line) => {
      if (line.includes(`from './custom/${componentName}'`)) return false;
      if (new RegExp(`^\\s*${sceneId}\\s*:`).test(line)) return false;
      return true;
    })
    .join('\n');
  fs.writeFileSync(VAULT_INDEX_PATH, filtered, 'utf-8');
}

export function getSceneCode(sceneId: string): {
  sceneId: string;
  componentName: string;
  isCustom: boolean;
  tsxCode: string;
} {
  const allMeta = loadVaultMeta();
  const meta = allMeta.find((s) => s.sceneId === sceneId);
  const isCustom = meta ? meta.origin === 'custom' : sceneId.startsWith('CUSTOM_');

  if (isCustom) {
    const vaultIndexContent = fs.existsSync(VAULT_INDEX_PATH)
      ? fs.readFileSync(VAULT_INDEX_PATH, 'utf-8')
      : '';
    const matchEntry = vaultIndexContent.match(
      new RegExp(`\\b${sceneId}\\s*:\\s*([A-Za-z0-9_]+)`)
    );
    const componentName = matchEntry
      ? matchEntry[1]
      : toSceneComponentName(sceneId);
    const customPath = path.resolve(CUSTOM_SCENES_DIR, `${componentName}.tsx`);
    if (fs.existsSync(customPath)) {
      return {
        sceneId,
        componentName,
        isCustom: true,
        tsxCode: fs.readFileSync(customPath, 'utf-8'),
      };
    }
  }

  const starterId = sceneId.startsWith('CUSTOM_')
    ? sceneId
    : `CUSTOM_${sceneId}`;
  const starterComponent = toSceneComponentName(starterId);

  const template = `import React from 'react';
import { interpolate } from 'remotion';
import { ArchetypeComponentProps } from '../../components/archetypes/types';
import { CloakedTraveler } from '../../kit/CloakedTraveler';
import { FlatHorizon } from '../../kit/WorldStage';
import { RisingSteam, CelestialBody, WindBreeze } from '../../kit/Atmosphere';
import {
  computeCoupledWalk,
  slowEmergence,
} from '../../kit/SlowMotionVerbs';

export const ${starterComponent}: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const walk = computeCoupledWalk(140, 225, state.act1Progress, state.continuousPhase);
  const sitT = state.beat2SettleGlow;
  const propEmergence = slowEmergence(sitT);

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      <WindBreeze frame={state.frame} opacity={0.35 * state.drawProgress} color={palette.inkSecondary} />
      <CelestialBody
        type="crescent"
        x={410}
        y={125 - state.beat3LingeringWalk * 12}
        radius={20}
        color={palette.inkSecondary}
        opacity={state.drawProgress}
      />

      <FlatHorizon
        y={352}
        startX={65}
        endX={475}
        drawProgress={state.drawProgress}
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
      >
        <CloakedTraveler
          x={walk.currentX}
          y={0}
          scale={1.2}
          facing="right"
          pose={walk.isMoving ? 'walk' : 'stand'}
          leanDeg={interpolate(sitT, [0, 1], [10, -8])}
          sitProgress={sitT}
          walkPhase={state.continuousPhase * 1.8}
          walkActivity={walk.isMoving ? 1 : 0}
          color={palette.inkPrimary}
          strokeWidth={strokeWidth}
          opacity={state.drawProgress}
        />

        {propEmergence.opacity > 0.02 && (
          <g
            transform={\`translate(\${(walk.currentX + 34).toFixed(1)}, \${propEmergence.translateY.toFixed(1)})\`}
            opacity={propEmergence.opacity}
          >
            <path
              d="M -12 -14 C -11 -2, 11 -2, 12 -14 Z"
              fill={palette.accent}
              stroke={palette.accent}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
            <RisingSteam
              x={0}
              y={-16}
              frame={state.frame}
              color={palette.accent}
              opacity={propEmergence.opacity}
              height={34}
            />
          </g>
        )}
      </FlatHorizon>
    </svg>
  );
};
`;

  return {
    sceneId: starterId,
    componentName: starterComponent,
    isCustom: false,
    tsxCode: template,
  };
}

export function upsertCustomSceneCode(params: {
  sceneId: string;
  name?: string;
  description?: string;
  act1?: string;
  act2AtPivot?: string;
  act3Afterimage?: string;
  redProp?: string;
  tsxCode: string;
  cupId?: string;
  onInvalidateBundle?: () => void;
}): { scene: VaultSceneMeta; scenes: VaultSceneMeta[]; cups: CupRecord[] } {
  const safeSceneId = normalizeCustomSceneId(params.sceneId);
  const rawCode = params.tsxCode.trim();
  if (!rawCode) {
    throw new Error('Nội dung mã nguồn tsxCode không được để trống.');
  }

  const detectedName = extractExportedComponentName(rawCode);
  const componentName = detectedName || toSceneComponentName(safeSceneId);

  fs.mkdirSync(CUSTOM_SCENES_DIR, { recursive: true });
  const filePath = path.resolve(CUSTOM_SCENES_DIR, `${componentName}.tsx`);

  const existedBefore = fs.existsSync(filePath);
  const prevFileContent = existedBefore
    ? fs.readFileSync(filePath, 'utf-8')
    : null;
  const prevVaultIndexContent = fs.readFileSync(VAULT_INDEX_PATH, 'utf-8');

  if (!detectedName) {
    throw new Error(
      `Không tìm thấy khai báo "export const <ComponentName>" trong tsxCode. Vui lòng xuất component dạng: export const ${componentName}: React.FC<ArchetypeComponentProps> = ...`
    );
  }

  fs.writeFileSync(filePath, rawCode + '\n', 'utf-8');
  registerCustomSceneInVaultIndex(safeSceneId, componentName);

  const tscRes = runTscValidation();
  if (!tscRes.ok) {
    if (existedBefore && prevFileContent !== null) {
      fs.writeFileSync(filePath, prevFileContent, 'utf-8');
    } else if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    fs.writeFileSync(VAULT_INDEX_PATH, prevVaultIndexContent, 'utf-8');
    throw new Error(`Lỗi biên dịch TypeScript (đã rollback an toàn):\n${tscRes.errorOutput}`);
  }

  params.onInvalidateBundle?.();

  const scenes = loadVaultMeta();
  const existingIdx = scenes.findIndex((s) => s.sceneId === safeSceneId);
  const desc =
    params.description?.trim() ||
    'Cảnh ký họa tùy chỉnh được nạp trực tiếp qua Trà Nguội Workbench.';

  const sceneMeta: VaultSceneMeta = {
    sceneId: safeSceneId,
    name:
      params.name?.trim() ||
      (existingIdx !== -1 ? scenes[existingIdx].name : safeSceneId),
    category: 'TRAVELER',
    origin: 'custom',
    act1:
      params.act1?.trim() ||
      (existingIdx !== -1 ? scenes[existingIdx].act1 : desc),
    act2AtPivot:
      params.act2AtPivot?.trim() ||
      (existingIdx !== -1
        ? scenes[existingIdx].act2AtPivot
        : 'Chuyển hóa nhịp chậm tại từ khóa pivotWord.'),
    act3Afterimage:
      params.act3Afterimage?.trim() ||
      (existingIdx !== -1
        ? scenes[existingIdx].act3Afterimage
        : 'Dư âm tĩnh lặng đến giây 15.'),
    redProp:
      params.redProp?.trim() ||
      (existingIdx !== -1
        ? scenes[existingIdx].redProp
        : 'Điểm nhấn Đỏ Gạch (#CE472E)'),
    tags: ['custom', 'workbench'],
    usageCount: existingIdx !== -1 ? scenes[existingIdx].usageCount : 1,
  };

  if (existingIdx !== -1) {
    scenes[existingIdx] = sceneMeta;
  } else {
    scenes.unshift(sceneMeta);
  }
  saveVaultMeta(scenes);

  const cups = loadCups();
  if (params.cupId) {
    const cupIdx = cups.findIndex((c) => c.id === params.cupId);
    if (cupIdx !== -1) {
      cups[cupIdx].props.motion = {
        ...cups[cupIdx].props.motion,
        sceneId: safeSceneId,
        archetype: safeSceneId,
      };
      saveCups(cups);
    }
  }

  return { scene: sceneMeta, scenes, cups: loadCups() };
}

export function deleteCustomScene(
  sceneId: string,
  onInvalidateBundle?: () => void
): { scenes: VaultSceneMeta[]; cups: CupRecord[] } {
  const scenes = loadVaultMeta();
  const target = scenes.find((s) => s.sceneId === sceneId);

  if (!sceneId.startsWith('CUSTOM_') && target?.origin === 'built-in') {
    throw new Error('Không được phép xóa 12 cảnh chuẩn gốc của hệ thống.');
  }

  const vaultIndexContent = fs.existsSync(VAULT_INDEX_PATH)
    ? fs.readFileSync(VAULT_INDEX_PATH, 'utf-8')
    : '';
  const matchEntry = vaultIndexContent.match(
    new RegExp(`\\b${sceneId}\\s*:\\s*([A-Za-z0-9_]+)`)
  );
  const componentName = matchEntry
    ? matchEntry[1]
    : toSceneComponentName(sceneId);

  removeCustomSceneFromVaultIndex(sceneId, componentName);

  const filePath = path.resolve(CUSTOM_SCENES_DIR, `${componentName}.tsx`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const nextScenes = scenes.filter((s) => s.sceneId !== sceneId);
  saveVaultMeta(nextScenes);

  const cups = loadCups();
  let cupsChanged = false;
  for (const cup of cups) {
    const activeId = cup.props.motion.sceneId || cup.props.motion.archetype;
    if (activeId === sceneId) {
      cup.props.motion.sceneId = 'BOULDER_TO_BENCH';
      cup.props.motion.archetype = 'BOULDER_TO_BENCH';
      cup.props.motion.stageScript = undefined;
      cupsChanged = true;
    }
  }
  if (cupsChanged) {
    saveCups(cups);
  }

  onInvalidateBundle?.();
  return { scenes: nextScenes, cups: loadCups() };
}

const CupBundleImportSchema = z.object({
  cupId: z.string().optional(),
  title: z.string().optional(),
  textFormat: z.enum(['POEM', 'PROSE']).default('POEM'),
  segments: z.array(z.string().min(1)).min(1).max(6),
  pivotWord: z.string().optional(),
  themeVariant: z.string().optional(),
  themeId: z.string().optional(),
  targetDurationSeconds: z.number().min(8).max(30).default(15),
  stageTuning: StageTuningSchema.optional(),
  bgm: z
    .object({
      foleyPivotStyle: FoleyPivotStyleEnum.optional().default('AUTO'),
    })
    .optional(),
  sceneId: z.string().optional(),
  scene: z
    .object({
      sceneId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      act1: z.string().optional(),
      act2AtPivot: z.string().optional(),
      act3Afterimage: z.string().optional(),
      redProp: z.string().optional(),
      tsxCode: z.string().optional(),
    })
    .optional(),
});

function resolveThemeId(
  rawTheme?: string
): 'MINIMAL_LIGHT' | 'MINIMAL_DARK' | 'WARM_NOIR' | 'SLATE_CALM' {
  const key = (rawTheme || '').trim().toUpperCase();
  if (key === 'MINIMAL_DARK' || key === 'DARK') return 'MINIMAL_DARK';
  if (key === 'WARM_NOIR' || key === 'WARM_SEPIA' || key === 'SEPIA') {
    return 'WARM_NOIR';
  }
  if (key === 'SLATE_CALM' || key === 'COOL_NIGHT' || key === 'NIGHT') {
    return 'SLATE_CALM';
  }
  return 'MINIMAL_LIGHT';
}

export function importDirectorBundle(
  rawPayload: unknown,
  onInvalidateBundle?: () => void
): {
  cup: CupRecord;
  cups: CupRecord[];
  scenes: VaultSceneMeta[];
} {
  const parsed = CupBundleImportSchema.parse(rawPayload);

  let targetSceneId =
    parsed.scene?.sceneId || parsed.sceneId || 'BOULDER_TO_BENCH';

  if (parsed.scene?.tsxCode && parsed.scene.tsxCode.trim()) {
    const upserted = upsertCustomSceneCode({
      sceneId: parsed.scene.sceneId,
      name: parsed.scene.name || parsed.title || 'Cảnh Mới',
      description: parsed.scene.description,
      act1: parsed.scene.act1 || parsed.scene.description,
      act2AtPivot: parsed.scene.act2AtPivot,
      act3Afterimage: parsed.scene.act3Afterimage,
      redProp: parsed.scene.redProp,
      tsxCode: parsed.scene.tsxCode,
      onInvalidateBundle,
    });
    targetSceneId = upserted.scene.sceneId;
  }

  const cups = loadCups();
  const existingIdx = parsed.cupId
    ? cups.findIndex((c) => c.id === parsed.cupId)
    : -1;

  const nextNum =
    existingIdx !== -1
      ? Number(cups[existingIdx].cupNumber) || existingIdx + 1
      : cups.length + 1;
  const cupNumber = String(nextNum).padStart(2, '0');
  const cupId = parsed.cupId?.trim() || `quote-${String(nextNum).padStart(3, '0')}`;

  const validPivot = ensureValidPivotSubstring(
    parsed.segments,
    parsed.pivotWord || ''
  );
  const resolvedTheme = resolveThemeId(parsed.themeVariant || parsed.themeId);

  const prevCup = existingIdx !== -1 ? cups[existingIdx] : null;

  const fullProps: VideoInputProps = validateAndNormalizeVideoProps(
    VideoInputSchema.parse({
      id: cupId,
      textFormat: parsed.textFormat,
      title: parsed.title ?? prevCup?.props.title ?? 'Tĩnh',
      segments: parsed.segments,
      pivotWord: validPivot,
      highlightStyle: 'BOTH',
      targetDurationSeconds: parsed.targetDurationSeconds ?? 15,
      typingSpeedMsPerChar: 55,
      holdAfterFinishSeconds: 5.5,
      themeId: resolvedTheme,
      stageTuning: parsed.stageTuning ??
        prevCup?.props.stageTuning ?? {
          offsetX: 0,
          offsetY: 0,
          scale: 1,
          strokeScale: 1,
        },
      motion: {
        sceneId: targetSceneId,
        archetype: targetSceneId,
        pacingMode: 'CONTEMPLATIVE',
        stateA: { intensity: 0.85, spread: 0.25, tiltDeg: -14 },
        stateB: { intensity: 0.05, spread: 0.65, tiltDeg: 0 },
      },
      bgm: {
        audioMode: 'FOLEY_MASTER',
        foleyPivotStyle:
          parsed.bgm?.foleyPivotStyle ??
          prevCup?.props.bgm?.foleyPivotStyle ??
          'AUTO',
      },
      brandText: 'TRÀ NGUỘI',
    })
  );

  const cupRecord: CupRecord = {
    id: cupId,
    cupNumber,
    status: 'draft',
    progress: 0,
    videoUrl: prevCup?.videoUrl,
    thumbUrl: prevCup?.thumbUrl,
    captionText: buildTraNguoiCaption(cupId, fullProps),
    props: fullProps,
  };

  if (existingIdx !== -1) {
    cups[existingIdx] = cupRecord;
  } else {
    cups.push(cupRecord);
  }
  saveCups(cups);

  const hydratedAll = loadCups();
  const hydratedCup = hydratedAll.find((c) => c.id === cupId) ?? cupRecord;

  return {
    cup: hydratedCup,
    cups: hydratedAll,
    scenes: loadVaultMeta(),
  };
}

export function normalizeScriptSceneId(rawId?: string, rawName?: string): string {
  const base = (rawId && rawId.trim()) || (rawName && rawName.trim()) || `SCENE_${Date.now().toString().slice(-4)}`;
  const clean = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/^SCRIPT_+/, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/, '');
  return `SCRIPT_${clean || 'SCENE'}`;
}

export function getStageScriptById(sceneId: string): {
  sceneId: string;
  name: string;
  isScript: boolean;
  script: StageScript;
} {
  const scriptsMap = loadStageScriptsMap();
  const customPropsMap = loadCustomPropsMap();
  const existing = scriptsMap[sceneId];

  if (existing) {
    const parsed = StageScriptSchema.parse(existing);
    return {
      sceneId,
      name: parsed.name || sceneId,
      isScript: true,
      script: {
        ...parsed,
        sceneId,
        customPropsResolved: {
          ...customPropsMap,
          ...(parsed.customPropsResolved ?? {}),
        },
      },
    };
  }

  const starterId = sceneId.startsWith('SCRIPT_')
    ? sceneId
    : normalizeScriptSceneId(sceneId);
  const starterScript: StageScript = StageScriptSchema.parse({
    sceneId: starterId,
    name: 'Kịch Bản Sân Khấu Mới',
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
        scale: 1.2,
        facing: 'right',
        pose: 'walk',
        colorRole: 'ink',
      },
    ],
    props: [
      {
        id: 'bench1',
        type: 'bench',
        x: 'center_right',
        y: 0,
        colorRole: 'ink',
      },
    ],
    timeline: [
      {
        at: 'start',
        duration: 2.8,
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
  });

  return {
    sceneId: starterId,
    name: starterScript.name || starterId,
    isScript: false,
    script: starterScript,
  };
}

export function upsertStageScript(params: {
  sceneId?: string;
  name?: string;
  description?: string;
  rawScript: unknown;
  cupId?: string;
}): {
  scene: VaultSceneMeta;
  script: StageScript;
  scenes: VaultSceneMeta[];
  cups: CupRecord[];
} {
  let candidateObj: unknown = params.rawScript;
  if (typeof candidateObj === 'string') {
    try {
      candidateObj = JSON.parse(candidateObj);
    } catch (e: unknown) {
      throw new Error(
        `Lỗi cú pháp JSON: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  const parsedResult = StageScriptSchema.safeParse(candidateObj);
  if (!parsedResult.success) {
    throw new Error(
      `Lỗi cấu trúc StageScript (Zod Validation):\n${formatStageScriptZodError(
        parsedResult.error
      )}`
    );
  }

  const scriptData = parsedResult.data;
  const finalSceneId = normalizeScriptSceneId(
    params.sceneId || scriptData.sceneId,
    params.name || scriptData.name
  );
  const finalName =
    params.name?.trim() || scriptData.name?.trim() || finalSceneId;

  const customPropsMap = loadCustomPropsMap();
  let customPropsUpdated = false;

  const updatedProps = (scriptData.props ?? []).map((prop) => {
    const saveAsName = prop.saveAs?.trim();
    if (saveAsName && prop.shapes && prop.shapes.length > 0) {
      customPropsMap[saveAsName] = {
        anchorType: prop.anchorType ?? 'ground',
        shapes: prop.shapes,
        altShapes: prop.altShapes,
      };
      customPropsUpdated = true;
      return {
        ...prop,
        type: saveAsName,
      };
    }
    return prop;
  });

  if (customPropsUpdated) {
    saveCustomPropsMap(customPropsMap);
  }

  const usedCustomProps: Record<string, CustomPropDefinition> = {
    ...(scriptData.customPropsResolved ?? {}),
  };
  for (const prop of updatedProps) {
    const pType = prop.type ?? 'custom';
    if (customPropsMap[pType]) {
      usedCustomProps[pType] = customPropsMap[pType];
    }
  }

  const finalScriptForDisk: StageScript = {
    ...scriptData,
    sceneId: finalSceneId,
    name: finalName,
    description: params.description?.trim() || scriptData.description,
    props: updatedProps,
    customPropsResolved: undefined,
  };

  const finalScriptHydrated: StageScript = {
    ...finalScriptForDisk,
    customPropsResolved:
      Object.keys(usedCustomProps).length > 0 ? usedCustomProps : undefined,
  };

  const scriptsMap = loadStageScriptsMap();
  scriptsMap[finalSceneId] = finalScriptForDisk;
  saveStageScriptsMap(scriptsMap);

  const baseScenes: VaultSceneMeta[] = fs.existsSync(VAULT_META_PATH)
    ? (JSON.parse(
        fs.readFileSync(VAULT_META_PATH, 'utf-8')
      ) as VaultSceneMeta[])
    : [];
  const existingIdx = baseScenes.findIndex((s) => s.sceneId === finalSceneId);
  const sceneMeta: VaultSceneMeta = {
    sceneId: finalSceneId,
    name: finalName,
    category: 'TRAVELER',
    origin: 'script',
    act1:
      finalScriptForDisk.act1 ||
      finalScriptForDisk.description ||
      'Kịch bản sân khấu khai báo JSON (V7.0 StageScript)',
    act2AtPivot:
      finalScriptForDisk.act2AtPivot ||
      'Chuyển hóa mượt tại điểm bẻ lái pivotWord',
    act3Afterimage:
      finalScriptForDisk.act3Afterimage ||
      'Dư âm tĩnh lặng đến cuối video',
    redProp:
      finalScriptForDisk.redProp || 'Đạo cụ điểm nhấn Đỏ Gạch (#CE472E)',
    tags: finalScriptForDisk.tags || ['script', 'v7'],
    usageCount: existingIdx !== -1 ? baseScenes[existingIdx].usageCount : 1,
  };

  if (existingIdx !== -1) {
    baseScenes[existingIdx] = sceneMeta;
  } else {
    baseScenes.unshift(sceneMeta);
  }
  saveVaultMeta(baseScenes);

  const cups = loadCups();
  let cupsChanged = false;
  for (const cup of cups) {
    const activeId = cup.props.motion.sceneId || cup.props.motion.archetype;
    if (cup.id === params.cupId || activeId === finalSceneId) {
      cup.props.motion = {
        ...cup.props.motion,
        sceneId: finalSceneId,
        archetype: finalSceneId,
        stageScript: undefined,
      };
      cupsChanged = true;
    }
  }
  if (cupsChanged) {
    saveCups(cups);
  }

  return {
    scene: sceneMeta,
    script: finalScriptHydrated,
    scenes: loadVaultMeta(),
    cups: loadCups(),
  };
}

export function deleteStageScript(sceneId: string): {
  scenes: VaultSceneMeta[];
  cups: CupRecord[];
} {
  const scriptsMap = loadStageScriptsMap();
  if (scriptsMap[sceneId]) {
    delete scriptsMap[sceneId];
    saveStageScriptsMap(scriptsMap);
  }

  if (fs.existsSync(VAULT_META_PATH)) {
    const baseScenes = (
      JSON.parse(fs.readFileSync(VAULT_META_PATH, 'utf-8')) as VaultSceneMeta[]
    ).filter((s) => s.sceneId !== sceneId);
    saveVaultMeta(baseScenes);
  }

  const cups = loadCups();
  let cupsChanged = false;
  for (const cup of cups) {
    const activeId = cup.props.motion.sceneId || cup.props.motion.archetype;
    if (activeId === sceneId) {
      cup.props.motion = {
        ...cup.props.motion,
        sceneId: 'BOULDER_TO_BENCH',
        archetype: 'BOULDER_TO_BENCH',
        stageScript: undefined,
      };
      cupsChanged = true;
    }
  }
  if (cupsChanged) {
    saveCups(cups);
  }

  return {
    scenes: loadVaultMeta(),
    cups: loadCups(),
  };
}
