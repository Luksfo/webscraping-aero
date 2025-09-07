const { JSDOM } = require('jsdom');
const axios = require('axios');
const API_KEY = 'SUA_CHAVE_API';

const getPageHtml = async (url) => {
    const proxyUrl = `https://app.scrapingbee.com/api/v1/?api_key=${API_KEY}&url=${encodeURIComponent(url)}`;
    try {
        const response = await axios.get(proxyUrl);
        return response.data;
    } catch (error) {
        console.error('Erro ao acessar a API do ScrapingBee:', error.message);
        throw new Error('Erro ao obter os dados do site.');
    }
};

const scrapeHotels = async ({ destination, checkinDate, checkoutDate }) => {
    const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`;
    console.log(`Buscando hotéis para: ${destination}`);
    
    const html = await getPageHtml(url);

    if (!html) {
        return null;
    }

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const hotels = [];

    const hotelElements = document.querySelectorAll('div[data-testid="property-card"]');
    hotelElements.forEach(el => {
        const name = el.querySelector('[data-testid="title"]')?.textContent.trim() || 'N/A';
        const price = el.querySelector('[data-testid="price-and-discounted-price"]')?.textContent.trim() || 'N/A';
        const link = el.querySelector('a')?.href || 'N/A';
        hotels.push({ name, price, link });
    });

    return { hotels };
};

// Lógica para ser executada quando o processo for chamado com fork
process.on('message', async (message) => {
    try {
        const result = await scrapeHotels(message);
        process.send({ hotels: result.hotels });
        process.exit(0); // Encerrar o processo filho após a conclusão
    } catch (error) {
        process.send({ error: error.message });
        process.exit(1);
    }
});
