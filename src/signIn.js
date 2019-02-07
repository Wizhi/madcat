import puppeteer from 'puppeteer';

/**
 * Signs into the site
 *
 * @param {puppeteer.Browser} browser
 */
export default async function signIn(browser) {
    console.log('Signing in..');

    const page = await browser.newPage();

    await Promise.all([
        page.goto('https://www.monstercat.com/signin'),
        page.waitForSelector('input[name="email"]'),
    ]);

    const [
        emailInputHandle,
        passwordInputHandle,
        signInButtonHandle,
    ] = await Promise.all([
        page.$('input[name="email"]'),
        page.$('input[name="password"]'),
        page.$('body > section > div > div > form > div > button'),
    ]);

    await emailInputHandle.type('simonbodall@gmail.com'),
        await passwordInputHandle.type('hkm28xdq');

    await Promise.all([
        signInButtonHandle.click(),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    await page.close();

    console.log('Signed in successfully');
}
