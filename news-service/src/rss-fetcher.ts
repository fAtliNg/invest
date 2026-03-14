import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { query } from './db';

// ============================================================
// Source Configurations
// ============================================================

interface FeedSource {
    name: string;
    url: string;
    parser: (rssData: any) => NewsItem[];
}

interface NewsItem {
    external_id: string;
    source: string;
    title: string;
    description: string;
    full_text: string;
    link: string;
    image_url: string | null;
    category: string | null;
    author: string | null;
    tags: string[];
    published_at: Date;
}

const FEED_SOURCES: FeedSource[] = [
    {
        name: 'rbc',
        url: 'https://rssexport.rbc.ru/rbcnews/news/30/full.rss',
        parser: parseRbcItems,
    },
    {
        name: 'tass',
        url: 'https://tass.com/rss/v2.xml',
        parser: parseTassItems,
    },
    {
        name: 'cbr',
        url: 'https://www.cbr.ru/rss/eventrss',
        parser: parseCbrItems,
    },
    {
        name: 'cbr',
        url: 'https://www.cbr.ru/rss/RssPress',
        parser: parseCbrItems,
    },
];

// Categories to skip (case-insensitive)
const SKIP_CATEGORIES_RBC = new Set(['спорт']);
const SKIP_CATEGORIES_TASS = new Set(['sports', 'society & culture', 'culture', 'emergencies']);

// ============================================================
// Helpers
// ============================================================

function extractText(val: any): string {
    if (!val) return '';
    if (Array.isArray(val)) val = val[0];
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object' && val._) return val._.trim();
    return String(val).trim();
}

function stripHtml(html: string): string {
    return html
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ============================================================
// RBC Parser
// ============================================================

function parseRbcItems(rssData: any): NewsItem[] {
    const items: NewsItem[] = [];
    const channel = rssData?.rss?.channel?.[0];
    if (!channel?.item) return items;

    for (const item of channel.item) {
        try {
            const externalId = extractText(item['rbc_news:news_id']);
            if (!externalId) continue;

            let imageUrl: string | null = null;
            if (item.enclosure?.[0]?.$?.url) {
                imageUrl = item.enclosure[0].$.url;
            }

            const tags: string[] = [];
            const tagNodes = item['rbc_news:tag'];
            if (tagNodes && Array.isArray(tagNodes)) {
                for (const tag of tagNodes) {
                    const t = extractText(tag);
                    if (t) tags.push(t);
                }
            }

            const category = extractText(item.category) || null;
            if (category && SKIP_CATEGORIES_RBC.has(category.toLowerCase())) continue;

            items.push({
                external_id: externalId,
                source: 'rbc',
                title: extractText(item.title),
                description: extractText(item.description),
                full_text: extractText(item['rbc_news:full-text']),
                link: extractText(item.link),
                image_url: imageUrl,
                category,
                author: extractText(item.author) || null,
                tags,
                published_at: new Date(extractText(item.pubDate)),
            });
        } catch (err) {
            console.error('[RBC] Error parsing item:', err);
        }
    }
    return items;
}

// ============================================================
// TASS Parser
// ============================================================

function parseTassItems(rssData: any): NewsItem[] {
    const items: NewsItem[] = [];
    const channel = rssData?.rss?.channel?.[0];
    if (!channel?.item) return items;

    for (const item of channel.item) {
        try {
            const guid = extractText(item.guid);
            // Extract ID from TASS URL like https://tass.com/economy/2097233
            const idMatch = guid.match(/\/(\d+)$/);
            const externalId = idMatch ? idMatch[1] : guid;
            if (!externalId) continue;

            // Collect all categories
            const tags: string[] = [];
            let mainCategory: string | null = null;
            if (item.category && Array.isArray(item.category)) {
                for (const cat of item.category) {
                    const c = extractText(cat);
                    if (c) {
                        tags.push(c);
                        if (!mainCategory) mainCategory = c;
                    }
                }
            }

            // Skip non-market categories
            if (mainCategory && SKIP_CATEGORIES_TASS.has(mainCategory.toLowerCase())) continue;

            items.push({
                external_id: externalId,
                source: 'tass',
                title: extractText(item.title),
                description: extractText(item.description),
                full_text: '',
                link: extractText(item.link),
                image_url: null,
                category: mainCategory,
                author: null,
                tags,
                published_at: new Date(extractText(item.pubDate)),
            });
        } catch (err) {
            console.error('[TASS] Error parsing item:', err);
        }
    }
    return items;
}

// ============================================================
// CBR Parser
// ============================================================

function parseCbrItems(rssData: any): NewsItem[] {
    const items: NewsItem[] = [];
    const channel = rssData?.rss?.channel?.[0];
    if (!channel?.item) return items;

    for (const item of channel.item) {
        try {
            const externalId = extractText(item.guid);
            if (!externalId) continue;

            const rawDescription = extractText(item.description);
            const description = rawDescription ? stripHtml(rawDescription) : '';

            items.push({
                external_id: externalId,
                source: 'cbr',
                title: extractText(item.title),
                description: description,
                full_text: '',
                link: extractText(item.link),
                image_url: null,
                category: 'ЦБ РФ',
                author: 'Банк России',
                tags: ['ЦБ РФ', 'Банк России'],
                published_at: new Date(extractText(item.pubDate)),
            });
        } catch (err) {
            console.error('[CBR] Error parsing item:', err);
        }
    }
    return items;
}

// ============================================================
// Save to DB
// ============================================================

async function saveNews(items: NewsItem[]): Promise<number> {
    let savedCount = 0;

    for (const item of items) {
        try {
            const result = await query(
                `INSERT INTO news (external_id, source, title, description, full_text, link, image_url, category, author, tags, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (source, external_id) DO NOTHING
         RETURNING id`,
                [
                    item.external_id,
                    item.source,
                    item.title,
                    item.description,
                    item.full_text,
                    item.link,
                    item.image_url,
                    item.category,
                    item.author,
                    item.tags,
                    item.published_at,
                ]
            );

            if (result.rowCount && result.rowCount > 0) {
                savedCount++;
            }
        } catch (err) {
            console.error(`[DB] Error saving news ${item.source}:${item.external_id}:`, err);
        }
    }
    return savedCount;
}

// ============================================================
// Main fetch function
// ============================================================

export async function fetchAllNews(): Promise<void> {
    console.log(`[NEWS] Fetching from all sources at ${new Date().toISOString()}...`);

    for (const source of FEED_SOURCES) {
        try {
            console.log(`[${source.name.toUpperCase()}] Fetching ${source.url}...`);

            const response = await axios.get(source.url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; InvestNewsBot/1.0)',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                },
                responseType: 'text',
            });

            const rssData = await parseStringPromise(response.data, {
                explicitArray: true,
                trim: true,
            });

            const items = source.parser(rssData);
            console.log(`[${source.name.toUpperCase()}] Parsed ${items.length} items`);

            if (items.length > 0) {
                const savedCount = await saveNews(items);
                console.log(`[${source.name.toUpperCase()}] Saved ${savedCount} new items`);
            }
        } catch (err: any) {
            console.error(`[${source.name.toUpperCase()}] Failed: ${err.message}`);
        }
    }
}
