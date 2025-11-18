
import { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, AlertTriangle } from "lucide-react";
import { mysqlMedicationDatabase } from "@/api/functions";
import { motion } from "framer-motion";
import DemoDisclaimer from "@/components/common/DemoDisclaimer";
import DatabaseSearch from "../components/database/DatabaseSearch";
import MedicationCard from "../components/database/MedicationCard";
import DatabaseFilters from "../components/database/DatabaseFilters";

export default function DatabasePage() {
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const filterMedications = useCallback(() => {
    let filtered = medications;
    
    if (searchQuery) {
      filtered = filtered.filter(med => 
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(med => med.category === selectedCategory);
    }
    
    if (selectedRiskLevel !== "all") {
      filtered = filtered.filter(med => med.risk_level === selectedRiskLevel);
    }
    
    setFilteredMedications(filtered);
  }, [medications, searchQuery, selectedCategory, selectedRiskLevel]);

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    filterMedications();
  }, [filterMedications]);

  const loadMedications = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await mysqlMedicationDatabase({ action: "list", order: "name", dir: "ASC" });
      console.log("Medication Database Response:", data);
      if (data?.ok) {
        setMedications(data.items || []);
      } else {
        setError(data?.error || "Failed to load medications");
      }
    } catch (error) {
      console.error("Error loading medication database:", error);
      setError(error?.response?.data?.error || error?.message || "Failed to load medications");
    }
    setIsLoading(false);
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">Medication Database</h1>
          <p className="text-text-secondary text-lg">Explore altitude effects of common medications</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DatabaseSearch 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <DatabaseFilters
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedRiskLevel={selectedRiskLevel}
          setSelectedRiskLevel={setSelectedRiskLevel}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-xl animate-pulse" />
            ))
          ) : filteredMedications.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Search className="w-16 h-16 text-secondary-blue mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No medications found</h3>
              <p className="text-text-secondary">
                {medications.length === 0 
                  ? "No medications in database" 
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            filteredMedications.map((medication) => (
              <MedicationCard
                key={medication.id}
                medication={medication}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
