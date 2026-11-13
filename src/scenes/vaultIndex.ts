import React from 'react';
import { ArchetypeComponentProps } from '../components/archetypes/types';
import {
  BoulderToBenchScene,
  RainUmbrellaPartingScene,
  KnotToBirdScene,
  KeyChangedLockScene,
  MatchLightingCandleScene,
  PassingClockHandsScene,
} from './built-in/CoreSixScenes';
import { PaperBoatStreamScene } from './built-in/PaperBoatStreamScene';
import { KiteReleaseWindScene } from './built-in/KiteReleaseWindScene';
import { LadderMoonReflectionScene } from './built-in/LadderMoonReflectionScene';
import { StreetlampSoloBenchScene } from './built-in/StreetlampSoloBenchScene';
import { BrokenBranchSproutScene } from './built-in/BrokenBranchSproutScene';
import { HourglassTeaBrewScene } from './built-in/HourglassTeaBrewScene';
import { CustomThiepHongNguoiXuaScene } from './custom/CustomThiepHongNguoiXuaScene';
// [AUTO-CUSTOM-IMPORTS]

export const SCENE_VAULT_REGISTRY: Record<
  string,
  React.FC<ArchetypeComponentProps>
> = {
  // 12 Kịch bản chuẩn khởi điểm của Trà Nguội Workbench
  BOULDER_TO_BENCH: BoulderToBenchScene,
  RAIN_UMBRELLA_PARTING: RainUmbrellaPartingScene,
  KNOT_TO_BIRD: KnotToBirdScene,
  KEY_CHANGED_LOCK: KeyChangedLockScene,
  MATCH_LIGHTING_CANDLE: MatchLightingCandleScene,
  PASSING_CLOCK_HANDS: PassingClockHandsScene,
  PAPER_BOAT_STREAM: PaperBoatStreamScene,
  KITE_RELEASE_WIND: KiteReleaseWindScene,
  LADDER_MOON_REFLECTION: LadderMoonReflectionScene,
  STREETLAMP_SOLO_BENCH: StreetlampSoloBenchScene,
  BROKEN_BRANCH_SPROUT: BrokenBranchSproutScene,
  HOURGLASS_TEA_BREW: HourglassTeaBrewScene,

  // Alias tương thích ngược 100% với mã V1/V2.5
  TENSION_RELEASE: BoulderToBenchScene,
  ORBIT_DISTANCE: RainUmbrellaPartingScene,
  CHAOS_TO_ORDER: KnotToBirdScene,
  LINE_RUPTURE_HEAL: KeyChangedLockScene,
  BALANCE_SCALE: MatchLightingCandleScene,
  GAUGE_TRANSITION: PassingClockHandsScene,
  CUSTOM_BOULDER_TO_BENCH: CustomThiepHongNguoiXuaScene,
  CUSTOM_THIEP_HONG_NGUOI_XUA: CustomThiepHongNguoiXuaScene,
  // [AUTO-CUSTOM-ENTRIES]
};

export function resolveSceneComponent(
  sceneId?: string
): React.FC<ArchetypeComponentProps> {
  if (sceneId && SCENE_VAULT_REGISTRY[sceneId]) {
    return SCENE_VAULT_REGISTRY[sceneId];
  }
  return BoulderToBenchScene;
}
