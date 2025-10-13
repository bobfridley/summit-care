import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Mountain, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function RiskOverview({ medications, isLoading, riskCounts }) {
  const getRiskColor = (level) => {
    switch (level) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'severe': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <Mountain className="w-4 h-4 text-orange-600" />;
      case 'moderate': return <TrendingDown className="w-4 h-4 text-yellow-600" />;
      case 'low': return <Shield className="w-4 h-4 text-green-600" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="alpine-card border-0 shadow-lg">
      <CardHeader className="border-b border-stone-100">
        <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Mountain className="w-6 h-6 text-primary-blue" />
          Altitude Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : medications.length === 0 ? (
          <div className="text-center py-8">
            <Mountain className="w-12 h-12 text-secondary-blue mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No medications tracked</h3>
            <p className="text-text-secondary">Add your first medication to see risk assessments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(riskCounts).map(([level, count]) => (
              <div
                key={level}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-stone-50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  {getRiskIcon(level)}
                  <span className="font-medium text-text-primary capitalize">
                    {level} Risk
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={`${getRiskColor(level)} border font-medium`}>
                    {count} medication{count !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-primary-green/5 rounded-xl border border-primary-green/10">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary-green mt-0.5" />
                <div>
                  <h4 className="font-medium text-text-primary mb-1">Safety Recommendation</h4>
                  <p className="text-sm text-text-secondary">
                    {riskCounts.severe > 0 || riskCounts.high > 0 
                      ? "Consult your physician before ascending above 8,000ft. Consider medication adjustments."
                      : "Your current medications have minimal altitude impact. Continue monitoring."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}