import { interpolate, Easing } from 'remotion';
import { VideoInputProps } from '../schemas/videoSchema';

export interface EvaluatedMotionState {
  frame: number;
  fps: number;
  pacingMode: 'CONTEMPLATIVE' | 'WRY_BATHOS';
  drawProgress: number;
  act1Progress: number;
  comedicFreeze: number;
  beat1StopClear: number;
  beat2SettleGlow: number;
  beat3LingeringWalk: number;
  seamlessLoopBlend: number;
  transitionProgress: number;
  accentReveal: number;
  act3Progress: number;
  continuousPhase: number;
  cameraScale: number;
  cameraPanY: number;
  microWave: number;
  currentIntensity: number;
  currentSpread: number;
  currentTiltDeg: number;
}

export function evaluateMotionState(
  frame: number,
  fps: number,
  pivotFrame: number,
  _allTextFinishedFrame: number,
  durationInFrames: number,
  motion?: VideoInputProps['motion']
): EvaluatedMotionState {
  const pacingMode = motion?.pacingMode ?? 'CONTEMPLATIVE';
  const stageMotif = motion?.stageMotif;
  const safeDuration = Math.max(2, durationInFrames);

  const loopWindowFrames = Math.min(
    Math.round(1.5 * fps),
    Math.floor(safeDuration * 0.22)
  );
  const loopStartFrame = Math.max(1, safeDuration - loopWindowFrames);
  const rawLoopU =
    frame >= loopStartFrame
      ? Math.max(
          0,
          Math.min(
            1,
            (frame - loopStartFrame) /
              Math.max(1, safeDuration - 1 - loopStartFrame)
          )
        )
      : 0;
  const seamlessLoopBlend = 0.5 - 0.5 * Math.cos(Math.PI * rawLoopU);

  const introSettle = interpolate(frame, [0, Math.round(0.35 * fps)], [0.94, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drawProgress =
    introSettle * (1 - seamlessLoopBlend) + 0.94 * seamlessLoopBlend;

  const act1Progress = interpolate(frame, [0, Math.max(1, pivotFrame)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const freezeStart = Math.max(0, pivotFrame - Math.round(0.35 * fps));
  const comedicFreeze =
    frame >= freezeStart && frame < pivotFrame
      ? interpolate(frame, [freezeStart, pivotFrame], [1, 0.25], {
          easing: Easing.inOut(Easing.quad),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;

  const rawBeat1 = interpolate(
    frame,
    [
      Math.max(0, pivotFrame - Math.round(0.2 * fps)),
      pivotFrame + Math.round(2.4 * fps),
    ],
    [0, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  const beat1StopClear = rawBeat1 * (1 - seamlessLoopBlend);

  const rawBeat2 = interpolate(
    frame,
    [pivotFrame, pivotFrame + Math.round(2.6 * fps)],
    [0, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  const beat2SettleGlow = rawBeat2 * (1 - seamlessLoopBlend);

  const beat3Start = pivotFrame + Math.round(0.3 * fps);
  const beat3End = Math.max(beat3Start + 60, loopStartFrame);
  const rawBeat3 = interpolate(frame, [beat3Start, beat3End], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const beat3LingeringWalk = rawBeat3 * (1 - seamlessLoopBlend);

  const continuousPhase =
    ((frame % safeDuration) / safeDuration) * Math.PI * 2 * 8;

  const safePivot = Math.max(1, Math.min(loopStartFrame - 1, pivotFrame));

  let baseCamScale: number;
  let baseCamPanY: number;
  let initCamScale: number;
  let initCamPanY: number;

  if (stageMotif === 'MISDIRECTION_PULLBACK') {
    initCamScale = 1.68;
    initCamPanY = 22;
    const pullbackEnd = Math.min(loopStartFrame, safePivot + Math.round(4.2 * fps));
    baseCamScale = interpolate(
      frame,
      [0, safePivot, pullbackEnd, loopStartFrame],
      [1.68, 1.66, 0.92, 0.9],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
    baseCamPanY = interpolate(
      frame,
      [0, safePivot, pullbackEnd],
      [22, 18, -4],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
  } else if (stageMotif === 'YES_BUT_DIPTYCH') {
    initCamScale = 1.18;
    initCamPanY = 4;
    baseCamScale = interpolate(
      frame,
      [
        0,
        safePivot,
        Math.min(loopStartFrame, safePivot + Math.round(2.4 * fps)),
        loopStartFrame,
      ],
      [1.18, 1.18, 1.24, 1.22],
      {
        easing: Easing.inOut(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
    baseCamPanY = interpolate(
      frame,
      [0, safePivot, loopStartFrame],
      [4, 2, -2],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  } else {
    initCamScale = 1.16;
    initCamPanY = 6;
    baseCamScale = interpolate(
      frame,
      [
        0,
        safePivot,
        Math.min(loopStartFrame, safePivot + Math.round(2.4 * fps)),
        loopStartFrame,
      ],
      [1.16, 1.17, 1.22, 1.2],
      {
        easing: Easing.inOut(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
    baseCamPanY = interpolate(
      frame,
      [0, safePivot, loopStartFrame],
      [6, 3, -2],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  }

  const cameraScale =
    baseCamScale * (1 - seamlessLoopBlend) + initCamScale * seamlessLoopBlend;
  const cameraPanY =
    baseCamPanY * (1 - seamlessLoopBlend) + initCamPanY * seamlessLoopBlend;

  const microWave = Math.sin(continuousPhase) * (0.45 + 0.55 * comedicFreeze);

  const stateA = motion?.stateA ?? { intensity: 0.85, spread: 0.2, tiltDeg: -18 };
  const stateB = motion?.stateB ?? { intensity: 0.05, spread: 0.75, tiltDeg: 0 };

  const clampedBeat2 = Math.max(0, Math.min(1, beat2SettleGlow));
  const baseIntensity = interpolate(clampedBeat2, [0, 1], [stateA.intensity, stateB.intensity]);
  const currentIntensity = Math.max(0, Math.min(1, baseIntensity + microWave * 0.06));

  const baseSpread = interpolate(clampedBeat2, [0, 1], [stateA.spread, stateB.spread]);
  const currentSpread = Math.max(0, Math.min(1, baseSpread + microWave * 0.03));

  const baseTiltDeg = interpolate(clampedBeat2, [0, 1], [stateA.tiltDeg, stateB.tiltDeg]);
  const currentTiltDeg = baseTiltDeg + microWave * 3.0;

  return {
    frame,
    fps,
    pacingMode,
    drawProgress,
    act1Progress,
    comedicFreeze,
    beat1StopClear,
    beat2SettleGlow,
    beat3LingeringWalk,
    seamlessLoopBlend,
    transitionProgress: beat1StopClear,
    accentReveal: beat2SettleGlow,
    act3Progress: beat3LingeringWalk,
    continuousPhase,
    cameraScale,
    cameraPanY,
    microWave,
    currentIntensity,
    currentSpread,
    currentTiltDeg,
  };
}
