import * as dotenv from 'dotenv';
dotenv.config();

import { analyzeReview } from './analyzeReview';

const TEST_REVIEWS = [
  {
    text: 'Esperé 45 minutos y nunca me atendieron. Pésimo servicio, nadie contestó el teléfono cuando llamé.',
    category: 'med spa',
    city: 'Ciudad de Panamá',
    label: 'Reseña negativa clara',
  },
  {
    text: 'Absolutely incredible experience! From the moment I walked in, I was greeted with warmth and professionalism.',
    category: 'med spa',
    city: 'Ciudad de Panamá',
    label: 'Reseña positiva',
  },
  {
    text: 'Ok.',
    category: 'restaurante',
    city: 'Ciudad de Panamá',
    label: 'Reseña vaga',
  },
  {
    text: 'El personal fue muy grosero y los precios no coinciden con lo que anuncian en la página web.',
    category: 'clínica estética',
    city: 'Ciudad de Panamá',
    label: 'Reseña con múltiples problemas',
  },
];

async function main() {
  console.log('\n🧠 Test: Análisis de reseñas con IA (Claude)\n');

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key') {
    console.error('❌ Falta ANTHROPIC_API_KEY en .env');
    console.error('   Agrégala y vuelve a correr este test.');
    process.exit(1);
  }

  for (const review of TEST_REVIEWS) {
    console.log(`📝 ${review.label}`);
    console.log(`   Texto: "${review.text.slice(0, 70)}..."`);

    const result = await analyzeReview(review);

    console.log(`   Sentiment  : ${result.sentiment}`);
    console.log(`   Pain Type  : ${result.painType}`);
    console.log(`   Severity   : ${result.severity}/10`);
    console.log(`   Actionable : ${result.isActionable}`);
    console.log(`   Summary    : ${result.summary}`);
    console.log('');
  }

  console.log('─────────────────────────────────────────');
  console.log('✅ Prompt 5 completo. Motor de IA funcionando.');
  console.log('   Siguiente: Prompt 6 — crear señales.');
  console.log('─────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
