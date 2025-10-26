// @ts-nocheck
import React from 'react';
import {
  ShieldCheck,
  Users,
  Activity,
  Server,
  TrendingUp,
  AlertTriangle,
  Settings,
  Database,
  FileCog,
  KeyRound,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

// ✅ add this:
type SvgIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/** Tiny UI helpers */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}
function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cls(
        'rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-950',
        className
      )}
    >
      {children}
    </div>
  );
}
function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className='flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-4 dark:border-stone-900'>
      <div>
        <h3 className='text-sm font-semibold text-stone-900 dark:text-stone-100'>{title}</h3>
        {subtitle && (
          <p className='mt-0.5 text-xs text-stone-500 dark:text-stone-400'>{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
  delta,
  trend = 'up',
}: {
  icon: SvgIcon;
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
}) {
  return (
    <Card className='p-4'>
      <div className='flex items-center justify-between'>
        <div className='rounded-xl bg-stone-100 p-2.5 dark:bg-stone-900'>
          <Icon className='h-5 w-5 text-stone-700 dark:text-stone-200' />
        </div>
        {delta && (
          <div
            className={cls(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trend === 'up' &&
                'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
              trend === 'down' &&
                'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
              trend === 'flat' &&
                'bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-200'
            )}
          >
            <TrendingUp
              className={cls(
                'h-3 w-3',
                trend === 'down' && 'rotate-180',
                trend === 'flat' && 'rotate-90'
              )}
            />
            {delta}
          </div>
        )}
      </div>
      <div className='mt-4'>
        <div className='text-2xl font-semibold text-stone-900 dark:text-stone-100'>{value}</div>
        <div className='text-xs text-stone-500'>{label}</div>
      </div>
    </Card>
  );
}

export default function Admin() {
  // Mock data — replace with real API calls (e.g., /api/health, /api/admin/metrics)
  const [refreshing, setRefreshing] = React.useState(false);
  const metrics = {
    users: 1280,
    activeToday: 236,
    jobsQueued: 7,
    dbStatus: 'ok',
    incidents30d: 1,
  };
  const recent = [
    {
      id: 'evt_7f21',
      type: 'Login',
      user: 'alex@summitcare.app',
      at: '2025-10-14 22:13',
      meta: '2FA success',
    },
    {
      id: 'evt_7f1c',
      type: 'Policy Update',
      user: 'megan@summitcare.app',
      at: '2025-10-14 20:02',
      meta: 'RBAC: analyst',
    },
    {
      id: 'evt_7e90',
      type: 'DB Migration',
      user: 'deploy@vercel',
      at: '2025-10-14 18:44',
      meta: 'schema v12 → v13',
    },
    {
      id: 'evt_7e51',
      type: 'Job Retry',
      user: 'system',
      at: '2025-10-14 12:10',
      meta: 'getAeTrendsCached',
    },
  ];

  const services: Array<{ name: string; status: string; detail: string; icon: SvgIcon }> = [
    { name: 'API Edge', status: 'ok', detail: 'iad1 / sfo1', icon: Server },
    { name: 'MySQL', status: 'ok', detail: 'us-east-1 / multi-AZ', icon: Database },
    { name: 'Base44', status: 'ok', detail: 'auth + functions', icon: ShieldCheck },
  ];

  function onRefresh() {
    setRefreshing(true);
    // simulate fetch
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div className='mx-auto max-w-7xl p-4 md:p-6'>
      {/* Top row: title + actions */}
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold text-stone-900 dark:text-stone-100'>
            Admin Console
          </h1>
          <p className='text-sm text-stone-500'>
            Operational overview, system health, and administrative tools.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={onRefresh}
            className='inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
          >
            <RefreshCw className={cls('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </button>
          <a
            href='/disclaimer'
            className='inline-flex items-center gap-2 rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white'
          >
            <ExternalLink className='h-4 w-4' />
            View site
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <Stat
          icon={Users}
          label='Total Users'
          value={metrics.users.toLocaleString()}
          delta='+4.2%'
          trend='up'
        />
        <Stat
          icon={Activity}
          label='Active Today'
          value={metrics.activeToday.toLocaleString()}
          delta='-1.8%'
          trend='down'
        />
        <Stat
          icon={FileCog}
          label='Jobs Queued'
          value={String(metrics.jobsQueued)}
          delta='~'
          trend='flat'
        />
        <Stat
          icon={AlertTriangle}
          label='Incidents (30d)'
          value={String(metrics.incidents30d)}
          delta='-1'
          trend='up'
        />
      </div>

      {/* Main content */}
      <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
        {/* Left: Health & Services */}
        <div className='lg:col-span-2 space-y-4'>
          <Card>
            <CardHeader
              title='System Health'
              subtitle='Edge/API, Database, and Integrations status'
              right={
                <span
                  className={cls(
                    'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium',
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                  )}
                >
                  <ShieldCheck className='h-3.5 w-3.5' />
                  All systems nominal
                </span>
              }
            />
            <div className='grid grid-cols-1 gap-3 p-4 sm:grid-cols-3'>
              {services.map((s) => (
                <div
                  key={s.name}
                  className='flex items-center gap-3 rounded-xl border border-stone-100 p-3 dark:border-stone-900'
                >
                  <div className='rounded-lg bg-stone-100 p-2 dark:bg-stone-900'>
                    <s.icon className='h-5 w-5 text-stone-700 dark:text-stone-200' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-sm font-medium text-stone-900 dark:text-stone-100'>
                      {s.name}
                    </div>
                    <div className='text-xs text-stone-500'>{s.detail}</div>
                  </div>
                  <div className='ml-auto'>
                    <span className='inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title='Recent Activity' subtitle='Security, deployments, background jobs' />
            <div className='divide-y divide-stone-100 dark:divide-stone-900'>
              {recent.map((r) => (
                <div key={r.id} className='flex items-center gap-3 px-5 py-3'>
                  <div className='rounded-lg bg-stone-100 p-2 dark:bg-stone-900'>
                    <Activity className='h-4 w-4 text-stone-700 dark:text-stone-200' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-sm text-stone-900 dark:text-stone-100'>
                      <span className='font-medium'>{r.type}</span>
                      <span className='text-stone-500'> — {r.meta}</span>
                    </div>
                    <div className='text-xs text-stone-500'>{r.user}</div>
                  </div>
                  <div className='ml-auto text-xs text-stone-500'>{r.at}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Tools / Quick actions */}
        <div className='space-y-4'>
          <Card>
            <CardHeader title='Tools' subtitle='Administrative actions' />
            <div className='grid grid-cols-1 gap-2 p-4'>
              <AdminAction
                label='RBAC Policies'
                icon={KeyRound}
                onClick={() => alert('Open RBAC policies')}
              />
              <AdminAction
                label='Database Console'
                icon={Database}
                onClick={() => (window.location.href = '/database')}
              />
              <AdminAction
                label='Job Runner'
                icon={FileCog}
                onClick={() => alert('Open job runner')}
              />
              <AdminAction
                label='System Settings'
                icon={Settings}
                onClick={() => alert('Open settings')}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title='Status Notes' subtitle='Operator messages & known issues' />
            <div className='space-y-3 p-4 text-sm'>
              <p className='rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200'>
                No scheduled maintenance. Next deploy window: Fri 22:00–23:00 PT.
              </p>
              <p className='rounded-xl bg-emerald-50 p-3 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200'>
                Cache warmers are stable; Base44 functions returning <code>200</code> within
                220–280ms p95.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdminAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: SvgIcon;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className='group flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2 text-left text-sm text-stone-700 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
    >
      <span className='inline-flex items-center gap-2'>
        <span className='rounded-lg bg-stone-100 p-1.5 group-hover:bg-stone-200 dark:bg-stone-800 dark:group-hover:bg-stone-700'>
          <Icon className='h-4 w-4' />
        </span>
        {label}
      </span>
      <ExternalLink className='h-4 w-4 opacity-60 group-hover:opacity-100' />
    </button>
  );
}
