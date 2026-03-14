--liquibase formatted sql

--changeset invest:17 splitStatements:true
CREATE TABLE IF NOT EXISTS fundamentals (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    price NUMERIC,
    p_e NUMERIC,
    p_s NUMERIC,
    ev_ebitda NUMERIC,
    net_debt_ebitda NUMERIC,
    roe NUMERIC,
    net_income NUMERIC,
    dividend_yield NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fundamentals_ticker ON fundamentals (ticker);
