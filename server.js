const express = require('express');
const { fork } = require('child_process');

const app = express();
app.use(express.json());

app.post('/search-hotels', async (req, res) => {
    const { client, number, textMessage, destination, checkinDate, checkoutDate } = req.body;

    if (!client || !number || !textMessage || !destination || !checkinDate || !checkoutDate) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    // Iniciar o script de scraping em um processo separado
    const scraperProcess = fork('scraping-final.js');

    // Enviar dados para o processo filho
    scraperProcess.send({ destination, checkinDate, checkoutDate });

    // Escutar a resposta do processo filho
    scraperProcess.on('message', (message) => {
        if (message.error) {
            console.error('Erro no processo de scraping:', message.error);
            return res.status(500).json({ error: message.error });
        }

        // Retornar os resultados
        return res.json({
            client,
            number,
            textMessage,
            hotels: message.hotels,
        });
    });

    // Escutar por erros no processo filho
    scraperProcess.on('error', (err) => {
        console.error('Erro ao iniciar o processo de scraping:', err);
        res.status(500).json({ error: 'Erro interno ao iniciar o scraping.' });
    });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
