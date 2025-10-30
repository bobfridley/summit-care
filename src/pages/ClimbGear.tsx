// src/pages/ClimbGear.tsx
// @ts-nocheck
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { createPageUrl } from '@/utils';
import { mysqlClimbs } from '@api/functions';
import PackWeightSummary from '@/components/climbs/PackWeightSummary';
import GearEditor from '@/components/climbs/GearEditor';

// UI + icons (adjust paths if your ui lib lives elsewhere)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mountain, Save, Wand2 } from '@/components/icons';

// ---- types ----
type Importance = 'critical' | 'high' | 'recommended' | 'optional';
type Category =
  | 'health'
  | 'food_water'
  | 'navigation'
  | 'technical'
  | 'clothing'
  | 'camping'
  | 'safety';

type Defaults = { estimated_weight_kg: number; importance: Importance; category: Category };

export interface GearItem {
  item_name: string;
  category: Category;
  quantity: number;
  required: boolean;
  packed: boolean;
  importance: Importance;
  estimated_weight_kg: number;
  notes: string;
}

export interface Climb {
  id: number;
  mountain_name?: string | null;
  elevation?: number | null;
  duration_days?: number | null;
  difficulty_level?: string | null;
  climbing_style?: string | null;
  weather_concerns?: string | null;
  special_equipment?: string | null;
  group_size?: number | null;
  backpack_name?: string | null;
  base_pack_weight_kg?: number | null;
  required_gear?: GearItem[] | null;
}

// ---- result-shape helpers ----
function firstFromListResult(res: any) {
  if (!res) return null;
  if (Array.isArray(res)) return res[0] ?? null;
  if (Array.isArray(res.items)) return res.items[0] ?? null;
  if (Array.isArray(res.data?.items)) return res.data.items[0] ?? null;
  if (Array.isArray(res.data)) return res.data[0] ?? null;
  if (res.item) return res.item;
  return null;
}
function arrayFromListResult(res: any) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.data?.items)) return res.data.items;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

