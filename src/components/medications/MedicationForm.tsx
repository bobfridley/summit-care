// @ts-nocheck // ← remove later after we trim types further
import React, { useState } from 'react';
import { X, Save } from '@/components/icons';

// shadcn/ui
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

type AltitudeRisk = 'low' | 'moderate' | 'high' | 'severe';

export interface MedicationLike {
  id?: number;
  name: string;
  dosage: string;
  indication: string;
  start_date?: string;
  notes?: string;
  altitude_risk_level: AltitudeRisk;
}

export interface MedicationFormProps {
  medication?: MedicationLike;
  onSubmit: (med: MedicationLike) => void;
  onCancel: () => void;
}

export default function MedicationForm({ medication, onSubmit, onCancel }: MedicationFormProps) {
  const [formData, setFormData] = useState<MedicationLike>(
    medication ?? {
      name: '',
      dosage: '',
      indication: '',
      start_date: '',
      notes: '',
      altitude_risk_level: 'low',
    }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof MedicationLike, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className='alpine-card border-0 shadow-lg mb-8'>
      <CardHeader className='border-b border-stone-100'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl font-bold text-text-primary'>
            {medication ? 'Edit Medication' : 'Add New Medication'}
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
              <Label htmlFor='name' className='text-text-primary font-medium'>
                Medication Name *
              </Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('name', e.target.value)
                }
                placeholder='e.g. Lisinopril'
                required
                className='border-stone-200 focus:border-primary-blue'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='dosage' className='text-text-primary font-medium'>
                Dosage &amp; Frequency *
              </Label>
              <Input
                id='dosage'
                value={formData.dosage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('dosage', e.target.value)
                }
                placeholder='e.g. 10mg once daily'
                required
                className='border-stone-200 focus:border-primary-blue'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='indication' className='text-text-primary font-medium'>
              What is it for? *
            </Label>
            <Input
              id='indication'
              value={formData.indication}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('indication', e.target.value)
              }
              placeholder='e.g. High blood pressure'
              required
              className='border-stone-200 focus:border-primary-blue'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='start_date' className='text-text-primary font-medium'>
                Start Date
              </Label>
              <Input
                id='start_date'
                type='date'
                value={formData.start_date ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('start_date', e.target.value)
                }
                className='border-stone-200 focus:border-primary-blue'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='altitude_risk_level' className='text-text-primary font-medium'>
                Altitude Risk Level
              </Label>
              <Select
                value={formData.altitude_risk_level}
                onValueChange={(value: AltitudeRisk) => handleChange('altitude_risk_level', value)}
              >
                <SelectTrigger className='border-stone-200 focus:border-primary-blue'>
                  <SelectValue placeholder='Select risk level' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low Risk</SelectItem>
                  <SelectItem value='moderate'>Moderate Risk</SelectItem>
                  <SelectItem value='high'>High Risk</SelectItem>
                  <SelectItem value='severe'>Severe Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes' className='text-text-primary font-medium'>
              Additional Notes
            </Label>
            <Textarea
              id='notes'
              value={formData.notes ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('notes', e.target.value)
              }
              placeholder='Any additional information about this medication...'
              className='h-24 border-stone-200 focus:border-primary-blue'
            />
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
            <Button type='submit' className='mountain-gradient hover:opacity-90 transition-opacity'>
              <Save className='w-4 h-4 mr-2' />
              {medication ? 'Update' : 'Save'} Medication
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
