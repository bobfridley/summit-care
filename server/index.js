// server/index.js
// Local dev API for Vite app (ESM)

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config.js";
import OpenAI from "openai";
import { q, getPool } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") }); // loads server/.env

const app = express();
const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3003);
const ORIGIN = process.env.VITE_DEV_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// ---------- OpenAI client ----------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Warm up DB pool
try {
  await getPool();
  console.log("DB pool ready");
} catch (e) {
  console.error("DB init error:", e);
}

// ---------- System prompts ----------
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

// ---------- Helpers ----------
function withSystem(system, messages = []) {
  return [{ role: "system", content: system }, ...(messages || [])];
}

// ==================================
// AI ENDPOINTS
// ==================================

// Mountaineering agent
// POST /api/agents/mountaineering
// Body: { messages:[{role,content}], model?, temperature?, max_tokens? }
app.post("/api/agents/mountaineering", async (req, res) => {
  try {
    const { messages = [], model, temperature, max_tokens } = req.body || {};
    if (!messages.length) {
      return res.status(400).json({ error: "messages[] is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const completion = await openai.chat.completions.create({
      model: model || process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: withSystem(SYS_MOUNTAINEERING, messages),
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
  } catch (e) {
    console.error("POST /api/agents/mountaineering error:", e);
    res.status(500).json({ error: e?.message || "agent error" });
  }
});

// Medication advisor agent
// POST /api/agents/medication
// Body: { messages:[{role,content}], meds?, model?, temperature?, max_tokens? }
app.post("/api/agents/medication", async (req, res) => {
  try {
    const { messages = [], meds, model, temperature, max_tokens } = req.body || {};

    if (!messages.length && !meds) {
      return res
        .status(400)
        .json({ error: "messages[] or meds is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const augmented = [...(messages || [])];

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

    const completion = await openai.chat.completions.create({
      model: model || process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: withSystem(SYS_MEDICATION, augmented),
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
  } catch (e) {
    console.error("POST /api/agents/medication error:", e);
    res.status(500).json({ error: e?.message || "agent error" });
  }
});

// Generic chat endpoint (with optional streaming)
// POST /api/openai/chat
// Body: { messages:[{role,content}...], model?, stream?, temperature?, max_tokens? }
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

    // Streaming via SSE
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
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (err) {
    try {
      if (!res.headersSent) {
        res.status(500).json({ error: err?.message ?? "OpenAI call failed" });
      } else {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            error: String(err?.message || err),
          })}\n\n`,
        );
        res.end();
      }
    } catch {}
  }
});

// Build partial UPDATE for gear
function buildGearUpdate(body) {
  const allowedKeys = [
    "item_name",
    "category",
    "importance",
    "quantity",
    "required",
    "packed",
    "estimated_weight_kg",
    "notes",
  ];

  const sets = [];
  const params = [];

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      sets.push(`${key} = ?`);

      if (key === "quantity") {
        params.push(Number(body[key]) || 1);
      } else if (key === "required" || key === "packed") {
        params.push(body[key] ? 1 : 0);
      } else if (key === "estimated_weight_kg") {
        params.push(
          body[key] === "" || body[key] == null ? null : Number(body[key]),
        );
      } else {
        params.push(body[key]);
      }
    }
  }

  return { sets, params };
}

/** -----------------------
 * CLIMBS (user_climbs)
 * ------------------------ */

// GET /api/climbs  (supports ?order=planned_start_date&dir=DESC&limit=5)
app.get("/api/climbs", async (req, res) => {
  try {
    const order = (req.query.order ?? "planned_start_date").toString();
    const dir =
      (req.query.dir ?? "DESC").toString().toUpperCase() === "ASC"
        ? "ASC"
        : "DESC";
    const limit = Math.min(100, Number(req.query.limit ?? 10));

    // allowlist to avoid SQL injection
    const allowedOrder = new Set([
      "planned_start_date",
      "created_at",
      "updated_at",
      "elevation",
      "status",
    ]);
    const orderCol = allowedOrder.has(order)
      ? order
      : "planned_start_date";

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

// POST /api/climbs  (create a new climb)
app.post("/api/climbs", async (req, res) => {
  try {
    const {
      mountain_name,
      elevation,
      location = null,
      planned_start_date,
      duration_days = null,
      difficulty_level = "intermediate",
      climbing_style = "day_hike",
      group_size = null,
      emergency_contact = null,
      weather_concerns = null,
      special_equipment = null,
      backpack_name = null,
      base_pack_weight_kg = null,
      status = "planning",
      notes = null,
      created_by_email = "demo@summit.care",
    } = req.body || {};

    if (!mountain_name || elevation == null || !planned_start_date) {
      return res.status(400).json({
        ok: false,
        error: "MOUNTAIN_ELEVATION_AND_DATE_REQUIRED",
      });
    }

    const result = await q(
      `INSERT INTO user_climbs (
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
         notes
       )
       VALUES (
         :created_by_email,
         :mountain_name,
         :elevation,
         :location,
         :planned_start_date,
         :duration_days,
         :difficulty_level,
         :climbing_style,
         :group_size,
         :emergency_contact,
         :weather_concerns,
         :special_equipment,
         :backpack_name,
         :base_pack_weight_kg,
         :status,
         :notes
       )`,
      {
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
      }
    );

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
       WHERE id = :id`,
      { id: result.insertId }
    );

    res.status(201).json({ ok: true, item: rows[0] || null });
  } catch (e) {
    console.error("POST /api/climbs error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PATCH /api/climbs/:id  (update an existing climb)
app.patch("/api/climbs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "INVALID_ID" });
    }

    const patch = req.body || {};

    const allowedFields = [
      "mountain_name",
      "elevation",
      "location",
      "planned_start_date",
      "duration_days",
      "difficulty_level",
      "climbing_style",
      "group_size",
      "emergency_contact",
      "weather_concerns",
      "special_equipment",
      "backpack_name",
      "base_pack_weight_kg",
      "status",
      "notes",
    ];

    const sets = [];
    const params = { id };

    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) {
        let val = patch[key];

        if (
          ["elevation", "duration_days", "group_size"].includes(key)
        ) {
          if (val === "" || val == null) {
            val = null;
          } else {
            const n = Number(val);
            val = Number.isNaN(n) ? null : n;
          }
        }

        if (key === "base_pack_weight_kg") {
          if (val === "" || val == null) {
            val = null;
          } else {
            const n = Number(val);
            val = Number.isNaN(n) ? null : n;
          }
        }

        sets.push(`${key} = :${key}`);
        params[key] = val;
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({ ok: false, error: "NO_VALID_FIELDS" });
    }

    await q(
      `UPDATE user_climbs
       SET ${sets.join(", ")}, updated_at = NOW()
       WHERE id = :id`,
      params
    );

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
       WHERE id = :id`,
      { id }
    );

    if (!rows[0]) {
      return res.status(404).json({ ok: false, error: "CLIMB_NOT_FOUND" });
    }

    res.json({ ok: true, item: rows[0] });
  } catch (e) {
    console.error("PATCH /api/climbs/:id error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/climbs/:id
app.delete("/api/climbs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "INVALID_ID" });
    }

    const result = await q(
      `DELETE FROM user_climbs WHERE id = :id`,
      { id }
    );

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "CLIMB_NOT_FOUND" });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/climbs/:id error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------------------------------------------------------------------
// Climb Gear API
// Used by: listGear, createGear, updateGear, deleteGear, togglePacked
//
// Endpoints:
//   GET    /api/climbs/:climbId/gear
//   POST   /api/climbs/:climbId/gear
//   PUT    /api/climbs/:climbId/gear/:gearId
//   DELETE /api/climbs/:climbId/gear/:gearId
//   POST   /api/climbs/:climbId/gear/:gearId/toggle-packed
// ---------------------------------------------------------------------

// ---------------------------------------------------------
// Climb gear routes (backed by climb_gear_items)
// ---------------------------------------------------------

// List gear for a climb
app.get("/api/climbs/:climbId/gear", async (req, res) => {
  const climbId = Number(req.params.climbId);
  if (!climbId || Number.isNaN(climbId)) {
    return res.status(400).json({ ok: false, error: "Invalid climbId" });
  }

  try {
    const db = await getPool(); // use your existing pool helper

    const [rows] = await db.query(
      `
      SELECT
        id,
        climb_id,
        item_name,
        category,
        quantity,
        required,
        packed,
        importance,
        estimated_weight_kg,
        notes,
        created_at,
        updated_at
      FROM climb_gear_items
      WHERE climb_id = ?
      ORDER BY category, importance DESC, item_name
      `,
      [climbId]
    );

    const items = rows.map((row) => ({
      ...row,
      required: row.required === 1 || row.required === true,
      packed: row.packed === 1 || row.packed === true,
    }));

    return res.json({ ok: true, items });
  } catch (err) {
    console.error("[Gear] Error listing gear:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to list gear items",
      detail: err.message || String(err),
    });
  }
});

// Create a gear item for a climb
app.post("/api/climbs/:climbId/gear", async (req, res) => {
  const climbId = Number(req.params.climbId);
  if (!climbId || Number.isNaN(climbId)) {
    return res.status(400).json({ ok: false, error: "Invalid climbId" });
  }

  const {
    item_name,
    category = "safety",
    quantity = 1,
    required = true,
    packed = false,
    importance = "recommended",
    estimated_weight_kg = null,
    notes = null,
  } = req.body || {};

  if (!item_name || typeof item_name !== "string") {
    return res.status(400).json({ ok: false, error: "item_name is required" });
  }

  try {
    const db = await getPool();

    const [result] = await db.query(
      `
      INSERT INTO climb_gear_items
        (climb_id, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        climbId,
        item_name,
        category,
        Number(quantity) || 1,
        required ? 1 : 0,
        packed ? 1 : 0,
        importance,
        estimated_weight_kg == null || estimated_weight_kg === ""
          ? null
          : Number(estimated_weight_kg),
        notes,
      ]
    );

    return res.status(201).json({
      ok: true,
      id: result.insertId,
    });
  } catch (err) {
    console.error("[Gear] Error creating gear item:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to create gear item",
      detail: err.message || String(err),
    });
  }
});

// Update a gear item (partial update)
app.put("/api/climbs/:climbId/gear/:gearId", async (req, res) => {
  const climbId = Number(req.params.climbId);
  const gearId = Number(req.params.gearId);
  if (!climbId || Number.isNaN(climbId) || !gearId || Number.isNaN(gearId)) {
    return res.status(400).json({ ok: false, error: "Invalid climbId or gearId" });
  }

  const allowedFields = [
    "item_name",
    "category",
    "quantity",
    "required",
    "packed",
    "importance",
    "estimated_weight_kg",
    "notes",
  ];

  const updates = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
      let value = req.body[field];

      if (field === "quantity") {
        value = Number(value) || 1;
      }
      if (field === "required" || field === "packed") {
        value = value ? 1 : 0;
      }
      if (field === "estimated_weight_kg") {
        value = value === "" || value == null ? null : Number(value);
      }

      updates.push(`${field} = ?`);
      params.push(value);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ ok: false, error: "No valid fields to update" });
  }

  params.push(gearId, climbId); // WHERE id = ? AND climb_id = ?

  try {
    const db = await getPool();
    const [result] = await db.query(
      `
      UPDATE climb_gear_items
      SET ${updates.join(", ")}
      WHERE id = ? AND climb_id = ?
      `,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Gear item not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[Gear] Error updating gear item:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to update gear item",
      detail: err.message || String(err),
    });
  }
});

