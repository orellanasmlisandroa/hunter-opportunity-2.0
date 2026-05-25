import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const EXPECTED_TABLES: Record<string, string[]> = {
  companies: [
    'id', 'name', 'category', 'city', 'website', 'phone', 'email',
    'google_maps_url', 'rating', 'review_count', 'created_at', 'updated_at',
  ],
  reviews: [
    'id', 'company_id', 'external_review_id', 'rating', 'text',
    'author_name', 'review_date', 'detected_at', 'sentiment', 'pain_type',
  ],
  signals: [
    'id', 'company_id', 'signal_type', 'signal_summary',
    'severity_score', 'detected_at', 'status',
  ],
  outreach_messages: [
    'id', 'company_id', 'signal_id', 'channel', 'subject',
    'body', 'status', 'sent_at', 'reply_status',
  ],
};

async function verifyTable(tableName: string, expectedColumns: string[]): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(0);

  if (error) {
    console.log(`  ❌ ${tableName}: ${error.message}`);
    return false;
  }

  console.log(`  ✅ ${tableName} — existe y responde`);
  console.log(`     Columnas esperadas: ${expectedColumns.join(', ')}`);
  return true;
}

async function main() {
  console.log('\n🔍 Verificando schema de Supabase...\n');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('❌ Faltan variables de entorno: SUPABASE_URL y SUPABASE_KEY');
    console.error('   Copia .env.example → .env y completa tus keys.');
    process.exit(1);
  }

  console.log(`📡 Conectando a: ${process.env.SUPABASE_URL}\n`);

  let allOk = true;
  for (const [table, columns] of Object.entries(EXPECTED_TABLES)) {
    const ok = await verifyTable(table, columns);
    if (!ok) allOk = false;
  }

  console.log('\n─────────────────────────────────────────');
  if (allOk) {
    console.log('✅ SCHEMA OK — Las 4 tablas están listas.');
    console.log('   Siguiente paso: configurar Apify (Día 3).');
  } else {
    console.log('❌ Algunas tablas no se encontraron.');
    console.log('   Verifica que pegaste el schema.sql completo en el SQL Editor de Supabase.');
  }
  console.log('─────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('Error de conexión:', err.message);
  process.exit(1);
});
