import { z } from 'zod';
import {
  VideoInputProps,
  ArchetypeEnum,
  MotionParamsSchema,
  ThemeIdEnum,
} from '../schemas/videoSchema';
import { ARCHETYPE_MAPPING_RULES } from './mappingRules';
import { SEMANTIC_MAPPER_SYSTEM_PROMPT, FEW_SHOT_MAPPING_EXAMPLES } from './prompts';
import { validateAndNormalizeVideoProps } from './validator';

export interface RawQuoteJobInput {
  id: string;
  rawText: string;
  title?: string;
  pivotWord?: string;
  themeId?: z.infer<typeof ThemeIdEnum>;
  brandText?: string;
}

export const LLMMappingResultSchema = z.object({
  textFormat: z.enum(['PROEM', 'PROSE', 'POEM']).transform((v) =>
    v === 'PROSE' ? 'PROSE' : 'POEM'
  ),
  inferredTitle: z.string().optional(),
  segments: z.array(z.string()).min(1).max(6),
  pivotWord: z.string(),
  motion: MotionParamsSchema,
});

function splitProseIntoEditorialSegments(rawText: string): string[] {
  const initialClauses = rawText
    .split(/(?<=[.,;!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const balancedSegments: string[] = [];
  for (const clause of initialClauses) {
    if (clause.length > 42) {
      const subParts = clause
        .split(/\s+(?=(?:nhưng lại|nhưng|chỉ khi|cho đến khi|hóa ra|vào một|để rồi)\b)/i)
        .map((s) => s.trim())
        .filter(Boolean);
      balancedSegments.push(...subParts);
    } else {
      balancedSegments.push(clause);
    }
  }

  return balancedSegments.slice(0, 6);
}

function inferSmartPivotWord(segments: string[]): string {
  for (let i = segments.length - 1; i >= 0; i--) {
    const ellipsisMatch = segments[i].match(/([A-Za-zÀ-ỹ]+(?:\s+[A-Za-zÀ-ỹ]+){0,2})\s*(?:\.\.\.|…)/);
    if (ellipsisMatch?.[1]) {
      return ellipsisMatch[1].trim();
    }
  }

  const fullJoined = segments.join(' ');
  const twistMatch = fullJoined.match(
    /(?:nhưng lại lặng lẽ|nhưng lại|chỉ khi học cách|học cách|lặng lẽ|hóa ra chỉ là|ai ngờ)\s+([A-Za-zÀ-ỹ]+(?:\s+[A-Za-zÀ-ỹ]+)?)/i
  );
  if (twistMatch?.[1]) {
    return twistMatch[1].trim();
  }

  return '';
}

export function heuristicFallbackMapper(job: RawQuoteJobInput): VideoInputProps {
  const lines = job.rawText
    .split(/\r?\n|\/|\|/)
    .map((s) => s.trim())
    .filter(Boolean);

  const isPoem = lines.length >= 2 && lines.every((l) => l.split(/\s+/).length <= 9);
  const segments =
    lines.length >= 2
      ? lines.slice(0, 6)
      : splitProseIntoEditorialSegments(job.rawText);

  const lower = job.rawText.toLowerCase();
  let archetype: z.infer<typeof ArchetypeEnum> = 'TENSION_RELEASE';

  if (/(rời đi|xa nhau|rẽ ngang|người thương|có chủ|bước đi|chia ly|hợp tan)/.test(lower)) {
    archetype = 'ORBIT_DISTANCE';
  } else if (/(ồn ào|rối|lo âu|bình yên|tĩnh lặng|đêm dài|suy nghĩ)/.test(lower)) {
    archetype = 'CHAOS_TO_ORDER';
  } else if (/(vết đau|ổ khóa|khép cửa|vỡ|hàn gắn|buông tay|vết xước|tha thứ)/.test(lower)) {
    archetype = 'LINE_RUPTURE_HEAL';
  } else if (/(đắt|dối gian|chân thật|đánh đổi|công bằng|hơn thua|giá trị)/.test(lower)) {
    archetype = 'BALANCE_SCALE';
  } else if (/(lạc đường|soi lối|hướng|cạn|mệt|bắt đầu lại)/.test(lower)) {
    archetype = 'GAUGE_TRANSITION';
  }

  const rule = ARCHETYPE_MAPPING_RULES[archetype];
  const candidatePivot = job.pivotWord?.trim() || inferSmartPivotWord(segments);

  return validateAndNormalizeVideoProps({
    id: job.id,
    textFormat: isPoem ? 'POEM' : 'PROSE',
    title: job.title,
    segments,
    pivotWord: candidatePivot,
    highlightStyle: 'BOTH',
    targetDurationSeconds: 15,
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: job.themeId ?? 'MINIMAL_LIGHT',
    motion: {
      archetype,
      pacingMode: 'CONTEMPLATIVE',
      stateA: { ...rule.recommendedStateA },
      stateB: { ...rule.recommendedStateB },
    },
    bgm: {
      audioMode: 'FOLEY_MASTER',
      foleyPivotStyle: 'AUTO',
    },
    brandText: job.brandText ?? 'TRÀ NGUỘI',
  });
}

export async function mapQuoteToVideoProps(
  job: RawQuoteJobInput,
  llmCaller?: (systemPrompt: string, userPrompt: string) => Promise<unknown>
): Promise<VideoInputProps> {
  if (!llmCaller) {
    return heuristicFallbackMapper(job);
  }

  const userPrompt = JSON.stringify({
    instruction: 'Phân tích câu quote sau và trả về JSON theo đúng cấu trúc.',
    examples: FEW_SHOT_MAPPING_EXAMPLES,
    inputQuote: job.rawText,
  });

  const rawLlmJson = await llmCaller(SEMANTIC_MAPPER_SYSTEM_PROMPT, userPrompt);
  const llmParsed = LLMMappingResultSchema.parse(rawLlmJson);

  return validateAndNormalizeVideoProps({
    id: job.id,
    textFormat: llmParsed.textFormat,
    title: job.title ?? llmParsed.inferredTitle,
    segments: llmParsed.segments,
    pivotWord: job.pivotWord?.trim() || llmParsed.pivotWord,
    highlightStyle: 'BOTH',
    targetDurationSeconds: 15,
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: job.themeId ?? 'MINIMAL_LIGHT',
    motion: llmParsed.motion,
    bgm: {
      audioMode: 'FOLEY_MASTER',
      foleyPivotStyle: 'AUTO',
    },
    brandText: job.brandText ?? 'TRÀ NGUỘI',
  });
}
