import Parser from 'rss-parser';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  source: string;
  isoDate?: string;
}

const parser = new Parser();

// Sources list
const SOURCES = [
  { name: 'РБК', url: 'http://static.feed.rbc.ru/rbc/logical/footer/news.rss' },
  { name: 'Коммерсантъ', url: 'https://www.kommersant.ru/RSS/news.xml' },
  { name: 'Lenta.ru', url: 'https://lenta.ru/rss/news' },
  { name: 'Ведомости', url: 'https://www.vedomosti.ru/rss/news' },
  { name: 'Forbes', url: 'https://www.forbes.ru/newrss.xml' },
  { name: 'ТАСС', url: 'https://tass.ru/rss/v2.xml' },
  { name: 'Интерфакс', url: 'https://www.interfax.ru/rss.asp' }
];

let cachedNews: NewsItem[] = [];
let lastUpdated: Date | null = null;

const fetchNewsFromSource = async (source: { name: string; url: string }): Promise<NewsItem[]> => {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.map(item => ({
      title: item.title || '',
      link: item.link || '',
      pubDate: item.pubDate || '',
      contentSnippet: item.contentSnippet,
      source: source.name,
      isoDate: item.isoDate
    }));
  } catch (error) {
    console.error(`Error fetching news from ${source.name}:`, error);
    return [];
  }
};

export const updateNewsCache = async () => {
  console.log('Updating news cache...');
  const promises = SOURCES.map(fetchNewsFromSource);
  const results = await Promise.all(promises);
  
  // Flatten and sort by date (newest first)
  const allNews = results.flat().sort((a, b) => {
    const dateA = a.isoDate ? new Date(a.isoDate).getTime() : 0;
    const dateB = b.isoDate ? new Date(b.isoDate).getTime() : 0;
    return dateB - dateA;
  });

  cachedNews = allNews;
  lastUpdated = new Date();
  console.log(`News cache updated. Total items: ${cachedNews.length}`);
};

export const getNews = (limit: number = 20, source?: string): NewsItem[] => {
  let filtered = cachedNews;
  if (source) {
    filtered = cachedNews.filter(item => item.source === source);
  }
  return filtered.slice(0, limit);
};

export const getSources = () => SOURCES.map(s => s.name);
