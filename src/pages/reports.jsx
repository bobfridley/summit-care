import { useState, useEffect } from "react";
import { mysqlMedications } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Download, Calendar, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import TripPlanner from "../components/reports/TripPlanner";
import RiskSummary from "../components/reports/RiskSummary";
import MedicationSummary from "../components/reports/MedicationSummary";

export default function ReportsPage() {
  const [medications, setMedications] = useState([]);
  const [tripDetails, setTripDetails] = useState({
    destination: "",
    maxElevation: "",
    duration: "",
    startDate: "",
    emergencyContact: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
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
  };

  const generateReport = () => {
    setIsGenerating(true);
    setError("");
    
    setTimeout(() => {
      try {
        const reportData = {
          tripDetails,
          medications,
          generatedDate: new Date().toISOString(),
          riskAssessment: medications.reduce((acc, med) => {
            acc[med.altitude_risk_level] = (acc[med.altitude_risk_level] || 0) + 1;
            return acc;
          }, {})
        };

        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mountaineering-medical-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Error generating report:", err);
        setError("Failed to generate report");
      } finally {
        setIsGenerating(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Trip Reports</h1>
            <p className="text-text-secondary text-lg">Generate comprehensive medication summaries for your expeditions</p>
          </div>
          <Button 
            onClick={generateReport}
            disabled={isGenerating || medications.length === 0}
            className="mountain-gradient hover:opacity-90 transition-opacity shadow-lg"
          >
            {isGenerating ? (
              <>
                <Calendar className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TripPlanner
              tripDetails={tripDetails}
              setTripDetails={setTripDetails}
            />
            <MedicationSummary medications={medications} />
          </div>

          <div className="space-y-6">
            <RiskSummary medications={medications} />
          </div>
        </div>
      </div>
    </div>
  );
}