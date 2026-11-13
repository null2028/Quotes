import React from 'react';
import { Composition, Folder } from 'remotion';
import { VideoInputProps, VideoInputSchema } from './schemas/videoSchema';
import { QuoteVideoComposition } from './compositions/QuoteVideoComposition';
import { computeTimelineSync } from './engine/timelineSync';
import { LAYOUT_TOKENS } from './theme/palettes';
import {
  SAMPLE_POEM_INPUT,
  SAMPLE_PROSE_INPUT,
  SAMPLE_ORBIT_INPUT,
  SAMPLE_RUPTURE_HEAL_INPUT,
  SAMPLE_BALANCE_SCALE_INPUT,
  SAMPLE_GAUGE_TRANSITION_INPUT,
} from './mocks/sampleInputs';

const dynamicMetadata = ({ props }: { props: VideoInputProps }) => {
  const sync = computeTimelineSync(props, LAYOUT_TOKENS.fps);
  return {
    durationInFrames: sync.durationInFrames,
    fps: LAYOUT_TOKENS.fps,
    width: LAYOUT_TOKENS.width,
    height: LAYOUT_TOKENS.height,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 2 Composition chính theo đúng đặc tả */}
      <Composition
        id="MinimalQuoteVideo"
        component={QuoteVideoComposition}
        fps={LAYOUT_TOKENS.fps}
        width={LAYOUT_TOKENS.width}
        height={LAYOUT_TOKENS.height}
        schema={VideoInputSchema}
        defaultProps={SAMPLE_POEM_INPUT}
        calculateMetadata={dynamicMetadata}
      />
      <Composition
        id="MinimalProsePreview"
        component={QuoteVideoComposition}
        fps={LAYOUT_TOKENS.fps}
        width={LAYOUT_TOKENS.width}
        height={LAYOUT_TOKENS.height}
        schema={VideoInputSchema}
        defaultProps={SAMPLE_PROSE_INPUT}
        calculateMetadata={dynamicMetadata}
      />

      {/* Bộ sưu tập đầy đủ 6 Archetypes để xem trực tiếp trên Remotion Studio */}
      <Folder name="Archetypes-Showcase">
        <Composition
          id="Archetype-1-TensionRelease"
          component={QuoteVideoComposition}
          fps={LAYOUT_TOKENS.fps}
          width={LAYOUT_TOKENS.width}
          height={LAYOUT_TOKENS.height}
          schema={VideoInputSchema}
          defaultProps={SAMPLE_POEM_INPUT}
          calculateMetadata={dynamicMetadata}
        />
        <Composition
          id="Archetype-2-OrbitDistance"
          component={QuoteVideoComposition}
          fps={LAYOUT_TOKENS.fps}
          width={LAYOUT_TOKENS.width}
          height={LAYOUT_TOKENS.height}
          schema={VideoInputSchema}
          defaultProps={SAMPLE_ORBIT_INPUT}
          calculateMetadata={dynamicMetadata}
        />
        <Composition
          id="Archetype-3-ChaosToOrder"
          component={QuoteVideoComposition}
          fps={LAYOUT_TOKENS.fps}
          width={LAYOUT_TOKENS.width}
          height={LAYOUT_TOKENS.height}
          schema={VideoInputSchema}
          defaultProps={SAMPLE_PROSE_INPUT}
          calculateMetadata={dynamicMetadata}
        />
        <Composition
          id="Archetype-4-LineRuptureHeal"
          component={QuoteVideoComposition}
          fps={LAYOUT_TOKENS.fps}
          width={LAYOUT_TOKENS.width}
          height={LAYOUT_TOKENS.height}
          schema={VideoInputSchema}
          defaultProps={SAMPLE_RUPTURE_HEAL_INPUT}
          calculateMetadata={dynamicMetadata}
        />
        <Composition
          id="Archetype-5-BalanceScale"
          component={QuoteVideoComposition}
          fps={LAYOUT_TOKENS.fps}
          width={LAYOUT_TOKENS.width}
          height={LAYOUT_TOKENS.height}
          schema={VideoInputSchema}
          defaultProps={SAMPLE_BALANCE_SCALE_INPUT}
          calculateMetadata={dynamicMetadata}
        />
        <Composition
          id="Archetype-6-GaugeTransition"
          component={QuoteVideoComposition}
          fps={LAYOUT_TOKENS.fps}
          width={LAYOUT_TOKENS.width}
          height={LAYOUT_TOKENS.height}
          schema={VideoInputSchema}
          defaultProps={SAMPLE_GAUGE_TRANSITION_INPUT}
          calculateMetadata={dynamicMetadata}
        />
      </Folder>
    </>
  );
};
