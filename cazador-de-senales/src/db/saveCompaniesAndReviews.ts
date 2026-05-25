import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

import type { Company, Review } from '../apify/googleMapsReviews';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export interface SavedReview extends Review {
  companyId: string;
  companyName: string;
  companyCategory: string;
  companyCity: string;
}

export async function saveCompaniesAndReviews(companies: Company[]): Promise<SavedReview[]> {
  const newReviews: SavedReview[] = [];

  for (const company of companies) {
    if (!company.googleMapsUrl) continue;

    // Upsert company — si ya existe por google_maps_url, actualiza datos
    const { data: savedCompany, error: companyError } = await supabase
      .from('companies')
      .upsert(
        {
          name: company.name,
          category: company.category,
          city: company.city,
          website: company.website,
          phone: company.phone,
          google_maps_url: company.googleMapsUrl,
          rating: company.rating,
          review_count: company.reviewCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'google_maps_url' }
      )
      .select('id')
      .single();

    if (companyError || !savedCompany) {
      console.error(`  ⚠️  Error guardando empresa "${company.name}":`, companyError?.message);
      continue;
    }

    const companyId = savedCompany.id;

    // Insertar solo reviews nuevas — ignorar duplicados por external_review_id
    for (const review of company.reviews) {
      if (!review.externalReviewId || !review.text) continue;

      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('external_review_id', review.externalReviewId)
        .maybeSingle();

      if (existing) continue; // ya existe, saltar

      const { error: reviewError } = await supabase.from('reviews').insert({
        company_id: companyId,
        external_review_id: review.externalReviewId,
        rating: review.rating,
        text: review.text,
        author_name: review.authorName,
        review_date: review.reviewDate,
        detected_at: new Date().toISOString(),
      });

      if (reviewError) {
        console.error(`  ⚠️  Error guardando reseña:`, reviewError.message);
        continue;
      }

      newReviews.push({
        ...review,
        companyId,
        companyName: company.name,
        companyCategory: company.category,
        companyCity: company.city,
      });
    }
  }

  return newReviews;
}
