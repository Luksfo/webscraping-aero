const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const scrapeFlights = async ({ origin, destination }) => {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    try {
        const searchUrl = `https://www.google.com/flights/flights?q=voos de ${origin} para ${destination}`;
        
        console.log(`Acessando a URL de busca: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        console.log('Extraindo informações dos voos...');
        const resultsContainerSelector = 'ul[role="listbox"]';
        await page.waitForSelector(resultsContainerSelector, { timeout: 30000 });

        const flights = await page.$$eval(`${resultsContainerSelector} > li`, elements => {
            return elements.map(el => {
                // Novo seletor definitivo para o preço
                const priceElement = el.querySelector('div[aria-hidden="true"][jsslot] span[aria-label]');
                const price = priceElement ? priceElement.textContent.trim() : 'N/A';
                
                // Novo seletor para a companhia aérea
                const airlineElement = el.querySelector('div.sSHqwe.tPgKwe.ogfYpf');
                const airline = airlineElement ? airlineElement.textContent.trim() : 'N/A';
                
                // O seletor do link continua funcionando bem
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
