/**
 * Hỗ trợ kết nối cả OPENAI_API_KEY lẫn GEMINI_API_KEY (qua chuẩn OpenAI-compatible JSON mode).
 * Nếu không phát hiện API Key nào, trả về undefined để chuyển sang chế độ Offline Heuristic Fallback.
 */
export function createLLMCallerFromEnv():
  | ((systemPrompt: string, userPrompt: string) => Promise<unknown>)
  | undefined {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!openaiKey && !geminiKey) {
    console.log(
      '[AI Mapper] Không phát hiện OPENAI_API_KEY hoặc GEMINI_API_KEY -> Sử dụng bộ phân tích Heuristic Offline.'
    );
    return undefined;
  }

  const isGemini = !openaiKey && Boolean(geminiKey);
  const apiKey = openaiKey || geminiKey!;
  const baseUrl =
    process.env.OPENAI_BASE_URL ||
    (isGemini
      ? 'https://generativelanguage.googleapis.com/v1beta/openai'
      : 'https://api.openai.com/v1');
  const model =
    process.env.LLM_MODEL || (isGemini ? 'gemini-3.8-flash' : 'gpt-4o-mini');

  console.log(
    `[AI Mapper] Đã kích hoạt LLM (${isGemini ? 'Gemini' : 'OpenAI'}) với model: ${model}`
  );

  return async (systemPrompt: string, userPrompt: string): Promise<unknown> => {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API Error: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return JSON.parse(data.choices[0].message.content);
  };
}
