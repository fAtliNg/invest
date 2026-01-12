--liquibase formatted sql

--changeset sergey:1
CREATE TABLE IF NOT EXISTS quotes (
  secid VARCHAR(50) PRIMARY KEY,
  shortname VARCHAR(255),
  price NUMERIC,
  high NUMERIC,
  low NUMERIC,
  change NUMERIC,
  change_pct NUMERIC,
  volume NUMERIC,
  lot_size INTEGER,
  type VARCHAR(50),
  last_updated TIMESTAMP
);

--changeset sergey:2
CREATE INDEX IF NOT EXISTS idx_quotes_type ON quotes(type);
