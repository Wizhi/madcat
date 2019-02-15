import puppeteer from 'puppeteer';
import signIn from './signIn.mjs';
import downloadRelease from './downloadRelease.mjs';
import ReleaseLinkScraper from './ReleaseLinkScraper.mjs';

(async () => {
    const browser = await puppeteer.launch({
        // https://github.com/Googlechrome/puppeteer/issues/290
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: false,
    });

    await signIn(browser);

    const scraper = await ReleaseLinkScraper.create(browser);
    const releaseLinks = await scraper._scrape();

    await downloadRelease(browser, releaseLinks[0]);

    // await browser.close();
})();
