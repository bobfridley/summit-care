
import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mountain, ArrowLeft, Save, Wand2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import GearEditor from "../components/climbs/GearEditor";
import PackWeightSummary from "../components/climbs/PackWeightSummary";
import { mysqlClimbs } from "@/api/functions";
import { toast } from "sonner";

const normalizeName = (str) => String(str || '').trim().toLowerCase();

const defaultItemCatalog = {
  'ice axe': { category: 'safety', importance: 'critical', estimatedWeightKg: 0.5 },
  'crampons': { category: 'safety', importance: 'critical', estimatedWeightKg: 0.9 },
  'helmet': { category: 'safety', importance: 'critical', estimatedWeightKg: 0.4 },
  'harness': { category: 'safety', importance: 'critical', estimatedWeightKg: 0.5 },
  'rope': { category: 'technical', importance: 'critical', estimatedWeightKg: 2.0 },
  'carabiners': { category: 'technical', importance: 'critical', estimatedWeightKg: 0.3 },
  'tent': { category: 'camping', importance: 'critical', estimatedWeightKg: 2.5 },
  'sleeping bag': { category: 'camping', importance: 'critical', estimatedWeightKg: 1.2 },
  'sleeping pad': { category: 'camping', importance: 'recommended', estimatedWeightKg: 0.5 },
  'stove': { category: 'camping', importance: 'high', estimatedWeightKg: 0.3 },
  'fuel': { category: 'camping', importance: 'high', estimatedWeightKg: 0.4 },
  'cookware': { category: 'camping', importance: 'recommended', estimatedWeightKg: 0.5 },
  'water filter': { category: 'food_water', importance: 'recommended', estimatedWeightKg: 0.3 },
  'headlamp': { category: 'navigation', importance: 'critical', estimatedWeightKg: 0.1 },
  'gps': { category: 'navigation', importance: 'recommended', estimatedWeightKg: 0.2 },
  'first aid kit': { category: 'health', importance: 'critical', estimatedWeightKg: 0.5 },
  'sunglasses': { category: 'clothing', importance: 'high', estimatedWeightKg: 0.05 },
  'sunscreen': { category: 'health', importance: 'high', estimatedWeightKg: 0.1 },
};

const getDefaultsForItem = (itemName) => {
  const norm = normalizeName(itemName);
  if (defaultItemCatalog[norm]) return defaultItemCatalog[norm];
  return { category: 'other', importance: 'optional', estimatedWeightKg: null };
};

const backfillGearItem = (item) => {
  const defaults = getDefaultsForItem(item?.item_name || '');
  return {
    item_name: item?.item_name || '',
    category: item?.category || defaults.category,
    quantity: typeof item?.quantity === 'number' ? item.quantity : 1,
    required: typeof item?.required === 'boolean' ? item.required : false,
    packed: typeof item?.packed === 'boolean' ? item.packed : false,
    importance: item?.importance || defaults.importance,
    estimated_weight_kg: item?.estimated_weight_kg !== null && item?.estimated_weight_kg !== undefined
      ? Number(item.estimated_weight_kg)
      : defaults.estimatedWeightKg,
    notes: item?.notes || '',
  };
};

