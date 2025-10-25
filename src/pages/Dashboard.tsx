// @ts-nocheck
import { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
// removed unused Alert components
import { mysqlMedications } from '@api/functions';
import { mysqlClimbs } from '@api/functions';


export default function Dashboard() {
  const [medications, setMedications] = useState([]);
  const [climbs, setClimbs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Call the object-style stubs
      const [medsResp, climbsResp] = await Promise.all([
        mysqlMedications.list({ limit: 20 }),
        mysqlClimbs.list({ order: 'planned_start_date', dir: 'DESC', limit: 5 }),
      ]);

      // Normalize: some api helpers return { data }, some return the payload directly
      const medsData = medsResp?.data ?? medsResp;
      const climbsData = climbsResp?.data ?? climbsResp;

      // Accept either { ok, items } or raw arrays/rows
      const medsItems =
        medsData?.items ?? medsData?.rows ?? (Array.isArray(medsData) ? medsData : []);

      const climbsItems =
        climbsData?.items ?? climbsData?.rows ?? (Array.isArray(climbsData) ? climbsData : []);

      setMedications(medsItems);
      setClimbs(climbsItems);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const getRiskCounts = () => {
    const counts = { low: 0, moderate: 0, high: 0, severe: 0 };
    medications.forEach((med) => {
      if (med.altitude_risk_level) {
        counts[med.altitude_risk_level]++;
      }
    });
    return counts;
  };

  const getOverallRisk = () => {
    const riskCounts = getRiskCounts();
    if (riskCounts.severe > 0) return 'severe';
    if (riskCounts.high > 0) return 'high';
    if (riskCounts.moderate > 0) return 'moderate';
    return 'low';
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
          <div className='space-y-2'>
            <h1 className='text-3xl md:text-4xl font-bold text-text-primary'>Altitude Overview</h1>
            <p className='text-text-secondary text-lg'>
              Track medications, plan climb gear, and estimate pack weight for safer ascents.
            </p>
          </div>
          <div className='flex gap-3'>
            <Link to={createPageUrl('Climbs')}>
              <Button variant='outline' className='shadow-sm'>
                <Mountain className='w-5 h-5 mr-2' />
                Plan Climb
              </Button>
            </Link>
            <Link to={createPageUrl('Medications')}>
              <Button className='mountain-gradient hover:opacity-90 transition-opacity shadow-lg'>
                <Plus className='w-5 h-5 mr-2' />
                Add Medication
              </Button>
            </Link>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card className='alpine-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium text-text-secondary'>
                  Planned Climbs
                </CardTitle>
                <Mountain className='w-5 h-5 text-primary-blue' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-text-primary'>{climbs.length}</div>
              <Badge variant='secondary' className='mt-2 bg-primary-blue/20 text-primary-blue'>
                Upcoming expeditions
              </Badge>
            </CardContent>
          </Card>

          <Card className='alpine-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium text-text-secondary'>
                  Total Medications
                </CardTitle>
                <Pill className='w-5 h-5 text-primary-blue' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-text-primary'>{medications.length}</div>
              <Badge variant='secondary' className='mt-2 bg-accent-green/20 text-primary-green'>
                Active tracking
              </Badge>
            </CardContent>
          </Card>

          <Card className='alpine-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium text-text-secondary'>
                  Risk Level
                </CardTitle>
                <AlertTriangle
                  className={`w-5 h-5 ${
                    getOverallRisk() === 'severe'
                      ? 'text-red-500'
                      : getOverallRisk() === 'high'
                        ? 'text-orange-500'
                        : getOverallRisk() === 'moderate'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                  }`}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-text-primary capitalize'>
                {getOverallRisk()}
              </div>
              <Badge variant='outline' className='mt-2'>
                Overall assessment
              </Badge>
            </CardContent>
          </Card>

          <Card className='alpine-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium text-text-secondary'>
                  Safety Score
                </CardTitle>
                <Shield className='w-5 h-5 text-primary-green' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-text-primary'>
                {Math.max(0, 100 - (getRiskCounts().high * 20 + getRiskCounts().severe * 40))}%
              </div>
              <Badge className='mt-2 bg-primary-green/10 text-primary-green border-primary-green/20'>
                <TrendingUp className='w-3 h-3 mr-1' />
                Calculated
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className='grid lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            <UpcomingClimbs climbs={climbs} isLoading={isLoading} />
            <RiskOverview
              medications={medications}
              isLoading={isLoading}
              riskCounts={getRiskCounts()}
            />
            <RecentMedications medications={medications} isLoading={isLoading} />
          </div>

          <div className='space-y-6'>
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
