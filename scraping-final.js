const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const scrapeFlights = async ({ origin, destination }) => {
    const browser = await puppeteer.launch({
        headless: true, // Defina como 'false' para ver o navegador em ação
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    try {
        // Constrói a URL de busca diretamente com as informações de origem e destino
        const searchUrl = `https://www.google.com/flights/flights?q=voos de ${origin} para ${destination}`;
        
        console.log(`Acessando a URL de busca: ${searchUrl}`);
        // Navega diretamente para a página de resultados, ignorando o formulário inicial
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        // Espera por um contêiner principal mais estável, que encapsula os resultados
        console.log('Extraindo informações dos voos...');
        const resultsContainerSelector = 'ul[role="listbox"]';
        await page.waitForSelector(resultsContainerSelector, { timeout: 30000 });

        const flights = await page.$$eval(`${resultsContainerSelector} > li`, elements => {
            // Mapeia cada elemento da lista para extrair os dados com os novos seletores
            return elements.map(el => {
                const priceElement = el.querySelector('div[jsslot] span[aria-label]');
                const price = priceElement ? priceElement.textContent.trim() : 'N/A';
                
                const airlineElement = el.querySelector('div[jsname="j1fBcd"]');
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
