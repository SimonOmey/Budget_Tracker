import express from "express";
import { SpreadsheetController } from "../controllers/SpreadSheetController.ts";

const router = express.Router();

router.post('/addIncome', SpreadsheetController.addIncome)
router.post('/addExpense', SpreadsheetController.addExpense)
router.post('/test', SpreadsheetController.test)



export default router;
