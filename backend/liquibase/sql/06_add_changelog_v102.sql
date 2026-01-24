--liquibase formatted sql

--changeset sergey:6
INSERT INTO changelog (version, date, description) VALUES
('v1.0.2', '2026-01-25', 'Добавлен новый раздел "Котировки" с детальной аналитикой и интерактивными графиками инструментов Мосбиржи. Проведена оптимизация производительности кредитного калькулятора, улучшена точность расчетов и отзывчивость интерфейса.')
ON CONFLICT (version) DO NOTHING;
