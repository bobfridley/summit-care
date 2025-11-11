import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="alpine-card border-0 shadow-lg">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Demo Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-text-secondary">
            <p className="text-sm">
              This app is a product demo. Medication and risk information are sample data and not medical advice. 
              Do not use for medical decisions. Always consult a qualified physician.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}