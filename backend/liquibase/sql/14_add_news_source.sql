--liquibase formatted sql

--changeset news:14-add-news-source
ALTER TABLE news ADD COLUMN IF NOT EXISTS source VARCHAR(32) DEFAULT 'rbc';
CREATE INDEX IF NOT EXISTS idx_news_source ON news (source);

-- Update rbc_id uniqueness to be per-source
ALTER TABLE news DROP CONSTRAINT IF EXISTS news_rbc_id_key;
ALTER TABLE news RENAME COLUMN rbc_id TO external_id;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_news_source_external_id ON news (source, external_id);
