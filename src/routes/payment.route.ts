import express from 'express';
import { sendPaymentEmail } from '../controllers/payment.controller';
const router = express.Router();

router.post('/payment', sendPaymentEmail);

export default router;
