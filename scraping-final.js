const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeHotels = async ({ destination, checkinDate, checkoutDate }) => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    console.log('Acessando o Booking.com...');
    await page.goto('https://www.booking.com/', { waitUntil: 'domcontentloaded' });
    await delay(3000); // Aguarda para garantir que a página carregou

    // Espera pelo seletor do campo de destino, com um timeout maior
    console.log('Preenchendo destino...');
    const destinationSelector = '#ss';
    await page.waitForSelector(destinationSelector, { timeout: 30000 }); // Aumentado para 30s
    await page.type(destinationSelector, destination);
    await delay(1000);

    // Clica no primeiro resultado sugerido
    const firstResultSelector = 'ul[role="listbox"] li:first-child';
    await page.waitForSelector(firstResultSelector, { timeout: 10000 });
    await page.click(firstResultSelector);
    await delay(1000);

    // Clica no botão de busca
    const searchButtonSelector = 'button[type="submit"]';
    await page.waitForSelector(searchButtonSelector, { timeout: 10000 });
    await page.click(searchButtonSelector);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('Extraindo dados dos hotéis...');
    // Seletor para extrair os resultados
    const hotelResultsSelector = 'div[data-testid="property-card"]';
    await page.waitForSelector(hotelResultsSelector, { timeout: 30000 });

    const hotels = await page.evaluate((selector) => {
      const hotelElements = Array.from(document.querySelectorAll(selector));
      return hotelElements.slice(0, 5).map(el => { // Extrai os 5 primeiros hotéis
        const name = el.querySelector('[data-testid="title"]')?.textContent.trim() || 'N/A';
        const price = el.querySelector('[data-testid="price-and-discounted-price"]')?.textContent.trim() || 'N/A';
        const link = el.querySelector('a')?.href || 'N/A';
        return { name, price, link };
      });
    }, hotelResultsSelector);

    console.log('Scraping concluído. Fechando o navegador...');
    return { hotels };

  } catch (error) {
    console.error('Erro durante o scraping:', error);
    return { error: 'Erro durante o scraping. Verifique os logs.' };
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeHotels };
