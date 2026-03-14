--liquibase formatted sql

--changeset news:15-add-news-processing
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT FALSE;
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_market_relevant BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_news_is_processed ON news (is_processed) WHERE is_processed = FALSE;

CREATE TABLE IF NOT EXISTS news_digest (
    id SERIAL PRIMARY KEY,
    digest_date DATE NOT NULL,
    content TEXT NOT NULL,
    source_news_ids INTEGER[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_digest_date ON news_digest (digest_date DESC);
