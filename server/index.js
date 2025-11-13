// server/index.js
// Local dev API for Vite app (ESM)
// server/index.js
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config.js";
import { q, getPool } from "./db.js";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") }); // <- loads server/.env

const app = express();
const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3003);
const ORIGIN = process.env.VITE_DEV_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Create the OpenAI client once
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Warm up the DB pool on boot (optional)
try {
  await getPool();
  console.log("DB pool ready");
} catch (e) {
  console.error("DB init error:", e);
}

// ——— Presets (tweak anytime) ———
const SYS_MOUNTAINEERING = [
  "You are a veteran mountaineering guide for the Pacific Northwest.",
  "Prioritize safety, weather and seasonality, acclimatization, and COPD-aware pacing.",
  "Give step-by-step plans, gear checklists, conservative turnaround rules, and bailout options.",
  "When in doubt, recommend contacting local rangers or certified guides.",
].join(" ");

const SYS_MEDICATION = [
  "You are a cautious medical/pharmaceutical advisor assisting an adult mountaineer.",
  "Goal: identify medication risks for strenuous hiking/alpine climbs (e.g., dehydration, hypoxia, heat/cold intolerance, orthostasis, sedation, photosensitivity, bleeding risk, electrolyte imbalance).",
  "Consider individual drugs AND combinations. Note MAOI-specific cautions (e.g., phenelzine + tyramine interactions) and COPD-related concerns.",
  "Never diagnose. Provide risk flags, plain-English rationale, monitoring tips, and when to contact a clinician.",
  "If risk is unclear or high, state uncertainty and suggest discussing with the user's healthcare provider.",
].join(" ");

// Utility: map Chat-style {role, content}[] to Responses API input array
// ——— Helper: map Chat-style payload to Responses API input ———
function toResponsesInput(messages = [], system) {
  const arr = [{ role: "system", content: system }];
  for (const m of messages || []) arr.push({ role: m.role, content: m.content });
  return arr;
}

// ——— Shared runner ———
async function runAgent({ system, messages, model, temperature, max_tokens }) {
  const resp = await openai.responses.create({
    model: model || process.env.OPENAI_MODEL || "gpt-5",
    input: toResponsesInput(messages, system),
    temperature,
    max_output_tokens: max_tokens,
  });
  const text =
    resp.output_text ??
    (Array.isArray(resp.output) &&
      resp.output.find((p) => p.type === "output_text")?.text) ??
    "";
  return { model: resp.model, output_text: text, raw: resp };
}

// ——— Mountaineering Agent ———
// Body: { messages:[{role,content}], model?, temperature?, max_tokens? }
app.post("/api/agents/mountaineering", async (req, res) => {
  try {
    const { messages = [], model, temperature, max_tokens } = req.body || {};
    if (!messages.length) return res.status(400).json({ error: "messages[] is required" });
    const out = await runAgent({
      system: SYS_MOUNTAINEERING,
      messages,
      model,
      temperature,
      max_tokens,
    });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e?.message || "agent error" });
  }
});

// ——— Medication Advisor Agent ———
// Body: { messages:[{role,content}], meds?: any, model?, temperature?, max_tokens? }
// Tip: pass the user’s medications in a single user message or in `meds` that we stringify.
app.post("/api/agents/medication", async (req, res) => {
  try {
    const { messages = [], meds, model, temperature, max_tokens } = req.body || {};
    if (!messages.length && !meds) {
      return res.status(400).json({ error: "messages[] or meds is required" });
    }

    // If structured meds are provided, prepend a user message that includes them.
    const augmented = [...messages];
    if (meds) {
      augmented.unshift({
        role: "user",
        content:
          "Analyze these medications for mountaineering risks (individual and combined). JSON:\n" +
          "```\n" +
          JSON.stringify(meds, null, 2) +
          "\n```",
      });
    }

    const out = await runAgent({
      system: SYS_MEDICATION,
      messages: augmented,
      model,
      temperature,
      max_tokens,
    });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e?.message || "agent error" });
  }
});

