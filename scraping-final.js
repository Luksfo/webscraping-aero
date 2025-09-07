const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeFlights = async ({ origin, destination }) => {
    const browser = await puppeteer.launch({
        headless: false, // Deixei como 'false' para que você possa ver o clique acontecendo
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    try {
        const searchUrl = `https://www.google.com/flights/flights?q=voos de ${origin} para ${destination}`;
        
        console.log(`Acessando a URL de busca: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        await delay(5000); // Adiciona um delay extra para a página carregar completamente

        console.log('Tentando clicar no primeiro resultado de voo...');
        // Localiza o primeiro item da lista de resultados
        const firstFlightSelector = 'ul[role="listbox"] > li:first-child';
        
        const firstFlightElement = await page.waitForSelector(firstFlightSelector, { timeout: 30000 });

        if (firstFlightElement) {
            console.log('Primeiro resultado encontrado. Clicando nele...');
            await firstFlightElement.click();
            console.log('Clique realizado. Acessando a página de detalhes do voo...');
            
            // Aguarda a navegação para a nova página
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            await delay(5000); // Adiciona um delay para a página de detalhes carregar

            // A partir daqui, você pode adicionar a lógica para extrair os dados da página de detalhes
            // Por enquanto, vamos apenas confirmar que funcionou
            const newUrl = page.url();
            console.log(`A URL atual é: ${newUrl}`);
            
            if (newUrl !== searchUrl) {
                console.log('O script navegou com sucesso para a página de detalhes do voo.');
                return { result: 'Navegação para a página de detalhes do voo bem-sucedida.' };
            } else {
                return { result: 'O clique não resultou em navegação.' };
            }

        } else {
            return { result: 'Nenhum resultado de voo encontrado para clicar.' };
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
