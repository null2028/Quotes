import { FoleyPivotStyle, VideoInputProps } from '../schemas/videoSchema';
import { TimelineSyncResult, stripInlineMarkdown } from './timelineSync';

export const FOLEY_SAMPLE_RATE = 48000;
export const TARGET_INTEGRATED_LUFS = -14.0;
export const TRUE_PEAK_CEILING_LINEAR = 0.841395;

export function getFoleyMasterFileName(cupId: string): string {
  const safeId = cupId.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase();
  return `foley-master-${safeId}.wav`;
}

function createSeededRng(seedText: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

function applyBiquadMono(input: Float32Array, c: BiquadCoeffs): Float32Array {
  const out = new Float32Array(input.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i];
    const y0 = c.b0 * x0 + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return out;
}

function normalizeStereoToTargetLufs(
  left: Float32Array,
  right: Float32Array,
  targetLufs = TARGET_INTEGRATED_LUFS
): void {
  const preFilter48k: BiquadCoeffs = {
    b0: 1.53512485958697,
    b1: -2.69169618940638,
    b2: 1.19839281085285,
    a1: -1.69065929318241,
    a2: 0.73248077421585,
  };
  const rlbHighPass48k: BiquadCoeffs = {
    b0: 1.0,
    b1: -2.0,
    b2: 1.0,
    a1: -1.99004745483398,
    a2: 0.99007225036621,
  };

  const kL = applyBiquadMono(applyBiquadMono(left, preFilter48k), rlbHighPass48k);
  const kR = applyBiquadMono(applyBiquadMono(right, preFilter48k), rlbHighPass48k);

  const blockSamples = Math.round(0.4 * FOLEY_SAMPLE_RATE);
  const hopSamples = Math.round(0.1 * FOLEY_SAMPLE_RATE);
  const n = left.length;
  const blockEnergies: number[] = [];

  for (let start = 0; start + blockSamples <= n; start += hopSamples) {
    let sumSqL = 0;
    let sumSqR = 0;
    const end = start + blockSamples;
    for (let i = start; i < end; i++) {
      sumSqL += kL[i] * kL[i];
      sumSqR += kR[i] * kR[i];
    }
    blockEnergies.push((sumSqL + sumSqR) / blockSamples);
  }

  if (blockEnergies.length === 0) {
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      sumSq += kL[i] * kL[i] + kR[i] * kR[i];
    }
    blockEnergies.push(sumSq / Math.max(1, n));
  }

  const absGateEnergy = Math.pow(10, (-70 + 0.691) / 10);
  const afterAbs = blockEnergies.filter((z) => z > absGateEnergy);
  const workingSet = afterAbs.length > 0 ? afterAbs : blockEnergies;

  const meanAbs =
    workingSet.reduce((acc, v) => acc + v, 0) / Math.max(1, workingSet.length);
  const ungatedLufs = -0.691 + 10 * Math.log10(Math.max(1e-12, meanAbs));

  const relGateEnergy = Math.pow(10, (ungatedLufs - 10 + 0.691) / 10);
  const afterRel = workingSet.filter((z) => z > relGateEnergy);
  const finalSet = afterRel.length > 0 ? afterRel : workingSet;

  const meanFinal =
    finalSet.reduce((acc, v) => acc + v, 0) / Math.max(1, finalSet.length);
  const measuredBeforeLufs = -0.691 + 10 * Math.log10(Math.max(1e-12, meanFinal));

  const clampedGainDb = Math.max(-24, Math.min(32, targetLufs - measuredBeforeLufs));
  const linearGain = Math.pow(10, clampedGainDb / 20);

  const kneeStart = TRUE_PEAK_CEILING_LINEAR * 0.82;
  const kneeSpan = TRUE_PEAK_CEILING_LINEAR - kneeStart;

  const softLimit = (x: number): number => {
    const ax = Math.abs(x);
    if (ax <= kneeStart) return x;
    const sign = x < 0 ? -1 : 1;
    const compressed =
      kneeStart +
      kneeSpan * Math.tanh((ax - kneeStart) / Math.max(1e-6, kneeSpan));
    return sign * Math.min(TRUE_PEAK_CEILING_LINEAR, compressed);
  };

  for (let i = 0; i < n; i++) {
    left[i] = softLimit(left[i] * linearGain);
    right[i] = softLimit(right[i] * linearGain);
  }
}

