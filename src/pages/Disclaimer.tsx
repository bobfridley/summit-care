// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from '@/components/icons';
import { COLORS } from '@shared/constants';

// Optional props (so it’s reusable, even if you don’t use them now)
export interface DisclaimerProps {
  title?: string;
  message?: string;
}

const Disclaimer: React.FC<DisclaimerProps> = ({
  title = 'Demo Disclaimer',
  message = 'This app is a product demo. Medication and risk information are sample data and not medical advice. Do not use for medical decisions. Always consult a qualified physician.',
}) => {
  return (
    <div
      className='min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8'
      style={{ color: COLORS.brandGreen }}
    >
      <div className='max-w-3xl mx-auto'>
        <Card className='alpine-card border-0 shadow-lg'>
          <CardHeader className='border-b border-stone-100'>
            <CardTitle className='text-xl font-bold text-text-primary flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5 text-red-600' />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className='p-6 text-text-secondary'>
            <p className='text-sm leading-relaxed'>{message}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Disclaimer;
