import puppeteer from 'puppeteer';
import signIn from './signIn';
import getReleaseLinks from './getReleaseLinks';
import downloadRelease from './downloadRelease';

(async () => {
    const browser = await puppeteer.launch({
        // https://github.com/Googlechrome/puppeteer/issues/290
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    });

    await signIn(browser);

    const releaseLinks = await getReleaseLinks(browser);

    await downloadRelease(browser, releaseLinks[0]);

    // await browser.close();
})();
