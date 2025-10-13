
import React, { useState, useEffect } from "react";
// Removed: import { Climb } from "@/api/entities";
import { mysqlClimbs } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Plus, Mountain, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ClimbForm from "../components/climbs/ClimbForm";
import ClimbCard from "../components/climbs/ClimbCard";

export default function ClimbsPage() {
  const [climbs, setClimbs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClimb, setEditingClimb] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoFilling, setIsAutoFilling] = useState(false); // Keep this state, even if not directly used by this button anymore

  useEffect(() => {
    loadClimbs();
  }, []);

  const loadClimbs = async () => {
    setIsLoading(true);
    try {
      const { data } = await mysqlClimbs({ action: "list", order: "planned_start_date", dir: "DESC", include_gear: true });
      setClimbs(data?.ok ? (data.items || []) : []);
    } catch (error) {
      console.error("Error loading climbs:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (climbData) => {
    try {
      if (editingClimb) {
        const { data } = await mysqlClimbs({ action: "update", id: editingClimb.id, payload: climbData });
        if (!data?.ok) console.error("Update failed:", data?.error || "unknown");
      } else {
        const { data } = await mysqlClimbs({ action: "create", payload: climbData });
        if (!data?.ok) console.error("Create failed:", data?.error || "unknown");
      }
      setShowForm(false);
      setEditingClimb(null);
      loadClimbs();
    } catch (error) {
      console.error("Error saving climb:", error);
    }
  };

  const handleEdit = (climb) => {
    setEditingClimb(climb);
    setShowForm(true);
  };

  const handleDelete = async (climbId) => {
    try {
      const { data } = await mysqlClimbs({ action: "delete", id: climbId });
      if (!data?.ok) console.error("Delete failed:", data?.error || "unknown");
      loadClimbs();
    } catch (error) {
      console.error("Error deleting climb:", error);
    }
  };

  // Generate recommended gear based on climb attributes
  const generateGearForClimb = (climb) => {
    const base = [
      { item_name: "First Aid Kit", category: "health", quantity: 1, required: true, packed: false, importance: "critical", estimated_weight_kg: 0.25, notes: "" },
      { item_name: "Water (3L)", category: "food_water", quantity: 1, required: true, packed: false, importance: "critical", estimated_weight_kg: 3.0, notes: "Hydration system or bottles" },
      { item_name: "Nutrition (energy bars/gels)", category: "food_water", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 0.5, notes: "" },
      { item_name: "Map & Compass or GPS", category: "navigation", quantity: 1, required: true, packed: false, importance: "critical", estimated_weight_kg: 0.15, notes: "" },
      { item_name: "Headlamp", category: "technical", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 0.1, notes: "With spare batteries" },
      { item_name: "Insulating Layer", category: "clothing", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 0.4, notes: "Fleece or puffy" },
      { item_name: "Shell (Jacket)", category: "clothing", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 0.35, notes: "Water/wind resistant" },
      { item_name: "Gloves & Hat", category: "clothing", quantity: 1, required: true, packed: false, importance: "recommended", estimated_weight_kg: 0.2, notes: "" },
      { item_name: "Trekking Poles", category: "technical", quantity: 1, required: false, packed: false, importance: "optional", estimated_weight_kg: 0.6, notes: "" },
    ];

    const gear = [...base];

    // Define common flags for easier condition checking
    const technical = climb.climbing_style === "technical_climb";
    const highElevation = (climb.elevation || 0) >= 10000; // Adjusted threshold
    const text = `${climb.weather_concerns || ""} ${climb.special_equipment || ""}`.toLowerCase();
    const mentionsSnowOrIce = /snow|ice|glacier|mixed|nevé|winter/.test(text);
    const advancedDifficulty = ["advanced", "expert", "extreme"].includes(climb.difficulty_level || "");

    // Footwear: hiking or mountaineering boots
    if (technical || highElevation) {
      gear.push(
        { item_name: "Mountaineering Boots", category: "clothing", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 1.8, notes: "" },
      );
    } else {
      gear.push(
        { item_name: "Hiking Boots", category: "clothing", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 1.2, notes: "" },
      );
    }

    // Duration
    if (climb.duration_days && climb.duration_days >= 2) {
      gear.push(
        { item_name: "Tent or Bivy", category: "camping", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 2.0, notes: "" },
        { item_name: "Sleeping Bag", category: "camping", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 1.2, notes: "Appropriate temp rating" },
        { item_name: "Sleeping Pad", category: "camping", quantity: 1, required: true, packed: false, importance: "recommended", estimated_weight_kg: 0.5, notes: "" },
        { item_name: "Stove & Fuel", category: "food_water", quantity: 1, required: true, packed: false, importance: "recommended", estimated_weight_kg: 0.4, notes: "" },
        { item_name: "Cook Kit", category: "food_water", quantity: 1, required: true, packed: false, importance: "recommended", estimated_weight_kg: 0.3, notes: "" }
      );
    }

    // Style: technical climbing kit
    if (technical) {
      gear.push(
        { item_name: "Helmet", category: "safety", quantity: 1, required: true, packed: false, importance: "critical", estimated_weight_kg: 0.35, notes: "" },
        { item_name: "Harness", category: "technical", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 0.4, notes: "" },
        { item_name: "Belay Device & Locking Carabiners", category: "technical", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 0.25, notes: "" },
        { item_name: "Rope (60m)", category: "technical", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 3.5, notes: "" },
        { item_name: "Quickdraws (8–12)", category: "technical", quantity: 1, required: false, packed: false, importance: "recommended", estimated_weight_kg: 1.0, notes: "" },
        { item_name: "Protection (nuts/cams)", category: "technical", quantity: 1, required: false, packed: false, importance: "recommended", estimated_weight_kg: 1.5, notes: "" }
      );
    }

    // Snow/ice considerations
    // Traction: Microspikes
    if (highElevation || mentionsSnowOrIce) {
      gear.push(
        { item_name: "Microspikes", category: "technical", quantity: 1, required: false, packed: false, importance: "recommended", estimated_weight_kg: 0.4, notes: "" }
      );
    }
    // Traction: Crampons for steeper/technical or very high
    if (technical || (climb.elevation || 0) >= 11000 || /crampon/.test(text)) {
      gear.push(
        { item_name: "Crampons", category: "technical", quantity: 1, required: false, packed: false, importance: "recommended", estimated_weight_kg: 0.9, notes: "" }
      );
    }
    // Axe/tools
    if (technical || mentionsSnowOrIce || (climb.elevation || 0) >= 11000) {
      gear.push(
        { item_name: "Ice Axe", category: "technical", quantity: 1, required: false, packed: false, importance: "recommended", estimated_weight_kg: 0.5, notes: "If steep snow" }
      );
    }
    // Ice Tools for advanced ice/mixed climbing
    if (technical && (/ice|mixed/.test(text) || advancedDifficulty)) {
      gear.push(
        { item_name: "Ice Tools (pair)", category: "technical", quantity: 1, required: false, packed: false, importance: "optional", estimated_weight_kg: 1.2, notes: "" }
      );
    }

    // Gaiters if snow or wet conditions are expected
    if (mentionsSnowOrIce || highElevation) {
      gear.push(
        { item_name: "Gaiters", category: "clothing", quantity: 1, required: false, packed: false, importance: "optional", estimated_weight_kg: 0.25, notes: "" }
      );
    }

    // Weather notes escalation
    if ((climb.weather_concerns || "").toLowerCase().includes("storm")) {
      gear.push(
        { item_name: "Extra Layers", category: "clothing", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 0.6, notes: "Storm/insulation" }
      );
    }

    // Group safety
    if (climb.group_size && climb.group_size > 2) {
      gear.push(
        { item_name: "Group Emergency Shelter", category: "safety", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 0.9, notes: "" }
      );
    }

    // Deduplicate by item_name (case-insensitive)
    const seen = new Set();
    return gear.filter(g => {
      const key = (g.item_name || "").toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Default catalog for weights/importance/category to backfill existing items
  const normalizeName = (s) => (s || "").toLowerCase().replace(/[^\w]+/g, " ").trim();

  const defaultItemCatalog = new Map([
    ["first aid kit", { estimated_weight_kg: 0.25, importance: "critical", category: "health" }],
    ["water 3l", { estimated_weight_kg: 3.0, importance: "critical", category: "food_water" }],
    ["nutrition energy bars gels", { estimated_weight_kg: 0.5, importance: "high", category: "food_water" }],
    ["map compass or gps", { estimated_weight_kg: 0.15, importance: "critical", category: "navigation" }],
    ["headlamp", { estimated_weight_kg: 0.1, importance: "high", category: "technical" }],
    ["insulating layer", { estimated_weight_kg: 0.4, importance: "high", category: "clothing" }],
    ["shell jacket", { estimated_weight_kg: 0.35, importance: "high", category: "clothing" }],
    ["gloves hat", { estimated_weight_kg: 0.2, importance: "recommended", category: "clothing" }],
    ["trekking poles", { estimated_weight_kg: 0.6, importance: "optional", category: "technical" }],
    ["hiking boots", { estimated_weight_kg: 1.2, importance: "high", category: "clothing" }],
    ["mountaineering boots", { estimated_weight_kg: 1.8, importance: "high", category: "clothing" }],
    ["tent or bivy", { estimated_weight_kg: 2.0, importance: "high", category: "camping" }],
    ["sleeping bag", { estimated_weight_kg: 1.2, importance: "high", category: "camping" }],
    ["sleeping pad", { estimated_weight_kg: 0.5, importance: "recommended", category: "camping" }],
    ["stove fuel", { estimated_weight_kg: 0.4, importance: "recommended", category: "food_water" }],
    ["cook kit", { estimated_weight_kg: 0.3, importance: "recommended", category: "food_water" }],
    ["helmet", { estimated_weight_kg: 0.35, importance: "critical", category: "safety" }],
    ["harness", { estimated_weight_kg: 0.4, importance: "high", category: "technical" }],
    ["belay device locking carabiners", { estimated_weight_kg: 0.25, importance: "high", category: "technical" }],
    ["rope 60m", { estimated_weight_kg: 3.5, importance: "high", category: "technical" }],
    ["quickdraws 8 12", { estimated_weight_kg: 1.0, importance: "recommended", category: "technical" }],
    ["protection nuts cams", { estimated_weight_kg: 1.5, importance: "recommended", category: "technical" }],
    ["microspikes", { estimated_weight_kg: 0.4, importance: "recommended", category: "technical" }],
    ["micro spikes", { estimated_weight_kg: 0.4, importance: "recommended", category: "technical" }],
    ["crampons", { estimated_weight_kg: 0.9, importance: "recommended", category: "technical" }],
    ["ice axe", { estimated_weight_kg: 0.5, importance: "recommended", category: "technical" }],
    ["ice tools pair", { estimated_weight_kg: 1.2, importance: "optional", category: "technical" }],
    ["gaiters", { estimated_weight_kg: 0.25, importance: "optional", category: "clothing" }],
    ["extra layers", { estimated_weight_kg: 0.6, importance: "high", category: "clothing" }],
    ["group emergency shelter", { estimated_weight_kg: 0.9, importance: "high", category: "safety" }],
  ]);

  const getDefaultsForItem = (nameRaw = "") => {
    const n = normalizeName(nameRaw);
    if (defaultItemCatalog.has(n)) return defaultItemCatalog.get(n);

    // Heuristics for common variants
    if (n.includes("water")) return { estimated_weight_kg: 3.0, importance: "critical", category: "food_water" };
    if (n.includes("quickdraw")) return { estimated_weight_kg: 1.0, importance: "recommended", category: "technical" };
    if (n.includes("rope")) return { estimated_weight_kg: 3.5, importance: "high", category: "technical" };
    if (n.includes("crampon")) return { estimated_weight_kg: 0.9, importance: "recommended", category: "technical" };
    if (n.includes("micro") && n.includes("spike")) return { estimated_weight_kg: 0.4, importance: "recommended", category: "technical" };
    if (n.includes("ice axe")) return { estimated_weight_kg: 0.5, importance: "recommended", category: "technical" };
    if (n.includes("gaiter")) return { estimated_weight_kg: 0.25, importance: "optional", category: "clothing" };

    return null;
  };

  const backfillGearItem = (item = {}) => {
    const defaults = getDefaultsForItem(item.item_name);
    if (!defaults) return item;

    const updated = { ...item };
    if (!(typeof updated.estimated_weight_kg === "number" && updated.estimated_weight_kg > 0)) {
      updated.estimated_weight_kg = defaults.estimated_weight_kg;
    }
    if (!updated.importance) {
      updated.importance = defaults.importance;
    }
    if (!updated.category) {
      updated.category = defaults.category;
    }
    return updated;
  };

  const handleAutoFill = async () => { // Keep this handler as per instructions
    setIsAutoFilling(true);
    try {
      await Promise.all(
        (climbs || []).map(async (c) => {
          const recommended = generateGearForClimb(c);
          const existing = Array.isArray(c.required_gear) ? c.required_gear : [];

          let backfillCount = 0;
          const existingBackfilled = existing.map((item) => {
            const updated = backfillGearItem(item);
            const changed =
              (Number(updated.estimated_weight_kg || 0) !== Number(item.estimated_weight_kg || 0)) ||
              (updated.importance || "") !== (item.importance || "") ||
              (updated.category || "") !== (item.category || "");
            if (changed) backfillCount += 1;
            return updated;
          });

          const existingNames = new Set(existingBackfilled.map(i => normalizeName(i?.item_name)));
          const additions = recommended.filter(r => !existingNames.has(normalizeName(r.item_name)));
          const merged = existingBackfilled.concat(additions);

          if (additions.length > 0 || backfillCount > 0) {
            const { data } = await mysqlClimbs({ action: "update", id: c.id, payload: { required_gear: merged } });
            if (!data?.ok) console.error("Autofill update failed:", data?.error || "unknown");
          }
        })
      );
      await loadClimbs();
    } catch (e) {
      console.error("Auto-fill gear failed:", e);
    }
    setIsAutoFilling(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">My Climbs</h1>
            <p className="text-text-secondary text-lg">Plan and track your mountaineering expeditions</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("ClimbGear")}>
              <Button 
                variant="outline"
                disabled={isLoading}
                className="shadow-sm"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                Update Gear
              </Button>
            </Link>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="mountain-gradient hover:opacity-90 transition-opacity shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Plan New Climb
            </Button>
          </div>
        </div>

        {showForm && (
          <ClimbForm
            climb={editingClimb}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingClimb(null);
            }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-xl animate-pulse shadow-sm" />
            ))
          ) : climbs.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Mountain className="w-20 h-20 text-secondary-blue mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-semibold text-text-primary mb-4">No climbs planned yet</h3>
              <p className="text-text-secondary mb-6 text-lg">Start planning your next mountaineering adventure</p>
              <Button 
                onClick={() => setShowForm(true)}
                className="mountain-gradient hover:opacity-90 transition-opacity shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Plan Your First Climb
              </Button>
            </div>
          ) : (
            climbs.map((climb) => (
              <ClimbCard
                key={climb.id}
                climb={climb}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
