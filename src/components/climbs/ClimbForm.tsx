import React, { useState } from 'react';
import { Mountain, X, Save } from '@/components/icons';
import GearEditor from './GearEditor';
import PackWeightSummary from './PackWeightSummary';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

// local pieces referenced by the form
const GearEditorTyped = GearEditor as unknown as React.FC<GearEditorProps>;
const PackWeightSummaryTyped = PackWeightSummary as unknown as React.FC<PackWeightSummaryProps>;

// ---- local typing shims ----
type GearImportance = 'critical' | 'high' | 'recommended' | 'optional';
type GearCategory =
  | 'safety'
  | 'clothing'
  | 'technical'
  | 'camping'
  | 'navigation'
  | 'health'
  | 'food_water'
  | 'other';

type GearItem = {
  item_name: string;
  quantity?: number;
  estimated_weight_kg?: number;
  importance?: GearImportance;
  category?: GearCategory;
  notes?: string;
  required?: boolean;
};

type GearEditorProps = { gear: GearItem[]; onChange: (next: GearItem[]) => void };
type PackWeightSummaryProps = { gear: GearItem[]; basePackWeightKg: number };
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'extreme';
type ClimbingStyle = 'day_hike' | 'overnight' | 'multi_day' | 'expedition' | 'technical_climb';
type Status = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface ClimbFormModel {
  mountain_name: string;
  elevation: number | ''; // keep '' while editing
  location: string;
  planned_start_date: string; // yyyy-mm-dd
  duration_days: number | '';
  difficulty_level: DifficultyLevel;
  climbing_style: ClimbingStyle;
  group_size: number | '';
  emergency_contact: string;
  weather_concerns: string;
  special_equipment: string;
  required_gear: any[]; // tighten when you have a GearItem type
  backpack_name: string;
  base_pack_weight_kg: number | '';
  status: Status;
  notes: string;
}

export interface ClimbFormProps {
  climb?: Partial<ClimbFormModel>; // allow partials when editing
  onSubmit: (data: ClimbFormModel) => void;
  onCancel: () => void;
}

