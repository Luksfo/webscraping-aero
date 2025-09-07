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

    // Converter as datas para o formato YYYY-MM-DD
    const [checkinDay, checkinMonth, checkinYear] = checkinDate.split('/');
    const formattedCheckinDate = `${checkinYear}-${checkinMonth}-${checkinDay}`;
    
    const [checkoutDay, checkoutMonth, checkoutYear] = checkoutDate.split('/');
    const formattedCheckoutDate = `${checkoutYear}-${checkoutMonth}-${checkoutDay}`;

    try {
        const result = await scrapeHotels({
            destination,
            checkin: formattedCheckinDate,
            checkout: formattedCheckoutDate
        });

        // Retornar os resultados
        return res.json({
            client,
            number,
            textMessage,
            results: result.result,
        });
    } catch (error) {
        console.error('Erro durante a execução do endpoint:', error);
        return res.status(500).json({ error: 'Erro durante o scraping. Tente novamente mais tarde.' });
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
