import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Mountain } from "lucide-react";
import GearEditor from "./GearEditor";
import PackWeightSummary from "./PackWeightSummary";

/**
 * Normalize various date formats (Date, ISO string) to "YYYY-MM-DD"
 * which is what <input type="date"> expects.
 */
function normalizeDate(value) {
  if (!value) return "";
  // If it's already "YYYY-MM-DD", just return it
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
  } catch {
    return "";
  }
}

export default function ClimbForm({ climb, onSubmit, onCancel, onFormChange }) {
  // Helper to build initial state from the current climb
  const buildInitialState = (c) => ({
    mountain_name: c?.mountain_name || "",
    elevation: c?.elevation ?? "",
    location: c?.location || "",
    planned_start_date: normalizeDate(c?.planned_start_date),
    duration_days: c?.duration_days ?? "",
    difficulty_level: c?.difficulty_level || "intermediate",
    climbing_style: c?.climbing_style || "day_hike",
    group_size: c?.group_size ?? "",
    emergency_contact: c?.emergency_contact || "",
    weather_concerns: c?.weather_concerns || "",
    special_equipment: c?.special_equipment || "",
    required_gear: Array.isArray(c?.required_gear) ? c.required_gear : [],
    backpack_name: c?.backpack_name || "",
    base_pack_weight_kg: c?.base_pack_weight_kg ?? "",
    status: c?.status || "planning",
    notes: c?.notes || "",
  });

  const [formData, setFormData] = useState(() => buildInitialState(climb));

  // If the climb prop changes (e.g., editing a different climb),
  // reset the form state to the new climb’s values.
  useEffect(() => {
    setFormData(buildInitialState(climb));
  }, [climb]);

  // Notify parent (My Climbs page) of form changes for the unsaved-changes logic
  useEffect(() => {
    if (onFormChange) {
      onFormChange(formData);
    }
  }, [formData, onFormChange]);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Helpers to avoid NaN while allowing blank fields
  const handleIntChange = (field, raw) => {
    if (raw === "") {
      handleChange(field, "");
      return;
    }
    const n = parseInt(raw, 10);
    handleChange(field, Number.isNaN(n) ? "" : n);
  };

  const handleFloatChange = (field, raw) => {
    if (raw === "") {
      handleChange(field, "");
      return;
    }
    const n = parseFloat(raw);
    handleChange(field, Number.isNaN(n) ? "" : n);
  };

  return (
    <div className="relative mb-8">
      <Card className="alpine-card border-0 shadow-lg">
        <CardHeader className="border-b border-stone-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Mountain className="w-6 h-6 text-primary-blue" />
              {climb ? "Edit Climb Plan" : "Plan New Climb"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6 pb-24">
            {/* Mountain & Elevation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mountain_name" className="text-text-primary font-medium">
                  Mountain/Peak Name *
                </Label>
                <Input
                  id="mountain_name"
                  value={formData.mountain_name}
                  onChange={(e) => handleChange("mountain_name", e.target.value)}
                  placeholder="e.g. Mount Whitney"
                  required
                  className="border-stone-200 focus:border-primary-blue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="elevation" className="text-text-primary font-medium">
                  Elevation (feet) *
                </Label>
                <Input
                  id="elevation"
                  type="number"
                  value={formData.elevation}
                  onChange={(e) => handleIntChange("elevation", e.target.value)}
                  placeholder="e.g. 14505"
                  required
                  className="border-stone-200 focus:border-primary-blue"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-text-primary font-medium">
                Location/Region
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g. Sierra Nevada, California"
                className="border-stone-200 focus:border-primary-blue"
              />
            </div>

            {/* Dates & group size */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="planned_start_date" className="text-text-primary font-medium">
                  Start Date *
                </Label>
                <Input
                  id="planned_start_date"
                  type="date"
                  value={formData.planned_start_date}
                  onChange={(e) => handleChange("planned_start_date", e.target.value)}
                  required
                  className="border-stone-200 focus:border-primary-blue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_days" className="text-text-primary font-medium">
                  Duration (days)
                </Label>
                <Input
                  id="duration_days"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => handleIntChange("duration_days", e.target.value)}
                  placeholder="e.g. 3"
                  className="border-stone-200 focus:border-primary-blue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group_size" className="text-text-primary font-medium">
                  Group Size
                </Label>
                <Input
                  id="group_size"
                  type="number"
                  min="1"
                  value={formData.group_size}
                  onChange={(e) => handleIntChange("group_size", e.target.value)}
                  placeholder="e.g. 4"
                  className="border-stone-200 focus:border-primary-blue"
                />
              </div>
            </div>

            {/* Difficulty & Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="difficulty_level" className="text-text-primary font-medium">
                  Difficulty Level
                </Label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value) => handleChange("difficulty_level", value)}
                >
                  <SelectTrigger className="border-stone-200 focus:border-primary-blue">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                    <SelectItem value="extreme">Extreme</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="climbing_style" className="text-text-primary font-medium">
                  Climbing Style
                </Label>
                <Select
                  value={formData.climbing_style}
                  onValueChange={(value) => handleChange("climbing_style", value)}
                >
                  <SelectTrigger className="border-stone-200 focus:border-primary-blue">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day_hike">Day Hike</SelectItem>
                    <SelectItem value="overnight">Overnight</SelectItem>
                    <SelectItem value="multi_day">Multi-day</SelectItem>
                    <SelectItem value="expedition">Expedition</SelectItem>
                    <SelectItem value="technical_climb">Technical Climb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Emergency contact */}
            <div className="space-y-2">
              <Label htmlFor="emergency_contact" className="text-text-primary font-medium">
                Emergency Contact
              </Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => handleChange("emergency_contact", e.target.value)}
                placeholder="Name and phone number"
                className="border-stone-200 focus:border-primary-blue"
              />
            </div>

            {/* Weather & Special equipment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weather_concerns" className="text-text-primary font-medium">
                  Weather Concerns
                </Label>
                <Textarea
                  id="weather_concerns"
                  value={formData.weather_concerns}
                  onChange={(e) => handleChange("weather_concerns", e.target.value)}
                  placeholder="e.g. Storm season, temperature extremes..."
                  className="h-20 border-stone-200 focus:border-primary-blue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_equipment" className="text-text-primary font-medium">
                  Special Equipment
                </Label>
                <Textarea
                  id="special_equipment"
                  value={formData.special_equipment}
                  onChange={(e) => handleChange("special_equipment", e.target.value)}
                  placeholder="e.g. Crampons, oxygen, technical gear..."
                  className="h-20 border-stone-200 focus:border-primary-blue"
                />
              </div>
            </div>

            {/* Pack basics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="backpack_name" className="text-text-primary font-medium">
                  Backpack
                </Label>
                <Input
                  id="backpack_name"
                  value={formData.backpack_name || ""}
                  onChange={(e) => handleChange("backpack_name", e.target.value)}
                  placeholder="e.g. Osprey Exos 48"
                  className="border-stone-200 focus:border-primary-blue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_pack_weight_kg" className="text-text-primary font-medium">
                  Base Pack Weight (kg)
                </Label>
                <Input
                  id="base_pack_weight_kg"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.base_pack_weight_kg}
                  onChange={(e) => handleFloatChange("base_pack_weight_kg", e.target.value)}
                  placeholder="e.g. 1.2"
                  className="border-stone-200 focus:border-primary-blue"
                />
              </div>
            </div>

            {/* Required gear (front-end only for now) */}
            <GearEditor
              gear={formData.required_gear || []}
              onChange={(next) =>
                setFormData((prev) => ({
                  ...prev,
                  required_gear: next,
                }))
              }
            />

            <div className="pt-2">
              <PackWeightSummary
                gear={formData.required_gear || []}
                basePackWeightKg={formData.base_pack_weight_kg || 0}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-text-primary font-medium">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any additional planning notes, route details, or considerations..."
                className="h-24 border-stone-200 focus:border-primary-blue"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-200 p-4 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="mountain-gradient hover:opacity-90 transition-opacity"
          >
            <Save className="w-4 h-4 mr-2" />
            {climb ? "Update" : "Save"} Climb Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
