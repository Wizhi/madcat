import puppeteer from 'puppeteer';

/**
 * Iterate release page links, scraping on demand
 *
 * @param {ReleaseLinkScraper} scraper The scraper to use
 * @param {Object} [options]
 * @param {number} [options.start=1] The initial page to start scraping
 * @param {number} [options.limit=1] A limit to
 * @param {number} [options.bufferSize=10]
 * @returns {function(): Promise.<string[]>}
 */
export async function* getReleasePageLinks(
    scraper,
    { start = 1, limit = 1, bufferSize = 10 } = {},
) {
    const lastPage = start + limit;
    let page = start;
    /**
     * @type {string[]}
     */
    const buffer = [];
    /**
     * @type {Promise.<string[]>}
     */
    let currentScrape = null;

    // Initial scrape
    buffer.push(...(await scraper.scrape(page++)));

    while (buffer.length > 0) {
        yield buffer.shift();

        if (
            currentScrape === null &&
            page < lastPage &&
            buffer.length < bufferSize
        ) {
            // Scraping happens in the background
            currentScrape = scraper.scrape(page++).then(links => {
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

export default class ReleaseLinkScraper {
    /**
     *
     * @param {puppeteer.Browser} browser
     */
    static async create(browser) {
        const page = await browser.newPage();

        return new ReleaseLinkScraper(page);
    }

    constructor(page) {
        this._page = page;
    }

    /**
     * Scrapes all links from a specified page in the catalogue
     *
     * @param {number} page A non-negative number bigger than 0
     * @returns {string[]}
     */
    async scrape(page = 1) {
        await Promise.all([
            this._page.goto(`https://www.monstercat.com/music?Page=${page}`),
            this._page.waitForNavigation({ waitUntil: 'networkidle0' }),
            this._page.waitForSelector('section[role="content"] ul.art-list'),
        ]);

        return this._page.evaluate(() =>
            [
                ...document.querySelectorAll(
                    'section[role="content"] ul.art-list li:not(.in-early-access) a',
                ),
            ].map(element => element.href),
        );
    }
}
