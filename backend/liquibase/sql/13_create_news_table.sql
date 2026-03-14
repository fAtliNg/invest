--liquibase formatted sql

--changeset news:13-create-news-table
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    rbc_id VARCHAR(64) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    full_text TEXT,
    link VARCHAR(512) NOT NULL,
    image_url VARCHAR(512),
    category VARCHAR(128),
    author VARCHAR(256),
    tags TEXT[],
    published_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_published_at ON news (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news (category);
CREATE INDEX IF NOT EXISTS idx_news_rbc_id ON news (rbc_id);
