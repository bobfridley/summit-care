// @ts-nocheck
import { useState, useEffect } from 'react';
import { mysqlClimbs } from '@api/functions';
import { createPageUrl } from '@/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wand2, Plus, Mountain } from '@/components/icons';
import ClimbForm from '@/components/climbs/ClimbForm';
import ClimbCard from '@/components/climbs/ClimbCard';

export default function ClimbsPage() {
  const [climbs, setClimbs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClimb, setEditingClimb] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClimbs();
  }, []);

  const loadClimbs = async () => {
    setIsLoading(true);
    try {
      const { data } = await mysqlClimbs({
        action: 'list',
        order: 'planned_start_date',
        dir: 'DESC',
        include_gear: true,
      });
      setClimbs(data?.ok ? data.items || [] : []);
    } catch (error) {
      console.error('Error loading climbs:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (climbData) => {
    try {
      if (editingClimb) {
        const { data } = await mysqlClimbs({
          action: 'update',
          id: editingClimb.id,
          payload: climbData,
        });
        if (!data?.ok) console.error('Update failed:', data?.error || 'unknown');
      } else {
        const { data } = await mysqlClimbs({ action: 'create', payload: climbData });
        if (!data?.ok) console.error('Create failed:', data?.error || 'unknown');
      }
      setShowForm(false);
      setEditingClimb(null);
      loadClimbs();
    } catch (error) {
      console.error('Error saving climb:', error);
    }
  };

  const handleEdit = (climb) => {
    setEditingClimb(climb);
    setShowForm(true);
  };

  const handleDelete = async (climbId) => {
    try {
      const { data } = await mysqlClimbs({ action: 'delete', id: climbId });
      if (!data?.ok) console.error('Delete failed:', data?.error || 'unknown');
      loadClimbs();
    } catch (error) {
      console.error('Error deleting climb:', error);
    }
  };

  // Default catalog for weights/importance/category to backfill existing items
  /*const _normalizeName = (s) =>
    (s || '')
      .toLowerCase()
      .replace(/[^\w]+/g, ' ')
      .trim();*/

  /*const _defaultItemCatalog = new Map([
    ['first aid kit', { estimated_weight_kg: 0.25, importance: 'critical', category: 'health' }],
    ['water 3l', { estimated_weight_kg: 3.0, importance: 'critical', category: 'food_water' }],
    [
      'nutrition energy bars gels',
      { estimated_weight_kg: 0.5, importance: 'high', category: 'food_water' },
    ],
    [
      'map compass or gps',
      { estimated_weight_kg: 0.15, importance: 'critical', category: 'navigation' },
    ],
    ['headlamp', { estimated_weight_kg: 0.1, importance: 'high', category: 'technical' }],
    ['insulating layer', { estimated_weight_kg: 0.4, importance: 'high', category: 'clothing' }],
    ['shell jacket', { estimated_weight_kg: 0.35, importance: 'high', category: 'clothing' }],
    ['gloves hat', { estimated_weight_kg: 0.2, importance: 'recommended', category: 'clothing' }],
    ['trekking poles', { estimated_weight_kg: 0.6, importance: 'optional', category: 'technical' }],
    ['hiking boots', { estimated_weight_kg: 1.2, importance: 'high', category: 'clothing' }],
    [
      'mountaineering boots',
      { estimated_weight_kg: 1.8, importance: 'high', category: 'clothing' },
    ],
    ['tent or bivy', { estimated_weight_kg: 2.0, importance: 'high', category: 'camping' }],
    ['sleeping bag', { estimated_weight_kg: 1.2, importance: 'high', category: 'camping' }],
    ['sleeping pad', { estimated_weight_kg: 0.5, importance: 'recommended', category: 'camping' }],
    ['stove fuel', { estimated_weight_kg: 0.4, importance: 'recommended', category: 'food_water' }],
    ['cook kit', { estimated_weight_kg: 0.3, importance: 'recommended', category: 'food_water' }],
    ['helmet', { estimated_weight_kg: 0.35, importance: 'critical', category: 'safety' }],
    ['harness', { estimated_weight_kg: 0.4, importance: 'high', category: 'technical' }],
    [
      'belay device locking carabiners',
      { estimated_weight_kg: 0.25, importance: 'high', category: 'technical' },
    ],
    ['rope 60m', { estimated_weight_kg: 3.5, importance: 'high', category: 'technical' }],
    [
      'quickdraws 8 12',
      { estimated_weight_kg: 1.0, importance: 'recommended', category: 'technical' },
    ],
    [
      'protection nuts cams',
      { estimated_weight_kg: 1.5, importance: 'recommended', category: 'technical' },
    ],
    ['microspikes', { estimated_weight_kg: 0.4, importance: 'recommended', category: 'technical' }],
    [
      'micro spikes',
      { estimated_weight_kg: 0.4, importance: 'recommended', category: 'technical' },
    ],
    ['crampons', { estimated_weight_kg: 0.9, importance: 'recommended', category: 'technical' }],
    ['ice axe', { estimated_weight_kg: 0.5, importance: 'recommended', category: 'technical' }],
    ['ice tools pair', { estimated_weight_kg: 1.2, importance: 'optional', category: 'technical' }],
    ['gaiters', { estimated_weight_kg: 0.25, importance: 'optional', category: 'clothing' }],
    ['extra layers', { estimated_weight_kg: 0.6, importance: 'high', category: 'clothing' }],
    [
      'group emergency shelter',
      { estimated_weight_kg: 0.9, importance: 'high', category: 'safety' },
    ],
  ]);*/

  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
          <div className='space-y-2'>
            <h1 className='text-3xl md:text-4xl font-bold text-text-primary'>My Climbs</h1>
            <p className='text-text-secondary text-lg'>
              Plan and track your mountaineering expeditions
            </p>
          </div>
          <div className='flex gap-3'>
            <Link href={createPageUrl('ClimbGear')}>
              <Button variant='outline' disabled={isLoading} className='shadow-sm'>
                <Wand2 className='w-5 h-5 mr-2' />
                Update Gear
              </Button>
            </Link>
            <Button
              onClick={() => setShowForm(!showForm)}
              className='mountain-gradient hover:opacity-90 transition-opacity shadow-lg'
            >
              <Plus className='w-5 h-5 mr-2' />
              Plan New Climb
            </Button>
          </div>
        </div>

        {showForm && (
          <ClimbForm
            climb={editingClimb}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingClimb(null);
            }}
          />
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className='h-80 bg-white rounded-xl animate-pulse shadow-sm' />
              ))
          ) : climbs.length === 0 ? (
            <div className='col-span-full text-center py-16'>
              <Mountain className='w-20 h-20 text-secondary-blue mx-auto mb-6 opacity-50' />
              <h3 className='text-2xl font-semibold text-text-primary mb-4'>
                No climbs planned yet
              </h3>
              <p className='text-text-secondary mb-6 text-lg'>
                Start planning your next mountaineering adventure
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className='mountain-gradient hover:opacity-90 transition-opacity shadow-lg'
              >
                <Plus className='w-5 h-5 mr-2' />
                Plan Your First Climb
              </Button>
            </div>
          ) : (
            climbs.map((climb) => (
              <ClimbCard key={climb.id} climb={climb} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
