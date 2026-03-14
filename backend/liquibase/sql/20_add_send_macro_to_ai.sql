--liquibase formatted sql

--changeset sergey:20
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS send_macro_to_ai BOOLEAN DEFAULT TRUE;
