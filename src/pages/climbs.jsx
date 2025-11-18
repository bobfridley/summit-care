import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Mountain, Save, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mysqlClimbs } from "@/api/functions";

import ClimbForm from "../components/climbs/ClimbForm";
import ClimbCard from "../components/climbs/ClimbCard";

export default function ClimbsPage() {
  const navigate = useNavigate();
  const [climbs, setClimbs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClimb, setEditingClimb] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Track initial form state to detect changes
  const [initialFormState, setInitialFormState] = useState(null);
  const [currentFormData, setCurrentFormData] = useState(null);

  // Navigation confirmation dialog
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Check if form has changes
  const hasFormChanges = useMemo(() => {
    if (!showForm || !initialFormState || !currentFormData) return false;
    return JSON.stringify(currentFormData) !== initialFormState;
  }, [showForm, initialFormState, currentFormData]);

  // Intercept navigation when form has changes
  useEffect(() => {
    const handleClick = (e) => {
      if (!hasFormChanges) return;

      const link = e.target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;

      e.preventDefault();
      e.stopPropagation();

      setPendingNavigation(href);
      setShowNavigationDialog(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasFormChanges]);

  // Browser refresh/close warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasFormChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasFormChanges]);

  useEffect(() => {
    loadClimbs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalize whatever mysqlClimbs returns into the shape our UI expects
  const normalizeClimb = (raw) => {
    if (!raw) return raw;

    return {
      ...raw,
      // ensure these are always present
      mountain_name: raw.mountain_name ?? raw.name ?? "",
      location: raw.location ?? raw.region ?? raw.area ?? "",
      // make sure planned_start_date exists for the form + card
      planned_start_date:
        raw.planned_start_date ?? raw.start_date ?? raw.date ?? null,
    };
  };

  const loadClimbs = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await mysqlClimbs({
        action: "list",
        order: "planned_start_date",
        dir: "DESC",
        include_gear: true,
      });

      if (data?.ok) {
        const items = (data.items || []).map(normalizeClimb);
        setClimbs(items);
        // Optional: sanity check in console
        if (items.length > 0) {
          console.log("ClimbsPage: first normalized climb", items[0]);
        }
      } else {
        setError(data?.error || "Failed to load climbs");
      }
    } catch (error) {
      console.error("Error loading climbs:", error);
      setError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to load climbs",
      );
    }
    setIsLoading(false);
  };

  const handleSubmit = async (climbData) => {
    setError("");
    setIsSaving(true);
    try {
      if (editingClimb) {
        const { data } = await mysqlClimbs({
          action: "update",
          id: editingClimb.id,
          ...climbData, // flatten here
        });
        if (!data?.ok) {
          setError(data?.error || "Failed to update climb");
          setIsSaving(false);
          return;
        }
      } else {
        const { data } = await mysqlClimbs({
          action: "create",
          ...climbData, // flatten here
        });
        if (!data?.ok) {
          setError(data?.error || "Failed to create climb");
          setIsSaving(false);
          return;
        }
      }
      setShowForm(false);
      setEditingClimb(null);
      setInitialFormState(null);
      setCurrentFormData(null);
      await loadClimbs();
    } catch (error) {
      console.error("Error saving climb:", error);
      setError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to save climb",
      );
    }
    setIsSaving(false);
  };

  const handleEdit = (climb) => {
    // Make sure the edit form sees the normalized shape too
    const normalized = normalizeClimb(climb);
    setEditingClimb(normalized);
    setInitialFormState(JSON.stringify(normalized));
    setCurrentFormData(normalized);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingClimb(null);
    const emptyForm = {
      mountain_name: "",
      elevation: "",
      location: "",
      planned_start_date: "",
      duration_days: "",
      difficulty_level: "intermediate",
      climbing_style: "day_hike",
      group_size: "",
      emergency_contact: "",
      weather_concerns: "",
      special_equipment: "",
      required_gear: [],
      backpack_name: "",
      base_pack_weight_kg: "",
      status: "planning",
      notes: "",
    };
    setInitialFormState(JSON.stringify(emptyForm));
    setCurrentFormData(emptyForm);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    if (hasFormChanges) {
      setPendingNavigation(null);
      setShowNavigationDialog(true);
    } else {
      setShowForm(false);
      setEditingClimb(null);
      setInitialFormState(null);
      setCurrentFormData(null);
    }
  };

  const handleSaveAndLeave = async () => {
    if (currentFormData) {
      await handleSubmit(currentFormData);
    }
    setShowNavigationDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleLeaveWithoutSaving = () => {
    setShowForm(false);
    setEditingClimb(null);
    setInitialFormState(null);
    setCurrentFormData(null);
    setShowNavigationDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleDelete = async (climbId) => {
    setError("");
    try {
      const { data } = await mysqlClimbs({ action: "delete", id: climbId });
      if (!data?.ok) {
        setError(data?.error || "Failed to delete climb");
        return;
      }
      await loadClimbs();
    } catch (error) {
      console.error("Error deleting climb:", error);
      setError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to delete climb",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
              My Climbs
            </h1>
            <p className="text-text-secondary text-lg">
              Plan and track your mountaineering expeditions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAddNew}
              className="mountain-gradient hover:opacity-90 transition-opacity shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Plan New Climb
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showForm && (
          <ClimbForm
            climb={editingClimb}
            onSubmit={handleSubmit}
            onCancel={handleFormCancel}
            onFormChange={setCurrentFormData}
          />
        )}

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-xl animate-pulse" />
              ))
          ) : climbs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Mountain className="w-16 h-16 text-secondary-blue mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No climbs planned yet
              </h3>
              <p className="text-text-secondary">
                Start planning your first expedition to track gear and
                medications
              </p>
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

      {/* Navigation Confirmation Dialog */}
      <Dialog open={showNavigationDialog} onOpenChange={setShowNavigationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription>
              You have unsaved changes to your climb plan. Would you like to
              save before leaving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleLeaveWithoutSaving}
              className="flex-1"
            >
              Leave Without Saving
            </Button>
            <Button
              onClick={handleSaveAndLeave}
              className="mountain-gradient hover:opacity-90 flex-1"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save & Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
