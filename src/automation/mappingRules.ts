import { z } from 'zod';
import { ArchetypeEnum } from '../schemas/videoSchema';

export type ArchetypeId = z.infer<typeof ArchetypeEnum>;

export interface ArchetypePhysicalRule {
  archetype: ArchetypeId;
  semanticUseCase: string;
  intensityMeaning: string;
  spreadMeaning: string;
  tiltDegMeaning: string;
  recommendedStateA: { intensity: number; spread: number; tiltDeg: number };
  recommendedStateB: { intensity: number; spread: number; tiltDeg: number };
}

export const ARCHETYPE_MAPPING_RULES: Record<ArchetypeId, ArchetypePhysicalRule> = {
  TENSION_RELEASE: {
    archetype: 'TENSION_RELEASE',
    semanticUseCase:
      'Câu nói về áp lực, gồng gánh, mệt mỏi, buông bỏ, nghỉ ngơi, tha thứ cho bản thân.',
    intensityMeaning:
      'Độ trũng của sợi dây bị khối nặng đè xuống (0.85 = đè rất sâu, 0.05 = dây thẳng cân bằng).',
    spreadMeaning: 'Độ giãn phụ của khung.',
    tiltDegMeaning: 'Góc lệch nhẹ ban đầu.',
    recommendedStateA: { intensity: 0.85, spread: 0.25, tiltDeg: -14 },
    recommendedStateB: { intensity: 0.05, spread: 0.65, tiltDeg: 0 },
  },
  ORBIT_DISTANCE: {
    archetype: 'ORBIT_DISTANCE',
    semanticUseCase:
      'Câu nói về mối quan hệ (tình yêu, tình bạn), hợp – tan, khoảng cách giữa hai người, hoặc sự đồng điệu.',
    intensityMeaning: 'Độ đậm của lực hút.',
    spreadMeaning:
      'Bán kính khoảng cách giữa 2 chấm tròn (0.15 = xoay sát nhau, 0.85 = trôi xa nhau).',
    tiltDegMeaning: 'Góc xoay quỹ đạo từ câu mở đầu sang câu kết (-25 -> 35).',
    recommendedStateA: { intensity: 0.7, spread: 0.18, tiltDeg: -20 },
    recommendedStateB: { intensity: 0.3, spread: 0.85, tiltDeg: 35 },
  },
  CHAOS_TO_ORDER: {
    archetype: 'CHAOS_TO_ORDER',
    semanticUseCase:
      'Câu nói về overthinking, tâm trí rối bời, lo âu rồi tìm thấy sự bình yên, tĩnh lặng, thông suốt.',
    intensityMeaning:
      'Biên độ hỗn loạn của sóng dây (0.9 = xoắn rối mạnh, 0.0 = đường chân trời phẳng lặng).',
    spreadMeaning: 'Tần số trải rộng sóng.',
    tiltDegMeaning: 'Độ nghiêng pha sóng.',
    recommendedStateA: { intensity: 0.88, spread: 0.5, tiltDeg: -15 },
    recommendedStateB: { intensity: 0.0, spread: 0.5, tiltDeg: 0 },
  },
  LINE_RUPTURE_HEAL: {
    archetype: 'LINE_RUPTURE_HEAL',
    semanticUseCase:
      'Câu nói về vết thương lòng, sự đứt gãy, ranh giới cá nhân, hàn gắn, hoặc bước qua quá khứ.',
    intensityMeaning: 'Độ rung ở hai đầu đứt gãy.',
    spreadMeaning:
      'Độ rộng của khoảng đứt gãy ở giữa (0.65 = khoảng trống rõ, 0.35 = thu hẹp khi nối cầu).',
    tiltDegMeaning: 'Góc vòm cầu nối.',
    recommendedStateA: { intensity: 0.75, spread: 0.65, tiltDeg: -12 },
    recommendedStateB: { intensity: 0.15, spread: 0.4, tiltDeg: 0 },
  },
  BALANCE_SCALE: {
    archetype: 'BALANCE_SCALE',
    semanticUseCase:
      'Câu nói về sự đánh đổi, chân thật vs. giả dối, cho đi – nhận lại, giá trị bản thân, thiệt hơn ở đời.',
    intensityMeaning: 'Sức nặng biểu kiến.',
    spreadMeaning: 'Khoảng cách đòn bẩy.',
    tiltDegMeaning:
      'Góc nghiêng của thanh cân (-22 = lệch hẳn về một bên, 0 = cân bằng tuyệt đối, +15 = đảo chiều).',
    recommendedStateA: { intensity: 0.8, spread: 0.3, tiltDeg: -22 },
    recommendedStateB: { intensity: 0.2, spread: 0.6, tiltDeg: 0 },
  },
  GAUGE_TRANSITION: {
    archetype: 'GAUGE_TRANSITION',
    semanticUseCase:
      'Câu nói về tuổi trẻ mất phương hướng, cạn kiệt năng lượng (burnout), kiên định, tìm thấy lối đi.',
    intensityMeaning: 'Mức độ dao động của kim.',
    spreadMeaning: 'Độ mở vòng cung.',
    tiltDegMeaning:
      'Góc chỉ của kim la bàn/đồng hồ (-42 = vùng cạn/lạc hướng, +32 = khóa vào hướng đích).',
    recommendedStateA: { intensity: 0.85, spread: 0.25, tiltDeg: -40 },
    recommendedStateB: { intensity: 0.1, spread: 0.75, tiltDeg: 30 },
  },
};
