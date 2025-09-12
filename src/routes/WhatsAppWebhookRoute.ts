import express from "express";
import { WhatsAppWebhookController } from "../controllers/WhatsAppWebhookController.ts"

const router = express.Router();

router.get('/', WhatsAppWebhookController.getWebHook);
router.post('/', WhatsAppWebhookController.postWebHook);

export default router;