// Partial update (PATCH) a gear item – mirrors the PUT handler
app.patch("/api/climbs/:climbId/gear/:gearId", async (req, res) => {
  const climbId = Number(req.params.climbId);
  const gearId = Number(req.params.gearId);
  if (!climbId || Number.isNaN(climbId) || !gearId || Number.isNaN(gearId)) {
    return res
      .status(400)
      .json({ ok: false, error: "Invalid climbId or gearId" });
  }

  const allowedFields = [
    "item_name",
    "category",
    "quantity",
    "required",
    "packed",
    "importance",
    "estimated_weight_kg",
    "notes",
  ];

  const updates = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
      let value = req.body[field];

      if (field === "quantity") {
        value = Number(value) || 1;
      }
      if (field === "required" || field === "packed") {
        value = value ? 1 : 0;
      }
      if (field === "estimated_weight_kg") {
        value = value === "" || value == null ? null : Number(value);
      }

      updates.push(`${field} = ?`);
      params.push(value);
    }
  }

  if (updates.length === 0) {
    return res
      .status(400)
      .json({ ok: false, error: "No valid fields to update" });
  }

  // WHERE id = ? AND climb_id = ?
  params.push(gearId, climbId);

  try {
    const db = await getPool();
    const [result] = await db.query(
      `
      UPDATE climb_gear_items
      SET ${updates.join(", ")}
      WHERE id = ? AND climb_id = ?
      `,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Gear item not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[Gear] Error PATCH-updating gear item:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to update gear item",
      detail: err.message || String(err),
    });
  }
});