const generateRecommendedGear = (climb) => {
  const base = [
    { item_name: 'Ice Axe', category: 'safety', quantity: 1, required: true, packed: false, importance: 'critical', estimated_weight_kg: 0.5, notes: '' },
    { item_name: 'Crampons', category: 'safety', quantity: 1, required: true, packed: false, importance: 'critical', estimated_weight_kg: 0.9, notes: '' },
    { item_name: 'Helmet', category: 'safety', quantity: 1, required: true, packed: false, importance: 'critical', estimated_weight_kg: 0.4, notes: '' },
    { item_name: 'Harness', category: 'safety', quantity: 1, required: true, packed: false, importance: 'critical', estimated_weight_kg: 0.5, notes: '' },
    { item_name: 'Tent', category: 'camping', quantity: 1, required: true, packed: false, importance: 'critical', estimated_weight_kg: 2.5, notes: '' },
    { item_name: 'Sleeping Bag', category: 'camping', quantity: 1, required: true, packed: false, importance: 'critical', estimated_weight_kg: 1.2, notes: '' },
    { item_name: 'Sleeping Pad', category: 'camping', quantity: 1, required: true, packed: false, importance: 'recommended', estimated_weight_kg: 0.5, notes: '' },
    { item_name: 'Stove', category: 'camping', quantity: 1, required: true, packed: false, importance: 'high', estimated_weight_kg: 0.3, notes: '' },
    { item_name: 'Fuel', category: 'camping', quantity: 1, required: true, packed: false, importance: 'high', estimated_weight_kg: 0.4, notes: '' },
    { item_name: 'First Aid Kit', category: 'health', quantity: 1, required: true, packed: false, importance: 'critical', estimated_weight_kg: 0.5, notes: '' },
    { item_name: 'Headlamp', category: 'navigation', quantity: 1, required: true, packed: false, importance: 'critical', estimated_weight_kg: 0.1, notes: '' },
    { item_name: 'Sunglasses', category: 'clothing', quantity: 1, required: true, packed: false, importance: 'high', estimated_weight_kg: 0.05, notes: '' },
    { item_name: 'Sunscreen', category: 'health', quantity: 1, required: true, packed: false, importance: 'high', estimated_weight_kg: 0.1, notes: '' },
  ];

  const elev = Number(climb?.elevation) || 0;
  if (elev > 18000) {
    base.push({ item_name: 'Oxygen System', category: 'health', quantity: 1, required: false, packed: false, importance: 'recommended', estimated_weight_kg: 3.0, notes: 'For extreme altitude' });
  }

  const dur = Number(climb?.duration_days) || 0;
  if (dur > 5) {
    base.push({ item_name: 'Extra Fuel', category: 'camping', quantity: 2, required: false, packed: false, importance: 'recommended', estimated_weight_kg: 0.4, notes: 'Multi-day climb' });
  }

  return base;
};

