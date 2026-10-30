const express = require('express');
const router = express.Router();
const reportSummaryController = require('../API/reportSummaryController');

router.get('/admin-dashboard', reportSummaryController.getAdminDashboard);
router.get('/month-wise-report', reportSummaryController.getMonthWiseReport);

module.exports = router;
