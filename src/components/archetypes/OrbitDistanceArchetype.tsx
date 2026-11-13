import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';

/**
 * Component Kẻ Lữ Hành Áo Choàng (CloakedTraveler):
 * - Đầu tròn nhỏ (r = 7.2) gắn liền với cổ áo.
 * - Thân áo khoác/áo mưa hình thang bo cong mềm mại (fill={color}).
 * - 2 chân ngắn bước đi ngược pha nhau chạm khít mặt đường (y = 0 trong tọa độ local của nhân vật).
 */
const CloakedTraveler: React.FC<{
  x: number;
  groundY: number;
  scale?: number;
  opacity?: number;
  color: string;
  strokeWidth: number;
  walkPhase: number;
  walkActivity: number;
}> = ({
  x,
  groundY,
  scale = 1,
  opacity = 1,
  color,
  strokeWidth,
  walkPhase,
  walkActivity,
}) => {
  const stepSin = Math.sin(walkPhase);
  const stepBob = walkActivity * Math.abs(stepSin) * 2.2;
  const legSwing = walkActivity * stepSin * 5.8;

  return (
    <g
      transform={`translate(${x}, ${groundY}) scale(${scale})`}
      style={{ opacity }}
    >
      <line
        x1={-2.5}
        y1={-12 - stepBob}
        x2={-2.5 + legSwing}
        y2={0}
        stroke={color}
        strokeWidth={strokeWidth - 0.3}
        strokeLinecap="round"
      />
      <line
        x1={2.5}
        y1={-12 - stepBob}
        x2={2.5 - legSwing}
        y2={0}
        stroke={color}
        strokeWidth={strokeWidth - 0.3}
        strokeLinecap="round"
      />

      <path
        d={`M -5.2 ${-35 - stepBob} C -9.5 ${-26 - stepBob} -10.8 ${-16 - stepBob} -8.8 ${-11 - stepBob} L 8.8 ${-11 - stepBob} C 10.8 ${-16 - stepBob} 9.5 ${-26 - stepBob} 5.2 ${-35 - stepBob} Z`}
        fill={color}
      />

      <circle cx={0} cy={-43.5 - stepBob} r={7.2} fill={color} />
    </g>
  );
};

/**
 * RAIN_UMBRELLA_PARTING (Nhánh Kẻ Lữ Hành Áo Choàng - V2.2 Polish):
 * - Nhấc tán ô cao thêm (translateY: 277 + beat2SettleGlow * 12) và góc nghiêng vừa phải (10 + beat2SettleGlow * 22)
 *   để khi hạ nghiêng ở cảnh cuối vẫn nằm thoáng phía trên đầu nhân vật, lộ rõ trọn vẹn dáng đầu và cổ áo choàng.
 */
