import React from 'react';
import { interpolate, Easing } from 'remotion';
import { EvaluatedMotionState } from '../engine/motionPhysics';
import {
  levitateWeightless,
  slowEmergence,
  recedeToMemory,
  computeCoupledWalk,
} from './SlowMotionVerbs';
import { OpenGroundStage, AnchoredTraveler } from './RelativeStage';

/**
 * 1. <SpotlightStage> (STEINBERG_OBJECT_SPOTLIGHT)
 * Khung Khe Bố Cục Tất Định Chống Chồng Lấn cho Đạo cụ Biểu tượng Tỷ lệ Tâm lý:
 * - act1CenterSlot: Tâm (270, 245), kích thước chuẩn 210px (ở Hồi I đứng giữa sân khấu; sang Hồi II tự động lùi êm về góc ký ức (132, 162) hoặc bay nhẹ/mờ đi để nhường 100% không gian trung tâm).
 * - act2HeroSlot: Tâm (270, 255), kích thước chuẩn 235px (nổi lên êm ái ở Hồi II & III).
 * - upperLeftMemorySlot: Tâm (132, 162), kích thước 110px (khoảng cách tâm > 165px so với act2HeroSlot, đảm bảo toán học 0% đè nét!).
 */
export const SpotlightStage: React.FC<{
  state: EvaluatedMotionState;
  ambientLayer?: React.ReactNode;
  act1CenterSlot?: React.ReactNode;
  act2HeroSlot?: React.ReactNode;
  upperLeftMemorySlot?: React.ReactNode;
  act1ExitMode?: 'recede_to_memory' | 'levitate' | 'fade';
  act1ExitProgress?: number;
  act2EnterProgress?: number;
}> = ({
  state,
  ambientLayer,
  act1CenterSlot,
  act2HeroSlot,
  upperLeftMemorySlot,
  act1ExitMode = 'recede_to_memory',
  act1ExitProgress,
  act2EnterProgress,
}) => {
  const exitP = Math.max(0, Math.min(1, act1ExitProgress ?? state.beat1StopClear));
  const enterP = Math.max(0, Math.min(1, act2EnterProgress ?? state.beat2SettleGlow));

  const heroEmergence = slowEmergence(enterP);
  const memoryRecede = recedeToMemory(exitP);
  const levitate = levitateWeightless(exitP, 0);

  // Nếu có truyền riêng upperLeftMemorySlot thì act1CenterSlot mờ sạch tại tâm để upperLeftMemorySlot hiện ở (132, 162)
  // Nếu không truyền riêng upperLeftMemorySlot và act1ExitMode === 'recede_to_memory', act1CenterSlot tự động lùi mượt từ (270, 245) về đúng khe (132, 162)
  const easedExit = Easing.inOut(Easing.cubic)(exitP);

  let act1Tx = 270;
  let act1Ty = 245;
  let act1Scale = state.drawProgress;
  let act1Rot = 0;
  let act1Opacity = state.drawProgress;

  if (upperLeftMemorySlot) {
    act1Opacity = state.drawProgress * interpolate(easedExit, [0, 0.65], [1, 0], { extrapolateRight: 'clamp' });
    act1Scale = state.drawProgress * (1 - easedExit * 0.15);
    act1Ty = 245 - easedExit * 18;
  } else if (act1ExitMode === 'levitate') {
    act1Tx = 270 + levitate.translateX;
    act1Ty = 245 + levitate.translateY;
    act1Rot = levitate.rotateDeg;
    act1Opacity = state.drawProgress * levitate.opacity;
  } else if (act1ExitMode === 'fade') {
    act1Opacity = state.drawProgress * interpolate(easedExit, [0, 0.72], [1, 0], { extrapolateRight: 'clamp' });
    act1Ty = 245 + memoryRecede.translateY;
    act1Scale = state.drawProgress * memoryRecede.scale;
  } else {
    // Dịch chuyển êm từ tâm (270, 245) về đúng Khe Ký Ức Góc Trên Trái (132, 162) để cách tâm act2HeroSlot > 165px
    act1Tx = interpolate(easedExit, [0, 1], [270, 132]);
    act1Ty = interpolate(easedExit, [0, 1], [245, 162]);
    act1Scale = state.drawProgress * interpolate(easedExit, [0, 1], [1, 0.52]);
    act1Opacity = state.drawProgress * interpolate(easedExit, [0, 1], [1, 0.34]);
  }

  const memOpacity = interpolate(easedExit, [0.15, 0.85], [0, 0.38], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <g>
      {ambientLayer && <g opacity={state.drawProgress}>{ambientLayer}</g>}

      {/* Khe Ký ức Góc Trên Trái (132, 162) - Cách tâm act2HeroSlot (270, 255) > 165px */}
      {upperLeftMemorySlot && memOpacity > 0.01 && (
        <g
          transform={`translate(132, 162) scale(${(0.85 + easedExit * 0.15).toFixed(3)})`}
          opacity={memOpacity}
        >
          {upperLeftMemorySlot}
        </g>
      )}

      {/* Khe Trung tâm Hồi I (270, 245) */}
      {act1CenterSlot && act1Opacity > 0.01 && (
        <g
          transform={`translate(${act1Tx.toFixed(1)}, ${act1Ty.toFixed(1)}) rotate(${act1Rot.toFixed(1)}) scale(${act1Scale.toFixed(3)})`}
          opacity={act1Opacity}
        >
          {act1CenterSlot}
        </g>
      )}

      {/* Khe Đạo cụ Anh hùng Hồi II & III (270, 255) */}
      {act2HeroSlot && heroEmergence.opacity > 0.01 && (
        <g
          transform={`translate(270, ${(255 + heroEmergence.translateY).toFixed(1)}) scale(${heroEmergence.scale.toFixed(3)})`}
          opacity={heroEmergence.opacity}
        >
          {act2HeroSlot}
        </g>
      )}
    </g>
  );
};

