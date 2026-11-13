import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';

/**
 * BOULDER_TO_BENCH (Nhánh Kẻ Lữ Hành Áo Choàng - V2.4 Instant Release Polish):
 * - Hạ ngưỡng chuyển tư thế xuống sitT < 0.18 (và dùng poseT tăng tốc ở đầu nhịp) để ngay khi dòng "Mai tính..."
 *   chớm hiện ra là nhân vật đã buông tay khỏi khối đá và hạ người ngồi tựa lưng thư thái.
 */
export const TensionReleaseArchetype: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const localSlopePath = 'M -230 0 L 230 0';
  const slopeEvo = evolvePath(state.drawProgress, localSlopePath);

  const pushProgress = state.act1Progress;
  const walkActivity = Math.max(0, 1 - state.beat1StopClear);
  const stepCycle = Math.sin(state.continuousPhase * 2.0);
  const bodyBob = walkActivity * Math.abs(stepCycle) * 2.2;
  const legSwing = walkActivity * stepCycle * 6.0;

  const boulderSize = 68;
  const boulderCenterX = -26 + pushProgress * 58;
  const boulderLeftX = boulderCenterX - boulderSize / 2;

  // V2.4: Bù trừ đường cong Easing.inOut(cubic) đầu kỳ (4*t^3) để ngay khi dòng 4 "Mai tính..." chớm hiện (0 -> 40%),
  // nhân vật đã buông tay hoàn toàn khỏi khối đá và hạ người ngồi tựa lưng cầm tách trà
  const sitT = state.beat2SettleGlow;
  const poseT = sitT <= 0 ? 0 : Math.min(1, Math.pow(sitT, 0.35) * 1.65);

  const charBaseX = boulderLeftX - 21 + poseT * 11;

  // Nội suy liên tục tọa độ Đầu (1 hình tròn duy nhất):
  const headCx = 4.5 * (1 - poseT) + 0.5 * poseT;
  const headCy = (-43.5 - bodyBob) * (1 - poseT) + -28.5 * poseT;

  // Nội suy liên tục tọa độ Đỉnh & Đáy Thân Áo Choàng (1 path duy nhất):
  const topY = (-34.5 - bodyBob) * (1 - poseT) + -20.5 * poseT;
  const botY = (-10.5 - bodyBob) * (1 - poseT) + -1.2 * poseT;
  const cloakPath = `M ${(headCx - 3.5).toFixed(2)} ${topY.toFixed(2)} C -7.5 ${(topY + 7).toFixed(2)} -9.5 ${(botY - 5).toFixed(2)} -7.5 ${botY.toFixed(2)} L 8.8 ${botY.toFixed(2)} C 10.2 ${(botY - 5).toFixed(2)} 8.8 ${(topY + 7).toFixed(2)} ${(headCx + 3.5).toFixed(2)} ${topY.toFixed(2)} Z`;

  // Đôi chân nội suy mượt từ bước đi sang duỗi ngồi trên mặt dốc y = 0
  const leg1X1 = -2.0 * (1 - poseT) + -5.5 * poseT;
  const leg1Y1 = (-11.5 - bodyBob) * (1 - poseT) + -4.5 * poseT;
  const leg1X2 = (-4.5 + legSwing) * (1 - poseT) + -22.0 * poseT;
  const leg1Y2 = 0 * (1 - poseT) + -1.5 * poseT;

  const leg2X1 = 3.0 * (1 - poseT) + -3.5 * poseT;
  const leg2Y1 = (-11.5 - bodyBob) * (1 - poseT) + -5.5 * poseT;
  const leg2X2 = (4.0 - legSwing) * (1 - poseT) + -16.5 * poseT;
  const leg2Y2 = 0 * (1 - poseT) + -1.5 * poseT;

  // Tay thu rời khỏi vách đá ngay lập tức từ đầu nhịp và nâng tách trà phía trước
  const armReachT = Math.min(1, poseT * 1.35);
  const armX1 = 6.0 * (1 - armReachT) + -3.0 * armReachT;
  const armY1 = (-30.0 - bodyBob) * (1 - armReachT) + -15.5 * armReachT;
  const armX2 = 20.0 * (1 - armReachT) + -13.5 * armReachT;
  const armY2 = (-34.0 - bodyBob * 0.5) * (1 - armReachT) + -13.5 * armReachT;

  // Tách trà Đỏ Gạch hiện êm ngay khi nhân vật hạ người xuống
  const cupOpacity = Math.max(0, Math.min(1, (poseT - 0.35) / 0.5));
  const cupX = -23;
  const cupY = -20.5;
  const steamCycle = (state.frame % 240) / 240;
  const steamFade = Math.sin(steamCycle * Math.PI) * cupOpacity;
  const steamDriftX = Math.sin(steamCycle * Math.PI * 2) * 3.8;
  const steamTopY = cupY - 9 - steamCycle * 36;

  const birdDriftX = state.beat3LingeringWalk * 85;
  const birdDriftY = state.beat3LingeringWalk * -18;
  const wingFlap = Math.sin(state.continuousPhase * 1.6) * 2.5;

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      {/* LỚP BẦU TRỜI: Mặt trời đỏ gạch bên trái & Đôi cánh chim bay chậm */}
      <g opacity={state.beat2SettleGlow}>
        <circle
          cx={145}
          cy={132 - state.beat3LingeringWalk * 16}
          r={25}
          fill={palette.accent}
          opacity={0.88}
        />
        <g opacity={state.beat3LingeringWalk}>
          <path
            d={`M ${225 + birdDriftX} ${118 + birdDriftY + wingFlap} Q ${233 + birdDriftX} ${109 + birdDriftY} ${241 + birdDriftX} ${118 + birdDriftY} Q ${249 + birdDriftX} ${109 + birdDriftY} ${257 + birdDriftX} ${118 + birdDriftY + wingFlap}`}
            fill="none"
            stroke={palette.inkPrimary}
            strokeWidth={2.1}
            strokeLinecap="round"
          />
          <path
            d={`M ${268 + birdDriftX * 0.88} ${102 + birdDriftY * 0.85 - wingFlap * 0.8} Q ${274 + birdDriftX * 0.88} ${95 + birdDriftY * 0.85} ${280 + birdDriftX * 0.88} ${102 + birdDriftY * 0.85} Q ${286 + birdDriftX * 0.88} ${95 + birdDriftY * 0.85} ${292 + birdDriftX * 0.88} ${102 + birdDriftY * 0.85 - wingFlap * 0.8}`}
            fill="none"
            stroke={palette.inkPrimary}
            strokeWidth={1.7}
            strokeLinecap="round"
            opacity={0.78}
          />
        </g>
      </g>

      {/* HỆ TỌA ĐỘ MẶT DỐC (y = 0 là mặt đất) */}
      <g
        transform="translate(275, 295) rotate(-15.5)"
        style={{ opacity: state.drawProgress }}
      >
        <path
          d={localSlopePath}
          fill="none"
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={slopeEvo.strokeDasharray}
          strokeDashoffset={slopeEvo.strokeDashoffset}
        />

        <rect
          x={boulderLeftX}
          y={-boulderSize}
          width={boulderSize}
          height={boulderSize}
          rx={8}
          fill={palette.background}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
        />

        <g transform={`translate(${charBaseX.toFixed(2)}, 0)`}>
          <line
            x1={leg1X1}
            y1={leg1Y1}
            x2={leg1X2}
            y2={leg1Y2}
            stroke={palette.inkPrimary}
            strokeWidth={strokeWidth - 0.2}
            strokeLinecap="round"
          />
          <line
            x1={leg2X1}
            y1={leg2Y1}
            x2={leg2X2}
            y2={leg2Y2}
            stroke={palette.inkPrimary}
            strokeWidth={strokeWidth - 0.2}
            strokeLinecap="round"
          />

          <path d={cloakPath} fill={palette.inkPrimary} />
          <circle cx={headCx} cy={headCy} r={7.2} fill={palette.inkPrimary} />

          <line
            x1={armX1}
            y1={armY1}
            x2={armX2}
            y2={armY2}
            stroke={palette.inkPrimary}
            strokeWidth={strokeWidth - 0.3}
            strokeLinecap="round"
          />

          {cupOpacity > 0.01 && (
            <g opacity={cupOpacity}>
              <rect
                x={cupX}
                y={cupY}
                width={9.5}
                height={11.5}
                rx={2}
                fill={palette.accent}
              />
              <path
                d={`M ${cupX + 4.8} ${cupY - 3} Q ${cupX + 1 + steamDriftX} ${(cupY + steamTopY) * 0.5} ${cupX + 5.5 - steamDriftX * 0.6} ${steamTopY}`}
                fill="none"
                stroke={palette.accent}
                strokeWidth={2.0}
                strokeLinecap="round"
                opacity={steamFade * 0.85}
              />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};
