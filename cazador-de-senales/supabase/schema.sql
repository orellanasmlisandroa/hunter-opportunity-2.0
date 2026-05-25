-- ============================================================
-- CAZADOR DE SEÑALES — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── TABLA: companies ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  category         text,
  city             text,
  website          text,
  phone            text,
  email            text,
  google_maps_url  text        UNIQUE,
  rating           numeric,
  review_count     integer,
  -- Nuevos campos de Auditoría de Oportunidades Digitales (Midas)
  website_status   text        DEFAULT 'none' CHECK (website_status IN ('none', 'obsolete', 'modern')),
  facebook_url     text,
  instagram_url    text,
  tiktok_url       text,
  social_media_status text     DEFAULT 'unoptimized' CHECK (social_media_status IN ('inactive', 'unoptimized', 'active')),
  booking_system_status text   DEFAULT 'none' CHECK (booking_system_status IN ('none', 'basic_whatsapp', 'automated')),
  chatbot_status   text        DEFAULT 'none' CHECK (chatbot_status IN ('none', 'basic', 'advanced_ai')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_city_category ON companies(city, category);
CREATE INDEX IF NOT EXISTS idx_companies_rating        ON companies(rating);

-- ─── TABLA: reviews ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid        REFERENCES companies(id) ON DELETE CASCADE,
  external_review_id  text        UNIQUE,
  rating              integer     CHECK (rating BETWEEN 1 AND 5),
  text                text,
  author_name         text,
  review_date         timestamptz,
  detected_at         timestamptz DEFAULT now(),
  sentiment           text        CHECK (sentiment IN ('negative', 'neutral', 'positive')),
  pain_type           text
);

CREATE INDEX IF NOT EXISTS idx_reviews_company_id  ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating_date ON reviews(rating, review_date DESC);

-- ─── TABLA: signals ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signals (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        REFERENCES companies(id) ON DELETE CASCADE,
  signal_type     text        CHECK (signal_type IN ('review_crisis', 'web_change', 'tech_adoption', 'hiring')),
  signal_summary  text,
  severity_score  integer     CHECK (severity_score BETWEEN 0 AND 100),
  detected_at     timestamptz DEFAULT now(),
  status          text        DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'discarded'))
);

CREATE INDEX IF NOT EXISTS idx_signals_company_score ON signals(company_id, severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_signals_detected_at   ON signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_status_score  ON signals(status, severity_score DESC);

-- ─── TABLA: outreach_messages ────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_messages (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid        REFERENCES companies(id) ON DELETE CASCADE,
  signal_id     uuid        REFERENCES signals(id)  ON DELETE CASCADE,
  channel       text        DEFAULT 'email',
  subject       text,
  body          text,
  status        text        DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'discarded')),
  sent_at       timestamptz,
  reply_status  text        DEFAULT 'none'  CHECK (reply_status IN ('none', 'replied', 'bounced', 'unsubscribed'))
);

CREATE INDEX IF NOT EXISTS idx_outreach_status     ON outreach_messages(status);
CREATE INDEX IF NOT EXISTS idx_outreach_company_id ON outreach_messages(company_id);

-- ─── DESACTIVAR RLS (Row Level Security) ──────────────────────
-- Esto evita el error "new row violates row-level security policy"
-- al insertar datos usando la anon key desde scripts de backend.
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE signals DISABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages DISABLE ROW LEVEL SECURITY;
