import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function DemoDisclaimer() {
  return (
    <Alert variant="destructive" className="mb-6 bg-red-50 border-2 border-red-200/60">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-semibold">Demo Only — Not Medical Advice</AlertTitle>
      <AlertDescription>
        Medication and risk info are demo data. Do not use for medical decisions. Always consult a physician.
      </AlertDescription>
    </Alert>
  );
}