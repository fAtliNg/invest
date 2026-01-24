--liquibase formatted sql

--changeset sergey:5
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS isin VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_quotes_isin ON quotes(isin);
