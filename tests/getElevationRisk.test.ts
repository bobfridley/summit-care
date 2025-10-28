import { describe, it, expect } from 'vitest'; // or "jest" if you use Jest
import { getElevationRisk } from '@/components/dashboard/UpcomingClimbs';

describe('getElevationRisk()', () => {
  it('returns extreme risk for 14,000+ ft climbs', () => {
    expect(getElevationRisk(14500)).toEqual({
      level: 'extreme',
      color: 'text-red-600',
    });
  });

  it('returns high risk for 12,000–13,999 ft climbs', () => {
    expect(getElevationRisk(12800)).toEqual({
      level: 'high',
      color: 'text-orange-600',
    });
  });

  it('returns moderate risk for 10,000–11,999 ft climbs', () => {
    expect(getElevationRisk(10500)).toEqual({
      level: 'moderate',
      color: 'text-yellow-600',
    });
  });

  it('returns low risk for 8,000–9,999 ft climbs', () => {
    expect(getElevationRisk(8500)).toEqual({
      level: 'low',
      color: 'text-blue-600',
    });
  });

  it('returns minimal risk below 8,000 ft', () => {
    expect(getElevationRisk(6000)).toEqual({
      level: 'minimal',
      color: 'text-green-600',
    });
  });
});
