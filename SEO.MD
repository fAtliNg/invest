# SEO договоренности

## Домены и окружения
- Prod: profit-case.ru — индексируется поисковиками.
- Dev: profit-case-dev.ru — полностью запрещена индексация.
- Переключение правил по окружению через NEXT_PUBLIC_IS_DEV (true — dev, false — prod).

## Robots.txt
- Генерируется серверной страницей [robots.txt.js](file:///Users/sergey/invest/src/pages/robots.txt.js) по окружению.
- Prod:
  - Allow: /
  - Disallow: /customers, /equities
  - Host: profit-case.ru (без протокола)
  - Sitemap: https://profit-case.ru/sitemap.xml
  - Sitemap: https://profit-case.ru/server-sitemap.xml
- Dev:
  - Disallow: /
  - Host: profit-case-dev.ru
  - Sitemap: https://profit-case-dev.ru/sitemap.xml
  - Sitemap: https://profit-case-dev.ru/server-sitemap.xml
- next-sitemap не генерирует robots (generateRobotsTxt: false) — избегаем конфликтов.

## Sitemap
- Формируется в postbuild через next-sitemap.
- siteUrl зависит от NEXT_PUBLIC_IS_DEV:
  - Dev: https://profit-case-dev.ru
  - Prod: https://profit-case.ru
- При добавлении новых разделов — актуализировать конфиг [next-sitemap.config.js](file:///Users/sergey/invest/next-sitemap.config.js).
- Дополнительный серверный sitemap: https://profit-case.ru/server-sitemap.xml (dev: https://profit-case-dev.ru/server-sitemap.xml).
- Server-sitemap содержит динамические страницы бумаг /quotes/{type}/{secid} и генерируется на сервере.

## AMP
- Главная страница имеет AMP-версию: https://profit-case.ru/?amp=1.
- Соблюдены требования AMP: атрибут amp на html, meta viewport, AMP runtime script, amp-boilerplate + noscript, стили через style amp-custom (без inline-стилей).
- Canonical на AMP указывает на обычную главную: https://profit-case.ru/.

## Метатеги страниц
- Для всех публичных страниц указывать title и meta description.
- Использовать Open Graph (og:title, og:description, og:url, og:image) и twitter-карты.
- Canonical-ссылка должна указывать на текущий домен окружения (prod/dev).
- Служебные/внутренние страницы оформлять с запретом индексации через robots.txt (предпочтительно) либо meta robots noindex.

## SSR и индексация
- Карточка инструмента /quotes/[type]/[secid] — SSR (getServerSideProps), индексируется.
- Списки /quotes/[type] — SSG; доступны из sitemap.
- В списках котировок используются обычные href‑ссылки на страницы бумаг — это упрощает краулинг (не только JS‑навигация).

## Аналитика
- Инициализация TagManager только в production.
- В dev окружении аналитика отключена.

## Практики обновления
- Изменения в правилах индексации фиксировать в этом файле.
- После правок SEO-конфигов запускать сборку и проверять:
  - robots.txt на домене
  - sitemap.xml доступность и ссылки
  - заголовки/метатеги в HTML
  - валидность AMP через Google AMP Test.

## История результатов
- 2026-02-11
  - Источник: Яндекс RU (Россия), Google RU (Россия)
  - Ключевые фразы и позиции (Яндекс):
    - profit case — 25 (+10), Google: 1, Популярность: 28
    - калькулятор сложного процента с пополнением — 29 (+64), Google: —
    - профит кейс — 30 (+5), Google: out
    - сложный процент онлайн — 39 (new)
    - инвестиционный калькулятор сложного процента — 70 (+2)
    - калькулятор сложного процента — 83 (new)
    - инвестиционный калькулятор — 100 (new)
    - аннуитетный платеж формула — —
    - визуализация инвестиций — —
    - график платежей по кредиту — —
    - инструменты для инвестора — —
  - Данные: [data/seo/2026-02-11.json](file:///Users/sergey/invest/data/seo/2026-02-11.json) (приватно, вне public)
  - Скриншот: поместить файл в data/seo/seo-2026-02-11.png (приватно, вне public)
