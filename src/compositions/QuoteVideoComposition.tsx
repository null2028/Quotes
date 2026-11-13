import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { VideoInputProps } from '../schemas/videoSchema';
import { THEME_PALETTES } from '../theme/palettes';
import { computeTimelineSync } from '../engine/timelineSync';
import { MinimalistBackground } from '../components/MinimalistBackground';
import { MotionStageRouter } from '../components/MotionStageRouter';
import { AdaptiveTypography } from '../components/AdaptiveTypography';
import { BgmController } from '../components/BgmController';

export const QuoteVideoComposition: React.FC<VideoInputProps> = (props) => {
  const { fps } = useVideoConfig();
  const palette = THEME_PALETTES[props.themeId] ?? THEME_PALETTES.MINIMAL_LIGHT;
  const sync = computeTimelineSync(props, fps);

  return (
    <AbsoluteFill>
      {/* 1. Lớp nền Swiss Editorial Grid, Vi hạt bụi trà khép kín & Triện Đỏ Chu Sa */}
      <MinimalistBackground
        palette={palette}
        brandText={props.brandText}
        title={props.title}
        jobId={props.id}
      />

      {/* 2. Sân khấu Animation nửa trên (Zoom Pivot +4.8% & Seamless Loop 13.5s-15.0s) */}
      <MotionStageRouter props={props} sync={sync} palette={palette} />

      {/* 3. Sân khấu Chữ tự thích ứng (Khóa OCR 0.0s & Seamless Loop 13.8s-15.0s) */}
      <AdaptiveTypography props={props} sync={sync} palette={palette} />

      {/* 4. Âm thanh Gốc Foley Stereo -14.0 LUFS khớp từng frame Pivot */}
      <BgmController videoProps={props} sync={sync} />
    </AbsoluteFill>
  );
};
