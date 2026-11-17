import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { VideoInputProps } from '../schemas/videoSchema';
import { THEME_PALETTES } from '../theme/palettes';
import { computeTimelineSync } from '../engine/timelineSync';
import {
  resolveLayoutGeometry,
  resolveVisualDNA,
} from '../engine/visualDnaResolver';
import { resolveStageScript } from '../stage/stageScriptRegistry';
import { MinimalistBackground } from '../components/MinimalistBackground';
import { MotionStageRouter } from '../components/MotionStageRouter';
import { AdaptiveTypography } from '../components/AdaptiveTypography';
import { BgmController } from '../components/BgmController';

export const QuoteVideoComposition: React.FC<VideoInputProps> = (props) => {
  const { fps } = useVideoConfig();
  const palette = THEME_PALETTES[props.themeId] ?? THEME_PALETTES.MINIMAL_LIGHT;
  const sync = computeTimelineSync(props, fps);
  const activeSceneId = props.motion.sceneId || props.motion.archetype;
  const resolvedScript = resolveStageScript(
    activeSceneId,
    props.motion.stageScript
  );
  const visualDNA = resolveVisualDNA(props, resolvedScript);
  const layoutGeo = resolveLayoutGeometry(
    visualDNA.layout,
    visualDNA.brushOrientation
  );

  return (
    <AbsoluteFill>
      {/* 1. Lớp nền Swiss Editorial Grid, Ánh sáng Gobo, Vi hạt bụi trà & Header tự tan mực */}
      <MinimalistBackground
        palette={palette}
        brandText={props.brandText}
        title={props.title}
        jobId={props.id}
        sync={sync}
        visualDNA={visualDNA}
      />

      {/* 2. Sân khấu Animation theo Archetype Bố cục & 4 Cơ chế Điểm Lật Pivot */}
      <MotionStageRouter
        props={props}
        sync={sync}
        palette={palette}
        visualDNA={visualDNA}
        layoutGeo={layoutGeo}
      />

      {/* 3. Sân khấu Chữ tự thích ứng (Cọ dọc / Cọ ngang & Vùng chữ biến thiên theo visualDNA) */}
      <AdaptiveTypography
        props={props}
        sync={sync}
        palette={palette}
        visualDNA={visualDNA}
        layoutGeo={layoutGeo}
      />

      {/* 4. Âm thanh Gốc Foley Stereo -14.0 LUFS khớp từng frame Pivot */}
      <BgmController videoProps={props} sync={sync} />
    </AbsoluteFill>
  );
};
