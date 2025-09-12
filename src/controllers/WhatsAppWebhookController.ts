import { Request, Response } from "express";
import { httpResponse } from "../lib/httpResponse.ts";
import dotenv from "dotenv";
import axios from "axios";
import { Transaction } from "../models/transaction.ts";
import { SpreadsheetController } from "./SpreadSheetController.ts";

dotenv.config();

export const WhatsAppWebhookController = {
  getWebHook: async (req: Request, res: Response) => {
    try {
      const mode = req.query["hub.mode"];
      const challenge = req.query["hub.challenge"];
      const token = req.query["hub.verify_token"];

      if (mode && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    } catch (error) {
      return httpResponse(500, "Forbidden", { error }, res);
    }
  },
  postWebHook: async (req: Request, res: Response) => {
    try {
      const { entry } = req.body;

      if (!entry || entry.length === 0) {
        return res.status(400).send("Invalid Request");
      }

      const changes = entry[0].changes;

      if (!changes || changes.length === 0) {
        return res.status(400).send("Invalid Request");
      }

      const statuses = changes[0].value.statuses
        ? changes[0].value.statuses[0]
        : null;
      const messages = changes[0].value.messages
        ? changes[0].value.messages[0]
        : null;

      if (statuses) {
        // Handle message status
        console.log(`
         MESSAGE STATUS UPDATE:
         ID: ${statuses.id},
         STATUS: ${statuses.status}
        `);
      }

      if (messages) {
        if (messages.type === "text") {
          if (messages.text.body.toLowerCase() === "hello") {
            replyMessage(
              messages.from,
              "Hello, Dit is jouw persoonlijke budget tracker",
              messages.id
            );
            return httpResponse(200, "Hello command processed", null, res);
          }

          if (messages.text.body.toLowerCase() === "daily report") {
            await generateDailyReport(messages.from, messages.id);
            return httpResponse(
              200,
              "Daily report command processed",
              null,
              res
            );
          }

          const parsed = await parseMessage(messages.text.body);

          if (parsed) {
            if (messages.text.body.toLowerCase().startsWith("inkomst")) {
              await SpreadsheetController.addIncome(parsed);
              await replyMessage(
                messages.from,
                "Inkomst toegevoegd ✅",
                messages.id
              );
              return httpResponse(200, "Inkomst toegevoegd", parsed, res);
            } else if (messages.text.body.toLowerCase().startsWith("uitgave")) {
              await SpreadsheetController.addExpense(parsed);
              await replyMessage(
                messages.from,
                "Uitgave toegevoegd ✅",
                messages.id
              );
              return httpResponse(200, "Uitgave toegevoegd", parsed, res);
            }
          } else {
            await replyMessage(
              messages.from,
              "❌ Kon bericht niet begrijpen",
              messages.id
            );
          }
        }
        console.log(JSON.stringify(messages, null, 2));
      }

      res.status(200).send("Webhook processed");
    } catch (error) {
      return httpResponse(500, "Forbidden", { error }, res);
    }
  },
};

async function sendMessage(to: String, body: String) {
  await axios({
    url: "https://graph.facebook.com/v22.0/828819950304123/messages",
    method: "post",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body,
      },
    }),
  });
}

async function replyMessage(to: String, body: String, messageId: Number) {
  await axios({
    url: "https://graph.facebook.com/v22.0/828819950304123/messages",
    method: "post",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body,
      },
      context: {
        message_id: messageId,
      },
    }),
  });
}

async function parseMessage(body: String): Promise<Transaction | null> {
  try {
    const lines = body.split("\n").map((l) => l.trim());
    if (lines.length < 4) return null;

    const soort = lines[0];

    const [bedragRaw, watRaw] = lines[1].split(" - ");
    const bedrag = parseFloat(
      bedragRaw.replace("€", "").replace(",", ".").trim()
    );
    const wat = watRaw.trim();

    const [categorieRaw, datumRaw] = lines[2].split("🗓️");
    const categorie = categorieRaw.trim();
    const datum = new Date(datumRaw.trim());

    const beschrijving = lines[3];

    return {
      wat,
      categorie,
      bedrag,
      datum,
      beschrijving,
    };
  } catch (error) {
    console.error("Fout bij parsen van bericht:", error);
    return null;
  }
}

async function generateDailyReport(to: string, messageId?: Number) {
  const today = new Date();
  const todayStr = today.toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const parseSheetAmount = (amount: string): number => {
    if (!amount) return 0;
    const cleaned = amount.replace(/[^0-9,.-]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.toDateString() === today.toDateString();
  };

  const inkomsten = await SpreadsheetController.getSheetData("Inkomsten!A:E");
  const uitgaven = await SpreadsheetController.getSheetData("Uitgaven!A:E");

  const inkomstenVandaag = inkomsten.filter((r) => isToday(r[3]));
  const uitgavenVandaag = uitgaven.filter((r) => isToday(r[3]));

  const totaalInkomsten = inkomstenVandaag.reduce(
    (sum, r) => sum + parseSheetAmount(r[2]),
    0
  );
  const totaalUitgaven = uitgavenVandaag.reduce(
    (sum, r) => sum + parseSheetAmount(r[2]),
    0
  );
  const saldo = totaalInkomsten - totaalUitgaven;

  let body = `📊 Dagrapport ${todayStr}\n\n`;
  body += `💰 Inkomsten: €${totaalInkomsten.toFixed(2)}\n`;
  body += `💸 Uitgaven: €${totaalUitgaven.toFixed(2)}\n`;
  body += `🧾 Saldo: €${saldo.toFixed(2)}\n\n`;

  if (inkomstenVandaag.length > 0) {
    body += "📈 Inkomsten vandaag:\n";
    inkomstenVandaag.forEach((r) => {
      body += `- ${r[0]} (${r[1]}): €${parseSheetAmount(r[2]).toFixed(2)}\n`;
    });
    body += "\n";
  }

  if (uitgavenVandaag.length > 0) {
    body += "📉 Uitgaven vandaag:\n";
    uitgavenVandaag.forEach((r) => {
      body += `- ${r[0]} (${r[1]}): €${parseSheetAmount(r[2]).toFixed(2)}\n`;
    });
  }

  // Bericht terugsturen via WhatsApp
  await replyMessage(to, body, messageId || 0);
}


function parseSheetAmount(amount: string): number {
  const cleaned = amount.replace(/[^0-9,.-]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

