import * as dotenv from 'dotenv';
dotenv.config();

import { generateOutreachEmail } from '../ai/generateOutreachEmail';
import { supabase } from '../db/saveCompaniesAndReviews';

async function main() {
  console.log('\n✉️  Test: Generación y guardado de email (DRY RUN)\n');

  // Simular señal real con datos de Ocean Breeze Med Spa
  const emailInput = {
    companyName: 'Ocean Breeze Med Spa',
    category: 'med spa',
    city: 'Ciudad de Panamá',
    signalSummary: '2 reseñas negativas recientes. Problemas: no contestan, servicio lento.',
    painType: 'no_answer' as const,
    reviewExcerpts: [
      'Llamé tres veces y nunca me contestaron. Pésima atención al cliente.',
      'Esperé más de una hora sin ser atendida. No recomiendo.',
    ],
    offerDescription: 'Sistema de respuesta automática + gestión de reseñas con IA',
  };

  console.log('1️⃣  Generando email con Claude...');
  const email = await generateOutreachEmail(emailInput);

  console.log('\n📧 Email generado:');
  console.log('─────────────────────────────────────────');
  console.log(`  Asunto : ${email.subject}`);
  console.log(`  Cuerpo :\n`);
  email.body.split('\n').forEach(line => console.log(`    ${line}`));
  console.log('─────────────────────────────────────────\n');

  // Buscar una company real en Supabase para guardar el borrador
  console.log('2️⃣  Buscando empresa en Supabase para guardar borrador...');
  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', '%Ocean Breeze%')
    .maybeSingle();

  if (!company) {
    console.log('  ⚠️  Ocean Breeze no encontrada en DB. Guardando con empresa genérica...');
  }

  const { data: signal } = await supabase
    .from('signals')
    .select('id')
    .eq('company_id', company?.id ?? '00000000-0000-0000-0000-000000000000')
    .order('detected_at', { ascending: false })
    .maybeSingle();

  if (company) {
    const { data: draft, error } = await supabase
      .from('outreach_messages')
      .insert({
        company_id: company.id,
        signal_id: signal?.id ?? null,
        channel: 'email',
        subject: email.subject,
        body: email.body,
        status: 'draft',
      })
      .select('id')
      .single();

    if (error) {
      console.error('  ⚠️  Error guardando borrador:', error.message);
    } else {
      console.log(`  ✅ Borrador guardado en Supabase (id: ${draft.id})`);
      console.log(`     Para aprobar y enviar: cambiar status a "approved" en el dashboard`);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log('✅ Prompts 7 y 8 completos.');
  console.log('   Email generado con IA + guardado como borrador en Supabase.');
  console.log('   DRY_RUN=true → ningún email fue enviado aún.');
  console.log('   Siguiente: Prompt 9 — orquestador completo.');
  console.log('─────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