// POST /api/openai/chat
// Body: { messages:[{role,content}...], model?, stream?, temperature?, max_tokens? }
app.post("/api/openai/chat", async (req, res) => {
  const {
    messages = [],
    model = process.env.OPENAI_MODEL || "gpt-5",
    stream = false,
    temperature,
    max_tokens, // (Responses API calls this max_output_tokens; we’ll map it)
    // optional escape hatch: override the default system prompt
    system = MOUNTAINEERING_SYSTEM,
  } = req.body || {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages[] is required" });
  }

 // Build the Responses API input: prepend our system preset
  const input = [{ role: "system", content: system }, ...toResponsesInput(messages)];

  try {
    if (!stream) {
      // -------- Non-streaming --------
      const resp = await openai.responses.create({
        model,
        input,
        temperature,
        max_output_tokens: max_tokens, // map from your client’s field
      });

      // Convenience: output_text when present; fall back to first text item
      const outputText =
        resp.output_text ??
        (Array.isArray(resp.output) &&
          resp.output.find((p) => p.type === "output_text")?.text) ??
        null;

      return res.json({
        model: resp.model,
        output_text: outputText,
        raw: resp,
      });
    }

    // -------- Streaming (Server-Sent Events) --------
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // NOTE: The official SDK exposes evented streams for Responses API.
    const streamResp = await openai.responses.stream({
      model,
      input,
      temperature,
      max_output_tokens: max_tokens,
    });

    // Send incremental text deltas as { delta: "..." }
    for await (const event of streamResp) {
      // The event types include response.output_text.delta / .completed etc.
      if (event?.type === "response.output_text.delta" && event.delta) {
        res.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`);
      } else if (event?.type === "response.completed") {
        res.write(`event: done\ndata: {}\n\n`);
      }
    }
    res.end();
  } catch (err) {
    // If streaming, headers might already be sent—emit an SSE error event
    try {
      if (!res.headersSent) {
        res.status(500).json({ error: err?.message ?? "OpenAI request failed" });
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({ error: String(err?.message || err) })}\n\n`);
        res.end();
      }
    } catch {}
  }
});

/* ===========================
 * CLIMB GEAR
 * =========================== */

