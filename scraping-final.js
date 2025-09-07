const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeFlights = async ({ origin, destination }) => {
    const browser = await puppeteer.launch({
        headless: true, // Mude para 'false' para ver o navegador
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    try {
        console.log('Acessando o site do Google Voos...');
        await page.goto('https://www.google.com/flights/flights', { waitUntil: 'networkidle2' });
        await delay(5000);

        // Preenche o campo de origem
        console.log('Preenchendo campo de origem...');
        const originSelector = 'input[placeholder="De onde?"]';
        await page.waitForSelector(originSelector, { timeout: 15000 });
        const originInput = await page.$(originSelector);
        
        // Clica no campo de origem usando o mouse
        const originBox = await originInput.boundingBox();
        await page.mouse.click(originBox.x + originBox.width / 2, originBox.y + originBox.height / 2);
        
        await delay(1000);
        await page.keyboard.type(origin, { delay: 200 });
        await delay(2000);
        
        // Espera e seleciona a primeira sugestão
        const suggestionSelector = '.yL6c3b';
        await page.waitForSelector(suggestionSelector, { timeout: 10000 });
        await page.keyboard.press('Enter');
        await delay(2000);

        // Preenche o campo de destino
        console.log('Preenchendo campo de destino...');
        const destinationSelector = 'input[placeholder="Para onde?"]';
        await page.waitForSelector(destinationSelector, { timeout: 15000 });
        const destinationInput = await page.$(destinationSelector);
        
        // Clica no campo de destino usando o mouse
        const destinationBox = await destinationInput.boundingBox();
        await page.mouse.click(destinationBox.x + destinationBox.width / 2, destinationBox.y + destinationBox.height / 2);
        
        await delay(1000);
        await page.keyboard.type(destination, { delay: 200 });
        await delay(2000);

        // Espera e seleciona a primeira sugestão
        await page.waitForSelector(suggestionSelector, { timeout: 10000 });
        await page.keyboard.press('Enter');
        await delay(2000);
        
        // Clica no botão de busca
        console.log('Clicando no botão de busca...');
        const searchButtonSelector = 'button[aria-label="Explore"]';
        await page.waitForSelector(searchButtonSelector, { timeout: 10000 });
        await page.click(searchButtonSelector);
        await delay(8000);

        // Extrai os resultados dos voos
        console.log('Extraindo informações dos voos...');
        const flightResultsSelector = '.yQM0j.yO4x3e';
        await page.waitForSelector(flightResultsSelector, { timeout: 20000 });

        const flights = await page.$$eval(flightResultsSelector, elements => {
            return elements.map(el => {
                const priceElement = el.querySelector('.FpGSWb.c1b12d');
                const price = priceElement ? priceElement.textContent.trim() : 'N/A';
                
                const airlineElement = el.querySelector('.sSHqwe.Wc3d5e');
                const airline = airlineElement ? airlineElement.textContent.trim() : 'N/A';
                
                const linkElement = el.closest('a');
                const link = linkElement ? linkElement.href : 'N/A';

                return { price, airline, link };
            });
        });

        if (flights.length > 0) {
            console.log('Voos extraídos com sucesso.');
            return { result: flights };
        } else {
            console.error('Nenhum voo encontrado.');
            return { result: 'Nenhum voo encontrado.' };
        }
    } catch (error) {
        console.error('Erro durante o scraping:', error);
        throw error;
    } finally {
        console.log('Fechando o navegador...');
        await browser.close();
    }
};

module.exports = { scrapeFlights };
