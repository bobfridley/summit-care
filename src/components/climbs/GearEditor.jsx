import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: 'safety', label: 'Safety' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'technical', label: 'Technical' },
  { value: 'camping', label: 'Camping' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'health', label: 'Health' },
  { value: 'food_water', label: 'Food & Water' },
  { value: 'other', label: 'Other' },
];

const IMPORTANCE_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'optional', label: 'Optional' },
];

export default function GearEditor({ gear, onChange }) {
  const handleUpdate = (index, field, value) => {
    const updated = [...gear];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([
      ...gear,
      {
        item_name: "",
        category: "safety",
        quantity: 1,
        required: false,
        packed: false,
        importance: "recommended",
        estimated_weight_kg: null,
        notes: "",
      },
    ]);
  };

  const handleRemove = (index) => {
    onChange(gear.filter((_, i) => i !== index));
  };

  return (
    <Card className="alpine-card border-0 shadow-lg">
      <CardHeader className="border-b border-stone-100 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-text-primary">Gear List</CardTitle>
        <Button
          onClick={handleAdd}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        {gear.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <p className="mb-4">No gear items yet. Click "Add Item" or "Autofill recommendations" to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {gear.map((item, index) => (
              <div key={index} className="p-4 bg-stone-50 rounded-lg space-y-4 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Item Name</Label>
                    <Input
                      value={item.item_name || ""}
                      onChange={(e) => handleUpdate(index, "item_name", e.target.value)}
                      placeholder="e.g. Ice Axe"
                      className="border-stone-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Category</Label>
                    <Select
                      value={item.category || "safety"}
                      onValueChange={(value) => handleUpdate(index, "category", value)}
                    >
                      <SelectTrigger className="border-stone-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) => handleUpdate(index, "quantity", parseInt(e.target.value) || 1)}
                      className="border-stone-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Importance</Label>
                    <Select
                      value={item.importance || "recommended"}
                      onValueChange={(value) => handleUpdate(index, "importance", value)}
                    >
                      <SelectTrigger className="border-stone-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMPORTANCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={item.estimated_weight_kg ?? ""}
                      onChange={(e) =>
                        handleUpdate(
                          index,
                          "estimated_weight_kg",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="e.g. 0.5"
                      className="border-stone-200"
                    />
                  </div>

                  <div className="space-y-2 flex items-end gap-4 pb-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${index}`}
                        checked={item.required || false}
                        onCheckedChange={(checked) => handleUpdate(index, "required", checked)}
                      />
                      <Label htmlFor={`required-${index}`} className="text-sm cursor-pointer">
                        Required
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`packed-${index}`}
                        checked={item.packed || false}
                        onCheckedChange={(checked) => handleUpdate(index, "packed", checked)}
                      />
                      <Label htmlFor={`packed-${index}`} className="text-sm cursor-pointer">
                        Packed
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Notes</Label>
                  <Textarea
                    value={item.notes || ""}
                    onChange={(e) => handleUpdate(index, "notes", e.target.value)}
                    placeholder="Additional notes..."
                    className="border-stone-200 h-20"
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