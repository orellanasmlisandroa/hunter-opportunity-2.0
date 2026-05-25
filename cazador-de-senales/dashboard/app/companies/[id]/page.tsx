import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function SentimentDot({ s }: { s: string }) {
  const color = s === 'negative'
    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
    : s === 'positive'
      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
      : 'bg-slate-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`} />;
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: company }, { data: reviews }, { data: signals }, { data: messages }] =
    await Promise.all([
      supabase.from('companies').select('*').eq('id', id).single(),
      supabase.from('reviews').select('*').eq('company_id', id).order('review_date', { ascending: false }).limit(20),
      supabase.from('signals').select('*').eq('company_id', id).order('detected_at', { ascending: false }),
      supabase.from('outreach_messages').select('*').eq('company_id', id).order('id', { ascending: false }),
    ]);

  if (!company) notFound();

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back button */}
      <div>
        <Link
          href="/signals"
          className="group inline-flex items-center gap-2 text-slate-500 hover:text-teal-400 font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a señales
        </Link>
      </div>

      {/* Profile Header */}
      <div className="relative overflow-hidden bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-tr from-teal-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-widest text-teal-400 uppercase bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-md capitalize">
                {company.category}
              </span>
              <span className="text-slate-600 text-xs font-bold">·</span>
              <span className="text-slate-400 text-xs font-semibold tracking-wide uppercase">
                {company.city}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none sm:text-4xl">{company.name}</h1>
          </div>
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-3.5 flex items-center gap-4 shadow-inner">
            <div className="text-right">
              <div className="text-2xl font-black text-amber-400 flex items-center gap-1.5 justify-end">
                ⭐ {Number(company.rating).toFixed(1)}
              </div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">{company.review_count} reseñas</div>
            </div>
          </div>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-900/80">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sitio Web</span>
            <div className="text-sm">
              {company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 font-bold hover:underline truncate block max-w-full"
                >
                  {company.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              ) : (
                <span className="text-slate-600 font-semibold">—</span>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Teléfono</span>
            <p className="text-slate-200 text-sm font-semibold">{company.phone || '—'}</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</span>
            <p className="text-slate-200 text-sm font-semibold">{company.email || '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Señales */}
        <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-900/80">
            <h2 className="font-extrabold text-white text-base tracking-tight">Registro de Señales</h2>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-800 text-slate-400 rounded-full">
              {signals?.length ?? 0}
            </span>
          </div>

          {(signals ?? []).length === 0 ? (
            <p className="text-slate-600 text-xs py-10 text-center">Sin señales de radar registradas.</p>
          ) : (
            <div className="space-y-4">
              {(signals ?? []).map(s => (
                <div key={s.id} className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md border ${
                      s.severity_score >= 85 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : s.severity_score >= 65 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-slate-800/40 text-slate-400 border-slate-700/50'
                    }`}>{s.severity_score}/100</span>
                    
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-900 border border-slate-900 px-2 py-0.5 rounded-md">
                      {s.status}
                    </span>
                  </div>
                  
                  <p className="text-slate-300 text-xs leading-relaxed">{s.signal_summary}</p>
                  
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider pt-1 border-t border-slate-900/60 flex items-center justify-between">
                    <span>Tipo: {s.signal_type}</span>
                    <span>{new Date(s.detected_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mensajes */}
        <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-900/80">
            <h2 className="font-extrabold text-white text-base tracking-tight">Historial de Outreach</h2>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-800 text-slate-400 rounded-full">
              {messages?.length ?? 0}
            </span>
          </div>

          {(messages ?? []).length === 0 ? (
            <p className="text-slate-600 text-xs py-10 text-center">Sin borradores ni mensajes generados.</p>
          ) : (
            <div className="space-y-4">
              {(messages ?? []).map(m => (
                <div key={m.id} className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                      m.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : m.status === 'approved' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                      : m.status === 'discarded' ? 'bg-slate-800/40 text-slate-500 border-slate-800'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
                    }`}>{m.status}</span>
                  </div>
                  
                  <p className="text-white text-xs font-bold truncate">{m.subject}</p>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-900/80">
          <h2 className="font-extrabold text-white text-base tracking-tight">Reseñas Recientes</h2>
          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-800 text-slate-400 rounded-full">
            {reviews?.length ?? 0}
          </span>
        </div>

        {(reviews ?? []).length === 0 ? (
          <p className="text-slate-600 text-xs py-10 text-center">Sin reseñas guardadas en el historial.</p>
        ) : (
          <div className="space-y-6">
            {(reviews ?? []).map(r => (
              <div key={r.id} className="pb-6 border-b border-slate-900/60 last:pb-0 last:border-b-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-500 text-sm">{'★'.repeat(r.rating)}</span>
                    <span className="font-bold text-slate-800 text-sm">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                  
                  <span className="font-bold text-sm text-slate-200">{r.author_name}</span>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.sentiment && (
                      <span className="inline-flex items-center text-[10px] font-extrabold text-slate-400 uppercase bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-md">
                        <SentimentDot s={r.sentiment} />{r.sentiment}
                      </span>
                    )}
                    {r.pain_type && r.pain_type !== 'other' && (
                      <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {r.pain_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <span className="text-slate-600 text-xs font-bold sm:ml-auto">
                    {r.review_date ? new Date(r.review_date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {r.text || <span className="text-slate-600 italic">Reseña sin texto</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