export function resolveEffectivePivotStyle(
  props: VideoInputProps
): Exclude<FoleyPivotStyle, 'AUTO'> {
  const chosen = props.bgm?.foleyPivotStyle ?? 'AUTO';
  if (chosen !== 'AUTO') return chosen;
  if (props.motion?.pacingMode === 'WRY_BATHOS') {
    return 'WOOD_SEAL';
  }
  if (props.themeId === 'MINIMAL_DARK' || props.themeId === 'SLATE_CALM') {
    return 'WIND_CHIME';
  }
  return 'TEA_CUP';
}

function addStereoSample(
  left: Float32Array,
  right: Float32Array,
  idx: number,
  monoVal: number,
  pan: number
) {
  if (idx < 0 || idx >= left.length) return;
  const clampedPan = Math.max(-1, Math.min(1, pan));
  const angle = ((clampedPan + 1) * Math.PI) / 4;
  left[idx] += monoVal * Math.cos(angle);
  right[idx] += monoVal * Math.sin(angle);
}

export function synthesizeCupFoleyAudio(
  props: VideoInputProps,
  sync: TimelineSyncResult
): {
  wavBytes: Uint8Array;
  pivotStyle: Exclude<FoleyPivotStyle, 'AUTO'>;
  durationSeconds: number;
} {
  const sr = FOLEY_SAMPLE_RATE;
  const durationSeconds = Math.max(4, sync.durationInFrames / sync.fps);
  const totalSamples = Math.round(durationSeconds * sr);

  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);
  const rng = createSeededRng(`${props.id}-${props.title || ''}-${props.pivotWord}`);
  const pivotStyle = resolveEffectivePivotStyle(props);
  const pivotSample = Math.min(
    totalSamples - Math.round(0.5 * sr),
    Math.max(Math.round(0.8 * sr), Math.round((sync.pivotFrame / sync.fps) * sr))
  );

  let pinkL0 = 0;
  let pinkL1 = 0;
  let pinkL2 = 0;
  let pinkR0 = 0;
  let pinkR1 = 0;
  let pinkR2 = 0;
  let lpAirL = 0;
  let lpAirR = 0;

  for (let i = 0; i < totalSamples; i++) {
    const tSec = i / sr;
    const loopPhase = (i / totalSamples) * Math.PI * 2;
    const postPivotBoost =
      i >= pivotSample
        ? 1 +
          0.42 *
            Math.sin(Math.min(1, (i - pivotSample) / (3.2 * sr)) * Math.PI)
        : 0.85;
    const breezeEnv = (0.036 + 0.014 * Math.sin(loopPhase * 2)) * postPivotBoost;

    const wL = rng() * 2 - 1;
    const wR = rng() * 2 - 1;
    pinkL0 = 0.997 * pinkL0 + wL * 0.029;
    pinkL1 = 0.985 * pinkL1 + wL * 0.032;
    pinkL2 = 0.95 * pinkL2 + wL * 0.048;
    const rawPinkL = pinkL0 + pinkL1 + pinkL2 + wL * 0.018;
    lpAirL += 0.085 * (rawPinkL - lpAirL);

    pinkR0 = 0.997 * pinkR0 + wR * 0.029;
    pinkR1 = 0.985 * pinkR1 + wR * 0.032;
    pinkR2 = 0.95 * pinkR2 + wR * 0.048;
    const rawPinkR = pinkR0 + pinkR1 + pinkR2 + wR * 0.018;
    lpAirR += 0.085 * (rawPinkR - lpAirR);

    const roomWarmth =
      (Math.sin(2 * Math.PI * 196 * tSec) * 0.55 +
        Math.sin(2 * Math.PI * 293.66 * tSec) * 0.35) *
      0.016 *
      (0.82 + 0.18 * Math.cos(loopPhase));

    left[i] += lpAirL * breezeEnv + roomWarmth;
    right[i] += lpAirR * breezeEnv + roomWarmth * 0.96;
  }

  // 0.00s – 0.35s: Nhịp thở mở màn nhẹ + rót trà ấm trước khi Dòng 1 cất lời tại 0.35s
  const paperLen = Math.min(totalSamples, Math.round(0.32 * sr));
  let bpState1 = 0;
  let bpState2 = 0;
  for (let n = 0; n < paperLen; n++) {
    const u = n / paperLen;
    const env = Math.sin(u * Math.PI) * Math.pow(1 - u, 0.75) * 0.14;
    const white = (rng() * 2 - 1) * (0.65 + 0.35 * Math.sin(u * 38));
    bpState1 += 0.26 * (white - bpState1);
    bpState2 += 0.08 * (bpState1 - bpState2);
    const paperGrain = bpState1 - bpState2;
    addStereoSample(
      left,
      right,
      Math.round(0.03 * sr) + n,
      paperGrain * env,
      -0.16 + u * 0.32
    );
  }

  const dropletCount = 19;
  for (let d = 0; d < dropletCount; d++) {
    const prog = d / (dropletCount - 1);
    const jitter = (rng() - 0.5) * 0.026;
    const startSec = 0.18 + prog * 0.96 + jitter;
    const startIdx = Math.round(startSec * sr);
    const dropDur = Math.round((0.042 + rng() * 0.022) * sr);
    const fBase = 415 + prog * 335 + (rng() - 0.5) * 45;
    let phase = 0;
    for (let k = 0; k < dropDur; k++) {
      const u = k / dropDur;
      const fInst = fBase * (1 + 0.28 * u * u);
      phase += (2 * Math.PI * fInst) / sr;
      const env =
        Math.sin(Math.min(1, u * 5) * (Math.PI / 2)) * Math.exp(-u * 5.2);
      const sample = Math.sin(phase) * env * 0.135;
      addStereoSample(
        left,
        right,
        startIdx + k,
        sample,
        0.08 + (rng() - 0.5) * 0.12
      );
    }
  }

  // Hồi I (Hướng 1): Tiếng sột soạt giấy dó / cọ mực tàu khớp chính xác từng dòng chữ (từ Dòng 1 tại 0.35s)
  for (const seg of sync.segmentTimings) {
    const clean = stripInlineMarkdown(seg.text).trim();
    if (!clean) continue;
    const strokeStart = Math.round((seg.startFrame / sync.fps) * sr);
    if (strokeStart >= pivotSample - Math.round(0.08 * sr)) continue;
    const rawStrokeDur = Math.min(
      Math.round(0.62 * sr),
      Math.max(Math.round(0.28 * sr), clean.length * Math.round(0.014 * sr))
    );
    const strokeDur = Math.min(
      rawStrokeDur,
      Math.max(0, pivotSample - Math.round(0.04 * sr) - strokeStart)
    );
    let lp1 = 0;
    let lp2 = 0;
    for (let k = 0; k < strokeDur; k++) {
      const u = k / strokeDur;
      const env =
        Math.sin(u * Math.PI) *
        (0.75 + 0.25 * Math.sin(u * Math.PI * 5)) *
        0.16;
      const noise = rng() * 2 - 1;
      lp1 += 0.22 * (noise - lp1);
      lp2 += 0.055 * (lp1 - lp2);
      const brushSample = lp1 - lp2;
      addStereoSample(
        left,
        right,
        strokeStart + k,
        brushSample * env,
        -0.24 + u * 0.48
      );
    }
  }

  const totalBeats = 16;
  for (let b = 1; b < totalBeats; b++) {
    const beatIdx = Math.round((b / totalBeats) * totalSamples);
    if (Math.abs(beatIdx - pivotSample) < Math.round(0.45 * sr)) continue;
    const pulseDur = Math.round(0.09 * sr);
    for (let k = 0; k < pulseDur; k++) {
      const u = k / pulseDur;
      const env =
        Math.sin(Math.min(1, u * 8) * (Math.PI / 2)) * Math.exp(-u * 7.5);
      const wood = Math.sin((2 * Math.PI * 112 * k) / sr) * env * 0.055;
      addStereoSample(left, right, beatIdx + k, wood, 0);
    }
  }

  // Hồi II (Đúng chính xác Frame Pivot): Điểm nhấn Đỏ Chu Sa
  if (pivotStyle === 'TEA_CUP') {
    const cupDur = Math.min(totalSamples - pivotSample, Math.round(1.45 * sr));
    for (let k = 0; k < cupDur; k++) {
      const t = k / sr;
      const attack = Math.min(1, k / (0.0025 * sr));
      const woodBody =
        Math.sin(2 * Math.PI * 168 * t) * Math.exp(-t * 34) * 0.34;
      const rim1 =
        Math.sin(2 * Math.PI * 1174.66 * t) * Math.exp(-t * 5.8) * 0.22;
      const rim2 =
        Math.sin(2 * Math.PI * 2418.0 * t) * Math.exp(-t * 9.5) * 0.11;
      const warmTail =
        Math.sin(2 * Math.PI * 587.33 * t) * Math.exp(-t * 2.4) * 0.14;
      const val = (woodBody + rim1 + rim2 + warmTail) * attack;
      addStereoSample(left, right, pivotSample + k, val, 0.06);
    }
  } else if (pivotStyle === 'WIND_CHIME') {
    const chimeDur = Math.min(totalSamples - pivotSample, Math.round(2.85 * sr));
    for (let k = 0; k < chimeDur; k++) {
      const t = k / sr;
      const attack = Math.min(1, k / (0.004 * sr));
      const m1 = Math.sin(2 * Math.PI * 293.66 * t) * Math.exp(-t * 1.45) * 0.28;
      const m2 = Math.sin(2 * Math.PI * 295.1 * t) * Math.exp(-t * 1.6) * 0.16;
      const m3 = Math.sin(2 * Math.PI * 587.33 * t) * Math.exp(-t * 2.5) * 0.15;
      const m4 = Math.sin(2 * Math.PI * 880.0 * t) * Math.exp(-t * 4.2) * 0.08;
      const val = (m1 + m2 + m3 + m4) * attack;
      addStereoSample(left, right, pivotSample + k, val, -0.08);
      addStereoSample(left, right, pivotSample + k + 18, val * 0.35, 0.22);
    }
  } else {
    const sealDur = Math.min(totalSamples - pivotSample, Math.round(0.75 * sr));
    let thudLp = 0;
    for (let k = 0; k < sealDur; k++) {
      const t = k / sr;
      const attack = Math.min(1, k / (0.0018 * sr));
      const woodImpact =
        Math.sin(2 * Math.PI * (142 - 36 * Math.min(1, t * 18)) * t) *
        Math.exp(-t * 24) *
        0.42;
      const crispSnap = (rng() * 2 - 1) * Math.exp(-t * 65) * 0.24;
      thudLp += 0.38 * (crispSnap - thudLp);
      const subtleRes =
        Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 6.5) * 0.11;
      const val = (woodImpact + thudLp + subtleRes) * attack;
      addStereoSample(left, right, pivotSample + k, val, 0);
    }
  }

  // Hồi III -> 15.0s: Hạt mưa hiên mỏng dần & khử click đầu-cuối 20ms
  const rainDropsInAct3 = 6;
  const act3Start = pivotSample + Math.round(0.65 * sr);
  const act3Span = Math.max(1, totalSamples - Math.round(0.45 * sr) - act3Start);
  for (let r = 0; r < rainDropsInAct3; r++) {
    const ratio = (r + 0.35) / rainDropsInAct3;
    const dropIdx = act3Start + Math.round(ratio * act3Span);
    const fadeTail = 1 - ratio * 0.55;
    const len = Math.round(0.032 * sr);
    const freq = 690 + ((r * 137) % 280);
    for (let k = 0; k < len; k++) {
      const u = k / len;
      const env =
        Math.sin(Math.min(1, u * 6) * (Math.PI / 2)) * Math.exp(-u * 6.5);
      const v =
        Math.sin((2 * Math.PI * freq * k) / sr) * env * 0.055 * fadeTail;
      addStereoSample(
        left,
        right,
        dropIdx + k,
        v,
        (r % 2 === 0 ? -1 : 1) * 0.28
      );
    }
  }

  const declickSamples = Math.min(
    Math.round(0.02 * sr),
    Math.floor(totalSamples / 8)
  );
  for (let i = 0; i < declickSamples; i++) {
    const g = 0.5 - 0.5 * Math.cos((Math.PI * i) / declickSamples);
    left[i] *= g;
    right[i] *= g;
    const tailIdx = totalSamples - 1 - i;
    left[tailIdx] *= g;
    right[tailIdx] *= g;
  }

  normalizeStereoToTargetLufs(left, right, TARGET_INTEGRATED_LUFS);

  return {
    wavBytes: encodeStereoFloat32ToWav16(left, right, sr),
    pivotStyle,
    durationSeconds,
  };
}

function encodeStereoFloat32ToWav16(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number
): Uint8Array {
  const numFrames = left.length;
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const lClamped = Math.max(-1, Math.min(1, left[i]));
    const rClamped = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(
      offset,
      lClamped < 0 ? Math.round(lClamped * 32768) : Math.round(lClamped * 32767),
      true
    );
    view.setInt16(
      offset + 2,
      rClamped < 0 ? Math.round(rClamped * 32768) : Math.round(rClamped * 32767),
      true
    );
    offset += 4;
  }

  return new Uint8Array(buffer);
}
