CREATE TABLE IF NOT EXISTS changelog (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO changelog (version, date, description) VALUES
('v1.0.1', '2026-01-10', 'Добавлен полноценный кредитный калькулятор. Теперь вы можете рассчитать график платежей, оценить переплату и увидеть выгоду от досрочных погашений с помощью наглядных интерактивных графиков.')
ON CONFLICT (version) DO NOTHING;

INSERT INTO changelog (version, date, description) VALUES
('v1.0.0', '2022-02-04', 'Официальный запуск MVP. Представлен базовый функционал для инвесторов: калькулятор сложного процента, позволяющий визуализировать рост капитала с учетом реинвестирования прибыли.')
ON CONFLICT (version) DO NOTHING;
