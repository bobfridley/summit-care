import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mountain, AlertTriangle, Shield, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AltitudeInsights({ medications, overallRisk }) {
  const getAltitudeRecommendations = () => {
    const recommendations = [];
    
    if (overallRisk === 'severe') {
      recommendations.push({
        type: 'warning',
        title: 'Immediate Medical Consultation',
        message: 'Schedule appointment before any altitude exposure above 5,000ft',
        icon: AlertTriangle,
        color: 'text-red-600'
      });
    }
    
    if (overallRisk === 'high') {
      recommendations.push({
        type: 'caution',
        title: 'Gradual Acclimatization',
        message: 'Ascend slowly and monitor symptoms closely',
        icon: Mountain,
        color: 'text-orange-600'
      });
    }
    
    recommendations.push({
      type: 'info',
      title: 'Hydration Priority',
      message: 'Increase fluid intake to 3-4L per day at altitude',
      icon: Info,
      color: 'text-primary-blue'
    });
    
    if (medications.length > 0) {
      recommendations.push({
        type: 'general',
        title: 'Medication Schedule',
        message: 'Maintain consistent dosing times despite timezone changes',
        icon: Shield,
        color: 'text-primary-green'
      });
    }
    
    return recommendations;
  };

  const getElevationGuidance = () => {
    switch (overallRisk) {
      case 'severe':
        return { max: '8,000ft', color: 'text-red-600', recommendation: 'Medical clearance required' };
      case 'high':
        return { max: '10,000ft', color: 'text-orange-600', recommendation: 'Proceed with caution' };
      case 'moderate':
        return { max: '12,000ft', color: 'text-yellow-600', recommendation: 'Monitor closely' };
      default:
        return { max: '14,000ft+', color: 'text-green-600', recommendation: 'Generally safe' };
    }
  };

  const elevationGuidance = getElevationGuidance();

  return (
    <div className="space-y-6">
      <Card className="alpine-card border-0 shadow-lg">
        <CardHeader className="border-b border-stone-100">
          <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Mountain className="w-5 h-5 text-primary-blue" />
            Elevation Guidance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-text-primary mb-2">
              {elevationGuidance.max}
            </div>
            <Badge className={`${elevationGuidance.color} bg-opacity-10 border-opacity-20`}>
              Recommended maximum
            </Badge>
          </div>
          <p className="text-sm text-text-secondary text-center">
            {elevationGuidance.recommendation}
          </p>
        </CardContent>
      </Card>

      <Card className="alpine-card border-0 shadow-lg">
        <CardHeader className="border-b border-stone-100">
          <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary-green" />
            Safety Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {getAltitudeRecommendations().map((rec, index) => {
              const IconComponent = rec.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50">
                  <IconComponent className={`w-5 h-5 ${rec.color} mt-0.5 flex-shrink-0`} />
                  <div>
                    <h4 className="font-medium text-text-primary text-sm mb-1">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {rec.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="alpine-card border-0 shadow-lg">
        <CardHeader className="border-b border-stone-100">
          <CardTitle className="text-lg font-bold text-text-primary">
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-text-primary">High Altitude Emergency</p>
              <p className="text-text-secondary">Descend immediately if severe symptoms</p>
            </div>
            <div>
              <p className="font-medium text-text-primary">Poison Control</p>
              <p className="text-text-secondary">1-800-222-1222</p>
            </div>
            <div className="pt-2 border-t border-stone-100">
              <p className="text-xs text-text-secondary">
                Always carry emergency contact information and medication list during expeditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}