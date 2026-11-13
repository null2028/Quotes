import fs from 'fs';
import { z } from 'zod';
import { ThemeIdEnum } from '../schemas/videoSchema';
import { RawQuoteJobInput } from '../automation/semanticMapper';

const RawJobListSchema = z.array(
  z.object({
    id: z.string().min(1),
    rawText: z.string().min(5),
    title: z.string().optional(),
    pivotWord: z.string().optional(),
    themeId: ThemeIdEnum.optional().default('MINIMAL_LIGHT'),
    brandText: z.string().optional().default('TRÀ NGUỘI'),
  })
);

export function loadAndVerifyJobs(inputJsonPath: string): RawQuoteJobInput[] {
  if (!fs.existsSync(inputJsonPath)) {
    throw new Error(`Không tìm thấy file đầu vào tại: ${inputJsonPath}`);
  }

  const rawContent = fs.readFileSync(inputJsonPath, 'utf-8');
  return RawJobListSchema.parse(JSON.parse(rawContent));
}
