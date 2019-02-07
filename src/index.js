import puppeteer from "puppeteer";
import { URL } from "url";
import qs from "qs";
import fs from "fs";
import path from "path";

const downloadsDirPath = "/tmp/puppeteer/downloads";

(async () => {
    const browser = await puppeteer.launch({
        // https://github.com/Googlechrome/puppeteer/issues/290
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true
    });

    await signIn(browser);
    await downloadReleases(browser);
    // await browser.close();
})();

/**
 * Signs into the site
 *
 * @param {puppeteer.Browser} browser
 */
async function signIn(browser) {
    console.log("Signing in..");

    const page = await browser.newPage();

    await Promise.all([
        page.goto("https://www.monstercat.com/signin"),
        page.waitForSelector('input[name="email"]')
    ]);

    const [
        emailInputHandle,
        passwordInputHandle,
        signInButtonHandle
    ] = await Promise.all([
        page.$('input[name="email"]'),
        page.$('input[name="password"]'),
        page.$("body > section > div > div > form > div > button")
    ]);

    await emailInputHandle.type("simonbodall@gmail.com"),
        await passwordInputHandle.type("hkm28xdq");

    await Promise.all([
        signInButtonHandle.click(),
        page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    await page.close();

    console.log("Signed in successfully");
}

/**
 * Signs into the site
 *
 * @param {puppeteer.Browser} browser
 */
async function downloadReleases(browser) {
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

/**
 * Check if file exists, watching containing directory meanwhile.
 * Resolve if the file exists, or if the file is created before the timeout occurs.
 * 
 * @param {string} fileName 
 * @param {integer} timeout 
 */
function waitForDownloadToComplete(fileName, timeout = 15000) {
    return new Promise(function (resolve, reject) {
        // const timer = setTimeout(function () {
        //     watcher.close();
        //     reject(new Error('Timeout!'));
        // }, timeout);

        // Check if file exists
        // fs.access(filePath, fs.constants.R_OK, function (err) {
        //     if (!err) {
        //         clearTimeout(timer);
        //         watcher.close();
        //         resolve();
        //     }
        // });

        const dir = path.dirname(fileName);
        const basename = path.basename(fileName);
        console.log('starting to watch')
        const watcher = fs.watch(dir, function (eventType, filename) {
            console.log(`${new Date().getTime()} : tick`)
            if (eventType === 'rename' && filename === basename) {
                console.log('done?')
                // clearTimeout(timer);
                watcher.close();
                resolve();
            }
        });
    });
}
