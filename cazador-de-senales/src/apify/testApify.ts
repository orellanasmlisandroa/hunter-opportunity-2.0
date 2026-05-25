import * as dotenv from 'dotenv';
dotenv.config();

import { scrapeGoogleMapsReviews } from './googleMapsReviews';

async function main() {
  console.log('\n🧪 Test de conexión con Apify...\n');

  if (!process.env.APIFY_TOKEN) {
    console.error('❌ Falta APIFY_TOKEN en .env');
    process.exit(1);
  }

  const results = await scrapeGoogleMapsReviews({
    searchQuery: 'med spa',
    city: 'Ciudad de Panamá',
    maxResults: 3,
  });

  if (results.length === 0) {
    console.log('⚠️  Sin resultados. Verifica el token o prueba con otra búsqueda.');
    return;
  }

  console.log(`\n✅ ${results.length} negocios encontrados:\n`);

  results.forEach((company, i) => {
    console.log(`  ${i + 1}. ${company.name}`);
    console.log(`     Rating: ${company.rating} ⭐ (${company.reviewCount} reseñas)`);
    console.log(`     Web: ${company.website || '—'}`);
    console.log(`     Reseñas obtenidas: ${company.reviews.length}`);
    if (company.reviews.length > 0) {
      const r = company.reviews[0];
      console.log(`     Primera reseña (${r.rating}⭐): "${r.text.slice(0, 80)}..."`);
    }
    console.log('');
  });

  console.log('─────────────────────────────────────────');
  console.log('✅ Apify funciona. Siguiente: Prompt 4 (guardar en Supabase).');
  console.log('─────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
