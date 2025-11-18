import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mountain, Calendar, MapPin, Ruler, AlertTriangle } from "lucide-react";
import { format, differenceInCalendarDays, parseISO, isValid } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ── Safe date helpers ─────────────────────────────────────────────────────────
const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  const d = parseISO(value);
  return isValid(d) ? d : null;
};

const fmtDate = (value, fmt = "MMM d, yyyy") => {
  const d = toDate(value);
  return d ? format(d, fmt) : "TBD";
};

export default function UpcomingClimbs({ climbs, isLoading }) {
  const getElevationRisk = (elevation) => {
    const e = Number(elevation) || 0;
    if (e >= 14000) return { level: 'extreme', color: 'text-red-600' };
    if (e >= 12000) return { level: 'high', color: 'text-orange-600' };
    if (e >= 10000) return { level: 'moderate', color: 'text-yellow-600' };
    if (e >= 8000) return { level: 'low', color: 'text-blue-600' };
    return { level: 'minimal', color: 'text-green-600' };
  };

  const getDaysUntilClimb = (startDate) => {
    const d = toDate(startDate);
    if (!d) return NaN;
    // calendar days avoids time-of-day & TZ instability
    return differenceInCalendarDays(d, new Date());
  };

  const stableSortAscByDate = (arr, key) =>
    arr.slice().sort((a, b) => {
      const da = toDate(a?.[key]);
      const db = toDate(b?.[key]);
      if (da && db) return da - db;
      if (da) return -1;
      if (db) return 1;
      return 0;
    });

  const stableSortDescByDate = (arr, key) =>
    arr.slice().sort((a, b) => {
      const da = toDate(a?.[key]);
      const db = toDate(b?.[key]);
      if (da && db) return db - da;
      if (db) return 1;
      if (da) return -1;
      return 0;
    });

  // Prefer upcoming; otherwise show most recent active
  const activeClimbs = (climbs || []).filter(
    (c) => c?.status !== 'completed' && c?.status !== 'cancelled'
  );

  const upcomingClimbs = stableSortAscByDate(
    activeClimbs.filter((c) => Number.isFinite(getDaysUntilClimb(c?.planned_start_date))),
    "planned_start_date"
  )
    .filter((c) => getDaysUntilClimb(c.planned_start_date) >= 0)
    .slice(0, 3);

  const recentActiveClimbs = stableSortDescByDate(activeClimbs, "planned_start_date").slice(0, 3);

  const displayClimbs = upcomingClimbs.length > 0 ? upcomingClimbs : recentActiveClimbs;
  const showingFallback = upcomingClimbs.length === 0 && recentActiveClimbs.length > 0;

  return (
    <Card className="alpine-card border-0 shadow-lg">
      <CardHeader className="border-b border-stone-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Mountain className="w-6 h-6 text-primary-blue" />
            Upcoming Climbs
          </CardTitle>
          <Link
            to={createPageUrl("climbs")}
            className="text-primary-blue hover:text-secondary-blue transition-colors text-sm font-medium"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(2).fill(0).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : displayClimbs.length === 0 ? (
          <div className="text-center py-8">
            <Mountain className="w-12 h-12 text-secondary-blue mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No upcoming climbs</h3>
            <p className="text-text-secondary mb-4">Start planning your next adventure</p>
            <Link to={createPageUrl("climbs")}>
              <button className="px-4 py-2 mountain-gradient text-white rounded-lg hover:opacity-90 transition-opacity">
                Plan a Climb
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {showingFallback && (
              <div className="text-xs text-text-secondary -mt-2 mb-2">
                No future climbs found — showing your most recent plans.
              </div>
            )}

            {displayClimbs.map((climb) => {
              const elevationRisk = getElevationRisk(climb?.elevation);
              const daysUntil = getDaysUntilClimb(climb?.planned_start_date);
              const showDays = Number.isFinite(daysUntil) && daysUntil >= 0 && daysUntil <= 30;

              return (
                <div
                  key={climb.id ?? `${climb.mountain_name}-${climb.planned_start_date ?? 'na'}`}
                  className="p-4 rounded-xl hover:bg-stone-50 transition-colors duration-200 border border-stone-100"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-text-primary flex items-center gap-2">
                        <Mountain className="w-4 h-4 text-primary-blue" />
                        {climb?.mountain_name || "Unnamed climb"}
                      </h3>
                      {climb?.location && (
                        <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                          <MapPin className="w-3 h-3" />
                          {climb.location}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${elevationRisk.color} bg-opacity-10 border-opacity-20 text-xs`}>
                        {elevationRisk.level}
                      </Badge>
                      {showDays && (
                        <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                          {daysUntil === 0 ? 'Today!' : `${daysUntil} days`}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-text-secondary" />
                      <span className="text-text-primary font-medium">
                        {Number(climb?.elevation)?.toLocaleString?.() || climb?.elevation || '—'} ft
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      <span className="text-text-primary">
                        {fmtDate(climb?.planned_start_date, "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  {climb?.weather_concerns && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-600" />
                        <p className="text-xs text-yellow-800 line-clamp-1">
                          {climb.weather_concerns}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {(climbs || []).length > 3 && (
              <div className="text-center pt-4">
                <Link
                  to={createPageUrl("climbs")}
                  className="text-primary-blue hover:text-secondary-blue transition-colors font-medium"
                >
                  View all {(climbs || []).length} climbs →
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