// Delete a gear item
app.delete("/api/climbs/:climbId/gear/:gearId", async (req, res) => {
  const climbId = Number(req.params.climbId);
  const gearId = Number(req.params.gearId);
  if (!climbId || Number.isNaN(climbId) || !gearId || Number.isNaN(gearId)) {
    return res.status(400).json({ ok: false, error: "Invalid climbId or gearId" });
  }

  try {
    const db = await getPool();
    const [result] = await db.query(
      `
      DELETE FROM climb_gear_items
      WHERE id = ? AND climb_id = ?
      `,
      [gearId, climbId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Gear item not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[Gear] Error deleting gear item:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to delete gear item",
      detail: err.message || String(err),
    });
  }
});

// Toggle packed flag
app.post("/api/climbs/:climbId/gear/:gearId/toggle-packed", async (req, res) => {
  const climbId = Number(req.params.climbId);
  const gearId = Number(req.params.gearId);
  const { packed } = req.body || {};

  if (!climbId || Number.isNaN(climbId) || !gearId || Number.isNaN(gearId)) {
    return res.status(400).json({ ok: false, error: "Invalid climbId or gearId" });
  }

  const packedVal = packed ? 1 : 0;

  try {
    const db = await getPool();
    const [result] = await db.query(
      `
      UPDATE climb_gear_items
      SET packed = ?
      WHERE id = ? AND climb_id = ?
      `,
      [packedVal, gearId, climbId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Gear item not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[Gear] Error toggling packed flag:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to toggle packed status",
      detail: err.message || String(err),
    });
  }
});

