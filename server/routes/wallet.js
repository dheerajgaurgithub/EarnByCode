import express from 'express';
import { authenticate } from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import * as walletController from '../controllers/walletController.js';

const router = express.Router();

// User wallet routes
router.get('/balance', authenticate, walletController.getWalletBalance);
router.get('/transactions', authenticate, walletController.getTransactionHistory);
router.get('/statistics', authenticate, walletController.getWalletStatistics);
router.post('/deposit/initiate', authenticate, walletController.initiateDeposit);
router.post('/deposit/confirm', authenticate, walletController.confirmDeposit);
router.post('/withdraw', authenticate, walletController.requestWithdraw);
router.get('/winnings/total', authenticate, walletController.getTotalWinnings);

// Admin wallet routes
router.get('/admin/wallets', authenticate, admin, walletController.adminGetAllWallets);
router.get('/admin/wallets/:userId/transactions', authenticate, admin, walletController.adminGetWalletTransactions);
router.get('/admin/metrics', authenticate, admin, walletController.adminGetMetrics);
router.get('/admin/transactions', authenticate, admin, walletController.adminGetAllTransactions);
router.post('/admin/withdrawals/:id/complete', authenticate, admin, walletController.adminCompleteWithdrawal);

export default router;
