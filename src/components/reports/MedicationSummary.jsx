import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function MedicationSummary({ medications }) {
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
        <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Pill className="w-6 h-6 text-secondary-green" />
          Complete Medication List ({medications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {medications.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="w-12 h-12 text-secondary-green mx-auto mb-4 opacity-50" />
            <p className="text-text-secondary">No medications to include in report</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((medication) => (
              <div
                key={medication.id}
                className="p-4 rounded-xl border border-stone-100 bg-white"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary text-lg">
                      {medication.name}
                    </h3>
                    <p className="text-text-secondary">
                      {medication.dosage}
                    </p>
                  </div>
                  {medication.altitude_risk_level && (
                    <Badge className={`${getRiskColor(medication.altitude_risk_level)} border font-medium flex items-center gap-1`}>
                      <AlertTriangle className="w-3 h-3" />
                      {medication.altitude_risk_level}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <span className="font-medium text-text-primary">Indication:</span>
                    <p className="text-text-secondary text-sm">{medication.indication}</p>
                  </div>
                  
                  {medication.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      <span className="text-text-secondary text-sm">
                        Started {format(new Date(medication.start_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
                
                {medication.notes && (
                  <div className="p-3 bg-stone-50 rounded-lg">
                    <p className="text-sm text-text-secondary">
                      <span className="font-medium text-text-primary">Notes:</span> {medication.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}