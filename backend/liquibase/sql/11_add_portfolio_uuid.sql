--liquibase formatted sql

--changeset sergey:11
-- Add uuid column to portfolios table
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();

-- Populate uuid for existing rows that don't have one
UPDATE portfolios SET uuid = gen_random_uuid() WHERE uuid IS NULL;

-- Make uuid NOT NULL and UNIQUE
ALTER TABLE portfolios ALTER COLUMN uuid SET NOT NULL;
ALTER TABLE portfolios ALTER COLUMN uuid SET DEFAULT gen_random_uuid();

-- Add unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_uuid ON portfolios(uuid);

-- Add strategy column if missing
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS strategy TEXT;
