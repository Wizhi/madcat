import puppeteer from 'puppeteer';
import { URL } from 'url';
import qs from 'qs';
import waitForDownloadToComplete from './waitForDownloadToComplete';

// Currently hardcoded
const downloadPath = '/tmp/puppeteer/downloads';
const awsUrlExpression = /https:\/\/s3\.amazonaws\.com\/data\.monstercat\.com\/blobs/;

/**
 * Signs into the site
 *
 * @param {puppeteer.Browser} browser
 */
export default function downloadRelease(browser, link) {
    return new Promise(async (resolve, reject) => {
        console.log('Downloading release');

        const page = await browser.newPage();

        await Promise.all([
            page.goto(link),
            page.waitForSelector('a.button.button--mcatgold'),
        ]);

        const downloadUrl = await page.evaluate(
            element => element.href,
            await page.$('a.button.button--mcatgold'),
        );

        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath,
        });

        page.on('response', async response => {
            const url = response.url();

            if (!awsUrlExpression.test(url)) {
                return;
            }

            console.log('Found AWS response');

            const fileName = qs
                .parse(new URL(url).search)
                ['response-content-disposition'].match(/filename="(.+)"/)[1];

            console.log(`Filename: ${fileName}`);

            await waitForDownloadToComplete(`${downloadPath}/${fileName}`);

            resolve();
        });

        try {
            await page.goto(downloadUrl);
        } catch (e) {
            console.log(
                'Puppeteer always throws this error ¯\\_(ツ)_/¯ - see https://github.com/GoogleChrome/puppeteer/issues/2794',
            );
        }
    });
}
