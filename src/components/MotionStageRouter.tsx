import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoInputProps } from '../schemas/videoSchema';
import { TimelineSyncResult } from '../engine/timelineSync';
import { evaluateMotionState } from '../engine/motionPhysics';
import { ThemePalette, LAYOUT_TOKENS } from '../theme/palettes';
import { resolveSceneComponent } from '../scenes/vaultIndex';
import { resolveStageScript } from '../stage/stageScriptRegistry';
import { DeclarativeStagePlayer } from '../stage/DeclarativeStagePlayer';

export const MotionStageRouter: React.FC<{
  props: VideoInputProps;
  sync: TimelineSyncResult;
  palette: ThemePalette;
}> = ({ props, sync, palette }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const evaluatedState = evaluateMotionState(
    frame,
    fps,
    sync.pivotFrame,
    sync.allTextFinishedFrame,
    sync.durationInFrames,
    props.motion
  );

  const activeSceneId = props.motion.sceneId || props.motion.archetype;
  const resolvedScript = resolveStageScript(
    activeSceneId,
    props.motion.stageScript
  );
  const SceneComponent = resolveSceneComponent(activeSceneId);

  const tuning = props.stageTuning ?? {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    strokeScale: 1,
  };

  const tunedStrokeWidth = Number(
    (LAYOUT_TOKENS.strokeWidth * (tuning.strokeScale ?? 1)).toFixed(2)
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT_TOKENS.swissGrid.stageTop,
        left: LAYOUT_TOKENS.swissGrid.marginLeft,
        width: LAYOUT_TOKENS.swissGrid.stageWidth,
        height: LAYOUT_TOKENS.swissGrid.stageHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {resolvedScript ? (
        /* V7.0 Universal Stage Script Engine: Không chồng cameraScale cũ, chỉ áp dụng 4 thanh trượt stageTuning */
        <div
          style={{
            transform: `translate(${tuning.offsetX}px, ${tuning.offsetY}px) scale(${tuning.scale})`,
            transformOrigin: '50% 62.5%',
            willChange: 'transform',
          }}
        >
          <DeclarativeStagePlayer
            script={resolvedScript}
            state={evaluatedState}
            palette={palette}
            strokeWidth={tunedStrokeWidth}
            frame={frame}
            fps={fps}
            durationInFrames={sync.durationInFrames}
            timeline={sync}
          />
        </div>
      ) : (
        /* Tương thích ngược 100% với 12 cảnh gốc & cảnh CUSTOM_*.tsx */
        <div
          style={{
            transform: `scale(${evaluatedState.cameraScale}) translateY(${evaluatedState.cameraPanY}px)`,
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          <div
            style={{
              transform: `translate(${tuning.offsetX}px, ${tuning.offsetY}px) scale(${tuning.scale})`,
              transformOrigin: '50% 62.5%',
              willChange: 'transform',
            }}
          >
            <SceneComponent
              state={evaluatedState}
              palette={palette}
              strokeWidth={tunedStrokeWidth}
              frame={frame}
              fps={fps}
              durationInFrames={sync.durationInFrames}
              timeline={sync}
            />
          </div>
        </div>
      )}
    </div>
  );
};
