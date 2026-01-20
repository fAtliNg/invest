--liquibase formatted sql

--changeset sergey:3
CREATE TABLE IF NOT EXISTS currency_names (
  secid VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  shortname VARCHAR(50) NOT NULL
);
