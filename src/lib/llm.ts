// OpenAI 兼容 LLM 客户端
// 支持: DeepSeek, 通义千问, Kimi, OpenAI, 及其他兼容 /v1/chat/completions 的服务

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

interface ChatCompletionResponse {
  choices: { message: { content: string } }[];
  usage?: { total_tokens: number };
}

export async function chat(
  messages: ChatMessage[],
  options?: { jsonMode?: boolean; temperature?: number; maxTokens?: number }
): Promise<string> {
  const config = getConfig();

  const body: ChatCompletionRequest = {
    model: config.model,
    messages,
    temperature: options?.temperature ?? 0.1,
    max_tokens: options?.maxTokens ?? 1000,
  };

  if (options?.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data: ChatCompletionResponse = await res.json();
  return data.choices[0]?.message?.content || "";
}

function getConfig() {
  const key = process.env.LLM_API_KEY;
  const url = process.env.LLM_API_URL || "https://api.deepseek.com/v1/chat/completions";
  const model = process.env.LLM_MODEL || "deepseek-chat";

  if (!key || key === "sk-your-key-here") {
    throw new Error("LLM_API_KEY 未配置，请在 .env 中设置");
  }

  return { key, url, model };
}
