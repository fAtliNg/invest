--liquibase formatted sql

--changeset sergey:12
-- Add status column to portfolio_chats for active/archived filtering
ALTER TABLE portfolio_chats ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
