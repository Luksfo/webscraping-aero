const express = require('express');
const axios = require('axios');

const { JSDOM } = require('jsdom');

const app = express();
app.use(express.json());

// Substitua SUA_CHAVE_API pela sua chave do ScrapingBee
const API_KEY = 'SUA_CHAVE_API';

// Função para fazer a requisição à API do ScrapingBee
const getPageHtml = async (url) => {
  const proxyUrl = `https://app.scrapingbee.com/api/v1/?api_key=${API_KEY}&url=${encodeURIComponent(url)}`;
  try {
    const response = await axios.get(proxyUrl);
    return response.data; // Retorna o conteúdo HTML da página
  } catch (error) {
    console.error('Erro ao acessar a API do ScrapingBee:', error);
    return null;
  }
};

// Adapte o endpoint para usar a nova função de scraping
app.post('/search-hotels', async (req, res) => {
  const { destination } = req.body;
  const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`;

  console.log(`Buscando hotéis para: ${destination}`);
  const html = await getPageHtml(url);

  if (!html) {
    return res.status(500).json({ error: 'Erro ao obter os dados do site.' });
  }

  // Agora que temos o HTML, você pode extrair os dados.
  // Vamos usar o JSDOM para simular um navegador e encontrar os elementos.
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

  // Retornar os resultados dos hotéis
  return res.json({
    hotels: hotels
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
