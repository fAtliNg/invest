--liquibase formatted sql

--changeset sergey:9
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    current_value DECIMAL(19, 4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--changeset sergey:10
-- Insert default user if not exists (for seeding)
INSERT INTO users (email, password_hash) 
SELECT 'aaa@aaa.ru', '$2a$10$YourHashHere' -- In real scenario, password should be set properly
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'aaa@aaa.ru');

-- Seed portfolios for aaa@aaa.ru
INSERT INTO portfolios (user_id, title, description, image_url, current_value)
SELECT 
    id, 
    'Агрессивный рост', 
    'Портфель, ориентированный на акции технологических компаний и быстрорастущие стартапы. Высокий риск, но потенциально высокая доходность в долгосрочной перспективе. Включает в себя лидеров рынка полупроводников и облачных вычислений.',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    1250000
FROM users WHERE email = 'aaa@aaa.ru';

INSERT INTO portfolios (user_id, title, description, image_url, current_value)
SELECT 
    id, 
    'Дивидендная корзина', 
    'Стабильный поток пассивного дохода от проверенных временем компаний — «дивидендных аристократов». Основной упор на энергетический, финансовый и потребительский секторы экономики с регулярными выплатами.',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800',
    850400
FROM users WHERE email = 'aaa@aaa.ru';

INSERT INTO portfolios (user_id, title, description, image_url, current_value)
SELECT 
    id, 
    'Консервативный (ОФЗ+)', 
    'Минимизация рисков за счет вложений в государственные облигации и облигации крупнейших корпораций с высоким кредитным рейтингом. Идеально подходит для сохранения капитала в периоды рыночной волатильности.',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800',
    3200000
FROM users WHERE email = 'aaa@aaa.ru';

INSERT INTO portfolios (user_id, title, description, image_url, current_value)
SELECT 
    id, 
    'Крипто-Эксперимент', 
    'Экспериментальный портфель, включающий в себя основные криптовалюты и DeFi токены. Используется для диверсификации основного капитала и участия в развитии блокчейн-технологий. Требует активного мониторинга рынка.',
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=800',
    450000
FROM users WHERE email = 'aaa@aaa.ru';
