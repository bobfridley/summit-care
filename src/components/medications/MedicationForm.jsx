// src/components/medications/MedicationForm.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { X, Save, MessageSquare, Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { mysqlMedications, getMedicationInfo } from "@/api/functions"; // <-- ensure getMedicationInfo exists (can be a stub)

const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return "";
  }
};

export default function MedicationForm({ medication, onSubmit, onCancel, onFormChange, onSaved }) {
  const [formData, setFormData] = useState({
    name: medication?.name || "",
    dosage: medication?.dosage || "",
    indication: medication?.indication || "",
    start_date: formatDateForInput(medication?.start_date) || "",
    notes: medication?.notes || "",
    altitude_risk_level: medication?.altitude_risk_level || "low",
  });

  const [drugInfo, setDrugInfo] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    onFormChange?.(formData);
  }, [formData, onFormChange]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (formData.name && formData.name.length > 2 && !medication?.id) {
        fetchDrugInfo(formData.name);
      }
    }, 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, medication?.id]);

  const fetchDrugInfo = async (medName) => {
    setIsLoadingInfo(true);
    setInfoError("");
    setDrugInfo(null);
    try {
      const { data } = await getMedicationInfo({ medicationName: medName });
      if (data?.ok) {
        setDrugInfo(data);
        if (data.analysis?.risk_level && (!formData.altitude_risk_level || formData.altitude_risk_level === "low")) {
          handleChange("altitude_risk_level", data.analysis.risk_level);
        }
        if (data.generic_name && !formData.notes.includes(`Generic: ${data.generic_name}`)) {
          handleChange(
            "notes",
            formData.notes ? `${formData.notes}\nGeneric: ${data.generic_name}` : `Generic: ${data.generic_name}`
          );
        }
      } else {
        setInfoError(data?.error || "Couldn't fetch drug info");
      }
    } catch (err) {
      console.error("Error fetching drug info:", err);
      setInfoError("Failed to fetch drug information");
    } finally {
      setIsLoadingInfo(false);
    }
  };

  // Map form → API/DB payload
  const toPayload = (f) => ({
    // server/DB fields (adjust if your table differs)
    name: f.name || null,
    dose: f.dosage || null,               // form "dosage" → DB "dose"
    route: null,
    frequency: null,
    started_on: f.start_date || null,     // form "start_date" → DB "started_on"
    stopped_on: null,
    notes: f.notes || null,

    // extra metadata you might store later (server can ignore unknown keys safely)
    indication: f.indication || null,
    altitude_risk_level: f.altitude_risk_level || null,
    user_id: "demo-user",                 // replace when auth is wired
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);

    try {
      // If parent wants to own persistence, delegate to it:
      if (onSubmit) {
        await onSubmit(formData);
        onSaved?.(); // optional hook
        return;
      }

      // Default: persist via our REST helpers
      const action = medication?.id ? "update" : "create";
      const payload = medication?.id ? { id: medication.id, ...toPayload(formData) } : toPayload(formData);

      const { data, status } = await mysqlMedications({ action, ...payload });

      if (!data?.ok) {
        throw new Error(data?.error || `Save failed (HTTP ${status})`);
      }

      // Notify parent to refresh if provided
      onSaved?.(data.item || null);
      // Close form by default
      onCancel?.();
    } catch (err) {
      console.error("Save medication error:", err);
      setSaveError(err?.message || "Failed to save medication");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-800 border-green-200";
      case "moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "severe": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="relative mb-8">
      <Card className="alpine-card border-0 shadow-lg">
        <CardHeader className="border-b border-stone-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-text-primary">
              {medication ? "Edit Medication" : "Add New Medication"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6 pb-24">
            {/* name & dosage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-text-primary font-medium">Medication Name *</Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Lisinopril"
                    required
                    className="border-stone-200 focus:border-primary-blue"
                  />
                  {isLoadingInfo && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-primary-blue" />}
                </div>
                {!medication && formData.name.length > 2 && (
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Automatically checking altitude risks...
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage" className="text-text-primary font-medium">Dosage & Frequency *</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => handleChange("dosage", e.target.value)}
                  placeholder="e.g. 10mg once daily"
                  required
                  className="border-stone-200 focus:border-primary-blue"
                />
              </div>
            </div>

            {/* info panel */}
            {drugInfo && (
              <Alert className="border-primary-blue/30 bg-primary-blue/5">
                <CheckCircle className="h-4 w-4 text-primary-blue" />
                <AlertTitle className="text-primary-blue font-semibold">Altitude Analysis Available</AlertTitle>
                <AlertDescription className="space-y-3 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">Risk Level:</span>
                    <Badge className={getRiskColor(drugInfo.analysis?.risk_level)}>
                      {drugInfo.analysis?.risk_level?.toUpperCase() || "UNKNOWN"}
                    </Badge>
                  </div>

                  {drugInfo.analysis?.warnings?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-text-primary mb-1">Mountaineering Warnings:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                        {drugInfo.analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  {drugInfo.analysis?.recommendations && (
                    <div>
                      <p className="text-sm font-medium text-text-primary mb-1">Recommendations:</p>
                      <p className="text-sm text-text-secondary">{drugInfo.analysis.recommendations}</p>
                    </div>
                  )}

                  <Link to={createPageUrl(`summit-assistant?ask=${encodeURIComponent(`Tell me more about ${formData.name} for high-altitude climbing`)}`)}>
                    <Button type="button" variant="outline" size="sm" className="gap-2 mt-2">
                      <MessageSquare className="w-4 h-4" />
                      Ask Summit Assistant for Details
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {/* info fetch error */}
            {infoError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Couldn&#39;t fetch drug info</AlertTitle>
                <AlertDescription>{infoError}</AlertDescription>
              </Alert>
            )}

            {/* indication */}
            <div className="space-y-2">
              <Label htmlFor="indication" className="text-text-primary font-medium">What is it for? *</Label>
              <Input
                id="indication"
                value={formData.indication}
                onChange={(e) => handleChange("indication", e.target.value)}
                placeholder="e.g. High blood pressure"
                required
                className="border-stone-200 focus:border-primary-blue"
              />
            </div>

            {/* dates & risk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-text-primary font-medium">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  className="border-stone-200 focus:border-primary-blue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altitude_risk_level" className="text-text-primary font-medium">
                  Altitude Risk Level
                  {drugInfo && <span className="text-xs text-primary-blue ml-2">(Auto-detected)</span>}
                </Label>
                <Select
                  value={formData.altitude_risk_level}
                  onValueChange={(v) => handleChange("altitude_risk_level", v)}
                >
                  <SelectTrigger className="border-stone-200 focus:border-primary-blue">
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="moderate">Moderate Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                    <SelectItem value="severe">Severe Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-text-primary font-medium">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any additional information about this medication..."
                className="h-24 border-stone-200 focus:border-primary-blue"
              />
            </div>

            {/* Save error (form-level) */}
            {saveError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Save failed</AlertTitle>
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            {/* Inline “Ask assistant” */}
            <div className="flex justify-start items-center pt-2">
              <Link to={createPageUrl(`summit-assistant?ask=${encodeURIComponent(`What should I know about ${formData.name || "this medication"} when climbing at high altitude?`)}`)}>
                <Button type="button" variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Ask Summit Assistant
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-200 p-4 shadow-lg z-50">
        <div className="max-w-6xl mx-auto flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="mountain-gradient hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : medication ? "Update" : "Save"} Medication
          </Button>
        </div>
      </div>
    </div>
  );
}
