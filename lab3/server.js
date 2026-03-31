const express = require('express');
const axios = require('axios');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(express.json());
app.use(cors());

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

const CLIENT_ID = '019b245b-cdb1-79ee-9b57-5f398e0fa3b6';
const SCOPE = 'GIGACHAT_API_PERS';
const AUTH_KEY = 'MDE5YjI0NWItY2RiMS03OWVlLTliNTctNWYzOThlMGZhM2I2OjM4MjRjZDJiLWEwOTMtNDRkOC1hNDE1LWM1ODI0ZWZiZTk3NA==';

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const API_URL = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';

let accessToken = null;
let tokenExpiryTime = 0;

const getAccessToken = async () => {
    if (accessToken && Date.now() < tokenExpiryTime) {
        return accessToken;
    }

    try {
        const response = await axios.post(
            OAUTH_URL,
            `scope=${encodeURIComponent(SCOPE)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'RqUID': require('crypto').randomUUID(),
                    'Authorization': `Basic ${AUTH_KEY}`,
                },
                httpsAgent,
            }
        );

        accessToken = response.data.access_token;
        tokenExpiryTime = Date.now() + 30 * 60 * 1000;

        return accessToken;
    } catch (error) {
        console.error('Ошибка получения токена:', error.response?.data || error.message);
        throw new Error('Не удалось получить токен доступа');
    }
};

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model = 'GigaChat', ...rest } = req.body;

        if (!messages) {
            return res.status(400).json({ error: 'Messages are required' });
        }

        const token = await getAccessToken();

        const response = await axios.post(
            API_URL,
            {
                model,
                messages,
                n: 1,
                stream: false,
                max_tokens: 500,
                repetition_penalty: 1,
                update_interval: 0,
                ...rest,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                httpsAgent,
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Ошибка вызова GigaChat API:', error.response?.data || error.message);
        res.status(500).json({ error: 'Ошибка вызова GigaChat API' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});