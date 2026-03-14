--liquibase formatted sql

--changeset sergey:16
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS send_news_to_ai BOOLEAN DEFAULT TRUE;
