
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RecentMedications({ medications, isLoading }) {
  const getRiskColor = (level) => {
    switch (level) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="alpine-card border-0 shadow-lg">
      <CardHeader className="border-b border-stone-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Pill className="w-6 h-6 text-secondary-green" />
            Current Medications
          </CardTitle>
          <Link 
            to={createPageUrl("medications")} 
            className="text-primary-blue hover:text-secondary-blue transition-colors text-sm font-medium"
          >
            Manage all →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : medications.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="w-12 h-12 text-secondary-green mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No medications added</h3>
            <p className="text-text-secondary mb-4">Start tracking your medications for altitude safety</p>
            <Link to={createPageUrl("medications")}>
              <button className="px-4 py-2 mountain-gradient text-white rounded-lg hover:opacity-90 transition-opacity">
                Add Medication
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.slice(0, 5).map((medication) => (
              <div
                key={medication.id}
                className="p-4 rounded-xl hover:bg-stone-50 transition-colors duration-200 border border-stone-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary">{medication.name}</h3>
                    <p className="text-sm text-text-secondary">{medication.dosage}</p>
                  </div>
                  {medication.altitude_risk_level && (
                    <Badge className={`${getRiskColor(medication.altitude_risk_level)} border font-medium`}>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {medication.altitude_risk_level}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-text-secondary mb-2">
                  <strong>For:</strong> {medication.indication}
                </p>
                
                {medication.start_date && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Calendar className="w-3 h-3" />
                    Started {format(new Date(medication.start_date), "MMM d, yyyy")}
                  </div>
                )}
                
                {medication.notes && (
                  <p className="text-xs text-text-secondary mt-2 bg-stone-50 p-2 rounded">
                    {medication.notes}
                  </p>
                )}
              </div>
            ))}
            
            {medications.length > 5 && (
              <div className="text-center pt-4">
                <Link 
                  to={createPageUrl("medications")} 
                  className="text-primary-blue hover:text-secondary-blue transition-colors font-medium"
                >
                  View all {medications.length} medications →
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
