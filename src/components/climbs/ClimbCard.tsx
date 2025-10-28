// @ts-nocheck // ← remove this line later once everything compiles cleanly
import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

import {
  Mountain,
  MapPin,
  ListChecks,
  Edit,
  Trash2,
  Ruler,
  AlertTriangle,
  Calendar,
  Clock,
  UsersIcon,
} from '@/components/icons';
import { createPageUrl } from '@/utils';

// shadcn/ui
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// local components
import GearList from './GearList';
import PackWeightSummary from './PackWeightSummary';

// If you already have a shared Climb type, you can import it instead.
// import type { Climb as ClimbDTO } from '@/shared/type';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'extreme';
type ClimbStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
type ClimbingStyle = 'day_hike' | 'overnight' | 'multi_day' | 'expedition' | 'technical_climb';

export interface ClimbLike {
  id: number;
  mountain_name: string;
  elevation: number;
  planned_start_date: string | Date;
  status: ClimbStatus;
  difficulty_level: DifficultyLevel;
  climbing_style: ClimbingStyle;

  location?: string | null;
  duration_days?: number | null;
  group_size?: number | null;
  notes?: string | null;
  weather_concerns?: string | null;

  // gear
  required_gear?: unknown[] | null;
  base_pack_weight_kg?: number | null;
}

export interface ClimbCardProps {
  climb: ClimbLike;
  onEdit: (climb: ClimbLike) => void;
  onDelete: (id: number) => void;
}

export default function ClimbCard({ climb, onEdit, onDelete }: ClimbCardProps) {
  const getDifficultyColor = (level: DifficultyLevel) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advanced':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expert':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'extreme':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: ClimbStatus) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'completed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getElevationRisk = (elevation: number) => {
    if (elevation >= 14000) return { level: 'extreme' as const, color: 'text-red-600' };
    if (elevation >= 12000) return { level: 'high' as const, color: 'text-orange-600' };
    if (elevation >= 10000) return { level: 'moderate' as const, color: 'text-yellow-600' };
    if (elevation >= 8000) return { level: 'low' as const, color: 'text-blue-600' };
    return { level: 'minimal' as const, color: 'text-green-600' };
  };

  const elevationRisk = getElevationRisk(climb.elevation);

  // normalize date
  const startDate =
    typeof climb.planned_start_date === 'string'
      ? new Date(climb.planned_start_date)
      : climb.planned_start_date;

  return (
    <Card className='alpine-card border-0 shadow-lg hover:shadow-xl transition-all duration-300'>
      <CardHeader className='border-b border-stone-100'>
        <div className='flex justify-between items-start'>
          <div className='flex-1'>
            <CardTitle className='text-xl font-bold text-text-primary mb-2 flex items-center gap-2'>
              <Mountain className='w-6 h-6 text-primary-blue' />
              {climb.mountain_name}
            </CardTitle>
            {climb.location && (
              <div className='flex items-center gap-2 text-text-secondary'>
                <MapPin className='w-4 h-4' />
                <span className='text-sm'>{climb.location}</span>
              </div>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Link href={createPageUrl('ClimbGear', { climbId: c.id })}>
              <Button
                variant='outline'
                size='sm'
                className='hover:bg-primary-blue/10 hover:text-primary-blue'
              >
                <ListChecks className='w-4 h-4 mr-1.5' />
                Update Gear
              </Button>
            </Link>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onEdit(climb)}
              className='hover:bg-primary-blue/10 hover:text-primary-blue'
            >
              <Edit className='w-4 h-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onDelete(climb.id)}
              className='hover:bg-red-50 hover:text-red-600'
            >
              <Trash2 className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-6 space-y-4'>
        <div className='flex flex-wrap gap-2'>
          <Badge className={`${getStatusColor(climb.status)} border font-medium`}>
            {climb.status.replace('_', ' ')}
          </Badge>
          <Badge className={`${getDifficultyColor(climb.difficulty_level)} border font-medium`}>
            {climb.difficulty_level}
          </Badge>
          <Badge variant='outline' className='border-stone-200'>
            {climb.climbing_style.replace('_', ' ')}
          </Badge>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Ruler className='w-4 h-4 text-text-secondary' />
              <span className='font-medium text-text-primary'>
                {climb.elevation.toLocaleString()} ft
              </span>
            </div>
            <div className={`flex items-center gap-1 ${elevationRisk.color}`}>
              <AlertTriangle className='w-4 h-4' />
              <span className='text-sm font-medium capitalize'>{elevationRisk.level} risk</span>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-text-secondary' />
            <span className='text-text-primary'>
              {Number.isFinite(startDate?.getTime()) ? format(startDate!, 'MMMM d, yyyy') : '—'}
            </span>
          </div>

          {climb.duration_days && (
            <div className='flex items-center gap-2'>
              <Clock className='w-4 h-4 text-text-secondary' />
              <span className='text-text-primary'>
                {climb.duration_days} day{climb.duration_days !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {climb.group_size && (
            <div className='flex items-center gap-2'>
              <UsersIcon className='w-4 h-4 text-text-secondary' />
              <span className='text-text-primary'>
                {climb.group_size} climber{climb.group_size !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {climb.notes && (
          <div className='p-3 bg-stone-50 rounded-lg border border-stone-100'>
            <p className='text-sm text-text-secondary line-clamp-2'>{climb.notes}</p>
          </div>
        )}

        {climb.weather_concerns && (
          <div className='flex items-start gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200'>
            <AlertTriangle className='w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0' />
            <p className='text-xs text-yellow-800'>
              <span className='font-medium'>Weather:</span> {climb.weather_concerns}
            </p>
          </div>
        )}

        {/* Required Gear */}
        {Array.isArray(climb.required_gear) && climb.required_gear.length > 0 && (
          <div className='pt-2 border-t border-stone-100 space-y-3'>
            <PackWeightSummary
              gear={formData.required_gear as any[]} // <- same cast here
              basePackWeightKg={
                formData.base_pack_weight_kg === '' ? 0 : formData.base_pack_weight_kg
              }
            />
            <GearList gear={climb.required_gear as unknown[]} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
