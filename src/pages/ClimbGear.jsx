import React, { useEffect, useMemo, useState } from "react";
import { fetchGear as listGear, createGear, updateGear, deleteGear, togglePacked } from "@/api/functions";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Ruler, PackageCheck, PackageOpen, Scale } from "lucide-react";

// Enum options mirrored from your MySQL table
const CATEGORIES = [
  "safety", "clothing", "technical", "camping", "navigation", "health", "food_water", "other",
];

const IMPORTANCE = ["critical", "high", "recommended", "optional"];

/**
 * Usage:
 * - Navigate to /climbgear?climbId=123
 *   or render <ClimbGear /> and pass `climbId` via prop.
 */
export default function ClimbGear({ climbId: climbIdProp }) {
  const [items, setItems] = useState([]);
  const [sum, setSum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // form state for quick-add
  const [newItem, setNewItem] = useState({
    item_name: "",
    category: "technical",
    importance: "recommended",
    quantity: 1,
    required: true,
    packed: false,
    estimated_weight_kg: "",
    notes: "",
  });

  // Accept climbId from prop or querystring
  const climbId = useMemo(() => {
    if (climbIdProp) return climbIdProp;
    const u = new URL(window.location.href);
    const v = u.searchParams.get("climbId");
    return v ? Number(v) : null;
  }, [climbIdProp]);

  async function refresh() {
    if (!climbId) {
      setErr("Missing climbId (pass ?climbId=123 or via prop).");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErr("");
      const [{ data: gearRes }, { data: sumRes }] = await Promise.all([
        listGear(climbId),
        gearSummary(climbId),
      ]);

      if (gearRes?.ok) setItems(gearRes.items ?? []);
      else setErr(gearRes?.error || "Failed to load gear");

      if (sumRes?.ok) setSum(sumRes);
      else setErr((e) => e || sumRes?.error || "Failed to load summary");
    } catch (e) {
      setErr(e.message || "Failed to load gear");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [climbId]);

  const handleQuickAdd = async () => {
    if (!newItem.item_name.trim()) return;
    try {
      const payload = {
        ...newItem,
        quantity: Number(newItem.quantity) || 1,
        required: newItem.required ? 1 : 0,
        packed: newItem.packed ? 1 : 0,
        estimated_weight_kg: newItem.estimated_weight_kg === "" ? null : Number(newItem.estimated_weight_kg),
      };
      await createGear(climbId, payload);
      setNewItem({
        item_name: "",
        category: "technical",
        importance: "recommended",
        quantity: 1,
        required: true,
        packed: false,
        estimated_weight_kg: "",
        notes: "",
      });
      refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  const togglePacked = async (it) => {
    await updateGear(it.id, { packed: it.packed ? 0 : 1 });
    refresh();
  };

  const updateQty = async (it, q) => {
    const n = Math.max(1, Number(q) || 1);
    await updateGear(it.id, { quantity: n });
    refresh();
  };

  const updateWeight = async (it, w) => {
    const val = w === "" ? null : Number(w);
    await updateGear(it.id, { estimated_weight_kg: val });
    refresh();
  };

  const removeItem = async (id) => {
    await deleteGear(id);
    refresh();
  };

  const totalKg = Number(sum?.totals?.total_weight_kg ?? 0);
  const packedKg = Number(sum?.totals?.packed_weight_kg ?? 0);
  const remainKg = Number(sum?.totals?.remaining_weight_kg ?? 0);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <Card className="alpine-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-primary-blue" />
            Climb Gear {climbId ? <span className="text-stone-500 text-sm">• climb #{climbId}</span> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div>Loading gear…</div>
          ) : err ? (
            <div className="text-red-600">{err}</div>
          ) : (
            <>
              {/* Quick Add */}
              <div className="grid md:grid-cols-6 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-stone-600">Item name</label>
                  <Input
                    placeholder="Ice Axe"
                    value={newItem.item_name}
                    onChange={(e) => setNewItem((s) => ({ ...s, item_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600">Category</label>
                  <Select
                    value={newItem.category}
                    onValueChange={(v) => setNewItem((s) => ({ ...s, category: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600">Importance</label>
                  <Select
                    value={newItem.importance}
                    onValueChange={(v) => setNewItem((s) => ({ ...s, importance: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IMPORTANCE.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600">Qty</label>
                  <Input
                    type="number"
                    min={1}
                    value={newItem.quantity}
                    onChange={(e) => setNewItem((s) => ({ ...s, quantity: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={newItem.required}
                      onCheckedChange={(v) => setNewItem((s) => ({ ...s, required: !!v }))}
                    />
                    <span className="text-sm">Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={newItem.packed}
                      onCheckedChange={(v) => setNewItem((s) => ({ ...s, packed: !!v }))}
                    />
                    <span className="text-sm">Packed</span>
                  </div>
                </div>
                <div className="md:col-span-6 flex items-center gap-2">
                  <Input
                    className="max-w-[12rem]"
                    type="number"
                    step="0.01"
                    placeholder="Weight (kg)"
                    value={newItem.estimated_weight_kg}
                    onChange={(e) => setNewItem((s) => ({ ...s, estimated_weight_kg: e.target.value }))}
                  />
                  <Input
                    placeholder="Notes (optional)"
                    value={newItem.notes}
                    onChange={(e) => setNewItem((s) => ({ ...s, notes: e.target.value }))}
                  />
                  <Button onClick={handleQuickAdd} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>
              </div>

              {/* Totals */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Scale className="w-4 h-4" />
                  Total: {totalKg.toFixed(2)} kg
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <PackageCheck className="w-4 h-4" />
                  Packed: {packedKg.toFixed(2)} kg
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Ruler className="w-4 h-4" />
                  Remaining: {remainKg.toFixed(2)} kg
                </Badge>
              </div>

              {/* List */}
              <div className="divide-y rounded-md border mt-2">
                {items.length === 0 ? (
                  <div className="p-4 text-stone-600">No gear added yet.</div>
                ) : (
                  items.map((it) => (
                    <div key={it.id} className="p-3 grid md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-4">
                        <div className="font-medium">{it.item_name}</div>
                        <div className="text-xs text-stone-500">
                          {it.category} • {it.importance}
                          {it.notes ? <> • {it.notes}</> : null}
                        </div>
                      </div>

                      <div className="md:col-span-2 flex items-center gap-2">
                        <span className="text-xs text-stone-500">Qty</span>
                        <Input
                          type="number"
                          min={1}
                          className="h-8 w-20"
                          value={it.quantity}
                          onChange={(e) => updateQty(it, e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-3 flex items-center gap-2">
                        <span className="text-xs text-stone-500">Weight (kg)</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 w-28"
                          value={it.estimated_weight_kg ?? ""}
                          onChange={(e) => updateWeight(it, e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={!!it.required} disabled />
                          <span className="text-sm">Required</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={!!it.packed} onCheckedChange={() => togglePacked(it)} />
                          <span className="text-sm">Packed</span>
                        </div>
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        <Button variant="ghost" className="text-red-600" onClick={() => removeItem(it.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
