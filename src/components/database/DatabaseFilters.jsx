import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function DatabaseFilters({ 
  selectedCategory, 
  setSelectedCategory, 
  selectedRiskLevel, 
  setSelectedRiskLevel 
}) {
  const categories = [
    "all",
    "cardiovascular",
    "respiratory", 
    "neurological",
    "gastrointestinal",
    "endocrine",
    "psychiatric",
    "analgesic",
    "antibiotic",
    "other"
  ];

  const riskLevels = ["all", "low", "moderate", "high", "severe"];

  return (
    <Card className="alpine-card border-0 shadow-lg mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-secondary" />
            <span className="font-medium text-text-primary">Filters:</span>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 border-stone-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : 
                   category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
            <SelectTrigger className="w-48 border-stone-200">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              {riskLevels.map(level => (
                <SelectItem key={level} value={level}>
                  {level === "all" ? "All Risk Levels" : 
                   level.charAt(0).toUpperCase() + level.slice(1) + " Risk"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}