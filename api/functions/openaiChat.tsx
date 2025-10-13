
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import OpenAI from 'npm:openai@4.56.0';

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { "Allow": "POST" }
      });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages = [], model = "gpt-4o-mini", system, temperature, top_p } = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "Missing OPENAI_API_KEY. Please set it in environment variables." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    const compiledMessages = [];
    if (system && String(system).trim().length > 0) {
      compiledMessages.push({ role: "system", content: String(system) });
    }
    for (const m of messages) {
      if (!m || !m.role) continue;
      const role = ["user", "assistant", "system"].includes(m.role) ? m.role : "user";
      compiledMessages.push({ role, content: String(m.content ?? "") });
    }

    const params = {
      model,
      messages: compiledMessages.length > 0 ? compiledMessages : [{ role: "user", content: "Hello!" }],
      temperature: typeof temperature === "number" ? temperature : 0.2,
    };
    if (typeof top_p === "number") params.top_p = top_p;

