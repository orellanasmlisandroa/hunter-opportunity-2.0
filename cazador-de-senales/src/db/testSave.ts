import * as dotenv from 'dotenv';
dotenv.config();

import { scrapeGoogleMapsReviews } from '../apify/googleMapsReviews';
import { saveCompaniesAndReviews } from './saveCompaniesAndReviews';

async function main() {
  console.log('\n🧪 Test: Apify → Supabase (sin duplicados)\n');

  // 1. Traer datos de Apify
  console.log('1️⃣  Scrapeando Apify...');
  const companies = await scrapeGoogleMapsReviews({
    searchQuery: 'med spa',
    city: 'Ciudad de Panamá',
    maxResults: 3,
  });
  console.log(`   ${companies.length} negocios obtenidos\n`);

  // 2. Primera guardada
  console.log('2️⃣  Guardando en Supabase (primera vez)...');
  const newReviews1 = await saveCompaniesAndReviews(companies);
  console.log(`   ✅ Reviews nuevas guardadas: ${newReviews1.length}\n`);

  // 3. Segunda guardada — debe ser 0 reviews nuevas (deduplicación)
  console.log('3️⃣  Guardando de nuevo (prueba de deduplicación)...');
  const newReviews2 = await saveCompaniesAndReviews(companies);
  console.log(`   ✅ Reviews nuevas esta vez: ${newReviews2.length} (debe ser 0)\n`);

  // 4. Resumen
  console.log('─────────────────────────────────────────');
  if (newReviews2.length === 0) {
    console.log('✅ Deduplicación funcionando correctamente.');
  } else {
    console.log('⚠️  Se guardaron duplicados — revisar lógica.');
  }

  console.log(`\n📋 Reviews nuevas detectadas en primera pasada:`);
  newReviews1.slice(0, 3).forEach(r => {
    console.log(`   • ${r.companyName} | ${r.rating}⭐ | "${r.text.slice(0, 60)}..."`);
  });

  console.log('\n✅ Prompt 4 completo. Datos en Supabase.');
  console.log('   Siguiente: Prompt 5 — analizar reseñas con IA.');
  console.log('─────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
