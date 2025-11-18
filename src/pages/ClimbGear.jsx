// src/pages/ClimbGear.jsx
import { useEffect, useMemo, useState } from "react";
import {
  listGear,
  createGear,
  updateGear,
  deleteGear,
  togglePacked as togglePackedApi,
} from "@/api/functions";
import { useLocation, useParams, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trash2,
  Plus,
  Ruler,
  PackageCheck,
  Scale,
  ArrowLeft,
} from "lucide-react";
import { createPageUrl } from "@/utils";

// Enum options mirrored from your MySQL table
const CATEGORIES = [
  "safety",
  "clothing",
  "technical",
  "camping",
  "navigation",
  "health",
  "food_water",
  "other",
];

const IMPORTANCE = ["critical", "high", "recommended", "optional"];

/**
 * Usage:
 * - Navigate to /climb-gear?climbId=123&name=Pikes%20Peak
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

  // Accept climbId + climbName from prop or querystring
  const location = useLocation();
  const params = useParams(); // handy for debugging if needed

  const climbId = useMemo(() => {
    // 1) Explicit prop wins (if you ever embed this component)
    if (climbIdProp != null) return Number(climbIdProp);

    try {
      const search = location?.search ?? window.location.search ?? "";
      const qs = new URLSearchParams(search);

      // Support both ?climbId=2 and ?climbid=2
      const raw =
        qs.get("climbId") ??
        qs.get("climbid") ??
        qs.get("CLIMBID");

      if (raw != null && raw !== "") {
        const n = Number(raw);
        if (!Number.isNaN(n) && n > 0) return n;
      }
    } catch (e) {
      console.warn("ClimbGear: failed to parse climbId from URL", e);
    }

    return null;
  }, [climbIdProp, location?.search]);

  // Resolve mountain/route name from query (?name=...)
  const climbName = useMemo(() => {
    try {
      const search = location?.search ?? window.location.search ?? "";
      const qs = new URLSearchParams(search);

      const rawName =
        qs.get("name") ??
        qs.get("climbName") ??
        qs.get("mountain_name");

      if (rawName && rawName.trim() !== "") {
        // URLSearchParams returns decoded strings already
        return rawName;
      }
    } catch (e) {
      console.warn("ClimbGear: failed to parse climb name from URL", e);
    }
    return null;
  }, [location?.search]);

  // Nice label: 📦 Gear for Pikes Peak / fallback
  const titleLabel = climbName ? `📦 Gear for ${climbName}` : "Climb Gear";

  // Compute "Last updated ..." from gear items' timestamps
  const lastUpdatedLabel = useMemo(() => {
    if (!items || items.length === 0) return null;

    const timestamps = items
      .map((it) => it.updated_at || it.created_at)
      .filter(Boolean);

    if (timestamps.length === 0) return null;

    const latestMs = Math.max(
      ...timestamps.map((ts) => {
        const d = new Date(ts);
        return d.getTime();
      }),
    );

    if (!Number.isFinite(latestMs)) return null;

    const latest = new Date(latestMs);

    return latest.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [items]);

  useEffect(() => {
    console.log("ClimbGear: location =", location);
    console.log("ClimbGear: params =", params);
    console.log("ClimbGear: resolved climbId =", climbId);
    console.log("ClimbGear: resolved climbName =", climbName);
  }, [location, params, climbId, climbName]);

  async function refresh() {
    if (!climbId) {
      setErr("Missing climbId (pass ?climbId=123 or via prop).");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErr("");

      const { data: gearRes } = await listGear(climbId);

      if (!gearRes?.ok) {
        setErr(gearRes?.error || "Failed to load gear");
        setItems([]);
        setSum(null);
        return;
      }

      const nextItems = gearRes.items ?? [];
      setItems(nextItems);

      // Compute weight summary on the client
      let total = 0;
      let packed = 0;

      for (const it of nextItems) {
        const qty = Number(it.quantity ?? 1) || 1;
        const wt = Number(it.estimated_weight_kg ?? 0) || 0;
        const itemWeight = qty * wt;
        total += itemWeight;
        if (it.packed) packed += itemWeight;
      }

      const remaining = total - packed;

      setSum({
        ok: true,
        totals: {
          total_weight_kg: total,
          packed_weight_kg: packed,
          remaining_weight_kg: remaining,
        },
      });
    } catch (e) {
      console.error("ClimbGear: error in refresh()", e);
      setErr(e.message || "Failed to load gear");
      setItems([]);
      setSum(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!climbId) return; // don’t call refresh until we have an ID
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [climbId]);

  const handleQuickAdd = async () => {
    if (!newItem.item_name.trim() || !climbId) return;
    try {
      const payload = {
        ...newItem,
        quantity: Number(newItem.quantity) || 1,
        required: newItem.required ? 1 : 0,
        packed: newItem.packed ? 1 : 0,
        estimated_weight_kg:
          newItem.estimated_weight_kg === ""
            ? null
            : Number(newItem.estimated_weight_kg),
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
      await refresh(); // always re-fetch from server
    } catch (e) {
      console.error("Quick add gear failed:", e);
      setErr(e.message || "Failed to add gear item");
    }
  };

  const handleTogglePacked = async (it) => {
    if (!climbId) return;
    try {
      await togglePackedApi(climbId, it.id, !it.packed);
      await refresh();
    } catch (e) {
      console.error("Toggle packed failed:", e);
      setErr(e.message || "Failed to update packed status");
    }
  };

  const handleToggleRequired = async (it) => {
    if (!climbId) return;
    try {
      await updateGear(climbId, it.id, { required: it.required ? 0 : 1 });
      await refresh();
    } catch (e) {
      console.error("Toggle required failed:", e);
      setErr(e.message || "Failed to update required flag");
    }
  };

  const updateQty = async (it, q) => {
    if (!climbId) return;
    try {
      const n = Math.max(1, Number(q) || 1);
      await updateGear(climbId, it.id, { quantity: n });
      await refresh();
    } catch (e) {
      console.error("Update quantity failed:", e);
      setErr(e.message || "Failed to update quantity");
    }
  };

  const updateWeight = async (it, w) => {
    if (!climbId) return;
    try {
      const val = w === "" ? null : Number(w);
      await updateGear(climbId, it.id, { estimated_weight_kg: val });
      await refresh();
    } catch (e) {
      console.error("Update weight failed:", e);
      setErr(e.message || "Failed to update weight");
    }
  };

  const removeItem = async (id) => {
    if (!climbId) return;
    try {
      await deleteGear(climbId, id);
      await refresh();
    } catch (e) {
      console.error("Delete gear failed:", e);
      setErr(e.message || "Failed to delete gear item");
    }
  };

  const totalKg = Number(sum?.totals?.total_weight_kg ?? 0);
  const packedKg = Number(sum?.totals?.packed_weight_kg ?? 0);
  const remainKg = Number(sum?.totals?.remaining_weight_kg ?? 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-4">
      {/* Back to climbs link */}
      <div>
        <Link
          to={createPageUrl("climbs")}
          className="inline-flex items-center gap-1 text-sm text-primary-blue hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to climbs
        </Link>
      </div>

      <Card className="alpine-card border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              {titleLabel}
            </CardTitle>
            {lastUpdatedLabel && (
              <span className="text-xs text-stone-500">
                Last updated {lastUpdatedLabel}
              </span>
            )}
          </div>
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
                  <label className="text-xs font-medium text-stone-600">
                    Item name
                  </label>
                  <Input
                    placeholder="Ice Axe"
                    value={newItem.item_name}
                    onChange={(e) =>
                      setNewItem((s) => ({ ...s, item_name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600">
                    Category
                  </label>
                  <Select
                    value={newItem.category}
                    onValueChange={(v) =>
                      setNewItem((s) => ({ ...s, category: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600">
                    Importance
                  </label>
                  <Select
                    value={newItem.importance}
                    onValueChange={(v) =>
                      setNewItem((s) => ({ ...s, importance: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPORTANCE.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600">
                    Qty
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem((s) => ({ ...s, quantity: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={newItem.required}
                      onCheckedChange={(v) =>
                        setNewItem((s) => ({ ...s, required: !!v }))
                      }
                    />
                    <span className="text-sm">Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={newItem.packed}
                      onCheckedChange={(v) =>
                        setNewItem((s) => ({ ...s, packed: !!v }))
                      }
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
                    onChange={(e) =>
                      setNewItem((s) => ({
                        ...s,
                        estimated_weight_kg: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Notes (optional)"
                    value={newItem.notes}
                    onChange={(e) =>
                      setNewItem((s) => ({ ...s, notes: e.target.value }))
                    }
                  />
                  <Button
                    onClick={handleQuickAdd}
                    className="flex items-center gap-2"
                  >
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
                    <div
                      key={it.id}
                      className="p-3 grid md:grid-cols-12 gap-3 items-center"
                    >
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
                        <span className="text-xs text-stone-500">
                          Weight (kg)
                        </span>
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
                          <Checkbox
                            checked={!!it.required}
                            onCheckedChange={() => handleToggleRequired(it)}
                          />
                          <span className="text-sm">Required</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={!!it.packed}
                            onCheckedChange={() => handleTogglePacked(it)}
                          />
                          <span className="text-sm">Packed</span>
                        </div>
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => removeItem(it.id)}
                        >
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
