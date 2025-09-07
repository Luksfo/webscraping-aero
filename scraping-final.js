const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const scrapeFlights = async ({ origin, destination }) => {
    const browser = await puppeteer.launch({
        headless: true, // Mude para 'false' para ver o navegador
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    try {
        // Constrói a URL de busca diretamente
        const searchUrl = `https://www.google.com/flights/flights?q=voos de ${origin} para ${destination}`;
        
        console.log(`Acessando a URL de busca: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

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
