import express from "express";
import { SpreadSheetController } from "../controllers/SpreadsheetController.ts";

const router = express.Router();

router.post('/addIncome', SpreadSheetController.addIncome)
router.post('/addExpense', SpreadSheetController.addExpense)

export default router;
