import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, Edit, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function MedicationList({ medications, isLoading, onEdit, onDelete }) {
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
          Medication List ({medications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-6 rounded-xl border">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : medications.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="w-16 h-16 text-secondary-green mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No medications added yet</h3>
            <p className="text-text-secondary">Start by adding your first medication to track altitude safety</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((medication) => (
              <div
                key={medication.id}
                className="p-6 rounded-xl border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-300 bg-white"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      {medication.name}
                    </h3>
                    <p className="text-text-secondary font-medium">
                      {medication.dosage}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {medication.altitude_risk_level && (
                      <Badge className={`${getRiskColor(medication.altitude_risk_level)} border font-medium`}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {medication.altitude_risk_level}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(medication)}
                      className="hover:bg-primary-blue/10 hover:text-primary-blue"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(medication.id)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-text-secondary">
                    <span className="font-medium text-text-primary">Indication:</span> {medication.indication}
                  </p>
                  
                  {medication.start_date && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Calendar className="w-4 h-4" />
                      <span>Started {format(new Date(medication.start_date), "MMMM d, yyyy")}</span>
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