import { EvaluatedMotionState } from '../../engine/motionPhysics';
import { TimelineSyncResult, SegmentTiming } from '../../engine/timelineSync';
import { ThemePalette } from '../../theme/palettes';

export type ColorPalette = ThemePalette;
export type { EvaluatedMotionState, TimelineSyncResult, SegmentTiming, ThemePalette };

export interface ArchetypeComponentProps {
  state: EvaluatedMotionState;
  palette: ThemePalette;
  strokeWidth: number;
  frame: number;
  fps: number;
  durationInFrames: number;
  timeline: TimelineSyncResult;
}
