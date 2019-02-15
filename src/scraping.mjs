import puppeteer from 'puppeteer';

/**
 * Iterate release page links, scraping on demand
 *
 * @param {puppeteer.Page} page The page in which the scraping will take place
 * @param {Object} [options]
 * @param {number} [options.start=1] The initial page index to start scraping
 * @param {number} [options.limit=1] A limit to
 * @param {number} [options.bufferSize=10]
 * @returns {function(): Promise.<string[]>}
 */
export async function* getReleasePageLinks(
    page,
    { start = 1, limit = 1, bufferSize = 10 } = {},
) {
    const lastPage = start + limit;
    let index = start;
    /**
     * @type {string[]}
     */
    const buffer = [];
    /**
     * @type {Promise.<string[]>}
     */
    let currentScrape = null;

    // Initial scrape
    buffer.push(...(await scrape(page, index++)));

    while (buffer.length > 0) {
        yield buffer.shift();

        if (
            currentScrape === null &&
            index < lastPage &&
            buffer.length < bufferSize
        ) {
            // Scraping happens in the background
            currentScrape = scrape(page, index++).then(links => {
                buffer.push(...links);
                currentScrape = null;
            });
        }

        if (currentScrape !== null && buffer.length === 0) {
            // Wait for the scraper to finish so things run smoothly
            await currentScrape;
        }
    }
}

/**
 * Scrapes all links from a specified page in the catalogue
 *
 * @param {puppeteer.Page} page The page in which the scraping will take place
 * @param {number} index The page index to scrape
 * @returns {Promise.<string[]>}
 */
export async function scrape(page, index) {
    await Promise.all([
        page.goto(`https://www.monstercat.com/music?Page=${index}`),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.waitForSelector('section[role="content"] ul.art-list'),
    ]);

    return page.evaluate(() =>
        [
            ...document.querySelectorAll(
                'section[role="content"] ul.art-list li:not(.in-early-access) a',
            ),
        ].map(element => element.href),
    );
}
