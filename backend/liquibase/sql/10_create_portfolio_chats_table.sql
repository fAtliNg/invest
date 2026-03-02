--liquibase formatted sql

--changeset sergey:10
CREATE TABLE IF NOT EXISTS portfolio_chats (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolio_chats_portfolio_id ON portfolio_chats(portfolio_id);
