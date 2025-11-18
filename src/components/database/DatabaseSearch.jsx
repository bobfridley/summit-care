import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function DatabaseSearch({ searchQuery, setSearchQuery }) {
  return (
    <Card className="alpine-card border-0 shadow-lg mb-6">
      <CardContent className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medications by name, category, or generic name..."
            className="pl-10 pr-4 py-3 text-lg border-stone-200 focus:border-primary-blue"
          />
        </div>
      </CardContent>
    </Card>
  );
}