// GET /api/climbs/:climbId/gear
app.get("/api/climbs/:climbId/gear", async (req, res) => {
  try {
    const climbId = Number(req.params.climbId);
    const items = await q(
      `SELECT id, climb_id, item_name, category, quantity, required, packed,
              importance, estimated_weight_kg, notes, created_at, updated_at
         FROM climb_gear_items
        WHERE climb_id = :climbId
        ORDER BY FIELD(importance,'critical','high','recommended','optional'), item_name`,
      { climbId }
    );
    res.json({ ok: true, items });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/climbs/:climbId/gear
app.post("/api/climbs/:climbId/gear", async (req, res) => {
  try {
    const climbId = Number(req.params.climbId);
    const {
      item_name,
      category = "technical",
      quantity = 1,
      required = 1,
      packed = 0,
      importance = "recommended",
      estimated_weight_kg = null,
      notes = null,
    } = req.body || {};

    await q(
      `INSERT INTO climb_gear_items
       (climb_id, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes)
       VALUES (:climbId, :item_name, :category, :quantity, :required, :packed, :importance, :estimated_weight_kg, :notes)`,
      { climbId, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes }
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PATCH /api/gear/:id
app.patch("/api/gear/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const allowed = ["item_name","category","quantity","required","packed","importance","estimated_weight_kg","notes"];
    const fields = [];
    const params = { id };

    for (const k of allowed) {
      if (k in req.body) {
        fields.push(`${k} = :${k}`);
        params[k] = req.body[k];
      }
    }
    if (!fields.length) return res.status(400).json({ ok: false, error: "No fields to update" });

    await q(`UPDATE climb_gear_items SET ${fields.join(", ")} WHERE id = :id`, params);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/gear/:id
app.delete("/api/gear/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await q(`DELETE FROM climb_gear_items WHERE id = :id`, { id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/climbs/:climbId/gear/summary
app.get("/api/climbs/:climbId/gear/summary", async (req, res) => {
  try {
    const climbId = Number(req.params.climbId);
    const rows = await q(
      `SELECT
         COALESCE(SUM(CASE WHEN estimated_weight_kg IS NOT NULL
                           THEN estimated_weight_kg * quantity END), 0) AS total_weight_kg,
         COALESCE(SUM(CASE WHEN packed = 1 AND estimated_weight_kg IS NOT NULL
                           THEN estimated_weight_kg * quantity END), 0) AS packed_weight_kg
       FROM climb_gear_items
       WHERE climb_id = :climbId`,
      { climbId }
    );
    const total = Number(rows?.[0]?.total_weight_kg ?? 0);
    const packed = Number(rows?.[0]?.packed_weight_kg ?? 0);
    res.json({
      ok: true,
      totals: {
        total_weight_kg: total,
        packed_weight_kg: packed,
        remaining_weight_kg: Math.max(0, total - packed),
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ===========================
 * MEDICATIONS (CRUD + helpers)
 * =========================== */
// GET /api/medications
app.get("/api/medications", async (_req, res) => {
  try {
    const rows = await q(
      `SELECT
         id,
         created_by_email,
         name,
         dosage,
         indication,
         start_date,
         notes,
         altitude_risk_level,
         medication_database_id,
         created_at,
         updated_at
       FROM user_medications
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json({ ok: true, items: rows });
  } catch (err) {
    console.error("GET /api/medications error:", err);
    res.status(500).json({ ok: false, error: "DB_ERROR_LIST" });
  }
});

// POST /api/medications
app.post("/api/medications", async (req, res) => {
  try {
    const {
      created_by_email = "demo@summit.care",
      name,
      dosage,
      indication,
      start_date = null,
      notes = null,
      altitude_risk_level = "low",
      medication_database_id = null,
    } = req.body || {};

    if (!name || !dosage || !indication) {
      return res.status(400).json({ ok: false, error: "NAME_DOSAGE_INDICATION_REQUIRED" });
    }

    const result = await q(
      `INSERT INTO user_medications
       (created_by_email, name, dosage, indication, start_date, notes, altitude_risk_level, medication_database_id)
       VALUES
       (:created_by_email, :name, :dosage, :indication, :start_date, :notes, :altitude_risk_level, :medication_database_id)`,
      { created_by_email, name, dosage, indication, start_date, notes, altitude_risk_level, medication_database_id }
    );

    const rows = await q(
      `SELECT
         id, created_by_email, name, dosage, indication, start_date, notes,
         altitude_risk_level, medication_database_id, created_at, updated_at
       FROM user_medications
       WHERE id = :id`,
      { id: result.insertId }
    );

    res.status(201).json({ ok: true, item: rows[0] });
  } catch (err) {
    console.error("POST /api/medications error:", err);
    res.status(500).json({ ok: false, error: "DB_ERROR_CREATE" });
  }
});

// PUT /api/medications/:id
app.put("/api/medications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      dosage,
      indication,
      start_date = null,
      notes = null,
      altitude_risk_level = "low",
      medication_database_id = null,
    } = req.body || {};

    await q(
      `UPDATE user_medications
         SET name=:name,
             dosage=:dosage,
             indication=:indication,
             start_date=:start_date,
             notes=:notes,
             altitude_risk_level=:altitude_risk_level,
             medication_database_id=:medication_database_id
       WHERE id=:id`,
      { id, name, dosage, indication, start_date, notes, altitude_risk_level, medication_database_id }
    );

    const rows = await q(
      `SELECT
         id, created_by_email, name, dosage, indication, start_date, notes,
         altitude_risk_level, medication_database_id, created_at, updated_at
       FROM user_medications
       WHERE id = :id`,
      { id }
    );

    res.json({ ok: true, item: rows[0] });
  } catch (err) {
    console.error("PUT /api/medications/:id error:", err);
    res.status(500).json({ ok: false, error: "DB_ERROR_UPDATE" });
  }
});

// DELETE /api/medications/:id
app.delete("/api/medications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await q(`DELETE FROM user_medications WHERE id = :id`, { id });
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/medications/:id error:", err);
    res.status(500).json({ ok: false, error: "DB_ERROR_DELETE" });
  }
});

// GET /api/medication-db?q=...&limit=25
app.get("/api/medication-db", async (req, res) => {
  try {
    const qstr = (req.query.q ?? "").toString().trim();
    const limit = Math.min(100, Number(req.query.limit ?? 25));

    const rows = await q(
      `SELECT id, name, generic_name, category, risk_level, recommendations, created_at, updated_at
       FROM medication_database
       WHERE :q = ''
          OR name LIKE CONCAT('%', :q, '%')
          OR generic_name LIKE CONCAT('%', :q, '%')
       ORDER BY updated_at DESC
       LIMIT :limit`,
      { q: qstr, limit }
    );
    res.json({ ok: true, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/medication-info?name=...
app.get("/api/medication-info", async (req, res) => {
  try {
    const name = (req.query.name ?? "").toString().trim();
    if (!name) return res.json({ ok: true, info: null });

    const rows = await q(
      `SELECT
         md.id,
         md.name,
         md.generic_name,
         md.category,
         md.risk_level,
         md.recommendations
       FROM medication_database md
       WHERE md.name = :name
       LIMIT 1`,
      { name }
    );

    res.json({ ok: true, info: rows[0] || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** -----------------------
 * CLIMBS (user_climbs)
 * ------------------------ */

// GET /api/climbs  (supports ?order=planned_start_date&dir=DESC&limit=5)
app.get("/api/climbs", async (req, res) => {
  try {
    const order = (req.query.order ?? "planned_start_date").toString();
    const dir = (req.query.dir ?? "DESC").toString().toUpperCase() === "ASC" ? "ASC" : "DESC";
    const limit = Math.min(100, Number(req.query.limit ?? 10));

    // allowlist to avoid SQL injection
    const allowedOrder = new Set(["planned_start_date", "created_at", "updated_at", "elevation", "status"]);
    const orderCol = allowedOrder.has(order) ? order : "planned_start_date";

    const rows = await q(
      `SELECT
         id,
         created_by_email,
         mountain_name,
         elevation,
         location,
         planned_start_date,
         duration_days,
         difficulty_level,
         climbing_style,
         group_size,
         emergency_contact,
         weather_concerns,
         special_equipment,
         backpack_name,
         base_pack_weight_kg,
         status,
         notes,
         created_at,
         updated_at
       FROM user_climbs
       ORDER BY ${orderCol} ${dir}
       LIMIT ${limit}`
    );

    res.json({ ok: true, items: rows });
  } catch (e) {
    console.error("GET /api/climbs error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ===========================
 * AI (stub)
 * =========================== */
// POST /api/openai/chat
// Body: { messages: [{role, content}...], model?: string, stream?: boolean, temperature?: number, max_tokens?: number }
app.post("/api/openai/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const {
      messages = [],
      model = process.env.OPENAI_MODEL || "gpt-4o-mini",
      stream = false,
      temperature,
      max_tokens,
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] is required" });
    }

    if (!stream) {
      // Non-streaming response
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
      });
      return res.json({
        id: completion.id,
        model: completion.model,
        usage: completion.usage,
        message: completion.choices?.[0]?.message ?? null,
        raw: completion,
      });
    }

    // --- Streaming with Server-Sent Events (SSE) ---
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const streamResp = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      stream: true,
    });

    for await (const chunk of streamResp) {
      const delta = chunk?.choices?.[0]?.delta?.content ?? "";
      // Send only when we actually get text
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    // Signal stream is done
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (err) {
    // Ensure we don't leave the connection hanging on errors during streaming
    try {
      if (!res.headersSent) {
        res.status(500).json({ error: err?.message ?? "OpenAI call failed" });
      } else {
        res.write(
          `event: error\ndata: ${JSON.stringify({ error: String(err?.message || err) })}\n\n`
        );
        res.end();
      }
    } catch {}
  }
});

app.get("/healthz", (_req, res) => res.type("text/plain").send("ok\n"));

// --- Client Error Logging --------------------------------------------------
import fs from "fs";

app.post("/api/log-client-error", async (req, res) => {
  try {
    const error = req.body?.error ?? null;
    const extra = req.body?.extra ?? null;

    const logEntry = {
      timestamp: new Date().toISOString(),
      error,
      extra,
    };

    // ---- 1) Console (always safe)
    console.error("📜 CLIENT ERROR:", JSON.stringify(logEntry, null, 2));

    // ---- 2) Write to file (optional, safe fallback)
    try {
      const logDir = path.join(process.cwd(), "logs");
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
      const logPath = path.join(logDir, "client-errors.log");

      fs.appendFileSync(logPath, JSON.stringify(logEntry) + "\n");
    } catch (fileErr) {
      console.error("Failed to write error log file:", fileErr);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("log-client-error failed:", err);
    // Even logging errors should not break the app
    res.json({ ok: false });
  }
});

// Keep your existing server listen. Port choice from earlier guidance:
app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
});

export default app;
