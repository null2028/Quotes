import { VideoInputProps } from '../schemas/videoSchema';

// 1. TENSION_RELEASE / BOULDER_TO_BENCH (Thơ - Minimal Light)
export const SAMPLE_POEM_INPUT: VideoInputProps = {
  id: 'demo-poem-001',
  textFormat: 'POEM',
  title: 'Nghỉ',
  segments: [
    'Cơm áo gồng đã mỏi',
    'Ngồi xuống thở một hơi',
    'Trời có sập đâu nhỉ',
    'Mai tính... tiếp cuộc đời!',
  ],
  pivotWord: 'Mai tính',
  highlightStyle: 'BOTH',
  targetDurationSeconds: 15,
  typingSpeedMsPerChar: 55,
  holdAfterFinishSeconds: 5.5,
  themeId: 'MINIMAL_LIGHT',
  motion: {
    archetype: 'TENSION_RELEASE',
    pacingMode: 'CONTEMPLATIVE',
    stateA: { intensity: 0.85, spread: 0.25, tiltDeg: -14 },
    stateB: { intensity: 0.05, spread: 0.65, tiltDeg: 0 },
  },
  bgm: {
    audioMode: 'FOLEY_MASTER',
    foleyPivotStyle: 'AUTO',
  },
  brandText: 'TRÀ NGUỘI',
};

// 2. CHAOS_TO_ORDER / KNOT_TO_BIRD (Văn xuôi - Minimal Dark)
export const SAMPLE_PROSE_INPUT: VideoInputProps = {
  id: 'demo-prose-002',
  textFormat: 'PROSE',
  title: 'Tĩnh',
  segments: [
    'Đầu óc ồn ào vì trăm mối lo chưa tới.',
    'Chỉ khi học cách buông xuống,',
    'lòng mới nghe thấy tiếng bình yên.',
  ],
  pivotWord: 'tiếng bình yên',
  highlightStyle: 'BOTH',
  targetDurationSeconds: 15,
  typingSpeedMsPerChar: 55,
  holdAfterFinishSeconds: 5.5,
  themeId: 'MINIMAL_DARK',
  motion: {
    archetype: 'CHAOS_TO_ORDER',
    pacingMode: 'CONTEMPLATIVE',
    stateA: { intensity: 0.9, spread: 0.5, tiltDeg: -15 },
    stateB: { intensity: 0.0, spread: 0.5, tiltDeg: 0 },
  },
  bgm: {
    audioMode: 'FOLEY_MASTER',
    foleyPivotStyle: 'AUTO',
  },
  brandText: 'TRÀ NGUỘI',
};

// 3. ORBIT_DISTANCE / RAIN_UMBRELLA_PARTING (Văn xuôi - Warm Noir)
export const SAMPLE_ORBIT_INPUT: VideoInputProps = {
  id: 'demo-orbit-003',
  textFormat: 'PROSE',
  title: 'Ngược lối',
  segments: [
    'Có những người đi cùng ta qua cả mùa giông bão,',
    'nhưng lại lặng lẽ rẽ ngang',
    'vào một ngày nắng đẹp.',
  ],
  pivotWord: 'rẽ ngang',
  highlightStyle: 'BOTH',
  targetDurationSeconds: 15,
  typingSpeedMsPerChar: 55,
  holdAfterFinishSeconds: 5.5,
  themeId: 'WARM_NOIR',
  motion: {
    archetype: 'ORBIT_DISTANCE',
    pacingMode: 'CONTEMPLATIVE',
    stateA: { intensity: 0.7, spread: 0.18, tiltDeg: -20 },
    stateB: { intensity: 0.3, spread: 0.86, tiltDeg: 35 },
  },
  bgm: {
    audioMode: 'FOLEY_MASTER',
    foleyPivotStyle: 'AUTO',
  },
  brandText: 'TRÀ NGUỘI',
};

// 4. LINE_RUPTURE_HEAL / KEY_CHANGED_LOCK (Thơ - Slate Calm)
export const SAMPLE_RUPTURE_HEAL_INPUT: VideoInputProps = {
  id: 'demo-heal-004',
  textFormat: 'POEM',
  title: 'Khép lại',
  segments: [
    'Vết xước năm tháng cũ',
    'Đừng cạy mãi thêm đau',
    'Tha thứ cho ngày trước',
    'Để bình thản ngày sau.',
  ],
  pivotWord: 'bình thản',
  highlightStyle: 'BOTH',
  targetDurationSeconds: 15,
  typingSpeedMsPerChar: 55,
  holdAfterFinishSeconds: 5.5,
  themeId: 'SLATE_CALM',
  motion: {
    archetype: 'LINE_RUPTURE_HEAL',
    pacingMode: 'CONTEMPLATIVE',
    stateA: { intensity: 0.75, spread: 0.65, tiltDeg: -12 },
    stateB: { intensity: 0.15, spread: 0.4, tiltDeg: 0 },
  },
  bgm: {
    audioMode: 'FOLEY_MASTER',
    foleyPivotStyle: 'AUTO',
  },
  brandText: 'TRÀ NGUỘI',
};

// 5. BALANCE_SCALE / MATCH_LIGHTING_CANDLE (Văn xuôi - Minimal Light)
export const SAMPLE_BALANCE_SCALE_INPUT: VideoInputProps = {
  id: 'demo-balance-005',
  textFormat: 'PROSE',
  title: 'Giá trị',
  segments: [
    'Đừng lấy sự ồn ào của đám đông để đo giá trị của mình.',
    'Một chút chân thật nơi đáy lòng',
    'luôn nặng hơn vạn lời hào nhoáng.',
  ],
  pivotWord: 'chân thật',
  highlightStyle: 'BOTH',
  targetDurationSeconds: 15,
  typingSpeedMsPerChar: 55,
  holdAfterFinishSeconds: 5.5,
  themeId: 'MINIMAL_LIGHT',
  motion: {
    archetype: 'BALANCE_SCALE',
    pacingMode: 'CONTEMPLATIVE',
    stateA: { intensity: 0.8, spread: 0.3, tiltDeg: -22 },
    stateB: { intensity: 0.2, spread: 0.6, tiltDeg: 0 },
  },
  bgm: {
    audioMode: 'FOLEY_MASTER',
    foleyPivotStyle: 'AUTO',
  },
  brandText: 'TRÀ NGUỘI',
};

// 6. GAUGE_TRANSITION / PASSING_CLOCK_HANDS (Thơ - Minimal Dark)
export const SAMPLE_GAUGE_TRANSITION_INPUT: VideoInputProps = {
  id: 'demo-gauge-006',
  textFormat: 'POEM',
  title: 'Hướng',
  segments: [
    'Đi qua ngày mỏi mệt',
    'Lạc giữa những ngã tư',
    'Chậm lại nghe nhịp thở',
    'Đường sáng tự khắc về.',
  ],
  pivotWord: 'Đường sáng',
  highlightStyle: 'BOTH',
  targetDurationSeconds: 15,
  typingSpeedMsPerChar: 55,
  holdAfterFinishSeconds: 5.5,
  themeId: 'MINIMAL_DARK',
  motion: {
    archetype: 'GAUGE_TRANSITION',
    pacingMode: 'CONTEMPLATIVE',
    stateA: { intensity: 0.85, spread: 0.25, tiltDeg: -40 },
    stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 32 },
  },
  bgm: {
    audioMode: 'FOLEY_MASTER',
    foleyPivotStyle: 'AUTO',
  },
  brandText: 'TRÀ NGUỘI',
};