export default function ClimbGear() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const climbId = searchParams.get("climbId");

  const [isLoading, setIsLoading] = useState(true);
  const [climb, setClimb] = useState(null);
  const [climbs, setClimbs] = useState([]);
  const [gear, setGear] = useState([]);
  const [backpackName, setBackpackName] = useState("");
  const [basePackWeightKg, setBasePackWeightKg] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [error, setError] = useState("");
  
  // Track initial state to detect changes
  const [initialState, setInitialState] = useState(null);

  // Navigation confirmation dialog
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  // Check if changes have been made
  const hasChanges = useMemo(() => {
    if (!initialState) return false;
    
    const currentGear = JSON.stringify(gear);
    const gearChanged = currentGear !== initialState.gear;
    const backpackChanged = backpackName !== initialState.backpackName;
    const weightChanged = basePackWeightKg !== initialState.basePackWeightKg;
    
    return gearChanged || backpackChanged || weightChanged;
  }, [gear, backpackName, basePackWeightKg, initialState]);

  // Intercept navigation attempts on sidebar/back button (links only)
  useEffect(() => {
    const handleClick = (e) => {
      // Only intercept if there are unsaved changes
      if (!hasChanges) {
        return;
      }

      // Check if the click target is a link or inside a link
      const link = e.target.closest('a');
      if (!link) {
        return;
      }

      // Get the href
      const href = link.getAttribute('href');
      
      // Do not intercept if href is missing, is an internal hash link, or an external link
      if (!href || href.startsWith('#') || href.startsWith('http')) {
        return;
      }

      // Prevent navigation
      e.preventDefault();
      e.stopPropagation();

      // Show centered dialog
      setPendingNavigation(href);
      setShowNavigationDialog(true);
    };

    // Add event listener to document to catch all clicks
    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasChanges]);

  // NOTE: No beforeunload handler - that causes the native browser dialog
  // We only intercept link clicks (sidebar, back button) with the custom modal

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        if (climbId) {
          const { data } = await mysqlClimbs({ action: "get", id: Number(climbId) });
          if (data?.ok) {
            const c = data.item;
            setClimb(c);
            const gearData = Array.isArray(c?.required_gear) ? c.required_gear : [];
            const backpack = c?.backpack_name || "";
            const weight = Number(c?.base_pack_weight_kg || 0);
            
            setGear(gearData);
            setBackpackName(backpack);
            setBasePackWeightKg(weight);
            
            // Save initial state for change detection
            setInitialState({
              gear: JSON.stringify(gearData),
              backpackName: backpack,
              basePackWeightKg: weight
            });
          } else {
            setError(data?.error || "Failed to load climb");
          }
        } else {
          const { data } = await mysqlClimbs({ action: "list", order: "planned_start_date", dir: "DESC" });
          if (data?.ok) {
            setClimbs(data.items || []);
          } else {
            setError(data?.error || "Failed to load climbs");
          }
        }
      } catch (err) {
        setError(err?.response?.data?.error || err?.message || "Failed to load data");
      }
      setIsLoading(false);
    };
    load();
  }, [climbId]);

  const mergeRecommended = () => {
    if (!climb) {
      toast.error("Unable to generate recommendations - climb data not loaded");
      return;
    }
    setIsAutofilling(true);
    const recommended = generateRecommendedGear(climb);
    const existing = Array.isArray(gear) ? gear.map(backfillGearItem) : [];
    const existingNames = new Set(existing.map((i) => normalizeName(i?.item_name)));
    const additions = recommended.filter((r) => !existingNames.has(normalizeName(r.item_name)));
    const merged = existing.concat(additions);
    setGear(merged);
    
    // Show feedback to user
    if (additions.length === 0) {
      toast.success("All recommended items are already in your gear list!", {
        description: "Your gear list is complete with the essentials.",
        icon: <CheckCircle className="w-4 h-4" />
      });
    } else {
      toast.success(`Added ${additions.length} recommended ${additions.length === 1 ? 'item' : 'items'}`, {
        description: additions.map(a => a.item_name).join(", "),
        icon: <Wand2 className="w-4 h-4" />
      });
    }
    
    setIsAutofilling(false);
  };

  const onSave = async () => {
    if (!climb) return;
    
    // Check if there are changes
    if (!hasChanges) {
      toast.info("No changes to save", {
        description: "Your gear list is already up to date.",
        icon: <Info className="w-4 h-4" />
      });
      return;
    }
    
    setIsSaving(true);
    setError("");
    try {
      const { data } = await mysqlClimbs({
        action: "update",
        id: climb.id,
        payload: {
          required_gear: gear,
          backpack_name: backpackName,
          base_pack_weight_kg: Number(basePackWeightKg) || 0
        }
      });
      if (data?.ok) {
        // Update initial state after successful save
        setInitialState({
          gear: JSON.stringify(gear),
          backpackName: backpackName,
          basePackWeightKg: basePackWeightKg
        });
        toast.success("Gear list saved successfully!");
      } else {
        setError(data?.error || "Failed to save");
        toast.error("Failed to save gear list");
      }
    } catch (err) {
      console.error("Error saving:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to save");
      toast.error("Failed to save gear list");
    }
    setIsSaving(false);
  };

  const handleSaveAndLeave = async () => {
    await onSave();
    setShowNavigationDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleLeaveWithoutSaving = () => {
    // Reset initialState to effectively "clear" changes and allow navigation
    setInitialState({
      gear: JSON.stringify(gear),
      backpackName: backpackName,
      basePackWeightKg: basePackWeightKg
    });
    setShowNavigationDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleNavigationAttempt = (destination) => {
    if (hasChanges) {
      setPendingNavigation(destination);
      setShowNavigationDialog(true);
      return false;
    }
    return true;
  };

  if (!climbId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (handleNavigationAttempt(createPageUrl("climbs"))) {
                    navigate(createPageUrl("climbs"));
                  }
                }}
                className="border-2 border-[#2D5016] text-[#2D5016] hover:!bg-[#2D5016] hover:!text-white transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Select a climb to manage gear</h1>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array(6).fill(0).map((_, i) => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)
              : climbs.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Mountain className="w-16 h-16 text-secondary-blue mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">No climbs yet</h3>
                    <p className="text-text-secondary mb-4">Create your first climb to manage gear</p>
                    <Button
                      onClick={() => {
                        if (handleNavigationAttempt(createPageUrl("climbs"))) {
                          navigate(createPageUrl("climbs"));
                        }
                      }}
                      className="mountain-gradient hover:opacity-90 transition-opacity"
                    >
                      Go to Climbs
                    </Button>
                  </div>
                )
              : climbs.map((c) => {
                  const gearUrl = `${createPageUrl("ClimbGear")}?climbId=${c.id}`;
                  return (
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
                        <Button
                          onClick={() => {
                            if (handleNavigationAttempt(gearUrl)) {
                              navigate(gearUrl);
                            }
                          }}
                          className="mountain-gradient hover:opacity-90 transition-opacity"
                        >
                          Manage Gear
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (handleNavigationAttempt(createPageUrl("climbs"))) {
                  navigate(createPageUrl("climbs"));
                }
              }}
              className="border-2 border-[#2D5016] text-[#2D5016] hover:!bg-[#2D5016] hover:!text-white transition-all duration-200 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
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
              disabled={isLoading || isSaving || !hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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

      {/* Centered Navigation Confirmation Dialog */}
      <Dialog open={showNavigationDialog} onOpenChange={setShowNavigationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription>
              You have unsaved changes to your gear list. Would you like to save before leaving?
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
