import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import fs from "fs/promises";
import { Transaction } from "../models/transaction.ts";
import { httpResponse } from "../lib/httpResponse.ts";
import { Request, Response } from "express";

export const SpreadsheetController = {
  initializeSheets: async () => {
    dotenv.config();

    const credentials = await fs.readFile(
      "src/config/credentials.json",
      "utf-8"
    );
    const credentials_parsed = JSON.parse(credentials);

    const auth = new GoogleAuth({
      credentials: credentials_parsed,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const authClient = await auth.getClient();

    return google.sheets({ version: "v4", auth: authClient as OAuth2Client });
  },

  addIncome: async (transaction: Transaction) => {
    const sheets = await SpreadsheetController.initializeSheets();

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Inkomsten!A:E",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            transaction.wat,
            transaction.categorie,
            transaction.bedrag,
            transaction.datum,
            transaction.beschrijving,
          ],
        ],
      },
    });

    return response.data;
  },

  addExpense: async (transaction: Transaction) => {
    const sheets = await SpreadsheetController.initializeSheets();

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Uitgaven!A:E",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            transaction.wat,
            transaction.categorie,
            transaction.bedrag,
            transaction.datum,
            transaction.beschrijving,
          ],
        ],
      },
    });

    return response.data;
  },

  test: async (req: Request, res: Response) => {
    try {
      const result = await SpreadsheetController.addIncome({
        wat: "Loon",
        categorie: "Werk",
        bedrag: 120,
        datum: new Date(),
        beschrijving: "VancoVienno",
      });
      console.log("Inkomst toegevoegd", result.updates?.updatedRange);
      return httpResponse(
        200,
        "Inkomst toegevoegd",
        result.updates?.updatedRange,
        res
      );
    } catch (err) {
      console.error("Fout bij toevoegen inkomst:", err);
    }
  },
  getSheetData: async (range: string) => {
    const sheets = await SpreadsheetController.initializeSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range,
    });
    return response.data.values || [];
  },
};
