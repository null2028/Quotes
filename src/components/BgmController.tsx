import React, { useEffect, useMemo } from 'react';
import { Audio, getRemotionEnvironment, staticFile } from 'remotion';
import { VideoInputProps } from '../schemas/videoSchema';
import { TimelineSyncResult } from '../engine/timelineSync';
import {
  getFoleyMasterFileName,
  synthesizeCupFoleyAudio,
} from '../engine/foleyEngine';

export const BgmController: React.FC<{
  videoProps: VideoInputProps;
  sync: TimelineSyncResult;
}> = ({ videoProps, sync }) => {
  const { isRendering } = getRemotionEnvironment();

  const liveBrowserFoleyUrl = useMemo(() => {
    if (isRendering) return null;
    if (
      typeof window === 'undefined' ||
      typeof URL.createObjectURL !== 'function'
    ) {
      return null;
    }
    const { wavBytes } = synthesizeCupFoleyAudio(videoProps, sync);
    const blob = new Blob([wavBytes.buffer as ArrayBuffer], {
      type: 'audio/wav',
    });
    return URL.createObjectURL(blob);
  }, [
    isRendering,
    videoProps.id,
    videoProps.title,
    videoProps.pivotWord,
    videoProps.themeId,
    videoProps.motion?.pacingMode,
    videoProps.bgm?.foleyPivotStyle,
    videoProps.segments.join('\n'),
    sync.pivotFrame,
    sync.durationInFrames,
    sync.fps,
  ]);

  useEffect(() => {
    return () => {
      if (liveBrowserFoleyUrl) {
        URL.revokeObjectURL(liveBrowserFoleyUrl);
      }
    };
  }, [liveBrowserFoleyUrl]);

  const foleySrc = isRendering
    ? staticFile(`audio/${getFoleyMasterFileName(videoProps.id)}`)
    : liveBrowserFoleyUrl;

  if (!foleySrc) return null;
  return <Audio src={foleySrc} volume={1} />;
};
