
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle, Shield, Mountain, Plus, Pill, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mysqlMedications } from "@/api/functions";
import { mysqlClimbs } from "@/api/functions";

import RiskOverview from "../components/dashboard/RiskOverview";
import RecentMedications from "../components/dashboard/RecentMedications";
import AltitudeInsights from "../components/dashboard/AltitudeInsights";
import UpcomingClimbs from "../components/dashboard/UpcomingClimbs";

export default function Dashboard() {
  const [medications, setMedications] = useState([]);
  const [climbs, setClimbs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [{ data: medsRes }, { data: climbsRes }] = await Promise.all([
        mysqlMedications({ action: "list" }),
        mysqlClimbs({ action: "list", order: "planned_start_date", dir: "DESC", limit: 5 })
      ]);
      
      if (medsRes?.ok) {
        setMedications(medsRes.items || []);
      } else {
        console.error("Medications error:", medsRes?.error);
      }
      
      if (climbsRes?.ok) {
        setClimbs(climbsRes.items || []);
      } else {
        console.error("Climbs error:", climbsRes?.error);
      }
      
      // Only set error if both failed
      if (!medsRes?.ok && !climbsRes?.ok) {
        setError("Failed to load dashboard data. Please check your database connection.");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError(error?.response?.data?.error || error?.message || "Failed to load dashboard data");
    }
    setIsLoading(false);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">SummitCare Overview</h1>
            <p className="text-text-secondary text-lg">Track medications, plan climb gear, and estimate pack weight for safer ascents.</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("climbs")}>
              <Button variant="outline" className="shadow-sm">
                <Mountain className="w-5 h-5 mr-2" />
                Plan Climb
              </Button>
            </Link>
            <Link to={createPageUrl("medications")}>
              <Button className="mountain-gradient hover:opacity-90 transition-opacity shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Medication
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="alpine-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-text-secondary">Planned Climbs</CardTitle>
                <Mountain className="w-5 h-5 text-primary-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{climbs.length}</div>
              <Badge variant="secondary" className="mt-2 bg-primary-blue/20 text-primary-blue">
                Upcoming expeditions
              </Badge>
            </CardContent>
          </Card>

          <Card className="alpine-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-text-secondary">Total Medications</CardTitle>
                <Pill className="w-5 h-5 text-primary-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{medications.length}</div>
              <Badge variant="secondary" className="mt-2 bg-accent-green/20 text-primary-green">
                Active tracking
              </Badge>
            </CardContent>
          </Card>

          <Card className="alpine-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-text-secondary">Risk Level</CardTitle>
                <AlertTriangle className={`w-5 h-5 ${
                  getOverallRisk() === 'severe' ? 'text-red-500' :
                  getOverallRisk() === 'high' ? 'text-orange-500' :
                  getOverallRisk() === 'moderate' ? 'text-yellow-500' : 'text-green-500'
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary capitalize">{getOverallRisk()}</div>
              <Badge variant="outline" className="mt-2">
                Overall assessment
              </Badge>
            </CardContent>
          </Card>

          <Card className="alpine-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-text-secondary">Safety Score</CardTitle>
                <Shield className="w-5 h-5 text-primary-green" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {Math.max(0, 100 - (getRiskCounts().high * 20 + getRiskCounts().severe * 40))}%
              </div>
              <Badge className="mt-2 bg-primary-green/10 text-primary-green border-primary-green/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                Calculated
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <UpcomingClimbs 
              climbs={climbs}
              isLoading={isLoading}
            />
            <RiskOverview 
              medications={medications}
              isLoading={isLoading}
              riskCounts={getRiskCounts()}
            />
            <RecentMedications 
              medications={medications}
              isLoading={isLoading}
            />
          </div>

          <div className="space-y-6">
            <AltitudeInsights 
              medications={medications}
              climbs={climbs}
              overallRisk={getOverallRisk()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
