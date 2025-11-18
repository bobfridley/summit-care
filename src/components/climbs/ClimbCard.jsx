// src/components/climbs/ClimbCard.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mountain,
  Calendar,
  Users,
  Edit,
  Trash2,
  MapPin,
  Clock,
  AlertTriangle,
  ListChecks,
} from "lucide-react";
import { format } from "date-fns";
import GearList from "./GearList";
import PackWeightSummary from "./PackWeightSummary";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function getDifficultyColor(level) {
  switch (level) {
    case "beginner":
      return "bg-green-100 text-green-800 border-green-200";
    case "intermediate":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "advanced":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "expert":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "extreme":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getStatusColor(status) {
  switch (status) {
    case "planning":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "confirmed":
      return "bg-green-50 text-green-700 border-green-200";
    case "in_progress":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "completed":
      return "bg-gray-50 text-gray-700 border-gray-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getElevationRisk(elevation) {
  if (!elevation && elevation !== 0) {
    return { level: "unknown", color: "text-stone-500" };
  }
  if (elevation >= 14000) return { level: "extreme", color: "text-red-600" };
  if (elevation >= 12000) return { level: "high", color: "text-orange-600" };
  if (elevation >= 10000) return { level: "moderate", color: "text-yellow-600" };
  if (elevation >= 8000) return { level: "low", color: "text-blue-600" };
  return { level: "minimal", color: "text-green-600" };
}

function getGearStatus(gear) {
  if (!Array.isArray(gear) || gear.length === 0) {
    return {
      label: "Gear not added",
      className: "bg-stone-50 text-stone-700 border-stone-200",
      tooltip: "No required gear items defined yet for this climb.",
    };
  }

  const total = gear.length;
  const packed = gear.filter((g) => g.packed).length;

  if (packed === 0) {
    return {
      label: "Gear planning",
      className: "bg-amber-50 text-amber-800 border-amber-200",
      tooltip: "Required gear listed, but nothing marked as packed yet.",
    };
  }

  if (packed < total) {
    return {
      label: "Gear in progress",
      className: "bg-sky-50 text-sky-800 border-sky-200",
      tooltip: `Some items packed (${packed}/${total}); a few still remaining.`,
    };
  }

  return {
    label: "Gear ready",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    tooltip: "All required gear is marked as packed.",
  };
}

export default function ClimbCard({ climb, onEdit, onDelete }) {
  // Guard against undefined climb to avoid "cannot read elevation" errors
  if (!climb) {
    console.warn("ClimbCard rendered without a climb prop");
    return null;
  }

  const elevationRisk = getElevationRisk(climb.elevation);
  const gearStatus = getGearStatus(climb.required_gear || []);

  const startDateLabel = climb.planned_start_date
    ? format(new Date(climb.planned_start_date), "MMMM d, yyyy")
    : "Not set";

  // ✅ Build the gear URL directly so the query string is preserved
  const gearUrl = `/climb-gear?climbId=${climb.id}&name=${encodeURIComponent(
    climb.mountain_name || ""
  )}`;

  return (
    <Card className="alpine-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-stone-100">
        <div className="flex flex-col gap-3">
          {/* Title + location */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold text-text-primary mb-1 flex items-center gap-2">
                <Mountain className="w-6 h-6 text-primary-blue flex-shrink-0" />
                <span className="break-words">
                  {climb.mountain_name || "Untitled climb"}
                </span>
              </CardTitle>
              {climb.location && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm break-words">{climb.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* subtle divider between location + buttons */}
          <div className="h-px bg-stone-100" />

          {/* Animated button row */}
          {/* Button row: Update Gear / Edit Climb / Delete Climb */}
          <motion.div
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {/* Update Gear */}
            <Link to={gearUrl}>
              <Button
                variant="outline"
                className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm hover:bg-primary-blue/10 hover:text-primary-blue border-stone-300"
                title="Open the detailed gear checklist and packing view for this climb."
              >
                <ListChecks className="w-4 h-4 text-primary-blue" />
                <span>Update Gear</span>
              </Button>
            </Link>

            {/* Edit Climb */}
            <Button
              type="button"
              onClick={() => onEdit(climb)}
              variant="outline"
              className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm border-stone-300 hover:bg-primary-blue/10 hover:text-primary-blue"
              title="Edit climb details"
            >
              <Edit className="w-4 h-4 text-primary-blue" />
              <span>Edit Climb</span>
            </Button>

            {/* Delete Climb */}
            <Button
              type="button"
              onClick={() => onDelete(climb.id)}
              variant="outline"
              className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm border-red-200 text-red-700 hover:bg-red-50"
              title="Delete this climb"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Delete Climb</span>
            </Button>
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Status / difficulty / style badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={`${getStatusColor(climb.status)} border font-medium`}>
            {climb.status?.replace("_", " ") || "unknown"}
          </Badge>
          <Badge className={`${getDifficultyColor(climb.difficulty_level)} border font-medium`}>
            {climb.difficulty_level || "intermediate"}
          </Badge>
          <Badge variant="outline" className="border-stone-200">
            {climb.climbing_style?.replace("_", " ") || "day hike"}
          </Badge>
        </div>

        {/* Risk row under badges */}
        <div
          className={`inline-flex items-center gap-2 text-sm ${elevationRisk.color}`}
          title={`Altitude risk is estimated from elevation (${climb.elevation?.toLocaleString?.() || "n/a"} ft).`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium capitalize">
            Risk: {elevationRisk.level}
          </span>
          {typeof climb.elevation === "number" && (
            <span className="text-xs text-stone-500">
              ({climb.elevation.toLocaleString()} ft)
            </span>
          )}
        </div>

        {/* Core climb stats */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-secondary" />
            <span className="text-text-primary">{startDateLabel}</span>
          </div>

          {climb.duration_days && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-secondary" />
              <span className="text-text-primary">
                {climb.duration_days} day{climb.duration_days !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {climb.group_size && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-text-secondary" />
              <span className="text-text-primary">
                {climb.group_size} climber{climb.group_size !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {climb.notes && (
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <p className="text-sm text-text-secondary line-clamp-2">
              {climb.notes}
            </p>
          </div>
        )}

        {/* Weather concerns */}
        {climb.weather_concerns && (
          <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              <span className="font-medium">Weather:</span> {climb.weather_concerns}
            </p>
          </div>
        )}

        {/* Gear summary section */}
        {Array.isArray(climb.required_gear) && climb.required_gear.length > 0 && (
          <div className="pt-2 border-t border-stone-100 space-y-3">
            {/* Gear status badge with color variants + tooltip */}
            <Badge
              className={`border ${gearStatus.className}`}
              title={gearStatus.tooltip}
            >
              {gearStatus.label}
            </Badge>

            <PackWeightSummary
              gear={climb.required_gear}
              basePackWeightKg={climb.base_pack_weight_kg || 0}
            />
            <GearList gear={climb.required_gear} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
