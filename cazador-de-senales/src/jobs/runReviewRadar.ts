import * as dotenv from 'dotenv';
dotenv.config();

import targets from '../../config/targets.json';
import { scrapeGoogleMapsReviews } from '../apify/googleMapsReviews';
import { saveCompaniesAndReviews } from '../db/saveCompaniesAndReviews';
import { analyzeReview } from '../ai/analyzeReview';
import { createReviewCrisisSignal } from '../signals/createReviewCrisisSignal';
import { generateOutreachEmail } from '../ai/generateOutreachEmail';
import { sendEmail } from '../email/sendEmail';
import { supabase } from '../db/saveCompaniesAndReviews';
import type { AnalyzedReview } from '../signals/createReviewCrisisSignal';

interface RunSummary {
  companiesProcessed: number;
  newReviews: number;
  signalsCreated: number;
  emailsGenerated: number;
  emailsSent: number;
  errors: string[];
}

async function saveOutreachDraft(
  companyId: string,
  signalId: string,
  subject: string,
  body: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('outreach_messages')
    .insert({
      company_id: companyId,
      signal_id: signalId,
      channel: 'email',
      subject,
      body,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) {
    console.error('    ⚠️  Error guardando borrador:', error.message);
    return null;
  }
  return data.id;
}

async function getCompanyEmail(companyId: string): Promise<string | null> {
  const { data } = await supabase
    .from('companies')
    .select('email, website, name')
    .eq('id', companyId)
    .maybeSingle();
  return data?.email ?? null;
}

async function processTarget(
  searchQuery: string,
  city: string,
  maxResults: number,
  summary: RunSummary
): Promise<void> {
  const label = `${searchQuery} / ${city}`;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`⚡ Procesando: ${label}`);
  console.log(`${'─'.repeat(50)}`);

  // ── 1. Scraping ──────────────────────────────────────
  const companies = await scrapeGoogleMapsReviews({ searchQuery, city, maxResults });
  console.log(`  📦 ${companies.length} negocios scrapeados`);

  // ── 2. Guardar en Supabase ────────────────────────────
  const newReviews = await saveCompaniesAndReviews(companies);
  summary.companiesProcessed += companies.length;
  summary.newReviews += newReviews.length;
  console.log(`  💾 ${newReviews.length} reviews nuevas guardadas`);

  if (newReviews.length === 0) {
    console.log('  ℹ️  Sin reviews nuevas — sin señales que generar');
    return;
  }

  // ── 3. Agrupar reviews por empresa ───────────────────
  const byCompany = new Map<string, typeof newReviews>();
  for (const review of newReviews) {
    const group = byCompany.get(review.companyId) ?? [];
    group.push(review);
    byCompany.set(review.companyId, group);
  }

  for (const [companyId, reviews] of byCompany) {
    const companyName = reviews[0].companyName;
    const company = companies.find(c => c.name === companyName);
    console.log(`\n  🏢 ${companyName} (${reviews.length} reviews nuevas)`);

    // ── 4. Analizar reviews con IA (solo rating <= 3) ──
    const analyzed: AnalyzedReview[] = [];
    for (const review of reviews) {
      let analysis;
      if (review.rating <= 3) {
        analysis = await analyzeReview({
          text: review.text,
          category: review.companyCategory,
          city: review.companyCity,
        });
        console.log(`     ${review.rating}⭐ ${analysis.sentiment} · ${analysis.painType} · severity ${analysis.severity}`);
      } else {
        // Reviews positivas: clasificar sin gastar tokens de IA
        analysis = {
          sentiment: 'positive' as const,
          painType: 'other' as const,
          severity: 1,
          summary: 'Reseña positiva.',
          isActionable: false,
        };
      }
      analyzed.push({ ...review, analysis });
    }

    // ── 5. Crear señal si hay crisis ───────────────────
    const signal = await createReviewCrisisSignal(
      companyId,
      analyzed,
      company?.reviewCount ?? 0,
      company?.rating ?? 0
    );

    if (!signal?.id) {
      console.log('     ℹ️  Sin crisis detectada o señal reciente ya existe');
      continue;
    }

    summary.signalsCreated++;
    const scoreLabel = signal.severityScore >= 85
      ? '🔴 CONTACTAR'
      : signal.severityScore >= 65
        ? '🟡 REVISAR'
        : '⚪ DESCARTAR';
    console.log(`     🚨 Señal: score ${signal.severityScore}/100 → ${scoreLabel}`);

    if (signal.severityScore < 65) continue;

    // ── 6. Obtener datos de madurez digital y generar email personalizado ─────────────────
    const { data: dbCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();

    // Derivar estados si no están explícitamente configurados
    const webStatus = dbCompany?.website_status || (dbCompany?.website ? 'obsolete' : 'none');
    const socialStatus = dbCompany?.social_media_status || 'unoptimized';
    const bookingStatus = dbCompany?.booking_system_status || 'none';
    const chatbotStatus = dbCompany?.chatbot_status || 'none';

    const negativePainType = analyzed.find(r => r.analysis.sentiment === 'negative')?.analysis.painType ?? 'other';
    const excerpts = analyzed
      .filter(r => r.analysis.sentiment === 'negative' && r.text.length > 10)
      .map(r => r.text)
      .slice(0, 2);

    const email = await generateOutreachEmail({
      companyName,
      category: reviews[0].companyCategory,
      city: reviews[0].companyCity,
      signalSummary: signal.signalSummary,
      painType: negativePainType,
      reviewExcerpts: excerpts,
      offerDescription: 'Sistema de gestión de reseñas y atención al cliente con IA',
      websiteStatus: webStatus as any,
      socialMediaStatus: socialStatus as any,
      bookingSystemStatus: bookingStatus as any,
      chatbotStatus: chatbotStatus as any,
    });

    // ── 7. Guardar como borrador ───────────────────────
    const draftId = await saveOutreachDraft(companyId, signal.id, email.subject, email.body);
    if (!draftId) continue;

    summary.emailsGenerated++;
    console.log(`     ✉️  Borrador guardado: "${email.subject}"`);

    // ── 8. Autopiloto (solo si score >= 85 y AUTOPILOT_SEND=true) ──
    const isAutopilot = process.env.AUTOPILOT_SEND === 'true';
    if (!isAutopilot || signal.severityScore < 85) continue;

    const toEmail = await getCompanyEmail(companyId);
    if (!toEmail) {
      console.log('     ⚠️  Sin email de contacto — no se puede enviar');
      continue;
    }

    const result = await sendEmail({
      to: toEmail,
      subject: email.subject,
      body: email.body,
      outreachMessageId: draftId,
    });

    if (result.sent) {
      summary.emailsSent++;
      console.log(`     🚀 Email enviado a ${toEmail}`);
    }
  }
}

async function main(): Promise<void> {
  const startTime = Date.now();
  console.log('\n🎯 CAZADOR DE SEÑALES — Iniciando radar...');
  console.log(`   DRY_RUN       : ${process.env.DRY_RUN}`);
  console.log(`   AUTOPILOT     : ${process.env.AUTOPILOT_SEND}`);
  console.log(`   Targets       : ${targets.length} ciudad(es)\n`);

  const summary: RunSummary = {
    companiesProcessed: 0,
    newReviews: 0,
    signalsCreated: 0,
    emailsGenerated: 0,
    emailsSent: 0,
    errors: [],
  };

  for (const target of targets) {
    for (const category of target.categories) {
      try {
        await processTarget(category, target.city, target.maxResultsPerCategory, summary);
      } catch (err) {
        const msg = `Error en "${category} / ${target.city}": ${(err as Error).message}`;
        console.error(`\n  ❌ ${msg}`);
        summary.errors.push(msg);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log(`\n${'═'.repeat(50)}`);
  console.log('📊 RESUMEN FINAL');
  console.log(`${'═'.repeat(50)}`);
  console.log(`  Empresas procesadas : ${summary.companiesProcessed}`);
  console.log(`  Reviews nuevas      : ${summary.newReviews}`);
  console.log(`  Señales creadas     : ${summary.signalsCreated}`);
  console.log(`  Emails generados    : ${summary.emailsGenerated}`);
  console.log(`  Emails enviados     : ${summary.emailsSent}`);
  console.log(`  Errores             : ${summary.errors.length}`);
  console.log(`  Tiempo total        : ${elapsed} min`);
  if (summary.errors.length > 0) {
    summary.errors.forEach(e => console.log(`  ⚠️  ${e}`));
  }
  console.log(`${'═'.repeat(50)}\n`);
}

main().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
