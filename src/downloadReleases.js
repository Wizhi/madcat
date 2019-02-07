import puppeteer from "puppeteer";
import { URL } from "url";
import qs from "qs";
import waitForDownloadToComplete from "./waitForDownloadToComplete";

// Currently hardcoded
const downloadsDirPath = "/tmp/puppeteer/downloads";

/**
 * Signs into the site
 *
 * @param {puppeteer.Browser} browser
 */
export default async function downloadReleases(browser) {
    console.log("Beginning download process");

    const page = await browser.newPage();

    await Promise.all([
        page.goto("https://www.monstercat.com/music"),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.waitForSelector('section[role="content"] ul.art-list')
    ]);

    const links = await page.evaluate(() =>
        [
            ...document.querySelectorAll(
                'section[role="content"] ul.art-list li:not(.in-early-access) a'
            )
        ].map(element => element.href)
    );

    await Promise.all([
        page.goto(links[0]),
        page.waitForSelector("a.button.button--mcatgold")
    ]);

    const downloadUrl = await page.evaluate(
        element => element.href,
        await page.$("a.button.button--mcatgold")
    );

    await page._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: '/tmp/puppeteer/downloads/'
    });

    const awsUrlExpression = /https:\/\/s3\.amazonaws\.com\/data\.monstercat\.com\/blobs/;

    page.on("response", async response => {
        const url = response.url();

        if (!awsUrlExpression.test(url)) {
            return;
        }

        console.log("Found AWS response");
        
        const fileName = qs
            .parse(new URL(url).search)["response-content-disposition"]
            .match(/filename="(.+)"/)[1];

        console.log(`Filename: ${fileName}`);

        await waitForDownloadToComplete(`${downloadsDirPath}/${fileName}`);
    });

    try {
        await page.goto(downloadUrl);
    } catch (e) {
        console.log("Puppeteer always throws this error ¯\\_(ツ)_/¯ - see https://github.com/GoogleChrome/puppeteer/issues/2794");
    }
}
