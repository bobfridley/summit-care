import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Mountain, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RiskSummary({ medications }) {
  const getRiskCounts = () => {
    const counts = { low: 0, moderate: 0, high: 0, severe: 0 };
    medications.forEach(med => {
      if (med.altitude_risk_level) {
        counts[med.altitude_risk_level]++;
      }
    });
    return counts;
  };

  const getOverallRisk = () => {
    const riskCounts = getRiskCounts();
    if (riskCounts.severe > 0) return "severe";
    if (riskCounts.high > 0) return "high"; 
    if (riskCounts.moderate > 0) return "moderate";
    return "low";
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'severe': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'moderate': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskRecommendations = () => {
    const overallRisk = getOverallRisk();
    const recommendations = [];
    
    switch (overallRisk) {
      case 'severe':
        recommendations.push("Obtain medical clearance before ascending above 5,000ft");
        recommendations.push("Consider postponing expedition or medication adjustments");
        recommendations.push("Carry emergency oxygen and descent plan");
        break;
      case 'high':
        recommendations.push("Ascend gradually with extra rest days");
        recommendations.push("Monitor vital signs and symptoms closely");
        recommendations.push("Consider lower altitude objectives");
        break;
      case 'moderate':
        recommendations.push("Follow standard acclimatization protocols");
        recommendations.push("Monitor for unusual symptoms");
        recommendations.push("Maintain consistent medication schedule");
        break;
      default:
        recommendations.push("Standard mountaineering precautions apply");
        recommendations.push("Continue regular medication routine");
        recommendations.push("Monitor general health and hydration");
    }
    
    return recommendations;
  };

  const riskCounts = getRiskCounts();
  const overallRisk = getOverallRisk();

  return (
    <Card className="alpine-card border-0 shadow-lg">
      <CardHeader className="border-b border-stone-100">
        <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Shield className="w-6 h-6 text-secondary-green" />
          Risk Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getRiskColor(overallRisk)} mb-2`}>
            {overallRisk.toUpperCase()}
          </div>
          <Badge className={`${overallRisk === 'severe' || overallRisk === 'high' ? 'bg-red-100 text-red-800 border-red-200' : 
                              overallRisk === 'moderate' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-green-100 text-green-800 border-green-200'} border font-medium`}>
            Overall Risk Level
          </Badge>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-text-primary">Risk Breakdown:</h4>
          {Object.entries(riskCounts).map(([level, count]) => (
            count > 0 && (
              <div key={level} className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                <div className="flex items-center gap-2">
                  {level === 'severe' || level === 'high' ? (
                    <AlertTriangle className={`w-4 h-4 ${getRiskColor(level)}`} />
                  ) : level === 'moderate' ? (
                    <Info className={`w-4 h-4 ${getRiskColor(level)}`} />
                  ) : (
                    <Shield className={`w-4 h-4 ${getRiskColor(level)}`} />
                  )}
                  <span className="font-medium text-text-primary capitalize">{level} Risk</span>
                </div>
                <span className="font-semibold text-text-primary">{count}</span>
              </div>
            )
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-text-primary flex items-center gap-2">
            <Mountain className="w-4 h-4" />
            Recommendations:
          </h4>
          <ul className="space-y-2">
            {getRiskRecommendations().map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="w-1.5 h-1.5 bg-primary-blue rounded-full mt-2 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {medications.length === 0 && (
          <div className="text-center text-text-secondary">
            <Link 
              to={createPageUrl("medications")} 
              className="text-primary-blue hover:text-secondary-blue font-medium"
            >
              Add medications to see risk assessment →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
