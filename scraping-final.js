const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeFlights = async ({ origin, destination, date }) => {
    const browser = await puppeteer.launch({
        headless: true, // Mantenha como 'true' em produção
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
        console.log('Acessando o site do Google Voos...');
        await page.goto('https://www.google.com/flights/flights', { waitUntil: 'networkidle2' });
        await delay(8000); // Aumento no tempo de espera inicial

        // Preenche o campo de origem usando um seletor mais genérico
        console.log('Preenchendo campo de origem...');
        const originInputSelector = 'input[type="text"]';
        const inputs = await page.$$(originInputSelector);

        if (inputs.length < 2) {
            console.error('Não foram encontrados campos de origem e destino.');
            throw new Error('Campos de voo não encontrados.');
        }

        await inputs[0].focus();
        await page.keyboard.type(origin, { delay: 100 });
        await delay(2000);
        await page.keyboard.press('Enter');
        await delay(2000);

        // Preenche o campo de destino
        console.log('Preenchendo campo de destino...');
        await inputs[1].focus();
        await page.keyboard.type(destination, { delay: 100 });
        await delay(2000);
        await page.keyboard.press('Enter');
        await delay(2000);
        
        // Clica no campo de datas para abrir o calendário
        console.log('Selecionando a data de partida...');
        const departureDateSelector = 'div[jsname="d5c5i"]';
        await page.waitForSelector(departureDateSelector, { timeout: 10000 });
        await page.click(departureDateSelector);
        await delay(2000);
        
        // Seleciona a data de partida (usando o seletor com base no texto)
        const daySelector = `div[aria-label*="${date}"]`;
        await page.waitForSelector(daySelector, { timeout: 10000 });
        await page.click(daySelector);
        await delay(2000);
        
        // Clica no botão "Concluído"
        const doneButtonSelector = 'button[aria-label="Concluído"]';
        await page.waitForSelector(doneButtonSelector, { timeout: 10000 });
        await page.click(doneButtonSelector);
        await delay(5000);

        // Clica no botão de busca "Explore"
        console.log('Clicando no botão de busca...');
        const exploreButtonSelector = 'button[aria-label="Explore"]';
        await page.waitForSelector(exploreButtonSelector, { timeout: 10000 });
        await page.click(exploreButtonSelector);
        await delay(8000);

        // Extrai os dados do voo principal
        console.log('Extraindo a melhor opção de voo...');
        const bestOptionSelector = '.sF6w6d.E3c52e.yO4x3e';
        await page.waitForSelector(bestOptionSelector, { timeout: 20000 });

        const bestFlight = await page.$eval(bestOptionSelector, el => {
            const priceElement = el.querySelector('div[jsslot] span[aria-label]');
            const price = priceElement ? priceElement.textContent.trim() : 'N/A';
            
            const airlineElement = el.querySelector('div[jsname="j1fBcd"]');
            const airline = airlineElement ? airlineElement.textContent.trim() : 'N/A';
            
            const linkElement = el.closest('a');
            const link = linkElement ? linkElement.href : 'N/A';

            return { price, airline, link };
        });

        console.log('Melhor opção de voo extraída com sucesso.');
        return { result: [bestFlight] };

    } catch (error) {
        console.error('Erro durante o scraping:', error);
        throw error;
    } finally {
        console.log('Fechando o navegador...');
        await browser.close();
    }
};

module.exports = { scrapeFlights };
