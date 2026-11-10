import { assistantConfig, deepseekKey } from './config';

/**
 * Cliente mínimo de la API de DeepSeek (formato OpenAI, /chat/completions), sin dependencias.
 * Modo sin razonamiento (`thinking: disabled`): responde antes y no hay que devolver el
 * `reasoning_content` en cada turno. Toda la relación con el proveedor está en este archivo:
 * cambiar de proveedor es cambiar esto. Solo servidor.
 */

export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };

export type ApiMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

export type ToolDef = {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

type Delta = {
  content?: string | null;
  tool_calls?: { index: number; id?: string; type?: 'function'; function?: { name?: string; arguments?: string } }[];
};

type Chunk = { choices?: { delta?: Delta; finish_reason?: string | null }[] };

type Options = {
  messages: ApiMessage[];
  tools?: ToolDef[];
  maxTokens?: number;
  signal?: AbortSignal;
};

function request({ messages, tools, maxTokens = assistantConfig.maxTokens, signal }: Options, stream: boolean) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), assistantConfig.timeoutMs);
  signal?.addEventListener('abort', () => controller.abort(), { once: true });
  const body = {
    model: assistantConfig.model,
    messages,
    ...(tools?.length ? { tools, tool_choice: 'auto' } : {}),
    max_tokens: maxTokens,
    temperature: assistantConfig.temperature,
    thinking: { type: 'disabled' },
    stream,
  };
  return {
    done: () => clearTimeout(timer),
    response: fetch(`${assistantConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${deepseekKey()}` },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    }),
  };
}

/**
 * Una llamada en streaming. Va entregando el texto con `onText` y, al terminar, devuelve las
 * llamadas a herramientas que haya pedido el modelo (si las hay).
 */
export async function streamChat(
  opts: Options,
  onText: (delta: string) => void,
): Promise<{ text: string; toolCalls: ToolCall[]; finish: string | null }> {
  const { response, done } = request(opts, true);
  try {
    const res = await response;
    if (!res.ok || !res.body) throw new UpstreamError(`deepseek_${res.status}`, res.status);

    const calls: ToolCall[] = [];
    let text = '';
    let finish: string | null = null;
    let buffer = '';
    const decoder = new TextDecoder();
    const reader = res.body.getReader();

    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith('data:')) continue; // comentarios de keep-alive y líneas vacías
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        let chunk: Chunk;
        try {
          chunk = JSON.parse(data) as Chunk;
        } catch {
          continue;
        }
        const choice = chunk.choices?.[0];
        if (!choice) continue;
        const delta = choice.delta;
        if (delta?.content) {
          text += delta.content;
          onText(delta.content);
        }
        for (const tc of delta?.tool_calls ?? []) {
          const slot = (calls[tc.index] ??= { id: '', type: 'function', function: { name: '', arguments: '' } });
          if (tc.id) slot.id = tc.id;
          if (tc.function?.name) slot.function.name += tc.function.name;
          if (tc.function?.arguments) slot.function.arguments += tc.function.arguments;
        }
        if (choice.finish_reason) finish = choice.finish_reason;
      }
    }
    return { text, toolCalls: calls.filter((c) => c.id && c.function.name), finish };
  } catch (e) {
    if (e instanceof UpstreamError) throw e;
    throw new UpstreamError(e instanceof Error ? e.name : 'unknown');
  } finally {
    done();
  }
}

/** Una llamada sin streaming (para el resumen que acompaña al lead). */
export async function completeChat(opts: Options): Promise<string> {
  const { response, done } = request(opts, false);
  try {
    const res = await response;
    if (!res.ok) throw new UpstreamError(`deepseek_${res.status}`, res.status);
    const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? '';
  } catch (e) {
    if (e instanceof UpstreamError) throw e;
    throw new UpstreamError(e instanceof Error ? e.name : 'unknown');
  } finally {
    done();
  }
}