/**
 * 2. <YesButStage> (YES_BUT_DIPTYCH)
 * Khung Đối Chiếu Song Hành Trái (Thiên hạ) vs Phải (Mình):
 * - leftContrastSlot: Tâm (140, 260), kích thước tối đa 165px (mờ dịu từ 0.68 -> 0.34 ở Hồi III).
 * - rightStorySlot: Tâm (392, 260), kích thước tối đa 185px (cách vế trái 252px — không bao giờ chạm nhau!).
 * - rightAct1BurdenSlot (tùy chọn): Tâm (392, 255) cho gánh nặng Hồi I tự động bay bồng bềnh không trọng lực (levitateWeightless) khi sang Hồi II.
 * - rightUpperBadgeSlot (tùy chọn): Tâm (392, 136), cách tâm rightStorySlot 124px phía trên để hiển thị chuông/thông báo/ánh sáng mà không đè lên nhân vật/đạo cụ bên dưới.
 */
export const YesButStage: React.FC<{
  state: EvaluatedMotionState;
  ambientLayer?: React.ReactNode;
  leftContrastSlot: React.ReactNode;
  rightStorySlot: React.ReactNode;
  rightAct1BurdenSlot?: React.ReactNode;
  rightUpperBadgeSlot?: React.ReactNode;
  groundLineColor?: string;
}> = ({
  state,
  ambientLayer,
  leftContrastSlot,
  rightStorySlot,
  rightAct1BurdenSlot,
  rightUpperBadgeSlot,
  groundLineColor,
}) => {
  const leftOpacity =
    state.drawProgress *
    interpolate(state.beat2SettleGlow, [0, 1], [0.68, 0.34], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const burdenFloat = levitateWeightless(state.beat1StopClear, 0);
  const badgeEmergence = slowEmergence(state.beat2SettleGlow);

  return (
    <g>
      {ambientLayer && <g opacity={state.drawProgress}>{ambientLayer}</g>}

      {groundLineColor && (
        <g opacity={state.drawProgress * 0.45}>
          <line
            x1={56}
            y1={342}
            x2={224}
            y2={342}
            stroke={groundLineColor}
            strokeWidth={2.0}
            strokeLinecap="round"
          />
          <line
            x1={302}
            y1={342}
            x2={482}
            y2={342}
            stroke={groundLineColor}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Vế Trái: Thiên hạ / Ngoại cảnh đối sánh tại (140, 260) */}
      <g
        transform={`translate(140, 260) scale(${state.drawProgress.toFixed(3)})`}
        opacity={leftOpacity}
      >
        {leftContrastSlot}
      </g>

      {/* Vế Phải (Hồi I Gánh nặng bay lên nhẹ tênh nếu có) */}
      {rightAct1BurdenSlot && burdenFloat.opacity > 0.01 && (
        <g
          transform={`translate(${(392 + burdenFloat.translateX).toFixed(1)}, ${(252 + burdenFloat.translateY).toFixed(1)}) rotate(${burdenFloat.rotateDeg.toFixed(1)})`}
          opacity={state.drawProgress * burdenFloat.opacity}
        >
          {rightAct1BurdenSlot}
        </g>
      )}

      {/* Vế Phải: Câu chuyện chính tại (392, 260) — cách vế trái 252px */}
      <g
        transform={`translate(392, 260) scale(${state.drawProgress.toFixed(3)})`}
        opacity={state.drawProgress}
      >
        {rightStorySlot}
      </g>

      {/* Khe Điểm Nhấn Tầng Trên Vế Phải tại (392, 136) — cách tâm dưới 124px, 0% đè hình */}
      {rightUpperBadgeSlot && badgeEmergence.opacity > 0.01 && (
        <g
          transform={`translate(392, ${(136 + badgeEmergence.translateY).toFixed(1)}) scale(${badgeEmergence.scale.toFixed(3)})`}
          opacity={badgeEmergence.opacity}
        >
          {rightUpperBadgeSlot}
        </g>
      )}
    </g>
  );
};

/**
 * 3. <PullbackRevealStage> (MISDIRECTION_PULLBACK)
 * Hồi I zoom cận scale = 1.68 vào vùng đánh lừa (closeUpFocusX, closeUpFocusY);
 * Từ pivotFrame kéo lùi máy quay thật êm suốt 4.5s về scale = 0.88 lộ toàn cảnh fullWorldSlot.
 */
export const PullbackRevealStage: React.FC<{
  state: EvaluatedMotionState;
  closeUpFocusX?: number;
  closeUpFocusY?: number;
  ambientLayer?: React.ReactNode;
  closeUpFocalSlot?: React.ReactNode;
  fullWorldSlot: React.ReactNode;
}> = ({
  state,
  closeUpFocusX = 270,
  closeUpFocusY = 250,
  ambientLayer,
  closeUpFocalSlot,
  fullWorldSlot,
}) => {
  const pullbackP = Easing.inOut(Easing.cubic)(
    Math.max(0, Math.min(1, state.beat1StopClear * 0.65 + state.beat3LingeringWalk * 0.35))
  );
  const offsetX = (270 - closeUpFocusX) * (1 - pullbackP);
  const offsetY = (250 - closeUpFocusY) * (1 - pullbackP);
  const worldRevealOpacity = interpolate(pullbackP, [0.05, 0.75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <g transform={`translate(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`}>
      {ambientLayer && <g opacity={state.drawProgress}>{ambientLayer}</g>}

      {/* Toàn cảnh bất ngờ lộ diện khi lùi máy quay */}
      <g
        transform="translate(270, 255)"
        opacity={Math.max(0.18, worldRevealOpacity)}
      >
        {fullWorldSlot}
      </g>

      {/* Vật tiêu điểm cận cảnh ở Hồi I */}
      {closeUpFocalSlot && (
        <g
          transform={`translate(${closeUpFocusX}, ${closeUpFocusY})`}
          opacity={state.drawProgress}
        >
          {closeUpFocalSlot}
        </g>
      )}
    </g>
  );
};

/**
 * 4. <MetamorphosisStage> (FORCEVILLE_METAMORPHOSIS)
 * Khung biến hình đồng tâm (270, 250, size = 225px) chuyển tiếp mượt trong ~3.0s.
 */
export const MetamorphosisStage: React.FC<{
  state: EvaluatedMotionState;
  ambientLayer?: React.ReactNode;
  beforeSlot: React.ReactNode;
  afterSlot: React.ReactNode;
}> = ({ state, ambientLayer, beforeSlot, afterSlot }) => {
  const morphP = Math.max(0, Math.min(1, state.beat2SettleGlow));
  const beforeOpacity =
    state.drawProgress *
    interpolate(morphP, [0, 0.68], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const beforeScale = interpolate(morphP, [0, 0.68], [1, 0.86], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const afterRaw = interpolate(morphP, [0.22, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const afterEmergence = slowEmergence(afterRaw);

  return (
    <g>
      {ambientLayer && <g opacity={state.drawProgress}>{ambientLayer}</g>}

      {beforeOpacity > 0.01 && (
        <g
          transform={`translate(270, 250) scale(${(state.drawProgress * beforeScale).toFixed(3)})`}
          opacity={beforeOpacity}
        >
          {beforeSlot}
        </g>
      )}

      {afterEmergence.opacity > 0.01 && (
        <g
          transform={`translate(270, ${(250 + afterEmergence.translateY).toFixed(1)}) scale(${afterEmergence.scale.toFixed(3)})`}
          opacity={afterEmergence.opacity}
        >
          {afterSlot}
        </g>
      )}
    </g>
  );
};

/**
 * 5. <StillVignetteStage> (MCCLOUD_STILL_VIGNETTE)
 * Khung tĩnh vật/góc phố (270, 260, size = 210px) + khe thời tiết/lá rơi + khe điểm nhấn phía trên (270, 138).
 */
export const StillVignetteStage: React.FC<{
  state: EvaluatedMotionState;
  weatherLayer?: React.ReactNode;
  vignetteSlot: React.ReactNode;
  upperAccentSlot?: React.ReactNode;
}> = ({ state, weatherLayer, vignetteSlot, upperAccentSlot }) => {
  const accentEmergence = slowEmergence(state.beat2SettleGlow);

  return (
    <g>
      {weatherLayer && <g opacity={state.drawProgress}>{weatherLayer}</g>}

      <g
        transform={`translate(270, 260) scale(${state.drawProgress.toFixed(3)})`}
        opacity={state.drawProgress}
      >
        {vignetteSlot}
      </g>

      {upperAccentSlot && accentEmergence.opacity > 0.01 && (
        <g
          transform={`translate(270, ${(138 + accentEmergence.translateY).toFixed(1)}) scale(${accentEmergence.scale.toFixed(3)})`}
          opacity={accentEmergence.opacity}
        >
          {upperAccentSlot}
        </g>
      )}
    </g>
  );
};

/**
 * 6. <HorizonParableStage> (DE_WIT_HORIZON_PARABLE)
 * Mặt dốc/ngã rẽ + nhân vật dùng computeCoupledWalk (khóa cứng legStride = 0 khi |toX - fromX| < 12px) + khe vật cản lớn >= 80px.
 */
export const HorizonParableStage: React.FC<{
  state: EvaluatedMotionState;
  lineColor: string;
  travelerColor: string;
  groundY?: number;
  slopeDeg?: number;
  ambientLayer?: React.ReactNode;
  fromX?: number;
  toX?: number;
  sitAtAct2?: boolean;
  leanAct1Deg?: number;
  leanAct2Deg?: number;
  backSlot?: React.ReactNode;
  handSlot?: React.ReactNode;
  landmarkSlot?: React.ReactNode;
}> = ({
  state,
  lineColor,
  travelerColor,
  groundY = 352,
  slopeDeg = 0,
  ambientLayer,
  fromX = -88,
  toX = -18,
  sitAtAct2 = false,
  leanAct1Deg = 12,
  leanAct2Deg = -6,
  backSlot,
  handSlot,
  landmarkSlot,
}) => {
  const walk = computeCoupledWalk(
    fromX,
    toX,
    state.act1Progress,
    state.continuousPhase
  );
  const sitP = sitAtAct2 ? state.beat2SettleGlow : 0;
  const leanDeg = interpolate(
    state.beat2SettleGlow,
    [0, 1],
    [leanAct1Deg, leanAct2Deg],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <g>
      {ambientLayer && <g opacity={state.drawProgress}>{ambientLayer}</g>}

      <OpenGroundStage
        groundY={groundY}
        slopeDeg={slopeDeg}
        drawProgress={state.drawProgress}
        lineColor={lineColor}
      >
        {/* Khe đạo cụ/cột mốc lớn phía trước (cách nhân vật > 115px, không đè hình) */}
        {landmarkSlot && (
          <g transform="translate(102, -78)" opacity={state.drawProgress}>
            {landmarkSlot}
          </g>
        )}

        <AnchoredTraveler
          x={walk.currentX}
          facing="right"
          leanDeg={leanDeg}
          walkPhase={state.continuousPhase * 1.1}
          strideAmount={walk.isMoving ? Math.abs(walk.legStride) / 4.0 : 0}
          sitProgress={sitP}
          color={travelerColor}
          opacity={state.drawProgress}
          backSlot={backSlot}
          handSlot={handSlot}
        />
      </OpenGroundStage>
    </g>
  );
};
