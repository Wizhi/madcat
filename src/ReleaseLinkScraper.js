import { Browser, Page } from "puppeteer";

export default class ReleaseLinkScraper {
    /**
     * @type {Page}
     */
    _page = null;

    /**
     * Creates a new ReleaseLinkScraper
     * 
     * @param {Browser} browser 
     */
    constructor(browser) {
        _page = await browser.newPage();

        await _page.goto('https://www.monstercat.com/music');
    }

    _scrapePage() {
        await Promise.all([
            this._page.goto('https://www.monstercat.com/music'),
            this._page.waitForNavigation({ waitUntil: 'networkidle0' }),
            this._page.waitForSelector('section[role="content"] ul.art-list')
        ]);

        return this._page.evaluate(() =>
            [
                ...document.querySelectorAll(
                    'section[role="content"] ul.art-list li:not(.in-early-access) a'
                )
            ].map(element => element.href)
        );
    }
}
