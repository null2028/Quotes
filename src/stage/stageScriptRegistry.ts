import rawStageScripts from '../../data/stage-scripts.json';
import rawCustomProps from '../../data/custom-props.json';
import {
  CustomPropDefinition,
  StageScript,
  StageScriptSchema,
} from './stageScriptSchema';

const STAGE_SCRIPTS_MAP = rawStageScripts as unknown as Record<
  string,
  StageScript
>;
const CUSTOM_PROPS_MAP = rawCustomProps as unknown as Record<
  string,
  CustomPropDefinition
>;

export function resolveStageScript(
  sceneId: string | undefined,
  inlineScript?: StageScript
): StageScript | null {
  if (inlineScript) {
    return {
      ...inlineScript,
      customPropsResolved: {
        ...CUSTOM_PROPS_MAP,
        ...(inlineScript.customPropsResolved ?? {}),
      },
    };
  }

  if (!sceneId) return null;
  const fromVault = STAGE_SCRIPTS_MAP[sceneId];
  if (!fromVault) return null;

  const parsed = StageScriptSchema.safeParse(fromVault);
  if (!parsed.success) return null;

  return {
    ...parsed.data,
    customPropsResolved: {
      ...CUSTOM_PROPS_MAP,
      ...(parsed.data.customPropsResolved ?? {}),
    },
  };
}
