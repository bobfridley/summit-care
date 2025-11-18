
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mysqlMedications } from "@/api/functions";
import { motion } from "framer-motion";
import DemoDisclaimer from "@/components/common/DemoDisclaimer";
import MedicationForm from "../components/medications/MedicationForm";
import MedicationList from "../components/medications/MedicationList";

const normalizeFormData = (med) => {
  return {
    name: med?.name || "",
    dosage: med?.dosage || "",
    indication: med?.indication || "",
    start_date: med?.start_date ? new Date(med.start_date).toISOString().split('T')[0] : "",
    notes: med?.notes || "",
    altitude_risk_level: med?.altitude_risk_level || "low"
  };
};

export default function MedicationsPage() {
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Track initial form state to detect changes
  const [initialFormState, setInitialFormState] = useState(null);
  const [currentFormData, setCurrentFormData] = useState(null);

  // Navigation confirmation dialog
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // Store button action to execute

  // Check if form has changes
  const hasFormChanges = useMemo(() => {
    if (!showForm || !initialFormState || !currentFormData) {
      return false;
    }
    const normalizedCurrent = normalizeFormData(currentFormData);
    return JSON.stringify(normalizedCurrent) !== initialFormState;
  }, [showForm, initialFormState, currentFormData]);

  // Intercept navigation attempts on sidebar/back button (links only) and other buttons
  useEffect(() => {
    const handleClick = (e) => {
      // Only intercept if there are unsaved changes
      if (!hasFormChanges) {
        return;
      }

      // Check if the click is on or within a link or button element
      let element = e.target;
      let clickedElement = null;
      let elementType = null;
      
      // Traverse up to find any <a> tag or <button> tag
      while (element && element !== document.body) {
        if (element.tagName === 'A') {
          clickedElement = element;
          elementType = 'link';
          break;
        }
        if (element.tagName === 'BUTTON') {
          clickedElement = element;
          elementType = 'button';
          break;
        }
        element = element.parentElement;
      }

      // If no link or button found, return
      if (!clickedElement) {
        return;
      }

      // For links, check href
      if (elementType === 'link') {
        const href = clickedElement.getAttribute('href');
        
        // Skip if no href, or if it's a hash link or external link
        if (!href || href.startsWith('#') || href.startsWith('http')) {
          return;
        }

        // Prevent the navigation
        e.preventDefault();
        e.stopPropagation();

        // Store the intended destination and show dialog
        setPendingNavigation(href);
        setPendingAction(null);
        setShowNavigationDialog(true);
        return;
      }

      // For buttons, check if it's NOT the save/cancel buttons or UI component buttons
      if (elementType === 'button') {
        const buttonText = clickedElement.textContent?.toLowerCase() || '';
        const buttonType = clickedElement.getAttribute('type');
        const buttonRole = clickedElement.getAttribute('role');
        
        // Skip if it's the Save or Cancel button (they handle the form)
        if (buttonText.includes('save') || 
            buttonText.includes('cancel') || 
            buttonType === 'submit') {
          return;
        }

        // Skip if it's a UI component button (dropdown, select, dialog, etc.)
        if (buttonRole === 'combobox' || 
            buttonRole === 'switch' || 
            buttonRole === 'checkbox' ||
            clickedElement.hasAttribute('data-radix-popover-trigger') ||
            clickedElement.hasAttribute('data-radix-select-trigger') ||
            clickedElement.closest('[role="dialog"]') ||
            clickedElement.closest('[data-radix-popper-content-wrapper]')) {
          return;
        }

        // Prevent the button action
        e.preventDefault();
        e.stopPropagation();

        // Store a callback to re-execute the button click after dialog
        // Note: Store the function directly, not a function that returns a function
        setPendingNavigation(null);
        setPendingAction(() => {
          clickedElement.click();
        });
        setShowNavigationDialog(true);
      }
    };

    // Add event listener in capture phase to catch events early
    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasFormChanges]);

  // NOTE: No beforeunload handler - that causes the native browser dialog
  // We only intercept link clicks (sidebar, back button) and button clicks with the custom modal

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await mysqlMedications({ action: "list" });
      if (data?.ok) {
        setMedications(data.items || []);
      } else {
        setError(data?.error || "Failed to load medications");
      }
    } catch (error) {
      console.error("Error loading medications:", error);
      setError(error?.response?.data?.error || error?.message || "Failed to load medications");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (medicationData) => {
    setError("");
    setIsSaving(true);
    try {
      if (editingMedication) {
        const { data } = await mysqlMedications({ 
          action: "update", 
          id: editingMedication.id, 
          ...medicationData           // ⬅️ flatten
        });
        if (!data?.ok) {
          setError(data?.error || "Failed to update medication");
          setIsSaving(false);
          return;
        }
      } else {
        const { data } = await mysqlMedications({ 
          action: "create", 
          ...medicationData           // ⬅️ flatten
        });
        if (!data?.ok) {
          setError(data?.error || "Failed to create medication");
          setIsSaving(false);
          return;
        }
      }
      setShowForm(false);
      setEditingMedication(null);
      setInitialFormState(null);
      setCurrentFormData(null);
      loadMedications();
    } catch (error) {
      console.error("Error saving medication:", error);
      setError(error?.response?.data?.error || error?.message || "Failed to save medication");
    }
    setIsSaving(false);
  };

  const handleEdit = (medication) => {
    const normalized = normalizeFormData(medication);
    setEditingMedication(medication);
    setInitialFormState(JSON.stringify(normalized));
    setCurrentFormData(normalized);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingMedication(null);
    const emptyForm = normalizeFormData({});
    setInitialFormState(JSON.stringify(emptyForm));
    setCurrentFormData(emptyForm);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    if (hasFormChanges) {
      setPendingNavigation(null); // Clear any pending navigation
      setPendingAction(null); // Clear any pending action
      setShowNavigationDialog(true);
    } else {
      setShowForm(false);
      setEditingMedication(null);
      setInitialFormState(null);
      setCurrentFormData(null);
    }
  };

  const handleSaveAndLeave = async () => {
    console.log('handleSaveAndLeave called');
    if (currentFormData) {
      await handleSubmit(currentFormData);
    }
    setShowNavigationDialog(false);
    
    // Navigate to pending destination if exists
    if (pendingNavigation) {
      console.log('Navigating to:', pendingNavigation);
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
    
    // Execute pending action if exists
    if (pendingAction) {
      console.log('Executing pending action');
      setTimeout(() => {
        // Check if pendingAction is still a function before calling
        if (typeof pendingAction === 'function') {
          pendingAction();
        }
        setPendingAction(null);
      }, 100);
    }
  };

  const handleLeaveWithoutSaving = () => {
    console.log('handleLeaveWithoutSaving called');
    console.log('pendingNavigation:', pendingNavigation);
    console.log('pendingAction:', pendingAction);
    
    // Clear form state first
    setShowForm(false);
    setEditingMedication(null);
    setInitialFormState(null);
    setCurrentFormData(null);
    setShowNavigationDialog(false);
    
    // Navigate to pending destination if exists
    if (pendingNavigation) {
      console.log('Will navigate to:', pendingNavigation);
      setTimeout(() => {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }, 100);
    }
    
    // Execute pending action if exists (after state is cleared)
    if (pendingAction) {
      console.log('Will execute pending action');
      setTimeout(() => {
        console.log('Executing action now');
        // Check if pendingAction is still a function before calling
        if (typeof pendingAction === 'function') {
          pendingAction();
        }
        setPendingAction(null);
      }, 100);
    }
  };

  const handleDelete = async (medicationId) => {
    setError("");
    try {
      const { data } = await mysqlMedications({ action: "delete", id: medicationId });
      if (!data?.ok) {
        setError(data?.error || "Failed to delete medication");
        return;
      }
      loadMedications();
    } catch (error) {
      console.error("Error deleting medication:", error);
      setError(error?.response?.data?.error || error?.message || "Failed to delete medication");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      {/* Animated disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="max-w-6xl mx-auto mb-4"
      >
        <DemoDisclaimer />
      </motion.div>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">My Medications</h1>
            <p className="text-text-secondary text-lg">Track medications and their altitude impacts</p>
          </div>
          <Button
            onClick={handleAddNew}
            className="mountain-gradient hover:opacity-90 transition-opacity shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Medication
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showForm && (
          <MedicationForm
            medication={editingMedication}
            onSubmit={handleSubmit}
            onCancel={handleFormCancel}
            onFormChange={setCurrentFormData}
            isSaving={isSaving}
          />
        )}

        <MedicationList
          medications={medications}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Navigation Confirmation Dialog */}
      <Dialog open={showNavigationDialog} onOpenChange={(open) => {
        // Only allow closing via our buttons, not by clicking outside or ESC
        if (!open) {
          console.log('Dialog trying to close via onOpenChange');
        }
      }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription>
              You have unsaved changes to your medication. Would you like to save before leaving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                console.log('Leave button clicked');
                e.preventDefault();
                e.stopPropagation();
                handleLeaveWithoutSaving();
              }}
              className="flex-1"
            >
              Leave Without Saving
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                console.log('Save button clicked');
                e.preventDefault();
                e.stopPropagation();
                handleSaveAndLeave();
              }}
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
