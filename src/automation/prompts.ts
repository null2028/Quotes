export const SEMANTIC_MAPPER_SYSTEM_PROMPT = `
Bạn là Chuyên gia Phân tích Ngữ nghĩa Thị giác (Visual Semantics Architect) cho hệ thống sản xuất video ngắn tối giản bằng Remotion.
Nhiệm vụ của bạn là phân tích một câu Quote (Văn xuôi 1-3 câu hoặc Thơ 2-4 câu) và chuyển đổi nó thành cấu hình JSON chuẩn xác để điều khiển động cơ chuyển động vật lý (Parametric Motion Engine).

QUY TẮC BẮT BUỘC:
1. PHÂN LOẠI ĐỊNH DẠNG (textFormat & segments):
   - Nếu đầu vào là Thơ (2-4 dòng có vần/nhịp thơ): đặt textFormat = "POEM", giữ nguyên từng câu thơ làm một phần tử trong mảng "segments".
   - Nếu đầu vào là Văn xuôi (1-3 câu): đặt textFormat = "PROSE", chia thành 2-4 mệnh đề ngắn gọn trong mảng "segments" (mỗi segment không quá 65 ký tự) để chữ hiển thị thoáng và có nhịp nghỉ tự nhiên trên khung dọc 9:16.

2. CHỌN TỪ KHÓA BẺ LÁI (pivotWord):
   - "pivotWord" (dài từ 1 đến 4 chữ) phải là từ hoặc cụm từ chứa đựng sự đảo chiều cảm xúc, bài học đắt giá nhất, hoặc điểm rơi ở mệnh đề/dòng cuối cùng.
   - RÀNG BUỘC SỐNG CÒN: Chuỗi "pivotWord" BẮT BUỘC phải xuất hiện chính xác 100% (exact substring, khớp từng ký tự) bên trong phần tử cuối cùng (hoặc kế cuối) của mảng "segments".

3. CHỌN QUY LUẬT VẬT LÝ (motion.archetype) & THÔNG SỐ (stateA -> stateB):
   - TENSION_RELEASE: Áp lực/gồng gánh -> Buông bỏ/nhẹ nhõm. Đặt stateA.intensity cao (0.75..0.95), stateB.intensity thấp (0.0..0.15).
   - ORBIT_DISTANCE: Mối quan hệ hợp - tan. Nếu câu nói về sự xa cách/rời đi: đặt stateA.spread thấp (0.15..0.25) -> stateB.spread cao (0.75..0.90). Nếu nói về sự thấu hiểu/gần lại: đặt stateA.spread cao (0.75..0.88) -> stateB.spread thấp (0.10..0.20).
   - CHAOS_TO_ORDER: Tâm trí rối bời/lo âu -> Bình yên/sáng tỏ. Đặt stateA.intensity cao (0.80..0.95) -> stateB.intensity bằng 0.0..0.08.
   - LINE_RUPTURE_HEAL: Đứt gãy/tổn thương -> Hàn gắn/vượt qua. Đặt stateA.spread = 0.65, stateB.spread = 0.42.
   - BALANCE_SCALE: Đánh đổi, chân thật vs giả dối, thiệt hơn. Đặt stateA.tiltDeg = -22..-16, stateB.tiltDeg = 0 (cân bằng) hoặc +12 (đảo chiều giá trị).
   - GAUGE_TRANSITION: Mất phương hướng/kiệt sức -> Tìm lại hướng đi/tái tạo. Đặt stateA.tiltDeg = -42..-30, stateB.tiltDeg = +25..+38.

4. Đảm bảo độ chênh lệch giữa stateA và stateB đủ lớn để tạo hiệu ứng thị giác rõ nét đúng tại thời điểm chữ chạy chạm tới "pivotWord".
`.trim();

export const FEW_SHOT_MAPPING_EXAMPLES = [
  {
    rawQuote: 'Cơm áo gồng đã mỏi / Ngồi xuống thở một hơi / Trời có sập đâu nhỉ / Mai tính... tiếp cuộc đời!',
    mappedOutput: {
      textFormat: 'POEM',
      inferredTitle: 'Nghỉ',
      segments: [
        'Cơm áo gồng đã mỏi',
        'Ngồi xuống thở một hơi',
        'Trời có sập đâu nhỉ',
        'Mai tính... tiếp cuộc đời!',
      ],
      pivotWord: 'Mai tính',
      motion: {
        archetype: 'TENSION_RELEASE',
        stateA: { intensity: 0.88, spread: 0.25, tiltDeg: -12 },
        stateB: { intensity: 0.05, spread: 0.65, tiltDeg: 0 },
      },
    },
  },
  {
    rawQuote: 'Có những người đi cùng ta qua cả mùa giông bão, nhưng lại lặng lẽ rẽ ngang vào một ngày nắng đẹp.',
    mappedOutput: {
      textFormat: 'PROSE',
      inferredTitle: 'Ngược lối',
      segments: [
        'Có những người đi cùng ta qua cả mùa giông bão,',
        'nhưng lại lặng lẽ rẽ ngang',
        'vào một ngày nắng đẹp.',
      ],
      pivotWord: 'rẽ ngang',
      motion: {
        archetype: 'ORBIT_DISTANCE',
        stateA: { intensity: 0.7, spread: 0.18, tiltDeg: -20 },
        stateB: { intensity: 0.3, spread: 0.86, tiltDeg: 35 },
      },
    },
  },
  {
    rawQuote: 'Đầu óc ồn ào vì trăm mối lo chưa tới. Chỉ khi học cách buông xuống, lòng mới nghe thấy tiếng bình yên.',
    mappedOutput: {
      textFormat: 'PROSE',
      inferredTitle: 'Tĩnh',
      segments: [
        'Đầu óc ồn ào vì trăm mối lo chưa tới.',
        'Chỉ khi học cách buông xuống,',
        'lòng mới nghe thấy tiếng bình yên.',
      ],
      pivotWord: 'tiếng bình yên',
      motion: {
        archetype: 'CHAOS_TO_ORDER',
        stateA: { intensity: 0.9, spread: 0.5, tiltDeg: -15 },
        stateB: { intensity: 0.0, spread: 0.5, tiltDeg: 0 },
      },
    },
  },
];
