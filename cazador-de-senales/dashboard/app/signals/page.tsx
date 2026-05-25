'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function SignalsPage() {
  const { t, language } = useLanguage();
  
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [minScore, setMinScore] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // Active filter values for actual filtering
  const [activeMinScore, setActiveMinScore] = useState('0');
  const [activeStatus, setActiveStatus] = useState('');
  const [activeCity, setActiveCity] = useState('');

  async function loadSignals() {
    setLoading(true);
    const scoreVal = parseInt(activeMinScore) || 0;
    
    let query = supabase
      .from('signals')
      .select(`
        id, signal_type, signal_summary, severity_score, detected_at, status,
        companies ( id, name, category, city, email, website, rating, review_count )
      `)
      .gte('severity_score', scoreVal)
      .order('severity_score', { ascending: false })
      .order('detected_at', { ascending: false })
      .limit(100);

    if (activeStatus) {
      query = query.eq('status', activeStatus);
    }

    const { data } = await query;
    let fetched = data ?? [];

    if (activeCity) {
      fetched = fetched.filter((s: any) => 
        s.companies?.city?.toLowerCase().includes(activeCity.toLowerCase())
      );
    }

    setSignals(fetched);
    setLoading(false);
  }

  // Load signals whenever active filters change
  useEffect(() => {
    loadSignals();
  }, [activeMinScore, activeStatus, activeCity]);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActiveMinScore(minScore || '0');
    setActiveStatus(statusFilter);
    setActiveCity(cityFilter);
  }

  function handleClear() {
    setMinScore('');
    setStatusFilter('');
    setCityFilter('');
    
    setActiveMinScore('0');
    setActiveStatus('');
    setActiveCity('');
  }

  // Helper metrics
  const total = signals.length;
  const toContactCount = signals.filter((s: any) => s.severity_score >= 85).length;
  const toReviewCount = signals.filter((s: any) => s.severity_score >= 65 && s.severity_score < 85).length;

  function ScoreBadge({ score }: { score: number }) {
    let color = 'bg-slate-800/40 text-slate-400 border-slate-700/50';
    let labelKey: 'badgeDiscard' | 'badgeReview' | 'badgeContact' = 'badgeDiscard';
    let icon = '⚪';
    
    if (score >= 85) {
      color = 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_-3px_rgba(244,63,94,0.1)]';
      labelKey = 'badgeContact';
      icon = '🔴';
    } else if (score >= 65) {
      color = 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]';
      labelKey = 'badgeReview';
      icon = '🟡';
    }
    
    return (
      <span className={`text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-lg border ${color} inline-block whitespace-nowrap`}>
        {score} · {icon} {t(labelKey)}
      </span>
    );
  }

  function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
      new: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      contacted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      discarded: 'bg-slate-800/40 text-slate-500 border-slate-800',
    };
    return (
      <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${map[status] ?? 'bg-slate-800 text-slate-400'}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div>
        <div className="text-xs uppercase tracking-widest text-teal-400 font-extrabold mb-1">{t('panelRadar')}</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {t('panelTitle')}
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          {t('panelSummary')}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative group overflow-hidden bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 transition-all duration-300 hover:border-slate-700/80">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-tr from-teal-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('totalSignals')}</div>
          <div className="text-4xl font-extrabold text-white mt-2 flex items-baseline gap-2">
            {total}
            <span className="text-xs text-slate-500 font-normal">{t('actives')}</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="relative group overflow-hidden bg-slate-950/40 backdrop-blur-xl border border-rose-950/40 rounded-2xl p-6 transition-all duration-300 hover:border-rose-900/60">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-tr from-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="text-rose-400/80 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            {t('criticalAlerts')}
          </div>
          <div className="text-4xl font-extrabold text-rose-400 mt-2 flex items-baseline gap-2">
            {toContactCount}
            <span className="text-xs text-rose-500/60 font-normal">{t('ready')}</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${total ? (toContactCount / total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="relative group overflow-hidden bg-slate-950/40 backdrop-blur-xl border border-amber-950/40 rounded-2xl p-6 transition-all duration-300 hover:border-amber-900/60">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="text-amber-400/80 text-xs font-bold uppercase tracking-wider">{t('toReview')}</div>
          <div className="text-4xl font-extrabold text-amber-400 mt-2 flex items-baseline gap-2">
            {toReviewCount}
            <span className="text-xs text-amber-500/60 font-normal">{t('waiting')}</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${total ? (toReviewCount / total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Filter Form */}
      <div className="bg-slate-950/20 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5">
        <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('minScoreLabel')}</label>
            <input
              name="minScore"
              type="number"
              placeholder="0 - 100"
              value={minScore}
              onChange={e => setMinScore(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('statusLabel')}</label>
            <select
              name="status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="discarded">Discarded</option>
            </select>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('cityLabel')}</label>
            <input
              name="city"
              placeholder="Ej: Panamá"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="flex w-full sm:w-auto gap-3">
            <button
              type="submit"
              className="flex-1 sm:flex-initial bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all duration-200"
            >
              {t('filterButton')}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 sm:flex-initial text-center border border-slate-800 hover:bg-slate-900/60 text-slate-300 font-semibold text-sm px-5 py-3 rounded-xl transition-all active:scale-95"
            >
              {t('clearButton')}
            </button>
          </div>
        </form>
      </div>

      {/* Signals Table */}
      <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden min-h-[300px] flex flex-col justify-between">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-28 space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-teal-500/25 border-t-teal-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-900/30">
                    <th className="px-6 py-4">{t('tableCompany')}</th>
                    <th className="px-6 py-4">{t('tableLocation')}</th>
                    <th className="px-6 py-4">{t('tableScore')}</th>
                    <th className="px-6 py-4">{t('tableStatus')}</th>
                    <th className="px-6 py-4">{t('tableSignalDescription')}</th>
                    <th className="px-6 py-4 text-right">{t('tableDetected')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {signals.map((signal: any) => (
                    <tr key={signal.id} className="hover:bg-slate-900/30 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/companies/${signal.companies?.id}`}
                            className="text-teal-400 hover:text-teal-300 font-bold text-sm transition-colors"
                          >
                            {signal.companies?.name ?? '—'}
                          </Link>
                          {signal.companies?.rating && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                              <span className="text-amber-500 font-medium">⭐ {Number(signal.companies.rating).toFixed(1)}</span>
                              <span>({signal.companies.review_count} {t('reviewCountSuffix')})</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-300 font-medium">{signal.companies?.city ?? '—'}</span>
                          <span className="text-slate-500 text-xs mt-0.5 capitalize">{signal.companies?.category ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ScoreBadge score={signal.severity_score} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={signal.status} />
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <p className="text-slate-400 truncate group-hover:text-slate-300 transition-colors" title={signal.signal_summary}>
                          {signal.signal_summary}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="text-slate-500 text-xs font-medium">
                          {new Date(signal.detected_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {total === 0 && (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-500 py-20 bg-slate-950/20">
                <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold text-slate-400">{t('noSignalsTitle')}</p>
                <p className="text-xs text-slate-600 mt-1">{t('noSignalsSubtitle')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
