const express = require('express');
const { scrapeHotels } = require('./scraping-final');

const app = express();
app.use(express.json());

// Endpoint para buscar hotéis
app.post('/search-hotels', async (req, res) => {
  const { client, number, textMessage, destination, checkinDate, checkoutDate } = req.body;

  // Validação básica dos dados recebidos
  if (!client || !number || !textMessage || !destination || !checkinDate || !checkoutDate) {
    return res.status(400).json({
      error: 'Os campos client, number, textMessage, destination, checkinDate e checkoutDate são obrigatórios.',
    });
  }
// Corrigido o erro de porta na Railway
  try {
    const result = await scrapeHotels({ destination, checkinDate, checkoutDate });

    // Retornar os resultados dos hotéis
    return res.json({
      client,
      number,
      textMessage,
      hotels: result.hotels,
    });
  } catch (error) {
    console.error('Erro durante a execução do endpoint:', error);
    return res.status(500).json({ error: 'Erro durante o scraping. Tente novamente mais tarde.' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});


