'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

type Draft = {
  id: string;
  subject: string;
  body: string;
  status: string;
  companies: { name: string; city: string; category: string; email: string } | null;
  signals: { severity_score: number; signal_summary: string } | null;
};

function ScoreChip({ score }: { score: number }) {
  const color = score >= 85
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    : score >= 65
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-slate-400 bg-slate-800/40 border-slate-700/50';
  return (
    <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md border ${color}`}>
      {score}/100
    </span>
  );
}

export default function OutreachPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selected, setSelected] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  async function load() {
    const { data } = await supabase
      .from('outreach_messages')
      .select(`
        id, subject, body, status,
        companies ( name, city, category, email ),
        signals ( severity_score, signal_summary )
      `)
      .eq('status', 'draft')
      .order('id', { ascending: false });
    
    const fetchedDrafts = (data as any) ?? [];
    setDrafts(fetchedDrafts);
    if (fetchedDrafts.length > 0 && !selected) {
      setSelected(fetchedDrafts[0]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from('outreach_messages').update({ status }).eq('id', id);
    setActionMsg(status === 'approved' ? '✅ Borrador aprobado para envío' : '🗑️ Borrador descartado');
    
    // Animate item removal
    setDrafts(prev => prev.filter(d => d.id !== id));
    setSelected(null);
    
    setTimeout(() => setActionMsg(''), 3000);
    
    // Reload to ensure accurate state
    const { data } = await supabase
      .from('outreach_messages')
      .select(`
        id, subject, body, status,
        companies ( name, city, category, email ),
        signals ( severity_score, signal_summary )
      `)
      .eq('status', 'draft')
      .order('id', { ascending: false });
    
    const refreshed = (data as any) ?? [];
    if (refreshed.length > 0) {
      setSelected(refreshed[0]);
    }
  }

  const filteredDrafts = drafts.filter(d => 
    d.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500/25 border-t-teal-500 animate-spin" />
        <span className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Cargando bandeja de salida...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-teal-400 font-extrabold mb-1">Outreach Inbox</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Bandeja de Aprobación
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Revisa, edita o aprueba los emails redactados por la IA en base a las señales del radar.
          </p>
        </div>
        {actionMsg && (
          <div className="px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-teal-400 font-bold shadow-lg shadow-teal-500/5 animate-pulse">
            {actionMsg}
          </div>
        )}
      </div>

      {/* Main Mailbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-230px)]">
        
        {/* Left Side: Drafts Queue */}
        <div className="lg:col-span-4 flex flex-col bg-slate-950/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden h-full">
          
          {/* Search and Count Header */}
          <div className="p-4 border-b border-slate-800/60 bg-slate-900/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendientes de revisión</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                {drafts.length}
              </span>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar negocio..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
              />
              <svg className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 custom-scrollbar">
            {filteredDrafts.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-3">
                <svg className="w-10 h-10 text-slate-800 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2" />
                </svg>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bandeja Vacía</p>
                <p className="text-[11px] text-slate-600">No hay borradores pendientes con los filtros actuales.</p>
              </div>
            ) : (
              filteredDrafts.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={`w-full text-left px-5 py-4 flex flex-col gap-1 transition-all duration-200 hover:bg-slate-900/20 ${selected?.id === d.id ? 'bg-teal-500/[0.03] border-l-2 border-teal-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white truncate max-w-[70%]">{d.companies?.name ?? '—'}</span>
                    {d.signals && <ScoreChip score={d.signals.severity_score} />}
                  </div>
                  <span className="text-xs text-slate-400 font-medium truncate">{d.subject}</span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{d.companies?.city}</span>
                    <span className="text-slate-700 text-[10px] font-bold">·</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate capitalize">{d.companies?.category}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Email Editor Preview */}
        <div className="lg:col-span-8 bg-slate-950/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden flex flex-col h-full">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 space-y-3">
              <svg className="w-12 h-12 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Sin borrador seleccionado</p>
              <p className="text-xs text-slate-600">Elige un borrador de la bandeja izquierda para ver los detalles.</p>
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="px-6 py-5 border-b border-slate-800/60 bg-slate-900/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-extrabold text-white text-lg tracking-tight">{selected.companies?.name}</h2>
                    <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1.5">
                      <span className="font-bold text-teal-400 uppercase tracking-wider">{selected.companies?.category}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{selected.companies?.city}</span>
                    </p>
                  </div>
                  {selected.signals && <ScoreChip score={selected.signals.severity_score} />}
                </div>

                {selected.signals?.signal_summary && (
                  <div className="mt-4 bg-rose-500/[0.03] border border-rose-500/10 rounded-xl p-3 flex gap-2.5">
                    <span className="text-xs select-none">🚨</span>
                    <p className="text-xs text-rose-300/80 leading-relaxed">
                      <strong className="text-rose-400">Señal de crisis:</strong> {selected.signals.signal_summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Email Content Area */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                
                {/* Meta details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-900/80">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Para (Contacto)</span>
                    <p className="text-slate-200 text-sm font-semibold flex items-center gap-1.5">
                      {selected.companies?.email ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                          {selected.companies.email}
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="text-amber-500 font-semibold">Sin email registrado</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Canal</span>
                    <p className="text-slate-300 text-sm font-semibold flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Directo
                    </p>
                  </div>
                </div>

                {/* Subject field */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asunto</span>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm font-bold">
                    {selected.subject}
                  </div>
                </div>

                {/* Body field */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cuerpo del Correo</span>
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 text-slate-200 text-sm font-medium leading-relaxed whitespace-pre-wrap font-sans">
                    {selected.body}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-900/10 flex gap-4">
                <button
                  onClick={() => updateStatus(selected.id, 'approved')}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm py-3.5 rounded-xl shadow-lg shadow-teal-500/10 transition-all duration-200 active:scale-[0.98]"
                >
                  ✅ Aprobar para Envío
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'discarded')}
                  className="flex-1 border border-slate-800 hover:bg-slate-900/60 text-slate-300 font-bold text-sm py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  🗑️ Descartar
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
