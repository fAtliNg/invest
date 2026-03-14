import axios from 'axios';
import { query } from './db';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const BATCH_SIZE = 30;

// Convert date to Moscow timezone (UTC+3) date string YYYY-MM-DD
function toMoscowDateStr(date: Date): string {
    const msk = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return msk.toISOString().split('T')[0];
}

interface NewsRow {
    id: number;
    title: string;
    description: string;
    full_text: string;
    source: string;
    category: string | null;
    published_at: Date;
}

// ============================================================
// DeepSeek API call
// ============================================================

async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY is not set');
    }

    const response = await axios.post(
        DEEPSEEK_API_URL,
        {
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 4000,
        },
        {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 60000,
        }
    );

    return response.data.choices[0].message.content;
}

// ============================================================
// Step 1: Filter market-relevant news
// ============================================================

async function filterRelevantNews(): Promise<void> {
    const result = await query(
        `SELECT id, title, description, source, category
     FROM news
     WHERE is_processed = FALSE
     ORDER BY published_at DESC
     LIMIT $1`,
        [BATCH_SIZE]
    );

    if (result.rows.length === 0) {
        console.log('[AI] No unprocessed news to filter');
        return;
    }

    console.log(`[AI] Filtering ${result.rows.length} unprocessed news items...`);

    const newsList = result.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        desc: (r.description || '').substring(0, 200),
        source: r.source,
        category: r.category,
    }));

    const systemPrompt = `Ты строгий финансовый аналитик MOEX. Отбирай ТОЛЬКО сильные новости, которые ТОЧНО повлияют на котировки бумаг на Московской бирже.

ПРИМЕРЫ РЕЛЕВАНТНЫХ НОВОСТЕЙ (такие включаем):
- "Правительство обсудит прекращение поставок газа в Европу" — влияет на Газпром
- "Цена газа в Европе превысила 650$ за 1000 кубометров" — конкретное движение цены
- "Минфин США выдал лицензию для подразделений Роснефти" — влияет на Роснефть
- "Международные резервы России выросли на 13,9 млрд до 811,1 млрд $" — макроэкономика РФ
- "ЦБ РФ повысил ключевую ставку до 21%" — влияет на весь рынок
- "Brent подорожал на 5% до $85" — конкретное движение нефти
- "Сбербанк объявил дивиденды 33,3 руб на акцию" — конкретное корпоративное событие
- "Новые санкции ЕС против российского СПГ" — влияет на Новатэк, Газпром

ПРИМЕРЫ НЕРЕЛЕВАНТНЫХ НОВОСТЕЙ (такие исключаем):
- Судебные дела чиновников, аресты — не влияет на котировки
- "ФАС заявила о нарушениях в рекламе Telegram" — не влияет
- Военные сводки, обмен пленными — не влияет
- Геополитические заявления без конкретных экономических последствий
- Форумы, конференции без объявления сделок
- Иностранные конфликты без прямого влияния на российские активы
- Назначения/увольнения чиновников без экономического эффекта

КРИТЕРИЙ: новость должна содержать КОНКРЕТНЫЕ цифры, цены, решения или события, которые трейдер на MOEX примет во внимание при торговле. Если сомневаешься — ставь false.

Ответь ТОЛЬКО валидным JSON массивом:
[{"id": <number>, "relevant": <boolean>}]`;

    const userPrompt = JSON.stringify(newsList, null, 0);

    try {
        const response = await callDeepSeek(systemPrompt, userPrompt);
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const results: Array<{ id: number; relevant: boolean }> = JSON.parse(cleaned);

        let relevantCount = 0;
        for (const item of results) {
            await query(
                `UPDATE news SET is_processed = TRUE, is_market_relevant = $1 WHERE id = $2`,
                [item.relevant, item.id]
            );
            if (item.relevant) relevantCount++;
        }

        // Mark any items that didn't come back in the response as processed but not relevant
        const returnedIds = new Set(results.map(r => r.id));
        for (const row of result.rows) {
            if (!returnedIds.has(row.id)) {
                await query(
                    `UPDATE news SET is_processed = TRUE, is_market_relevant = FALSE WHERE id = $1`,
                    [row.id]
                );
            }
        }

        console.log(`[AI] Filtered: ${relevantCount} relevant, ${result.rows.length - relevantCount} irrelevant`);
    } catch (err: any) {
        console.error('[AI] Error filtering news:', err.message);
        // Mark all as processed to avoid re-processing on error
        for (const row of result.rows) {
            await query(
                `UPDATE news SET is_processed = TRUE, is_market_relevant = FALSE WHERE id = $1`,
                [row.id]
            );
        }
    }
}

