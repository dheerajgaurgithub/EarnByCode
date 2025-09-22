import express from 'express';
import { authenticate } from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import * as walletController from '../controllers/walletController.js';

const router = express.Router();

// User wallet routes
router.get('/balance', authenticate, walletController.getWalletBalance);
router.get('/transactions', authenticate, walletController.getTransactionHistory);
router.get('/statistics', authenticate, walletController.getWalletStatistics);

// Admin wallet routes
router.get('/admin/wallets', authenticate, admin, walletController.adminGetAllWallets);
router.get('/admin/wallets/:userId/transactions', authenticate, admin, walletController.adminGetWalletTransactions);
router.get('/admin/metrics', authenticate, admin, walletController.adminGetMetrics);
router.get('/admin/transactions', authenticate, admin, walletController.adminGetAllTransactions);
router.post('/admin/withdraw', authenticate, admin, walletController.adminWithdraw);

export default router;
