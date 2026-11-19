import rawStageScripts from '../../data/stage-scripts.json';
import rawCustomProps from '../../data/custom-props.json';
import { isLegacyStageScript } from './legacySceneIds';
import {
  compileSemanticStageScript,
  isSemanticStageScript,
  SemanticStageScript,
} from './semanticStage';
import {
  CustomPropDefinition,
  StageScript,
  StageScriptSchema,
} from './stageScriptSchema';

const STAGE_SCRIPTS_MAP = rawStageScripts as unknown as Record<
  string,
  StageScript | SemanticStageScript
>;

// custom-props.json được khoá chỉ đọc dành riêng cho 51 kịch bản legacy
const CUSTOM_PROPS_MAP = rawCustomProps as unknown as Record<
  string,
  CustomPropDefinition
>;

export function resolveStageScript(
  sceneId: string | undefined,
  inlineScript?: StageScript | SemanticStageScript
): StageScript | null {
  if (inlineScript) {
    if (isSemanticStageScript(inlineScript)) {
      return compileSemanticStageScript(inlineScript);
    }
    const isLegacy = isLegacyStageScript(inlineScript, sceneId);
    return {
      ...inlineScript,
      legacy: isLegacy,
      customPropsResolved: isLegacy
        ? {
            ...CUSTOM_PROPS_MAP,
            ...(inlineScript.customPropsResolved ?? {}),
          }
        : inlineScript.customPropsResolved,
    };
  }

  if (!sceneId) return null;
  const fromVault = STAGE_SCRIPTS_MAP[sceneId];
  if (!fromVault) return null;

  if (isSemanticStageScript(fromVault)) {
    return compileSemanticStageScript(fromVault);
  }

  const parsed = StageScriptSchema.safeParse(fromVault);
  if (!parsed.success) return null;

  const isLegacy = isLegacyStageScript(parsed.data, sceneId);
  return {
    ...parsed.data,
    sceneId: parsed.data.sceneId || sceneId,
    legacy: isLegacy,
    customPropsResolved: isLegacy
      ? {
          ...CUSTOM_PROPS_MAP,
          ...(parsed.data.customPropsResolved ?? {}),
        }
      : parsed.data.customPropsResolved,
  };
}