export default function ClimbForm({ climb, onSubmit, onCancel }: ClimbFormProps) {
  const [formData, setFormData] = useState<ClimbFormModel>({
    mountain_name: '',
    elevation: '',
    location: '',
    planned_start_date: '',
    duration_days: '',
    difficulty_level: 'intermediate',
    climbing_style: 'day_hike',
    group_size: '',
    emergency_contact: '',
    weather_concerns: '',
    special_equipment: '',
    required_gear: [],
    backpack_name: '',
    base_pack_weight_kg: '',
    status: 'planning',
    notes: '',
    ...climb, // hydrate defaults with incoming climb (fields not provided keep defaults)
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Normalize numeric fields before submit
    const toNum = (v: number | '' | undefined) => (typeof v === 'number' ? v : v ? Number(v) : 0);

    const payload: ClimbFormModel = {
      ...formData,
      elevation: toNum(formData.elevation),
      duration_days: formData.duration_days === '' ? '' : toNum(formData.duration_days),
      group_size: formData.group_size === '' ? '' : toNum(formData.group_size),
      base_pack_weight_kg:
        formData.base_pack_weight_kg === '' ? '' : Number(formData.base_pack_weight_kg),
    };

    onSubmit(payload);
  };

  const handleChange = <K extends keyof ClimbFormModel>(field: K, value: ClimbFormModel[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className='alpine-card border-0 shadow-lg mb-8'>
      <CardHeader className='border-b border-stone-100'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl font-bold text-text-primary flex items-center gap-2'>
            <Mountain className='w-6 h-6 text-primary-blue' />
            {climb ? 'Edit Climb Plan' : 'Plan New Climb'}
          </CardTitle>
          <Button variant='ghost' size='icon' onClick={onCancel}>
            <X className='w-5 h-5' />
          </Button>
        </div>
      </CardHeader>

      <CardContent className='p-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='mountain_name' className='text-text-primary font-medium'>
                Mountain/Peak Name *
              </Label>
              <Input
                id='mountain_name'
                value={formData.mountain_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('mountain_name', e.target.value)
                }
                placeholder='e.g. Mount Whitney'
                required
                className='border-stone-200 focus:border-primary-blue'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='elevation' className='text-text-primary font-medium'>
                Elevation (feet) *
              </Label>
              <Input
                id='elevation'
                type='number'
                value={formData.elevation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('elevation', e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder='e.g. 14505'
                required
                className='border-stone-200 focus:border-primary-blue'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='location' className='text-text-primary font-medium'>
              Location/Region
            </Label>
            <Input
              id='location'
              value={formData.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('location', e.target.value)
              }
              placeholder='e.g. Sierra Nevada, California'
              className='border-stone-200 focus:border-primary-blue'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='planned_start_date' className='text-text-primary font-medium'>
                Start Date *
              </Label>
              <Input
                id='planned_start_date'
                type='date'
                value={formData.planned_start_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('planned_start_date', e.target.value)
                }
                required
                className='border-stone-200 focus:border-primary-blue'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='duration_days' className='text-text-primary font-medium'>
                Duration (days)
              </Label>
              <Input
                id='duration_days'
                type='number'
                min={1}
                value={formData.duration_days}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('duration_days', e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder='e.g. 3'
                className='border-stone-200 focus:border-primary-blue'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='group_size' className='text-text-primary font-medium'>
                Group Size
              </Label>
              <Input
                id='group_size'
                type='number'
                min={1}
                value={formData.group_size}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('group_size', e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder='e.g. 4'
                className='border-stone-200 focus:border-primary-blue'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='difficulty_level' className='text-text-primary font-medium'>
                Difficulty Level
              </Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value: DifficultyLevel) => handleChange('difficulty_level', value)}
              >
                <SelectTrigger className='border-stone-200 focus:border-primary-blue'>
                  <SelectValue placeholder='Select difficulty' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='beginner'>Beginner</SelectItem>
                  <SelectItem value='intermediate'>Intermediate</SelectItem>
                  <SelectItem value='advanced'>Advanced</SelectItem>
                  <SelectItem value='expert'>Expert</SelectItem>
                  <SelectItem value='extreme'>Extreme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='climbing_style' className='text-text-primary font-medium'>
                Climbing Style
              </Label>
              <Select
                value={formData.climbing_style}
                onValueChange={(value: ClimbingStyle) => handleChange('climbing_style', value)}
              >
                <SelectTrigger className='border-stone-200 focus:border-primary-blue'>
                  <SelectValue placeholder='Select style' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='day_hike'>Day Hike</SelectItem>
                  <SelectItem value='overnight'>Overnight</SelectItem>
                  <SelectItem value='multi_day'>Multi-day</SelectItem>
                  <SelectItem value='expedition'>Expedition</SelectItem>
                  <SelectItem value='technical_climb'>Technical Climb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='emergency_contact' className='text-text-primary font-medium'>
              Emergency Contact
            </Label>
            <Input
              id='emergency_contact'
              value={formData.emergency_contact}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('emergency_contact', e.target.value)
              }
              placeholder='Name and phone number'
              className='border-stone-200 focus:border-primary-blue'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='weather_concerns' className='text-text-primary font-medium'>
                Weather Concerns
              </Label>
              <Textarea
                id='weather_concerns'
                value={formData.weather_concerns}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleChange('weather_concerns', e.target.value)
                }
                placeholder='e.g. Storm season, temperature extremes...'
                className='h-20 border-stone-200 focus:border-primary-blue'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='special_equipment' className='text-text-primary font-medium'>
                Special Equipment
              </Label>
              <Textarea
                id='special_equipment'
                value={formData.special_equipment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleChange('special_equipment', e.target.value)
                }
                placeholder='e.g. Crampons, oxygen, technical gear...'
                className='h-20 border-stone-200 focus:border-primary-blue'
              />
            </div>
          </div>

          {/* Backpack fields */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='backpack_name' className='text-text-primary font-medium'>
                Backpack
              </Label>
              <Input
                id='backpack_name'
                value={formData.backpack_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('backpack_name', e.target.value)
                }
                placeholder='e.g. Osprey Exos 48'
                className='border-stone-200 focus:border-primary-blue'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='base_pack_weight_kg' className='text-text-primary font-medium'>
                Base Pack Weight (kg)
              </Label>
              <Input
                id='base_pack_weight_kg'
                type='number'
                min={0}
                step='0.1'
                value={formData.base_pack_weight_kg}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(
                    'base_pack_weight_kg',
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                placeholder='e.g. 1.2'
                className='border-stone-200 focus:border-primary-blue'
              />
            </div>
          </div>

          {/* Gear editor */}
          <GearEditorTyped
            gear={formData.required_gear as GearItem[]}
            onChange={(next: GearItem[]) =>
              setFormData((prev) => ({ ...prev, required_gear: next }))
            }
          />

          {/* Live pack weight estimate */}
          <div className='pt-2'>
            <PackWeightSummaryTyped
              gear={formData.required_gear as GearItem[]}
              basePackWeightKg={
                formData.base_pack_weight_kg === '' ? 0 : formData.base_pack_weight_kg
              }
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes' className='text-text-primary font-medium'>
              Additional Notes
            </Label>
            <Textarea
              id='notes'
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleChange('notes', e.target.value)
              }
              placeholder='Any additional planning notes, route details, or considerations...'
              className='h-24 border-stone-200 focus:border-primary-blue'
            />
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
            <Button type='submit' className='mountain-gradient hover:opacity-90 transition-opacity'>
              <Save className='w-4 h-4 mr-2' />
              {climb ? 'Update' : 'Save'} Climb Plan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