// ---- page component ----
export default function ClimbGear() {
  const router = useRouter();
  const rawClimbId = router.query.climbId;
  const climbId = Array.isArray(rawClimbId) ? rawClimbId[0] : rawClimbId;

  const [isLoading, setIsLoading] = useState(true);
  const [climb, setClimb] = useState<Climb | null>(null);
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [gear, setGear] = useState<GearItem[]>([]);
  const [backpackName, setBackpackName] = useState('');
  const [basePackWeightKg, setBasePackWeightKg] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const load = async () => {
      setIsLoading(true);
      try {
        if (climbId) {
          const resOne = await mysqlClimbs.list({ id: Number(climbId), limit: 1 });
          const c = firstFromListResult(resOne) as Climb | null;
          setClimb(c);
          setGear(Array.isArray(c?.required_gear) ? (c!.required_gear as GearItem[]) : []);
          setBackpackName(c?.backpack_name || '');
          setBasePackWeightKg(Number(c?.base_pack_weight_kg || 0));
        } else {
          const resMany = await mysqlClimbs.list({ order: 'planned_start_date', dir: 'DESC' });
          setClimbs(arrayFromListResult(resMany) as Climb[]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [router.isReady, climbId]);

  // ---- defaults catalog (weights in kg) for backfilling ----
  const normalizeName = (s: string | null | undefined): string =>
    (s || '')
      .toLowerCase()
      .replace(/[^\w]+/g, ' ')
      .trim();

  const defaultItemCatalog: Map<string, Defaults> = useMemo(
    () =>
      new Map<string, Defaults>([
        [
          'first aid kit',
          { estimated_weight_kg: 0.25, importance: 'critical', category: 'health' },
        ],
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
        [
          'insulating layer',
          { estimated_weight_kg: 0.4, importance: 'high', category: 'clothing' },
        ],
        ['shell jacket', { estimated_weight_kg: 0.35, importance: 'high', category: 'clothing' }],
        [
          'gloves hat',
          { estimated_weight_kg: 0.2, importance: 'recommended', category: 'clothing' },
        ],
        [
          'trekking poles',
          { estimated_weight_kg: 0.6, importance: 'optional', category: 'technical' },
        ],
        ['hiking boots', { estimated_weight_kg: 1.2, importance: 'high', category: 'clothing' }],
        [
          'mountaineering boots',
          { estimated_weight_kg: 1.8, importance: 'high', category: 'clothing' },
        ],
        ['tent or bivy', { estimated_weight_kg: 2.0, importance: 'high', category: 'camping' }],
        ['sleeping bag', { estimated_weight_kg: 1.2, importance: 'high', category: 'camping' }],
        [
          'sleeping pad',
          { estimated_weight_kg: 0.5, importance: 'recommended', category: 'camping' },
        ],
        [
          'stove fuel',
          { estimated_weight_kg: 0.4, importance: 'recommended', category: 'food_water' },
        ],
        [
          'cook kit',
          { estimated_weight_kg: 0.3, importance: 'recommended', category: 'food_water' },
        ],
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
        [
          'microspikes',
          { estimated_weight_kg: 0.4, importance: 'recommended', category: 'technical' },
        ],
        [
          'micro spikes',
          { estimated_weight_kg: 0.4, importance: 'recommended', category: 'technical' },
        ],
        [
          'crampons',
          { estimated_weight_kg: 0.9, importance: 'recommended', category: 'technical' },
        ],
        ['ice axe', { estimated_weight_kg: 0.5, importance: 'recommended', category: 'technical' }],
        [
          'ice tools pair',
          { estimated_weight_kg: 1.2, importance: 'optional', category: 'technical' },
        ],
        ['gaiters', { estimated_weight_kg: 0.25, importance: 'optional', category: 'clothing' }],
        ['extra layers', { estimated_weight_kg: 0.6, importance: 'high', category: 'clothing' }],
        [
          'group emergency shelter',
          { estimated_weight_kg: 0.9, importance: 'high', category: 'safety' },
        ],
      ]),
    []
  );

  const getDefaultsForItem = (
    nameRaw: string = ''
  ): { estimated_weight_kg: number; importance: Importance; category: Category } | null => {
    const n = normalizeName(nameRaw);
    const hit = defaultItemCatalog.get(n);
    if (hit) return hit;

    if (n.includes('water'))
      return { estimated_weight_kg: 3.0, importance: 'critical', category: 'food_water' };
    if (n.includes('quickdraw'))
      return { estimated_weight_kg: 1.0, importance: 'recommended', category: 'technical' };
    if (n.includes('rope'))
      return { estimated_weight_kg: 3.5, importance: 'high', category: 'technical' };
    if (n.includes('crampon'))
      return { estimated_weight_kg: 0.9, importance: 'recommended', category: 'technical' };
    if (n.includes('micro') && n.includes('spike'))
      return { estimated_weight_kg: 0.4, importance: 'recommended', category: 'technical' };
    if (n.includes('ice axe'))
      return { estimated_weight_kg: 0.5, importance: 'recommended', category: 'technical' };
    if (n.includes('gaiter'))
      return { estimated_weight_kg: 0.25, importance: 'optional', category: 'clothing' };

    return null;
  };

  const backfillGearItem = (item: Partial<GearItem> = {}): Partial<GearItem> => {
    const defaults = getDefaultsForItem(item.item_name ?? '');
    if (!defaults) return item;
    const updated: Partial<GearItem> = { ...item };
    if (!(typeof updated.estimated_weight_kg === 'number' && updated.estimated_weight_kg > 0)) {
      updated.estimated_weight_kg = defaults.estimated_weight_kg;
    }
    if (!updated.importance) updated.importance = defaults.importance;
    if (!updated.category) updated.category = defaults.category;
    return updated;
  };

  const generateRecommendedGear = (c: Climb): GearItem[] => {
    const technical = c?.climbing_style === 'technical_climb';
    const highElevation = (c?.elevation || 0) >= 10000;
    const text = `${c?.weather_concerns || ''} ${c?.special_equipment || ''}`.toLowerCase();
    const mentionsSnowOrIce = /snow|ice|glacier|mixed|nevé|winter/.test(text);
    const advancedDifficulty = ['advanced', 'expert', 'extreme'].includes(
      c?.difficulty_level || ''
    );

    const asCat = (v: Category) => v;
    const asImp = (v: Importance) => v;

    const base: GearItem[] = [
      {
        item_name: 'First Aid Kit',
        category: asCat('health'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('critical'),
        estimated_weight_kg: 0.25,
        notes: '',
      },
      {
        item_name: 'Water (3L)',
        category: asCat('food_water'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('critical'),
        estimated_weight_kg: 3.0,
        notes: 'Hydration system or bottles',
      },
      {
        item_name: 'Nutrition (energy bars/gels)',
        category: asCat('food_water'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('high'),
        estimated_weight_kg: 0.5,
        notes: '',
      },
      {
        item_name: 'Map & Compass or GPS',
        category: asCat('navigation'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('critical'),
        estimated_weight_kg: 0.15,
        notes: '',
      },
      {
        item_name: 'Headlamp',
        category: asCat('technical'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('high'),
        estimated_weight_kg: 0.1,
        notes: 'With spare batteries',
      },
      {
        item_name: 'Insulating Layer',
        category: asCat('clothing'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('high'),
        estimated_weight_kg: 0.4,
        notes: 'Fleece or puffy',
      },
      {
        item_name: 'Shell (Jacket)',
        category: asCat('clothing'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('high'),
        estimated_weight_kg: 0.35,
        notes: 'Water/wind resistant',
      },
      {
        item_name: 'Gloves & Hat',
        category: asCat('clothing'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('recommended'),
        estimated_weight_kg: 0.2,
        notes: '',
      },
      {
        item_name: 'Trekking Poles',
        category: asCat('technical'),
        quantity: 1,
        required: false,
        packed: false,
        importance: asImp('optional'),
        estimated_weight_kg: 0.6,
        notes: '',
      },
    ];

    const gear: GearItem[] = [...base];

    // Footwear
    if (technical || highElevation) {
      gear.push({
        item_name: 'Mountaineering Boots',
        category: asCat('clothing'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('high'),
        estimated_weight_kg: 1.8,
        notes: '',
      });
    } else {
      gear.push({
        item_name: 'Hiking Boots',
        category: asCat('clothing'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('high'),
        estimated_weight_kg: 1.2,
        notes: '',
      });
    }

    // Duration
    if (c?.duration_days && c.duration_days >= 2) {
      gear.push(
        {
          item_name: 'Tent or Bivy',
          category: asCat('camping'),
          quantity: 1,
          required: true,
          packed: false,
          importance: asImp('high'),
          estimated_weight_kg: 2.0,
          notes: '',
        },
        {
          item_name: 'Sleeping Bag',
          category: asCat('camping'),
          quantity: 1,
          required: true,
          packed: false,
          importance: asImp('high'),
          estimated_weight_kg: 1.2,
          notes: 'Appropriate temp rating',
        },
        {
          item_name: 'Sleeping Pad',
          category: asCat('camping'),
          quantity: 1,
          required: true,
          packed: false,
          importance: asImp('recommended'),
          estimated_weight_kg: 0.5,
          notes: '',
        },
        {
          item_name: 'Stove & Fuel',
          category: asCat('food_water'),
          quantity: 1,
          required: true,
          packed: false,
          importance: asImp('recommended'),
          estimated_weight_kg: 0.4,
          notes: '',
        },
        {
          item_name: 'Cook Kit',
          category: asCat('food_water'),
          quantity: 1,
          required: true,
          packed: false,
          importance: asImp('recommended'),
          estimated_weight_kg: 0.3,
          notes: '',
        }
      );
    }

    // Technical kit
    if (technical) {
      gear.push(
        {
          item_name: 'Helmet',
          category: asCat('safety'),
          quantity: 1,
          required: true,
          packed: false,
          importance: asImp('critical'),
          estimated_weight_kg: 0.35,
          notes: '',
        },
        {
          item_name: 'Harness',
          category: asCat('technical'),
          quantity: 1,
          required: true,
          packed: false,
          importance: asImp('high'),
          estimated_weight_kg: 0.4,
          notes: '',
        },
        {
          item_name: 'Belay Device & Locking Carabiners',
          category: asCat('technical'),
          quantity: 1,
          required: true,
          packed: false,
          importance: asImp('high'),
          estimated_weight_kg: 0.25,
          notes: '',
        },
        {
          item_name: 'Rope (60m)',
          category: asCat('technical'),
          quantity: 1,
          required: true,
          packed: false,
          importance: asImp('high'),
          estimated_weight_kg: 3.5,
          notes: '',
        },
        {
          item_name: 'Quickdraws (8–12)',
          category: asCat('technical'),
          quantity: 1,
          required: false,
          packed: false,
          importance: asImp('recommended'),
          estimated_weight_kg: 1.0,
          notes: '',
        },
        {
          item_name: 'Protection (nuts/cams)',
          category: asCat('technical'),
          quantity: 1,
          required: false,
          packed: false,
          importance: asImp('recommended'),
          estimated_weight_kg: 1.5,
          notes: '',
        }
      );
    }

    // Snow/ice
    const highish =
      (c?.elevation || 0) >= 11000 || mentionsSnowOrIce || technical || advancedDifficulty;
    if (highElevation || mentionsSnowOrIce) {
      gear.push({
        item_name: 'Microspikes',
        category: asCat('technical'),
        quantity: 1,
        required: false,
        packed: false,
        importance: asImp('recommended'),
        estimated_weight_kg: 0.4,
        notes: '',
      });
    }
    if (highish) {
      gear.push(
        {
          item_name: 'Crampons',
          category: asCat('technical'),
          quantity: 1,
          required: false,
          packed: false,
          importance: asImp('recommended'),
          estimated_weight_kg: 0.9,
          notes: '',
        },
        {
          item_name: 'Ice Axe',
          category: asCat('technical'),
          quantity: 1,
          required: false,
          packed: false,
          importance: asImp('recommended'),
          estimated_weight_kg: 0.5,
          notes: 'If steep snow',
        }
      );
    }
    if (technical && (/ice|mixed/.test(text) || advancedDifficulty)) {
      gear.push({
        item_name: 'Ice Tools (pair)',
        category: asCat('technical'),
        quantity: 1,
        required: false,
        packed: false,
        importance: asImp('optional'),
        estimated_weight_kg: 1.2,
        notes: '',
      });
    }
    if (mentionsSnowOrIce || highElevation) {
      gear.push({
        item_name: 'Gaiters',
        category: asCat('clothing'),
        quantity: 1,
        required: false,
        packed: false,
        importance: asImp('optional'),
        estimated_weight_kg: 0.25,
        notes: '',
      });
    }

    if ((c?.weather_concerns || '').toLowerCase().includes('storm')) {
      gear.push({
        item_name: 'Extra Layers',
        category: asCat('clothing'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('high'),
        estimated_weight_kg: 0.6,
        notes: 'Storm/insulation',
      });
    }

    if (c?.group_size && c.group_size > 2) {
      gear.push({
        item_name: 'Group Emergency Shelter',
        category: asCat('safety'),
        quantity: 1,
        required: true,
        packed: false,
        importance: asImp('high'),
        estimated_weight_kg: 0.9,
        notes: '',
      });
    }

    // Deduplicate by normalized name
    const seen = new Set<string>();
    return gear.filter((g) => {
      const key = normalizeName(g.item_name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const mergeRecommended = () => {
    if (!climb) return;
    setIsAutofilling(true);
    const recommended = generateRecommendedGear(climb);
    const existing = Array.isArray(gear) ? gear.map(backfillGearItem) : [];
    const existingNames = new Set(existing.map((i) => normalizeName(i?.item_name)));
    const additions = recommended.filter((r) => !existingNames.has(normalizeName(r.item_name)));
    setGear(existing.concat(additions));
    setIsAutofilling(false);
  };

  const onSave = async () => {
    if (!climb) return;
    setIsSaving(true);
    await mysqlClimbs.update({
      id: climb.id,
      required_gear: gear,
      backpack_name: backpackName,
      base_pack_weight_kg: Number(basePackWeightKg) || 0,
    });
    setIsSaving(false);
  };

  // ---- list view (no climbId) ----
  if (!climbId) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8'>
        <div className='max-w-6xl mx-auto space-y-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Link
                href={createPageUrl('Climbs')}
                className='text-text-secondary hover:text-text-primary'
              >
                <ArrowLeft className='w-5 h-5' />
              </Link>
              <h1 className='text-2xl md:text-3xl font-bold text-text-primary'>
                Select a climb to manage gear
              </h1>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {isLoading
              ? Array(6)
                  .fill(0)
                  .map((_, i) => <div key={i} className='h-40 bg-white rounded-xl animate-pulse' />)
              : climbs.map((c) => (
                  <Card key={c.id} className='alpine-card border-0 shadow-md'>
                    <CardHeader className='border-b border-stone-100'>
                      <CardTitle className='text-base font-semibold text-text-primary flex items-center gap-2'>
                        <Mountain className='w-5 h-5 text-primary-blue' />
                        {c.mountain_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='p-4 flex justify-between items-center'>
                      <div className='text-sm text-text-secondary'>
                        {(c.elevation || 0).toLocaleString()} ft
                      </div>
                      <Link href={createPageUrl('ClimbGear', { climbId: climb.id })}>
                        <Button className='mountain-gradient hover:opacity-90 transition-opacity'>
                          Manage Gear
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- detail view (with climbId) ----
  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8'>
      <div className='max-w-5xl mx-auto space-y-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <Link
              href={createPageUrl('Climbs')}
              className='text-text-secondary hover:text-text-primary'
            >
              <ArrowLeft className='w-5 h-5' />
            </Link>
            <h1 className='text-2xl md:text-3xl font-bold text-text-primary'>
              {isLoading ? 'Loading...' : `Gear — ${climb?.mountain_name || ''}`}
            </h1>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={mergeRecommended}
              disabled={isLoading || isAutofilling}
            >
              <Wand2 className='w-4 h-4 mr-2' />
              {isAutofilling ? 'Adding...' : 'Autofill recommendations'}
            </Button>
            <Button
              className='mountain-gradient hover:opacity-90 transition-opacity'
              onClick={onSave}
              disabled={isLoading || isSaving}
            >
              <Save className='w-4 h-4 mr-2' />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <Card className='alpine-card border-0 shadow-lg'>
          <CardHeader className='border-b border-stone-100'>
            <CardTitle className='text-lg font-semibold text-text-primary'>Pack Overview</CardTitle>
          </CardHeader>
          <CardContent className='p-6 space-y-4'>
            {isLoading ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-sm'>Backpack</Label>
                  <Input
                    value={backpackName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setBackpackName(e.target.value)
                    }
                    placeholder='e.g. Osprey Exos 48'
                    className='border-stone-200'
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm'>Base Pack Weight (kg)</Label>
                  <Input
                    type='number'
                    min='0'
                    step='0.1'
                    value={basePackWeightKg}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setBasePackWeightKg(parseFloat(e.target.value || '0'))
                    }
                    placeholder='e.g. 1.2'
                    className='border-stone-200'
                  />
                </div>
              </div>
            )}
            <div>
              {/* These two components are assumed to exist in your codebase */}
              <PackWeightSummary gear={gear} basePackWeightKg={basePackWeightKg} />
            </div>
          </CardContent>
        </Card>

        {/* Assumes GearEditor exists and accepts { gear, onChange } */}
        <GearEditor gear={gear} onChange={setGear} />
      </div>
    </div>
  );
}
