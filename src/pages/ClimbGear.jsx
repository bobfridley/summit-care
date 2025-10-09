
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Mountain, ArrowLeft, Save, Wand2 } from "lucide-react";
import GearEditor from "../components/climbs/GearEditor";
import PackWeightSummary from "../components/climbs/PackWeightSummary";
import { mysqlClimbs } from "@/api/functions";

export default function ClimbGear() {
  const urlParams = new URLSearchParams(window.location.search);
  const climbId = urlParams.get("climbId");

  const [isLoading, setIsLoading] = useState(true);
  const [climb, setClimb] = useState(null);
  const [climbs, setClimbs] = useState([]);
  const [gear, setGear] = useState([]);
  const [backpackName, setBackpackName] = useState("");
  const [basePackWeightKg, setBasePackWeightKg] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      if (climbId) {
        const { data } = await mysqlClimbs({ action: "get", id: Number(climbId) });
        const c = data?.ok ? data.item : null;
        setClimb(c);
        setGear(Array.isArray(c?.required_gear) ? c.required_gear : []);
        setBackpackName(c?.backpack_name || "");
        setBasePackWeightKg(Number(c?.base_pack_weight_kg || 0));
      } else {
        const { data } = await mysqlClimbs({ action: "list", order: "planned_start_date", dir: "DESC" });
        setClimbs(data?.ok ? (data.items || []) : []);
      }
      setIsLoading(false);
    };
    load();
  }, [climbId]);

  // Defaults catalog (weights in kg) for backfilling
  const normalizeName = (s) => (s || "").toLowerCase().replace(/[^\w]+/g, " ").trim();
  const defaultItemCatalog = useMemo(() => new Map([
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
  ]), []);

  const getDefaultsForItem = (nameRaw = "") => {
    const n = normalizeName(nameRaw);
    if (defaultItemCatalog.has(n)) return defaultItemCatalog.get(n);
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
    if (!updated.importance) updated.importance = defaults.importance;
    if (!updated.category) updated.category = defaults.category;
    return updated;
  };

  const generateRecommendedGear = (c) => {
    const technical = c?.climbing_style === "technical_climb";
    const highElevation = (c?.elevation || 0) >= 10000;
    const text = `${c?.weather_concerns || ""} ${c?.special_equipment || ""}`.toLowerCase();
    const mentionsSnowOrIce = /snow|ice|glacier|mixed|nevé|winter/.test(text);
    const advancedDifficulty = ["advanced", "expert", "extreme"].includes(c?.difficulty_level || "");

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

    // Footwear
    if (technical || highElevation) {
      gear.push({ item_name: "Mountaineering Boots", category: "clothing", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 1.8, notes: "" });
    } else {
      gear.push({ item_name: "Hiking Boots", category: "clothing", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 1.2, notes: "" });
    }

    // Duration
    if (c?.duration_days && c.duration_days >= 2) {
      gear.push(
        { item_name: "Tent or Bivy", category: "camping", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 2.0, notes: "" },
        { item_name: "Sleeping Bag", category: "camping", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 1.2, notes: "Appropriate temp rating" },
        { item_name: "Sleeping Pad", category: "camping", quantity: 1, required: true, packed: false, importance: "recommended", estimated_weight_kg: 0.5, notes: "" },
        { item_name: "Stove & Fuel", category: "food_water", quantity: 1, required: true, packed: false, importance: "recommended", estimated_weight_kg: 0.4, notes: "" },
        { item_name: "Cook Kit", category: "food_water", quantity: 1, required: true, packed: false, importance: "recommended", estimated_weight_kg: 0.3, notes: "" }
      );
    }

    // Technical kit
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

    // Snow/ice
    const highish = (c?.elevation || 0) >= 11000 || mentionsSnowOrIce || technical || advancedDifficulty;
    if (highElevation || mentionsSnowOrIce) {
      gear.push({ item_name: "Microspikes", category: "technical", quantity: 1, required: false, packed: false, importance: "recommended", estimated_weight_kg: 0.4, notes: "" });
    }
    if (highish) {
      gear.push({ item_name: "Crampons", category: "technical", quantity: 1, required: false, packed: false, importance: "recommended", estimated_weight_kg: 0.9, notes: "" });
      gear.push({ item_name: "Ice Axe", category: "technical", quantity: 1, required: false, packed: false, importance: "recommended", estimated_weight_kg: 0.5, notes: "If steep snow" });
    }
    if (technical && (/ice|mixed/.test(text) || advancedDifficulty)) {
      gear.push({ item_name: "Ice Tools (pair)", category: "technical", quantity: 1, required: false, packed: false, importance: "optional", estimated_weight_kg: 1.2, notes: "" });
    }
    if (mentionsSnowOrIce || highElevation) {
      gear.push({ item_name: "Gaiters", category: "clothing", quantity: 1, required: false, packed: false, importance: "optional", estimated_weight_kg: 0.25, notes: "" });
    }

    if ((c?.weather_concerns || "").toLowerCase().includes("storm")) {
      gear.push({ item_name: "Extra Layers", category: "clothing", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 0.6, notes: "Storm/insulation" });
    }

    if (c?.group_size && c.group_size > 2) {
      gear.push({ item_name: "Group Emergency Shelter", category: "safety", quantity: 1, required: true, packed: false, importance: "high", estimated_weight_kg: 0.9, notes: "" });
    }

    // Deduplicate
    const seen = new Set();
    return gear.filter((g) => {
      const key = normalizeName(g.item_name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const mergeRecommended = () => {
    if (!climb) return;
    setIsAutofilling(true);
    const recommended = generateRecommendedGear(climb);
    const existing = Array.isArray(gear) ? gear.map(backfillGearItem) : [];
    const existingNames = new Set(existing.map((i) => normalizeName(i?.item_name)));
    const additions = recommended.filter((r) => !existingNames.has(normalizeName(r.item_name)));
    const merged = existing.concat(additions);
    setGear(merged);
    setIsAutofilling(false);
  };

  const onSave = async () => {
    if (!climb) return;
    setIsSaving(true);
    const { data } = await mysqlClimbs({
      action: "update",
      id: climb.id,
      payload: {
        required_gear: gear,
        backpack_name: backpackName,
        base_pack_weight_kg: Number(basePackWeightKg) || 0
      }
    });
    setIsSaving(false);
  };

  if (!climbId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl("Climbs")} className="text-text-secondary hover:text-text-primary">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Select a climb to manage gear</h1>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array(6).fill(0).map((_, i) => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)
              : climbs.map((c) => (
                  <Card key={c.id} className="alpine-card border-0 shadow-md">
                    <CardHeader className="border-b border-stone-100">
                      <CardTitle className="text-base font-semibold text-text-primary flex items-center gap-2">
                        <Mountain className="w-5 h-5 text-primary-blue" />
                        {c.mountain_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="text-sm text-text-secondary">
                        {(c.elevation || 0).toLocaleString()} ft
                      </div>
                      <Link to={createPageUrl(`ClimbGear?climbId=${c.id}`)}>
                        <Button className="mountain-gradient hover:opacity-90 transition-opacity">Manage Gear</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Climbs")} className="text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
              {isLoading ? "Loading..." : `Gear — ${climb?.mountain_name || ""}`}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={mergeRecommended}
              disabled={isLoading || isAutofilling}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isAutofilling ? "Adding..." : "Autofill recommendations"}
            </Button>
            <Button
              className="mountain-gradient hover:opacity-90 transition-opacity"
              onClick={onSave}
              disabled={isLoading || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <Card className="alpine-card border-0 shadow-lg">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-lg font-semibold text-text-primary">Pack Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Backpack</Label>
                  <Input
                    value={backpackName}
                    onChange={(e) => setBackpackName(e.target.value)}
                    placeholder="e.g. Osprey Exos 48"
                    className="border-stone-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Base Pack Weight (kg)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={basePackWeightKg}
                    onChange={(e) => setBasePackWeightKg(parseFloat(e.target.value || "0"))}
                    placeholder="e.g. 1.2"
                    className="border-stone-200"
                  />
                </div>
              </div>
            )}
            <div>
              <PackWeightSummary gear={gear} basePackWeightKg={basePackWeightKg} />
            </div>
          </CardContent>
        </Card>

        <GearEditor gear={gear} onChange={setGear} />
      </div>
    </div>
  );
}
