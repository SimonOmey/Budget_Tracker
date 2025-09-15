import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { OAuth2Client } from "google-auth-library";
import fs from "fs/promises";
import { Transaction } from "../models/transaction.ts";
import { httpResponse } from "../lib/httpResponse.ts";
import { Request, Response } from "express";

export const SpreadSheetController = {
  initializeSheets: async () => {

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
    const sheets = await SpreadSheetController.initializeSheets();

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
    const sheets = await SpreadSheetController.initializeSheets();

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

  getSheetData: async (range: string) => {
    const sheets = await SpreadSheetController.initializeSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range,
    });
    return response.data.values || [];
  },
};
