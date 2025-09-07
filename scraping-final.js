const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeHotels = async ({ destination, checkin, checkout }) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--disable-extensions',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--single-process'
        ]
    });

    const page = await browser.newPage();

    try {
        console.log('Acessando o Booking.com...');
        await page.goto('https://www.booking.com', { waitUntil: 'networkidle2' });
        await delay(5000);

        // Preenche o campo de destino
        console.log('Preenchendo destino...');
        const destinationInputSelector = '#ss';
        await page.waitForSelector(destinationInputSelector, { timeout: 15000 });
        await page.type(destinationInputSelector, destination, { delay: 100 });
        await delay(2000);
        await page.keyboard.press('Enter');
        await delay(2000);

        // Clica no campo de datas para abrir o calendário
        console.log('Selecionando as datas...');
        const datePickerSelector = 'div.xp__dates-rh__container';
        await page.waitForSelector(datePickerSelector, { timeout: 10000 });
        await page.click(datePickerSelector);
        await delay(2000);

        // Seleciona as datas de check-in e check-out
        const checkinSelector = `td[data-date="${checkin}"]`;
        const checkoutSelector = `td[data-date="${checkout}"]`;
        
        await page.waitForSelector(checkinSelector, { timeout: 10000 });
        await page.click(checkinSelector);
        await delay(1000);

        await page.waitForSelector(checkoutSelector, { timeout: 10000 });
        await page.click(checkoutSelector);
        await delay(2000);

        // Clica no botão de busca
        console.log('Clicando no botão de busca...');
        const searchButtonSelector = 'button.sb-searchbox__button';
        await page.waitForSelector(searchButtonSelector, { timeout: 10000 });
        await page.click(searchButtonSelector);
        await delay(10000);

        // Extrai os dados dos hotéis
        console.log('Extraindo dados dos hotéis...');
        const hotels = await page.evaluate(() => {
            const hotelsList = [];
            const hotelElements = document.querySelectorAll('div[data-testid="property-card"]');

            hotelElements.forEach(el => {
                const nameElement = el.querySelector('div[data-testid="title"]');
                const name = nameElement ? nameElement.textContent.trim() : 'N/A';
                
                const priceElement = el.querySelector('span[data-testid="price-and-discounted-price"]');
                const price = priceElement ? priceElement.textContent.trim() : 'N/A';
                
                const ratingElement = el.querySelector('div[data-testid="review-score"] > div:first-child');
                const rating = ratingElement ? ratingElement.textContent.trim() : 'N/A';
                
                const linkElement = el.querySelector('a.e130985c59');
                const link = linkElement ? linkElement.href : 'N/A';

                hotelsList.push({ name, price, rating, link });
            });
            return hotelsList;
        });

        console.log('Extração de hotéis concluída.');
        return { result: hotels };

    } catch (error) {
        console.error('Erro durante o scraping:', error);
        throw error;
    } finally {
        console.log('Fechando o navegador...');
        await browser.close();
    }
};

module.exports = { scrapeHotels };