// ============================================================
// Step 2: Merge duplicates and generate digest entries
// ============================================================

async function generateDigestEntries(): Promise<void> {
    // Get relevant news from last 24h that haven't been added to digest yet
    const result = await query(
        `SELECT n.id, n.title, n.description, n.full_text, n.source, n.category, n.published_at
     FROM news n
     WHERE n.is_market_relevant = TRUE
       AND n.published_at > NOW() - INTERVAL '24 hours'
       AND n.id NOT IN (
         SELECT unnest(source_news_ids) FROM news_digest
       )
     ORDER BY n.published_at DESC`
    );

    if (result.rows.length === 0) {
        console.log('[AI] No new relevant news to process for digest');
        return;
    }

    console.log(`[AI] Processing ${result.rows.length} relevant news for digest...`);

    // Build a map of id -> moscow date for lookup
    const idToDate = new Map<number, string>();
    for (const r of result.rows) {
        idToDate.set(r.id, toMoscowDateStr(new Date(r.published_at)));
    }

    const newsList = result.rows.map((r: NewsRow) => ({
        id: r.id,
        title: r.title,
        text: (r.full_text || r.description || '').substring(0, 500),
        source: r.source,
    }));

    const systemPrompt = `Ты финансовый редактор. Тебе даны новости, которые могут повлиять на фондовый рынок.

Задачи:
1. Объедини новости, которые описывают одно и то же событие (из разных источников), в единый текст
2. Для каждой уникальной новости/группы создай краткий, информативный текст на русском языке (2-4 предложения)
3. Текст должен быть нейтральным, фактическим, без эмоций
4. Укажи источники в конце текста

Ответь ТОЛЬКО валидным JSON массивом, без markdown:
[{"text": "Текст обработанной новости...", "news_ids": [1, 2, 3]}]`;

    const userPrompt = JSON.stringify(newsList, null, 0);

    try {
        const response = await callDeepSeek(systemPrompt, userPrompt);
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const entries: Array<{ text: string; news_ids: number[] }> = JSON.parse(cleaned);

        let savedCount = 0;
        for (const entry of entries) {
            // Compute date from the most recent source news item
            let latestDate = '1970-01-01';
            for (const nid of entry.news_ids) {
                const d = idToDate.get(nid);
                if (d && d > latestDate) latestDate = d;
            }

            await query(
                `INSERT INTO news_digest (digest_date, content, source_news_ids)
         VALUES ($1, $2, $3)`,
                [latestDate, entry.text, entry.news_ids]
            );
            savedCount++;
        }

        console.log(`[AI] Generated ${savedCount} digest entries`);
    } catch (err: any) {
        console.error('[AI] Error generating digest entries:', err.message);
    }
}

// ============================================================
// Main processing function
// ============================================================

let isProcessing = false;

export async function processNews(): Promise<void> {
    if (isProcessing) {
        console.log('[AI] Already processing, skipping...');
        return;
    }

    isProcessing = true;
    try {
        console.log(`[AI] Starting news processing at ${new Date().toISOString()}...`);

        if (!DEEPSEEK_API_KEY) {
            console.error('[AI] DEEPSEEK_API_KEY not set, skipping processing');
            return;
        }

        // Process all unprocessed news in batches
        let batchNum = 0;
        while (true) {
            batchNum++;
            const countResult = await query(
                `SELECT COUNT(*) FROM news WHERE is_processed = FALSE`
            );
            const remaining = parseInt(countResult.rows[0].count);

            if (remaining === 0) break;

            console.log(`[AI] Batch ${batchNum}: ${remaining} unprocessed news remaining...`);

            // Step 1: Filter batch for market relevance
            await filterRelevantNews();

            // Step 2: Generate digest entries from newly relevant news
            await generateDigestEntries();
        }

        console.log(`[AI] All batches processed (${batchNum - 1} total)`);
    } finally {
        isProcessing = false;
    }
}
