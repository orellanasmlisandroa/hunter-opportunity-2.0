import { ApifyClient } from 'apify-client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

export interface Review {
  externalReviewId: string;
  rating: number;
  text: string;
  authorName: string;
  reviewDate: string;
}

export interface Company {
  name: string;
  category: string;
  city: string;
  website: string;
  phone: string;
  googleMapsUrl: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
}

export interface ScraperInput {
  searchQuery: string;
  city: string;
  maxResults: number;
}

export async function scrapeGoogleMapsReviews(input: ScraperInput): Promise<Company[]> {
  console.log(`  🔍 Apify: buscando "${input.searchQuery}" en ${input.city}...`);

  const run = await client.actor('compass/crawler-google-places').call({
    searchStringsArray: [`${input.searchQuery} ${input.city}`],
    maxCrawledPlacesPerSearch: input.maxResults,
    language: 'es',
    maxReviews: 20,
    reviewsSort: 'newest',
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    console.log(`  ⚠️  Sin resultados para "${input.searchQuery}" en ${input.city}`);
    return [];
  }

  const companies: Company[] = items.map((item: any) => ({
    name: item.title ?? '',
    category: item.categoryName ?? input.searchQuery,
    city: input.city,
    website: item.website ?? '',
    phone: item.phone ?? '',
    googleMapsUrl: item.url ?? '',
    rating: item.totalScore ?? 0,
    reviewCount: item.reviewsCount ?? 0,
    reviews: (item.reviews ?? []).map((r: any) => ({
      externalReviewId: r.reviewId ?? r.id ?? `${item.url}-${r.publishedAtDate}`,
      rating: r.stars ?? r.rating ?? 0,
      text: r.text ?? '',
      authorName: r.name ?? '',
      reviewDate: r.publishedAtDate ?? new Date().toISOString(),
    })),
  }));

  console.log(`  📦 Apify: ${companies.length} negocios obtenidos`);
  return companies;
}
