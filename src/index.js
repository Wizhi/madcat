import puppeteer from "puppeteer";
import signIn from "./signIn";
import downloadReleases from "./downloadReleases";

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
