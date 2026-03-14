--liquibase formatted sql

--changeset sergey:19
ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS report_type TEXT;
