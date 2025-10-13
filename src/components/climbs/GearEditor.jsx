
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ListChecks } from "lucide-react";

const categoryOptions = [
  { value: "safety", label: "Safety" },
  { value: "clothing", label: "Clothing" },
  { value: "technical", label: "Technical" },
  { value: "camping", label: "Camping" },
  { value: "navigation", label: "Navigation" },
  { value: "health", label: "Health" },
  { value: "food_water", label: "Food & Water" },
  { value: "other", label: "Other" },
];

const importanceOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "recommended", label: "Recommended" },
  { value: "optional", label: "Nice to have" },
];

export default function GearEditor({ gear = [], onChange }) {
  const handleUpdate = (idx, field, value) => {
    const next = gear.map((g, i) => (i === idx ? { ...g, [field]: value } : g));
    onChange(next);
  };

  const addItem = () => {
    onChange([
      {
        item_name: "",
        category: "safety",
        quantity: 1,
        required: true,
        packed: false,
        importance: "recommended",
        estimated_weight_kg: 0,
        notes: ""
      },
      ...gear
    ]);
  };

  const removeItem = (idx) => {
    const next = gear.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <Card className="alpine-card border-0 shadow-md">
      <CardHeader className="border-b border-stone-100">
        <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary-blue" />
          Required Gear
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-4">
        <div className="flex justify-end">
          <Button type="button" onClick={addItem} className="mountain-gradient hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4 mr-2" />
            Add Gear Item
          </Button>
        </div>

        {gear.length === 0 ? (
          <div className="text-sm text-text-secondary">
            No gear added yet. Use “Add Gear Item” to start your checklist.
          </div>
        ) : (
          <div className="space-y-4">
            {gear.map((g, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-stone-200 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-8 gap-3 md:items-end">
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs">Item Name</Label>
                    <Input
                      value={g.item_name || ""}
                      onChange={(e) => handleUpdate(idx, "item_name", e.target.value)}
                      placeholder="e.g. Helmet"
                      className="border-stone-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={g.category || "safety"}
                      onValueChange={(v) => handleUpdate(idx, "category", v)}
                    >
                      <SelectTrigger className="border-stone-200">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={g.quantity ?? 1}
                      onChange={(e) => handleUpdate(idx, "quantity", Number(e.target.value || 1))}
                      className="border-stone-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Importance</Label>
                    <Select
                      value={g.importance || "recommended"}
                      onValueChange={(v) => handleUpdate(idx, "importance", v)}
                    >
                      <SelectTrigger className="border-stone-200">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {importanceOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Est. Weight (kg)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.05"
                      value={g.estimated_weight_kg ?? 0}
                      onChange={(e) => handleUpdate(idx, "estimated_weight_kg", Number(e.target.value || 0))}
                      className="border-stone-200"
                      placeholder="e.g. 0.35"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={!!g.required}
                        onCheckedChange={(val) => handleUpdate(idx, "required", Boolean(val))}
                        id={`required-${idx}`}
                      />
                      <Label htmlFor={`required-${idx}`} className="text-xs">Required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={!!g.packed}
                        onCheckedChange={(val) => handleUpdate(idx, "packed", Boolean(val))}
                        id={`packed-${idx}`}
                      />
                      <Label htmlFor={`packed-${idx}`} className="text-xs">Packed</Label>
                    </div>
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(idx)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    value={g.notes || ""}
                    onChange={(e) => handleUpdate(idx, "notes", e.target.value)}
                    placeholder="e.g. UIAA certified, size M, rent from shop"
                    className="border-stone-200"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