// ==================================
// MEDICATIONS (user_medications)
// ==================================

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
       LIMIT 200`,
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
      return res
        .status(400)
        .json({ ok: false, error: "NAME_DOSAGE_INDICATION_REQUIRED" });
    }

    const result = await q(
      `INSERT INTO user_medications
       (created_by_email, name, dosage, indication, start_date, notes, altitude_risk_level, medication_database_id)
       VALUES
       (:created_by_email, :name, :dosage, :indication, :start_date, :notes, :altitude_risk_level, :medication_database_id)`,
      {
        created_by_email,
        name,
        dosage,
        indication,
        start_date,
        notes,
        altitude_risk_level,
        medication_database_id,
      },
    );

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
       WHERE id = :id`,
      { id: result.insertId },
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
       SET name = :name,
           dosage = :dosage,
           indication = :indication,
           start_date = :start_date,
           notes = :notes,
           altitude_risk_level = :altitude_risk_level,
           medication_database_id = :medication_database_id
       WHERE id = :id`,
      {
        id,
        name,
        dosage,
        indication,
        start_date,
        notes,
        altitude_risk_level,
        medication_database_id,
      },
    );

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
       WHERE id = :id`,
      { id },
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

// Medication DB search
// GET /api/medication-db?q=...&limit=25
app.get("/api/medication-db", async (req, res) => {
  try {
    const qstr = (req.query.q ?? "").toString().trim();
    const limit = Math.min(100, Number(req.query.limit ?? 25));

    const rows = await q(
      `SELECT
         id,
         name,
         generic_name,
         category,
         risk_level,
         recommendations,
         created_at,
         updated_at
       FROM medication_database
       WHERE :q = ''
          OR name LIKE CONCAT('%', :q, '%')
          OR generic_name LIKE CONCAT('%', :q, '%')
       ORDER BY updated_at DESC
       LIMIT :limit`,
      { q: qstr, limit },
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
      { name },
    );

    res.json({ ok: true, info: rows[0] || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ==================================
// CLIENT ERROR LOGGING + HEALTH
// ==================================

app.post("/api/log-client-error", async (req, res) => {
  try {
    const error = req.body?.error ?? null;
    const extra = req.body?.extra ?? null;

    const logEntry = {
      timestamp: new Date().toISOString(),
      error,
      extra,
    };

    console.error("📜 CLIENT ERROR:", JSON.stringify(logEntry, null, 2));

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
    res.json({ ok: false });
  }
});

app.get("/healthz", (_req, res) => res.type("text/plain").send("ok\n"));

// ---------------------------------------------------------------------
// Fallback 404
// ---------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "Not found",
    path: req.originalUrl,
  });
});

// ==================================
// START SERVER
// ==================================
app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
});

export default app;
