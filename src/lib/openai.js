// @ts-check

/**
 * Send a chat request to the server's `/api/openai/chat` route.
 *
 * @param {{
 *   messages: Array<{ role: "system" | "user" | "assistant", content: string }>,
 *   model?: string,
 *   stream?: boolean,
 *   temperature?: number,
 *   max_tokens?: number,
 *   system?: string,
 * }} payload
 *
 * @returns {Promise<any>} server response JSON
 */
export async function openaiChat(payload) {
  const res = await fetch("/api/openai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`openaiChat failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Stream tokens from `/api/openai/chat` via SSE.
 *
 * @param {{
 *   messages: Array<{ role: "system" | "user" | "assistant", content: string }>,
 *   model?: string,
 *   temperature?: number,
 *   max_tokens?: number,
 *   system?: string,
 * }} payload
 * @param {(token: string) => void} onToken callback fired for each streamed delta token
 *
 * @returns {Promise<void>}
 */
export async function openaiChatStream(payload, onToken) {
  const res = await fetch("/api/openai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, stream: true }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`openaiChatStream failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) return;

    const text = decoder.decode(value, { stream: true });

    for (const block of text.split("\n\n")) {
      if (!block) continue;

      if (block.startsWith("data: ")) {
        const json = block.slice(6);
        if (!json.trim()) continue;

        try {
          const { delta } = JSON.parse(json);
          if (delta) onToken(delta);
        } catch {
          // ignore malformed JSON chunks
        }
      }

      if (block.startsWith("event: done")) {
        return;
      }
    }
  }
}

/**
 * Call the mountaineering agent endpoint.
 *
 * @param {{
 *   messages: Array<{ role: "system" | "user" | "assistant", content: string }>,
 *   model?: string,
 *   temperature?: number,
 *   max_tokens?: number,
 * }} payload
 *
 * @returns {Promise<any>}
 */
export async function agentMountaineering(payload) {
  const res = await fetch("/api/agents/mountaineering", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`agentMountaineering failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Call the medication advisor agent endpoint.
 *
 * @param {{
 *   messages?: Array<{ role: "system" | "user" | "assistant", content: string }>,
 *   meds?: any,
 *   model?: string,
 *   temperature?: number,
 *   max_tokens?: number,
 * }} payload
 *
 * @returns {Promise<any>}
 */
export async function agentMedication(payload) {
  const res = await fetch("/api/agents/medication", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`agentMedication failed: ${res.status}`);
  }

  return res.json();
}
