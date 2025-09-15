# Budget Tracker - Node.js, WhatsApp & Google Spreadsheets

Een persoonlijke budget tracker die inkomens en uitgaven automatisch bijhoudt adhv WhatsApp berichten en Google Spreadsheets.
<br/>
Dit project is gebouwd met **Node.js** (volledig in **Typescript** geschreven), het **Meta Developer** platform (voor de WhatsApp integratie) en het **Google Cloud Console** platform (voor het gebruik van Google Spreadsheets).
<br/>
Om de WhatsApp berichten te genereren is er ook gebruik gemaakt van **Apple Shortcuts**.

---

## Demo

Een korte YouTube-demo laat zien hoe berichten van WhatsApp automatisch in de Google Sheet verschijnen, en hoe dagelijkse rapporten worden gegenereerd.

---

## Features

- Ontvang dagelijkse rapporten over je inkomsten en uitgaven via WhatsApp.
- Gegevens worden opgeslaan in Google Sheets.
- Webhook is beveiligd met `WEBHOOK_VERIFY_TOKEN`.
- Spreadsheet routes beveiligd met een simpele API key.

---

## Tech Stack

- Node.js
- Typescript
- Express
- Axios 
- Google API (Sheets)
- dotenv
- Body-parser & CORS

---

## Structuur

```
. 
├── nodemon.json
├── package-lock.json
├── package.json
├── README.md
├── src
│   ├── config
│   │   └── credentials.json
│   ├── controllers
│   │   ├── SpreadsheetController.ts
│   │   └── WhatsAppWebhookController.ts
│   ├── index.ts
│   ├── lib
│   │   └── httpResponse.ts
│   ├── middlewares
│   │   └── apiKeyAuth.ts
│   ├── models
│   │   └── transaction.ts
│   └── routes
│       ├── SpreadsheetRoute.ts
│       └── WhatsAppWebhookRoute.ts
└── tsconfig.json
```
---

## API Routes

### WhatsApp Webhook

`GET /webhook` -> Voor verificatie met Meta. <br/>
`POST /webhook` -> ontvangen van de WhatsApp berichten.

### Spreadsheet (API key vereist)

`POST /spreadsheet/addIncome` -> Voeg inkomens toe. <br/>
`POST /spreadsheet/addExpense` -> Voeg uitgaven toe.

### Header vereist:
x-api-key: `API_KEY` uit .env .

---

## Beveiliging

- WhatsApp webhook checkt `WEBHOOK_VERIFY_TOKEN`.
- Spreadsheet routes vereisen `x-api-key` header.
- Service account credentials voor Google Sheets API.

---

## License
MIT @ Simon Omey