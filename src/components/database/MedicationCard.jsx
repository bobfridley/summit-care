import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Info } from "lucide-react";

export default function MedicationCard({ medication }) {
  const getRiskColor = (level) => {
    switch (level) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      cardiovascular: 'bg-red-50 text-red-700 border-red-200',
      respiratory: 'bg-blue-50 text-blue-700 border-blue-200',
      neurological: 'bg-purple-50 text-purple-700 border-purple-200',
      gastrointestinal: 'bg-green-50 text-green-700 border-green-200',
      endocrine: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      psychiatric: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      analgesic: 'bg-pink-50 text-pink-700 border-pink-200',
      antibiotic: 'bg-orange-50 text-orange-700 border-orange-200',
      other: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[category] || colors.other;
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'severe':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'moderate':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <Shield className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <Card className="alpine-card border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b border-stone-100">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-text-primary mb-1">
              {medication.name}
            </CardTitle>
            {medication.generic_name && (
              <p className="text-sm text-text-secondary">
                Generic: {medication.generic_name}
              </p>
            )}
          </div>
          <Badge className={`${getRiskColor(medication.risk_level)} border font-medium flex items-center gap-1`}>
            {getRiskIcon(medication.risk_level)}
            {medication.risk_level}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={`${getCategoryColor(medication.category)} border text-xs`}>
            {medication.category.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>

        {medication.altitude_effects && medication.altitude_effects.length > 0 && (
          <div>
            <h4 className="font-semibold text-text-primary text-sm mb-2">Altitude Effects:</h4>
            <ul className="text-xs text-text-secondary space-y-1">
              {medication.altitude_effects.slice(0, 3).map((effect, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-primary-blue rounded-full mt-1.5 flex-shrink-0" />
                  {effect}
                </li>
              ))}
              {medication.altitude_effects.length > 3 && (
                <li className="text-primary-blue font-medium">
                  +{medication.altitude_effects.length - 3} more effects
                </li>
              )}
            </ul>
          </div>
        )}

        {medication.mountaineering_warnings && medication.mountaineering_warnings.length > 0 && (
          <div>
            <h4 className="font-semibold text-text-primary text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Mountaineering Warnings:
            </h4>
            <ul className="text-xs text-text-secondary space-y-1">
              {medication.mountaineering_warnings.slice(0, 2).map((warning, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                  {warning}
                </li>
              ))}
              {medication.mountaineering_warnings.length > 2 && (
                <li className="text-orange-600 font-medium">
                  +{medication.mountaineering_warnings.length - 2} more warnings
                </li>
              )}
            </ul>
          </div>
        )}

        {medication.recommendations && (
          <div className="p-3 bg-primary-green/5 rounded-lg border border-primary-green/10">
            <p className="text-xs text-text-secondary">
              <span className="font-medium text-primary-green">Recommendation:</span> {medication.recommendations}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}