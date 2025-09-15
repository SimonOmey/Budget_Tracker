import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';

import { apiKeyAuth } from './middlewares/apiKeyAuth.ts'; 

const WhatsAppWebhookRouter = await import('./routes/WhatsAppWebhookRoute.ts');
const SpreadsheetRouter = await import('./routes/SpreadsheetRoute.ts')

async function start() {
    dotenv.config({
        path: "./.env",
    });

    const app = express();

    app.use(cors());

    app.use(bodyParser.json());

    app.get('/', (req, res) => {
        res.send('Hello World!')
    });

    app.use('/webhook', WhatsAppWebhookRouter.default);
    app.use('/spreadsheet', apiKeyAuth, SpreadsheetRouter.default);

    app.listen(process.env.PORT, () => {
        console.log('Server is running on port ' + process.env.PORT);
    });

}

start();
