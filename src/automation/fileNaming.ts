/**
 * Chuẩn hóa chuỗi tiếng Việt sang dạng slug không dấu (kebab-case) sạch cho TikTok SEO metadata.
 */
export function toAsciiKebabSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * Chuẩn hóa tên file hiển thị cho Video (.mp4) theo định dạng quen thuộc trên Studio:
 * "Chén <XX> - <Tên Chén>" (VD: "Chén 04 - Lốp")
 */
export function formatCupBaseFileName(
  idOrCupNumber: string,
  title?: string
): string {
  const numMatch = idOrCupNumber.match(/\d+/);
  const cupNo = numMatch ? numMatch[0].slice(-2).padStart(2, '0') : '01';
  const cleanTitle = (title ?? '')
    .normalize('NFC')
    .replace(/[\/\\:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanTitle.length > 0
    ? `Chén ${cupNo} - ${cleanTitle}`
    : `Chén ${cupNo}`;
}

/**
 * Đặt tên tệp vật lý chuẩn TikTok SEO / Clean Master Workflow (Mục 02):
 * Không dấu, chứa mã Chén + tiêu đề + từ khóa ngữ cảnh/mood + hậu tố thương hiệu "tra-nguoi"
 * Ví dụ: "chen-09-ky-uc-hoai-niem-tra-nguoi"
 */
export function formatCupSeoFileName(
  idOrCupNumber: string,
  options?: {
    title?: string;
    pivotWord?: string;
    mood?: string;
    topic?: string;
  }
): string {
  const numMatch = idOrCupNumber.match(/\d+/);
  const cupNo = numMatch ? numMatch[0].slice(-2).padStart(2, '0') : '01';

  const parts: string[] = [`chen-${cupNo}`];
  const seen = new Set<string>(parts);

  const pushUniqueSlug = (raw?: string, maxWords = 4) => {
    if (!raw) return;
    const slug = toAsciiKebabSlug(raw)
      .split('-')
      .filter(Boolean)
      .slice(0, maxWords)
      .join('-');
    if (slug && slug !== 'tra-nguoi' && !seen.has(slug)) {
      seen.add(slug);
      parts.push(slug);
    }
  };

  pushUniqueSlug(options?.title, 4);
  pushUniqueSlug(options?.topic || options?.mood, 3);
  if (parts.length < 3) {
    pushUniqueSlug(options?.pivotWord, 3);
  }

  parts.push('tra-nguoi');
  return parts.join('-').slice(0, 68).replace(/-+$/g, '');
}
