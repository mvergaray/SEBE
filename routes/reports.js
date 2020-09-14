const express = require('express');
const router = express.Router();
const reportsCtrl = require('../controllers/reports');

router.post('/tickets', reportsCtrl.tickets);
router.post('/excel', reportsCtrl.generateExcel);
router.post('/full-excel', reportsCtrl.generateExcelByParams);
router.get('/render-template', reportsCtrl.renderTemplate);
router.get('/delivery-confirmation-template', reportsCtrl.renderDeliveryConfirmationTemplate);
router.post('/print/:id', reportsCtrl.print);
router.get('/print-template/:id', reportsCtrl.printTemplate);
router.post('/binnacle/:id', reportsCtrl.getBinnacle);
router.post('/binnacle-excel/:id', reportsCtrl.getBinnacleExcel);
router.get('/binnacle-assignment/:id', reportsCtrl.getAssignments);
router.get('/binnacle-closure/:id', reportsCtrl.getClosures);

module.exports = router;
