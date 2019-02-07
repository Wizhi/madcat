import puppeteer from "puppeteer";

/**
 * Signs into the site
 *
 * @param {puppeteer.Browser} browser
 */
export default async function getReleaseLinks(browser) {
    console.log("Getting release links");

    const page = await browser.newPage();

    await Promise.all([
        page.goto("https://www.monstercat.com/music"),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.waitForSelector('section[role="content"] ul.art-list')
    ]);

    return page.evaluate(() =>
        [
            ...document.querySelectorAll(
                'section[role="content"] ul.art-list li:not(.in-early-access) a'
            )
        ].map(element => element.href)
    );
}
