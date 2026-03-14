--liquibase formatted sql

--changeset sergey:18
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS send_fundamentals_to_ai BOOLEAN DEFAULT TRUE;
