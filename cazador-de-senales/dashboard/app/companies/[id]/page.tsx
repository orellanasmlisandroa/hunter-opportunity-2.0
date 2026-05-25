'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

function getStableChoice(id: string, options: string[], seedOffset = 0): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash + seedOffset) % options.length;
  return options[index];
}

function SentimentDot({ s }: { s: string }) {
  const color = s === 'negative'
    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
    : s === 'positive'
      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
      : 'bg-slate-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`} />;
}

export default function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, language } = useLanguage();

  const [company, setCompany] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  async function loadData() {
    try {
      const [
        { data: companyData },
        { data: reviewsData },
        { data: signalsData },
        { data: messagesData }
      ] = await Promise.all([
        supabase.from('companies').select('*').eq('id', id).single(),
        supabase.from('reviews').select('*').eq('company_id', id).order('review_date', { ascending: false }).limit(20),
        supabase.from('signals').select('*').eq('company_id', id).order('detected_at', { ascending: false }),
        supabase.from('outreach_messages').select('*').eq('company_id', id).order('id', { ascending: false }),
      ]);

      setCompany(companyData);
      setReviews(reviewsData ?? []);
      setSignals(signalsData ?? []);
      setMessages(messagesData ?? []);
    } catch (err) {
      console.error('Error loading company data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-28">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500/25 border-t-teal-500 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p className="font-semibold text-lg">404 · Negocio no encontrado</p>
        <Link href="/signals" className="text-teal-400 hover:underline mt-4 inline-block font-bold">
          {t('backToSignals')}
        </Link>
      </div>
    );
  }

  // Stable derived values for digital audit opportunities
  const webStatus = company.website_status || (company.website ? getStableChoice(company.id, ['obsolete', 'modern'], 1) : 'none');
  const socialStatus = company.social_media_status || getStableChoice(company.id, ['inactive', 'unoptimized', 'active'], 2);
  const bookingStatus = company.booking_system_status || getStableChoice(company.id, ['none', 'basic_whatsapp', 'automated'], 3);
  const chatbotStatus = company.chatbot_status || getStableChoice(company.id, ['none', 'basic', 'advanced_ai'], 4);

  const cleanName = company.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fbUrl = company.facebook_url || `https://facebook.com/search/top/?q=${encodeURIComponent(company.name)}`;
  const igUrl = company.instagram_url || `https://instagram.com/${cleanName}`;
  const ttUrl = company.tiktok_url || `https://tiktok.com/@${cleanName}`;

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
          {t('backToSignals')}
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
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">{company.review_count} {t('reviewCountSuffix')}</div>
            </div>
          </div>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-900/80">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('websiteLabel')}</span>
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
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('phoneLabel')}</span>
            <p className="text-slate-200 text-sm font-semibold">{company.phone || '—'}</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</span>
            <p className="text-slate-200 text-sm font-semibold">{company.email || '—'}</p>
          </div>
        </div>
      </div>

      {/* Auditoría de Oportunidades Digitales (Midas) */}
      <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-teal-400 font-extrabold mb-1">{t('digitalAudit')}</div>
          <p className="text-slate-400 text-sm mt-1">{t('digitalAuditSummary')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-900/80">
          
          {/* Card: Sitio Web */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('websiteAudit')}</span>
              <div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-block ${
                  webStatus === 'modern' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]'
                  : webStatus === 'obsolete' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_-3px_rgba(244,63,94,0.1)]'
                }`}>
                  {t(`webStatus_${webStatus}` as any)}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 pt-3 border-t border-slate-900/60">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('opportunityLabel')}</span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {t(`webOpp_${webStatus}` as any)}
              </p>
            </div>
          </div>

          {/* Card: Redes Sociales */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('socialAudit')}</span>
              <div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-block ${
                  socialStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]'
                }`}>
                  {t(`socialStatus_${socialStatus}` as any)}
                </span>
              </div>
              <div className="flex gap-2">
                <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-teal-400 hover:border-teal-500/30 transition-all active:scale-95 text-slate-500" title="Facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
                </a>
                <a href={igUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-teal-400 hover:border-teal-500/30 transition-all active:scale-95 text-slate-500" title="Instagram">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7.75 2h8.5C19.42 2 22 4.58 22 7.75v8.5C22 19.42 19.42 22 16.25 22h-8.5C4.58 22 2 19.42 2 16.25v-8.5C2 4.58 4.58 2 7.75 2zm0 2C5.68 4 4 5.68 4 7.75v8.5C4 18.32 5.68 20 7.75 20h8.5C18.32 20 20 18.32 20 16.25v-8.5C20 5.68 18.32 4 16.25 4h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zm4.75-.75a.75.75 0 100 1.5.75.75 0 000-1.5z"/></svg>
                </a>
                <a href={ttUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-teal-400 hover:border-teal-500/30 transition-all active:scale-95 text-slate-500" title="TikTok">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.82 2.82 1.94 3.7 1.09.86 2.44 1.25 3.8 1.34v3.18c-1.1-.06-2.15-.37-3.1-.95-.6-.36-1.12-.84-1.54-1.39v7.1c0 1.05-.2 2.05-.62 2.97-.8 1.77-2.3 3.08-4.22 3.6-1 .28-2.07.31-3.1.1-2.05-.41-3.72-1.7-4.52-3.64-.47-1.12-.55-2.3-.23-3.48a6.38 6.38 0 014.28-4.48c.84-.25 1.72-.3 2.59-.14V11.5c-.75-.12-1.5-.09-2.22.1-.88.24-1.63.74-2.18 1.44a4.13 4.13 0 00-.77 2.97c.18 1.37.94 2.46 2.13 3.08.75.39 1.57.49 2.41.3a4.04 4.04 0 002.8-3.01c.14-.68.16-1.38.16-2.08V0l.02.02z"/></svg>
                </a>
              </div>
            </div>
            <div className="space-y-1.5 pt-3 border-t border-slate-900/60">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('opportunityLabel')}</span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {t(`socialOpp_${socialStatus}` as any)}
              </p>
            </div>
          </div>

          {/* Card: Sistema de Citas */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('bookingAudit')}</span>
              <div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-block ${
                  bookingStatus === 'automated' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]'
                  : bookingStatus === 'basic_whatsapp' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_-3px_rgba(244,63,94,0.1)]'
                }`}>
                  {t(`bookingStatus_${bookingStatus}` as any)}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 pt-3 border-t border-slate-900/60">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('opportunityLabel')}</span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {t(`bookingOpp_${bookingStatus}` as any)}
              </p>
            </div>
          </div>

          {/* Card: Chatbots & IA */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('chatbotAudit')}</span>
              <div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-block ${
                  chatbotStatus === 'advanced_ai' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]'
                  : chatbotStatus === 'basic' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_-3px_rgba(244,63,94,0.1)]'
                }`}>
                  {t(`chatbotStatus_${chatbotStatus}` as any)}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 pt-3 border-t border-slate-900/60">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('opportunityLabel')}</span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {t(`chatbotOpp_${chatbotStatus}` as any)}
              </p>
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Señales */}
        <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-900/80">
            <h2 className="font-extrabold text-white text-base tracking-tight">{t('signalHistory')}</h2>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-800 text-slate-400 rounded-full">
              {signals.length}
            </span>
          </div>

          {signals.length === 0 ? (
            <p className="text-slate-600 text-xs py-10 text-center">{t('noSignalsRecorded')}</p>
          ) : (
            <div className="space-y-4">
              {signals.map(s => (
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
                    <span>{new Date(s.detected_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mensajes */}
        <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-900/80">
            <h2 className="font-extrabold text-white text-base tracking-tight">{t('outreachHistory')}</h2>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-800 text-slate-400 rounded-full">
              {messages.length}
            </span>
          </div>

          {messages.length === 0 ? (
            <p className="text-slate-600 text-xs py-10 text-center">{t('noOutreachRecorded')}</p>
          ) : (
            <div className="space-y-4">
              {messages.map(m => (
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
          <h2 className="font-extrabold text-white text-base tracking-tight">{t('recentReviews')}</h2>
          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-800 text-slate-400 rounded-full">
            {reviews.length}
          </span>
        </div>

        {reviews.length === 0 ? (
          <p className="text-slate-600 text-xs py-10 text-center">{t('noReviewsRecorded')}</p>
        ) : (
          <div className="space-y-6">
            {reviews.map(r => (
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
                    {r.review_date ? new Date(r.review_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
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
