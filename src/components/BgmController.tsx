import React, { useEffect, useRef, useState } from 'react';
import { Audio, getRemotionEnvironment, staticFile } from 'remotion';
import { VideoInputProps } from '../schemas/videoSchema';
import { TimelineSyncResult } from '../engine/timelineSync';
import {
  getAudioMasterFileName,
  synthesizeCupAudioByMode,
} from '../engine/foleyEngine';

const TYPING_AUDIO_DEBOUNCE_MS = 380;

export const BgmController: React.FC<{
  videoProps: VideoInputProps;
  sync: TimelineSyncResult;
}> = ({ videoProps, sync }) => {
  const { isRendering } = getRemotionEnvironment();
  const audioMode = videoProps.bgm?.audioMode ?? 'PIVOT_ACCENT';
  const foleyStyle = videoProps.bgm?.foleyPivotStyle ?? 'AUTO';
  const segmentsKey = videoProps.segments.join('\n');
  const cupKey = `${videoProps.id}::${audioMode}::${foleyStyle}`;

  const [liveBrowserAudioUrl, setLiveBrowserAudioUrl] = useState<string | null>(
    null
  );
  const activeUrlRef = useRef<string | null>(null);
  const prevCupKeyRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (
      isRendering ||
      audioMode === 'TIKTOK_SILENT' ||
      typeof window === 'undefined' ||
      typeof URL.createObjectURL !== 'function'
    ) {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }
      setLiveBrowserAudioUrl(null);
      prevCupKeyRef.current = cupKey;
      return;
    }

    const cupOrModeChanged = prevCupKeyRef.current !== cupKey;
    prevCupKeyRef.current = cupKey;
    const delayMs = cupOrModeChanged ? 0 : TYPING_AUDIO_DEBOUNCE_MS;

    const timer = window.setTimeout(() => {
      const { wavBytes } = synthesizeCupAudioByMode(videoProps, sync);
      const blob = new Blob([wavBytes.buffer as ArrayBuffer], {
        type: 'audio/wav',
      });
      const nextUrl = URL.createObjectURL(blob);
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
      activeUrlRef.current = nextUrl;
      setLiveBrowserAudioUrl(nextUrl);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
    // Chỉ phụ thuộc các trường ảnh hưởng PCM thực tế; không chạy lại khi đổi Visual DNA / slider đồ họa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isRendering,
    cupKey,
    audioMode,
    foleyStyle,
    videoProps.title,
    videoProps.pivotWord,
    videoProps.themeId,
    videoProps.motion?.pacingMode,
    segmentsKey,
    sync.pivotFrame,
    sync.durationInFrames,
    sync.fps,
  ]);

  const audioSrc = isRendering
    ? staticFile(`audio/${getAudioMasterFileName(videoProps.id, audioMode)}`)
    : liveBrowserAudioUrl;

  if (!audioSrc) return null;
  return <Audio src={audioSrc} volume={1} />;
};
