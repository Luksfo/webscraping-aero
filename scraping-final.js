const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeFlights = async ({ origin, destination, departureDate }) => {
  const browser = await puppeteer.launch({
    headless: true, // Mantenha como 'true' para execução em segundo plano
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    console.log('Acessando o site...pika');
    await page.goto('https://www.skyscanner.com.br', { waitUntil: 'networkidle2' });

    console.log('Simulando comportamento humano...');
    await page.mouse.move(100, 100);
    await delay(6000);

    // O Captcha é mais complexo e pode não ter um seletor estático.
    // Removi a parte do captcha para simplificar, mas você pode adicionar
    // uma lógica para lidar com ele caso apareça.

    console.log('Preenchendo campo de origem...');
    await page.waitForSelector('input[id*="origin-input"]');
    await page.click('input[id*="origin-input"]');
    for (const char of origin) await page.keyboard.type(char, { delay: 200 });
    await delay(1500);
    await page.keyboard.press('Enter');
    await delay(2000);

    console.log('Preenchendo campo de destino...');
    await page.waitForSelector('input[id*="destination-input"]');
    await page.click('input[id*="destination-input"]');
    for (const char of destination) await page.keyboard.type(char, { delay: 200 });
    await delay(1500);
    await page.keyboard.press('Enter');
    await delay(2000);

    console.log('Selecionando data...');
    const [year, month, day] = departureDate.split('-');
    await page.waitForSelector('button[id*="date-input"]');
    await page.click('button[id*="date-input"]');
    await delay(1000);

    await page.click(`div[data-test-id="month-${year}-${month.padStart(2, '0')}"]`);
    await delay(1000);

    const daySelector = `button[data-testid="calendar-day-${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}"]`;
    await page.waitForSelector(daySelector);
    await page.click(daySelector);
    await delay(2000);

    console.log('Clicando no botão "Buscar"...');
    await page.waitForSelector('button[data-testid="search-button"]');
    await page.click('button[data-testid="search-button"]');
    await delay(5000);

    // Tratamento de alertas de "nenhum voo encontrado"
    const alertSelector = '.BpkPanel_bpk-panel__ZTVlY';
    const alertExists = await page.$(alertSelector);
    if (alertExists) {
        const alertMessage = await page.evaluate((alert) => alert.textContent.trim(), alertExists);
        if (alertMessage.includes("Não encontramos voos para a rota")) {
            console.log(`Alerta encontrado: ${alertMessage}`);
            return { result: alertMessage };
        }
    }

    console.log('Tentando clicar no botão "Econômica"...');
    const economySelector = '//span[text()="Econômica"]';
    await page.waitForXPath(economySelector, { timeout: 15000 });
    const [economyButton] = await page.$x(economySelector);
    if (economyButton) {
        await economyButton.click();
        console.log('Botão "Econômica" clicado.');
        await delay(2000);
    } else {
        console.log('Botão "Econômica" não encontrado.');
        return { result: 'Nenhum voo encontrado na classe Econômica.' };
    }

    // A lógica para extrair links de booking mudou e agora requer a busca por preços e links
    console.log('Extraindo informações dos voos...');
    await page.waitForSelector('div[data-testid="trip-card-trip"]', { timeout: 20000 });
    
    const flights = await page.$$eval('div[data-testid="trip-card-trip"]', (elements) => {
        return elements.map(el => {
            const price = el.querySelector('span[data-testid="price-display-price-display"]').textContent.trim();
            const carrier = el.querySelector('div.BpkText_bpk-text__NjI4Z.BpkText_bpk-text--body-default__NTcyM.BpkText_bpk-text--weight-bold__OWMyN').textContent.trim();
            const link = el.querySelector('a[data-testid*="trip-card-link"]').href;
            return { price, carrier, link };
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