export const OrbitDistanceArchetype: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const mainRoad = 'M 55 350 L 315 350';
  const branchRight = 'M 250 350 Q 345 345 485 275';
  const roadEvo = evolvePath(state.drawProgress, mainRoad);

  // Hồi I: Hai người cùng bước từ x = 110 đến ngã rẽ x = 222
  const walkX = 110 + state.act1Progress * 112;
  const p1WalkActivity = Math.max(0, 1 - state.beat1StopClear);
  const p1StepBob =
    p1WalkActivity * Math.abs(Math.sin(state.continuousPhase * 2.0)) * 2.2;

  // Nhịp 3 (beat3LingeringWalk - kéo dài 6.5s đến hết video):
  const t = state.beat3LingeringWalk;
  const oneMinusT = 1 - t;
  const bezierX =
    oneMinusT * oneMinusT * 250 + 2 * oneMinusT * t * 345 + t * t * 485;
  const bezierY =
    oneMinusT * oneMinusT * 350 + 2 * oneMinusT * t * 345 + t * t * 275;

  const p2X = state.act1Progress < 1 ? walkX + 28 : bezierX;
  const p2Y = state.act1Progress < 1 ? 350 : bezierY;
  const p2Scale = 1 - t * 0.24;
  const p2WalkActivity =
    state.act1Progress < 1
      ? p1WalkActivity
      : Math.sin(Math.min(1, t) * Math.PI) * 0.95;

  // Mưa rơi chậm (frame * 2.3) và ngớt dần trong 2.0s của beat1StopClear
  const rainOpacity =
    state.drawProgress * Math.max(0, 1 - state.beat1StopClear);

  // Tán ô Đỏ Gạch nhấc thoáng phía trên đầu nhân vật (đỉnh đầu tại y = 299.3, đáy ô tại y = 289)
  const umbrellaTilt = 10 + state.beat2SettleGlow * 22;
  const umbrellaY = 277 - p1StepBob + state.beat2SettleGlow * 12;

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      {/* Lớp Mưa Rơi Chậm Giàu Chất Thơ ở Hồi I */}
      {rainOpacity > 0.01 && (
        <g opacity={rainOpacity * 0.52}>
          {Array.from({ length: 15 }).map((_, i) => {
            const cycle = ((state.frame * 2.3 + i * 37) % 240) / 240;
            const rx = 85 + ((i * 31) % 360) - cycle * 38;
            const ry = 75 + cycle * 245;
            return (
              <line
                key={i}
                x1={rx}
                y1={ry}
                x2={rx - 9}
                y2={ry + 22}
                stroke={palette.inkSecondary}
                strokeWidth={1.7}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}

      {/* Vầng Nắng Đẹp hiện lên êm dịu trong 2.8s của beat2SettleGlow */}
      {state.beat2SettleGlow > 0.02 && (
        <g opacity={state.beat2SettleGlow}>
          <circle
            cx={435}
            cy={122 - state.beat3LingeringWalk * 10}
            r={28}
            fill="none"
            stroke={palette.accent}
            strokeWidth={2.4}
          />
          <circle
            cx={435}
            cy={122 - state.beat3LingeringWalk * 10}
            r={14}
            fill={palette.accent}
            opacity={0.28}
          />
        </g>
      )}

      {/* Con đường chính & Nhánh đường rẽ phải */}
      <path
        d={mainRoad}
        fill="none"
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={roadEvo.strokeDasharray}
        strokeDashoffset={roadEvo.strokeDashoffset}
      />
      <path
        d={branchRight}
        fill="none"
        stroke={palette.inkSecondary}
        strokeWidth={strokeWidth - 0.5}
        strokeLinecap="round"
        strokeDasharray="6 8"
        style={{ opacity: Math.max(0.28, state.beat2SettleGlow) }}
      />

      {/* Nhân vật 1: Kẻ Lữ Hành Áo Choàng ở lại cùng chiếc ô Đỏ Gạch */}
      <g opacity={state.drawProgress}>
        <CloakedTraveler
          x={walkX}
          groundY={350}
          color={palette.inkPrimary}
          strokeWidth={strokeWidth}
          walkPhase={state.continuousPhase * 2.0}
          walkActivity={p1WalkActivity}
        />

        {/* Chiếc Ô Đỏ Gạch (#D94E34) nằm thoáng phía trên đầu nhân vật */}
        <g
          transform={`translate(${walkX + 11}, ${umbrellaY}) rotate(${umbrellaTilt})`}
        >
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={40}
            stroke={palette.inkPrimary}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <path
            d="M -35 0 A 35 30 0 0 1 35 0 Z"
            fill={palette.accent}
            stroke={palette.accent}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* Nhân vật 2: Kẻ Lữ Hành Áo Choàng lặng lẽ bước dọc nhánh rẽ suốt 6.5s cuối */}
      <CloakedTraveler
        x={p2X}
        groundY={p2Y}
        scale={p2Scale}
        opacity={state.drawProgress * (1 - state.beat3LingeringWalk * 0.25)}
        color={palette.inkPrimary}
        strokeWidth={strokeWidth}
        walkPhase={state.continuousPhase * 2.0 + 1.2}
        walkActivity={p2WalkActivity}
      />
    </svg>
  );
};
