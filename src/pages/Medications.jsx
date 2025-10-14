
import React, { useState, useEffect } from "react";
// import { Medication } from "@/api/entities"; // Replaced by mysqlMedications
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { mysqlMedications } from "@/api/functions"; // New import

import MedicationForm from "../components/medications/MedicationForm";
import MedicationList from "../components/medications/MedicationList";
// import DemoDisclaimer from "../components/common/DemoDisclaimer"; // removed, shown from Layout

export default function MedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    setIsLoading(true);
    try {
      const { data } = await mysqlMedications({ action: "list" });
      if (data?.ok) {
        setMedications(data.items || []);
      } else {
        console.error("Error loading medications:", data?.error || "unknown");
      }
    } catch (error) {
      console.error("Error loading medications:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (medicationData) => {
    try {
      if (editingMedication) {
        const { data } = await mysqlMedications({ action: "update", id: editingMedication.id, payload: medicationData });
        if (!data?.ok) {
          console.error("Error updating medication:", data?.error || "unknown");
        }
      } else {
        const { data } = await mysqlMedications({ action: "create", payload: medicationData });
        if (!data?.ok) {
          console.error("Error creating medication:", data?.error || "unknown");
        }
      }
      setShowForm(false);
      setEditingMedication(null);
      loadMedications();
    } catch (error) {
      console.error("Error saving medication:", error);
    }
  };

  const handleEdit = (medication) => {
    setEditingMedication(medication);
    setShowForm(true);
  };

  const handleDelete = async (medicationId) => {
    try {
      const { data } = await mysqlMedications({ action: "delete", id: medicationId });
      if (!data?.ok) {
        console.error("Error deleting medication:", data?.error || "unknown");
      }
      loadMedications();
    } catch (error) {
      console.error("Error deleting medication:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">My Medications</h1>
            <p className="text-text-secondary text-lg">Track medications and their altitude impacts</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="mountain-gradient hover:opacity-90 transition-opacity shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Medication
          </Button>
        </div>

        {/* Removed inline disclaimer; Layout handles it conditionally */}

        {showForm && (
          <MedicationForm
            medication={editingMedication}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingMedication(null);
            }}
          />
        )}

        <MedicationList
          medications={medications}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
