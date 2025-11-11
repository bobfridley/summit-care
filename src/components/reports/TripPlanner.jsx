import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mountain, MapPin, Clock, Calendar, Phone } from "lucide-react";

export default function TripPlanner({ tripDetails, setTripDetails }) {
  const handleChange = (field, value) => {
    setTripDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="alpine-card border-0 shadow-lg">
      <CardHeader className="border-b border-stone-100">
        <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Mountain className="w-6 h-6 text-primary-blue" />
          Trip Planning Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-text-primary font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Destination
            </Label>
            <Input
              id="destination"
              value={tripDetails.destination}
              onChange={(e) => handleChange('destination', e.target.value)}
              placeholder="e.g. Mount Whitney"
              className="border-stone-200 focus:border-primary-blue"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxElevation" className="text-text-primary font-medium flex items-center gap-2">
              <Mountain className="w-4 h-4" />
              Max Elevation (ft)
            </Label>
            <Input
              id="maxElevation"
              value={tripDetails.maxElevation}
              onChange={(e) => handleChange('maxElevation', e.target.value)}
              placeholder="e.g. 14,505"
              className="border-stone-200 focus:border-primary-blue"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-text-primary font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={tripDetails.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="border-stone-200 focus:border-primary-blue"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-text-primary font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration (days)
            </Label>
            <Input
              id="duration"
              value={tripDetails.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="e.g. 3"
              className="border-stone-200 focus:border-primary-blue"
            />
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <Label htmlFor="emergencyContact" className="text-text-primary font-medium flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Emergency Contact
          </Label>
          <Input
            id="emergencyContact"
            value={tripDetails.emergencyContact}
            onChange={(e) => handleChange('emergencyContact', e.target.value)}
            placeholder="Name and phone number"
            className="border-stone-200 focus:border-primary-blue"
          />
        </div>
      </CardContent>
    </Card>
  );
}